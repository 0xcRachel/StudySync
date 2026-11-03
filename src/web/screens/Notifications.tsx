import { useState } from 'react';
import type { Notification } from '../lib/api';
import type { Notifications as NotificationsState } from '../lib/useNotifications';
import { relative } from '../lib/format';
import { useToast } from '../components/Toast';
import { EmptyState, ErrorBar, SkeletonRows } from '../components/ui';

export function Notifications({
  notifications,
  onOpenGroup,
  onOpenFriends,
  onGroupsChanged,
}: {
  notifications: NotificationsState;
  onOpenGroup: (groupId: number) => void;
  onOpenFriends: () => void;
  onGroupsChanged: () => void;
}) {
  const toast = useToast();
  const {
    items,
    invitations,
    unreadCount,
    loading,
    error,
    reload,
    markRead,
    markAllRead,
    answerInvitation,
  } = notifications;
  const [busyInvite, setBusyInvite] = useState<number | null>(null);

  const open = (item: Notification) => {
    void markRead(item.id);
    if (item.type.startsWith('friend')) {
      onOpenFriends();
      return;
    }
    // Lời mời nhóm được trả lời bằng nút riêng bên trên; điều hướng vào nhóm mà
    // người dùng chưa tham gia chỉ tổ nhận lỗi 403.
    if (item.type === 'group_invitation') return;
    const groupId = Number(item.data?.group_id);
    if (Number.isInteger(groupId) && groupId > 0) onOpenGroup(groupId);
  };

  const answer = async (invitationId: number, action: 'accept' | 'decline') => {
    if (busyInvite !== null) return;
    setBusyInvite(invitationId);
    try {
      await answerInvitation(invitationId, action);
      toast(action === 'accept' ? 'Đã vào nhóm.' : 'Đã từ chối lời mời.');
      if (action === 'accept') onGroupsChanged();
    } catch (caught) {
      toast(caught instanceof Error ? caught.message : 'Không xử lý được lời mời.', 'bad');
      reload();
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
            {unreadCount > 0 ? `${unreadCount} chưa đọc` : 'Đã đọc hết'}
          </span>
          <button
            type="button"
            className="btn-quiet"
            onClick={() => void markAllRead()}
            disabled={unreadCount === 0}
          >
            Đọc tất cả
          </button>
        </div>
      </div>

      {error ? (
        <div style={{ marginTop: 18 }}>
          <ErrorBar message={error} onRetry={reload} />
        </div>
      ) : null}

      {invitations.length > 0 ? (
        <section>
          <div className="shead tight">
            <h2 className="h2">Lời mời vào nhóm</h2>
            <span className="micro faint num">{invitations.length}</span>
          </div>
          {invitations.map((invitation) => (
            <div className="invite" key={invitation.id}>
              <div className="invite-main">
                <div className="invite-title">{invitation.group_name}</div>
                <div className="invite-meta">
                  {invitation.inviter_name} mời bạn · {relative(invitation.created_at)}
                </div>
              </div>
              <div className="rowacts">
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
                  className="btn-quiet"
                  disabled={busyInvite !== null}
                  onClick={() => void answer(invitation.id, 'decline')}
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
      ) : items.length === 0 && !error && invitations.length === 0 ? (
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
