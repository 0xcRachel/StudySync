<?php

declare(strict_types=1);

require_once dirname(__DIR__) . '/_init.php';

run_api(static function (): void {
    require_method('GET');

    $pdo = db();
    $pdo->query('SELECT 1')->fetchColumn();
    $config = app_config();

    send_json([
        'success' => true,
        'data' => [
            'status' => 'ok',
            'database' => 'connected',
            'driver' => $config['db']['driver'],
            'php_version' => PHP_VERSION,
            'server_time' => gmdate('c'),
        ],
    ]);
});
