import { useCallback, useEffect, useRef, useState } from 'react';
import type { Driver } from 'driver.js';
import * as api from './lib/api';
import type { Group, Notification, User } from './lib/api';
import { clearSession, readSession, updateStoredUser, writeSession } from './lib/session';
import type { Session } from './lib/session';
import { HOME, parseHash, routeKey, routeToHash } from './lib/routing';
import type { Route } from './lib/routing';
import { usePageMotion } from './lib/motion';
import { useNotifications } from './lib/useNotifications';
import type { Notifications as NotificationsState } from './lib/useNotifications';
import { CSS, FONT_HREF } from './styles';
import { ToastProvider, useToast } from './components/Toast';
import { useUserRealtime } from '../lib/useUserRealtime';
import { MobileHead, Rail, TabBar } from './components/Rail';
import { Brand, EmptyState } from './components/ui';
import { Landing } from './screens/Landing';
import { Home } from './screens/Home';
import { GroupScreen } from './screens/Group';
import { Friends } from './screens/Friends';
import { Notifications } from './screens/Notifications';
import { Profile } from './screens/Profile';
import { firstName } from './lib/format';
import 'driver.js/dist/driver.css';

type ApiState = 'checking' | 'ok' | 'down';

const TITLE = 'StudySync — biết việc gì đang chờ';

function consumeOAuthRedirect(): Session | null {
  if (typeof window === 'undefined') return null;
  const queryAt = window.location.hash.indexOf('?');
  if (queryAt < 0) return null;
  const params = new URLSearchParams(window.location.hash.slice(queryAt + 1));
  const token = params.get('oauth_token');
  const rawUser = params.get('oauth_user');
  if (token && rawUser) {
    try {
      const user = JSON.parse(rawUser) as User;
      if (Number.isInteger(user.id) && user.id > 0 && typeof user.name === 'string' && typeof user.email === 'string') {
        const next = { token, user };
        writeSession(next);
        window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#/`);
        return next;
      }
    } catch { /* invalid callback payload */ }
  }
  const error = params.get('oauth_error');
  if (error) {
    window.sessionStorage.setItem('studysync.oauth.error', error);
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#/`);
  }
  return null;
}

/**
 * CSS là một chuỗi nhúng vào <style> tự tạo, nên Fast Refresh chỉ đổi nó khi
 * effect chạy lại. Để deps rỗng thì sửa styles.ts một mình sẽ giữ nguyên CSS
 * cũ trong khi JSX đã đổi — giao diện thành nửa mới nửa cũ cho tới khi reload
 * cả trang. Depend vào CSS và cập nhật đúng node đó là hết.
 */
function useDesignSystem(): void {
  useEffect(() => {
    const id = 'studysync-design-system';
    let style = document.getElementById(id) as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement('style');
      style.id = id;
      style.setAttribute('data-studysync', 'design-system');
      document.head.appendChild(style);
    }
    style.textContent = CSS;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [CSS]);
}

/** Font, mô tả, title, ngôn ngữ: gắn một lần khi web app khởi động. */
function useDocumentChrome(): void {
  useEffect(() => {
    const nodes: HTMLElement[] = [];

    const preconnect = (href: string, crossOrigin: boolean) => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = href;
      if (crossOrigin) link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
      nodes.push(link);
    };
    preconnect('https://fonts.googleapis.com', false);
    preconnect('https://fonts.gstatic.com', true);

    const fonts = document.createElement('link');
    fonts.rel = 'stylesheet';
    fonts.href = FONT_HREF;
    document.head.appendChild(fonts);
    nodes.push(fonts);

    const description = document.createElement('meta');
    description.name = 'description';
    description.content =
      'StudySync giữ công việc, thảo luận và tiến độ của nhóm học tập trong một chỗ.';
    document.head.appendChild(description);
    nodes.push(description);

    document.documentElement.lang = 'vi';
    const previousTitle = document.title;
    document.title = TITLE;

    return () => {
      nodes.forEach((node) => node.remove());
      document.title = previousTitle || 'StudySync';
    };
  }, []);
}

