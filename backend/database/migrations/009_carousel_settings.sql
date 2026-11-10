CREATE TABLE IF NOT EXISTS carousel_settings (
    id TINYINT UNSIGNED NOT NULL,
    is_paused TINYINT(1) NOT NULL DEFAULT 0,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO carousel_settings (id, is_paused)
VALUES (1, 0)
ON DUPLICATE KEY UPDATE id = VALUES(id);
