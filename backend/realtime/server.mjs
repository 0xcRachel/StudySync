import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { createPool } from 'mysql2/promise';
import { WebSocketServer, WebSocket } from 'ws';

const backendDir = new URL('../', import.meta.url);
const envFile = new URL('.env', backendDir);
try {
  for (const raw of readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#') || !line.includes('=')) continue;
    const index = line.indexOf('=');
    const key = line.slice(0, index).trim();
    let value = line.slice(index + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
} catch { /* Optional: process environment may provide the DB config. */ }

const port = Number(process.env.REALTIME_PORT || 8090);
const driver = (process.env.DB_DRIVER || 'sqlite').toLowerCase();
const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || '*').split(',').map((item) => item.trim()).filter(Boolean);
const pool = driver === 'mysql' ? createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  database: process.env.DB_NAME || 'studysync',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  charset: process.env.DB_CHARSET || 'utf8mb4',
  connectionLimit: 8,
  dateStrings: true,
  enableKeepAlive: true,
  waitForConnections: true,
  queueLimit: 100,
}) : null;

const httpServer = createServer((request, response) => {
  if (request.url === '/health') {
    response.writeHead(driver === 'mysql' ? 200 : 503, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ status: driver === 'mysql' ? 'ok' : 'mysql-required' }));
    return;
  }
  response.writeHead(404);
  response.end();
});

const wss = new WebSocketServer({ noServer: true, maxPayload: 4096, perMessageDeflate: false });
const rooms = new Map();
const clients = new Set();
const userClients = new Map();
let pollBusy = false;
let notificationPollBusy = false;

httpServer.on('upgrade', (request, socket, head) => {
  const origin = request.headers.origin;
  if (allowedOrigins[0] !== '*' && origin && !allowedOrigins.includes(origin)) {
    socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
    socket.destroy();
    return;
  }
  if (new URL(request.url || '/', 'http://localhost').pathname !== '/') {
    socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
    socket.destroy();
    return;
  }
  wss.handleUpgrade(request, socket, head, (websocket) => wss.emit('connection', websocket));
});

function send(client, packet) {
  if (client.socket.readyState === WebSocket.OPEN) client.socket.send(JSON.stringify(packet));
}

function broadcast(room, packet, except) {
  for (const client of room.clients) if (client !== except) send(client, packet);
}

async function authenticateUser(token) {
  if (!pool) throw new Error('Real-time yêu cầu DB_DRIVER=mysql.');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const [users] = await pool.execute(
    'SELECT u.id, u.name FROM user_sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > CURRENT_TIMESTAMP AND u.is_active = 1 LIMIT 1',
    [tokenHash],
  );
  if (!users.length) throw new Error('Phiên đăng nhập đã hết hạn.');
  const user = users[0];
  return { id: Number(user.id), name: user.name };
}

async function authenticate(token, groupId) {
  const user = await authenticateUser(token);
  const [members] = await pool.execute('SELECT 1 FROM group_members WHERE group_id = ? AND user_id = ? LIMIT 1', [groupId, user.id]);
  if (!members.length) throw new Error('Bạn không còn là thành viên của nhóm này.');
  return user;
}

function roomFor(groupId) {
  if (!rooms.has(groupId)) rooms.set(groupId, { clients: new Set(), cursor: 0, taskSignature: null, memberSignature: null, messageState: new Map() });
  return rooms.get(groupId);
}

