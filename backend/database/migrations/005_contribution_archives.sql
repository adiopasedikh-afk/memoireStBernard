ALTER TABLE contributions_goutte_dor
    ADD COLUMN is_archive TINYINT(1) NOT NULL DEFAULT 0 AFTER status,
    ADD COLUMN archived_at DATETIME NULL AFTER is_archive,
    ADD INDEX contributions_archive_published (is_archive, status, archived_at);
