<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/_init.php';
run_api(static function (): void {
    require_method('POST'); $me = require_auth(); $data = read_request_data(); $taskId = parse_positive_int($data['task_id'] ?? null, 'Mã công việc'); $pdo = db();
    $statement = $pdo->prepare('SELECT group_id, title FROM tasks WHERE id = ?'); $statement->execute([$taskId]); $task = $statement->fetch(); if ($task === false) throw new ApiException(404, 'Không tìm thấy công việc.'); require_group_member($pdo, (int) $task['group_id'], $me['id']);
    $rawIds = $data['user_ids'] ?? (isset($data['user_id']) ? [$data['user_id']] : []);
    if (!is_array($rawIds) || count($rawIds) > 30) throw new ApiException(422, 'Danh sách người phụ trách không hợp lệ.');
    $userIds = array_values(array_unique(array_map(static fn ($id): int => parse_positive_int($id, 'Mã người dùng'), $rawIds)));
    if ($userIds !== []) {
        $marks = implode(',', array_fill(0, count($userIds), '?'));
        $check = $pdo->prepare('SELECT user_id FROM group_members WHERE group_id = ? AND user_id IN (' . $marks . ')');
        $check->execute(array_merge([(int) $task['group_id']], $userIds));
        if (count($check->fetchAll(PDO::FETCH_COLUMN)) !== count($userIds)) throw new ApiException(422, 'Chỉ có thể giao việc cho thành viên trong nhóm.');
    }
    $pdo->beginTransaction();
    try {
        $existing = $pdo->prepare('SELECT user_id FROM task_assignees WHERE task_id = ?'); $existing->execute([$taskId]); $oldIds = array_map('intval', $existing->fetchAll(PDO::FETCH_COLUMN));
        $pdo->prepare('DELETE FROM task_assignees WHERE task_id = ?')->execute([$taskId]);
        $insert = $pdo->prepare('INSERT INTO task_assignees (task_id, user_id) VALUES (?, ?)');
        foreach ($userIds as $userId) { $insert->execute([$taskId, $userId]); if (!in_array($userId, $oldIds, true) && $userId !== (int) $me['id']) notify_user($pdo, $userId, 'task_assigned', 'Bạn được giao công việc', $me['name'] . ' giao cho bạn: ' . $task['title'], ['task_id' => $taskId, 'group_id' => (int) $task['group_id']]); }
        $pdo->commit();
    } catch (Throwable $error) { if ($pdo->inTransaction()) $pdo->rollBack(); throw $error; }
    send_json(['success' => true, 'message' => 'Đã cập nhật người phụ trách.', 'data' => find_task($pdo, $taskId)]);
});
