<?php

declare(strict_types=1);

require_once dirname(__DIR__) . '/_init.php';

run_api(static function (): void {
    require_method('GET');

    $groupId = parse_positive_int($_GET['group_id'] ?? null, 'Mã nhóm');
    $pdo = db();
    $me = require_auth();
    require_group_member($pdo, $groupId, $me['id']);

    ensure_group_exists($pdo, $groupId);

    $statement = $pdo->prepare(
        'SELECT `id`, `group_id`, `title`, `status`, `created_at`, `updated_at`
         FROM `tasks`
         WHERE `group_id` = ?
         ORDER BY `id` ASC'
    );
    $statement->execute([$groupId]);

    $tasks = attach_task_assignees($pdo, array_map('task_to_array', $statement->fetchAll()));

    send_json([
        'success' => true,
        'data' => $tasks,
        'meta' => [
            'group_id' => $groupId,
            'total' => count($tasks),
        ],
    ]);
});
