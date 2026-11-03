import { useCallback, useEffect, useRef, useState } from 'react';
import * as api from './api';
import type { GroupInvitation, Notification } from './api';

type Store = {
  /** Dữ liệu luôn gắn với token đã tải nó. Đăng xuất hoặc đổi tài khoản thì bộ
    cũ tự vô hiệu, không cần reset thủ công — tránh cả hai lỗi: rò thông báo của
    người này sang người kia, và setState đồng bộ trong effect. */
  token: string;
  items: Notification[];
  invitations: GroupInvitation[];
  error: string;
};

const EMPTY: Store = { token: '', items: [], invitations: [], error: '' };

/**
 * Một nguồn sự thật duy nhất cho thông báo. Trước đây badge trong rail poll
 * riêng một vòng 12s, còn trang Thông báo tự fetch danh sách riêng — hai chỗ
 * có thể lệch nhau (badge báo 3, mở ra lại thấy 1). Chuông, badge và trang giờ
 * đọc cùng state này.
 */
export function useNotifications(token: string) {
  const [store, setStore] = useState<Store>(EMPTY);
  const [reloadKey, setReloadKey] = useState(0);
  const tokenRef = useRef(token);
  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  const fresh = store.token === token;
  const items = fresh ? store.items : EMPTY.items;
  const invitations = fresh ? store.invitations : EMPTY.invitations;
  const error = fresh ? store.error : '';
  // Suy ra, không set: "đang tải" = chưa có dữ liệu cho token hiện tại. reloading
  // nền thì giữ nguyên danh sách cũ thay vì chớp về skeleton.
  const loading = token !== '' && !fresh;

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  useEffect(() => {
    if (!token) return undefined;
    const controller = new AbortController();
    let active = true;
    void (async () => {
      let list: Notification[] = [];
      let failure = '';
      try {
        list = await api.getNotifications(token, controller.signal);
      } catch (caught) {
        if (!active || controller.signal.aborted) return;
        failure = caught instanceof Error ? caught.message : 'Không tải được thông báo.';
      }
      if (!active) return;
      setStore({ token, items: list, invitations: [], error: failure });

      // Lời mời nạp sau và ghi riêng, để lỗi của nó không xoá danh sách đã có.
      try {
        const invites = (await api.getGroupInvitations(token, controller.signal))
          .filter((invite) => invite.status === 'pending');
        if (active) {
          setStore((current) => (current.token === token ? { ...current, invitations: invites } : current));
        }
      } catch {
        /* backend chưa có endpoint lời mời: ẩn phần này, không báo lỗi */
      }
    })();
    return () => {
      active = false;
      controller.abort();
    };
  }, [token, reloadKey]);

  /**
   * WebSocket báo có thông báo mới. Không suy ra số chưa đọc từ một sự kiện rời
   * rạc — luôn nạp lại từ server, vốn là cách duy nhất để badge và trang khớp.
   */
  useEffect(() => {
    const onNotification = () => reload();
    window.addEventListener('studysync:notification', onNotification);
    return () => window.removeEventListener('studysync:notification', onNotification);
  }, [reload]);

  const unreadCount = items.filter((item) => !item.read_at).length;

  const patchItems = useCallback((patch: (current: Notification[]) => Notification[]) => {
    setStore((current) => ({ ...current, items: patch(current.items) }));
  }, []);

  const markRead = useCallback(async (id: number) => {
    patchItems((current) =>
      current.map((item) => (item.id === id && !item.read_at ? { ...item, read_at: new Date().toISOString() } : item)),
    );
    try {
      await api.markNotificationRead(id, tokenRef.current);
    } catch {
      reload();
    }
  }, [patchItems, reload]);

  const markAllRead = useCallback(async () => {
    const stamp = new Date().toISOString();
    patchItems((current) => current.map((item) => (item.read_at ? item : { ...item, read_at: stamp })));
    try {
      await api.markAllNotificationsRead(tokenRef.current);
    } catch {
      reload();
    }
  }, [patchItems, reload]);

  const answerInvitation = useCallback(async (invitationId: number, action: 'accept' | 'decline') => {
    setStore((current) => ({
      ...current,
      invitations: current.invitations.filter((invite) => invite.id !== invitationId),
    }));
    await api.respondGroupInvitation(invitationId, action, tokenRef.current);
    reload();
  }, [reload]);

  return {
    items,
    invitations,
    unreadCount,
    loading,
    error,
    reload,
    markRead,
    markAllRead,
    answerInvitation,
  };
}

export type Notifications = ReturnType<typeof useNotifications>;
