CREATE TABLE IF NOT EXISTS `message_reads` (
    `group_id` INT UNSIGNED NOT NULL,
    `user_id` INT UNSIGNED NOT NULL,
    `last_message_id` BIGINT UNSIGNED NOT NULL,
    `read_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`group_id`, `user_id`),
    KEY `idx_message_reads_message` (`group_id`, `last_message_id`),
    CONSTRAINT `fk_reads_group` FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_reads_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
