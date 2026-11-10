CREATE TABLE IF NOT EXISTS destins_portraits (
    id CHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    bio TEXT NULL,
    image_url VARCHAR(2048) NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY destins_active_order (is_active, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO destins_portraits (id, name, role, bio, image_url, display_order, is_active)
SELECT 'b1c2d3e4-f5a6-7890-bcde-111111111111', 'Madjiguène Cissé', 'Porte-parole emblématique des Sans-Papiers de Saint-Bernard', 'Pionnière de l''auto-organisation des femmes et des travailleurs sans-papiers, elle a donné une voix internationale au mouvement de 1996.', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=800&auto=format&fit=crop', 1, 1
WHERE NOT EXISTS (SELECT 1 FROM destins_portraits WHERE id = 'b1c2d3e4-f5a6-7890-bcde-111111111111');

INSERT INTO destins_portraits (id, name, role, bio, image_url, display_order, is_active)
SELECT 'b1c2d3e4-f5a6-7890-bcde-222222222222', 'Père Henri Coindé', 'Curé de la paroisse Saint-Bernard (1996)', 'Acteur de paix et de conscience, il a ouvert les portes de l''église et défendu le droit d''asile au péril de ses relations avec l''administration.', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=800&auto=format&fit=crop', 2, 1
WHERE NOT EXISTS (SELECT 1 FROM destins_portraits WHERE id = 'b1c2d3e4-f5a6-7890-bcde-222222222222');

INSERT INTO destins_portraits (id, name, role, bio, image_url, display_order, is_active)
SELECT 'b1c2d3e4-f5a6-7890-bcde-333333333333', 'Ababacar Diop', 'Porte-parole du collectif de Saint-Bernard', 'Auteur et figure de la lutte, il a défendu la régularisation des 300 et documenté les coulisses du mouvement.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop', 3, 1
WHERE NOT EXISTS (SELECT 1 FROM destins_portraits WHERE id = 'b1c2d3e4-f5a6-7890-bcde-333333333333');
