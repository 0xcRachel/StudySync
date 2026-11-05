import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Notifications } from '../lib/useNotifications';
import type { Route } from '../lib/routing';
import { relative } from '../lib/format';
import { useToast } from './Toast';
import { Icon } from './ui';

type Props = {
  notifications: Notifications;
  onNavigate: (route: Route) => void;
  onGroupsChanged: () => void;
};

const PANEL_WIDTH = 344;
const EDGE_GAP = 12;

/**
 * Trung tâm thông báo: chuông + popover neo ngay dưới chuông, kiểu
 * Telegram / Slack / GitHub. Không phải modal chắn màn hình — người dùng vẫn
 * thấy nội dung phía sau và không mất vị trí cuộn khi đóng.
 *
 * Panel được render ở <body> chứ không nằm trong sidebar: `.rail` có
 * overflow:auto nên mọi phần tử absolute bên trong — kể cả z-index cao — đều
 * bị cắt ở biên phải 232px của sidebar.
 */
export function NotificationCenter({ notifications, onNavigate, onGroupsChanged }: Props) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [busyInvite, setBusyInvite] = useState<number | null>(null);
  const [anchor, setAnchor] = useState<{ top: number; left: number; maxHeight: number } | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const bellRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const position = useCallback(() => {
    const bell = bellRef.current;
    if (!bell) return;
    const rect = bell.getBoundingClientRect();
    const width = Math.min(PANEL_WIDTH, window.innerWidth - EDGE_GAP * 2);
    const height = Math.min(520, window.innerHeight * 0.7);
    // Neo mép phải của panel vào mép phải chuông, nhưng không bao giờ tràn
    // khỏi viewport — trên màn hẹp nó tự trôi sang trái.
    const left = Math.max(EDGE_GAP, Math.min(rect.right - width, window.innerWidth - width - EDGE_GAP));
    const top = rect.bottom + 10;
    setAnchor({ top, left, maxHeight: Math.max(160, Math.min(height, window.innerHeight - top - EDGE_GAP)) });
  }, []);

  const toggle = () => {
    if (open) {
      setOpen(false);
      return;
    }
    position();
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return undefined;
    window.addEventListener('resize', position);
    // capture=true: .rail và .main cuộn độc lập với window.
    window.addEventListener('scroll', position, true);
    return () => {
      window.removeEventListener('resize', position);
      window.removeEventListener('scroll', position, true);
    };
  }, [open, position]);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      // Panel nằm ở <body> nên phải kiểm tra cả hai gốc, nếu không mọi cú bấm
      // trong panel (Tham gia, Đọc tất cả) sẽ đóng popover trước khi chạy.
      if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown, true);
    };
  }, [open]);

  const openItem = (id: number, type: string, data: Record<string, unknown> | null) => {
    void notifications.markRead(id);
    setOpen(false);
    if (type.startsWith('friend')) {
      onNavigate({ name: 'friends' });
      return;
    }
    const groupId = Number(data?.group_id);
    if (Number.isInteger(groupId) && groupId > 0) {
      onNavigate({ name: 'group', groupId });
      return;
    }
    onNavigate({ name: 'notifications' });
  };

  const answer = async (invitationId: number, action: 'accept' | 'decline') => {
    setBusyInvite(invitationId);
    try {
      await notifications.answerInvitation(invitationId, action);
      toast(action === 'accept' ? 'Đã vào nhóm.' : 'Đã từ chối lời mời.');
      if (action === 'accept') onGroupsChanged();
    } catch (caught) {
      toast(caught instanceof Error ? caught.message : 'Không xử lý được lời mời.', 'bad');
      notifications.reload();
    } finally {
      setBusyInvite(null);
    }
  };

  const { items, invitations, unreadCount } = notifications;
  const hasContent = invitations.length > 0 || items.length > 0;

  return (
    <div className="notif-center" ref={rootRef}>
      <button
        ref={bellRef}
        type="button"
        className={open ? 'notif-bell open' : 'notif-bell'}
        onClick={toggle}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={unreadCount > 0 ? `Thông báo, ${unreadCount} chưa đọc` : 'Thông báo'}
      >
        <Icon name="bell" size={19} />
        {unreadCount > 0 ? <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span> : null}
      </button>

      {open && anchor
        ? createPortal(
            <div
              ref={panelRef}
              className="notif-panel"
              role="dialog"
              aria-label="Thông báo"
              style={{
                top: anchor.top,
                left: anchor.left,
                width: Math.min(PANEL_WIDTH, window.innerWidth - EDGE_GAP * 2),
                maxHeight: anchor.maxHeight,
              }}
            >
          <div className="notif-panel-head">
            <span className="notif-panel-title">Thông báo</span>
            {unreadCount > 0 ? (
              <button type="button" className="notif-markall" onClick={() => void notifications.markAllRead()}>
                Đọc tất cả
              </button>
            ) : null}
          </div>

          {notifications.error ? <p className="notif-error">{notifications.error}</p> : null}

          {invitations.length > 0 ? (
            <div className="notif-section">
              <p className="notif-section-label">Lời mời vào nhóm</p>
              {invitations.map((invitation) => (
                <div className="notif-invite" key={invitation.id}>
                  <div className="notif-invite-main">
                    <span className="notif-invite-name">{invitation.group_name}</span>
                    <span className="notif-invite-meta">
                      {invitation.inviter_name} mời bạn · {relative(invitation.created_at)}
                    </span>
                  </div>
                  <div className="notif-invite-actions">
                    <button
                      type="button"
                      className="btn btn-sm"
                      disabled={busyInvite !== null}
                      onClick={() => void answer(invitation.id, 'accept')}
                    >
                      Tham gia
                    </button>
                    <button
                      type="button"
                      className="btn-quiet btn-sm"
                      disabled={busyInvite !== null}
                      onClick={() => void answer(invitation.id, 'decline')}
                    >
                      Từ chối
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          <div className="notif-list">
            {items.length === 0 && invitations.length === 0 ? (
              <p className="notif-empty">
                {notifications.loading ? 'Đang tải…' : 'Chưa có thông báo nào.'}
              </p>
            ) : (
              items.slice(0, 12).map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={item.read_at ? 'notif-row' : 'notif-row unread'}
                  onClick={() => openItem(item.id, item.type, item.data ?? null)}
                >
                  <span className="notif-dot" aria-hidden="true" />
                  <span className="notif-row-body">
                    <span className="notif-row-title">{item.title}</span>
                    <span className="notif-row-text">{item.body}</span>
                  </span>
                  <span className="notif-row-time">{relative(item.created_at)}</span>
                </button>
              ))
            )}
          </div>

          {hasContent ? (
            <button
              type="button"
              className="notif-panel-foot"
              onClick={() => {
                setOpen(false);
                onNavigate({ name: 'notifications' });
              }}
            >
              Xem tất cả
              <Icon name="chevron" size={14} />
            </button>
          ) : null}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
