import { API_BASE_URL, API_TIMEOUT_MS } from '../../config/api';

export type User = {
  id: number;
  name: string;
  username?: string | null;
  email: string;
  avatar_url?: string | null;
  bio?: string | null;
  last_seen_at?: string | null;
  created_at?: string | null;
};

export type Group = {
  id: number;
  name: string;
  description?: string | null;
  task_count: number;
  completed_count: number;
  /** Tin của người khác sau mốc đọc per-group — sidebar vẽ pill + badge từ số này. */
  unread_count?: number;
  /** Trong số đó, tin có nhắc tới mình — Discord badge đỏ, còn lại badge xám. */
  mention_count?: number;
  created_at?: string;
};

export type TaskStatus = 'todo' | 'doing' | 'done';

export type Task = {
  id: number;
  group_id: number;
  title: string;
  status: TaskStatus;
  created_at?: string;
  updated_at?: string;
  assignees: Pick<User, 'id' | 'name' | 'username' | 'avatar_url'>[];
};

export type Message = {
  id: number;
  group_id: number;
  sender_id: number;
  sender_name: string;
  body: string;
  created_at?: string;
  avatar_url?: string | null;
  reply_to_id?: number | null;
  reply_to?: { id: number; sender_name: string; avatar_url?: string | null; body: string; has_image: boolean } | null;
  image_url?: string | null;
  reactions?: { emoji: string; count: number; reacted: boolean }[];
  edited_at?: string | null;
};

export type Member = {
  id: number;
  name: string;
  email: string;
  username?: string | null;
  avatar_url?: string | null;
  role: 'owner' | 'admin' | 'member';
  joined_at?: string;
  last_seen_at?: string | null;
};

export type FriendUser = User & { friendship_id?: number };
export type FriendRequest = User & { request_id: number };

export type GroupInvitation = {
  id: number;
  group_id: number;
  group_name: string;
  inviter_id: number;
  inviter_name: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
};

export type Friends = {
  friends: FriendUser[];
  incoming: FriendRequest[];
  outgoing: FriendRequest[];
};

export type InviteCandidate = User & { invited: boolean };

export type Notification = {
  id: number;
  type: string;
  title: string;
  body: string;
  read_at: string | null;
  created_at: string;
  data?: Record<string, unknown> | null;
};

export type Health = {
  status: string;
  database: string;
  driver: string;
  php_version: string;
  server_time: string;
};

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string;
  signal?: AbortSignal;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  const forwardAbort = () => controller.abort();
  options.signal?.addEventListener('abort', forwardAbort);

  let response: Response;
  try {
    const multipart = typeof FormData !== 'undefined' && options.body instanceof FormData;
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? 'GET',
      headers: {
        Accept: 'application/json',
        ...(options.body === undefined || multipart ? {} : { 'Content-Type': 'application/json' }),
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      body: options.body === undefined ? undefined : multipart ? options.body as FormData : JSON.stringify(options.body),
      signal: controller.signal,
    });
  } catch {
    if (options.signal?.aborted) throw new ApiError('Đã huỷ yêu cầu.', 0);
    if (controller.signal.aborted) {
      throw new ApiError('Máy chủ phản hồi quá lâu. Thử lại sau ít phút.', 0);
    }
    throw new ApiError('Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.', 0);
  } finally {
    window.clearTimeout(timer);
    options.signal?.removeEventListener('abort', forwardAbort);
  }

  const text = await response.text();
  let payload: { success?: boolean; message?: string; data?: T } | null = null;
  try {
    payload = text ? (JSON.parse(text) as { success?: boolean; message?: string; data?: T }) : null;
  } catch {
    payload = null;
  }

  if (!payload) {
    throw new ApiError('Máy chủ trả về dữ liệu không đọc được.', response.status);
  }
  if (!response.ok || payload.success === false) {
    if (response.status === 401 && options.token) {
      window.dispatchEvent(new Event('studysync:unauthorized'));
    }
    throw new ApiError(payload.message || `Yêu cầu thất bại (HTTP ${response.status}).`, response.status);
  }

  return payload.data as T;
}

const post = <T>(path: string, body: unknown, token?: string, signal?: AbortSignal) =>
  request<T>(path, { method: 'POST', body, token, signal });

/* ---------- Auth ---------- */

export const login = (email: string, password: string) =>
  post<{ user: User; token: string }>('/login.php', { email, password });

export const register = (name: string, email: string, password: string) =>
  post<{ user: User; token: string }>('/register.php', { name, email, password });

export const me = (token: string, signal?: AbortSignal) =>
  request<{ user: User }>('/me.php', { token, signal });

export const logout = (token: string) => post<unknown>('/logout.php', {}, token);

export const getOAuthProviders = () => request<{ google: boolean; facebook: boolean }>('/oauth_config.php');

export const changePassword = (currentPassword: string, newPassword: string, token: string) =>
  post<unknown>(
    '/change_password.php',
    { current_password: currentPassword, new_password: newPassword },
    token,
  );

/* ---------- Groups & tasks ---------- */

export const getGroups = (token: string, signal?: AbortSignal) =>
  request<Group[]>('/list_groups.php', { token, signal });

export const createGroup = (name: string, description: string, token: string) =>
  post<Group>('/create_group_auth.php', { name, description }, token);

export const getTasks = (groupId: number, token: string, signal?: AbortSignal) =>
  request<Task[]>(`/get_tasks.php?group_id=${groupId}`, { token, signal });

