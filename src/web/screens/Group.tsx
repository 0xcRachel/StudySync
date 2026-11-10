import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ChangeEvent, FormEvent, KeyboardEvent } from 'react';
import * as api from '../lib/api';
import type { Group, InviteCandidate, Member, Message, Task, TaskStatus, User } from '../lib/api';
import {
  NEXT_STATUS,
  ROLE_LABEL,
  formatTime,
  isOnline,
  localStamp,
  percent,
  plural,
} from '../lib/format';
import { refreshScrollTriggers, useTabsInk } from '../lib/motion';
import { useToast } from '../components/Toast';
import { TaskRow } from '../components/TaskRow';
import { Avatar, EmptyState, ErrorBar, Icon, SkeletonRows } from '../components/ui';
import { useGroupRealtime } from '../../lib/useGroupRealtime';

type Tab = 'tasks' | 'chat' | 'members';
type Filter = 'all' | TaskStatus;

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'todo', label: 'Cần làm' },
  { key: 'doing', label: 'Đang làm' },
  { key: 'done', label: 'Xong' },
];

const CHAT_EMOJIS = ['😀', '😂', '🥹', '😍', '🤔', '👏', '🙏', '🔥', '❤️', '🎉', '✅', '✨'];
const CHAT_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥', '🎉', '👏', '✅', '🙏'];
const CHAT_GIFTS = [
  { icon: '🎁', label: 'Hộp quà động viên' },
  { icon: '☕', label: 'Tặng một ly cà phê' },
  { icon: '🌟', label: 'Ngôi sao chăm chỉ' },
  { icon: '📚', label: 'Chồng sách tiếp sức' },
];

/** Escape hoặc bấm ra ngoài đóng popover; nếu không, chọn mục là đường thoát duy nhất. */
function useDismissPopovers(isOpen: boolean, close: () => void) {
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (event: globalThis.KeyboardEvent) => { if (event.key === 'Escape') close(); };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Element && target.closest('.chat-popover-anchor, .reaction-anchor, .emoji-menu, .gift-menu, .message-reaction-menu')) return;
      close();
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown, true);
    };
  }, [isOpen, close]);
}

function dayKey(value?: string | null): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value ?? '');
  if (match) return `${match[1]}-${match[2]}-${match[3]}`;
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? localDayKey(date) : '';
}

/**
 * dayKey so với chuỗi "YYYY-MM-DD HH:mm:ss" mà backend trả (giờ máy chủ = giờ
 * máy người dùng). toISOString().slice(0,10) lại cắt theo UTC, nên ở UTC+7 nó
 * lệch một ngày và "Hôm qua" không bao giờ khớp.
 */
