ALTER TABLE carousel_slides
    ADD COLUMN image_position VARCHAR(12) NOT NULL DEFAULT '50% 25%' AFTER is_active;
