<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/_init.php';
run_api(static function (): void {
    require_method('POST', 'DELETE');
    $me = require_auth();
    $data = read_request_data();
    $id = parse_positive_int($_GET['id'] ?? $data['id'] ?? null, 'Mã công việc');
    $pdo = db();
    $taskQuery = $pdo->prepare('SELECT group_id FROM `tasks` WHERE id = ? LIMIT 1');
    $taskQuery->execute([$id]);
    $groupId = $taskQuery->fetchColumn();
    if ($groupId === false) throw new ApiException(404, 'Không tìm thấy công việc.');
    require_group_member($pdo, (int) $groupId, $me['id']);
    $statement = $pdo->prepare('DELETE FROM `tasks` WHERE id = ?'); $statement->execute([$id]);
    if ($statement->rowCount() === 0) throw new ApiException(404, 'Không tìm thấy công việc.');
    send_json(['success' => true, 'message' => 'Đã xoá công việc.']);
});
