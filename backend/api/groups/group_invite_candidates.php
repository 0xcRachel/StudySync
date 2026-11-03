<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/_init.php';

run_api(static function (): void {
    require_method('GET');
    $me = require_auth();
    $groupId = parse_positive_int($_GET['group_id'] ?? null, 'Mã nhóm');
    $pdo = db();
    require_group_member($pdo, $groupId, (int) $me['id'], ['owner', 'admin']);
    $statement = $pdo->prepare(
        'SELECT u.id, u.name, u.username, u.email, u.avatar_url, u.last_seen_at,
                CASE WHEN EXISTS (
                    SELECT 1 FROM group_invitations gi
                    WHERE gi.group_id = ? AND gi.invitee_id = u.id AND gi.status = "pending"
                ) THEN 1 ELSE 0 END AS invited
         FROM friendships f
         JOIN users u ON u.id = CASE WHEN f.requester_id = ? THEN f.addressee_id ELSE f.requester_id END
         WHERE (f.requester_id = ? OR f.addressee_id = ?) AND f.status = "accepted"
           AND u.is_active = 1
           AND NOT EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = ? AND gm.user_id = u.id)
         ORDER BY invited ASC, u.name ASC'
    );
    $statement->execute([$groupId, $me['id'], $me['id'], $me['id'], $groupId]);
    $rows = array_map(static function (array $row): array {
        $row['id'] = (int) $row['id'];
        $row['invited'] = (bool) $row['invited'];
        return $row;
    }, $statement->fetchAll());
    send_json(['success' => true, 'data' => $rows]);
});
