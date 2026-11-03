<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/_init.php';

run_api(static function (): void {
    require_method('GET');
    $pdo = db();
    $me = require_auth();
    $id = parse_positive_int($_GET['id'] ?? null, 'Mã tin nhắn');
    $statement = $pdo->prepare('SELECT group_id, image_name FROM messages WHERE id = ? AND deleted_at IS NULL LIMIT 1');
    $statement->execute([$id]);
    $message = $statement->fetch();
    if ($message === false || $message['image_name'] === null || $message['group_id'] === null) throw new ApiException(404, 'Không tìm thấy ảnh.');
    require_group_member($pdo, (int) $message['group_id'], $me['id']);
    $name = (string) $message['image_name'];
    if (preg_match('/\A[a-f0-9]{40}\.(?:jpg|png|webp|gif)\z/', $name) !== 1) throw new ApiException(404, 'Không tìm thấy ảnh.');
    $path = dirname(__DIR__, 2) . '/storage/chat/' . $name;
    if (!is_file($path)) throw new ApiException(404, 'Không tìm thấy ảnh.');
    $mime = (new finfo(FILEINFO_MIME_TYPE))->file($path);
    if (!in_array($mime, ['image/jpeg', 'image/png', 'image/webp', 'image/gif'], true)) throw new ApiException(415, 'Định dạng ảnh không hợp lệ.');
    header('Content-Type: ' . $mime);
    header('Content-Length: ' . (string) filesize($path));
    header('Cache-Control: private, no-store');
    header('X-Content-Type-Options: nosniff');
    readfile($path);
    exit;
});
