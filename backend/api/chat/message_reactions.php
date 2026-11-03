<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/_init.php';
run_api(static function (): void {
    require_method('POST');
    $me = require_auth();
    $data = read_request_data();
    $messageId = parse_positive_int($data['message_id'] ?? null, 'Tin nhắn');
    $emoji = $data['emoji'] ?? null;
    $allowed = ['👍', '❤️', '😂', '😮', '😢', '🔥', '🎉', '👏', '✅', '🙏'];
    if (!is_string($emoji) || !in_array($emoji, $allowed, true)) throw new ApiException(422, 'Biểu cảm không được hỗ trợ.');
    $pdo = db();
    $find = $pdo->prepare('SELECT id, group_id FROM messages WHERE id = ? AND deleted_at IS NULL AND group_id IS NOT NULL LIMIT 1');
    $find->execute([$messageId]);
    $message = $find->fetch();
    if ($message === false) throw new ApiException(404, 'Không tìm thấy tin nhắn.');
    require_group_member($pdo, (int) $message['group_id'], (int) $me['id']);
    $existing = $pdo->prepare('SELECT 1 FROM message_reactions WHERE message_id = ? AND user_id = ? AND emoji = ?');
    $existing->execute([$messageId, $me['id'], $emoji]);
    if ($existing->fetchColumn() !== false) {
        $pdo->prepare('DELETE FROM message_reactions WHERE message_id = ? AND user_id = ? AND emoji = ?')->execute([$messageId, $me['id'], $emoji]);
    } else {
        $pdo->prepare('INSERT INTO message_reactions (message_id, user_id, emoji) VALUES (?, ?, ?)')->execute([$messageId, $me['id'], $emoji]);
    }
    $query = $pdo->prepare('SELECT emoji, COUNT(*) AS total, SUM(user_id = ?) AS mine FROM message_reactions WHERE message_id = ? GROUP BY emoji');
    $query->execute([$me['id'], $messageId]);
    $reactions = array_map(static fn (array $row): array => ['emoji' => (string) $row['emoji'], 'count' => (int) $row['total'], 'reacted' => (int) $row['mine'] > 0], $query->fetchAll());
    send_json(['success' => true, 'data' => ['message_id' => $messageId, 'reactions' => $reactions]]);
});
