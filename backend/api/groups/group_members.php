<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/_init.php';
run_api(static function (): void {
    require_method('GET'); $me = require_auth(); $groupId = parse_positive_int($_GET['group_id'] ?? null, 'Mã nhóm'); $pdo = db(); require_group_member($pdo, $groupId, $me['id']);
    $statement = $pdo->prepare('SELECT m.role, m.joined_at, u.id, u.name, u.username, u.email, u.avatar_url, u.bio, u.last_seen_at, u.created_at FROM group_members m JOIN users u ON u.id = m.user_id WHERE m.group_id = ? ORDER BY FIELD(m.role, "owner", "admin", "member"), u.name'); $statement->execute([$groupId]); send_json(['success' => true, 'data' => $statement->fetchAll()]);
});
