<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/_init.php';
run_api(static function (): void {
    require_method('GET'); $me = require_auth(); $pdo = db();
    $statement = $pdo->prepare('SELECT f.id AS friendship_id, f.status, f.requester_id, f.addressee_id, u.id, u.name, u.email, u.avatar_url, u.bio, u.last_seen_at, u.created_at FROM friendships f JOIN users u ON u.id = CASE WHEN f.requester_id = ? THEN f.addressee_id ELSE f.requester_id END WHERE (f.requester_id = ? OR f.addressee_id = ?) AND f.status = "accepted" ORDER BY u.name'); $statement->execute([$me['id'], $me['id'], $me['id']]);
    $friends = array_map(static function (array $row): array { $user = public_user($row); $user['friendship_id'] = (int) $row['friendship_id']; return $user; }, $statement->fetchAll());
    $incoming = $pdo->prepare('SELECT f.id AS request_id, u.id, u.name, u.email, u.avatar_url, u.bio, u.last_seen_at, u.created_at FROM friendships f JOIN users u ON u.id = f.requester_id WHERE f.addressee_id = ? AND f.status = "pending" ORDER BY f.id DESC'); $incoming->execute([$me['id']]);
    $outgoing = $pdo->prepare('SELECT f.id AS request_id, u.id, u.name, u.email, u.avatar_url, u.bio, u.last_seen_at, u.created_at FROM friendships f JOIN users u ON u.id = f.addressee_id WHERE f.requester_id = ? AND f.status = "pending" ORDER BY f.id DESC'); $outgoing->execute([$me['id']]);
    send_json(['success' => true, 'data' => ['friends' => $friends, 'incoming' => $incoming->fetchAll(), 'outgoing' => $outgoing->fetchAll()]]);
});
