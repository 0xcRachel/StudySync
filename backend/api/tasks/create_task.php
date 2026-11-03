<?php

declare(strict_types=1);

require_once dirname(__DIR__) . '/_init.php';

run_api(static function (): void {
    require_method('POST');

    $data = read_request_data();
    $groupId = parse_positive_int($data['group_id'] ?? null, 'Mã nhóm');
    $title = parse_title($data['title'] ?? null);
    $pdo = db();
    $me = require_auth();
    require_group_member($pdo, $groupId, $me['id']);
    $rawAssignees = $data['assignee_ids'] ?? [];
    if (!is_array($rawAssignees) || count($rawAssignees) > 30) throw new ApiException(422, 'Danh sách người phụ trách không hợp lệ.');
    $assigneeIds = array_values(array_unique(array_map(static fn ($id): int => parse_positive_int($id, 'Người phụ trách'), $rawAssignees)));
    if ($assigneeIds !== []) {
        $marks = implode(',', array_fill(0, count($assigneeIds), '?'));
        $memberCheck = $pdo->prepare('SELECT user_id FROM group_members WHERE group_id = ? AND user_id IN (' . $marks . ')');
        $memberCheck->execute(array_merge([$groupId], $assigneeIds));
        $validIds = array_map('intval', $memberCheck->fetchAll(PDO::FETCH_COLUMN));
        if (count($validIds) !== count($assigneeIds)) throw new ApiException(422, 'Chỉ có thể giao việc cho thành viên trong nhóm.');
    }

    ensure_group_exists($pdo, $groupId);

    $pdo->beginTransaction();
    try {
        $statement = $pdo->prepare("INSERT INTO `tasks` (`group_id`, `title`, `status`) VALUES (?, ?, 'todo')");
        $statement->execute([$groupId, $title]);
        $taskId = (int) $pdo->lastInsertId();
        if ($assigneeIds !== []) {
            $assign = $pdo->prepare('INSERT INTO task_assignees (task_id, user_id) VALUES (?, ?)');
            foreach ($assigneeIds as $assigneeId) {
                $assign->execute([$taskId, $assigneeId]);
                if ($assigneeId !== (int) $me['id']) notify_user($pdo, $assigneeId, 'task_assigned', 'Bạn được giao công việc', $me['name'] . ' giao cho bạn: ' . $title, ['task_id' => $taskId, 'group_id' => $groupId]);
            }
        }
        $pdo->commit();
    } catch (Throwable $error) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        throw $error;
    }
    $task = find_task($pdo, $taskId);

    send_json([
        'success' => true,
        'message' => 'Tạo công việc thành công.',
        'data' => $task,
    ], 201);
});