async function syncRoomState(groupId, room) {
  const [tasks] = await pool.execute('SELECT id, group_id, title, status, created_at, updated_at FROM tasks WHERE group_id = ? ORDER BY id ASC', [groupId]);
  const [assignments] = await pool.execute('SELECT ta.task_id, u.id, u.name, u.username, u.avatar_url FROM task_assignees ta JOIN tasks t ON t.id = ta.task_id JOIN users u ON u.id = ta.user_id WHERE t.group_id = ? ORDER BY u.name', [groupId]);
  const byTask = new Map();
  for (const person of assignments) {
    const taskId = Number(person.task_id);
    if (!byTask.has(taskId)) byTask.set(taskId, []);
    byTask.get(taskId).push({ id: Number(person.id), name: person.name, username: person.username, avatar_url: person.avatar_url });
  }
  const normalizedTasks = tasks.map((task) => ({ ...task, id: Number(task.id), group_id: Number(task.group_id), assignees: byTask.get(Number(task.id)) || [] }));
  const taskSignature = JSON.stringify(normalizedTasks);
  if (room.taskSignature !== null && room.taskSignature !== taskSignature) broadcast(room, { type: 'tasks', data: normalizedTasks });
  room.taskSignature = taskSignature;

  const [members] = await pool.execute('SELECT gm.role, gm.joined_at, u.id, u.name, u.username, u.email, u.avatar_url, u.bio, u.last_seen_at, u.created_at FROM group_members gm JOIN users u ON u.id = gm.user_id WHERE gm.group_id = ? ORDER BY FIELD(gm.role, "owner", "admin", "member"), u.name', [groupId]);
  const normalizedMembers = members.map((member) => ({ ...member, id: Number(member.id) }));
  const memberSignature = JSON.stringify(normalizedMembers.map(({ last_seen_at, ...member }) => member));
  if (room.memberSignature !== null && room.memberSignature !== memberSignature) broadcast(room, { type: 'members', data: normalizedMembers });
  room.memberSignature = memberSignature;
}

wss.on('connection', (socket) => {
  const client = { socket, user: null, room: null, groupId: null, scope: null, cursor: 0, notificationCursor: 0, alive: true, lastTypingAt: 0 };
  clients.add(client);
  const authTimeout = setTimeout(() => { if (!client.user) socket.close(4401, 'Authentication timeout'); }, 5000);

  socket.on('pong', () => { client.alive = true; });
  socket.on('message', async (raw) => {
    let packet;
    try { packet = JSON.parse(raw.toString()); } catch { return; }
    if (!client.user) {
      if (packet.type !== 'auth' || typeof packet.token !== 'string') {
        socket.close(4401, 'Authentication required');
        return;
      }
      try {
        if (packet.scope === 'user') {
          client.scope = 'user';
          client.user = await authenticateUser(packet.token);
          const [latest] = await pool.execute('SELECT COALESCE(MAX(id), 0) AS id FROM notifications WHERE user_id = ?', [client.user.id]);
          client.notificationCursor = Number(latest[0]?.id ?? 0);
          if (!userClients.has(client.user.id)) userClients.set(client.user.id, new Set());
          userClients.get(client.user.id).add(client);
          clearTimeout(authTimeout);
          send(client, { type: 'ready', userId: client.user.id });
          return;
        }
        if (!Number.isSafeInteger(Number(packet.groupId))) {
          socket.close(4401, 'Authentication required');
          return;
        }
        client.scope = 'group';
        client.groupId = Number(packet.groupId);
        client.user = await authenticate(packet.token, client.groupId);
        client.cursor = Number.isSafeInteger(Number(packet.lastMessageId)) ? Number(packet.lastMessageId) : 0;
        if (packet.trackMessages === false) {
          const [latest] = await pool.execute('SELECT COALESCE(MAX(id), 0) AS id FROM messages WHERE group_id = ?', [client.groupId]);
          client.cursor = Number(latest[0]?.id ?? 0);
        }
        client.room = roomFor(client.groupId);
        client.room.clients.add(client);
        clearTimeout(authTimeout);
        if (client.room.taskSignature === null || client.room.memberSignature === null) await syncRoomState(client.groupId, client.room);
        await pool.execute('UPDATE users SET last_seen_at = CURRENT_TIMESTAMP WHERE id = ?', [client.user.id]);
        const [reads] = await pool.execute('SELECT mr.user_id, mr.last_message_id, u.name FROM message_reads mr JOIN users u ON u.id = mr.user_id WHERE mr.group_id = ?', [client.groupId]);
        send(client, { type: 'ready', userId: client.user.id, onlineUserIds: [...new Set([...client.room.clients].map((entry) => entry.user.id))], reads: reads.map((item) => ({ userId: Number(item.user_id), messageId: Number(item.last_message_id), name: item.name })) });
        broadcast(client.room, { type: 'presence', userId: client.user.id, name: client.user.name, online: true }, client);
      } catch (error) {
        send(client, { type: 'error', message: error instanceof Error ? error.message : 'Không xác thực được kết nối.' });
        socket.close(4401, 'Unauthorized');
      }
      return;
    }

    if (packet.type === 'typing' && client.room && Date.now() - client.lastTypingAt > 250) {
      client.lastTypingAt = Date.now();
      broadcast(client.room, { type: 'typing', userId: client.user.id, name: client.user.name, active: Boolean(packet.active) }, client);
    } else if (packet.type === 'read' && client.room && Number.isSafeInteger(Number(packet.messageId)) && Number(packet.messageId) > 0) {
      const messageId = Number(packet.messageId);
      const [valid] = await pool.execute('SELECT 1 FROM messages WHERE id = ? AND group_id = ? LIMIT 1', [messageId, client.groupId]);
      if (valid.length) {
        await pool.execute('INSERT INTO message_reads (group_id, user_id, last_message_id) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE last_message_id = GREATEST(last_message_id, VALUES(last_message_id)), read_at = CURRENT_TIMESTAMP', [client.groupId, client.user.id, messageId]);
        broadcast(client.room, { type: 'read', userId: client.user.id, name: client.user.name, messageId });
      }
    }
  });

  socket.on('close', async () => {
    clearTimeout(authTimeout);
    clients.delete(client);
    if (!client.user) return;
    if (client.scope === 'user') {
      const connectedUsers = userClients.get(client.user.id);
      connectedUsers?.delete(client);
      if (connectedUsers?.size === 0) userClients.delete(client.user.id);
      return;
    }
    if (!client.room) return;
    client.room.clients.delete(client);
    broadcast(client.room, { type: 'presence', userId: client.user.id, name: client.user.name, online: [...client.room.clients].some((entry) => entry.user.id === client.user.id) });
    if (client.room.clients.size === 0) rooms.delete(client.groupId);
    try { await pool?.execute('UPDATE users SET last_seen_at = CURRENT_TIMESTAMP WHERE id = ?', [client.user.id]); } catch { /* reconnect will refresh presence */ }
  });
});

