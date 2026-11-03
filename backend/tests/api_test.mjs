import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, rm } from 'node:fs/promises';
import net from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const backendDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
const phpBinary = process.env.PHP_BINARY || 'php';
const port = await findFreePort();
const baseUrl = `http://127.0.0.1:${port}`;
const temporaryDirectory = await mkdtemp(
  path.join(tmpdir(), 'studysync-api-test-'),
);
const databasePath = path.join(temporaryDirectory, 'test.sqlite');

let serverOutput = '';
let primaryToken = null;
let otherToken = null;
let otherUserId = null;
let groupId = null;
const server = spawn(
  phpBinary,
  ['-d', 'upload_max_filesize=6M', '-d', 'post_max_size=8M', '-S', `127.0.0.1:${port}`, '-t', backendDirectory, path.join(backendDirectory, 'router.php')],
  {
    cwd: backendDirectory,
    env: {
      ...process.env,
      APP_ENV: 'test',
      DB_DRIVER: 'sqlite',
      DB_SQLITE_PATH: databasePath,
      SEED_DEMO_DATA: 'true',
      CORS_ALLOWED_ORIGINS: '*',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  },
);

server.stdout.on('data', (chunk) => {
  serverOutput += chunk.toString();
});
server.stderr.on('data', (chunk) => {
  serverOutput += chunk.toString();
});

const tests = [];
let createdJsonTaskId = null;
let createdFormTaskId = null;

function test(name, handler) {
  tests.push({ name, handler });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function request(pathname, options = {}, token = primaryToken) {
  const headers = new Headers(options.headers ?? {});
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(`${baseUrl}${pathname}`, { ...options, headers });
  const text = await response.text();
  let body = null;

  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = null;
  }

  return { response, body, text };
}

function jsonPost(pathname, body, token = primaryToken) {
  return request(pathname, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  }, token);
}

test('health.php trả trạng thái database', async () => {
  const { response, body } = await request('/health.php');

  assert(response.status === 200, `HTTP ${response.status}`);
  assert(body?.success === true, 'success phải là true');
  assert(body?.data?.database === 'connected', 'database phải connected');
  assert(body?.data?.driver === 'sqlite', 'driver phải là sqlite');
});

test('API nhóm yêu cầu phiên đăng nhập hợp lệ', async () => {
  const groups = await request('/list_groups.php', {}, null);
  const tasks = await request(`/get_tasks.php?group_id=${groupId}`, {}, null);
  assert(groups.response.status === 401, `list_groups HTTP ${groups.response.status}`);
  assert(tasks.response.status === 401, `get_tasks HTTP ${tasks.response.status}`);
});

test('Tài khoản mới không tự tham gia nhóm có sẵn của người khác', async () => {
  const { response, body } = await request('/list_groups.php', {}, otherToken);

  assert(response.status === 200, `HTTP ${response.status}`);
  assert(body?.success === true, 'success phải là true');
  assert(Array.isArray(body.data) && body.data.length === 0, 'tài khoản mới phải bắt đầu chưa có nhóm');
});

test('Tài khoản chỉ nhìn thấy nhóm của chính mình', async () => {
  const first = await request('/list_groups.php', {}, primaryToken);
  const second = await request('/list_groups.php', {}, otherToken);
  assert(first.response.status === 200, `chủ nhóm HTTP ${first.response.status}`);
  assert(first.body.data.length === 1 && first.body.data[0].id === groupId, 'chủ nhóm thấy đúng nhóm vừa tạo');
  assert(second.body.data.length === 0, 'tài khoản khác không được thấy nhóm riêng tư');
});

test('Hai người dùng có thể tạo nhóm trùng tên mà vẫn tách dữ liệu', async () => {
  const duplicateName = `Nhóm riêng ${groupId}`;
  const created = await jsonPost('/create_group_auth.php', { name: duplicateName }, otherToken);
  assert(created.response.status === 201, `HTTP ${created.response.status}`);
  assert(created.body.data.id !== groupId, 'hai nhóm phải có ID khác nhau');
  assert(created.body.data.name === duplicateName, 'tên nhóm được giữ nguyên');
});

test('Người không thuộc nhóm không đọc được task', async () => {
  const { response, body } = await request(`/get_tasks.php?group_id=${groupId}`, {}, otherToken);
  assert(response.status === 403, `HTTP ${response.status}`);
  assert(body?.success === false, 'success phải là false');
});

