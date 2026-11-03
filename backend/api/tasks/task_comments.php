<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/_init.php';
run_api(static function (): void {
    $me = require_auth(); $pdo = db(); $method = require_method('GET', 'POST'); $taskId = parse_positive_int($_GET['task_id'] ?? null, 'Mã công việc'); $task = $pdo->prepare('SELECT group_id FROM tasks WHERE id = ?'); $task->execute([$taskId]); $row = $task->fetch(); if ($row === false) throw new ApiException(404, 'Không tìm thấy công việc.'); require_group_member($pdo, (int) $row['group_id'], $me['id']);
    if ($method === 'GET') { $statement = $pdo->prepare('SELECT c.id, c.task_id, c.user_id, u.name AS user_name, u.avatar_url, c.body, c.created_at FROM task_comments c JOIN users u ON u.id = c.user_id WHERE c.task_id = ? ORDER BY c.id ASC'); $statement->execute([$taskId]); send_json(['success' => true, 'data' => $statement->fetchAll()]); }
    $data = read_request_data(); $body = trim((string) ($data['body'] ?? '')); if ($body === '' || mb_strlen($body, 'UTF-8') > 1000) throw new ApiException(422, 'Bình luận phải từ 1 đến 1000 ký tự.'); $statement = $pdo->prepare('INSERT INTO task_comments (task_id, user_id, body) VALUES (?, ?, ?)'); $statement->execute([$taskId, $me['id'], $body]); send_json(['success' => true, 'data' => ['id' => (int) $pdo->lastInsertId(), 'task_id' => $taskId, 'user_id' => $me['id'], 'user_name' => $me['name'], 'body' => $body]], 201);
});