async function pollMessages() {
  if (!pool || pollBusy) return;
  pollBusy = true;
  try {
    for (const [groupId, room] of rooms) {
      if (room.clients.size === 0) continue;
      await syncRoomState(groupId, room);
      const [rows] = await pool.execute(
        'SELECT m.id, m.group_id, m.sender_id, u.name AS sender_name, u.avatar_url, m.body, m.reply_to_id, m.image_name, m.created_at, m.edited_at, m.deleted_at, parent.body AS reply_body, parent.image_name AS reply_image_name, reply_user.name AS reply_sender_name, reply_user.avatar_url AS reply_avatar_url FROM messages m JOIN users u ON u.id = m.sender_id LEFT JOIN messages parent ON parent.id = m.reply_to_id AND parent.deleted_at IS NULL LEFT JOIN users reply_user ON reply_user.id = parent.sender_id WHERE m.group_id = ? ORDER BY m.id DESC LIMIT 100',
        [groupId],
      );
      rows.reverse();
      for (const message of rows) {
        const id = Number(message.id);
        const [reactionRows] = await pool.execute('SELECT emoji, user_id FROM message_reactions WHERE message_id = ? ORDER BY emoji, user_id', [id]);
        const signature = JSON.stringify([message.body, message.edited_at, message.deleted_at, reactionRows.map((reaction) => [reaction.emoji, Number(reaction.user_id)])]);
        const previous = room.messageState.get(id);
        const deleted = message.deleted_at !== null;
        const makeData = (client) => {
          const reactions = new Map();
          for (const reaction of reactionRows) {
            if (!reactions.has(reaction.emoji)) reactions.set(reaction.emoji, { emoji: reaction.emoji, count: 0, reacted: false });
            const item = reactions.get(reaction.emoji); item.count += 1; if (Number(reaction.user_id) === client.user.id) item.reacted = true;
          }
          return {
            id, group_id: Number(message.group_id), sender_id: Number(message.sender_id), sender_name: message.sender_name,
            avatar_url: message.avatar_url, body: message.body, reply_to_id: message.reply_to_id ? Number(message.reply_to_id) : null,
            reply_to: message.reply_to_id && message.reply_sender_name ? { id: Number(message.reply_to_id), sender_name: message.reply_sender_name, avatar_url: message.reply_avatar_url, body: message.reply_body || '', has_image: message.reply_image_name !== null } : null,
            image_url: message.image_name ? `/message_image.php?id=${id}` : null, created_at: message.created_at, edited_at: message.edited_at,
            reactions: [...reactions.values()],
          };
        };
        if (!previous) {
          if (!deleted) for (const client of room.clients) if (id > client.cursor) send(client, { type: 'message', data: makeData(client) });
        } else if (previous.signature !== signature) {
          if (deleted && !previous.deleted) broadcast(room, { type: 'message_deleted', messageId: id });
          else if (!deleted) for (const client of room.clients) send(client, { type: 'message_updated', data: makeData(client) });
        }
        room.messageState.set(id, { signature, deleted });
        for (const client of room.clients) client.cursor = Math.max(client.cursor, id);
        room.cursor = Math.max(room.cursor, id);
      }
    }
  } catch (error) {
    console.error(`Real-time database poll failed: ${error instanceof Error ? error.message : 'unknown error'}`);
  } finally {
    pollBusy = false;
  }
}

