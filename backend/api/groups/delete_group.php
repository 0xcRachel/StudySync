<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/_init.php';
run_api(static function (): void {
    require_method('POST', 'DELETE');
    $me = require_auth();
    $data = read_request_data();
    $id = parse_positive_int($_GET['id'] ?? $data['id'] ?? null, 'Mã nhóm');
    $pdo = db();
    require_group_member($pdo, $id, $me['id'], ['owner', 'admin']);
    $statement = $pdo->prepare('DELETE FROM `groups` WHERE id = ?');
    $statement->execute([$id]);
    send_json(['success' => true, 'message' => 'Đã xoá nhóm.']);
});
