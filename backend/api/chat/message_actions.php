<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/_init.php';

run_api(static function (): void {
    require_method('POST');
    $me = require_auth();
    $data = read_request_data();
    $messageId = parse_positive_int($data['message_id'] ?? null, 'Tin nhắn');
    $action = strtolower(trim((string) ($data['action'] ?? '')));
    if (!in_array($action, ['edit', 'delete'], true)) throw new ApiException(422, 'Thao tác tin nhắn không hợp lệ.');
    $pdo = db();
    $statement = $pdo->prepare('SELECT id, group_id, sender_id, body, image_name FROM messages WHERE id = ? AND deleted_at IS NULL LIMIT 1');
    $statement->execute([$messageId]);
    $message = $statement->fetch();
    if ($message === false || $message['group_id'] === null) throw new ApiException(404, 'Không tìm thấy tin nhắn.');
    $membership = require_group_member($pdo, (int) $message['group_id'], (int) $me['id']);

    if ($action === 'edit') {
        if ((int) $message['sender_id'] !== (int) $me['id']) throw new ApiException(403, 'Bạn chỉ có thể sửa tin nhắn của mình.');
        $body = trim((string) ($data['body'] ?? ''));
        if ($body === '' && $message['image_name'] === null) throw new ApiException(422, 'Tin nhắn không được để trống.');
        if (mb_strlen($body, 'UTF-8') > 4000) throw new ApiException(422, 'Tin nhắn tối đa 4000 ký tự.');
        $storedBody = $body !== '' ? $body : 'Ảnh đính kèm';
        $pdo->prepare('UPDATE messages SET body = ?, edited_at = CURRENT_TIMESTAMP WHERE id = ?')->execute([$storedBody, $messageId]);
        send_json(['success' => true, 'message' => 'Đã sửa tin nhắn.', 'data' => ['message_id' => $messageId, 'body' => $storedBody]]);
    }

    $canModerate = in_array((string) $membership['role'], ['owner', 'admin'], true);
    if ((int) $message['sender_id'] !== (int) $me['id'] && !$canModerate) throw new ApiException(403, 'Bạn không có quyền xoá tin nhắn này.');
    $pdo->prepare('UPDATE messages SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?')->execute([$messageId]);
    send_json(['success' => true, 'message' => 'Đã xoá tin nhắn.', 'data' => ['message_id' => $messageId]]);
});