async function pollNotifications() {
  if (!pool || notificationPollBusy || userClients.size === 0) return;
  notificationPollBusy = true;
  try {
    for (const [userId, connectedClients] of userClients) {
      if (connectedClients.size === 0) continue;
      const cursor = Math.min(...[...connectedClients].map((client) => client.notificationCursor));
      const [rows] = await pool.execute(
        'SELECT id, type, title, body, data_json, read_at, created_at FROM notifications WHERE user_id = ? AND id > ? ORDER BY id ASC LIMIT 100',
        [userId, cursor],
      );
      for (const row of rows) {
        const id = Number(row.id);
        const data = typeof row.data_json === 'string' ? JSON.parse(row.data_json) : row.data_json ?? null;
        const notification = { id, type: row.type, title: row.title, body: row.body, data, read_at: row.read_at, created_at: row.created_at };
        for (const client of connectedClients) {
          if (client.notificationCursor < id) {
            send(client, { type: 'notification', data: notification });
            client.notificationCursor = id;
          }
        }
      }
    }
  } catch (error) {
    console.error(`Real-time notification poll failed: ${error instanceof Error ? error.message : 'unknown error'}`);
  } finally {
    notificationPollBusy = false;
  }
}

const messagePoll = setInterval(() => { void pollMessages(); }, 500);
const notificationPoll = setInterval(() => { void pollNotifications(); }, 500);
const heartbeat = setInterval(() => {
  for (const client of clients) {
    if (!client.alive) { client.socket.terminate(); continue; }
    client.alive = false;
    client.socket.ping();
  }
}, 30000);

httpServer.listen(port, '0.0.0.0', () => {
  console.log(`StudySync real-time gateway listening on port ${port}${pool ? '' : ' (offline: set DB_DRIVER=mysql)'}`);
});

async function shutdown() {
  clearInterval(messagePoll);
  clearInterval(notificationPoll);
  clearInterval(heartbeat);
  for (const client of clients) client.socket.close(1001, 'Server stopping');
  wss.close();
  httpServer.close();
  await pool?.end();
}
process.once('SIGINT', () => { void shutdown().finally(() => process.exit(0)); });
process.once('SIGTERM', () => { void shutdown().finally(() => process.exit(0)); });