test('API không cho tạo công việc khi chưa đăng nhập', async () => {
  const { response } = await jsonPost('/create_task.php', { group_id: groupId, title: 'Không được tạo' }, null);
  assert(response.status === 401, `HTTP ${response.status}`);
});

test('GET thiếu group_id bị từ chối 422', async () => {
  const { response, body } = await request('/get_tasks.php');

  assert(response.status === 422, `HTTP ${response.status}`);
  assert(body?.success === false, 'success phải là false');
  assert(typeof body.message === 'string' && body.message.length > 0, 'phải có message');
});

test('GET group không tồn tại không lộ tài nguyên', async () => {
  const { response, body } = await request('/get_tasks.php?group_id=999999');

  assert(response.status === 403, `HTTP ${response.status}`);
  assert(body?.success === false, 'success phải là false');
});

test('POST create từ chối title rỗng', async () => {
  const { response, body } = await jsonPost('/create_task.php', {
    group_id: groupId,
    title: '   ',
  });

  assert(response.status === 422, `HTTP ${response.status}`);
  assert(body?.success === false, 'success phải là false');
});

test('POST create từ chối group không tồn tại', async () => {
  const { response, body } = await jsonPost('/create_task.php', {
    group_id: 999,
    title: 'Task thuộc nhóm không tồn tại',
  });

  assert(response.status === 403, `HTTP ${response.status}`);
  assert(body?.success === false, 'success phải là false');
});

test('POST create JSON tạo task mới', async () => {
  const title = `Kiểm thử API 'quote' ${Date.now()}`;
  const { response, body } = await jsonPost('/create_task.php', {
    group_id: groupId,
    title,
  });

  assert(response.status === 201, `HTTP ${response.status}`);
  assert(body?.success === true, 'success phải là true');
  assert(typeof body.data?.id === 'number', 'phải trả id');
  assert(body.data.title === title, 'title phải giữ nguyên');
  assert(body.data.status === 'todo', 'task mới phải là todo');

  createdJsonTaskId = body.data.id;
});

test('POST create nhận form-urlencoded', async () => {
  const title = `Kiểm thử form ${Date.now()}`;
  const { response, body } = await request('/create_task.php', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: new URLSearchParams({ group_id: String(groupId), title }).toString(),
  });

  assert(response.status === 201, `HTTP ${response.status}`);
  assert(body?.success === true, 'success phải là true');
  assert(body.data.title === title, 'title phải đúng');
  assert(body.data.status === 'todo', 'task mới phải là todo');

  createdFormTaskId = body.data.id;
});

test('GET thấy các task vừa tạo', async () => {
  const { response, body } = await request(`/get_tasks.php?group_id=${groupId}`);

  assert(response.status === 200, `HTTP ${response.status}`);
  assert(
    body.data.some((task) => task.id === createdJsonTaskId),
    'phải thấy task tạo bằng JSON',
  );
  assert(
    body.data.some((task) => task.id === createdFormTaskId),
    'phải thấy task tạo bằng form',
  );
});

test('POST update đổi trạng thái và lưu vào database', async () => {
  const { response, body } = await jsonPost('/update_task_status.php', {
    id: createdJsonTaskId,
    group_id: groupId,
    status: 'doing',
  });

  assert(response.status === 200, `HTTP ${response.status}`);
  assert(body?.success === true, 'success phải là true');
  assert(body.data.status === 'doing', 'response phải trả doing');

  const reload = await request(`/get_tasks.php?group_id=${groupId}`);
  const reloadedTask = reload.body.data.find(
    (task) => task.id === createdJsonTaskId,
  );

  assert(reloadedTask?.status === 'doing', 'GET phải trả trạng thái đã lưu');
});

test('POST update từ chối trạng thái không hợp lệ', async () => {
  const { response, body } = await jsonPost('/update_task_status.php', {
    id: createdJsonTaskId,
    group_id: groupId,
    status: 'archived',
  });

  assert(response.status === 422, `HTTP ${response.status}`);
  assert(body?.success === false, 'success phải là false');
});

