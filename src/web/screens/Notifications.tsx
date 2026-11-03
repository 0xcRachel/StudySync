import { useEffect, useState } from 'react';
import * as api from '../lib/api';
import type { GroupInvitation, Notification } from '../lib/api';
import { relative } from '../lib/format';
import { useToast } from '../components/Toast';
import { EmptyState, ErrorBar, SkeletonRows } from '../components/ui';

export function Notifications({
  token,
  onUnreadChange,
  onOpenGroup,
  onOpenFriends,
  onGroupsChanged,
}: {
  token: string;
  onUnreadChange: (count: number) => void;
  onOpenGroup: (groupId: number) => void;
  onOpenFriends: () => void;
  onGroupsChanged: () => void;
}) {
  const toast = useToast();
  const [items, setItems] = useState<Notification[]>([]);
  const [invites, setInvites] = useState<GroupInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [markingAll, setMarkingAll] = useState(false);
  const [busyInvite, setBusyInvite] = useState<number | null>(null);

  const unread = items.filter((item) => !item.read_at).length;

  useEffect(() => {
    onUnreadChange(unread);
  }, [unread, onUnreadChange]);

  useEffect(() => {
    const onNotification = (event: Event) => {
      const notification = (event as CustomEvent<Notification>).detail;
      if (!notification) return;
      setItems((current) => [notification, ...current.filter((item) => item.id !== notification.id)].slice(0, 100));
      if (notification.type === 'group_invitation') {
        void api.getGroupInvitations(token)
          .then((list) => setInvites(list.filter((invite) => invite.status === 'pending')))
          .catch(() => { /* lần tải nền tiếp theo sẽ đồng bộ lại lời mời */ });
      }
    };
    window.addEventListener('studysync:notification', onNotification);
    return () => window.removeEventListener('studysync:notification', onNotification);
  }, [token]);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    void (async () => {
      try {
        const list = await api.getNotifications(token, controller.signal);
        if (active) setItems(list);
      } catch (caught) {
        if (!active || controller.signal.aborted) return;
        setError(caught instanceof Error ? caught.message : 'Không tải được thông báo.');
      } finally {
        if (active) setLoading(false);
      }

      if (!active) return;
      try {
        const list = await api.getGroupInvitations(token, controller.signal);
        if (active) setInvites(list.filter((invite) => invite.status === 'pending'));
      } catch {
        /* máy chủ cũ chưa có endpoint lời mời nhóm: ẩn phần này */
      }
    })();

    return () => {
      active = false;
      controller.abort();
    };
  }, [token, reloadKey]);

  const reload = () => {
    setLoading(true);
    setError('');
    setReloadKey((key) => key + 1);
  };

  const markRead = async (item: Notification) => {
    if (item.read_at) return;
    setItems((current) =>
      current.map((entry) =>
        entry.id === item.id ? { ...entry, read_at: new Date().toISOString() } : entry,
      ),
    );
    try {
      await api.markNotificationRead(item.id, token);
    } catch {
      toast('Chưa đánh dấu đọc được thông báo này.', 'bad');
      setReloadKey((key) => key + 1);
    }
  };

  const open = (item: Notification) => {
    void markRead(item);
    if (item.type.startsWith('friend')) {
      onOpenFriends();
      return;
    }
    if (item.type === 'group_invitation') return;
    const groupId = Number(item.data?.group_id);
    if (Number.isInteger(groupId) && groupId > 0) onOpenGroup(groupId);
  };

  const readAll = async () => {
    if (markingAll || unread === 0) return;
    const pending = items.filter((item) => !item.read_at);
    setMarkingAll(true);
    setItems((current) =>
      current.map((entry) =>
        entry.read_at ? entry : { ...entry, read_at: new Date().toISOString() },
      ),
    );
    let failed = 0;
    for (const item of pending) {
      try {
        await api.markNotificationRead(item.id, token);
      } catch {
        failed += 1;
      }
    }
    setMarkingAll(false);
    if (failed > 0) {
      toast(`Còn ${failed} thông báo chưa đánh dấu được.`, 'bad');
      setReloadKey((key) => key + 1);
    }
  };

  const answerInvite = async (invite: GroupInvitation, action: 'accept' | 'decline') => {
    if (busyInvite !== null) return;
    setBusyInvite(invite.id);
    try {
      await api.respondGroupInvitation(invite.id, action, token);
      setInvites((current) => current.filter((entry) => entry.id !== invite.id));
      toast(
        action === 'accept'
          ? `Đã vào nhóm ${invite.group_name}.`
          : `Đã từ chối lời mời vào ${invite.group_name}.`,
      );
      if (action === 'accept') onGroupsChanged();
    } catch (caught) {
      toast(caught instanceof Error ? caught.message : 'Không xử lý được lời mời.', 'bad');
    } finally {
      setBusyInvite(null);
    }
  };

  return (
    <>
      <div className="phead">
        <div>
          <h1 className="h1">Thông báo</h1>
          <p className="psub">Lời mời, thay đổi trong nhóm và những việc đang chờ bạn để ý.</p>
        </div>
        <div className="actions">
          <span className="micro faint num">
            {unread > 0 ? `${unread} chưa đọc` : 'Đã đọc hết'}
          </span>
          <button
            type="button"
            className="btn-quiet"
            onClick={() => void readAll()}
            disabled={unread === 0 || markingAll}
          >
            {markingAll ? 'Đang đánh dấu…' : 'Đọc tất cả'}
          </button>
        </div>
      </div>

      {error ? (
        <div style={{ marginTop: 18 }}>
          <ErrorBar message={error} onRetry={reload} />
        </div>
      ) : null}

      {invites.length > 0 ? (
        <section>
          <div className="shead tight">
            <h2 className="h2">Lời mời vào nhóm</h2>
            <span className="micro faint num">{invites.length}</span>
          </div>
          {invites.map((invite) => (
            <div className="invite" key={invite.id}>
              <div className="invite-main">
                <div className="invite-title">{invite.group_name}</div>
                <div className="invite-meta">
                  {invite.inviter_name} mời bạn · {relative(invite.created_at)}
                </div>
              </div>
              <div className="rowacts">
                <button
                  type="button"
                  className="btn btn-sm"
                  disabled={busyInvite !== null}
                  onClick={() => void answerInvite(invite, 'accept')}
                >
                  Tham gia
                </button>
                <button
                  type="button"
                  className="btn-quiet"
                  disabled={busyInvite !== null}
                  onClick={() => void answerInvite(invite, 'decline')}
                >
                  Từ chối
                </button>
              </div>
            </div>
          ))}
        </section>
      ) : null}

      {loading ? (
        <SkeletonRows rows={4} />
      ) : items.length === 0 && !error && invites.length === 0 ? (
        <EmptyState title="Chưa có thông báo nào.">
          Khi ai đó mời bạn vào nhóm, kết bạn, hoặc nhắc tới bạn, thông tin sẽ nằm ở đây.
        </EmptyState>
      ) : items.length > 0 ? (
        <section>
          <div className="shead tight">
            <h2 className="h2">Tất cả</h2>
            <span className="micro faint num">{items.length}</span>
          </div>
          {items.map((item) => (
            <button
              type="button"
              key={item.id}
              className={item.read_at ? 'notif' : 'notif unread'}
              onClick={() => open(item)}
            >
              <span className="dot" aria-hidden="true" />
              <span>
                <span className="notif-title">{item.title}</span>
                <span className="notif-body">{item.body}</span>
              </span>
              <span className="notif-time">{relative(item.created_at)}</span>
            </button>
          ))}
        </section>
      ) : null}
    </>
  );
}
