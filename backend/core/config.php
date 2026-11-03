<?php

declare(strict_types=1);

/**
 * Cấu hình backend. Có thể ghi đè bằng biến môi trường hoặc file backend/.env.
 *
 * Mặc định dùng SQLite để chạy được ngay, không cần cài MySQL.
 * Đổi DB_DRIVER=mysql trong backend/.env nếu dùng XAMPP/MySQL.
 */
return [
    'app_env' => env_value('APP_ENV', 'development'),

    'db' => [
        'driver' => strtolower((string) env_value('DB_DRIVER', 'sqlite')),
        'sqlite_path' => (string) env_value('DB_SQLITE_PATH', dirname(__DIR__) . '/storage/data/studysync.sqlite'),

        'host' => (string) env_value('DB_HOST', '127.0.0.1'),
        'port' => (int) env_value('DB_PORT', '3306'),
        'name' => (string) env_value('DB_NAME', 'studysync'),
        'user' => (string) env_value('DB_USER', 'root'),
        'password' => (string) env_value('DB_PASSWORD', ''),
        'charset' => (string) env_value('DB_CHARSET', 'utf8mb4'),
    ],

    // '*' cho phép mọi origin (phù hợp phát triển).
    // Production nên đặt danh sách, ví dụ: CORS_ALLOWED_ORIGINS=https://app.example.com
    'cors_allowed_origins' => (string) env_value('CORS_ALLOWED_ORIGINS', '*'),

    // Được giữ để tương thích cấu hình cũ; không còn tạo dữ liệu mẫu toàn cục.
    'seed_demo_data' => filter_var(
        env_value('SEED_DEMO_DATA', 'true'),
        FILTER_VALIDATE_BOOLEAN
    ),

    'oauth' => [
        'app_url' => rtrim((string) env_value('OAUTH_APP_URL', 'http://localhost:19006'), '/'),
        'callback_url' => (string) env_value('OAUTH_CALLBACK_URL', 'http://localhost:8080/oauth_callback.php'),
        'google_client_id' => (string) env_value('GOOGLE_CLIENT_ID', ''),
        'google_client_secret' => (string) env_value('GOOGLE_CLIENT_SECRET', ''),
        'facebook_app_id' => (string) env_value('FACEBOOK_APP_ID', ''),
        'facebook_app_secret' => (string) env_value('FACEBOOK_APP_SECRET', ''),
        'facebook_graph_version' => (string) env_value('FACEBOOK_GRAPH_VERSION', 'v25.0'),
    ],
];
