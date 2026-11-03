-- StudySync - schema MySQL 5.7+/8.x (XAMPP, Laragon, MariaDB)
-- Cách dùng:
--   1. Tạo database bằng phpMyAdmin hoặc: CREATE DATABASE studysync ...
--   2. Import file này bằng phpMyAdmin hoặc: mysql -u root -p studysync < schema.mysql.sql
--   3. Đặt DB_DRIVER=mysql trong backend/.env và khởi động lại API.
-- Backend cũng tự tạo bảng nếu database đã tồn tại và user có quyền CREATE.

CREATE DATABASE IF NOT EXISTS `studysync`
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE `studysync`;

CREATE TABLE IF NOT EXISTS `groups` (
    `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(120) NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_groups_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `tasks` (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `app_meta` (
    `meta_key` VARCHAR(64) NOT NULL,
    `meta_value` VARCHAR(255) NOT NULL,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`meta_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

