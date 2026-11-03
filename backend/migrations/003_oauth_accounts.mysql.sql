CREATE TABLE IF NOT EXISTS `oauth_accounts` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` INT UNSIGNED NOT NULL,
    `provider` VARCHAR(20) NOT NULL,
    `provider_subject` VARCHAR(191) NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`), UNIQUE KEY `uq_oauth_identity` (`provider`, `provider_subject`),
    KEY `idx_oauth_user` (`user_id`),
    CONSTRAINT `fk_oauth_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
