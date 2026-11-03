CREATE TABLE IF NOT EXISTS `message_reactions` (
    `message_id` BIGINT UNSIGNED NOT NULL,
    `user_id` INT UNSIGNED NOT NULL,
    -- utf8mb4_bin: under unicode_ci every emoji compares equal, which merges
    -- distinct reactions in GROUP BY and makes the toggle delete the wrong row.
    `emoji` VARCHAR(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`message_id`, `user_id`, `emoji`),
    KEY `idx_message_reactions_message` (`message_id`),
    CONSTRAINT `fk_reactions_message` FOREIGN KEY (`message_id`) REFERENCES `messages` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_reactions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