function Boot() {
  return (
    <div className="boot">
      <Brand />
      <p className="micro faint">Đang mở không gian học tập…</p>
    </div>
  );
}

type ShellProps = {
  session: Session;
  route: Route;
  groups: Group[];
  groupsLoading: boolean;
  groupsError: string | null;
  notifications: NotificationsState;
  createIntent: number;
  onNavigate: (route: Route) => void;
  onCreateGroup: (name: string, description: string) => Promise<void>;
  onReloadGroups: () => void;
  onNewGroup: () => void;
  onTasksChanged: () => void;
  onUserChange: (user: User) => void;
  onLogout: () => void;
  onStartTour: () => void;
};

function AppShell({
  session,
  route,
  groups,
  groupsLoading,
  groupsError,
  notifications,
  createIntent,
  onNavigate,
  onCreateGroup,
  onReloadGroups,
  onNewGroup,
  onTasksChanged,
  onUserChange,
  onLogout,
  onStartTour,
}: ShellProps) {
  const pageRef = useRef<HTMLDivElement | null>(null);
  usePageMotion(routeKey(route), pageRef);

  const { user, token } = session;
  const activeGroup =
    route.name === 'group' ? groups.find((group) => group.id === route.groupId) : undefined;

  // The local group list can be stale — e.g. the reader joined on another
  // device — so refresh once before declaring a deep-linked group missing.
  const retriedGroupRef = useRef<number | null>(null);
  useEffect(() => {
    if (route.name !== 'group' || activeGroup || groupsLoading || groupsError) return;
    if (retriedGroupRef.current === route.groupId) return;
    retriedGroupRef.current = route.groupId;
    onReloadGroups();
  }, [route, activeGroup, groupsLoading, groupsError, onReloadGroups]);

  const missingGroup =
    route.name === 'group' && !groupsLoading && !groupsError && !activeGroup;

  return (
    <div className="app">
      <a className="skip" href="#main">
        Tới nội dung
      </a>

      <Rail
        user={user}
        groups={groups}
        route={route}
        unread={notifications.unreadCount}
        notifications={notifications}
        onNavigate={onNavigate}
        onNewGroup={onNewGroup}
        onStartTour={onStartTour}
        onLogout={onLogout}
        onGroupsChanged={onTasksChanged}
      />

      <MobileHead
        user={user}
        notifications={notifications}
        onProfile={() => onNavigate({ name: 'profile' })}
        onNavigate={onNavigate}
        onStartTour={onStartTour}
        onGroupsChanged={onTasksChanged}
      />

      <main className="main" id="main" tabIndex={-1}>
        <div className="page" ref={pageRef}>
          {route.name === 'home' ? (
            <Home
              user={user}
              groups={groups}
              loading={groupsLoading}
              error={groupsError}
              createIntent={createIntent}
              onReload={onReloadGroups}
              onOpenGroup={(group) => onNavigate({ name: 'group', groupId: group.id })}
              onCreateGroup={onCreateGroup}
            />
          ) : null}

          {route.name === 'group' ? (
            missingGroup ? (
              <>
                <button
                  type="button"
                  className="back"
                  onClick={() => onNavigate(HOME)}
                >
                  Tất cả nhóm
                </button>
                <EmptyState
                  title="Nhóm này không còn trong danh sách của bạn."
                  action={
                    <div className="rowacts">
                      <button type="button" className="btn" onClick={() => onNavigate(HOME)}>
                        Về tổng quan
                      </button>
                      <button type="button" className="btn-quiet" onClick={onReloadGroups}>
                        Thử lại
                      </button>
                    </div>
                  }
                >
                  Có thể nhóm đã bị xoá, hoặc bạn đã rời nhóm. Kiểm tra lại lời mời trong thông báo.
                </EmptyState>
              </>
            ) : (
              <GroupScreen
                key={route.groupId}
                group={activeGroup}
                groupId={route.groupId}
                token={token}
                user={user}
                onBack={() => onNavigate(HOME)}
                onTasksChanged={onTasksChanged}
              />
            )
          ) : null}

          {route.name === 'friends' ? <Friends token={token} /> : null}

          {route.name === 'notifications' ? (
            <Notifications
              notifications={notifications}
              onOpenGroup={(groupId) => onNavigate({ name: 'group', groupId })}
              onOpenFriends={() => onNavigate({ name: 'friends' })}
              onGroupsChanged={onTasksChanged}
            />
          ) : null}

          {route.name === 'profile' ? (
            <Profile
              user={user}
              token={token}
              onUserChange={onUserChange}
              onLogout={onLogout}
            />
          ) : null}
        </div>
      </main>

      <TabBar route={route} unread={notifications.unreadCount} onNavigate={onNavigate} />
    </div>
  );
}

