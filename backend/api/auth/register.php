<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/_init.php';
run_api(static function (): void {
    require_method('POST'); $data = read_request_data();
    $name = parse_user_name($data['name'] ?? null); $email = parse_email($data['email'] ?? null); $password = parse_password($data['password'] ?? null);
    $pdo = db();
    try {
        $statement = $pdo->prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)');
        $statement->execute([$name, $email, password_hash($password, PASSWORD_DEFAULT)]);
    } catch (PDOException $error) {
        if ((string) $error->getCode() === '23000') throw new ApiException(409, 'Email đã được sử dụng.');
        throw $error;
    }
    $id = (int) $pdo->lastInsertId();
    $token = issue_session($pdo, $id);
    $statement = $pdo->prepare('SELECT id, name, username, email, avatar_url, bio, last_seen_at, created_at FROM users WHERE id = ?'); $statement->execute([$id]);
    send_json(['success' => true, 'data' => ['user' => public_user($statement->fetch()), 'token' => $token]], 201);
});
