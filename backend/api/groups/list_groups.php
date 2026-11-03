<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/_init.php';

run_api(static function (): void {
    require_method('GET');
    $pdo = db();
    $me = require_auth();
    $statement = $pdo->prepare(
        'SELECT g.id, g.name, g.description, g.created_at, COUNT(DISTINCT t.id) AS task_count,
                COUNT(DISTINCT CASE WHEN t.status = "done" THEN t.id END) AS completed_count
         FROM `groups` g
         JOIN group_members gm ON gm.group_id = g.id AND gm.user_id = ?
         LEFT JOIN `tasks` t ON t.group_id = g.id
         GROUP BY g.id, g.name, g.description, g.created_at ORDER BY g.id DESC'
    );
    $statement->execute([$me['id']]);
    $rows = $statement->fetchAll();
    $groups = array_map(static fn(array $row): array => [
        'id' => (int) $row['id'], 'name' => (string) $row['name'], 'description' => $row['description'],
        'task_count' => (int) $row['task_count'], 'completed_count' => (int) ($row['completed_count'] ?? 0),
        'created_at' => (string) $row['created_at'],
    ], $rows);
    send_json(['success' => true, 'data' => $groups, 'meta' => ['total' => count($groups)]]);
});
