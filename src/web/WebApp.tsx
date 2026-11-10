import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import type { Driver } from 'driver.js';
import * as api from './lib/api';
import type { Group, GroupAvatarInput, InviteCandidate, Notification, User } from './lib/api';
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
import type { UnreadSignal } from '../lib/useUserRealtime';
import { Rail } from './components/Rail';
import { Avatar, Brand, EmptyState, Icon } from './components/ui';
import { Landing } from './screens/Landing';
import { Home } from './screens/Home';
import { GroupScreen } from './screens/Group';
import { Friends } from './screens/Friends';
import { Notifications } from './screens/Notifications';
import { Profile } from './screens/Profile';
import { firstName, initials } from './lib/format';
import 'driver.js/dist/driver.css';

type ApiState = 'checking' | 'ok' | 'down';
type Theme = 'dark' | 'light';

const TITLE = 'StudySync — Hệ điều hành học tập nhóm';

function readTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  try {
    const saved = window.localStorage.getItem('studysync.theme');
    if (saved === 'light' || saved === 'dark') return saved;
  } catch { /* ignore */ }
  return 'dark';
}

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
      <Brand subtitle="OS 2.4" />
      <p className="micro faint">Đang khởi tạo không gian làm việc…</p>
    </div>
  );
}

type CommandItem = {
  id: string;
  label: string;
  meta: string;
  icon: 'home' | 'users' | 'bell' | 'user' | 'plus' | 'sun' | 'moon' | 'help' | 'layers';
  action: () => void;
};

