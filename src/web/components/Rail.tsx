import type { Group, User } from '../lib/api';
import type { Route } from '../lib/routing';
import { Avatar, Brand } from './ui';

const NAV = [
  { name: 'home', label: 'Tổng quan' },
  { name: 'friends', label: 'Bạn bè' },
  { name: 'notifications', label: 'Thông báo' },
  { name: 'profile', label: 'Hồ sơ' },
] as const;

type Props = {
  user: User;
  groups: Group[];
  route: Route;
  unread: number;
  onNavigate: (route: Route) => void;
  onNewGroup: () => void;
  onStartTour: () => void;
  onLogout: () => void;
};

export function Rail({ user, groups, route, unread, onNavigate, onNewGroup, onStartTour, onLogout }: Props) {
  return (
    <aside className="rail">
      <div className="rail-brand">
        <Brand />
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
            return (
              <button
                type="button"
                key={group.id}
                className={active ? 'rail-group active' : 'rail-group'}
                aria-current={active ? 'page' : undefined}
                onClick={() => onNavigate({ name: 'group', groupId: group.id })}
              >
                <span className="name">{group.name}</span>
                <span className="rail-count">{open}</span>
              </button>
            );
          })}
          {groups.length === 0 ? <p className="rail-empty">Chưa có nhóm nào.</p> : null}
          <button type="button" className="rail-add" data-tour="create-group-nav" onClick={onNewGroup}>
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
              <span>{item.label}</span>
              {item.name === 'notifications' && unread > 0 ? <span className="rail-count">{unread}</span> : null}
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

export function MobileHead({ user, onProfile, onStartTour }: { user: User; onProfile: () => void; onStartTour: () => void }) {
  return (
    <header className="mhead">
      <Brand />
      <button type="button" className="mhead-help" onClick={onStartTour} aria-label="Hướng dẫn sử dụng">
        ?
      </button>
      <button type="button" className="mhead-user" onClick={onProfile} aria-label="Mở hồ sơ">
        <span className="mhead-name micro faint">{user.name}</span>
        <Avatar name={user.name} url={user.avatar_url} size={26} />
      </button>
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
            data-tour={item.name === 'friends' ? 'friends-nav' : undefined}
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
