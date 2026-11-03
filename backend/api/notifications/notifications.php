<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/_init.php';
run_api(static function (): void {
    $me = require_auth(); $pdo = db(); $method = require_method('GET', 'POST', 'PATCH');
    if ($method === 'GET') { $statement = $pdo->prepare('SELECT id, type, title, body, data_json, read_at, created_at FROM notifications WHERE user_id = ? ORDER BY id DESC LIMIT 100'); $statement->execute([$me['id']]); $rows = array_map(static function (array $row): array { $row['id'] = (int) $row['id']; $row['data'] = $row['data_json'] ? json_decode((string) $row['data_json'], true) : null; unset($row['data_json']); return $row; }, $statement->fetchAll()); send_json(['success' => true, 'data' => $rows]); }
    $data = read_request_data();
    // Marking everything read one id at a time cost the client up to 100
    // sequential PATCH calls; do it in a single statement instead.
    if (strtolower((string) ($data['action'] ?? '')) === 'mark_all') {
        $statement = $pdo->prepare('UPDATE notifications SET read_at = CURRENT_TIMESTAMP WHERE user_id = ? AND read_at IS NULL');
        $statement->execute([$me['id']]);
        send_json(['success' => true, 'message' => 'Đã đánh dấu tất cả là đã đọc.', 'data' => ['updated' => $statement->rowCount()]]);
    }
    $id = parse_positive_int($data['id'] ?? $_GET['id'] ?? null, 'Mã thông báo'); $statement = $pdo->prepare('UPDATE notifications SET read_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?'); $statement->execute([$id, $me['id']]); if ($statement->rowCount() === 0) throw new ApiException(404, 'Không tìm thấy thông báo.'); send_json(['success' => true, 'message' => 'Đã đánh dấu đã đọc.']);
});
