<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/_init.php';

run_api(static function (): void {
    require_method('GET');
    $name = trim((string) ($_GET['file'] ?? ''));
    if (preg_match('/\A[a-f0-9]{40}\.(?:jpg|png|webp|gif)\z/', $name) !== 1) {
        throw new ApiException(404, 'Không tìm thấy ảnh nhóm.');
    }
    $path = dirname(__DIR__, 2) . '/storage/groups/' . $name;
    if (!is_file($path)) {
        throw new ApiException(404, 'Không tìm thấy ảnh nhóm.');
    }
    $mime = (new finfo(FILEINFO_MIME_TYPE))->file($path);
    if (!in_array($mime, ['image/jpeg', 'image/png', 'image/webp', 'image/gif'], true)) {
        throw new ApiException(415, 'Định dạng ảnh không hợp lệ.');
    }
    header('Content-Type: ' . $mime);
    header('Content-Length: ' . (string) filesize($path));
    header('Cache-Control: public, max-age=86400');
    header('X-Content-Type-Options: nosniff');
    readfile($path);
    exit;
});
