import { useEffect, useRef, useState } from 'react';
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

/**
 * Trung tâm thông báo: chuông + popover neo ngay dưới chuông, kiểu
 * Telegram / Slack / GitHub. Không phải modal chắn màn hình — người dùng vẫn
 * thấy nội dung phía sau và không mất vị trí cuộn khi đóng.
 */
export function NotificationCenter({ notifications, onNavigate, onGroupsChanged }: Props) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [busyInvite, setBusyInvite] = useState<number | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Node && rootRef.current?.contains(target)) return;
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
        type="button"
        className={open ? 'notif-bell open' : 'notif-bell'}
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={unreadCount > 0 ? `Thông báo, ${unreadCount} chưa đọc` : 'Thông báo'}
      >
        <Icon name="bell" size={19} />
        {unreadCount > 0 ? <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span> : null}
      </button>

      {open ? (
        <div className="notif-panel" role="dialog" aria-label="Thông báo">
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
        </div>
      ) : null}
    </div>
  );
}
