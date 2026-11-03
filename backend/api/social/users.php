<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/_init.php';
run_api(static function (): void {
    require_method('GET'); $me = require_auth(); $query = trim((string) ($_GET['q'] ?? ''));
    if ($query === '' || mb_strlen($query, 'UTF-8') < 2) throw new ApiException(422, 'Từ khoá tìm kiếm phải có ít nhất 2 ký tự.');
    $like = '%' . $query . '%'; $statement = db()->prepare('SELECT id, name, email, avatar_url, bio, last_seen_at, created_at FROM users WHERE is_active = 1 AND id <> ? AND (name LIKE ? OR email LIKE ?) ORDER BY name LIMIT 30'); $statement->execute([$me['id'], $like, $like]);
    send_json(['success' => true, 'data' => array_map('public_user', $statement->fetchAll())]);
});
