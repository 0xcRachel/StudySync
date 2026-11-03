CREATE TABLE IF NOT EXISTS `message_mentions` (
    `message_id` BIGINT UNSIGNED NOT NULL,
    `user_id` INT UNSIGNED NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`message_id`, `user_id`),
    KEY `idx_message_mentions_user` (`user_id`, `message_id`),
    CONSTRAINT `fk_mentions_message` FOREIGN KEY (`message_id`) REFERENCES `messages` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_mentions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
