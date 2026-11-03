<?php

declare(strict_types=1);

require_once dirname(__DIR__) . '/_init.php';

run_api(static function (): void {
    // POST là method frontend dùng; PATCH được hỗ trợ thêm cho client khác.
    require_method('POST', 'PATCH');

    $data = read_request_data();
    $taskId = parse_positive_int(
        $data['id'] ?? $data['task_id'] ?? null,
        'Mã công việc'
    );
    $groupId = parse_positive_int($data['group_id'] ?? null, 'Mã nhóm');
    $status = parse_status($data['status'] ?? null);
    $pdo = db();
    $me = require_auth();
    require_group_member($pdo, $groupId, $me['id']);

    $existingTask = find_task($pdo, $taskId);

    if ($existingTask === null || $existingTask['group_id'] !== $groupId) {
        throw new ApiException(404, 'Không tìm thấy công việc trong nhóm này.');
    }

    $statement = $pdo->prepare(
        'UPDATE `tasks`
         SET `status` = ?, `updated_at` = CURRENT_TIMESTAMP
         WHERE `id` = ? AND `group_id` = ?'
    );
    $statement->execute([$status, $taskId, $groupId]);

    send_json([
        'success' => true,
        'message' => 'Cập nhật trạng thái thành công.',
        'data' => find_task($pdo, $taskId),
    ]);
});
