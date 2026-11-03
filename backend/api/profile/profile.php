<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/_init.php';
run_api(static function (): void {
    $user = require_auth(); $method = require_method('GET', 'PATCH'); $pdo = db();
    if ($method === 'GET') { unset($user['session_id']); send_json(['success' => true, 'data' => ['user' => $user]]); }
    $data = read_request_data(); $name = parse_user_name($data['name'] ?? $user['name']); $bio = isset($data['bio']) ? trim((string) $data['bio']) : ($user['bio'] ?? null); if ($bio !== null && mb_strlen($bio, 'UTF-8') > 500) throw new ApiException(422, 'Giới thiệu không được dài quá 500 ký tự.');
    $username = array_key_exists('username', $data) ? trim((string) $data['username']) : (string) ($user['username'] ?? '');
    if ($username !== '' && preg_match('/^[a-zA-Z0-9_.]{3,32}$/', $username) !== 1) throw new ApiException(422, 'Tên tài khoản cần dài 3–32 ký tự, chỉ gồm chữ, số, dấu chấm hoặc gạch dưới.');
    $avatar = isset($data['avatar_url']) ? trim((string) $data['avatar_url']) : (string) ($user['avatar_url'] ?? '');
    if ($avatar !== '' && (strlen($avatar) > 500 || !filter_var($avatar, FILTER_VALIDATE_URL) || strtolower((string) parse_url($avatar, PHP_URL_SCHEME)) !== 'https')) throw new ApiException(422, 'Avatar cần là liên kết HTTPS hợp lệ (tối đa 500 ký tự).');
    try { $pdo->prepare('UPDATE users SET name = ?, username = ?, avatar_url = ?, bio = ? WHERE id = ?')->execute([$name, $username !== '' ? strtolower($username) : null, $avatar !== '' ? $avatar : null, $bio ?: null, $user['id']]); }
    catch (PDOException $error) { if ((string) $error->getCode() === '23000') throw new ApiException(409, 'Tên tài khoản này đã có người sử dụng.'); throw $error; }
    $user['name'] = $name; $user['username'] = $username !== '' ? strtolower($username) : null; $user['avatar_url'] = $avatar !== '' ? $avatar : null; $user['bio'] = $bio ?: null; unset($user['session_id']); send_json(['success' => true, 'data' => ['user' => $user]]);
});
