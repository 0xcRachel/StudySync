import { API_BASE_URL } from '../config/api';

export type User = { id: number; name: string; email: string; avatar_url?: string | null; bio?: string | null; last_seen_at?: string | null };
export type Group = { id: number; name: string; description?: string | null; task_count?: number; completed_count?: number };
export type Task = { id: number; group_id: number; title: string; status: 'todo' | 'doing' | 'done'; priority?: 'low' | 'medium' | 'high'; due_at?: string | null; assignees?: Pick<User, 'id' | 'name' | 'avatar_url'>[] };
export type Message = { id: number; group_id: number; sender_id: number; sender_name: string; body: string; created_at?: string; edited_at?: string | null; reactions?: { emoji: string; count: number; reacted: boolean }[] };

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers ?? {}) } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.success === false) throw new Error(body.message || `HTTP ${response.status}`);
  return body as T;
}
const post = (path: string, body: unknown, token?: string) => request<any>(path, { method: 'POST', body: JSON.stringify(body) }, token);

export async function login(email: string, password: string) { return (await post('/login.php', { email, password })).data as { token: string; user: User }; }
export async function register(name: string, email: string, password: string) { return (await post('/register.php', { name, email, password })).data as { token: string; user: User }; }
export async function logout(token: string) { return post('/logout.php', {}, token); }
export async function getGroups(token: string) { return (await request<any>('/list_groups.php', {}, token)).data as Group[]; }
export async function createGroup(name: string, description: string, token: string) { return (await post('/create_group_auth.php', { name, description }, token)).data as Group; }
export async function getTasks(groupId: number, token: string) { return (await request<any>(`/get_tasks.php?group_id=${groupId}`, {}, token)).data as Task[]; }
export async function createTask(groupId: number, title: string, token: string, assigneeIds: number[] = []) { return (await post('/create_task.php', { group_id: groupId, title, assignee_ids: assigneeIds }, token)).data as Task; }
export async function assignTask(taskId: number, userIds: number[], token: string) { return (await post('/assign_task.php', { task_id: taskId, user_ids: userIds }, token)).data as Task; }
export async function updateTask(task: Task, status: Task['status'], token: string) { return (await post('/update_task_status.php', { id: task.id, group_id: task.group_id, status }, token)).data as Task; }
export async function getFriends(token: string) { return (await request<any>('/friends.php', {}, token)).data; }
export async function searchUsers(query: string, token: string) { return (await request<any>(`/users.php?q=${encodeURIComponent(query)}`, {}, token)).data as User[]; }
export async function sendFriendRequest(userId: number, token: string) { return post('/send_friend_request.php', { user_id: userId }, token); }
export async function getNotifications(token: string) { return (await request<any>('/notifications.php', {}, token)).data as any[]; }
export async function getMembers(groupId: number, token: string) { return (await request<any>(`/group_members.php?group_id=${groupId}`, {}, token)).data as any[]; }
export async function getInviteCandidates(groupId: number, token: string) { return (await request<any>(`/group_invite_candidates.php?group_id=${groupId}`, {}, token)).data as (User & { invited: boolean })[]; }
export async function inviteMember(groupId: number, userId: number, token: string) { return post('/invite_group_member.php', { group_id: groupId, user_id: userId }, token); }
export async function getMessages(groupId: number, token: string, beforeId?: number) {
  const params = new URLSearchParams({ group_id: String(groupId), limit: '100' });
  if (beforeId) params.set('before_id', String(beforeId));
  return (await request<any>(`/messages.php?${params.toString()}`, {}, token)).data as Message[];
}
export async function sendMessage(groupId: number, body: string, token: string, replyToId?: number | null, mentionIds: number[] = []) {
  return (await post('/messages.php', { group_id: groupId, body, reply_to_id: replyToId ?? null, mention_ids: mentionIds }, token)).data as Message;
}
export async function reactMessage(messageId: number, emoji: string, token: string) { return (await post('/message_reactions.php', { message_id: messageId, emoji }, token)).data as { message_id: number; reactions: NonNullable<Message['reactions']> }; }
export async function editMessage(messageId: number, body: string, token: string) { return post('/message_actions.php', { message_id: messageId, action: 'edit', body }, token); }
export async function deleteMessage(messageId: number, token: string) { return post('/message_actions.php', { message_id: messageId, action: 'delete' }, token); }

/* ---------- Tính năng native chưa từng gọi tới ---------- */
export type GroupInvitation = { id: number; group_id: number; group_name: string; inviter_id: number; inviter_name: string; status: 'pending' | 'accepted' | 'declined'; created_at: string };

export async function respondFriendRequest(requestId: number, action: 'accept' | 'decline' | 'block', token: string) {
  return post('/respond_friend_request.php', { request_id: requestId, action }, token);
}
export async function markNotificationRead(id: number, token: string) {
  return request<unknown>('/notifications.php', { method: 'PATCH', body: { id } }, token);
}
export async function markAllNotificationsRead(token: string) {
  return request<{ updated: number }>('/notifications.php', { method: 'PATCH', body: { action: 'mark_all' } }, token);
}
export async function getGroupInvitations(token: string) {
  return (await request<any>('/group_invitations.php', {}, token)).data as GroupInvitation[];
}
export async function respondGroupInvitation(invitationId: number, action: 'accept' | 'decline', token: string) {
  return post('/respond_group_invitation.php', { invitation_id: invitationId, action }, token);
}
export async function updateProfile(payload: { name: string; username: string; avatar_url: string; bio: string }, token: string) {
  return (await request<any>('/profile.php', { method: 'PATCH', body: payload }, token)).data as { user: User };
}
export async function changePassword(currentPassword: string, newPassword: string, token: string) {
  return post('/change_password.php', { current_password: currentPassword, new_password: newPassword }, token);
}
export async function deleteTask(taskId: number, token: string) {
  return post('/delete_task.php', { id: taskId }, token);
}
export async function deleteGroup(groupId: number, token: string) {
  // Endpoint đọc `id`, không phải `group_id`.
  return post('/delete_group.php', { id: groupId }, token);
}