function CommandPalette({
  open,
  groups,
  theme,
  onClose,
  onNavigate,
  onNewGroup,
  onToggleTheme,
  onStartTour,
}: {
  open: boolean;
  groups: Group[];
  theme: Theme;
  onClose: () => void;
  onNavigate: (route: Route) => void;
  onNewGroup: () => void;
  onToggleTheme: () => void;
  onStartTour: () => void;
}) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [lastOpen, setLastOpen] = useState(open);
  const inputRef = useRef<HTMLInputElement | null>(null);

  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) {
      setQuery('');
      setActiveIndex(0);
    }
  }

  useEffect(() => {
    if (!open) return;
    const id = window.requestAnimationFrame(() => inputRef.current?.focus());
    return () => window.cancelAnimationFrame(id);
  }, [open]);

  const items = useMemo<CommandItem[]>(() => {
    const base: CommandItem[] = [
      {
        id: 'nav-home',
        label: 'Tổng quan không gian làm việc',
        meta: 'Điều hướng · G H',
        icon: 'home',
        action: () => onNavigate(HOME),
      },
      {
        id: 'act-new-group',
        label: 'Tạo nhóm học tập mới',
        meta: 'Thao tác nhanh · C',
        icon: 'plus',
        action: () => onNewGroup(),
      },
      {
        id: 'nav-friends',
        label: 'Danh bạ bạn bè & kết nối',
        meta: 'Điều hướng · G F',
        icon: 'users',
        action: () => onNavigate({ name: 'friends' }),
      },
      {
        id: 'nav-notifications',
        label: 'Trung tâm thông báo & lời mời',
        meta: 'Điều hướng · G N',
        icon: 'bell',
        action: () => onNavigate({ name: 'notifications' }),
      },
      {
        id: 'nav-profile',
        label: 'Hồ sơ cá nhân & bảo mật',
        meta: 'Điều hướng · G P',
        icon: 'user',
        action: () => onNavigate({ name: 'profile' }),
      },
      {
        id: 'act-theme',
        label: theme === 'dark' ? 'Chuyển sang giao diện Sáng (Alabaster)' : 'Chuyển sang giao diện Tối (Obsidian)',
        meta: 'Giao diện',
        icon: theme === 'dark' ? 'sun' : 'moon',
        action: () => onToggleTheme(),
      },
      {
        id: 'act-tour',
        label: 'Chạy lại hướng dẫn sử dụng',
        meta: 'Trợ giúp',
        icon: 'help',
        action: () => onStartTour(),
      },
    ];

    const groupItems: CommandItem[] = groups.map((group) => ({
      id: `group-${group.id}`,
      label: group.name,
      meta: `Nhóm · ${group.completed_count}/${group.task_count} việc đã xong`,
      icon: 'layers',
      action: () => onNavigate({ name: 'group', groupId: group.id }),
    }));

    const all = [...groupItems, ...base];
    const needle = query.trim().toLocaleLowerCase();
    if (!needle) return all;
    return all.filter(
      (item) =>
        item.label.toLocaleLowerCase().includes(needle) ||
        item.meta.toLocaleLowerCase().includes(needle),
    );
  }, [groups, theme, query, onNavigate, onNewGroup, onToggleTheme, onStartTour]);

  if (!open) return null;

  const safeIndex = items.length > 0 ? Math.min(activeIndex, items.length - 1) : 0;

  return (
    <div className="cmd-backdrop" onClick={onClose} role="presentation">
      <div
        className="cmd-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Bảng lệnh nhanh"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            onClose();
            return;
          }
          if (event.key === 'ArrowDown' && items.length > 0) {
            event.preventDefault();
            setActiveIndex((current) => (current + 1) % items.length);
            return;
          }
          if (event.key === 'ArrowUp' && items.length > 0) {
            event.preventDefault();
            setActiveIndex((current) => (current - 1 + items.length) % items.length);
            return;
          }
          if (event.key === 'Enter' && items[safeIndex]) {
            event.preventDefault();
            items[safeIndex].action();
            onClose();
          }
        }}
      >
        <div className="cmd-head">
          <Icon name="search" size={16} />
          <input
            ref={inputRef}
            className="cmd-input"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            placeholder="Nhập tên nhóm, màn hình hoặc lệnh…"
            aria-label="Tìm kiếm lệnh hoặc nhóm"
          />
          <kbd className="kbd">ESC</kbd>
        </div>
        <div className="cmd-list" role="listbox">
          {items.length === 0 ? (
            <p className="cmd-empty">Không tìm thấy kết quả phù hợp.</p>
          ) : (
            items.map((item, idx) => (
              <button
                type="button"
                key={item.id}
                role="option"
                aria-selected={idx === safeIndex}
                className={idx === safeIndex ? 'cmd-item active' : 'cmd-item'}
                onMouseEnter={() => setActiveIndex(idx)}
                onClick={() => {
                  item.action();
                  onClose();
                }}
              >
                <Icon name={item.icon} size={16} />
                <span className="cmd-item-label">{item.label}</span>
                <span className="cmd-item-meta">{item.meta}</span>
              </button>
            ))
          )}
        </div>
        <div className="cmd-foot">
          <span><kbd className="kbd">↑↓</kbd> Di chuyển</span>
          <span><kbd className="kbd">↵</kbd> Mở</span>
          <span><kbd className="kbd">ESC</kbd> Đóng</span>
        </div>
      </div>
    </div>
  );
}