function Workspace() {
  const toast = useToast();

  const [session, setSession] = useState<Session | null>(() => consumeOAuthRedirect() ?? readSession());
  const [booting, setBooting] = useState(() => readSession() !== null);
  const [apiState, setApiState] = useState<ApiState>('checking');
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(() => readSession() !== null);
  const [groupsError, setGroupsError] = useState<string | null>(null);
  const [createIntent, setCreateIntent] = useState(0);
  const [tourNonce, setTourNonce] = useState(0);

  const token = session?.token ?? null;
  const notifications = useNotifications(token ?? '');

  const onRealtimeNotification = useCallback((notification: Notification) => {
    // Chỉ phát sự kiện. useNotifications lắng nghe và tự nạp lại danh sách,
    // nên không cần ở đây gọi thêm một lần /notifications.php để đếm số chưa
    // đọc — đó chính là nguồn khiến badge và trang lệch nhau.
    window.dispatchEvent(new CustomEvent('studysync:notification', { detail: notification }));
  }, []);

  useUserRealtime({ enabled: Boolean(token) && !booting, token: token ?? '', onNotification: onRealtimeNotification });

  useEffect(() => {
    if (!session || booting || groupsLoading || route.name !== 'home') return undefined;
    const storageKey = `studysync.tour.v1.${session.user.id}`;
    let seen = false;
    try { seen = window.localStorage.getItem(storageKey) === 'done'; } catch { /* storage can be disabled */ }
    if (seen && tourNonce === 0) return undefined;

    let disposed = false;
    let timer = 0;
    let tour: Driver | null = null;
    const launch = async () => {
      const { driver } = await import('driver.js');
      if (disposed) return;
      // Below 981px the rail is display:none, so the friends step has to point
      // at the tab bar; otherwise driver.js highlights an invisible element.
      const friendsTarget = window.matchMedia('(min-width: 981px)').matches
        ? '[data-tour="friends-nav"]'
        : '[data-tour="friends-nav-tab"]';
      tour = driver({
        animate: !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        allowClose: true,
        allowScroll: true,
        showProgress: true,
        nextBtnText: 'Tiếp',
        prevBtnText: 'Quay lại',
        doneBtnText: 'Bắt đầu thôi',
        closeBtnLabel: 'Đóng hướng dẫn',
        popoverClass: 'studysync-tour-popover',
        overlayColor: '#101b17',
        steps: [
          { element: '[data-tour="overview"]', popover: { title: 'Tổng quan của bạn', description: 'Theo dõi số nhóm, việc đang mở và tiến độ học tập tại đây.', side: 'bottom', align: 'start' } },
          { element: '[data-tour="group-list"]', popover: { title: 'Không gian nhóm', description: 'Mỗi nhóm có danh sách công việc, thành viên và khu chat riêng.', side: 'bottom', align: 'start' } },
          { element: '[data-tour="create-group"]', popover: { title: 'Tạo nhóm học', description: 'Bắt đầu bằng cách tạo nhóm; sau đó bạn có thể mời bạn học cùng tham gia.', side: 'bottom', align: 'end' } },
          { element: friendsTarget, popover: { title: 'Kết nối bạn học', description: 'Tìm và kết bạn tại đây để cộng tác, rồi mời họ vào nhóm.', side: 'right', align: 'center' } },
        ],
        onDestroyed: () => {
          try { window.localStorage.setItem(storageKey, 'done'); } catch { /* storage can be disabled */ }
        },
      });
      tour.drive();
    };
    if (tourNonce > 0) void launch();
    else timer = window.setTimeout(() => { void launch(); }, 450);
    return () => {
      disposed = true;
      window.clearTimeout(timer);
      // Leaving Home mid-tour used to strand the overlay over the whole app.
      tour?.destroy();
      tour = null;
    };
    // Keyed on the id, not the session object: /me.php and profile edits replace
    // the session on every save, which used to stack a second tour on top.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user.id, booting, groupsLoading, route.name, tourNonce]);

  useEffect(() => {
    if (!window.location.hash) window.history.replaceState(null, '', '#/');
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      try {
        await api.health(controller.signal);
        setApiState('ok');
      } catch {
        if (!controller.signal.aborted) setApiState('down');
      }
    })();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!token) return undefined;
    const controller = new AbortController();
    let active = true;

    void (async () => {
      try {
        const result = await api.me(token, controller.signal);
        if (!active) return;
        const next: Session = { token, user: result.user };
        writeSession(next);
        setSession(next);
      } catch (caught) {
        if (!active) return;
        if (caught instanceof api.ApiError && caught.status === 401) {
          clearSession();
          setSession(null);
        }
      } finally {
        if (active) setBooting(false);
      }
    })();

    return () => {
      active = false;
      controller.abort();
    };
  }, [token]);

  const loadGroups = useCallback(
    async (silent = false) => {
      if (!token) return;
      try {
        const list = await api.getGroups(token);
        setGroups(list);
        if (!silent) setGroupsError(null);
      } catch (caught) {
        if (!silent) {
          setGroupsError(
            caught instanceof Error ? caught.message : 'Không tải được danh sách nhóm.',
          );
        }
      } finally {
        if (!silent) setGroupsLoading(false);
      }
    },
    [token],
  );

  useEffect(() => {
    if (!token) return undefined;
    const controller = new AbortController();
    let active = true;

    void (async () => {
      try {
        const list = await api.getGroups(token, controller.signal);
        if (!active) return;
        setGroups(list);
        setGroupsError(null);
      } catch (caught) {
        if (!active || controller.signal.aborted) return;
        setGroupsError(
          caught instanceof Error ? caught.message : 'Không tải được danh sách nhóm.',
        );
      } finally {
        if (active) setGroupsLoading(false);
      }
    })();

    return () => {
      active = false;
      controller.abort();
    };
  }, [token]);

  /**
   * Pill chưa đọc trên sidebar phải lớn lên kể cả khi không mở nhóm đó.
   * WebSocket chỉ báo notification (nhắc tên, kết bạn) nên tin nhắn thường
   * phải đi đường polling; rời nhóm thì navigate đã nạp lại ngay vì tab chat
   * vừa gửi read.
   */
  useEffect(() => {
    if (!token) return undefined;
    const onNotification = () => void loadGroups(true);
    window.addEventListener('studysync:notification', onNotification);
    return () => window.removeEventListener('studysync:notification', onNotification);
  }, [token, loadGroups]);

  useEffect(() => {
    if (!token) return undefined;
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'hidden') return;
      void loadGroups(true);
    }, 8000);
    return () => window.clearInterval(interval);
  }, [token, loadGroups]);

  const reloadGroups = () => {
    setGroupsLoading(true);
    setGroupsError(null);
    void loadGroups();
  };

  useEffect(() => {
    const sync = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('popstate', sync);
    window.addEventListener('hashchange', sync);
    return () => {
      window.removeEventListener('popstate', sync);
      window.removeEventListener('hashchange', sync);
    };
  }, []);

  useEffect(() => {
    const onUnauthorized = () => {
      clearSession();
      setSession(null);
      setGroups([]);
      setBooting(false);
      setRoute(HOME);
      window.history.replaceState(null, '', '#/');
      toast('Phiên đăng nhập đã kết thúc. Đăng nhập lại để tiếp tục.', 'bad');
    };
    window.addEventListener('studysync:unauthorized', onUnauthorized);
    return () => window.removeEventListener('studysync:unauthorized', onUnauthorized);
  }, [toast]);

  useEffect(() => {
    if (!session) {
      document.title = TITLE;
      return;
    }
    const group =
      route.name === 'group' ? groups.find((item) => item.id === route.groupId) : undefined;
    const label =
      route.name === 'home'
        ? 'Tổng quan'
        : route.name === 'friends'
          ? 'Bạn bè'
          : route.name === 'notifications'
            ? 'Thông báo'
            : route.name === 'profile'
              ? 'Hồ sơ'
              : group?.name ?? 'Nhóm';
    document.title = `${label} · StudySync`;
  }, [route, groups, session]);

  const navigate = useCallback((next: Route) => {
    const hash = routeToHash(next);
    if (window.location.hash !== hash) window.history.pushState(null, '', hash);
    setRoute(next);
    // Rời một nhóm là tab chat vừa gửi read cho nhóm đó, nên badge phải tụt
    // ngay thay vì chờ tới lần polling kế tiếp.
    void loadGroups(true);
  }, [loadGroups]);

  const handleAuthed = useCallback(
    (next: Session) => {
      writeSession(next);
      setSession(next);
      setApiState('ok');
      setGroupsLoading(true);
      setRoute(HOME);
      window.history.replaceState(null, '', routeToHash(HOME));
      toast(`Chào ${firstName(next.user.name)}.`);
    },
    [toast],
  );

  const handleUserChange = useCallback((nextUser: User) => {
    updateStoredUser(nextUser);
    setSession((current) => (current ? { ...current, user: nextUser } : current));
  }, []);

  const logout = useCallback(async () => {
    if (!token) return;
    try {
      await api.logout(token);
    } catch {
      /* phiên có thể đã hết hạn phía máy chủ */
    }
    clearSession();
    setSession(null);
    setGroups([]);
    setBooting(false);
    setGroupsLoading(false);
    setRoute(HOME);
    window.history.replaceState(null, '', '#/');
    toast('Đã đăng xuất.');
  }, [token, toast]);

  const createGroup = useCallback(
    async (name: string, description: string) => {
      if (!token) throw new Error('Chưa đăng nhập.');
      const group = await api.createGroup(name, description, token);
      setGroups((current) => [group, ...current]);
      toast(`Đã tạo nhóm ${group.name}.`);
      void loadGroups(true);
      navigate({ name: 'group', groupId: group.id });
    },
    [token, toast, loadGroups, navigate],
  );

  const openNewGroup = useCallback(() => {
    navigate(HOME);
    setCreateIntent((value) => value + 1);
  }, [navigate]);

  const startTour = useCallback(() => {
    navigate(HOME);
    setTourNonce((value) => value + 1);
  }, [navigate]);

  if (!session) {
    return <Landing onAuthed={handleAuthed} apiState={apiState} />;
  }

  if (booting) return <Boot />;

  return (
    <AppShell
      session={session}
      route={route}
      groups={groups}
      groupsLoading={groupsLoading}
      groupsError={groupsError}
      notifications={notifications}
      createIntent={createIntent}
      onNavigate={navigate}
      onCreateGroup={createGroup}
      onReloadGroups={reloadGroups}
      onNewGroup={openNewGroup}
      onTasksChanged={() => void loadGroups(true)}
      onUserChange={handleUserChange}
      onLogout={() => void logout()}
      onStartTour={startTour}
    />
  );
}

export function WebApp() {
  useDesignSystem();
  useDocumentChrome();
  return (
    <ToastProvider>
      <Workspace />
    </ToastProvider>
  );
}
