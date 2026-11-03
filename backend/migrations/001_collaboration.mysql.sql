-- StudySync collaboration migration for phpMyAdmin/Laragon.
-- Import schema.mysql.sql first, then this file. The PHP backend also runs
-- the same idempotent migration automatically on the first request.

USE `studysync`;

CREATE TABLE IF NOT EXISTS `users` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `username` VARCHAR(32) NULL,
  `email` VARCHAR(190) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `avatar_url` VARCHAR(500) NULL,
  `bio` VARCHAR(500) NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `last_seen_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`), UNIQUE KEY `uq_users_email` (`email`), UNIQUE KEY `uq_users_username` (`username`), KEY `idx_users_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `user_sessions` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, `user_id` INT UNSIGNED NOT NULL,
  `token_hash` CHAR(64) NOT NULL, `expires_at` DATETIME NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`), UNIQUE KEY `uq_sessions_token` (`token_hash`), KEY `idx_sessions_user` (`user_id`),
  CONSTRAINT `fk_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `friendships` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, `requester_id` INT UNSIGNED NOT NULL, `addressee_id` INT UNSIGNED NOT NULL,
  `status` ENUM('pending','accepted','declined','blocked') NOT NULL DEFAULT 'pending',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`), UNIQUE KEY `uq_friend_pair` (`requester_id`,`addressee_id`), KEY `idx_friend_addressee` (`addressee_id`),
  CONSTRAINT `fk_friend_requester` FOREIGN KEY (`requester_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_friend_addressee` FOREIGN KEY (`addressee_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `group_members` (
  `group_id` INT UNSIGNED NOT NULL, `user_id` INT UNSIGNED NOT NULL,
  `role` ENUM('owner','admin','member') NOT NULL DEFAULT 'member', `joined_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`group_id`,`user_id`), KEY `idx_members_user` (`user_id`),
  CONSTRAINT `fk_members_group` FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_members_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `group_invitations` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, `group_id` INT UNSIGNED NOT NULL, `inviter_id` INT UNSIGNED NOT NULL, `invitee_id` INT UNSIGNED NOT NULL,
  `status` ENUM('pending','accepted','declined') NOT NULL DEFAULT 'pending', `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, `responded_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`), KEY `idx_group_invitee` (`invitee_id`,`status`),
  CONSTRAINT `fk_inv_group` FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_inv_inviter` FOREIGN KEY (`inviter_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_inv_invitee` FOREIGN KEY (`invitee_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `messages` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, `group_id` INT UNSIGNED NULL, `sender_id` INT UNSIGNED NOT NULL, `receiver_id` INT UNSIGNED NULL, `body` TEXT NOT NULL,
  `reply_to_id` BIGINT UNSIGNED NULL, `image_name` VARCHAR(80) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, `edited_at` TIMESTAMP NULL DEFAULT NULL, `deleted_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`), KEY `idx_messages_group` (`group_id`,`id`), KEY `idx_messages_reply` (`reply_to_id`),
  CONSTRAINT `fk_messages_group` FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_messages_sender` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_messages_receiver` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `messages` ADD COLUMN IF NOT EXISTS `reply_to_id` BIGINT UNSIGNED NULL AFTER `body`;
ALTER TABLE `messages` ADD COLUMN IF NOT EXISTS `image_name` VARCHAR(80) NULL AFTER `reply_to_id`;

CREATE TABLE IF NOT EXISTS `notifications` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, `user_id` INT UNSIGNED NOT NULL, `type` VARCHAR(50) NOT NULL, `title` VARCHAR(160) NOT NULL, `body` VARCHAR(500) NOT NULL,
  `data_json` JSON NULL, `read_at` TIMESTAMP NULL DEFAULT NULL, `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`), KEY `idx_notifications_user` (`user_id`,`read_at`,`id`),
  CONSTRAINT `fk_notifications_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `task_assignees` (
  `task_id` INT UNSIGNED NOT NULL, `user_id` INT UNSIGNED NOT NULL, `assigned_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`task_id`,`user_id`), CONSTRAINT `fk_assign_task` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_assign_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `task_comments` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, `task_id` INT UNSIGNED NOT NULL, `user_id` INT UNSIGNED NOT NULL, `body` VARCHAR(1000) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (`id`), KEY `idx_comments_task` (`task_id`,`id`),
  CONSTRAINT `fk_comments_task` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_comments_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `groups` ADD COLUMN IF NOT EXISTS `description` VARCHAR(500) NULL AFTER `name`;
ALTER TABLE `tasks` ADD COLUMN IF NOT EXISTS `description` TEXT NULL AFTER `title`;
ALTER TABLE `tasks` ADD COLUMN IF NOT EXISTS `priority` ENUM('low','medium','high') NOT NULL DEFAULT 'medium' AFTER `status`;
ALTER TABLE `tasks` ADD COLUMN IF NOT EXISTS `due_at` DATETIME NULL AFTER `priority`;
ALTER TABLE `tasks` ADD COLUMN IF NOT EXISTS `created_by` INT UNSIGNED NULL AFTER `group_id`;
