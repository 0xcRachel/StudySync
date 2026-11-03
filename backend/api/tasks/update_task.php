<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/_init.php';
run_api(static function (): void {
    require_method('POST', 'PATCH');
    $data = read_request_data();
    $id = parse_positive_int($data['id'] ?? null, 'Mã công việc');
    $groupId = parse_positive_int($data['group_id'] ?? null, 'Mã nhóm');
    $title = parse_title($data['title'] ?? null);
    $status = parse_status($data['status'] ?? 'todo');
    $pdo = db();
    $me = require_auth();
    require_group_member($pdo, $groupId, $me['id']);
    $existingTask = find_task($pdo, $id);
    // Without this guard the UPDATE matches no row and the endpoint would
    // report success while echoing back another group's task.
    if ($existingTask === null || $existingTask['group_id'] !== $groupId) {
        throw new ApiException(404, 'Không tìm thấy công việc trong nhóm này.');
    }
    $statement = $pdo->prepare('UPDATE `tasks` SET title = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND group_id = ?');
    $statement->execute([$title, $status, $id, $groupId]);
    send_json(['success' => true, 'data' => find_task($pdo, $id)]);
});