test('POST update từ chối task khác nhóm', async () => {
  const { response, body } = await jsonPost('/update_task_status.php', {
    id: createdJsonTaskId,
    group_id: 999999,
    status: 'done',
  });

  assert(response.status === 403, `HTTP ${response.status}`);
  assert(body?.success === false, 'success phải là false');
});

test('POST update task không tồn tại trả 404', async () => {
  const { response, body } = await jsonPost('/update_task_status.php', {
    id: 999999,
    group_id: groupId,
    status: 'done',
  });

  assert(response.status === 404, `HTTP ${response.status}`);
  assert(body?.success === false, 'success phải là false');
});

test('Bạn bè có thể được mời vào nhóm chỉ bằng user_id', async () => {
  const sent = await jsonPost('/send_friend_request.php', { user_id: otherUserId });
  assert(sent.response.status === 201, `gửi kết bạn HTTP ${sent.response.status}`);
  const friendData = await request('/friends.php', {}, otherToken);
  const incoming = friendData.body.data.incoming[0];
  const accepted = await jsonPost('/respond_friend_request.php', { request_id: incoming.request_id, action: 'accept' }, otherToken);
  assert(accepted.response.status === 200, `chấp nhận kết bạn HTTP ${accepted.response.status}`);
  const candidates = await request(`/group_invite_candidates.php?group_id=${groupId}`);
  assert(candidates.body.data.some((person) => person.id === otherUserId && person.invited === false), 'bạn bè phải xuất hiện trong danh sách mời nhanh');
  const invited = await jsonPost('/invite_group_member.php', { group_id: groupId, user_id: otherUserId });
  assert(invited.response.status === 201, `mời nhóm HTTP ${invited.response.status}`);
  const invitations = await request('/group_invitations.php', {}, otherToken);
  const invitation = invitations.body.data.find((item) => item.group_id === groupId && item.status === 'pending');
  assert(invitation, 'người nhận phải thấy lời mời nhóm');
  const joined = await jsonPost('/respond_group_invitation.php', { invitation_id: invitation.id, action: 'accept' }, otherToken);
  assert(joined.response.status === 200, `tham gia nhóm HTTP ${joined.response.status}`);
});

test('Task lưu và trả về đúng người được phân công', async () => {
  const created = await jsonPost('/create_task.php', { group_id: groupId, title: 'Task có người phụ trách', assignee_ids: [otherUserId] });
  assert(created.response.status === 201, `HTTP ${created.response.status}`);
  assert(created.body.data.assignees?.some((person) => person.id === otherUserId), 'response tạo task phải có người phụ trách');
  const replaced = await jsonPost('/assign_task.php', { task_id: created.body.data.id, user_ids: [] });
  assert(replaced.response.status === 200 && replaced.body.data.assignees.length === 0, 'phải bỏ được phân công');
});

test('Tin nhắn hỗ trợ reaction, sửa và xoá bằng API thật', async () => {
  const created = await jsonPost('/messages.php', { group_id: groupId, body: 'Nội dung ban đầu' });
  assert(created.response.status === 201, `gửi tin HTTP ${created.response.status}`);
  const reacted = await jsonPost('/message_reactions.php', { message_id: created.body.data.id, emoji: '❤️' }, otherToken);
  assert(reacted.body.data.reactions[0]?.count === 1, 'reaction phải được lưu');
  const edited = await jsonPost('/message_actions.php', { message_id: created.body.data.id, action: 'edit', body: 'Nội dung đã sửa' });
  assert(edited.response.status === 200, `sửa tin HTTP ${edited.response.status}`);
  const reloaded = await request(`/messages.php?group_id=${groupId}`);
  assert(reloaded.body.data.some((message) => message.id === created.body.data.id && message.body === 'Nội dung đã sửa' && message.edited_at), 'GET phải trả nội dung và edited_at mới');
  const deleted = await jsonPost('/message_actions.php', { message_id: created.body.data.id, action: 'delete' });
  assert(deleted.response.status === 200, `xoá tin HTTP ${deleted.response.status}`);
  const afterDelete = await request(`/messages.php?group_id=${groupId}`);
  assert(!afterDelete.body.data.some((message) => message.id === created.body.data.id), 'tin đã xoá không được trả lại');
});

test('JSON sai cú pháp trả 400 JSON an toàn', async () => {
  const { response, body } = await request('/create_task.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{"group_id":1,"title":',
  });

  assert(response.status === 400, `HTTP ${response.status}`);
  assert(body?.success === false, 'success phải là false');
  assert(!body.message.includes('<'), 'không được trả HTML');
});

