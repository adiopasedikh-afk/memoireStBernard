CREATE TABLE IF NOT EXISTS videos_archives (
    id CHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    youtube_id VARCHAR(100) NOT NULL,
    description TEXT NULL,
    badge_date VARCHAR(100) NOT NULL DEFAULT 'Archive',
    display_order INT NOT NULL DEFAULT 0,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY videos_active_order (is_active, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO videos_archives (id, title, youtube_id, description, badge_date, display_order, is_active)
SELECT 'c1d2e3f4-a5b6-7890-cdef-111111111111', 'La Ballade des sans-papiers', 'kNjVJoYhc84', 'Documentaire retraçant le mouvement des sans-papiers de Saint-Bernard.', 'Archive 1996', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM videos_archives WHERE id = 'c1d2e3f4-a5b6-7890-cdef-111111111111');

INSERT INTO videos_archives (id, title, youtube_id, description, badge_date, display_order, is_active)
SELECT 'c1d2e3f4-a5b6-7890-cdef-222222222222', 'Les sans-papiers après Saint-Bernard', 'mLoafEv9Vqo', 'Reportage d’époque sur les suites du mouvement après l’évacuation.', 'Archive INA', 2, 1
WHERE NOT EXISTS (SELECT 1 FROM videos_archives WHERE id = 'c1d2e3f4-a5b6-7890-cdef-222222222222');

INSERT INTO videos_archives (id, title, youtube_id, description, badge_date, display_order, is_active)
SELECT 'c1d2e3f4-a5b6-7890-cdef-333333333333', '2ᵉ anniversaire des sans-papiers à l''église St-Bernard', 'lUzwQ59nzuQ', 'Rassemblement de commémoration devant l’église Saint-Bernard.', 'Archive INA', 3, 1
WHERE NOT EXISTS (SELECT 1 FROM videos_archives WHERE id = 'c1d2e3f4-a5b6-7890-cdef-333333333333');

INSERT INTO videos_archives (id, title, youtube_id, description, badge_date, display_order, is_active)
SELECT 'c1d2e3f4-a5b6-7890-cdef-444444444444', '30 ans de l''occupation de l''église Saint-Bernard', 'wlsK4MIzu1U', 'Anzoumane Sissoko sur l’histoire et l’impact de la lutte.', 'Témoignage', 4, 1
WHERE NOT EXISTS (SELECT 1 FROM videos_archives WHERE id = 'c1d2e3f4-a5b6-7890-cdef-444444444444');
