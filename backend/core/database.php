<?php

declare(strict_types=1);

/**
 * Bump this whenever ensure_schema() gains or changes DDL. It gates the full
 * sweep: replaying ~25 CREATE/ALTER statements on every request cost roughly
 * 100 ms per call and took metadata locks under load.
 */
const STUDYSYNC_SCHEMA_REVISION = '2';

/**
 * Kết nối PDO dùng chung cho mỗi request (singleton).
 *
 * Hỗ trợ:
 * - sqlite (mặc định): không cần cài đặt gì thêm, file nằm trong backend/storage/data/.
 * - mysql: dùng được với XAMPP, Laragon, MySQL 5.7+/8.x, MariaDB.
 */
function db(): PDO
{
    static $pdo = null;

    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $config = app_config()['db'];
    $driver = $config['driver'];

    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];

    if ($driver === 'sqlite') {
        $path = $config['sqlite_path'];
        $directory = dirname($path);

        if (!is_dir($directory) && !mkdir($directory, 0775, true) && !is_dir($directory)) {
            throw new RuntimeException('Không thể tạo thư mục dữ liệu SQLite: ' . $directory);
        }

        $pdo = new PDO('sqlite:' . $path, null, null, $options);
        $pdo->exec('PRAGMA foreign_keys = ON');
        $pdo->exec('PRAGMA busy_timeout = 5000');
        $pdo->exec('PRAGMA journal_mode = WAL');
    } elseif ($driver === 'mysql') {
        $dsn = sprintf(
            'mysql:host=%s;port=%d;dbname=%s;charset=%s',
            $config['host'],
            $config['port'],
            $config['name'],
            $config['charset']
        );

        $pdo = new PDO($dsn, $config['user'], $config['password'], $options);
        $pdo->exec("SET NAMES {$config['charset']} COLLATE utf8mb4_unicode_ci");
    } else {
        throw new RuntimeException('DB_DRIVER không hợp lệ. Chỉ hỗ trợ sqlite hoặc mysql.');
    }

    ensure_schema_once($pdo, $driver);
    return $pdo;
}

