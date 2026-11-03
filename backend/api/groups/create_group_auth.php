<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/_init.php';
run_api(static function (): void {
    require_method('POST');
    $owner = require_auth();
    $data = read_request_data();
    $name = parse_group_name($data['name'] ?? null);
    $description = isset($data['description']) ? trim((string) $data['description']) : null;
    if ($description !== null && mb_strlen($description, 'UTF-8') > 500) throw new ApiException(422, 'Mô tả nhóm không được dài quá 500 ký tự.');
    $pdo = db();
    try {
        $pdo->beginTransaction();
        // `groups` is a reserved keyword on supported MySQL versions.
        $statement = $pdo->prepare('INSERT INTO `groups` (`name`, `description`) VALUES (?, ?)');
        $statement->execute([$name, $description ?: null]);
        $id = (int) $pdo->lastInsertId();
        $pdo->prepare('INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, "owner")')->execute([$id, $owner['id']]);
        $pdo->commit();
    } catch (Throwable $error) { if ($pdo->inTransaction()) $pdo->rollBack(); throw $error; }
    send_json(['success' => true, 'data' => ['id' => $id, 'name' => $name, 'description' => $description, 'task_count' => 0, 'completed_count' => 0]], 201);
});
