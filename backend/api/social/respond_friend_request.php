<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/_init.php';
run_api(static function (): void {
    require_method('POST'); $me = require_auth(); $data = read_request_data(); $requestId = parse_positive_int($data['request_id'] ?? null, 'Mã lời mời'); $action = strtolower((string) ($data['action'] ?? '')); if (!in_array($action, ['accept', 'decline', 'block'], true)) throw new ApiException(422, 'Action phải là accept, decline hoặc block.'); $pdo = db();
    $statement = $pdo->prepare('SELECT * FROM friendships WHERE id = ? AND addressee_id = ? AND status = "pending" LIMIT 1'); $statement->execute([$requestId, $me['id']]); $request = $statement->fetch(); if ($request === false) throw new ApiException(404, 'Không tìm thấy lời mời kết bạn.');
    $status = $action === 'accept' ? 'accepted' : ($action === 'block' ? 'blocked' : 'declined'); $pdo->prepare('UPDATE friendships SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')->execute([$status, $requestId]);
    if ($status === 'accepted') notify_user($pdo, (int) $request['requester_id'], 'friend_accepted', 'Lời mời được chấp nhận', $me['name'] . ' đã chấp nhận lời mời kết bạn.', ['user_id' => $me['id']]);
    send_json(['success' => true, 'message' => $status === 'accepted' ? 'Đã trở thành bạn bè.' : 'Đã xử lý lời mời.']);
});