function localDayKey(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function dayLabel(value?: string | null): string {
  const key = dayKey(value);
  if (!key) return '';
  const today = localDayKey(new Date());
  if (key === today) return 'Hôm nay';
  const yesterday = localDayKey(new Date(Date.now() - 86_400_000));
  if (key === yesterday) return 'Hôm qua';
  const date = new Date(`${key.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '';
  return `Thứ ${['nhật', 'hai', 'ba', 'tư', 'năm', 'sáu', 'bảy'][date.getDay()]}, ${date.getDate()}/${date.getMonth() + 1}`;
}

function sameMoment(a?: string | null, b?: string | null): boolean {
  return Boolean(a && b) && dayKey(a) === dayKey(b);
}

type PreviewMedia = {
  src: string;
  senderName: string;
  avatarUrl?: string | null;
  timestamp?: string;
};

function ImageLightbox({
  media,
  onClose,
}: {
  media: PreviewMedia;
  onClose: () => void;
}) {
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return createPortal(
    <div
      className="lightbox-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={`Xem trước ảnh từ ${media.senderName}`}
      onClick={onClose}
    >
      <header className="lightbox-bar" onClick={(event) => event.stopPropagation()}>
        <div className="lightbox-author">
          <Avatar name={media.senderName} url={media.avatarUrl} size={28} />
          <div>
            <div className="lightbox-sender">{media.senderName}</div>
            {media.timestamp ? <div className="lightbox-time num">{media.timestamp}</div> : null}
          </div>
        </div>
        <div className="lightbox-actions">
          <button
            type="button"
            className="btn-ghost btn-sm"
            onClick={() => setZoomed((current) => !current)}
          >
            {zoomed ? 'Thu nhỏ (100%)' : 'Phóng to (175%)'}
          </button>
          <a
            className="btn-ghost btn-sm"
            href={media.src}
            download="studysync-image.png"
          >
            Tải xuống
          </a>
          <button
            type="button"
            className="btn btn-sm"
            onClick={onClose}
            aria-label="Đóng xem trước ảnh"
          >
            <Icon name="close" size={14} />
            <span>Đóng</span>
          </button>
        </div>
      </header>

      <div className="lightbox-stage" onClick={onClose}>
        <img
          className={zoomed ? 'lightbox-img zoomed' : 'lightbox-img'}
          src={media.src}
          alt={`Ảnh gửi bởi ${media.senderName}`}
          onClick={(event) => {
            event.stopPropagation();
            setZoomed((current) => !current);
          }}
        />
      </div>
    </div>,
    document.body,
  );
}

function ChatImage({
  url,
  token,
  onLoaded,
  onPreview,
}: {
  url: string;
  token: string;
  onLoaded: () => void;
  onPreview: (src: string) => void;
}) {
  const [src, setSrc] = useState('');
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    let objectUrl = '';
    void fetch(`${api.API_BASE_URL}${url}`, { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal })
      .then((response) => { if (!response.ok) throw new Error('Không tải được ảnh.'); return response.blob(); })
      .then((blob) => { objectUrl = URL.createObjectURL(blob); setSrc(objectUrl); })
      .catch(() => { if (!controller.signal.aborted) setFailed(true); });
    return () => { controller.abort(); if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [url, token]);
  if (failed) return <span className="chat-image-error">Ảnh hiện không tải được.</span>;
  return src ? (
    <button
      type="button"
      className="chat-image-btn"
      onClick={() => onPreview(src)}
      aria-label="Xem trước ảnh kích thước lớn"
    >
      <img className="chat-image" src={src} alt="Ảnh được gửi trong cuộc trò chuyện" loading="lazy" onLoad={onLoaded} />
      <span className="chat-image-zoom-hint">Nhấp để xem ảnh</span>
    </button>
  ) : (
    <span className="chat-image-loading">Đang tải ảnh…</span>
  );
}

const WIDE_QUERY = '(min-width: 0px)';

function ChatSkeleton() {
  const rows = [240, 160, 310, 200, 140];
  return (
    <>
      <p className="sr-only" role="status">Đang tải tin nhắn…</p>
      <div className="chat chat-skeleton" aria-hidden="true">
        {rows.map((width, index) => (
          <div className="sk-msg" key={index}>
            <span className="sk sk-avatar" />
            <div style={{ display: 'grid', gap: 6 }}>
              <span className="sk" style={{ width: 110, height: 11 }} />
              <span className="sk sk-bubble" style={{ width }} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export function GroupScreen({
  group,
  groupId,
  token,
  user,
  onBack,
  onTasksChanged,
}: {
  group?: Group;
  groupId: number;
  token: string;
  user: User;
  onBack: () => void;
  onTasksChanged?: () => void;
}) {
  const toast = useToast();
  const [wide, setWide] = useState(() => window.matchMedia(WIDE_QUERY).matches);
  const [tab, setTab] = useState<Tab>('tasks');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [tasksLoaded, setTasksLoaded] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const [composerOpen, setComposerOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [adding, setAdding] = useState(false);
  const [taskAssignees, setTaskAssignees] = useState<number[]>([]);
  const [busyId, setBusyId] = useState<number | null>(null);

  const [chatDraft, setChatDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [replyTarget, setReplyTarget] = useState<Message | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState('');
  const [previewMedia, setPreviewMedia] = useState<PreviewMedia | null>(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const [reactionPickerId, setReactionPickerId] = useState<number | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [olderLoading, setOlderLoading] = useState(false);
  const [hasOlder, setHasOlder] = useState(false);
  const [chatQuery, setChatQuery] = useState('');
  const [memberQuery, setMemberQuery] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);
  // null = chưa ẩn; rỗng '' sẽ đụng đúng query của dấu "@" trần nên không
  // dùng làm giá trị mặc định được.
  const [mentionHiddenFor, setMentionHiddenFor] = useState<string | null>(null);

  const [inviteQuery, setInviteQuery] = useState('');
  const [results, setResults] = useState<InviteCandidate[]>([]);
  const [searching, setSearching] = useState(false);
  const [inviteCandidates, setInviteCandidates] = useState<InviteCandidate[]>([]);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [confirmDeleteGroup, setConfirmDeleteGroup] = useState(false);
  const [deletingGroup, setDeletingGroup] = useState(false);

  const tabsRef = useRef<HTMLDivElement | null>(null);
  const taskInputRef = useRef<HTMLInputElement | null>(null);
  const chatInputRef = useRef<HTMLTextAreaElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);
  const lastMessageIdRef = useRef(0);
  const pendingScrollToBottom = useRef(false);

  useTabsInk(tabsRef, tab);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    const run = async () => {
      try {
        if (tab === 'tasks') {
          const [data, groupMembers] = await Promise.all([api.getTasks(groupId, token, controller.signal), api.getMembers(groupId, token, controller.signal)]);
          if (active) {
            setTasks(data);
            setMembers(groupMembers);
            setTasksLoaded(true);
          }
        } else if (tab === 'chat') {
          const [data, groupMembers] = await Promise.all([
            api.getMessages(groupId, token, controller.signal),
            api.getMembers(groupId, token, controller.signal),
          ]);
          if (active) {
            setMessages(data);
            setHasOlder(data.length >= 100);
            lastMessageIdRef.current = data.reduce((latest, message) => Math.max(latest, message.id), 0);
            setMembers(groupMembers);
            pendingScrollToBottom.current = true;
          }
        } else {
          const data = await api.getMembers(groupId, token, controller.signal);
          if (active) setMembers(data);
        }
        // Ở desktop cột thành viên hiển thị cả lời mời, nên danh sách bạn bè
        // phải tải dù tab không bao giờ là "members".
        if (active && (tab === 'members' || wide)) {
          setInviteLoading(true);
          void api.getInviteCandidates(groupId, token, controller.signal).then((candidates) => { if (active) setInviteCandidates(candidates); }).catch(() => undefined).finally(() => { if (active) setInviteLoading(false); });
        }
      } catch (caught) {
        if (!active || controller.signal.aborted) return;
        setError(caught instanceof Error ? caught.message : 'Không tải được dữ liệu nhóm.');
      } finally {
        if (active) setLoading(false);
      }
    };

    void run();
    return () => {
      active = false;
      controller.abort();
    };
  }, [groupId, token, tab, wide, reloadKey]);

  const lastMessageId = messages.length > 0 ? messages[messages.length - 1].id : 0;

  /**
   * Từ khi khung chat là flex column chiếm hết chiều cao còn lại, danh sách tin
   * (.chat) là vùng cuộn riêng — không phải tài liệu, không phải .main. Mọi tính
   * toán vị trí cuộn phải đo trên đúng phần tử này.
   */
  const chatNearBottom = useCallback((offset = 140) => {
    const el = chatScrollRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < offset;
  }, []);

  const stickToBottom = useRef(true);
  const scrolledToMessageId = useRef(-1);

  /**
   * Ảnh tải xong SAU khi layout effect đã cuộn xuống đáy: chỗ trống ban đầu
   * chỉ là dòng "Đang tải ảnh…" ~18px, nên khi ảnh 420px xuất hiện, tin cuối
   * bị đẩy tụt xuống dưới mép cắt của danh sách — trông như bị ô soạn thảo
   * che mất. Dán lại đáy khi media sẵn sàng, nhưng chỉ khi người đọc đang ở
   * đáy để không kéo ai đang đọc sửng về cuối.
   */
  const restickAfterMedia = useCallback(() => {
    if (!stickToBottom.current) return;
    const el = chatScrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  // Sự kiện scroll của phần tử không nổi lên window nên phải gắn trực tiếp.
  useEffect(() => {
    const el = chatScrollRef.current;
    if (!el) return undefined;
    const onScroll = () => { stickToBottom.current = chatNearBottom(); };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [tab, chatNearBottom, lastMessageId]);

  /**
   * Nơi DUY NHẤT quyết định vị trí cuộn của khung chat. Chạy sau khi React đã
   * commit các dòng tin mới nên đo được chiều cao thật, và nhảy tức thay vì
   * animate — animate trên nội dung đang đổi chiều cao chính là thứ tạo cảm giác
   * "bị đẩy scroll".
   */
  useLayoutEffect(() => {
    const el = chatScrollRef.current;
    if (lastMessageId === 0 || !el) return;
    if (pendingScrollToBottom.current) {
      pendingScrollToBottom.current = false;
      stickToBottom.current = true;
    } else if (scrolledToMessageId.current === -1) {
      scrolledToMessageId.current = lastMessageId;
      return;
    } else if (scrolledToMessageId.current === lastMessageId) {
      return;
    } else if (!stickToBottom.current) {
      scrolledToMessageId.current = lastMessageId;
      return;
    }
    scrolledToMessageId.current = lastMessageId;
    el.scrollTop = el.scrollHeight;
  }, [lastMessageId]);

  // Đổi tab rồi quay lại: panel chat unmount nên phải reset con trỏ cuộn.
  useEffect(() => {
    if (tab !== 'chat') scrolledToMessageId.current = -1;
  }, [tab]);

  const handleRealtimeMessage = useCallback((message: Message) => {
    setMessages((current) => current.some((item) => item.id === message.id) ? current : [...current, message].slice(-300));
    // Không cuộn ở đây: useLayoutEffect dưới đây là nơi duy nhất quyết định vị
    // trí cuộn. Server cũng echo lại tin vừa gửi, nên cuộn ở cả hai chỗ là bị
    // giật (nhảy xuống đáy rồi kẹt lại giữa chừng).
  }, []);
  const handleRealtimeTasks = useCallback((next: Task[]) => setTasks(next), []);
  const handleRealtimeMembers = useCallback((next: Member[]) => setMembers(next), []);
  const handleRealtimeMessageUpdated = useCallback((message: Message) => setMessages((current) => current.map((item) => item.id === message.id ? message : item)), []);
  const handleRealtimeMessageDeleted = useCallback((messageId: number) => setMessages((current) => current.filter((item) => item.id !== messageId)), []);
  const { status: realtimeStatus, onlineUserIds, typingUsers, readByUser, sendTyping, sendRead } = useGroupRealtime({
    enabled: true,
    trackMessages: tab === 'chat',
    groupId,
    token,
    userId: user.id,
    lastMessageId: lastMessageIdRef,
    onMessage: handleRealtimeMessage,
    onMessageUpdated: handleRealtimeMessageUpdated,
    onMessageDeleted: handleRealtimeMessageDeleted,
    onTasks: handleRealtimeTasks,
    onMembers: handleRealtimeMembers,
  });

  useEffect(() => {
    if (tab !== 'chat' || realtimeStatus !== 'connected' || messages.length === 0 || document.visibilityState === 'hidden') return;
    sendRead(messages[messages.length - 1].id);
    // Badge trên sidebar về 0 ngay, thay vì chờ lần polling kế tiếp đối chiếu.
    window.dispatchEvent(new CustomEvent('studysync:group-read', { detail: { groupId } }));
  }, [tab, realtimeStatus, messages, sendRead, groupId]);

  // Periodic reconciliation catches reaction changes and provides a fallback if the socket is unavailable.
  useEffect(() => {
    if (tab !== 'chat') return undefined;
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'hidden') return;
      void api.getMessages(groupId, token).then((data) => {
        setMessages((current) => {
          const merged = new Map(current.map((message) => [message.id, message]));
          // Keep rows the reader paged back in; the endpoint only returns the
          // newest window, so slicing to it would drop loaded history.
          data.forEach((message) => merged.set(message.id, { ...merged.get(message.id), ...message }));
          return [...merged.values()].sort((a, b) => a.id - b.id).slice(-300);
        });
        lastMessageIdRef.current = data.reduce((latest, message) => Math.max(latest, message.id), lastMessageIdRef.current);
      }).catch(() => undefined);
    }, realtimeStatus === 'connected' ? 8000 : 1800);
    return () => window.clearInterval(interval);
  }, [tab, groupId, token, realtimeStatus]);

  useEffect(() => {
    if (tab !== 'tasks' && tab !== 'members') return undefined;
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'hidden') return;
      const request = tab === 'tasks'
        ? api.getTasks(groupId, token).then(setTasks)
        : api.getMembers(groupId, token).then(setMembers);
      void request.catch(() => undefined);
    }, realtimeStatus === 'connected' ? (tab === 'tasks' ? 15000 : 30000) : (tab === 'tasks' ? 3500 : 10000));
    return () => window.clearInterval(interval);
  }, [tab, groupId, token, realtimeStatus]);

  useEffect(() => {
    if (tab !== 'chat' || !chatDraft.trim()) return undefined;
    sendTyping(true);
    const timer = window.setTimeout(() => sendTyping(false), 1200);
    return () => window.clearTimeout(timer);
  }, [chatDraft, tab, realtimeStatus, sendTyping]);

  const selectTab = useCallback(
    (next: Tab) => {
      if (next === tab) return;
      setTab(next);
      if (next !== 'tasks') {
        setComposerOpen(false);
        setDraft('');
      }
      setLoading(true);
      setError('');
    },
    [tab],
  );

  /**
   * Đổi khổ màn hình là đổi cả cấu trúc. Ở khổ rộng kênh Thành viên có thư mục
   * riêng trong cột nội dung, nên không cần đẩy người dùng về Thảo luận nữa.
   */
  useEffect(() => {
    const query = window.matchMedia(WIDE_QUERY);
    const onChange = (event: MediaQueryListEvent) => {
      setWide(event.matches);
    };
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  const retry = () => {
    setLoading(true);
    setError('');
    setReloadKey((key) => key + 1);
  };

  const closeComposer = useCallback(() => {
    setComposerOpen(false);
    setDraft('');
    setTaskAssignees([]);
  }, []);

  const openComposer = () => {
    setComposerOpen(true);
    window.requestAnimationFrame(() => taskInputRef.current?.focus());
  };

  const closePopovers = useCallback(() => {
    setEmojiOpen(false);
    setGiftOpen(false);
    setReactionPickerId(null);
  }, []);
  useDismissPopovers(emojiOpen || giftOpen || reactionPickerId !== null, closePopovers);

  /** Nạp thêm tin nhắn cũ và giữ nguyên đoạn thread đang đọc thay vì nhảy xuống đáy. */
  const loadOlder = useCallback(async () => {
    if (olderLoading || messages.length === 0) return;
    const oldest = messages.reduce((lowest, message) => Math.min(lowest, message.id), Number.POSITIVE_INFINITY);
    const scroller = chatScrollRef.current;
    const previousHeight = scroller?.scrollHeight ?? 0;
    const previousTop = scroller?.scrollTop ?? 0;
    setOlderLoading(true);
    try {
      const data = await api.getMessages(groupId, token, undefined, oldest);
      setMessages((current) => {
        const merged = new Map(data.map((message) => [message.id, message]));
        current.forEach((message) => merged.set(message.id, { ...merged.get(message.id), ...message }));
        return [...merged.values()].sort((a, b) => a.id - b.id);
      });
      setHasOlder(data.length >= 100);
      window.requestAnimationFrame(() => {
        // Chèn tin cũ ở ĐẦU danh sách nên phải bù đúng phần chiều cao tăng thêm
        // vào scrollTop, nếu không đoạn đang đọc sẽ bị đẩy mất.
        if (!scroller) return;
        const growth = scroller.scrollHeight - previousHeight;
        if (growth > 0) scroller.scrollTop = previousTop + growth;
      });
    } catch (caught) {
      toast(caught instanceof Error ? caught.message : 'Không tải được tin nhắn cũ hơn.', 'bad');
    } finally {
      setOlderLoading(false);
    }
  }, [groupId, token, olderLoading, messages, toast]);

  const cycle = useCallback(
    async (task: Task) => {
      if (busyId !== null) return;
      const next = NEXT_STATUS[task.status];
      setBusyId(task.id);
      setTasks((current) =>
        current.map((item) => (item.id === task.id ? { ...item, status: next } : item)),
      );
      try {
        const updated = await api.updateTaskStatus(task, next, token);
        setTasks((current) =>
          current.map((item) => (item.id === task.id ? { ...item, ...updated } : item)),
        );
        onTasksChanged?.();
      } catch (caught) {
        setTasks((current) =>
          current.map((item) => (item.id === task.id ? { ...item, status: task.status } : item)),
        );
        toast(caught instanceof Error ? caught.message : 'Không đổi được trạng thái.', 'bad');
      } finally {
        setBusyId(null);
      }
    },
    [busyId, token, toast, onTasksChanged],
  );

  const submitTask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (adding) return;
    const title = draft.trim();
    if (title.length === 0) {
      toast('Nhập tên việc trước khi thêm.', 'bad');
      return;
    }
    if (title.length > 120) {
      toast('Tên việc tối đa 120 ký tự.', 'bad');
      return;
    }
    setAdding(true);
    try {
      const created = await api.createTask(groupId, title, token, taskAssignees);
      setTasks((current) => [...current, created]);
      setDraft('');
      setTaskAssignees([]);
      setFilter('all');
      onTasksChanged?.();
      refreshScrollTriggers();
      window.requestAnimationFrame(() => taskInputRef.current?.focus());
    } catch (caught) {
      toast(caught instanceof Error ? caught.message : 'Không thêm được việc.', 'bad');
    } finally {
      setAdding(false);
    }
  };

  const assignTask = async (task: Task, userIds: number[]) => {
    try {
      const updated = await api.assignTask(task.id, userIds, token);
      setTasks((current) => current.map((item) => item.id === task.id ? updated : item));
      toast('Đã cập nhật người phụ trách.');
    } catch (caught) {
      toast(caught instanceof Error ? caught.message : 'Không cập nhật được người phụ trách.', 'bad');
      throw caught;
    }
  };

  const renameTask = async (task: Task, title: string) => {
    try {
      const updated = await api.renameTask(task, title, token);
      setTasks((current) => current.map((item) => (item.id === task.id ? updated : item)));
      onTasksChanged?.();
    } catch (caught) {
      toast(caught instanceof Error ? caught.message : 'Không đổi được tên việc.', 'bad');
      throw caught;
    }
  };

  const removeTask = async (task: Task) => {
    // Giữ bản chụp để khôi phục nếu xoá thất bại, giống chiều cycle().
    const snapshot = tasks;
    setTasks((current) => current.filter((item) => item.id !== task.id));
    try {
      await api.deleteTask(task.id, token);
      toast('Đã xoá công việc.');
      onTasksChanged?.();
    } catch (caught) {
      setTasks(snapshot);
      toast(caught instanceof Error ? caught.message : 'Không xoá được công việc.', 'bad');
    }
  };

  const removeGroup = async () => {
    if (!confirmDeleteGroup) { setConfirmDeleteGroup(true); window.setTimeout(() => setConfirmDeleteGroup(false), 5000); return; }
    setDeletingGroup(true);
    try {
      await api.deleteGroup(groupId, token);
      toast('Đã xoá nhóm.');
      onBack();
    } catch (caught) {
      setDeletingGroup(false);
      setConfirmDeleteGroup(false);
      toast(caught instanceof Error ? caught.message : 'Không xoá được nhóm.', 'bad');
    }
  };

  const submitMessage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sending) return;
    const body = chatDraft.trim();
    if (body.length === 0 && !selectedImage) return;
    setSending(true);
    try {
      const mentionIds = members.filter((member) => body.includes(`@${member.name}`)).map((member) => member.id);
      const created = await api.sendMessage(groupId, body, token, replyTarget?.id, selectedImage, mentionIds);
      setMessages((current) => current.some((message) => message.id === created.id)
        ? current
        : [...current, { ...created, created_at: created.created_at ?? localStamp() }].slice(-300));
      lastMessageIdRef.current = Math.max(lastMessageIdRef.current, created.id);
      setChatDraft('');
      setReplyTarget(null);
      setSelectedImage(null);
      setImagePreviewUrl('');
      if (imageInputRef.current) imageInputRef.current.value = '';
      window.requestAnimationFrame(() => {
        chatInputRef.current?.focus();
      });
    } catch (caught) {
      toast(caught instanceof Error ? caught.message : 'Không gửi được tin nhắn.', 'bad');
    } finally {
      setSending(false);
    }
  };

  const chooseImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast('Ảnh tối đa 5 MB.', 'bad');
      event.currentTarget.value = '';
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      toast('Chọn ảnh JPEG, PNG, WebP hoặc GIF.', 'bad');
      event.currentTarget.value = '';
      return;
    }
    setSelectedImage(file);
    setImagePreviewUrl(URL.createObjectURL(file));
  };

  useEffect(() => () => { if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl); }, [imagePreviewUrl]);

  const mentionQuery = chatDraft.match(/(?:^|\s)@([\p{L}\p{N}_.-]*)$/u)?.[1];
  const mentionOptions = mentionQuery === undefined || mentionHiddenFor === mentionQuery ? [] : members
    .filter((member) => member.name.toLocaleLowerCase().includes(mentionQuery.toLocaleLowerCase()))
    .slice(0, 5);
  // Suy ra từ length thay vì reset bằng effect: danh sách đổi theo từng phím
  // gõ, effect sẽ ghi đè state giữa lúc người dùng đang điều hướng.
  const activeMention = mentionOptions.length > 0 ? mentionOptions[Math.min(mentionIndex, mentionOptions.length - 1)] : null;
  /**
   * Điều hướng bàn phím cho menu nhắc tên — ↑/↓ chọn, Enter/Tab cắm tên, Esc
   * ẩn cho tới khi người dùng gõ sang truy vấn khác. Không có nó thì Enter gửi
   * luôn tin nhắn với "@G" còn đang viết dở.
   */
  const onMentionKey = (event: KeyboardEvent<HTMLTextAreaElement>): boolean => {
    if (mentionOptions.length === 0) return false;
    if (event.key === 'ArrowDown') { event.preventDefault(); setMentionIndex((i) => (i + 1) % mentionOptions.length); return true; }
    if (event.key === 'ArrowUp') { event.preventDefault(); setMentionIndex((i) => (i - 1 + mentionOptions.length) % mentionOptions.length); return true; }
    if (event.key === 'Enter' || event.key === 'Tab') {
      event.preventDefault();
      if (activeMention) insertMention(activeMention.name);
      return true;
    }
    if (event.key === 'Escape') { event.preventDefault(); setMentionHiddenFor(mentionQuery ?? null); return true; }
    return false;
  };
  const insertEmoji = (emoji: string) => {
    setChatDraft((current) => `${current}${emoji}`);
    setEmojiOpen(false);
    chatInputRef.current?.focus();
  };
  const insertMention = (name: string) => {
    setChatDraft((current) => current.replace(/(?:^|\s)@[\p{L}\p{N}_.-]*$/u, (match) => `${match.startsWith(' ') ? ' ' : ''}@${name} `));
    setMentionIndex(0);
    setMentionHiddenFor(null);
    chatInputRef.current?.focus();
  };
  /** Nút @: cắm dấu @ để mở menu, giữ nguyên phần chữ đang gõ dở. */
  const startMention = () => {
    setChatDraft((current) => (/@[\p{L}\p{N}_.-]*$/u.test(current) ? current : `${current}${current === '' || /\s$/u.test(current) ? '' : ' '}@`));
    setMentionHiddenFor(null);
    setMentionIndex(0);
    chatInputRef.current?.focus();
  };
  const sendGift = (gift: (typeof CHAT_GIFTS)[number]) => {
    setChatDraft((current) => `${current}${current ? ' ' : ''}${gift.icon} ${gift.label} 🎉`);
    setGiftOpen(false);
    chatInputRef.current?.focus();
  };
  const reactToMessage = async (message: Message, emoji: string) => {
    try {
      const result = await api.toggleMessageReaction(message.id, emoji, token);
      setMessages((current) => current.map((item) => item.id === message.id ? { ...item, reactions: result.reactions } : item));
      setReactionPickerId(null);
    } catch (caught) {
      toast(caught instanceof Error ? caught.message : 'Không lưu được biểu cảm.', 'bad');
    }
  };
  const startEditingMessage = (message: Message) => { setEditingMessageId(message.id); setEditDraft(message.body); setDeleteConfirmId(null); };
  const saveEditedMessage = async (message: Message) => {
    const body = editDraft.trim();
    // An image-only message is allowed to have an empty caption, same as the API.
    if (body === message.body || (body === '' && !message.image_url)) { setEditingMessageId(null); return; }
    try {
      const saved = await api.editMessage(message.id, body, token);
      setMessages((current) => current.map((item) => item.id === message.id ? { ...item, body: saved.body, edited_at: localStamp() } : item));
      setEditingMessageId(null);
    } catch (caught) { toast(caught instanceof Error ? caught.message : 'Không sửa được tin nhắn.', 'bad'); }
  };
  const removeMessage = async (message: Message) => {
    if (deleteConfirmId !== message.id) { setDeleteConfirmId(message.id); return; }
    try {
      await api.deleteMessage(message.id, token);
      setMessages((current) => current.filter((item) => item.id !== message.id));
      setDeleteConfirmId(null);
      toast('Đã xoá tin nhắn.');
    } catch (caught) { toast(caught instanceof Error ? caught.message : 'Không xoá được tin nhắn.', 'bad'); }
  };
  const renderBody = (body: string) => {
    const names = members.map((member) => member.name).filter(Boolean);
    if (!names.length) return body;
    const escaped = names.map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const matcher = new RegExp(`(@(?:${escaped.join('|')}))(?=$|[\\s.,!?])`, 'gu');
    return body.split(matcher).map((part, index) => part.startsWith('@') && names.some((name) => part === `@${name}`)
      ? <span className="chat-mention" key={`${part}-${index}`}>{part}</span>
      : part);
  };

  const searchPeople = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = inviteQuery.trim();
    if (query.length < 2) {
      toast('Nhập ít nhất 2 ký tự để tìm.', 'bad');
      return;
    }
    setSearching(true);
    try {
      const data = await api.searchUsers(query, token);
      const memberIds = new Set(members.map((member) => member.id));
      const invitedIds = new Set(
        inviteCandidates.filter((person) => person.invited).map((person) => person.id),
      );
      setResults(
        data
          .filter((person) => !memberIds.has(person.id))
          .map((person) => ({ ...person, invited: invitedIds.has(person.id) })),
      );
    } catch (caught) {
      toast(caught instanceof Error ? caught.message : 'Không tìm được người dùng.', 'bad');
    } finally {
      setSearching(false);
    }
  };

  const invite = async (person: InviteCandidate) => {
    try {
      await api.inviteMember(groupId, person.id, token);
      setResults((current) => current.map((item) => item.id === person.id ? { ...item, invited: true } : item));
      setInviteCandidates((current) => current.map((item) => item.id === person.id ? { ...item, invited: true } : item));
      toast(`Đã gửi lời mời tới ${person.name}.`);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Không gửi được lời mời.';
      if (/đã được gửi|đã mời/i.test(message)) {
        setResults((current) => current.map((item) => item.id === person.id ? { ...item, invited: true } : item));
        setInviteCandidates((current) => current.map((item) => item.id === person.id ? { ...item, invited: true } : item));
      }
      toast(message, 'bad');
    }
  };

  const onTabKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    // Ở desktop tab Thành viên không tồn tại — điều hướng phải vòng quanh
    // đúng hai tab thật, nếu không phím mũi tên dừng ở một tab vô hình.
    const order: Tab[] = wide ? ['tasks', 'chat'] : ['tasks', 'chat', 'members'];
    const index = order.indexOf(tab);
    const next = event.key === 'ArrowRight' ? (index + 1) % order.length : (index + order.length - 1) % order.length;
    selectTab(order[next]);
  };

  const doneCount = tasks.filter((task) => task.status === 'done').length;
  const visible = tasks.filter((task) => filter === 'all' || task.status === filter);
  const canInvite = members.some(
    (member) => member.id === user.id && (member.role === 'owner' || member.role === 'admin'),
  );
  // Backend moderation of other people's messages allows owner/admin, so the
  // delete control has to appear for them too, not only for the sender.
  const canModerate = canInvite;
  /**
   * Tìm kiếm chạy trên danh sách đã tải, không gọi API: khung chat chỉ giữ
   * 300 tin gần nhất nên lọc phía client là đúng phạm vi người dùng đang thấy.
   */
  const chatNeedle = chatQuery.trim().toLocaleLowerCase();
  const chatSource = chatNeedle === ''
    ? messages
    : messages.filter((message) =>
        message.body.toLocaleLowerCase().includes(chatNeedle)
        || message.sender_name.toLocaleLowerCase().includes(chatNeedle));
  const chatRows = chatSource.map((message, index) => {
    const previous = index > 0 ? chatSource[index - 1] : undefined;
    return {
      message,
      showDay: !previous || !sameMoment(previous.created_at, message.created_at),
      continuation: Boolean(
        previous
        && sameMoment(previous.created_at, message.created_at)
        && previous.sender_id === message.sender_id
        && !message.reply_to
        && !previous.reply_to
        && !message.image_url
        && !previous.image_url,
      ),
    };
  });
  const latestDay = messages.length > 0 ? dayLabel(messages[messages.length - 1].created_at) : '';
  const headerMeta = tasksLoaded
    ? `${tasks.length} việc, ${doneCount} đã xong`
    : group
      ? `${group.task_count} việc, ${group.completed_count} đã xong`
      : '';
  const progress = percent(doneCount, tasks.length);
  const latestOwnMessageId = [...messages].reverse().find((message) => message.sender_id === user.id)?.id ?? 0;
  const latestReaders = Object.entries(readByUser)
    .filter(([readerId, value]) => Number(readerId) !== user.id && value.messageId >= latestOwnMessageId)
    .map(([, value]) => value.name);

  const isPresent = (member: Member) => onlineUserIds.includes(member.id) || isOnline(member.last_seen_at);
  const memberNeedle = memberQuery.trim().toLocaleLowerCase();
  // Nhóm theo vai trò trước, trong vai trò xếp người đang hoạt động lên trước —
  // Discord làm vậy, và vai trò đọc được từ màu tên nên khỏi cần cột nhãn.
  const memberGroups = (['owner', 'admin', 'member'] as const)
    .map((role) => ({
      role,
      people: members
        .filter((member) => (member.role ?? 'member') === role)
        .filter((member) => memberNeedle === ''
          || member.name.toLocaleLowerCase().includes(memberNeedle)
          || (member.username ?? '').toLocaleLowerCase().includes(memberNeedle))
        .sort((a, b) => Number(isPresent(b)) - Number(isPresent(a)) || a.name.localeCompare(b.name)),
    }))
    .filter((group) => group.people.length > 0);

  const channels = [
    { key: 'tasks' as const, label: 'công việc', count: tasks.length },
    { key: 'chat' as const, label: 'thảo-luận', count: 0 },
  ];

  return (
    <>
      <div className={wide ? 'group-layout wide' : 'group-layout'}>
        {wide ? (
          <nav className="channel-list" aria-label="Kênh của nhóm">
            <button type="button" className="channel-back" onClick={onBack}>
              <span className="channel-back-arrow" aria-hidden="true">‹</span>
              Tất cả nhóm
            </button>
            <div className="channel-server">
              <div className="channel-server-head">
                <Avatar name={group?.name ?? 'Nhóm'} url={group?.avatar_url} size={32} />
                <div className="channel-server-titles">
                  <span className="channel-server-tag num">GRP-{String(groupId).padStart(2, '0')}</span>
                  <span className="channel-server-name">{group?.name ?? 'Nhóm học tập'}</span>
                </div>
              </div>
              {group?.description ? (
                <span className="channel-server-desc">{group.description}</span>
              ) : null}
              <div className="channel-server-prog">
                <div className="channel-server-prog-row">
                  <span className="channel-server-meta">{headerMeta}</span>
                  <span className="channel-server-pct num">{progress}%</span>
                </div>
                <div className="meter">
                  <i style={{ width: `${progress}%` }} />
                </div>
              </div>
            </div>
            <p className="channel-section">Kênh chữ</p>
            {channels.map((channel) => (
              <button
                type="button"
                key={channel.key}
                className={tab === channel.key ? 'channel-row active' : 'channel-row'}
                aria-current={tab === channel.key ? 'true' : undefined}
                onClick={() => selectTab(channel.key)}
              >
                <span className="channel-hash" aria-hidden="true">#</span>
                <span className="channel-name">{channel.label}</span>
                {channel.count > 0 ? <span className="channel-count">{channel.count}</span> : null}
                {channel.key === 'chat' && Math.max(0, Number(group?.unread_count ?? 0)) > 0 ? (
                  <span className="channel-unread" aria-label="tin chưa đọc" />
                ) : null}
              </button>
            ))}
            <button
              type="button"
              id="channel-members"
              className={tab === 'members' ? 'channel-row people active' : 'channel-row people'}
              aria-current={tab === 'members' ? 'true' : undefined}
              onClick={() => selectTab('members')}
            >
              <Icon name="users" size={15} />
              <span className="channel-name">Thành viên</span>
              {members.length > 0 ? <span className="channel-count">{members.length}</span> : null}
            </button>
          </nav>
        ) : null}

        <div className="group-main">
        {!wide ? (
          <>
            <button type="button" className="back" onClick={onBack}>
              Tất cả nhóm
            </button>

            <div className="phead">
              <div>
                <h1 className="h1">{group?.name ?? 'Nhóm học tập'}</h1>
                <p className="psub">{headerMeta}</p>
              </div>
              {tab === 'tasks' && tasksLoaded ? (
                <div className="actions">
                  <span className="micro faint num">{progress}% xong</span>
                </div>
              ) : null}
            </div>
          </>
        ) : (
          <div className="channel-head">
            {tab === 'members' ? (
              <Icon name="users" size={17} />
            ) : (
              <span className="channel-hash large" aria-hidden="true">#</span>
            )}
            <h1 className="channel-title">
              {tab === 'tasks' ? 'công việc' : tab === 'chat' ? 'thảo-luận' : 'Thành viên'}
            </h1>
            <span className="channel-topic">
              {tab === 'tasks' ? headerMeta : tab === 'chat' ? `${messages.length} tin nhắn` : `${members.length} thành viên`}
            </span>
            {tab === 'chat' && messages.length > 0 ? (
              <input
                className="channel-search"
                value={chatQuery}
                onChange={(event) => setChatQuery(event.target.value)}
                placeholder={`Tìm trong ${messages.length} tin`}
                aria-label="Tìm tin nhắn trong nhóm"
              />
            ) : null}
            {tab === 'tasks' && tasksLoaded ? <span className="channel-badge">{progress}% xong</span> : null}
          </div>
        )}
        {!wide ? (
          <div className="tabs" role="tablist" aria-label="Nội dung nhóm" ref={tabsRef} onKeyDown={onTabKey}>
            <button
              type="button"
              role="tab"
              id="tab-tasks"
              aria-selected={tab === 'tasks'}
              aria-controls="panel-tasks"
              className="tab"
              onClick={() => selectTab('tasks')}
            >
              Công việc
              {tasks.length > 0 ? <span className="tab-count">{tasks.length}</span> : null}
            </button>
            <button
              type="button"
              role="tab"
              id="tab-chat"
              aria-selected={tab === 'chat'}
              aria-controls="panel-chat"
              className="tab"
              onClick={() => selectTab('chat')}
            >
              Thảo luận
            </button>
            <button
              type="button"
              role="tab"
              id="tab-members"
              aria-selected={tab === 'members'}
              aria-controls="panel-members"
              className="tab"
              onClick={() => selectTab('members')}
            >
              Thành viên
              {members.length > 0 ? <span className="tab-count">{members.length}</span> : null}
            </button>
            <span className="tab-ink" aria-hidden="true" />
          </div>
        ) : null}

        {error ? (
          <div style={{ marginTop: 18 }}>
            <ErrorBar message={error} onRetry={retry} />
          </div>
        ) : null}

        {tab === 'tasks' ? (
        <section id="panel-tasks" role="tabpanel" aria-labelledby="tab-tasks">
          <div className="filters">
            <div className="filter-set" role="group" aria-label="Lọc công việc">
              {FILTERS.map((item) => (
                <button
                  type="button"
                  key={item.key}
                  className="filter"
                  aria-pressed={filter === item.key}
                  onClick={() => setFilter(item.key)}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <button type="button" className="btn-quiet" onClick={composerOpen ? closeComposer : openComposer}>
              {composerOpen ? 'Đóng' : 'Thêm việc'}
            </button>
          </div>

          {composerOpen ? (
            <form className="composer" onSubmit={submitTask} noValidate>
              <div className="composer-row">
                <input
                  ref={taskInputRef}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Việc cần làm là gì?"
                  aria-label="Tên việc mới"
                  maxLength={120}
                />
                <button type="submit" className="btn" disabled={adding || draft.trim().length === 0}>
                  {adding ? 'Đang thêm…' : 'Thêm'}
                </button>
              </div>
              <fieldset className="task-assignee-picker">
                <legend>Giao cho thành viên</legend>
                <div>
                  {members.map((member) => (
                    <label key={member.id} className={taskAssignees.includes(member.id) ? 'selected' : ''}>
                      <input type="checkbox" checked={taskAssignees.includes(member.id)} onChange={() => setTaskAssignees((current) => current.includes(member.id) ? current.filter((id) => id !== member.id) : [...current, member.id])} />
                      <Avatar name={member.name} url={member.avatar_url} size={22} />
                      <span>{member.id === user.id ? 'Tôi' : member.name}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </form>
          ) : null}

          {loading ? (
            <SkeletonRows rows={4} />
          ) : error ? null : tasks.length === 0 ? (
            <EmptyState
              title="Nhóm chưa có việc nào."
              action={
                <button type="button" className="btn" onClick={openComposer}>
                  Thêm việc đầu tiên
                </button>
              }
            >
              Ghi ra việc đang chờ để cả nhóm thấy. Chỉ cần một dòng, ngắn cũng được.
            </EmptyState>
          ) : visible.length === 0 ? (
            <EmptyState
              title="Không có việc nào ở trạng thái này."
              action={
                <button type="button" className="btn-quiet" onClick={() => setFilter('all')}>
                  Xem tất cả
                </button>
              }
            />
          ) : (
            visible.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                busy={busyId === task.id}
                onCycle={cycle}
                members={members}
                onAssign={assignTask}
                token={token}
                userId={user.id}
                onRename={renameTask}
                onDelete={removeTask}
              />
            ))
          )}

          {!loading && !error && tasks.length > 0 ? (
            <p className="micro faint" style={{ marginTop: 18 }}>
              {plural(visible.length, 'Một việc đang hiển thị', `${visible.length} việc đang hiển thị`)}. Bấm
              vào vòng tròn để đổi trạng thái.
            </p>
          ) : null}
        </section>
      ) : null}

      {tab === 'chat' ? (
        <section id="panel-chat" role="tabpanel" aria-labelledby="tab-chat">
          <div className="chat-livebar" aria-live="polite">
            <span className={`chat-live-dot ${realtimeStatus}`} />
            <span>
              {realtimeStatus === 'connected'
                ? 'Đang kết nối trực tiếp'
                : realtimeStatus === 'offline'
                  ? 'Không đồng bộ trực tiếp được — hãy tải lại trang.'
                  : realtimeStatus === 'connecting'
                    ? 'Đang kết nối chat…'
                    : 'Đang kết nối lại…'}
            </span>
            {realtimeStatus === 'connected' ? <span className="chat-live-count">{Math.max(onlineUserIds.length - (onlineUserIds.includes(user.id) ? 1 : 0), 0)} thành viên khác đang trực tuyến</span> : null}
          </div>
          {loading ? (
            <ChatSkeleton />
          ) : error ? null : (
            <div className="chat" ref={chatScrollRef}>
              {!hasOlder && chatNeedle === '' ? (
                <div className="chat-welcome">
                  <div className="chat-welcome-icon" aria-hidden="true">#</div>
                  <h2 className="chat-welcome-title">Chào mừng đến với #thảo-luận!</h2>
                  <p className="chat-welcome-sub">
                    Đây là điểm khởi đầu của kênh thảo luận nhóm <strong>{group?.name ?? 'học tập'}</strong>. Mọi tin nhắn, tệp ảnh và phản hồi đều đồng bộ trực tiếp.
                  </p>
                </div>
              ) : null}
              {hasOlder ? (
                <div className="chat-older">
                  <button type="button" className="btn-quiet btn-sm" onClick={() => void loadOlder()} disabled={olderLoading}>
                    {olderLoading ? 'Đang tải…' : 'Tải tin nhắn cũ hơn'}
                  </button>
                </div>
              ) : null}
              {chatNeedle !== '' && chatSource.length === 0 ? (
                <p className="chat-search-empty">
                  Không có tin nhắn khớp với “{chatQuery}” trong {messages.length} tin đã tải.
                </p>
              ) : null}
              {chatRows.map(({ message, showDay, continuation }) => (
                <div className="chat-unit" key={`unit-${message.id}`}>
                  {showDay ? <p className="chat-day"><span>{dayLabel(message.created_at)}</span></p> : null}
                  <article
                    className={
                      message.reply_to
                        ? message.sender_id === user.id
                          ? 'msg me has-reply'
                          : 'msg has-reply'
                        : message.sender_id === user.id
                          ? 'msg me'
                          : 'msg'
                    }
                    key={message.id}
                    data-continuation={continuation ? 'true' : 'false'}
                  >
                    {message.reply_to ? (
                      <div className="msg-reply-spine">
                        <span className="msg-reply-elbow" aria-hidden="true" />
                        <Avatar name={message.reply_to.sender_name} url={message.reply_to.avatar_url} size={16} />
                        <strong className="msg-reply-author">@{message.reply_to.sender_name}</strong>
                        <span className="reply-preview">{message.reply_to.body || '[Hình ảnh đính kèm]'}</span>
                      </div>
                    ) : null}

                    <div className="msg-actions">
                      <div className="reaction-anchor">
                        <button
                          type="button"
                          className="msg-action"
                          onClick={() => setReactionPickerId((current) => current === message.id ? null : message.id)}
                          aria-label="Thả biểu cảm"
                          aria-expanded={reactionPickerId === message.id}
                          title="Thả biểu cảm"
                        >
                          <Icon name="smiley" size={15} />
                        </button>
                        {reactionPickerId === message.id ? (
                          <div className="message-reaction-menu">
                            {CHAT_REACTIONS.map((emoji) => (
                              <button type="button" key={emoji} onClick={() => void reactToMessage(message, emoji)}>
                                {emoji}
                              </button>
                            ))}
                          </div>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        className="msg-action"
                        onClick={() => {
                          setReplyTarget(message);
                          window.requestAnimationFrame(() => chatInputRef.current?.focus());
                        }}
                        aria-label={`Trả lời ${message.sender_name}`}
                        title={`Trả lời ${message.sender_name}`}
                      >
                        <Icon name="reply" size={15} />
                      </button>
                      {message.sender_id === user.id ? (
                        <button
                          type="button"
                          className="msg-action"
                          onClick={() => startEditingMessage(message)}
                          aria-label="Sửa tin nhắn"
                          title="Sửa tin nhắn"
                        >
                          <Icon name="pencil" size={15} />
                        </button>
                      ) : null}
                      {message.sender_id === user.id || canModerate ? (
                        <button
                          type="button"
                          className={deleteConfirmId === message.id ? 'msg-action danger confirm' : 'msg-action danger'}
                          onClick={() => void removeMessage(message)}
                          aria-label={deleteConfirmId === message.id ? 'Bấm lần nữa để xác nhận xoá' : 'Xoá tin nhắn'}
                          title={deleteConfirmId === message.id ? 'Bấm lần nữa để xác nhận xoá' : 'Xoá tin nhắn'}
                        >
                          {deleteConfirmId === message.id ? 'Xóa?' : <Icon name="trash" size={15} />}
                        </button>
                      ) : null}
                    </div>

                    {continuation ? (
                      <span className="msg-gutter" aria-hidden="true">
                        <span className="msg-hover-time">{formatTime(message.created_at)}</span>
                      </span>
                    ) : (
                      <Avatar name={message.sender_name} url={message.avatar_url} size={38} />
                    )}

                    <div className="msg-content">
                      {!continuation ? (
                        <div className="msg-head">
                          <span className="msg-name">{message.sender_name}</span>
                          {message.sender_id === user.id ? <span className="msg-self-tag">BẠN</span> : null}
                          <span className="msg-time">
                            {formatTime(message.created_at)}
                            {message.edited_at ? ' · (đã chỉnh sửa)' : ''}
                          </span>
                        </div>
                      ) : null}

                      {editingMessageId === message.id ? (
                        <div className="message-edit">
                          <textarea
                            value={editDraft}
                            onChange={(event) => setEditDraft(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === 'Escape') setEditingMessageId(null);
                              if (event.key === 'Enter' && !event.shiftKey) {
                                event.preventDefault();
                                void saveEditedMessage(message);
                              }
                            }}
                            maxLength={4000}
                            autoFocus
                          />
                          <div>
                            <button type="button" className="btn-quiet" onClick={() => setEditingMessageId(null)}>
                              Huỷ (Esc)
                            </button>
                            <button type="button" className="btn btn-sm" onClick={() => void saveEditedMessage(message)}>
                              Lưu thay đổi (Enter)
                            </button>
                          </div>
                        </div>
                      ) : message.body ? (
                        <p className="msg-body">
                          {renderBody(message.body)}
                          {continuation && message.edited_at ? <span className="msg-edited-inline"> (đã chỉnh sửa)</span> : null}
                        </p>
                      ) : null}

                      {message.image_url ? (
                        <ChatImage
                          url={message.image_url}
                          token={token}
                          onLoaded={restickAfterMedia}
                          onPreview={(src) =>
                            setPreviewMedia({
                              src,
                              senderName: message.sender_name,
                              avatarUrl: message.avatar_url,
                              timestamp: formatTime(message.created_at),
                            })
                          }
                        />
                      ) : null}

                      {message.reactions?.length ? (
                        <div className="msg-reactions">
                          {message.reactions.map((reaction) => (
                            <button
                              type="button"
                              key={reaction.emoji}
                              className={reaction.reacted ? 'msg-reaction active' : 'msg-reaction'}
                              aria-pressed={reaction.reacted}
                              onClick={() => void reactToMessage(message, reaction.emoji)}
                            >
                              {reaction.emoji}
                              <span>{reaction.count}</span>
                            </button>
                          ))}
                        </div>
                      ) : null}

                      {message.id === latestOwnMessageId && latestReaders.length > 0 ? (
                        <div className="message-read">
                          Đã xem bởi {latestReaders.slice(0, 3).join(', ')}
                          {latestReaders.length > 3 ? ` và ${latestReaders.length - 3} người khác` : ''}
                        </div>
                      ) : null}
                    </div>
                  </article>
                </div>
              ))}
              <p className="sr-only" role="status">{latestDay}</p>
            </div>
          )}
          {Object.keys(typingUsers).length > 0 ? <p className="chat-typing" aria-live="polite">{Object.values(typingUsers).join(', ')} đang nhập…</p> : null}
          <form className="chat-form" onSubmit={submitMessage}>
            <input ref={imageInputRef} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={chooseImage} aria-label="Chọn ảnh để gửi" />
            {replyTarget ? <div className="chat-compose-context"><span className="replying-label">Đang trả lời <strong>@{replyTarget.sender_name}</strong><span className="replying-preview">{replyTarget.body || '[Ảnh]'}</span></span><button type="button" className="context-close" onClick={() => setReplyTarget(null)} aria-label="Huỷ trả lời" title="Huỷ trả lời"><Icon name="close" size={15} /></button></div> : null}
            {selectedImage ? (
              <div className="chat-image-preview">
                <button
                  type="button"
                  className="chat-image-preview-thumb"
                  onClick={() =>
                    setPreviewMedia({
                      src: imagePreviewUrl,
                      senderName: user.name,
                      avatarUrl: user.avatar_url,
                      timestamp: 'Bản nháp đính kèm',
                    })
                  }
                  title="Nhấp để xem trước ảnh đính kèm"
                >
                  <img src={imagePreviewUrl} alt="Ảnh sắp gửi" />
                </button>
                <span>
                  {selectedImage.name}
                  <small>{(selectedImage.size / 1024 / 1024).toFixed(2)} MB · Nhấp vào ảnh để xem trước</small>
                </span>
                <button
                  type="button"
                  className="context-close"
                  onClick={() => {
                    setSelectedImage(null);
                    setImagePreviewUrl('');
                    if (imageInputRef.current) imageInputRef.current.value = '';
                  }}
                  aria-label="Bỏ ảnh"
                  title="Bỏ ảnh"
                >
                  <Icon name="close" size={15} />
                </button>
              </div>
            ) : null}
            <div className="chat-compose-row">
              <div className="chat-tools">
                <button type="button" className="chat-tool" onClick={() => imageInputRef.current?.click()} disabled={sending} aria-label="Đính kèm ảnh" title="Đính kèm ảnh"><Icon name="plus" /></button>
                <button type="button" className="chat-tool" onClick={() => imageInputRef.current?.click()} disabled={sending} aria-label="Tải ảnh lên" title="Tải ảnh lên"><Icon name="image" /></button>
              </div>
              <div className="chat-text-wrap">
                <textarea ref={chatInputRef} className="chat-textarea" value={chatDraft} onChange={(event) => { setChatDraft(event.target.value); setMentionIndex(0); }} onKeyDown={(event) => { if (onMentionKey(event)) return; if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} placeholder={replyTarget ? `Trả lời @${replyTarget.sender_name}…` : 'Nhắn tin tới #thảo-luận…'} aria-label="Tin nhắn mới" aria-keyshortcuts="Enter Shift+Enter" title="Enter để gửi, Shift+Enter để xuống dòng" maxLength={4000} />
                {mentionOptions.length > 0 ? <div className="mention-menu" role="listbox" aria-label="Gợi ý thành viên">{mentionOptions.map((member) => <button type="button" key={member.id} role="option" aria-selected={member.id === activeMention?.id} className="mention-option" onClick={() => insertMention(member.name)}><Avatar name={member.name} url={member.avatar_url} size={26} /><span>{member.name}<small>@{member.username ?? member.name.toLocaleLowerCase().replace(/\s+/g, '')}</small></span></button>)}</div> : null}
              </div>
              <div className="chat-tools">
                <button type="button" className="chat-tool" onClick={startMention} disabled={sending || members.length < 2} aria-label="Nhắc đến thành viên" title="Nhắc đến thành viên (@)"><Icon name="at" /></button>
                <div className="chat-popover-anchor"><button type="button" className="chat-tool" onClick={() => { setGiftOpen((open) => !open); setEmojiOpen(false); }} aria-label="Gửi quà" title="Quà tặng" aria-expanded={giftOpen}><Icon name="gift" /></button>{giftOpen ? <div className="gift-menu" aria-label="Chọn quà">{CHAT_GIFTS.map((gift) => <button type="button" key={gift.label} onClick={() => sendGift(gift)}><span>{gift.icon}</span>{gift.label}</button>)}</div> : null}</div>
                <div className="chat-popover-anchor"><button type="button" className="chat-tool" onClick={() => { setEmojiOpen((open) => !open); setGiftOpen(false); }} aria-label="Chọn emoji" title="Emoji" aria-expanded={emojiOpen}><Icon name="smiley" /></button>{emojiOpen ? <div className="emoji-menu" aria-label="Chọn emoji">{CHAT_EMOJIS.map((emoji) => <button type="button" key={emoji} onClick={() => insertEmoji(emoji)} aria-label={`Chèn ${emoji}`}>{emoji}</button>)}</div> : null}</div>
              </div>
              <button type="submit" className="chat-send" disabled={sending || (chatDraft.trim().length === 0 && !selectedImage)} aria-label="Gửi tin nhắn" title="Gửi tin nhắn">{sending ? <span className="send-dots">…</span> : <Icon name="send" size={17} />}</button>
            </div>
          </form>
          {previewMedia ? <ImageLightbox media={previewMedia} onClose={() => setPreviewMedia(null)} /> : null}
        </section>
      ) : null}

        {wide && tab === 'members' ? (
          <section className="member-directory" role="tabpanel" aria-labelledby="channel-members">
            <div className="shead tight">
              <h2 className="h2">Thành viên</h2>
              <span className="micro faint num">{members.length} người</span>
            </div>
            {loading ? (
              <SkeletonRows rows={3} />
            ) : error ? null : members.length === 0 ? (
              <EmptyState title="Chưa tải được thành viên." />
            ) : (
              <>
                <input
                  className="member-search directory-search"
                  value={memberQuery}
                  onChange={(event) => setMemberQuery(event.target.value)}
                  placeholder="Tìm theo tên hoặc @username"
                  aria-label="Tìm thành viên trong nhóm"
                />
                {memberGroups.length === 0 ? (
                  <p className="member-none">Không có ai khớp với “{memberQuery}”.</p>
                ) : null}
                {memberGroups.map((roleGroup) => (
                  <section className="member-group" key={roleGroup.role}>
                    <p className="member-section">
                      {ROLE_LABEL[roleGroup.role] ?? roleGroup.role}
                      <span className="member-section-count">{roleGroup.people.length}</span>
                    </p>
                    {roleGroup.people.map((member) => {
                      const present = isPresent(member);
                      return (
                        <div className={present ? 'member' : 'member offline'} key={member.id}>
                          <span className="member-avatar">
                            <Avatar name={member.name} url={member.avatar_url} size={34} />
                            <i className={present ? 'presence online' : 'presence'} aria-hidden="true" />
                          </span>
                          <div>
                            <div className="member-name">{member.name}{member.id === user.id ? ' (bạn)' : ''}</div>
                            <div className="member-sub">
                              {member.username ? `@${member.username} · ` : ''}{present ? 'Đang hoạt động' : 'Ngoại tuyến'}
                            </div>
                          </div>
                          <span className="member-role">{ROLE_LABEL[roleGroup.role] ?? roleGroup.role}</span>
                        </div>
                      );
                    })}
                  </section>
                ))}
              </>
            )}
          </section>
        ) : null}
        </div>

      {/* Cột thành viên là anh em trực tiếp của .group-main: mobile xếp xuống
          dưới nội dung, desktop nằm ở cột thứ ba của grid. */}
      {(wide || tab === 'members') ? (
        <section
          id="panel-members"
          className={wide ? 'group-side' : undefined}
          role={wide ? 'complementary' : 'tabpanel'}
          aria-label={wide ? 'Thành viên nhóm' : undefined}
          aria-labelledby={wide ? undefined : 'tab-members'}
        >
          {loading ? (
            <SkeletonRows rows={3} />
          ) : error ? null : members.length === 0 ? (
            <EmptyState title="Chưa tải được thành viên." />
          ) : (
            <>
              {members.length > 4 && !(wide && tab === 'members') ? (
                <input
                  className="member-search"
                  value={memberQuery}
                  onChange={(event) => setMemberQuery(event.target.value)}
                  placeholder="Tìm thành viên"
                  aria-label="Tìm thành viên trong nhóm"
                />
              ) : null}
              {memberGroups.length === 0 ? (
                <p className="member-none">Không có ai khớp với “{memberQuery}”.</p>
              ) : null}
              {memberGroups.map((group) => (
                <section className="member-group" key={group.role}>
                  <p className="member-section">
                    {ROLE_LABEL[group.role] ?? group.role}
                    <span className="member-section-count">{group.people.length}</span>
                  </p>
                  {group.people.map((member) => {
                    const present = isPresent(member);
                    return (
                      <div className={present ? `member role-${group.role}` : `member offline role-${group.role}`} key={member.id}>
                        <span className="member-avatar">
                          <Avatar name={member.name} url={member.avatar_url} size={36} />
                          <i className={present ? 'presence online' : 'presence'} aria-hidden="true" />
                        </span>
                        <span className="member-text">
                          <span className="member-name">{member.name}{member.id === user.id ? ' (bạn)' : ''}</span>
                          <span className="member-sub">
                            {present
                              ? 'Đang hoạt động'
                              : member.username
                                ? `@${member.username}`
                                : 'Không hoạt động'}
                          </span>
                        </span>
                      </div>
                    );
                  })}
                </section>
              ))}
            </>
          )}

          {canInvite ? (
            <>
              {/* Lời mời là việc thỉnh thoảng mới dùng, đừng chiếm nửa cột phải
                  của người đang xem danh sách thành viên. */}
              <details className="side-fold">
                <summary>
                  <span className="side-fold-title">Mời vào nhóm</span>
                  <span className="side-fold-count">{inviteCandidates.filter((person) => !person.invited).length}</span>
                </summary>
                <p className="small muted" style={{ marginBottom: 10 }}>
                  Mời nhanh người đã kết bạn, không cần nhập lại tên hay email.
                </p>
              <div className="friend-invite-list">
                {inviteLoading ? <span className="micro faint">Đang tải danh sách bạn bè…</span> : inviteCandidates.length === 0 ? <span className="micro faint">Tất cả bạn bè của bạn đã ở trong nhóm hoặc chưa có bạn bè để mời.</span> : inviteCandidates.map((person) => (
                  <div className="friend-invite" key={person.id}>
                    <Avatar name={person.name} url={person.avatar_url} size={34} />
                    <span><strong>{person.name}</strong><small>{person.username ? `@${person.username}` : person.email}</small></span>
                    <button type="button" className={person.invited ? 'btn btn-sm btn-ghost' : 'btn btn-sm'} disabled={person.invited} onClick={() => void invite(person)}>{person.invited ? 'Đã mời' : 'Mời vào nhóm'}</button>
                  </div>
                ))}
              </div>
              <div className="invite-search-divider"><span>hoặc tìm tài khoản khác</span></div>
              <form className="search-row" onSubmit={searchPeople}>
                <input
                  className="field"
                  value={inviteQuery}
                  onChange={(event) => setInviteQuery(event.target.value)}
                  placeholder="Tên hoặc email"
                  aria-label="Tìm người để mời"
                />
                <button type="submit" className="btn btn-ghost" disabled={searching}>
                  {searching ? 'Đang tìm…' : 'Tìm'}
                </button>
              </form>
              {results.map((person) => (
                <div className="search-result" key={person.id}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                    <Avatar name={person.name} url={person.avatar_url} size={30} />
                    <div style={{ minWidth: 0 }}>
                      <div className="member-name">{person.name}</div>
                      <div className="member-sub">{person.email}</div>
                    </div>
                  </div>
                  <button type="button" className="btn-quiet" disabled={person.invited} onClick={() => void invite(person)}>
                    {person.invited ? 'Đã mời' : 'Mời'}
                  </button>
                </div>
              ))}
              </details>

              <div className="danger-zone">
                <div>
                  <div className="danger-title">Xoá nhóm</div>
                  <p className="danger-hint">Công việc, tin nhắn và bình luận của nhóm sẽ mất theo. Không hoàn tác được.</p>
                </div>
                <button
                  type="button"
                  className={confirmDeleteGroup ? 'btn btn-sm btn-danger confirm' : 'btn btn-sm btn-danger-quiet'}
                  disabled={deletingGroup}
                  onClick={() => void removeGroup()}
                  aria-label={confirmDeleteGroup ? 'Bấm lần nữa để xoá nhóm' : 'Xoá nhóm'}
                >
                  {deletingGroup ? 'Đang xoá…' : confirmDeleteGroup ? 'Xoá thật?' : 'Xoá nhóm'}
                </button>
              </div>
            </>
          ) : null}
        </section>
      ) : null}
      </div>
    </>
  );
}