/** Runs ensure_schema() only when the stored schema revision is missing or stale. */
function ensure_schema_once(PDO $pdo, string $driver): void
{
    $appMeta = $driver === 'mysql'
        ? 'CREATE TABLE IF NOT EXISTS `app_meta` (
                `meta_key` VARCHAR(64) NOT NULL,
                `meta_value` VARCHAR(255) NOT NULL,
                `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (`meta_key`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
        : 'CREATE TABLE IF NOT EXISTS `app_meta` (
                `meta_key` TEXT NOT NULL PRIMARY KEY,
                `meta_value` TEXT NOT NULL,
                `updated_at` TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )';
    $pdo->exec($appMeta);

    $stored = $pdo->prepare('SELECT meta_value FROM app_meta WHERE meta_key = ? LIMIT 1');
    $stored->execute(['schema_revision']);
    if ((string) $stored->fetchColumn() === STUDYSYNC_SCHEMA_REVISION) return;

    ensure_schema($pdo, $driver);

    $mark = $driver === 'mysql'
        ? 'INSERT INTO app_meta (meta_key, meta_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE meta_value = VALUES(meta_value)'
        : 'INSERT INTO app_meta (meta_key, meta_value) VALUES (?, ?) ON CONFLICT(meta_key) DO UPDATE SET meta_value = excluded.meta_value';
    $pdo->prepare($mark)->execute(['schema_revision', STUDYSYNC_SCHEMA_REVISION]);
}

function ensure_schema(PDO $pdo, string $driver): void
{
    if ($driver === 'mysql') {
        $pdo->exec(
            'CREATE TABLE IF NOT EXISTS `groups` (
                `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
                `name` VARCHAR(120) NOT NULL,
                `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (`id`),
                KEY `idx_groups_name` (`name`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
        );

        $pdo->exec(
            "CREATE TABLE IF NOT EXISTS `tasks` (
                `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
                `group_id` INT UNSIGNED NOT NULL,
                `title` VARCHAR(120) NOT NULL,
                `status` ENUM('todo', 'doing', 'done') NOT NULL DEFAULT 'todo',
                `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (`id`),
                KEY `idx_tasks_group` (`group_id`),
                KEY `idx_tasks_status` (`status`),
                CONSTRAINT `fk_tasks_group`
                    FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
        );

        try {
            $pdo->exec('ALTER TABLE `groups` DROP INDEX `uq_groups_name`');
        } catch (PDOException $error) {
            $driverCode = (int) ($error->errorInfo[1] ?? 0);
            if ($driverCode !== 1091) throw $error;
        }

        $pdo->exec(
            'CREATE TABLE IF NOT EXISTS `app_meta` (
                `meta_key` VARCHAR(64) NOT NULL,
                `meta_value` VARCHAR(255) NOT NULL,
                `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (`meta_key`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
        );

        // Nền tảng cộng tác: tài khoản, quan hệ bạn bè, thành viên nhóm,
        // chat và thông báo. Các bảng được tạo idempotent để có thể chạy
        // trên database StudySync hiện có mà không mất dữ liệu cũ.
        $pdo->exec(
            'CREATE TABLE IF NOT EXISTS `users` (
                `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
                `name` VARCHAR(100) NOT NULL,
                `email` VARCHAR(190) NOT NULL,
                `password_hash` VARCHAR(255) NOT NULL,
                `avatar_url` VARCHAR(500) NULL,
                `bio` VARCHAR(500) NULL,
                `is_active` TINYINT(1) NOT NULL DEFAULT 1,
                `last_seen_at` TIMESTAMP NULL DEFAULT NULL,
                `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (`id`), UNIQUE KEY `uq_users_email` (`email`),
                KEY `idx_users_name` (`name`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
        );
        $pdo->exec(
            'CREATE TABLE IF NOT EXISTS `oauth_accounts` (
                `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                `user_id` INT UNSIGNED NOT NULL,
                `provider` VARCHAR(20) NOT NULL,
                `provider_subject` VARCHAR(191) NOT NULL,
                `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (`id`), UNIQUE KEY `uq_oauth_identity` (`provider`, `provider_subject`),
                KEY `idx_oauth_user` (`user_id`),
                CONSTRAINT `fk_oauth_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
        );
        try { $pdo->exec('ALTER TABLE `users` ADD COLUMN `username` VARCHAR(32) NULL AFTER `name`'); }
        catch (PDOException $error) { $driverCode = (int) ($error->errorInfo[1] ?? 0); if ((string) $error->getCode() !== '42S21' && $driverCode !== 1060) throw $error; }
        try { $pdo->exec('ALTER TABLE `users` ADD UNIQUE KEY `uq_users_username` (`username`)'); }
        catch (PDOException $error) { $driverCode = (int) ($error->errorInfo[1] ?? 0); if ((string) $error->getCode() !== '42S21' && $driverCode !== 1061) throw $error; }
        $pdo->exec(
            'CREATE TABLE IF NOT EXISTS `user_sessions` (
                `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                `user_id` INT UNSIGNED NOT NULL,
                `token_hash` CHAR(64) NOT NULL,
                `expires_at` DATETIME NOT NULL,
                `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (`id`), UNIQUE KEY `uq_sessions_token` (`token_hash`),
                KEY `idx_sessions_user` (`user_id`), KEY `idx_sessions_expiry` (`expires_at`),
                CONSTRAINT `fk_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
        );
        $pdo->exec(
            'CREATE TABLE IF NOT EXISTS `friendships` (
                `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                `requester_id` INT UNSIGNED NOT NULL, `addressee_id` INT UNSIGNED NOT NULL,
                `status` ENUM("pending", "accepted", "declined", "blocked") NOT NULL DEFAULT "pending",
                `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (`id`), UNIQUE KEY `uq_friend_pair` (`requester_id`, `addressee_id`),
                KEY `idx_friend_addressee` (`addressee_id`),
                CONSTRAINT `fk_friend_requester` FOREIGN KEY (`requester_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
                CONSTRAINT `fk_friend_addressee` FOREIGN KEY (`addressee_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
        );
        $pdo->exec(
            'CREATE TABLE IF NOT EXISTS `group_members` (
                `group_id` INT UNSIGNED NOT NULL, `user_id` INT UNSIGNED NOT NULL,
                `role` ENUM("owner", "admin", "member") NOT NULL DEFAULT "member",
                `joined_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (`group_id`, `user_id`), KEY `idx_members_user` (`user_id`),
                CONSTRAINT `fk_members_group` FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`) ON DELETE CASCADE,
                CONSTRAINT `fk_members_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
        );
        $pdo->exec(
            'CREATE TABLE IF NOT EXISTS `group_invitations` (
                `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, `group_id` INT UNSIGNED NOT NULL,
                `inviter_id` INT UNSIGNED NOT NULL, `invitee_id` INT UNSIGNED NOT NULL,
                `status` ENUM("pending", "accepted", "declined") NOT NULL DEFAULT "pending",
                `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                `responded_at` TIMESTAMP NULL DEFAULT NULL,
                PRIMARY KEY (`id`), KEY `idx_group_invitee` (`invitee_id`, `status`),
                CONSTRAINT `fk_inv_group` FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`) ON DELETE CASCADE,
                CONSTRAINT `fk_inv_inviter` FOREIGN KEY (`inviter_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
                CONSTRAINT `fk_inv_invitee` FOREIGN KEY (`invitee_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
        );
        $pdo->exec(
            'CREATE TABLE IF NOT EXISTS `messages` (
                `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, `group_id` INT UNSIGNED NULL,
                `sender_id` INT UNSIGNED NOT NULL, `receiver_id` INT UNSIGNED NULL,
                `body` TEXT NOT NULL, `reply_to_id` BIGINT UNSIGNED NULL, `image_name` VARCHAR(80) NULL,
                `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                `edited_at` TIMESTAMP NULL DEFAULT NULL, `deleted_at` TIMESTAMP NULL DEFAULT NULL,
                PRIMARY KEY (`id`), KEY `idx_messages_group` (`group_id`, `id`), KEY `idx_messages_dm` (`sender_id`, `receiver_id`, `id`), KEY `idx_messages_reply` (`reply_to_id`),
                CONSTRAINT `fk_messages_group` FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`) ON DELETE CASCADE,
                CONSTRAINT `fk_messages_sender` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
                CONSTRAINT `fk_messages_receiver` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
        );
        $pdo->exec(
            'CREATE TABLE IF NOT EXISTS `message_mentions` (
                `message_id` BIGINT UNSIGNED NOT NULL,
                `user_id` INT UNSIGNED NOT NULL,
                `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (`message_id`, `user_id`),
                KEY `idx_message_mentions_user` (`user_id`, `message_id`),
                CONSTRAINT `fk_mentions_message` FOREIGN KEY (`message_id`) REFERENCES `messages` (`id`) ON DELETE CASCADE,
                CONSTRAINT `fk_mentions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
        );
        // utf8mb4_bin là bắt buộc: dưới collation unicode_ci, mọi emoji so sánh
        // bằng nhau ('👍' = '🔥' trả về 1), khiến GROUP BY gộp lẫn biểu cảm và
        // điều kiện toggle xoá nhầm biểu cảm khác của cùng một người dùng.
        $pdo->exec(
            'CREATE TABLE IF NOT EXISTS `message_reactions` (
                `message_id` BIGINT UNSIGNED NOT NULL,
                `user_id` INT UNSIGNED NOT NULL,
                `emoji` VARCHAR(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
                `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (`message_id`, `user_id`, `emoji`),
                KEY `idx_message_reactions_message` (`message_id`),
                CONSTRAINT `fk_reactions_message` FOREIGN KEY (`message_id`) REFERENCES `messages` (`id`) ON DELETE CASCADE,
                CONSTRAINT `fk_reactions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
        );
        try {
            $pdo->exec('ALTER TABLE `message_reactions` MODIFY `emoji` VARCHAR(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL');
        } catch (PDOException $error) {
            $driverCode = (int) ($error->errorInfo[1] ?? 0);
            if ($driverCode !== 1091) throw $error;
        }
        $pdo->exec(
            'CREATE TABLE IF NOT EXISTS `message_reads` (
                `group_id` INT UNSIGNED NOT NULL, `user_id` INT UNSIGNED NOT NULL,
                `last_message_id` BIGINT UNSIGNED NOT NULL, `read_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (`group_id`, `user_id`), KEY `idx_message_reads_message` (`group_id`, `last_message_id`),
                CONSTRAINT `fk_reads_group` FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`) ON DELETE CASCADE,
                CONSTRAINT `fk_reads_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
        );
        $pdo->exec(
            'CREATE TABLE IF NOT EXISTS `notifications` (
                `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, `user_id` INT UNSIGNED NOT NULL,
                `type` VARCHAR(50) NOT NULL, `title` VARCHAR(160) NOT NULL, `body` VARCHAR(500) NOT NULL,
                `data_json` JSON NULL, `read_at` TIMESTAMP NULL DEFAULT NULL,
                `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (`id`), KEY `idx_notifications_user` (`user_id`, `read_at`, `id`),
                CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
        );
        $pdo->exec(
            'CREATE TABLE IF NOT EXISTS `task_assignees` (
                `task_id` INT UNSIGNED NOT NULL, `user_id` INT UNSIGNED NOT NULL,
                `assigned_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (`task_id`, `user_id`),
                CONSTRAINT `fk_assign_task` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE,
                CONSTRAINT `fk_assign_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
        );
        $pdo->exec(
            'CREATE TABLE IF NOT EXISTS `task_comments` (
                `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, `task_id` INT UNSIGNED NOT NULL,
                `user_id` INT UNSIGNED NOT NULL, `body` VARCHAR(1000) NOT NULL,
                `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (`id`), KEY `idx_comments_task` (`task_id`, `id`),
                CONSTRAINT `fk_comments_task` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE,
                CONSTRAINT `fk_comments_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
        );

        foreach ([
            'ALTER TABLE `groups` ADD COLUMN `description` VARCHAR(500) NULL AFTER `name`',
            'ALTER TABLE `groups` ADD COLUMN `avatar_url` VARCHAR(500) NULL AFTER `description`',
            'ALTER TABLE `tasks` ADD COLUMN `description` TEXT NULL AFTER `title`',
            'ALTER TABLE `tasks` ADD COLUMN `priority` ENUM("low", "medium", "high") NOT NULL DEFAULT "medium" AFTER `status`',
            'ALTER TABLE `tasks` ADD COLUMN `due_at` DATETIME NULL AFTER `priority`',
            'ALTER TABLE `tasks` ADD COLUMN `created_by` INT UNSIGNED NULL AFTER `group_id`',
        ] as $alter) {
            try { $pdo->exec($alter); } catch (PDOException $error) {
                $driverCode = (int) ($error->errorInfo[1] ?? 0);
                if ((string) $error->getCode() !== '42S21' && $driverCode !== 1060) throw $error;
            }
        }

        foreach ([
            'ALTER TABLE `messages` ADD COLUMN `reply_to_id` BIGINT UNSIGNED NULL AFTER `body`',
            'ALTER TABLE `messages` ADD COLUMN `image_name` VARCHAR(80) NULL AFTER `reply_to_id`',
            'ALTER TABLE `messages` ADD KEY `idx_messages_reply` (`reply_to_id`)',
        ] as $alter) {
            try { $pdo->exec($alter); } catch (PDOException $error) {
                $driverCode = (int) ($error->errorInfo[1] ?? 0);
                $duplicate = (string) $error->getCode() === '42S21' || in_array($driverCode, [1060, 1061], true);
                if (!$duplicate) throw $error;
            }
        }

        $cleanupKey = 'legacy_demo_membership_cleanup_v2';
        $cleanupCheck = $pdo->prepare('SELECT 1 FROM `app_meta` WHERE `meta_key` = ? LIMIT 1');
        $cleanupCheck->execute([$cleanupKey]);
        if ($cleanupCheck->fetchColumn() === false) {
            $pdo->beginTransaction();
            try {
                // Remove only legacy auto-joins created alongside account signup.
                // The demo group/tasks themselves and later intentional memberships are preserved.
                $pdo->exec(
                    'DELETE gm FROM `group_members` gm
                     JOIN `groups` g ON g.id = gm.group_id
                     JOIN `users` u ON u.id = gm.user_id
                     WHERE g.id = 1 AND g.name = \'Nhóm Đồ án Mobile\'
                       AND gm.role = \'member\'
                       AND ABS(TIMESTAMPDIFF(SECOND, u.created_at, gm.joined_at)) <= 120'
                );
                $cleanupInsert = $pdo->prepare('INSERT IGNORE INTO `app_meta` (`meta_key`, `meta_value`) VALUES (?, ?)');
                $cleanupInsert->execute([$cleanupKey, 'done']);
                $pdo->commit();
            } catch (Throwable $error) {
                if ($pdo->inTransaction()) $pdo->rollBack();
                throw $error;
            }
        }

        return;
    }

    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS `groups` (
            `id` INTEGER PRIMARY KEY AUTOINCREMENT,
            `name` TEXT NOT NULL,
            `description` TEXT NULL,
            `avatar_url` TEXT NULL,
            `created_at` TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )'
    );
    try {
        $pdo->exec('ALTER TABLE `groups` ADD COLUMN `avatar_url` TEXT NULL');
    } catch (PDOException) {
        /* Column already exists on upgraded SQLite DBs. */
    }

    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS `users` (
            `id` INTEGER PRIMARY KEY AUTOINCREMENT,
            `name` TEXT NOT NULL,
            `username` TEXT NULL UNIQUE,
            `email` TEXT NOT NULL UNIQUE,
            `password_hash` TEXT NOT NULL,
            `avatar_url` TEXT NULL,
            `bio` TEXT NULL,
            `is_active` INTEGER NOT NULL DEFAULT 1,
            `last_seen_at` TEXT NULL,
            `created_at` TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            `updated_at` TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )'
    );

    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS `user_sessions` (
            `id` INTEGER PRIMARY KEY AUTOINCREMENT,
            `user_id` INTEGER NOT NULL,
            `token_hash` TEXT NOT NULL UNIQUE,
            `expires_at` TEXT NOT NULL,
            `created_at` TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
        )'
    );

    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS `group_members` (
            `group_id` INTEGER NOT NULL,
            `user_id` INTEGER NOT NULL,
            `role` TEXT NOT NULL DEFAULT \'member\',
            `joined_at` TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (`group_id`, `user_id`),
            FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`) ON DELETE CASCADE,
            FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
        )'
    );

    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS `friendships` (
            `id` INTEGER PRIMARY KEY AUTOINCREMENT, `requester_id` INTEGER NOT NULL, `addressee_id` INTEGER NOT NULL,
            `status` TEXT NOT NULL DEFAULT "pending", `created_at` TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, `updated_at` TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE (`requester_id`, `addressee_id`),
            FOREIGN KEY (`requester_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
            FOREIGN KEY (`addressee_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
        )'
    );

    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS `group_invitations` (
            `id` INTEGER PRIMARY KEY AUTOINCREMENT, `group_id` INTEGER NOT NULL, `inviter_id` INTEGER NOT NULL, `invitee_id` INTEGER NOT NULL,
            `status` TEXT NOT NULL DEFAULT "pending", `created_at` TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, `responded_at` TEXT NULL,
            FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`) ON DELETE CASCADE,
            FOREIGN KEY (`inviter_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
            FOREIGN KEY (`invitee_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
        )'
    );

    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS `tasks` (
            `id` INTEGER PRIMARY KEY AUTOINCREMENT,
            `group_id` INTEGER NOT NULL,
            `title` TEXT NOT NULL,
            `status` TEXT NOT NULL DEFAULT 'todo' CHECK (`status` IN ('todo', 'doing', 'done')),
            `created_at` TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            `updated_at` TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`) ON DELETE CASCADE
        )"
    );

    $pdo->exec('CREATE INDEX IF NOT EXISTS `idx_tasks_group` ON `tasks` (`group_id`)');
    $pdo->exec('CREATE INDEX IF NOT EXISTS `idx_tasks_status` ON `tasks` (`status`)');
    $pdo->exec('CREATE INDEX IF NOT EXISTS `idx_groups_name` ON `groups` (`name`)');

    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS `task_assignees` (
            `task_id` INTEGER NOT NULL, `user_id` INTEGER NOT NULL,
            `assigned_at` TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (`task_id`, `user_id`),
            FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE,
            FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
        )'
    );

    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS `message_reads` (
            `group_id` INTEGER NOT NULL, `user_id` INTEGER NOT NULL,
            `last_message_id` INTEGER NOT NULL, `read_at` TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (`group_id`, `user_id`),
            FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`) ON DELETE CASCADE,
            FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
        )'
    );

    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS `messages` (
            `id` INTEGER PRIMARY KEY AUTOINCREMENT, `group_id` INTEGER NULL, `sender_id` INTEGER NOT NULL, `receiver_id` INTEGER NULL,
            `body` TEXT NOT NULL, `reply_to_id` INTEGER NULL, `image_name` TEXT NULL, `created_at` TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            `edited_at` TEXT NULL, `deleted_at` TEXT NULL,
            FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`) ON DELETE CASCADE,
            FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
        )'
    );

    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS `message_reactions` (
            `message_id` INTEGER NOT NULL, `user_id` INTEGER NOT NULL, `emoji` TEXT NOT NULL, `created_at` TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (`message_id`, `user_id`, `emoji`),
            FOREIGN KEY (`message_id`) REFERENCES `messages` (`id`) ON DELETE CASCADE,
            FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
        )'
    );

    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS `message_mentions` (
            `message_id` INTEGER NOT NULL, `user_id` INTEGER NOT NULL, `created_at` TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (`message_id`, `user_id`),
            FOREIGN KEY (`message_id`) REFERENCES `messages` (`id`) ON DELETE CASCADE,
            FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
        )'
    );

    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS `notifications` (
            `id` INTEGER PRIMARY KEY AUTOINCREMENT, `user_id` INTEGER NOT NULL, `type` TEXT NOT NULL, `title` TEXT NOT NULL, `body` TEXT NOT NULL,
            `data_json` TEXT NULL, `read_at` TEXT NULL, `created_at` TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
        )'
    );

    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS `app_meta` (
            `meta_key` TEXT NOT NULL PRIMARY KEY,
            `meta_value` TEXT NOT NULL,
            `updated_at` TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )'
    );
}

