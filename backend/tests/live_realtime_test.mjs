import { createPool } from 'mysql2/promise';
import { WebSocket } from 'ws';
import { readFileSync } from 'node:fs';

const env = { ...process.env };
for (const raw of readFileSync(new URL('../.env', import.meta.url), 'utf8').split(/\r?\n/)) {
  const line = raw.trim();
  if (!line || line.startsWith('#') || !line.includes('=')) continue;
  const index = line.indexOf('=');
  const key = line.slice(0, index).trim();
  let value = line.slice(index + 1).trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
  if (env[key] === undefined) env[key] = value;
}

const apiBase = `http://127.0.0.1:${env.API_PORT || 8080}`;
const wsUrl = `ws://127.0.0.1:${env.REALTIME_PORT || 8090}`;
const suffix = `rt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const createdUserIds = [];
let ownerToken = '';
let groupId = 0;
const sockets = [];
const pool = createPool({ host: env.DB_HOST || '127.0.0.1', port: Number(env.DB_PORT || 3306), database: env.DB_NAME || 'studysync', user: env.DB_USER || 'root', password: env.DB_PASSWORD || '', charset: env.DB_CHARSET || 'utf8mb4' });

function assert(condition, message) { if (!condition) throw new Error(message); }
async function request(path, body, token, method = 'POST') {
  const response = await fetch(`${apiBase}${path}`, { method: body === undefined ? 'GET' : method, headers: { Accept: 'application/json', ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
  const payload = await response.json();
  if (!response.ok || payload.success === false) throw new Error(`${path}: ${payload.message || response.status}`);
  return payload.data;
}
async function register(name) {
  const data = await request('/register.php', { name, email: `${suffix}-${name.toLowerCase()}@example.test`, password: 'StudySync123!' });
  createdUserIds.push(data.user.id);
  return data;
}
function connect(token, userId) {
  const socket = new WebSocket(wsUrl);
  sockets.push(socket);
  const queue = [];
  const waiters = [];
  socket.on('message', (raw) => {
    const packet = JSON.parse(raw.toString());
    const index = waiters.findIndex((waiter) => waiter.predicate(packet));
    if (index >= 0) { const [waiter] = waiters.splice(index, 1); clearTimeout(waiter.timer); waiter.resolve(packet); } else queue.push(packet);
  });
  const waitFor = (predicate, timeout = 6000) => {
    const index = queue.findIndex(predicate);
    if (index >= 0) return Promise.resolve(queue.splice(index, 1)[0]);
    return new Promise((resolve, reject) => {
      const waiter = { predicate, resolve, timer: setTimeout(() => { const at = waiters.indexOf(waiter); if (at >= 0) waiters.splice(at, 1); reject(new Error('WebSocket event timeout')); }, timeout) };
      waiters.push(waiter);
    });
  };
  const ready = new Promise((resolve, reject) => { socket.once('open', () => { socket.send(JSON.stringify({ type: 'auth', token, groupId, trackMessages: true, lastMessageId: 0 })); waitFor((packet) => packet.type === 'ready').then(resolve, reject); }); socket.once('error', reject); });
  return { socket, waitFor, ready, userId };
}

function connectUser(token) {
  const socket = new WebSocket(wsUrl);
  sockets.push(socket);
  const queue = [];
  const waiters = [];
  socket.on('message', (raw) => {
    const packet = JSON.parse(raw.toString());
    const index = waiters.findIndex((waiter) => waiter.predicate(packet));
    if (index >= 0) { const [waiter] = waiters.splice(index, 1); clearTimeout(waiter.timer); waiter.resolve(packet); } else queue.push(packet);
  });
  const waitFor = (predicate, timeout = 6000) => {
    const index = queue.findIndex(predicate);
    if (index >= 0) return Promise.resolve(queue.splice(index, 1)[0]);
    return new Promise((resolve, reject) => {
      const waiter = { predicate, resolve, timer: setTimeout(() => { const at = waiters.indexOf(waiter); if (at >= 0) waiters.splice(at, 1); reject(new Error('WebSocket user notification timeout')); }, timeout) };
      waiters.push(waiter);
    });
  };
  const ready = new Promise((resolve, reject) => { socket.once('open', () => { socket.send(JSON.stringify({ type: 'auth', scope: 'user', token })); waitFor((packet) => packet.type === 'ready').then(resolve, reject); }); socket.once('error', reject); });
  return { socket, waitFor, ready };
}

try {
  const owner = await register('Owner');
  const member = await register('Member');
  const friendSender = await register('FriendSender');
  const friendRecipient = await register('FriendRecipient');
  ownerToken = owner.token;
  const group = await request('/create_group_auth.php', { name: `Realtime ${suffix}`, description: 'Temporary integration test' }, owner.token);
  groupId = group.id;
  await request('/send_friend_request.php', { user_id: member.user.id }, owner.token);
  const friendState = await request('/friends.php', undefined, member.token);
  await request('/respond_friend_request.php', { request_id: friendState.incoming[0].request_id, action: 'accept' }, member.token);
  const candidates = await request(`/group_invite_candidates.php?group_id=${groupId}`, undefined, owner.token);
  assert(candidates.some((person) => person.id === member.user.id && !person.invited), 'Quick invite candidate missing');
  await request('/invite_group_member.php', { group_id: groupId, user_id: member.user.id }, owner.token);
  const invitations = await request('/group_invitations.php', undefined, member.token);
  await request('/respond_group_invitation.php', { invitation_id: invitations.find((item) => item.group_id === groupId && item.status === 'pending').id, action: 'accept' }, member.token);
  const task = await request('/create_task.php', { group_id: groupId, title: 'Realtime assigned task', assignee_ids: [member.user.id] }, owner.token);
  assert(task.assignees.some((person) => person.id === member.user.id), 'Task assignment missing');

  const ownerSocket = connect(owner.token, owner.user.id);
  const memberSocket = connect(member.token, member.user.id);
  await Promise.all([ownerSocket.ready, memberSocket.ready]);
  const message = await request('/messages.php', { group_id: groupId, body: 'Realtime hello' }, owner.token);
  const delivered = await memberSocket.waitFor((packet) => packet.type === 'message' && packet.data?.id === message.id);
  assert(delivered.data.body === 'Realtime hello', 'Message push body mismatch');
  await request('/message_reactions.php', { message_id: message.id, emoji: '❤️' }, member.token);
  const reacted = await ownerSocket.waitFor((packet) => packet.type === 'message_updated' && packet.data?.id === message.id && packet.data.reactions?.some((item) => item.emoji === '❤️'));
  assert(reacted.data.reactions[0].count === 1, 'Reaction push missing');
  await request('/message_actions.php', { message_id: message.id, action: 'edit', body: 'Realtime edited' }, owner.token);
  const edited = await memberSocket.waitFor((packet) => packet.type === 'message_updated' && packet.data?.id === message.id && packet.data.body === 'Realtime edited');
  assert(edited.data.edited_at, 'Edited timestamp missing');
  memberSocket.socket.send(JSON.stringify({ type: 'read', messageId: message.id }));
  const read = await ownerSocket.waitFor((packet) => packet.type === 'read' && packet.userId === member.user.id && packet.messageId === message.id);
  assert(read.name === member.user.name, 'Read receipt name mismatch');
  await request('/message_actions.php', { message_id: message.id, action: 'delete' }, owner.token);
  await memberSocket.waitFor((packet) => packet.type === 'message_deleted' && packet.messageId === message.id);

  const friendRecipientSocket = connectUser(friendRecipient.token);
  await friendRecipientSocket.ready;
  await request('/send_friend_request.php', { user_id: friendRecipient.user.id }, friendSender.token);
  const friendRequest = await friendRecipientSocket.waitFor((packet) => packet.type === 'notification' && packet.data?.type === 'friend_request');
  assert(friendRequest.data.body.includes('FriendSender'), 'Friend request notification was not delivered live');
  assert(friendRequest.data.data?.user_id === friendSender.user.id, 'Friend request sender metadata mismatch');
  console.log('✓ Live MySQL/WebSocket: group chat events and account-scoped friend request notifications');
} finally {
  for (const socket of sockets) socket.close();
  try { if (groupId && ownerToken) await request('/delete_group.php', { id: groupId }, ownerToken); } catch { /* cleanup continues */ }
  if (createdUserIds.length) {
    const marks = createdUserIds.map(() => '?').join(',');
    await pool.execute(`DELETE FROM users WHERE id IN (${marks})`, createdUserIds);
  }
  await pool.end();
}
