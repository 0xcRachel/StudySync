import { useCallback, useEffect, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent, KeyboardEvent } from 'react';
import * as api from '../lib/api';
import type { Group, InviteCandidate, Member, Message, Task, TaskStatus, User } from '../lib/api';
import {
  NEXT_STATUS,
  ROLE_LABEL,
  formatStamp,
  isOnline,
  localStamp,
  percent,
  plural,
} from '../lib/format';
import { refreshScrollTriggers, useTabsInk } from '../lib/motion';
import { useToast } from '../components/Toast';
import { TaskRow } from '../components/TaskRow';
import { Avatar, EmptyState, ErrorBar, SkeletonRows } from '../components/ui';
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

function ChatImage({ url, token }: { url: string; token: string }) {
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
  return src ? <a className="chat-image-link" href={src} target="_blank" rel="noreferrer"><img className="chat-image" src={src} alt="Ảnh được gửi trong cuộc trò chuyện" loading="lazy" /></a> : <span className="chat-image-loading">Đang tải ảnh…</span>;
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
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const [reactionPickerId, setReactionPickerId] = useState<number | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const [inviteQuery, setInviteQuery] = useState('');
  const [results, setResults] = useState<InviteCandidate[]>([]);
  const [searching, setSearching] = useState(false);
  const [inviteCandidates, setInviteCandidates] = useState<InviteCandidate[]>([]);
  const [inviteLoading, setInviteLoading] = useState(false);

  const tabsRef = useRef<HTMLDivElement | null>(null);
  const taskInputRef = useRef<HTMLInputElement | null>(null);
  const chatInputRef = useRef<HTMLTextAreaElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const lastMessageIdRef = useRef(0);

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
            lastMessageIdRef.current = data.reduce((latest, message) => Math.max(latest, message.id), 0);
            setMembers(groupMembers);
          }
        } else {
          const data = await api.getMembers(groupId, token, controller.signal);
          if (active) {
            setMembers(data);
            setInviteLoading(true);
            void api.getInviteCandidates(groupId, token, controller.signal).then((candidates) => { if (active) setInviteCandidates(candidates); }).catch(() => undefined).finally(() => { if (active) setInviteLoading(false); });
          }
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
  }, [groupId, token, tab, reloadKey]);

  const handleRealtimeMessage = useCallback((message: Message) => {
    setMessages((current) => current.some((item) => item.id === message.id) ? current : [...current, message].slice(-100));
    const container = chatEndRef.current?.parentElement;
    const nearBottom = container ? container.scrollHeight - container.scrollTop - container.clientHeight < 140 : true;
    if (nearBottom) window.requestAnimationFrame(() => chatEndRef.current?.scrollIntoView({ block: 'nearest' }));
  }, []);
  const handleRealtimeTasks = useCallback((next: Task[]) => setTasks(next), []);
  const handleRealtimeMembers = useCallback((next: Member[]) => setMembers(next), []);
  const handleRealtimeMessageUpdated = useCallback((message: Message) => setMessages((current) => current.map((item) => item.id === message.id ? message : item)), []);
  const handleRealtimeMessageDeleted = useCallback((messageId: number) => setMessages((current) => current.filter((item) => item.id !== messageId)), []);
  const { status: realtimeStatus, onlineUserIds, typingUsers, readByUser, sendTyping, sendRead } = useGroupRealtime({
    enabled: !loading,
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
  }, [tab, realtimeStatus, messages, sendRead]);

  // Periodic reconciliation catches reaction changes and provides a fallback if the socket is unavailable.
  useEffect(() => {
    if (tab !== 'chat') return undefined;
    const interval = window.setInterval(() => {
      void api.getMessages(groupId, token).then((data) => {
        setMessages((current) => {
          const merged = new Map(current.map((message) => [message.id, message]));
          data.forEach((message) => merged.set(message.id, { ...merged.get(message.id), ...message }));
          return [...merged.values()].sort((a, b) => a.id - b.id).slice(-100);
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
        : [...current, { ...created, created_at: created.created_at ?? localStamp() }].slice(-100));
      lastMessageIdRef.current = Math.max(lastMessageIdRef.current, created.id);
      setChatDraft('');
      setReplyTarget(null);
      setSelectedImage(null);
      setImagePreviewUrl('');
      if (imageInputRef.current) imageInputRef.current.value = '';
      window.requestAnimationFrame(() => {
        chatInputRef.current?.focus();
        chatEndRef.current?.scrollIntoView({ block: 'nearest' });
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
  const mentionOptions = mentionQuery === undefined ? [] : members
    .filter((member) => member.name.toLocaleLowerCase().includes(mentionQuery.toLocaleLowerCase()))
    .slice(0, 5);
  const insertEmoji = (emoji: string) => {
    setChatDraft((current) => `${current}${emoji}`);
    setEmojiOpen(false);
    chatInputRef.current?.focus();
  };
  const insertMention = (name: string) => {
    setChatDraft((current) => current.replace(/(?:^|\s)@[\p{L}\p{N}_.-]*$/u, (match) => `${match.startsWith(' ') ? ' ' : ''}@${name} `));
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
    if (!body || body === message.body) { setEditingMessageId(null); return; }
    try {
      await api.editMessage(message.id, body, token);
      setMessages((current) => current.map((item) => item.id === message.id ? { ...item, body, edited_at: new Date().toISOString() } : item));
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
    const order: Tab[] = ['tasks', 'chat', 'members'];
    const index = order.indexOf(tab);
    const next = event.key === 'ArrowRight' ? (index + 1) % order.length : (index + order.length - 1) % order.length;
    selectTab(order[next]);
  };

  const doneCount = tasks.filter((task) => task.status === 'done').length;
  const visible = tasks.filter((task) => filter === 'all' || task.status === filter);
  const canInvite = members.some(
    (member) => member.id === user.id && (member.role === 'owner' || member.role === 'admin'),
  );
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

  return (
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
              <TaskRow key={`${task.id}-${task.assignees?.map((person) => person.id).join('-')}`} task={task} busy={busyId === task.id} onCycle={cycle} members={members} onAssign={assignTask} />
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
            <span>{realtimeStatus === 'connected' ? 'Đang kết nối trực tiếp' : realtimeStatus === 'connecting' ? 'Đang kết nối chat…' : 'Đang kết nối lại…'}</span>
            {realtimeStatus === 'connected' ? <span className="chat-live-count">{Math.max(onlineUserIds.length - (onlineUserIds.includes(user.id) ? 1 : 0), 0)} thành viên khác đang trực tuyến</span> : null}
          </div>
          {loading ? (
            <SkeletonRows rows={3} />
          ) : error ? null : messages.length === 0 ? (
            <EmptyState title="Chưa có tin nhắn nào.">
              Mở đầu bằng một câu ngắn: hôm nay nhóm làm gì, ai cần gì.
            </EmptyState>
          ) : (
            <div className="chat">
              {messages.map((message) => (
                <article
                  className={message.sender_id === user.id ? 'msg me' : 'msg'}
                  key={message.id}
                >
                  <Avatar name={message.sender_name} url={message.avatar_url} size={30} />
                  <div className="msg-content">
                    <div className="msg-head">
                      <span className="msg-name">{message.sender_name}</span>
                      <span className="msg-time">{formatStamp(message.created_at)}{message.edited_at ? ' · đã sửa' : ''}</span>
                      <div className="msg-actions">
                        <div className="reaction-anchor"><button type="button" className="msg-action" onClick={() => setReactionPickerId((current) => current === message.id ? null : message.id)} aria-label="Thả biểu cảm">☺</button>{reactionPickerId === message.id ? <div className="message-reaction-menu">{CHAT_REACTIONS.map((emoji) => <button type="button" key={emoji} onClick={() => void reactToMessage(message, emoji)}>{emoji}</button>)}</div> : null}</div>
                        <button type="button" className="msg-action" onClick={() => { setReplyTarget(message); window.requestAnimationFrame(() => chatInputRef.current?.focus()); }} aria-label={`Trả lời ${message.sender_name}`}>↩</button>
                        {message.sender_id === user.id ? <button type="button" className="msg-action" onClick={() => startEditingMessage(message)} aria-label="Sửa tin nhắn">✎</button> : null}
                        {message.sender_id === user.id ? <button type="button" className={deleteConfirmId === message.id ? 'msg-action danger confirm' : 'msg-action danger'} onClick={() => void removeMessage(message)} aria-label={deleteConfirmId === message.id ? 'Bấm lần nữa để xác nhận xoá' : 'Xoá tin nhắn'}>{deleteConfirmId === message.id ? 'Xóa?' : '×'}</button> : null}
                      </div>
                    </div>
                    {message.reply_to ? <div className="msg-reply-quote"><span className="reply-connector" aria-hidden="true" /><Avatar name={message.reply_to.sender_name} url={message.reply_to.avatar_url} size={18} /><span><strong>{message.reply_to.sender_name}</strong><span className="reply-preview">{message.reply_to.body || 'Ảnh đính kèm'}</span></span></div> : null}
                    {editingMessageId === message.id ? <div className="message-edit"><textarea value={editDraft} onChange={(event) => setEditDraft(event.target.value)} maxLength={4000} autoFocus /><div><button type="button" className="btn-quiet" onClick={() => setEditingMessageId(null)}>Huỷ</button><button type="button" className="btn btn-sm" onClick={() => void saveEditedMessage(message)}>Lưu</button></div></div> : <p className="msg-body">{renderBody(message.body)}</p>}
                    {message.reactions?.length ? <div className="msg-reactions">{message.reactions.map((reaction) => <button type="button" key={reaction.emoji} className={reaction.reacted ? 'msg-reaction active' : 'msg-reaction'} aria-pressed={reaction.reacted} onClick={() => void reactToMessage(message, reaction.emoji)}>{reaction.emoji}<span>{reaction.count}</span></button>)}</div> : null}
                    {message.image_url ? <ChatImage url={message.image_url} token={token} /> : null}
                    {message.id === latestOwnMessageId && latestReaders.length > 0 ? <div className="message-read">Đã xem bởi {latestReaders.slice(0, 3).join(', ')}{latestReaders.length > 3 ? ` và ${latestReaders.length - 3} người khác` : ''}</div> : null}
                  </div>
                </article>
              ))}
            </div>
          )}
          <div ref={chatEndRef} />
          {Object.keys(typingUsers).length > 0 ? <p className="chat-typing">{Object.values(typingUsers).join(', ')} đang nhập…</p> : null}
          <form className="chat-form" onSubmit={submitMessage}>
            <input ref={imageInputRef} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={chooseImage} aria-label="Chọn ảnh để gửi" />
            {replyTarget ? <div className="chat-compose-context"><span className="replying-label">Đang trả lời <strong>{replyTarget.sender_name}</strong><span className="replying-preview">{replyTarget.body || 'Ảnh đính kèm'}</span></span><button type="button" className="context-close" onClick={() => setReplyTarget(null)} aria-label="Huỷ trả lời">×</button></div> : null}
            {selectedImage ? <div className="chat-image-preview"><img src={imagePreviewUrl} alt="Ảnh sắp gửi" /><span>{selectedImage.name}<small>{(selectedImage.size / 1024 / 1024).toFixed(2)} MB · tối đa 5 MB</small></span><button type="button" className="context-close" onClick={() => { setSelectedImage(null); setImagePreviewUrl(''); if (imageInputRef.current) imageInputRef.current.value = ''; }} aria-label="Bỏ ảnh">×</button></div> : null}
            <div className="chat-compose-row">
              <button type="button" className="chat-tool" onClick={() => imageInputRef.current?.click()} disabled={sending} aria-label="Đính kèm ảnh" title="Đính kèm ảnh">＋</button>
              <div className="chat-text-wrap">
                <textarea ref={chatInputRef} className="chat-textarea" value={chatDraft} onChange={(event) => setChatDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} placeholder={replyTarget ? `Trả lời ${replyTarget.sender_name}…` : 'Nhắn tin cho nhóm…'} aria-label="Tin nhắn mới" maxLength={4000} />
                {mentionOptions.length > 0 ? <div className="mention-menu" role="listbox" aria-label="Gợi ý thành viên">{mentionOptions.map((member) => <button type="button" key={member.id} role="option" className="mention-option" onClick={() => insertMention(member.name)}><Avatar name={member.name} url={member.avatar_url} size={26} /><span>{member.name}<small>@{member.username ?? member.name.toLocaleLowerCase().replace(/\s+/g, '')}</small></span></button>)}</div> : null}
                <div className="chat-toolbar">
                  <span>Enter để gửi · Shift+Enter xuống dòng</span>
                  <div className="chat-tools-popovers">
                    <div className="chat-popover-anchor"><button type="button" className="chat-tool" onClick={() => { setEmojiOpen((open) => !open); setGiftOpen(false); }} aria-label="Chọn emoji" title="Emoji">☺</button>{emojiOpen ? <div className="emoji-menu" aria-label="Chọn emoji">{CHAT_EMOJIS.map((emoji) => <button type="button" key={emoji} onClick={() => insertEmoji(emoji)} aria-label={`Chèn ${emoji}`}>{emoji}</button>)}</div> : null}</div>
                    <div className="chat-popover-anchor"><button type="button" className="chat-tool" onClick={() => { setGiftOpen((open) => !open); setEmojiOpen(false); }} aria-label="Gửi quà" title="Quà tặng">🎁</button>{giftOpen ? <div className="gift-menu" aria-label="Chọn quà">{CHAT_GIFTS.map((gift) => <button type="button" key={gift.label} onClick={() => sendGift(gift)}><span>{gift.icon}</span>{gift.label}</button>)}</div> : null}</div>
                  </div>
                </div>
              </div>
              <button type="submit" className="chat-send" disabled={sending || (chatDraft.trim().length === 0 && !selectedImage)} aria-label="Gửi tin nhắn">{sending ? '…' : '↑'}</button>
            </div>
          </form>
        </section>
      ) : null}

      {tab === 'members' ? (
        <section id="panel-members" role="tabpanel" aria-labelledby="tab-members">
          {loading ? (
            <SkeletonRows rows={3} />
          ) : error ? null : members.length === 0 ? (
            <EmptyState title="Chưa tải được thành viên." />
          ) : (
            <div style={{ marginTop: 6 }}>
              {members.map((member) => (
                <div className="member" key={member.id}>
                  <Avatar name={member.name} url={member.avatar_url} size={34} />
                  <div>
                    <div className="member-name">{member.name}</div>
                    <div className="member-sub">
                      {onlineUserIds.includes(member.id) || isOnline(member.last_seen_at) ? 'Đang hoạt động' : member.email}
                    </div>
                  </div>
                  <span className="member-role">{ROLE_LABEL[member.role] ?? member.role}</span>
                </div>
              ))}
            </div>
          )}

          {canInvite ? (
            <>
              <div className="shead">
                <h2 className="h2">Mời vào nhóm</h2>
              </div>
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
            </>
          ) : null}
        </section>
      ) : null}
    </>
  );
}
