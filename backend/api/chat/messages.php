<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/_init.php';

run_api(static function (): void {
    $pdo = db();
    $me = require_auth();
    $method = require_method('GET', 'POST');

    if ($method === 'GET') {
        $groupId = parse_positive_int($_GET['group_id'] ?? null, 'Mã nhóm');
        require_group_member($pdo, $groupId, $me['id']);
        $before = isset($_GET['before_id']) ? parse_positive_int($_GET['before_id'], 'Mã tin nhắn') : PHP_INT_MAX;
        $limit = min(max((int) ($_GET['limit'] ?? 50), 1), 100);
        $statement = $pdo->prepare(
            'SELECT m.id, m.group_id, m.sender_id, u.name AS sender_name, u.avatar_url,
                    m.body, m.reply_to_id, m.image_name, m.created_at, m.edited_at,
                    parent.body AS reply_body, parent.image_name AS reply_image_name,
                    reply_user.name AS reply_sender_name, reply_user.avatar_url AS reply_avatar_url
             FROM messages m JOIN users u ON u.id = m.sender_id
             LEFT JOIN messages parent ON parent.id = m.reply_to_id AND parent.deleted_at IS NULL
             LEFT JOIN users reply_user ON reply_user.id = parent.sender_id
             WHERE m.group_id = ? AND m.id < ? AND m.deleted_at IS NULL
             ORDER BY m.id DESC LIMIT ' . $limit
        );
        $statement->execute([$groupId, $before]);
        $messages = array_reverse($statement->fetchAll());
        $messageIds = array_map(static fn (array $message): int => (int) $message['id'], $messages);
        $reactionMap = [];
        if ($messageIds !== []) {
            $marks = implode(',', array_fill(0, count($messageIds), '?'));
            $reactionQuery = $pdo->prepare('SELECT message_id, emoji, COUNT(*) AS total, SUM(user_id = ?) AS mine FROM message_reactions WHERE message_id IN (' . $marks . ') GROUP BY message_id, emoji');
            $reactionQuery->execute(array_merge([$me['id']], $messageIds));
            foreach ($reactionQuery->fetchAll() as $reaction) {
                $reactionMap[(int) $reaction['message_id']][] = ['emoji' => (string) $reaction['emoji'], 'count' => (int) $reaction['total'], 'reacted' => (int) $reaction['mine'] > 0];
            }
        }
        foreach ($messages as &$message) {
            $message['reactions'] = $reactionMap[(int) $message['id']] ?? [];
            $message['image_url'] = $message['image_name'] ? '/message_image.php?id=' . (int) $message['id'] : null;
            $message['reply_to'] = $message['reply_to_id'] && $message['reply_sender_name'] !== null
                ? ['id' => (int) $message['reply_to_id'], 'sender_name' => (string) $message['reply_sender_name'], 'avatar_url' => $message['reply_avatar_url'], 'body' => (string) $message['reply_body'], 'has_image' => $message['reply_image_name'] !== null]
                : null;
            unset($message['image_name'], $message['reply_image_name'], $message['reply_body'], $message['reply_sender_name'], $message['reply_avatar_url']);
        }
        unset($message);
        send_json(['success' => true, 'data' => $messages]);
    }

    $isMultipart = str_contains(strtolower($_SERVER['CONTENT_TYPE'] ?? ''), 'multipart/form-data');
    $data = $isMultipart ? $_POST : read_request_data();
    $groupId = parse_positive_int($data['group_id'] ?? null, 'Mã nhóm');
    require_group_member($pdo, $groupId, $me['id']);
    $body = trim((string) ($data['body'] ?? ''));
    if (mb_strlen($body, 'UTF-8') > 4000) throw new ApiException(422, 'Tin nhắn tối đa 4000 ký tự.');
    $rawMentions = $data['mention_ids'] ?? [];
    if (is_string($rawMentions)) {
        try { $rawMentions = json_decode($rawMentions, true, 8, JSON_THROW_ON_ERROR); }
        catch (JsonException) { throw new ApiException(422, 'Danh sách người được nhắc không hợp lệ.'); }
    }
    if (!is_array($rawMentions) || count($rawMentions) > 20) throw new ApiException(422, 'Danh sách người được nhắc không hợp lệ.');
    $mentionIds = array_values(array_unique(array_map(static fn ($id): int => parse_positive_int($id, 'Mã người được nhắc'), $rawMentions)));
    $mentionIds = array_values(array_filter($mentionIds, static fn (int $id): bool => $id !== $me['id']));
    $hasImage = isset($_FILES['image']) && is_array($_FILES['image']);
    if ($body === '' && !$hasImage) throw new ApiException(422, 'Nhập nội dung hoặc chọn ảnh để gửi.');

    $replyToId = null;
    if (isset($data['reply_to_id']) && (string) $data['reply_to_id'] !== '') {
        $replyToId = parse_positive_int($data['reply_to_id'], 'Tin nhắn được trả lời');
        $parentCheck = $pdo->prepare('SELECT id FROM messages WHERE id = ? AND group_id = ? AND deleted_at IS NULL LIMIT 1');
        $parentCheck->execute([$replyToId, $groupId]);
        if ($parentCheck->fetchColumn() === false) throw new ApiException(404, 'Tin nhắn được trả lời không tồn tại trong nhóm này.');
    }

    $imageName = null;
    if ($hasImage) {
        $upload = $_FILES['image'];
        $uploadError = (int) ($upload['error'] ?? UPLOAD_ERR_NO_FILE);
        if ($uploadError !== UPLOAD_ERR_OK) {
            $tooLarge = in_array($uploadError, [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true);
            throw new ApiException($tooLarge ? 413 : 422, $tooLarge ? 'Ảnh vượt quá giới hạn 5 MB.' : 'Không tải được ảnh đã chọn.');
        }
        if (!is_uploaded_file((string) $upload['tmp_name']) || (int) $upload['size'] < 1 || (int) $upload['size'] > 5 * 1024 * 1024) {
            throw new ApiException(413, 'Ảnh phải có dung lượng từ 1 byte đến 5 MB.');
        }
        $mime = (new finfo(FILEINFO_MIME_TYPE))->file((string) $upload['tmp_name']);
        $extensions = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', 'image/gif' => 'gif'];
        $dimensions = @getimagesize((string) $upload['tmp_name']);
        if (!isset($extensions[$mime]) || $dimensions === false || ($dimensions['mime'] ?? '') !== $mime) {
            throw new ApiException(415, 'Chỉ nhận ảnh JPEG, PNG, WebP hoặc GIF hợp lệ.');
        }
        if ($dimensions[0] > 12000 || $dimensions[1] > 12000 || $dimensions[0] * $dimensions[1] > 40000000) {
            throw new ApiException(422, 'Kích thước ảnh tối đa là 40 megapixel.');
        }
        $directory = dirname(__DIR__, 2) . '/storage/chat';
        if (!is_dir($directory) && !mkdir($directory, 0750, true) && !is_dir($directory)) throw new RuntimeException('Không thể chuẩn bị nơi lưu ảnh.');
        $imageName = bin2hex(random_bytes(20)) . '.' . $extensions[$mime];
        if (!move_uploaded_file((string) $upload['tmp_name'], $directory . '/' . $imageName)) throw new RuntimeException('Không thể lưu ảnh đã tải lên.');
    }

    $storedBody = $body !== '' ? $body : 'Ảnh đính kèm';
    try {
        $insert = $pdo->prepare('INSERT INTO messages (group_id, sender_id, body, reply_to_id, image_name) VALUES (?, ?, ?, ?, ?)');
        $insert->execute([$groupId, $me['id'], $storedBody, $replyToId, $imageName]);
    } catch (Throwable $error) {
        if ($imageName !== null) @unlink(dirname(__DIR__, 2) . '/storage/chat/' . $imageName);
        throw $error;
    }
    $id = (int) $pdo->lastInsertId();
    if ($mentionIds !== []) {
        $marks = implode(',', array_fill(0, count($mentionIds), '?'));
        $memberQuery = $pdo->prepare('SELECT u.id, u.name FROM group_members gm JOIN users u ON u.id = gm.user_id WHERE gm.group_id = ? AND gm.user_id IN (' . $marks . ')');
        $memberQuery->execute(array_merge([$groupId], $mentionIds));
        $mentioned = $memberQuery->fetchAll();
        $link = $pdo->prepare('INSERT IGNORE INTO message_mentions (message_id, user_id) VALUES (?, ?)');
        foreach ($mentioned as $person) {
            $personId = (int) $person['id'];
            $link->execute([$id, $personId]);
            notify_user($pdo, $personId, 'message_mention', 'Bạn được nhắc đến', $me['name'] . ' đã nhắc bạn trong cuộc trò chuyện nhóm.', ['group_id' => $groupId, 'message_id' => $id]);
        }
    }
    $reply = null;
    if ($replyToId !== null) {
        $parentQuery = $pdo->prepare('SELECT m.id, m.body, m.image_name, u.name AS sender_name, u.avatar_url FROM messages m JOIN users u ON u.id = m.sender_id WHERE m.id = ?');
        $parentQuery->execute([$replyToId]);
        $parent = $parentQuery->fetch();
        if ($parent !== false) $reply = ['id' => (int) $parent['id'], 'body' => (string) $parent['body'], 'sender_name' => (string) $parent['sender_name'], 'avatar_url' => $parent['avatar_url'], 'has_image' => $parent['image_name'] !== null];
    }
    send_json(['success' => true, 'data' => [
        'id' => $id, 'group_id' => $groupId, 'sender_id' => $me['id'], 'sender_name' => $me['name'], 'avatar_url' => $me['avatar_url'],
        'body' => $storedBody, 'reply_to_id' => $replyToId, 'reply_to' => $reply,
        'image_url' => $imageName === null ? null : '/message_image.php?id=' . $id,
        'created_at' => date('Y-m-d H:i:s'),
    ]], 201);
});
