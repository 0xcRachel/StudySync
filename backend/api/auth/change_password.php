<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/_init.php';
run_api(static function (): void {
    require_method('POST'); $user = require_auth(); $data = read_request_data(); $current = parse_password($data['current_password'] ?? null); $next = parse_password($data['new_password'] ?? null); $pdo = db(); $statement = $pdo->prepare('SELECT password_hash FROM users WHERE id = ?'); $statement->execute([$user['id']]); $hash = (string) $statement->fetchColumn(); if (!password_verify($current, $hash)) throw new ApiException(422, 'Mật khẩu hiện tại không đúng.'); if ($current === $next) throw new ApiException(422, 'Mật khẩu mới phải khác mật khẩu cũ.'); $pdo->prepare('UPDATE users SET password_hash = ? WHERE id = ?')->execute([password_hash($next, PASSWORD_DEFAULT), $user['id']]); $pdo->prepare('DELETE FROM user_sessions WHERE user_id = ? AND id <> ?')->execute([$user['id'], $user['session_id']]); send_json(['success' => true, 'message' => 'Đổi mật khẩu thành công.']);
});
