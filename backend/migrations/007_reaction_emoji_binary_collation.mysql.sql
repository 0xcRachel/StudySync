-- Existing databases were created with `emoji` inheriting the table default
-- utf8mb4_unicode_ci, where every emoji compares equal: '' = '' is TRUE.
-- That merged separate reactions into one bucket and made the toggle
-- SELECT/DELETE match a different emoji than the one the user picked.
ALTER TABLE `message_reactions`
    MODIFY `emoji` VARCHAR(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL;
