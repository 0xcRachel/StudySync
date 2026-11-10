<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/_init.php';

run_api(static function (): void {
    require_method('GET');
    $pdo = db();
    $me = require_auth();
    $statement = $pdo->prepare(
        'SELECT g.id, g.name, g.description, g.avatar_url, g.created_at, COUNT(DISTINCT t.id) AS task_count,
                COUNT(DISTINCT CASE WHEN t.status = "done" THEN t.id END) AS completed_count,
                COUNT(DISTINCT CASE WHEN m.sender_id <> ? AND m.id > COALESCE(mr.last_message_id, 0) THEN m.id END) AS unread_count,
                COUNT(DISTINCT CASE WHEN m.sender_id <> ? AND m.id > COALESCE(mr.last_message_id, 0) AND mm.message_id IS NOT NULL THEN m.id END) AS mention_count
         FROM `groups` g
         JOIN group_members gm ON gm.group_id = g.id AND gm.user_id = ?
         LEFT JOIN `tasks` t ON t.group_id = g.id
         LEFT JOIN messages m ON m.group_id = g.id AND m.deleted_at IS NULL
         LEFT JOIN message_reads mr ON mr.group_id = g.id AND mr.user_id = ?
         LEFT JOIN message_mentions mm ON mm.message_id = m.id AND mm.user_id = ?
         GROUP BY g.id, g.name, g.description, g.avatar_url, g.created_at ORDER BY g.id DESC'
    );
    // Mốc đọc là per-group (message_reads PK = group_id + user_id); chưa có hàng
    // nghĩa là chưa đọc gì, COALESCE 0 nên toàn bộ tin của người khác đều tính.
    $statement->execute([$me['id'], $me['id'], $me['id'], $me['id'], $me['id']]);
    $rows = $statement->fetchAll();
    $groups = array_map(static fn(array $row): array => [
        'id' => (int) $row['id'], 'name' => (string) $row['name'], 'description' => $row['description'],
        'avatar_url' => $row['avatar_url'] ?? null,
        'task_count' => (int) $row['task_count'], 'completed_count' => (int) ($row['completed_count'] ?? 0),
        'unread_count' => (int) ($row['unread_count'] ?? 0), 'mention_count' => (int) ($row['mention_count'] ?? 0),
        'created_at' => (string) $row['created_at'],
    ], $rows);
    send_json(['success' => true, 'data' => $groups, 'meta' => ['total' => count($groups)]]);
});
