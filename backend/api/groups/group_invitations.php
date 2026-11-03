<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/_init.php';
run_api(static function (): void {
    require_method('GET'); $me = require_auth(); $pdo = db();
    $statement = $pdo->prepare('SELECT i.id, i.group_id, g.name AS group_name, i.inviter_id, u.name AS inviter_name, i.status, i.created_at FROM group_invitations i JOIN `groups` g ON g.id = i.group_id JOIN users u ON u.id = i.inviter_id WHERE i.invitee_id = ? ORDER BY i.id DESC LIMIT 100'); $statement->execute([$me['id']]);
    send_json(['success' => true, 'data' => $statement->fetchAll()]);
});
