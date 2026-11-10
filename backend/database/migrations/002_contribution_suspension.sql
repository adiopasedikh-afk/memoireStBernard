ALTER TABLE contributions_goutte_dor
    MODIFY COLUMN status ENUM('pending', 'published', 'rejected', 'suspended') NOT NULL DEFAULT 'pending';
