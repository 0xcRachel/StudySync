import { resolveMediaUrl } from '../lib/api';
import type { Group, User } from '../lib/api';
import { initials } from '../lib/format';
import type { Notifications } from '../lib/useNotifications';
import type { Route } from '../lib/routing';
import { NotificationCenter } from './NotificationCenter';
import { Avatar, Brand, Icon } from './ui';

const NAV = [
  { name: 'home', label: 'Tổng quan', icon: 'home', shortcut: 'G H' },
  { name: 'friends', label: 'Bạn bè', icon: 'users', shortcut: 'G F' },
  { name: 'notifications', label: 'Thông báo', icon: 'bell', shortcut: 'G N' },
  { name: 'profile', label: 'Hồ sơ', icon: 'user', shortcut: 'G P' },
] as const;

const capCount = (value: number) => (value > 99 ? '99+' : String(value));

type Props = {
  user: User;
  groups: Group[];
  route: Route;
  unread: number;
  notifications: Notifications;
  theme: 'dark' | 'light';
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onToggleTheme: () => void;
  onOpenCommand: () => void;
  onNavigate: (route: Route) => void;
  onNewGroup: () => void;
  onStartTour: () => void;
  onLogout: () => void;
  onGroupsChanged: () => void;
};

export function Rail({
  user,
  groups,
  route,
  unread,
  notifications,
  theme,
  collapsed,
  onToggleCollapsed,
  onToggleTheme,
  onOpenCommand,
  onNavigate,
  onNewGroup,
  onStartTour,
  onLogout,
  onGroupsChanged,
}: Props) {
  return (
    <aside
      className={collapsed ? 'rail collapsed' : 'rail'}
      aria-label="Thanh không gian làm việc"
    >
      <div className="rail-brand">
        <button
          type="button"
          className="rail-brand-btn"
          onClick={() => onNavigate({ name: 'home' })}
          title="StudySync — Về trang tổng quan"
        >
          <Brand />
        </button>
        <div className="rail-brand-actions">
          {!collapsed ? (
            <NotificationCenter
              notifications={notifications}
              onNavigate={onNavigate}
              onGroupsChanged={onGroupsChanged}
            />
          ) : null}
          <button
            type="button"
            className="rail-icon-btn"
            onClick={onToggleCollapsed}
            title={collapsed ? 'Mở rộng thanh bên (Ctrl+B)' : 'Thu gọn thanh bên (Ctrl+B)'}
            aria-label={collapsed ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên'}
          >
            <Icon name="sidebar" size={14} />
          </button>
        </div>
      </div>

      <button
        type="button"
        className="rail-cmd"
        onClick={onOpenCommand}
        title="Mở bảng lệnh nhanh (Ctrl+K)"
        aria-label="Mở bảng lệnh nhanh (Ctrl+K)"
      >
        <Icon name="search" size={13} />
        <span className="rail-hide-collapsed">Tìm nhanh…</span>
        <kbd className="kbd rail-hide-collapsed">⌘K</kbd>
      </button>

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
              title={`${item.label} (${item.shortcut})`}
              onClick={() => onNavigate({ name: item.name } as Route)}
            >
              <Icon name={item.icon} size={15} />
              <span className="rail-hide-collapsed">{item.label}</span>
              {item.name === 'notifications' && unread > 0 ? (
                <span className="rail-badge mention" aria-label={`${capCount(unread)} thông báo chưa đọc`}>
                  {capCount(unread)}
                  <span className="sr-only"> thông báo chưa đọc</span>
                </span>
              ) : (
                <kbd className="rail-kbd rail-hide-collapsed">{item.shortcut}</kbd>
              )}
            </button>
          );
        })}
      </nav>

      <div className="rail-section rail-groups">
        <div className="rail-label rail-hide-collapsed">
          <span>NHÓM HỌC</span>
          <div className="rail-label-right">
            <span className="rail-count">{groups.length}</span>
            <button
              type="button"
              className="rail-plus"
              onClick={onNewGroup}
              title="Tạo nhóm học mới"
              aria-label="Tạo nhóm học mới"
            >
              <Icon name="plus" size={12} />
            </button>
          </div>
        </div>
        <div className="rail-scroll">
          {groups.map((group) => {
            const active = route.name === 'group' && route.groupId === group.id;
            const open = Math.max(0, Number(group.task_count) - Number(group.completed_count));
            const groupUnread = Math.max(0, Number(group.unread_count ?? 0));
            const mentions = Math.max(0, Number(group.mention_count ?? 0));
            const groupAvatar = resolveMediaUrl(group.avatar_url);
            return (
              <button
                type="button"
                key={group.id}
                className={
                  active
                    ? 'rail-group active'
                    : groupUnread > 0
                      ? 'rail-group unread'
                      : 'rail-group'
                }
                aria-current={active ? 'page' : undefined}
                title={`${group.name} · ${open} việc đang mở`}
                onClick={() => onNavigate({ name: 'group', groupId: group.id })}
              >
                {!active && groupUnread > 0 ? <span className="rail-pill" aria-hidden="true" /> : null}
                <span className="rail-group-mono" aria-hidden="true">
                  {groupAvatar ? (
                    <img src={groupAvatar} alt="" loading="lazy" referrerPolicy="no-referrer" />
                  ) : (
                    initials(group.name)
                  )}
                </span>
                <span className="name rail-hide-collapsed">{group.name}</span>
                {mentions > 0 ? (
                  <span className="rail-badge mention" aria-label={`${capCount(mentions)} tin nhắc đến bạn`}>
                    {capCount(mentions)}
                    <span className="sr-only"> tin nhắc đến bạn</span>
                  </span>
                ) : groupUnread > 0 ? (
                  <span className="rail-badge" aria-label={`${capCount(groupUnread)} tin chưa đọc`}>
                    {capCount(groupUnread)}
                    <span className="sr-only"> tin chưa đọc</span>
                  </span>
                ) : !collapsed ? (
                  <span className="rail-count">{open}</span>
                ) : null}
              </button>
            );
          })}
          {groups.length === 0 && !collapsed ? (
            <p className="rail-empty">Chưa có nhóm nào.</p>
          ) : null}
          <button
            type="button"
            className="rail-add"
            onClick={onNewGroup}
            title="Tạo nhóm học mới"
            aria-label="Tạo nhóm học mới"
          >
            <Icon name="plus" size={14} />
            <span className="rail-hide-collapsed">Nhóm mới</span>
          </button>
        </div>
      </div>

      <div className="rail-foot">
        <div className="rail-user-card">
          <button
            type="button"
            className="rail-user"
            onClick={() => onNavigate({ name: 'profile' })}
            title={`${user.name} — Mở hồ sơ cá nhân`}
          >
            <Avatar name={user.name} url={user.avatar_url} size={24} />
            <span className="rail-user-meta rail-hide-collapsed">
              <span className="rail-user-name">{user.name}</span>
            </span>
          </button>
          <div className="rail-foot-tools">
            <button
              type="button"
              className="rail-icon-btn"
              onClick={onToggleTheme}
              title={theme === 'dark' ? 'Giao diện Sáng' : 'Giao diện Tối'}
              aria-label="Đổi giao diện sáng/tối"
            >
              <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={13} />
            </button>
            {!collapsed ? (
              <button
                type="button"
                className="rail-icon-btn"
                onClick={onStartTour}
                title="Hướng dẫn sử dụng"
                aria-label="Hướng dẫn sử dụng"
              >
                <Icon name="help" size={13} />
              </button>
            ) : null}
            <button
              type="button"
              className="rail-icon-btn danger"
              onClick={onLogout}
              title="Đăng xuất"
              aria-label="Đăng xuất"
            >
              <Icon name="logout" size={13} />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
