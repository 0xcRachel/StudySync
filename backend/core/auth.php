<?php

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

/** Require a valid Bearer token and return the current user. */
function require_auth(): array
{
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (preg_match('/^Bearer\s+(.+)$/i', trim($header), $matches) !== 1) {
        throw new ApiException(401, 'Bạn cần đăng nhập để thực hiện thao tác này.');
    }

    $tokenHash = hash('sha256', trim($matches[1]));
    $pdo = db();
    $statement = $pdo->prepare(
        'SELECT u.id, u.name, u.username, u.email, u.avatar_url, u.bio, u.last_seen_at, u.created_at,
                s.id AS session_id
         FROM user_sessions s JOIN users u ON u.id = s.user_id
         WHERE s.token_hash = ? AND s.expires_at > CURRENT_TIMESTAMP AND u.is_active = 1 LIMIT 1'
    );
    $statement->execute([$tokenHash]);
    $user = $statement->fetch();
    if ($user === false) throw new ApiException(401, 'Phiên đăng nhập đã hết hạn.');

    $pdo->prepare('UPDATE users SET last_seen_at = CURRENT_TIMESTAMP WHERE id = ?')->execute([(int) $user['id']]);
    return [
        'id' => (int) $user['id'], 'name' => (string) $user['name'], 'username' => $user['username'] ?? null, 'email' => (string) $user['email'],
        'avatar_url' => $user['avatar_url'], 'bio' => $user['bio'], 'last_seen_at' => $user['last_seen_at'],
        'created_at' => (string) $user['created_at'], 'session_id' => (int) $user['session_id'],
    ];
}

function has_bearer_token(): bool
{
    return preg_match('/^Bearer\s+.+$/i', trim((string) ($_SERVER['HTTP_AUTHORIZATION'] ?? ''))) === 1;
}

function optional_auth(): ?array
{
    return has_bearer_token() ? require_auth() : null;
}

function public_user(array $user): array
{
    return ['id' => (int) $user['id'], 'name' => (string) $user['name'], 'username' => $user['username'] ?? null, 'email' => (string) $user['email'],
        'avatar_url' => $user['avatar_url'] ?? null, 'bio' => $user['bio'] ?? null,
        'last_seen_at' => $user['last_seen_at'] ?? null, 'created_at' => $user['created_at'] ?? null];
}

function parse_email(mixed $value): string
{
    if (!is_string($value)) throw new ApiException(422, 'Email không hợp lệ.');
    $email = strtolower(trim($value));
    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 190) throw new ApiException(422, 'Email không hợp lệ.');
    return $email;
}

function parse_password(mixed $value): string
{
    if (!is_string($value) || strlen($value) < 8 || strlen($value) > 72) throw new ApiException(422, 'Mật khẩu phải dài từ 8 đến 72 ký tự.');
    return $value;
}

function parse_user_name(mixed $value): string
{
    if (!is_string($value)) throw new ApiException(422, 'Tên người dùng không hợp lệ.');
    $name = trim(preg_replace('/\s+/u', ' ', $value) ?? $value);
    if ($name === '' || mb_strlen($name, 'UTF-8') > 100) throw new ApiException(422, 'Tên người dùng phải từ 1 đến 100 ký tự.');
    return $name;
}

function issue_session(PDO $pdo, int $userId): string
{
    $token = bin2hex(random_bytes(32));
    $expiryExpression = app_config()['db']['driver'] === 'mysql'
        ? 'DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 30 DAY)'
        : "datetime('now', '+30 days')";
    $statement = $pdo->prepare("INSERT INTO user_sessions (user_id, token_hash, expires_at) VALUES (?, ?, {$expiryExpression})");
    $statement->execute([$userId, hash('sha256', $token)]);
    return $token;
}

function notify_user(PDO $pdo, int $userId, string $type, string $title, string $body, array $data = []): void
{
    $statement = $pdo->prepare('INSERT INTO notifications (user_id, type, title, body, data_json) VALUES (?, ?, ?, ?, ?)');
    $statement->execute([$userId, $type, $title, $body, $data === [] ? null : json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)]);
}

function require_group_member(PDO $pdo, int $groupId, int $userId, ?array $roles = null): array
{
    $statement = $pdo->prepare('SELECT group_id, user_id, role, joined_at FROM group_members WHERE group_id = ? AND user_id = ? LIMIT 1');
    $statement->execute([$groupId, $userId]);
    $member = $statement->fetch();
    if ($member === false) throw new ApiException(403, 'Bạn không phải thành viên của nhóm này.');
    if ($roles !== null && !in_array($member['role'], $roles, true)) throw new ApiException(403, 'Bạn không có quyền thực hiện thao tác này.');
    return $member;
}
