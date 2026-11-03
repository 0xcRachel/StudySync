<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/_init.php';
run_api(static function (): void {
    require_method('POST'); $data = read_request_data(); $email = parse_email($data['email'] ?? null); $password = parse_password($data['password'] ?? null); $pdo = db();
    $statement = $pdo->prepare('SELECT id, name, username, email, password_hash, avatar_url, bio, last_seen_at, created_at FROM users WHERE email = ? AND is_active = 1 LIMIT 1'); $statement->execute([$email]); $user = $statement->fetch();
    if ($user === false || !password_verify($password, (string) $user['password_hash'])) throw new ApiException(401, 'Email hoặc mật khẩu không đúng.');
    if (password_needs_rehash((string) $user['password_hash'], PASSWORD_DEFAULT)) $pdo->prepare('UPDATE users SET password_hash = ? WHERE id = ?')->execute([password_hash($password, PASSWORD_DEFAULT), $user['id']]);
    $token = issue_session($pdo, (int) $user['id']);
    send_json(['success' => true, 'data' => ['user' => public_user($user), 'token' => $token]]);
});
