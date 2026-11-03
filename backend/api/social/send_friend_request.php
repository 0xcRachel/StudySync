<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/_init.php';
run_api(static function (): void {
    require_method('POST'); $me = require_auth(); $data = read_request_data(); $targetId = parse_positive_int($data['user_id'] ?? null, 'Mã người dùng'); if ($targetId === $me['id']) throw new ApiException(422, 'Không thể kết bạn với chính mình.'); $pdo = db();
    $exists = $pdo->prepare('SELECT id, requester_id, addressee_id, status FROM friendships WHERE (requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?) LIMIT 1'); $exists->execute([$me['id'], $targetId, $targetId, $me['id']]); $friendship = $exists->fetch();
    if ($friendship !== false) { if ($friendship['status'] === 'accepted') throw new ApiException(409, 'Hai người đã là bạn bè.'); if ($friendship['status'] === 'pending') throw new ApiException(409, 'Lời mời kết bạn đang chờ xử lý.'); if ($friendship['status'] === 'blocked') throw new ApiException(403, 'Bạn không thể gửi lời mời tới người dùng này.'); $pdo->prepare('DELETE FROM friendships WHERE id = ?')->execute([$friendship['id']]); }
    $target = $pdo->prepare('SELECT id, name FROM users WHERE id = ? AND is_active = 1'); $target->execute([$targetId]); $user = $target->fetch(); if ($user === false) throw new ApiException(404, 'Không tìm thấy người dùng.');
    $pdo->prepare('INSERT INTO friendships (requester_id, addressee_id) VALUES (?, ?)')->execute([$me['id'], $targetId]); notify_user($pdo, $targetId, 'friend_request', 'Lời mời kết bạn mới', $me['name'] . ' đã gửi lời mời kết bạn.', ['user_id' => $me['id']]);
    send_json(['success' => true, 'message' => 'Đã gửi lời mời kết bạn.'], 201);
});
