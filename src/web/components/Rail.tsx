import type { Group, User } from '../lib/api';
import type { Notifications } from '../lib/useNotifications';
import type { Route } from '../lib/routing';
import { NotificationCenter } from './NotificationCenter';
import { Avatar, Brand, Icon } from './ui';

const NAV = [
  { name: 'home', label: 'Tổng quan', icon: 'home' },
  { name: 'friends', label: 'Bạn bè', icon: 'users' },
  { name: 'notifications', label: 'Thông báo', icon: 'bell' },
  { name: 'profile', label: 'Hồ sơ', icon: 'user' },
] as const;

const capCount = (value: number) => (value > 99 ? '99+' : String(value));

type Props = {
  user: User;
  groups: Group[];
  route: Route;
  unread: number;
  notifications: Notifications;
  onNavigate: (route: Route) => void;
  onNewGroup: () => void;
  onStartTour: () => void;
  onLogout: () => void;
  onGroupsChanged: () => void;
};

export function Rail({ user, groups, route, unread, notifications, onNavigate, onNewGroup, onStartTour, onLogout, onGroupsChanged }: Props) {
  return (
    <aside className="rail">
      <div className="rail-brand">
        <Brand />
        <NotificationCenter
          notifications={notifications}
          onNavigate={onNavigate}
          onGroupsChanged={onGroupsChanged}
        />
      </div>

      <div className="rail-section rail-groups">
        <div className="rail-label">
          <span>Nhóm</span>
          <span className="rail-count">{groups.length}</span>
        </div>
        <div className="rail-scroll">
          {groups.map((group) => {
            const active = route.name === 'group' && route.groupId === group.id;
            const open = Math.max(0, Number(group.task_count) - Number(group.completed_count));
            const unread = Math.max(0, Number(group.unread_count ?? 0));
            const mentions = Math.max(0, Number(group.mention_count ?? 0));
            return (
              <button
                type="button"
                key={group.id}
                className={active ? 'rail-group active' : unread > 0 ? 'rail-group unread' : 'rail-group'}
                aria-current={active ? 'page' : undefined}
                onClick={() => onNavigate({ name: 'group', groupId: group.id })}
              >
                {/* Pill Discord: mép trái, phồng lên khi rê; ẩn ở hàng đang xem
                    vì hàng đang xem thì tin đã được đánh dấu đọc. */}
                {!active && unread > 0 ? <span className="rail-pill" aria-hidden="true" /> : null}
                <span className="name">{group.name}</span>
                {mentions > 0 ? (
                  <span className="rail-badge mention" aria-label={`${capCount(mentions)} tin nhắc đến bạn`}>
                    {capCount(mentions)}
                    <span className="sr-only"> tin nhắc đến bạn</span>
                  </span>
                ) : unread > 0 ? (
                  <span className="rail-badge" aria-label={`${capCount(unread)} tin chưa đọc`}>
                    {capCount(unread)}
                    <span className="sr-only"> tin chưa đọc</span>
                  </span>
                ) : (
                  <span className="rail-count">{open}</span>
                )}
              </button>
            );
          })}
          {groups.length === 0 ? <p className="rail-empty">Chưa có nhóm nào.</p> : null}
          <button type="button" className="rail-add" onClick={onNewGroup}>
            Nhóm mới
          </button>
        </div>
      </div>

      <nav className="rail-nav" aria-label="Điều hướng chính">
        {NAV.map((item) => {
          const active = route.name === item.name;
          return (
            <button
              type="button"
              key={item.name}
              className={active ? 'rail-item active' : 'rail-item'}
                data-tour={item.name === 'friends' ? 'friends-nav' : undefined}
              aria-current={active ? 'page' : undefined}
              onClick={() => onNavigate({ name: item.name } as Route)}
            >
              <Icon name={item.icon} size={17} />
              <span>{item.label}</span>
              {item.name === 'notifications' && unread > 0 ? (
                <span className="rail-badge" aria-label={`${capCount(unread)} thông báo chưa đọc`}>
                  {capCount(unread)}
                  <span className="sr-only"> thông báo chưa đọc</span>
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      <div className="rail-foot">
        <div className="rail-user">
          <Avatar name={user.name} url={user.avatar_url} size={28} />
          <span className="rail-user-name">{user.name}</span>
        </div>
        <button type="button" className="rail-signout" onClick={onStartTour}>
          Hướng dẫn sử dụng
        </button>
        <button type="button" className="rail-signout" onClick={onLogout}>
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}

export function MobileHead({
  user,
  notifications,
  onProfile,
  onNavigate,
  onStartTour,
  onGroupsChanged,
}: {
  user: User;
  notifications: Notifications;
  onProfile: () => void;
  onNavigate: (route: Route) => void;
  onStartTour: () => void;
  onGroupsChanged: () => void;
}) {
  return (
    <header className="mhead">
      <Brand />
      <div className="mhead-actions">
        <NotificationCenter
          notifications={notifications}
          onNavigate={onNavigate}
          onGroupsChanged={onGroupsChanged}
        />
        <button type="button" className="mhead-help" onClick={onStartTour} aria-label="Hướng dẫn sử dụng">
          ?
        </button>
        <button type="button" className="mhead-user" onClick={onProfile} aria-label="Mở hồ sơ">
          <span className="mhead-name micro faint">{user.name}</span>
          <Avatar name={user.name} url={user.avatar_url} size={26} />
        </button>
      </div>
    </header>
  );
}

export function TabBar({
  route,
  unread,
  onNavigate,
}: {
  route: Route;
  unread: number;
  onNavigate: (route: Route) => void;
}) {
  return (
    <nav className="tabbar" aria-label="Điều hướng chính">
      {NAV.map((item) => {
        const active = route.name === item.name || (item.name === 'home' && route.name === 'group');
        return (
          <button
            type="button"
            key={item.name}
            data-tour={item.name === 'friends' ? 'friends-nav-tab' : undefined}
            aria-current={active ? 'true' : undefined}
            onClick={() => onNavigate({ name: item.name } as Route)}
          >
            {item.label}
            {item.name === 'notifications' && unread > 0 ? <span className="tcount"> {unread}</span> : null}
          </button>
        );
      })}
    </nav>
  );
}