function CreateGroupModal({
  open,
  token,
  userId,
  onClose,
  onCreateGroup,
}: {
  open: boolean;
  token: string;
  userId: number;
  onClose: () => void;
  onCreateGroup: (name: string, description: string, avatar?: GroupAvatarInput) => Promise<Group>;
}) {
  const toast = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [urlInputOpen, setUrlInputOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const [createdGroup, setCreatedGroup] = useState<Group | null>(null);
  const [candidates, setCandidates] = useState<InviteCandidate[]>([]);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [inviteQuery, setInviteQuery] = useState('');
  const [searchResults, setSearchResults] = useState<InviteCandidate[]>([]);
  const [searching, setSearching] = useState(false);
  const [invitedIds, setInvitedIds] = useState<number[]>([]);
  const [invitingId, setInvitingId] = useState<number | null>(null);

  const [lastOpen, setLastOpen] = useState(false);
  const nameRef = useRef<HTMLInputElement | null>(null);
  const inviteSearchRef = useRef<HTMLInputElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) {
      setName('');
      setDescription('');
      setAvatarFile(null);
      setAvatarPreview(null);
      setAvatarUrl('');
      setUrlInputOpen(false);
      setBusy(false);
      setCreatedGroup(null);
      setCandidates([]);
      setLoadingCandidates(false);
      setInviteQuery('');
      setSearchResults([]);
      setSearching(false);
      setInvitedIds([]);
      setInvitingId(null);
    }
  }

  useEffect(() => {
    if (!open) return undefined;
    const frame = window.requestAnimationFrame(() => {
      if (createdGroup) inviteSearchRef.current?.focus();
      else nameRef.current?.focus();
    });
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, createdGroup, onClose]);

  useEffect(() => {
    return () => {
      if (avatarPreview && avatarPreview.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  useEffect(() => {
    if (!open || !createdGroup) return undefined;
    const controller = new AbortController();
    let active = true;
    void (async () => {
      try {
        const list = await api.getInviteCandidates(createdGroup.id, token, controller.signal);
        if (!active) return;
        setCandidates(list);
      } catch {
        /* ignore candidate load errors */
      } finally {
        if (active) setLoadingCandidates(false);
      }
    })();
    return () => {
      active = false;
      controller.abort();
    };
  }, [open, createdGroup, token]);

  useEffect(() => {
    if (!open || !createdGroup) return undefined;
    const query = inviteQuery.trim();
    if (query.length < 2) return undefined;
    const controller = new AbortController();
    let active = true;
    const timer = window.setTimeout(() => {
      setSearching(true);
      void (async () => {
        try {
          const users = await api.searchUsers(query, token, controller.signal);
          if (!active) return;
          setSearchResults(
            users
              .filter((person) => person.id !== userId)
              .map((person) => ({
                ...person,
                invited: invitedIds.includes(person.id),
              })),
          );
        } catch {
          /* ignore */
        } finally {
          if (active) setSearching(false);
        }
      })();
    }, 240);
    return () => {
      active = false;
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [open, createdGroup, inviteQuery, token, userId, invitedIds]);

  if (!open) return null;

  const pickFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      toast('Chỉ hỗ trợ ảnh JPEG, PNG, WebP hoặc GIF.', 'bad');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast('Ảnh đại diện nhóm tối đa 5 MB.', 'bad');
      return;
    }
    if (avatarPreview && avatarPreview.startsWith('blob:')) {
      URL.revokeObjectURL(avatarPreview);
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setAvatarUrl('');
  };

  const clearAvatar = () => {
    if (avatarPreview && avatarPreview.startsWith('blob:')) {
      URL.revokeObjectURL(avatarPreview);
    }
    setAvatarFile(null);
    setAvatarPreview(null);
    setAvatarUrl('');
  };

  const resolvedPreview = avatarPreview || (avatarUrl.trim().startsWith('http') ? avatarUrl.trim() : null);

  const submitCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    const cleanName = name.trim();
    if (!cleanName) {
      toast('Nhập tên cho nhóm học tập.', 'bad');
      nameRef.current?.focus();
      return;
    }
    setBusy(true);
    try {
      const group = await onCreateGroup(cleanName, description.trim(), {
        file: avatarFile,
        url: avatarUrl.trim() || undefined,
      });
      setLoadingCandidates(true);
      setCreatedGroup(group);
    } catch (caught) {
      toast(caught instanceof Error ? caught.message : 'Không tạo được nhóm.', 'bad');
    } finally {
      setBusy(false);
    }
  };

  const sendInvite = async (person: InviteCandidate) => {
    if (!createdGroup || invitingId !== null) return;
    setInvitingId(person.id);
    try {
      await api.inviteMember(createdGroup.id, person.id, token);
      setInvitedIds((current) => (current.includes(person.id) ? current : [...current, person.id]));
      setCandidates((current) =>
        current.map((item) => (item.id === person.id ? { ...item, invited: true } : item)),
      );
      setSearchResults((current) =>
        current.map((item) => (item.id === person.id ? { ...item, invited: true } : item)),
      );
      toast(`Đã gửi lời mời tới ${person.name}.`);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Không gửi được lời mời.';
      if (/đã được gửi|đã mời/i.test(message)) {
        setInvitedIds((current) => (current.includes(person.id) ? current : [...current, person.id]));
      }
      toast(message, 'bad');
    } finally {
      setInvitingId(null);
    }
  };

  const needle = inviteQuery.trim().toLocaleLowerCase();
  const displayPeople: InviteCandidate[] = (() => {
    const filteredFriends = needle
      ? candidates.filter(
          (person) =>
            person.name.toLocaleLowerCase().includes(needle) ||
            (person.username ?? '').toLocaleLowerCase().includes(needle) ||
            person.email.toLocaleLowerCase().includes(needle),
        )
      : candidates;
    if (needle.length < 2) return filteredFriends;
    const seen = new Set(filteredFriends.map((person) => person.id));
    const merged = [...filteredFriends];
    for (const person of searchResults) {
      if (!seen.has(person.id)) {
        seen.add(person.id);
        merged.push(person);
      }
    }
    return merged;
  })();

  return (
    <div className="cmd-backdrop" onClick={onClose} role="presentation">
      <div
        className="cgm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cgm-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="cgm-top">
          <div className="cgm-steps">
            <span className={!createdGroup ? 'cgm-step active' : 'cgm-step done'}>
              <i className="num">{createdGroup ? '✓' : '01'}</i>
              <span>Thiết lập nhóm</span>
            </span>
            <span className="cgm-step-line" aria-hidden="true" />
            <span className={createdGroup ? 'cgm-step active' : 'cgm-step'}>
              <i className="num">02</i>
              <span>Mời thành viên</span>
            </span>
          </div>
          <button
            type="button"
            className="cgm-close"
            onClick={onClose}
            aria-label="Đóng hộp thoại"
            title="Đóng (ESC)"
          >
            <Icon name="close" size={14} />
          </button>
        </div>

        {!createdGroup ? (
          <form className="cgm-body" onSubmit={submitCreate} noValidate>
            <div className="cgm-hero">
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                style={{ display: 'none' }}
                onChange={pickFile}
              />
              <button
                type="button"
                className={resolvedPreview ? 'cgm-avatar-picker has-image' : 'cgm-avatar-picker'}
                onClick={() => fileRef.current?.click()}
                title="Bấm để tải ảnh đại diện nhóm"
              >
                {resolvedPreview ? (
                  <img src={resolvedPreview} alt="Ảnh đại diện nhóm" />
                ) : (
                  <span className="cgm-avatar-placeholder">
                    {name.trim() ? (
                      <span className="cgm-avatar-initials">{initials(name)}</span>
                    ) : (
                      <Icon name="image" size={26} />
                    )}
                  </span>
                )}
                <span className="cgm-avatar-badge" aria-hidden="true">
                  <Icon name="plus" size={13} />
                </span>
              </button>

              <h2 className="cgm-title" id="cgm-title">
                {name.trim() || 'Khởi tạo không gian nhóm'}
              </h2>
              <p className="cgm-subtitle">
                Đặt biểu tượng tròn và tên nhóm. Bước tiếp theo bạn có thể mời bạn bè tham gia ngay.
              </p>

              <div className="cgm-avatar-pills">
                <button
                  type="button"
                  className="cgm-pill-btn"
                  onClick={() => fileRef.current?.click()}
                >
                  <Icon name="image" size={13} />
                  <span>{resolvedPreview ? 'Đổi ảnh khác' : 'Tải ảnh từ máy'}</span>
                </button>
                <button
                  type="button"
                  className={urlInputOpen ? 'cgm-pill-btn active' : 'cgm-pill-btn'}
                  onClick={() => setUrlInputOpen((current) => !current)}
                >
                  <span>Dán link ảnh</span>
                </button>
                {resolvedPreview ? (
                  <button
                    type="button"
                    className="cgm-pill-btn danger"
                    onClick={clearAvatar}
                  >
                    <span>Xoá ảnh</span>
                  </button>
                ) : null}
              </div>

              {urlInputOpen ? (
                <input
                  className="field cgm-url-input"
                  value={avatarUrl}
                  onChange={(event) => {
                    setAvatarUrl(event.target.value);
                    if (avatarFile) {
                      if (avatarPreview && avatarPreview.startsWith('blob:')) {
                        URL.revokeObjectURL(avatarPreview);
                      }
                      setAvatarFile(null);
                      setAvatarPreview(null);
                    }
                  }}
                  placeholder="https://example.com/group-icon.png"
                  aria-label="Liên kết ảnh đại diện nhóm"
                />
              ) : null}
            </div>

            <div className="cgm-fields">
              <div className="cgm-field-group">
                <div className="cgm-label-row">
                  <label className="field-label" htmlFor="cgm-group-name">
                    Tên nhóm học tập
                  </label>
                  <span className="cgm-char num">{name.length}/120</span>
                </div>
                <input
                  id="cgm-group-name"
                  ref={nameRef}
                  className="field"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Ví dụ: Đồ án Trí tuệ nhân tạo · Nhóm 04"
                  maxLength={120}
                  required
                />
              </div>

              <div className="cgm-field-group">
                <div className="cgm-label-row">
                  <label className="field-label" htmlFor="cgm-group-desc">
                    Mục tiêu hoặc lịch họp (không bắt buộc)
                  </label>
                  <span className="cgm-char num">{description.length}/500</span>
                </div>
                <input
                  id="cgm-group-desc"
                  className="field"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Ví dụ: Sprint tối thứ Tư hàng tuần · Mục tiêu điểm A+"
                  maxLength={500}
                />
              </div>
            </div>

            <div className="cgm-foot">
              <button type="button" className="btn-ghost" onClick={onClose}>
                Huỷ bỏ
              </button>
              <button type="submit" className="btn" disabled={busy || name.trim().length === 0}>
                <span>{busy ? 'Đang tạo nhóm…' : 'Tạo nhóm & Mời thành viên'}</span>
                <Icon name="arrow-right" size={14} />
              </button>
            </div>
          </form>
        ) : (
          <div className="cgm-body">
            <div className="cgm-created-banner">
              <Avatar name={createdGroup.name} url={createdGroup.avatar_url} size={44} />
              <div className="cgm-created-meta">
                <div className="cgm-created-top">
                  <span className="grow-code num">GRP-{String(createdGroup.id).padStart(2, '0')}</span>
                  <span className="cgm-created-badge">ĐÃ KHỞI TẠO</span>
                </div>
                <h2 className="cgm-created-name" id="cgm-title">{createdGroup.name}</h2>
                {createdGroup.description ? (
                  <p className="cgm-created-desc">{createdGroup.description}</p>
                ) : null}
              </div>
            </div>

            <div className="cgm-invite-box">
              <div className="cgm-label-row">
                <label className="field-label" htmlFor="cgm-invite-search">
                  Mời bạn bè hoặc tìm thành viên vào nhóm
                </label>
                {invitedIds.length > 0 ? (
                  <span className="cgm-invited-count num">Đã mời {invitedIds.length} người</span>
                ) : null}
              </div>

              <div className="cgm-search-wrap">
                <Icon name="search" size={14} />
                <input
                  id="cgm-invite-search"
                  ref={inviteSearchRef}
                  value={inviteQuery}
                  onChange={(event) => {
                    const next = event.target.value;
                    setInviteQuery(next);
                    if (next.trim().length < 2) {
                      setSearchResults([]);
                      setSearching(false);
                    }
                  }}
                  placeholder="Tìm theo tên, @username hoặc email…"
                  aria-label="Tìm bạn bè hoặc người dùng để mời vào nhóm"
                />
                {inviteQuery ? (
                  <button
                    type="button"
                    className="cgm-search-clear"
                    onClick={() => {
                      setInviteQuery('');
                      setSearchResults([]);
                      setSearching(false);
                    }}
                    aria-label="Xoá từ khoá"
                  >
                    <Icon name="close" size={12} />
                  </button>
                ) : null}
              </div>

              <div className="cgm-invite-list">
                {loadingCandidates && displayPeople.length === 0 ? (
                  <p className="cgm-invite-empty">Đang tải danh sách bạn bè…</p>
                ) : displayPeople.length === 0 ? (
                  <p className="cgm-invite-empty">
                    {searching
                      ? 'Đang tìm người dùng…'
                      : inviteQuery.trim().length >= 2
                        ? `Không tìm thấy người dùng khớp với “${inviteQuery}”.`
                        : 'Nhập tên, @username hoặc email ở ô trên để tìm và mời bạn học.'}
                  </p>
                ) : (
                  displayPeople.map((person) => {
                    const isInvited = Boolean(person.invited || invitedIds.includes(person.id));
                    const isInviting = invitingId === person.id;
                    return (
                      <div className="cgm-person" key={person.id}>
                        <Avatar name={person.name} url={person.avatar_url} size={34} />
                        <div className="cgm-person-info">
                          <span className="cgm-person-name">{person.name}</span>
                          <span className="cgm-person-sub">
                            {person.username ? `@${person.username}` : person.email}
                          </span>
                        </div>
                        <button
                          type="button"
                          className={isInvited ? 'cgm-invite-btn invited' : 'cgm-invite-btn'}
                          disabled={isInvited || isInviting}
                          onClick={() => void sendInvite(person)}
                        >
                          {isInvited ? (
                            <>
                              <Icon name="check" size={13} />
                              <span>Đã mời</span>
                            </>
                          ) : (
                            <>
                              <Icon name="plus" size={13} />
                              <span>{isInviting ? 'Đang gửi…' : 'Mời'}</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="cgm-foot">
              <button type="button" className="btn-ghost" onClick={onClose}>
                Để sau
              </button>
              <button type="button" className="btn" onClick={onClose}>
                <span>{invitedIds.length > 0 ? 'Hoàn tất · Vào nhóm' : 'Vào không gian nhóm'}</span>
                <Icon name="arrow-right" size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
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
  apiState: ApiState;
  theme: Theme;
  onToggleTheme: () => void;
  onNavigate: (route: Route) => void;
  onCreateGroup: (name: string, description: string, avatar?: GroupAvatarInput) => Promise<Group>;
  onReloadGroups: () => void;
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
  apiState,
  theme,
  onToggleTheme,
  onNavigate,
  onCreateGroup,
  onReloadGroups,
  onTasksChanged,
  onUserChange,
  onLogout,
  onStartTour,
}: ShellProps) {
  const pageRef = useRef<HTMLDivElement | null>(null);
  const [commandOpen, setCommandOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [railCollapsed, setRailCollapsed] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem('studysync.railCollapsed') === '1';
    } catch {
      return false;
    }
  });
  usePageMotion(routeKey(route), pageRef);

  const openNewGroup = useCallback(() => {
    setCreateModalOpen(true);
  }, []);

  const toggleRailCollapsed = useCallback(() => {
    setRailCollapsed((current) => {
      const next = !current;
      try {
        window.localStorage.setItem('studysync.railCollapsed', next ? '1' : '0');
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const { user, token } = session;
  const activeGroup =
    route.name === 'group' ? groups.find((group) => group.id === route.groupId) : undefined;

  const retriedGroupRef = useRef<number | null>(null);
  useEffect(() => {
    if (route.name !== 'group' || activeGroup || groupsLoading || groupsError) return;
    if (retriedGroupRef.current === route.groupId) return;
    retriedGroupRef.current = route.groupId;
    onReloadGroups();
  }, [route, activeGroup, groupsLoading, groupsError, onReloadGroups]);

  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCommandOpen((current) => !current);
      } else if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'b') {
        event.preventDefault();
        toggleRailCollapsed();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [toggleRailCollapsed]);

  const missingGroup =
    route.name === 'group' && !groupsLoading && !groupsError && !activeGroup;

  const routeCrumb =
    route.name === 'home'
      ? 'Tổng quan'
      : route.name === 'friends'
        ? 'Bạn bè'
        : route.name === 'notifications'
          ? 'Thông báo'
          : route.name === 'profile'
            ? 'Hồ sơ'
            : activeGroup?.name ?? 'Không gian nhóm';

  return (
    <div className={railCollapsed ? 'app rail-collapsed' : 'app'}>
      <a className="skip" href="#main">
        Tới nội dung
      </a>

      <Rail
        user={user}
        groups={groups}
        route={route}
        unread={notifications.unreadCount}
        notifications={notifications}
        theme={theme}
        collapsed={railCollapsed}
        onToggleCollapsed={toggleRailCollapsed}
        onToggleTheme={onToggleTheme}
        onOpenCommand={() => setCommandOpen(true)}
        onNavigate={onNavigate}
        onNewGroup={openNewGroup}
        onStartTour={onStartTour}
        onLogout={onLogout}
        onGroupsChanged={onTasksChanged}
      />

      <main className="main" id="main" tabIndex={-1}>
        <header className="wbar">
          <div className="wbar-crumbs">
            <button type="button" className="wbar-root" onClick={() => onNavigate(HOME)}>
              StudySync
            </button>
            <span className="wbar-sep" aria-hidden="true">/</span>
            {route.name === 'group' ? (
              <>
                <button type="button" className="wbar-root" onClick={() => onNavigate(HOME)}>
                  Nhóm học tập
                </button>
                <span className="wbar-sep" aria-hidden="true">/</span>
              </>
            ) : null}
            <span className="wbar-current">{routeCrumb}</span>
          </div>

          <div className="wbar-actions">
            <span className="wbar-telemetry" title="Trạng thái kết nối hệ thống">
              <span className={apiState === 'ok' ? 'sdot ok' : apiState === 'down' ? 'sdot bad' : 'sdot'} />
              <span>{apiState === 'ok' ? 'Đồng bộ thời gian thực' : apiState === 'down' ? 'Mất kết nối API' : 'Đang kiểm tra…'}</span>
            </span>
            <button type="button" className="btn-ghost btn-sm" onClick={() => setCommandOpen(true)}>
              <Icon name="search" size={14} />
              <span>Lệnh nhanh</span>
              <kbd className="kbd">⌘K</kbd>
            </button>
            <button type="button" className="btn btn-sm" onClick={openNewGroup}>
              <Icon name="plus" size={14} />
              <span>Nhóm mới</span>
            </button>
          </div>
        </header>

        <div className="page" ref={pageRef}>
          {route.name === 'home' ? (
            <Home
              user={user}
              groups={groups}
              loading={groupsLoading}
              error={groupsError}
              onReload={onReloadGroups}
              onOpenGroup={(group) => onNavigate({ name: 'group', groupId: group.id })}
              onNewGroup={openNewGroup}
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
                  <Icon name="arrow-left" size={15} />
                  <span>Tất cả nhóm</span>
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

      <CommandPalette
        open={commandOpen}
        groups={groups}
        theme={theme}
        onClose={() => setCommandOpen(false)}
        onNavigate={onNavigate}
        onNewGroup={openNewGroup}
        onToggleTheme={onToggleTheme}
        onStartTour={onStartTour}
      />

      <CreateGroupModal
        open={createModalOpen}
        token={token}
        userId={user.id}
        onClose={() => setCreateModalOpen(false)}
        onCreateGroup={onCreateGroup}
      />
    </div>
  );
}

function Workspace({ theme, onToggleTheme }: { theme: Theme; onToggleTheme: () => void }) {
  const toast = useToast();

  const [session, setSession] = useState<Session | null>(() => consumeOAuthRedirect() ?? readSession());
  const [booting, setBooting] = useState(() => readSession() !== null);
  const [apiState, setApiState] = useState<ApiState>('checking');
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(() => readSession() !== null);
  const [groupsError, setGroupsError] = useState<string | null>(null);
  const [tourNonce, setTourNonce] = useState(0);

  const token = session?.token ?? null;
  const notifications = useNotifications(token ?? '');

  const onRealtimeNotification = useCallback((notification: Notification) => {
    window.dispatchEvent(new CustomEvent('studysync:notification', { detail: notification }));
  }, []);

  const onRealtimeUnread = useCallback((signal: UnreadSignal) => {
    setGroups((current) =>
      current.map((group) =>
        group.id === signal.groupId
          ? { ...group, unread_count: Math.max(0, Number(group.unread_count ?? 0) + 1) }
          : group,
      ),
    );
  }, []);

  useUserRealtime({
    enabled: Boolean(token) && !booting,
    token: token ?? '',
    onNotification: onRealtimeNotification,
    onUnread: onRealtimeUnread,
  });

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
      tour = driver({
        animate: !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        allowClose: true,
        allowScroll: true,
        showProgress: true,
        nextBtnText: 'Tiếp theo',
        prevBtnText: 'Quay lại',
        doneBtnText: 'Hoàn tất',
        closeBtnLabel: 'Đóng hướng dẫn',
        popoverClass: 'studysync-tour-popover',
        overlayColor: '#040608',
        steps: [
          { element: '[data-tour="overview"]', popover: { title: 'Trung tâm điều hành', description: 'Theo dõi toàn bộ nhóm học tập, tiến độ công việc và hiệu suất hoàn thành theo thời gian thực.', side: 'bottom', align: 'start' } },
          { element: '[data-tour="group-list"]', popover: { title: 'Không gian nhóm', description: 'Mỗi nhóm tích hợp bảng việc kiểu Linear, kênh thảo luận trực tiếp và danh sách thành viên.', side: 'bottom', align: 'start' } },
          { element: '[data-tour="create-group"]', popover: { title: 'Khởi tạo nhóm mới', description: 'Tạo nhóm trong một giây và mời thành viên cùng lớp tham gia.', side: 'bottom', align: 'end' } },
          { element: '[data-tour="friends-nav"]', popover: { title: 'Mạng lưới bạn học', description: 'Kết nối bạn học tại đây để mời vào nhóm chỉ với một cú nhấp.', side: 'right', align: 'center' } },
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
      tour?.destroy();
      tour = null;
    };
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

  useEffect(() => {
    if (!token) return undefined;
    const onNotification = () => void loadGroups(true);
    window.addEventListener('studysync:notification', onNotification);
    return () => window.removeEventListener('studysync:notification', onNotification);
  }, [token, loadGroups]);

  useEffect(() => {
    if (!token) return undefined;
    const onGroupRead = (event: Event) => {
      const detail = (event as CustomEvent<{ groupId: number }>).detail;
      if (!detail || !Number.isSafeInteger(detail.groupId)) return;
      setGroups((current) =>
        current.map((group) =>
          group.id === detail.groupId
            ? { ...group, unread_count: 0, mention_count: 0 }
            : group,
        ),
      );
    };
    window.addEventListener('studysync:group-read', onGroupRead);
    return () => window.removeEventListener('studysync:group-read', onGroupRead);
  }, [token]);

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
    async (name: string, description: string, avatar?: GroupAvatarInput) => {
      if (!token) throw new Error('Chưa đăng nhập.');
      const group = await api.createGroup(name, description, token, avatar);
      setGroups((current) => [group, ...current]);
      toast(`Đã tạo nhóm ${group.name}.`);
      void loadGroups(true);
      navigate({ name: 'group', groupId: group.id });
      return group;
    },
    [token, toast, loadGroups, navigate],
  );

  const startTour = useCallback(() => {
    navigate(HOME);
    setTourNonce((value) => value + 1);
  }, [navigate]);

  if (!session) {
    return (
      <Landing
        onAuthed={handleAuthed}
        apiState={apiState}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />
    );
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
      apiState={apiState}
      theme={theme}
      onToggleTheme={onToggleTheme}
      onNavigate={navigate}
      onCreateGroup={createGroup}
      onReloadGroups={reloadGroups}
      onTasksChanged={() => void loadGroups(true)}
      onUserChange={handleUserChange}
      onLogout={() => void logout()}
      onStartTour={startTour}
    />
  );
}

export function WebApp() {
  const [theme, setTheme] = useState<Theme>(() => readTheme());
  useDesignSystem();
  useDocumentChrome();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      window.localStorage.setItem('studysync.theme', theme);
    } catch { /* ignore */ }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  }, []);

  return (
    <ToastProvider>
      <Workspace theme={theme} onToggleTheme={toggleTheme} />
    </ToastProvider>
  );
}
