<?php

declare(strict_types=1);

require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/database.php';

load_env(dirname(__DIR__) . '/.env');

error_reporting(E_ALL);
ini_set('display_errors', '0');
ini_set('log_errors', '1');

// Đệm output để có thể xoá sạch nếu xảy ra fatal error và trả JSON thay vì HTML.
ob_start();

set_exception_handler(static function (Throwable $error): void {
    error_log(sprintf(
        '[StudySync API] Uncaught %s: %s in %s:%d',
        $error::class,
        $error->getMessage(),
        $error->getFile(),
        $error->getLine()
    ));

    while (ob_get_level() > 0) {
        ob_end_clean();
    }

    if (!headers_sent()) {
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
    }

    echo json_encode(
        [
            'success' => false,
            'message' => 'Máy chủ gặp lỗi khi xử lý yêu cầu. Vui lòng thử lại sau.',
        ],
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
    );
});

register_shutdown_function(static function (): void {
    $lastError = error_get_last();
    $fatalTypes = [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR];

    if ($lastError === null || !in_array($lastError['type'], $fatalTypes, true)) {
        return;
    }

    while (ob_get_level() > 0) {
        ob_end_clean();
    }

    if (!headers_sent()) {
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
    }

    echo json_encode(
        [
            'success' => false,
            'message' => 'Máy chủ gặp lỗi khi xử lý yêu cầu. Vui lòng thử lại sau.',
        ],
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
    );
});

$config = app_config();

configure_cors($config);

// Trình duyệt gửi preflight OPTIONS trước request JSON.
if (strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

/**
 * @param array<string, mixed> $config
 */
function configure_cors(array $config): void
{
    $configuredOrigins = $config['cors_allowed_origins'];
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

    if ($configuredOrigins === '*') {
        header('Access-Control-Allow-Origin: *');
    } elseif ($origin !== '') {
        $allowedOrigins = array_values(array_filter(array_map(
            'trim',
            explode(',', (string) $configuredOrigins)
        )));

        if (in_array($origin, $allowedOrigins, true)) {
            header('Access-Control-Allow-Origin: ' . $origin);
            header('Vary: Origin');
        }
    }

    header('Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Accept, Authorization');
    header('Access-Control-Max-Age: 86400');
}