test('Sai method trả 405 và header Allow', async () => {
  const { response, body } = await request('/create_task.php');

  assert(response.status === 405, `HTTP ${response.status}`);
  assert(body?.success === false, 'success phải là false');
  assert(response.headers.get('allow') === 'POST', 'Allow phải là POST');
});

test('CORS preflight trả 204', async () => {
  const { response } = await request('/create_task.php', {
    method: 'OPTIONS',
    headers: {
      Origin: 'http://localhost:8081',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'content-type',
    },
  });

  assert(response.status === 204, `HTTP ${response.status}`);
  assert(
    response.headers.get('access-control-allow-origin') === '*',
    'phải có Access-Control-Allow-Origin',
  );
});

test('File nội bộ và database không truy cập được qua HTTP', async () => {
  for (const pathname of [
    '/data/test.sqlite',
    '/data/',
    '/config.php',
    '/.env',
    '/schema.mysql.sql',
    '/api/auth/login.php',
    '/core/config.php',
    '/database/schema.mysql.sql',
    '/storage/data/',
  ]) {
    const { response, text } = await request(pathname);
    assert(response.status === 404, `${pathname} phải trả 404`);
    assert(!text.includes('DB_PASSWORD'), `${pathname} không được lộ cấu hình`);
  }
});

async function findFreePort() {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once('error', reject);
    probe.listen(0, '127.0.0.1', () => {
      const address = probe.address();
      const freePort = typeof address === 'object' && address ? address.port : 0;
      probe.close(() => resolve(freePort));
    });
  });
}

async function waitForServer() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/health.php`);
      if (response.ok) {
        return;
      }
    } catch {
      // Server chưa sẵn sàng.
    }

    await new Promise((resolve) => setTimeout(resolve, 150));
  }

  throw new Error(`PHP server không khởi động được.\n${serverOutput}`);
}

async function stopServer() {
  if (server.exitCode !== null) {
    return;
  }

  server.kill();
  await Promise.race([
    once(server, 'exit'),
    new Promise((resolve) => setTimeout(resolve, 2000)),
  ]);

  if (server.exitCode === null) {
    server.kill('SIGKILL');
  }
}

let failed = false;

try {
  await waitForServer();

  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const firstRegistration = await jsonPost('/register.php', {
    name: 'Người tạo nhóm', email: `owner-${suffix}@example.test`, password: 'StudySync123!'
  }, null);
  assert(firstRegistration.response.status === 201, `Đăng ký chủ nhóm HTTP ${firstRegistration.response.status}`);
  primaryToken = firstRegistration.body.data.token;

  const secondRegistration = await jsonPost('/register.php', {
    name: 'Người học mới', email: `new-${suffix}@example.test`, password: 'StudySync123!'
  }, null);
  assert(secondRegistration.response.status === 201, `Đăng ký tài khoản mới HTTP ${secondRegistration.response.status}`);
  otherToken = secondRegistration.body.data.token;
  otherUserId = secondRegistration.body.data.user.id;

  const createdGroup = await jsonPost('/create_group_auth.php', { name: `Nhóm riêng ${suffix}` });
  assert(createdGroup.response.status === 201, `Tạo nhóm HTTP ${createdGroup.response.status}`);
  groupId = createdGroup.body.data.id;

  for (const { name, handler } of tests) {
    try {
      await handler();
      console.log(`  ✓ ${name}`);
    } catch (error) {
      failed = true;
      console.error(`  ✗ ${name}`);
      console.error(`    ${error.message}`);
      if (serverOutput) {
        console.error('--- PHP server output ---');
        console.error(serverOutput.trim());
        console.error('-------------------------');
      }
    }
  }

  if (failed) {
    console.error(`\n${tests.length} kiểm thử, có lỗi.`);
    process.exitCode = 1;
  } else {
    console.log(`\n${tests.length}/${tests.length} kiểm thử API đều đạt.`);
  }
} catch (error) {
  failed = true;
  console.error(`Không chạy được kiểm thử: ${error.message}`);
  process.exitCode = 1;
} finally {
  await stopServer();
  await rm(temporaryDirectory, { recursive: true, force: true }).catch(() => {});
}
