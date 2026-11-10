CREATE TABLE IF NOT EXISTS gallery_items (
    id CHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'photo',
    category VARCHAR(100) NOT NULL DEFAULT 'Histoire',
    url VARCHAR(2048) NOT NULL,
    description TEXT NULL,
    display_order INT NOT NULL DEFAULT 0,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY gallery_active_order (is_active, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO gallery_items (id, title, type, category, url, description, display_order, is_active)
SELECT 'a1b2c3d4-e5f6-7890-abcd-111111111111', 'L''assaut de la porte arrière de l''église', 'photo', 'Histoire', 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?q=80&w=800&auto=format&fit=crop', '23 août 1996 : Forces de l''ordre franchissant les portes de Saint-Bernard.', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM gallery_items WHERE id = 'a1b2c3d4-e5f6-7890-abcd-111111111111');

INSERT INTO gallery_items (id, title, type, category, url, description, display_order, is_active)
SELECT 'a1b2c3d4-e5f6-7890-abcd-222222222222', 'Rassemblement de soutien à la Goutte d''Or', 'photo', 'Solidarité', 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=800&auto=format&fit=crop', 'Habitants et soutiens réunis sur le parvis.', 2, 1
WHERE NOT EXISTS (SELECT 1 FROM gallery_items WHERE id = 'a1b2c3d4-e5f6-7890-abcd-222222222222');

INSERT INTO gallery_items (id, title, type, category, url, description, display_order, is_active)
SELECT 'a1b2c3d4-e5f6-7890-abcd-333333333333', 'Prise de parole de Madjiguène Cissé', 'video', 'Témoignage', 'https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?q=80&w=800&auto=format&fit=crop', 'Conférence de presse lors de la grève de la faim.', 3, 1
WHERE NOT EXISTS (SELECT 1 FROM gallery_items WHERE id = 'a1b2c3d4-e5f6-7890-abcd-333333333333');

INSERT INTO gallery_items (id, title, type, category, url, description, display_order, is_active)
SELECT 'a1b2c3d4-e5f6-7890-abcd-444444444444', 'Tract original des 300 Sans-Papiers (1996)', 'document', 'Archives', 'https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=800&auto=format&fit=crop', 'Manifeste réclamant la régularisation globale et le droit au travail.', 4, 1
WHERE NOT EXISTS (SELECT 1 FROM gallery_items WHERE id = 'a1b2c3d4-e5f6-7890-abcd-444444444444');
