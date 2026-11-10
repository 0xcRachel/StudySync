<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/_init.php';
run_api(static function (): void {
    require_method('POST');
    $owner = require_auth();
    $isMultipart = str_contains(strtolower($_SERVER['CONTENT_TYPE'] ?? ''), 'multipart/form-data');
    $data = $isMultipart ? $_POST : read_request_data();
    $name = parse_group_name($data['name'] ?? null);
    $description = isset($data['description']) ? trim((string) $data['description']) : null;
    if ($description !== null && mb_strlen($description, 'UTF-8') > 500) {
        throw new ApiException(422, 'Mô tả nhóm không được dài quá 500 ký tự.');
    }

    $avatarUrl = null;
    $uploadedFileName = null;
    if (isset($_FILES['avatar']) && is_array($_FILES['avatar']) && (int) ($_FILES['avatar']['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE) {
        $upload = $_FILES['avatar'];
        $uploadError = (int) ($upload['error'] ?? UPLOAD_ERR_NO_FILE);
        if ($uploadError !== UPLOAD_ERR_OK) {
            $tooLarge = in_array($uploadError, [UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE], true);
            throw new ApiException($tooLarge ? 413 : 422, $tooLarge ? 'Ảnh đại diện vượt quá giới hạn 5 MB.' : 'Không tải được ảnh đã chọn.');
        }
        if (!is_uploaded_file((string) $upload['tmp_name']) || (int) $upload['size'] < 1 || (int) $upload['size'] > 5 * 1024 * 1024) {
            throw new ApiException(413, 'Ảnh đại diện phải có dung lượng từ 1 byte đến 5 MB.');
        }
        $mime = (new finfo(FILEINFO_MIME_TYPE))->file((string) $upload['tmp_name']);
        $extensions = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', 'image/gif' => 'gif'];
        $dimensions = @getimagesize((string) $upload['tmp_name']);
        if (!isset($extensions[$mime]) || $dimensions === false || ($dimensions['mime'] ?? '') !== $mime) {
            throw new ApiException(415, 'Chỉ nhận ảnh JPEG, PNG, WebP hoặc GIF hợp lệ.');
        }
        $directory = dirname(__DIR__, 2) . '/storage/groups';
        if (!is_dir($directory) && !mkdir($directory, 0750, true) && !is_dir($directory)) {
            throw new RuntimeException('Không thể chuẩn bị nơi lưu ảnh nhóm.');
        }
        $uploadedFileName = bin2hex(random_bytes(20)) . '.' . $extensions[$mime];
        if (!move_uploaded_file((string) $upload['tmp_name'], $directory . '/' . $uploadedFileName)) {
            throw new RuntimeException('Không thể lưu ảnh nhóm đã tải lên.');
        }
        $avatarUrl = '/group_avatar.php?file=' . $uploadedFileName;
    } elseif (isset($data['avatar_url']) && trim((string) $data['avatar_url']) !== '') {
        $rawUrl = trim((string) $data['avatar_url']);
        $scheme = strtolower((string) parse_url($rawUrl, PHP_URL_SCHEME));
        if (strlen($rawUrl) > 500 || !filter_var($rawUrl, FILTER_VALIDATE_URL) || !in_array($scheme, ['https', 'http'], true)) {
            throw new ApiException(422, 'Liên kết ảnh nhóm phải là URL hợp lệ (tối đa 500 ký tự).');
        }
        $avatarUrl = $rawUrl;
    }

    $pdo = db();
    try {
        $pdo->beginTransaction();
        // `groups` is a reserved keyword on supported MySQL versions.
        $statement = $pdo->prepare('INSERT INTO `groups` (`name`, `description`, `avatar_url`) VALUES (?, ?, ?)');
        $statement->execute([$name, $description ?: null, $avatarUrl]);
        $id = (int) $pdo->lastInsertId();
        $pdo->prepare('INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, "owner")')->execute([$id, $owner['id']]);
        $pdo->commit();
    } catch (Throwable $error) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        if ($uploadedFileName !== null) {
            @unlink(dirname(__DIR__, 2) . '/storage/groups/' . $uploadedFileName);
        }
        throw $error;
    }
    send_json([
        'success' => true,
        'data' => [
            'id' => $id,
            'name' => $name,
            'description' => $description,
            'avatar_url' => $avatarUrl,
            'task_count' => 0,
            'completed_count' => 0,
        ],
    ], 201);
});