export const createTask = (groupId: number, title: string, token: string, assigneeIds: number[] = []) =>
  post<Task>('/create_task.php', { group_id: groupId, title, assignee_ids: assigneeIds }, token);

export const assignTask = (taskId: number, userIds: number[], token: string) =>
  post<Task>('/assign_task.php', { task_id: taskId, user_ids: userIds }, token);

export const deleteTask = (taskId: number, token: string) =>
  // Endpoint đọc `id`, không phải `task_id`.
  post<unknown>('/delete_task.php', { id: taskId }, token);

export const renameTask = (task: Task, title: string, token: string) =>
  request<Task>('/update_task.php', {
    method: 'PATCH',
    body: { id: task.id, group_id: task.group_id, title },
    token,
  });

export const deleteGroup = (groupId: number, token: string) =>
  post<unknown>('/delete_group.php', { id: groupId }, token);

export type TaskComment = {
  id: number;
  task_id: number;
  user_id: number;
  user_name: string;
  avatar_url?: string | null;
  body: string;
  created_at?: string;
};

/** Endpoint lấy `task_id` từ query string ở cả GET lẫn POST. */
export const getTaskComments = (taskId: number, token: string, signal?: AbortSignal) =>
  request<TaskComment[]>(`/task_comments.php?task_id=${taskId}`, { token, signal });

export const addTaskComment = (taskId: number, body: string, token: string) =>
  post<TaskComment>(`/task_comments.php?task_id=${taskId}`, { body }, token);

export const updateTaskStatus = (task: Task, status: TaskStatus, token: string) =>
  post<Task>('/update_task_status.php', { id: task.id, group_id: task.group_id, status }, token);

/* ---------- Group detail ---------- */

export const getMessages = (groupId: number, token: string, signal?: AbortSignal, beforeId?: number) => {
  const params = new URLSearchParams({ group_id: String(groupId), limit: '100' });
  if (beforeId) params.set('before_id', String(beforeId));
  return request<Message[]>(`/messages.php?${params.toString()}`, { token, signal });
};

export const sendMessage = (groupId: number, body: string, token: string, replyToId?: number | null, image?: File | null, mentionIds: number[] = []) => {
  if (image) {
    const form = new FormData();
    form.append('group_id', String(groupId));
    form.append('body', body);
    if (replyToId) form.append('reply_to_id', String(replyToId));
    form.append('mention_ids', JSON.stringify(mentionIds));
    form.append('image', image);
    return request<Message>('/messages.php', { method: 'POST', body: form, token });
  }
  return post<Message>('/messages.php', { group_id: groupId, body, reply_to_id: replyToId ?? null, mention_ids: mentionIds }, token);
};

export const toggleMessageReaction = (messageId: number, emoji: string, token: string) =>
  post<{ message_id: number; reactions: NonNullable<Message['reactions']> }>('/message_reactions.php', { message_id: messageId, emoji }, token);

export const editMessage = (messageId: number, body: string, token: string) =>
  post<{ message_id: number; body: string }>('/message_actions.php', { message_id: messageId, action: 'edit', body }, token);

export const deleteMessage = (messageId: number, token: string) =>
  post<{ message_id: number }>('/message_actions.php', { message_id: messageId, action: 'delete' }, token);

export const getMembers = (groupId: number, token: string, signal?: AbortSignal) =>
  request<Member[]>(`/group_members.php?group_id=${groupId}`, { token, signal });

export const inviteMember = (groupId: number, userId: number, token: string) =>
  post<unknown>('/invite_group_member.php', { group_id: groupId, user_id: userId }, token);

export const getInviteCandidates = (groupId: number, token: string, signal?: AbortSignal) =>
  request<InviteCandidate[]>(`/group_invite_candidates.php?group_id=${groupId}`, { token, signal });

export const getGroupInvitations = (token: string, signal?: AbortSignal) =>
  request<GroupInvitation[]>('/group_invitations.php', { token, signal });

export const respondGroupInvitation = (
  invitationId: number,
  action: 'accept' | 'decline',
  token: string,
) =>
  post<unknown>(
    '/respond_group_invitation.php',
    { invitation_id: invitationId, action },
    token,
  );

/* ---------- People ---------- */

export const getFriends = (token: string, signal?: AbortSignal) =>
  request<Friends>('/friends.php', { token, signal });

export const searchUsers = (query: string, token: string, signal?: AbortSignal) =>
  request<User[]>(`/users.php?q=${encodeURIComponent(query)}`, { token, signal });

export const sendFriendRequest = (userId: number, token: string) =>
  post<unknown>('/send_friend_request.php', { user_id: userId }, token);

export const respondFriendRequest = (requestId: number, action: 'accept' | 'decline', token: string) =>
  post<unknown>('/respond_friend_request.php', { request_id: requestId, action }, token);

/* ---------- Notifications & profile ---------- */

export const getNotifications = (token: string, signal?: AbortSignal) =>
  request<Notification[]>('/notifications.php', { token, signal });

export const markNotificationRead = (id: number, token: string) =>
  request<unknown>('/notifications.php', { method: 'PATCH', body: { id }, token });

export const markAllNotificationsRead = (token: string) =>
  request<{ updated: number }>('/notifications.php', { method: 'PATCH', body: { action: 'mark_all' }, token });

export const updateProfile = (payload: { name: string; username: string; avatar_url: string; bio: string }, token: string) =>
  request<{ user: User }>('/profile.php', { method: 'PATCH', body: payload, token });

/* ---------- Diagnostics ---------- */

export const health = (signal?: AbortSignal) => request<Health>('/health.php', { signal });

export { API_BASE_URL };
