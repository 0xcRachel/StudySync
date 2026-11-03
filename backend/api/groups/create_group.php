<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/_init.php';

run_api(static function (): void {
    require_method('POST');
    $owner = require_auth();
    $data = read_request_data();
    $name = parse_group_name($data['name'] ?? null);
    $pdo = db();
    try {
        $pdo->beginTransaction();
        $statement = $pdo->prepare('INSERT INTO `groups` (`name`) VALUES (?)');
        $statement->execute([$name]);
        $id = (int) $pdo->lastInsertId();
        $pdo->prepare('INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, "owner")')->execute([$id, $owner['id']]);
        $pdo->commit();
    } catch (PDOException $error) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        if ((string) $error->getCode() === '23000') throw new ApiException(409, 'Tên nhóm đã tồn tại.');
        throw $error;
    } catch (Throwable $error) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        throw $error;
    }
    send_json(['success' => true, 'message' => 'Tạo nhóm thành công.', 'data' => ['id' => $id, 'name' => $name, 'task_count' => 0, 'completed_count' => 0]], 201);
});
