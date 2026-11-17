<?php
declare(strict_types=1);

require dirname(__DIR__) . '/src/bootstrap.php';
require dirname(__DIR__) . '/src/contribution-content.php';

try {
    configureCorsAndSession();

    $method = requestMethod();
    $path = requestPath();

    if ($method === 'GET' && $path === '/api/health') {
        database()->query('SELECT 1');
        sendJson(200, ['status' => 'ok']);
    }

    if ($method === 'POST' && $path === '/api/auth/login') {
        $body = readJsonBody();
        $email = strtolower(trim((string) ($body['email'] ?? '')));
        $password = $body['password'] ?? null;
        if (!filter_var($email, FILTER_VALIDATE_EMAIL) || !is_string($password) || $password === '') {
            sendJson(400, ['error' => 'A valid email and password are required.']);
        }

        $pdo = database();
        $identityHash = hash('sha256', $email . '|' . ($_SERVER['REMOTE_ADDR'] ?? 'unknown'));
        $pdo->prepare('DELETE FROM login_attempts WHERE attempted_at < UTC_TIMESTAMP() - INTERVAL 1 DAY')->execute();
        $count = $pdo->prepare('SELECT COUNT(*) FROM login_attempts WHERE identity_hash = :identity_hash AND attempted_at >= UTC_TIMESTAMP() - INTERVAL 15 MINUTE');
        $count->execute(['identity_hash' => $identityHash]);
        if ((int) $count->fetchColumn() >= 10) {
            sendJson(429, ['error' => 'Too many login attempts. Please try again later.']);
        }

        $query = $pdo->prepare('SELECT id, email, password_hash, role, is_active FROM users WHERE email = :email LIMIT 1');
        $query->execute(['email' => $email]);
        $user = $query->fetch();
        if (!$user || !(bool) $user['is_active'] || !password_verify($password, $user['password_hash'])) {
            $pdo->prepare('INSERT INTO login_attempts (identity_hash) VALUES (:identity_hash)')
                ->execute(['identity_hash' => $identityHash]);
            sendJson(401, ['error' => 'The email or password is incorrect.']);
        }

        $pdo->prepare('DELETE FROM login_attempts WHERE identity_hash = :identity_hash')
            ->execute(['identity_hash' => $identityHash]);
        session_regenerate_id(true);
        $_SESSION['user'] = [
            'id' => (int) $user['id'],
            'email' => $user['email'],
            'role' => $user['role'],
        ];
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        $pdo->prepare('INSERT INTO connection_logs (id, email) VALUES (:id, :email)')
            ->execute(['id' => createUuid(), 'email' => $user['email']]);

        sendJson(200, [
            'user' => $_SESSION['user'],
            'csrfToken' => $_SESSION['csrf_token'],
        ]);
    }

    if ($method === 'GET' && $path === '/api/auth/me') {
        sendJson(200, [
            'user' => authenticatedUser(),
            'csrfToken' => $_SESSION['csrf_token'] ?? null,
        ]);
    }

    if ($method === 'POST' && $path === '/api/auth/logout') {
        authenticatedUser();
        requireCsrfToken();
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', [
                'expires' => time() - 42000,
                'path' => $params['path'],
                'domain' => $params['domain'],
                'secure' => $params['secure'],
                'httponly' => $params['httponly'],
                'samesite' => $params['samesite'] ?? 'Lax',
            ]);
        }
        session_destroy();
        sendJson(200, ['status' => 'ok']);
    }

    if ($method === 'POST' && $path === '/api/member/messages') {
        $user = authenticatedUser();
        requireCsrfToken();
        $body = readJsonBody();
        $subject = trim((string) ($body['subject'] ?? ''));
        $message = trim((string) ($body['message'] ?? ''));
        if ($subject === '' || strlen($subject) > 255 || $message === '') {
            sendJson(400, ['error' => 'A subject and message are required.']);
        }
        if (strlen($message) > 10000) {
            sendJson(400, ['error' => 'The message must not exceed 10,000 characters.']);
        }
        $id = createUuid();
        database()->prepare('INSERT INTO member_messages (id, user_id, subject, message) VALUES (:id, :user_id, :subject, :message)')
            ->execute(['id' => $id, 'user_id' => $user['id'], 'subject' => $subject, 'message' => $message]);
        sendJson(201, ['id' => $id, 'subject' => $subject, 'message' => $message, 'status' => 'unread']);
    }

    if ($method === 'POST' && $path === '/api/member/uploads') {
        $user = authenticatedUser();
        requireCsrfToken();
        $title = trim((string) ($_POST['title'] ?? ''));
        if ($title === '' || strlen($title) > 255) {
            sendJson(400, ['error' => 'A valid file title is required.']);
        }
        $upload = $_FILES['file'] ?? null;
        if (!is_array($upload)) {
            sendJson(400, ['error' => 'A file is required.']);
        }
        $fileUrl = saveUploadedFile('file', 'member_uploads', true, true);
        if ($fileUrl === null) {
            sendJson(400, ['error' => 'A file is required.']);
        }
        $originalFilename = basename((string) ($upload['name'] ?? 'file'));
        if (strlen($originalFilename) > 255) {
            $originalFilename = substr($originalFilename, 0, 255);
        }
        $mimeType = (string) ($upload['type'] ?? 'application/octet-stream');
        $fileSize = (int) ($upload['size'] ?? 0);
        $id = createUuid();
        try {
            database()->prepare('INSERT INTO member_uploads (id, user_id, title, original_filename, file_url, mime_type, file_size) VALUES (:id, :user_id, :title, :original_filename, :file_url, :mime_type, :file_size)')
                ->execute([
                    'id' => $id,
                    'user_id' => $user['id'],
                    'title' => $title,
                    'original_filename' => $originalFilename,
                    'file_url' => $fileUrl,
                    'mime_type' => $mimeType,
                    'file_size' => $fileSize,
                ]);
        } catch (Throwable $error) {
            $storedFile = dirname(__DIR__) . '/storage/uploads/member_uploads/' . basename((string) parse_url($fileUrl, PHP_URL_PATH));
            if (is_file($storedFile)) unlink($storedFile);
            throw $error;
        }
        sendJson(201, [
            'id' => $id,
            'title' => $title,
            'original_filename' => $originalFilename,
            'file_url' => $fileUrl,
            'mime_type' => $mimeType,
            'file_size' => $fileSize,
            'status' => 'new',
        ]);
    }

    if ($method === 'GET' && $path === '/api/admin/member/messages') {
        requireAdmin();
        $messages = database()->query('SELECT m.id, m.subject, m.message, m.status, m.created_at, u.email FROM member_messages m JOIN users u ON u.id = m.user_id ORDER BY m.created_at DESC')->fetchAll();
        sendJson(200, ['data' => $messages]);
    }

    if ($method === 'GET' && $path === '/api/admin/member/uploads') {
        requireAdmin();
        $uploads = database()->query('SELECT u.id, u.title, u.original_filename, u.file_url, u.mime_type, u.file_size, u.status, u.created_at, m.email FROM member_uploads u JOIN users m ON m.id = u.user_id ORDER BY u.created_at DESC')->fetchAll();
        sendJson(200, ['data' => $uploads]);
    }

    if ($method === 'PATCH' && preg_match('#^/api/admin/member/messages/([a-f0-9-]{36})$#', $path, $matches)) {
        requireAdmin();
        requireCsrfToken();
        database()->prepare("UPDATE member_messages SET status = 'read' WHERE id = :id")->execute(['id' => $matches[1]]);
        sendJson(200, ['success' => true]);
    }

    if ($method === 'PATCH' && preg_match('#^/api/admin/member/uploads/([a-f0-9-]{36})$#', $path, $matches)) {
        requireAdmin();
        requireCsrfToken();
        database()->prepare("UPDATE member_uploads SET status = 'reviewed' WHERE id = :id")->execute(['id' => $matches[1]]);
        sendJson(200, ['success' => true]);
    }

    if ($method === 'GET' && preg_match('#^/api/admin/member/uploads/([a-f0-9-]{36})/download$#', $path, $matches)) {
        requireAdmin();
        $query = database()->prepare('SELECT file_url, original_filename FROM member_uploads WHERE id = :id LIMIT 1');
        $query->execute(['id' => $matches[1]]);
        $upload = $query->fetch();
        if (!$upload) sendJson(404, ['error' => 'Uploaded file not found.']);
        $filename = basename((string) parse_url((string) $upload['file_url'], PHP_URL_PATH));
        $file = dirname(__DIR__) . '/storage/uploads/member_uploads/' . $filename;
        if (!is_file($file) || !is_readable($file)) sendJson(404, ['error' => 'Uploaded file not found.']);
        header('Content-Type: application/octet-stream');
        header('Content-Length: ' . (string) filesize($file));
        header('Content-Disposition: attachment; filename="' . str_replace(['"', '\\'], '', (string) $upload['original_filename']) . '"');
        readfile($file);
        exit;
    }

    if ($method === 'GET' && $path === '/api/banners') {
        $query = database()->query("SELECT id, title, subtitle, image_url, link_url, button_text, button_url FROM banners WHERE is_active = 1 AND payment_status = 'paid' AND (ends_at IS NULL OR ends_at >= UTC_TIMESTAMP()) ORDER BY created_at DESC");
        sendJson(200, ['data' => $query->fetchAll()]);
    }

    if ($method === 'GET' && $path === '/api/carousel-slides') {
        $query = database()->query('SELECT id, title, description, image_url, link_url, display_order, is_active, image_position FROM carousel_slides WHERE is_active = 1 ORDER BY display_order ASC, created_at ASC');
        $isPaused = (bool) database()->query('SELECT is_paused FROM carousel_settings WHERE id = 1')->fetchColumn();
        sendJson(200, ['data' => $query->fetchAll(), 'is_paused' => $isPaused]);
    }

    if ($method === 'GET' && $path === '/api/gallery') {
        $query = database()->query('SELECT id, title, type, category, url, description, display_order, is_active FROM gallery_items WHERE is_active = 1 ORDER BY display_order ASC, created_at DESC');
        sendJson(200, ['data' => $query->fetchAll()]);
    }

    if ($method === 'GET' && $path === '/api/destins') {
        $query = database()->query('SELECT id, name, role, bio, image_url, display_order, is_active FROM destins_portraits WHERE is_active = 1 ORDER BY display_order ASC, created_at ASC');
        sendJson(200, ['data' => $query->fetchAll()]);
    }

    if ($method === 'GET' && $path === '/api/videos') {
        $query = database()->query('SELECT id, title, youtube_id, description, badge_date, display_order, is_active FROM videos_archives WHERE is_active = 1 ORDER BY display_order ASC, created_at ASC');
        sendJson(200, ['data' => $query->fetchAll()]);
    }

    if (($method === 'GET' || $method === 'HEAD') && preg_match('#^/api/media/(banners|carousel|contributions|gallery|destins)/([a-f0-9]{32}\.(?:jpg|png|webp|gif|pdf))$#', $path, $matches)) {
        $category = $matches[1];
        $filename = $matches[2];
        $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
        if ($category !== 'contributions' && $category !== 'gallery' && $extension === 'pdf') {
            sendJson(404, ['error' => 'File not found.']);
        }

        $file = dirname(__DIR__) . '/storage/uploads/' . $category . '/' . $filename;
        if (!is_file($file) || !is_readable($file)) {
            sendJson(404, ['error' => 'File not found.']);
        }
        $contentTypes = [
            'jpg' => 'image/jpeg',
            'png' => 'image/png',
            'webp' => 'image/webp',
            'gif' => 'image/gif',
            'pdf' => 'application/pdf',
        ];
        header('Content-Type: ' . $contentTypes[$extension]);
        header('Content-Length: ' . (string) filesize($file));
        header('X-Content-Type-Options: nosniff');
        header('Cache-Control: public, max-age=31536000, immutable');
        header('Content-Disposition: ' . ($extension === 'pdf' ? 'attachment' : 'inline'));
        if ($method === 'GET') {
            readfile($file);
        }
        exit;
    }

    if ($method === 'GET' && $path === '/api/contributions') {
        $query = database()->query("SELECT id, title, content, file_url, created_at FROM contributions_goutte_dor WHERE status = 'published' ORDER BY created_at DESC");
        sendJson(200, ['data' => $query->fetchAll()]);
    }

    if ($method === 'GET' && $path === '/api/member/archives') {
        authenticatedUser();
        $query = database()->query("SELECT id, title, content, author_email, file_url, archived_at, created_at FROM contributions_goutte_dor WHERE status = 'published' AND is_archive = 1 ORDER BY COALESCE(archived_at, created_at) DESC, created_at DESC");
        sendJson(200, ['data' => $query->fetchAll()]);
    }

    if ($method === 'GET' && preg_match('#^/api/member/archives/([a-f0-9-]{36})/download$#', $path, $matches)) {
        authenticatedUser();
        $query = database()->prepare("SELECT title, file_url FROM contributions_goutte_dor WHERE id = :id AND status = 'published' AND is_archive = 1 LIMIT 1");
        $query->execute(['id' => $matches[1]]);
        $archive = $query->fetch();
        if (!$archive) sendJson(404, ['error' => 'Archive not found.']);
        $pathValue = parse_url((string) $archive['file_url'], PHP_URL_PATH);
        if (!is_string($pathValue) || !preg_match('#/api/media/contributions/([a-f0-9]{32}\.(?:jpg|png|webp|gif|pdf))$#', $pathValue, $fileMatches)) {
            sendJson(404, ['error' => 'Archive file not found.']);
        }
        $filename = $fileMatches[1];
        $file = dirname(__DIR__) . '/storage/uploads/contributions/' . $filename;
        if (!is_file($file) || !is_readable($file)) sendJson(404, ['error' => 'Archive file not found.']);
        $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
        $contentTypes = ['pdf' => 'application/pdf', 'jpg' => 'image/jpeg', 'png' => 'image/png', 'webp' => 'image/webp', 'gif' => 'image/gif'];
        header('Content-Type: ' . ($contentTypes[$extension] ?? 'application/octet-stream'));
        header('Content-Disposition: attachment; filename="' . str_replace(['"', '\\'], '', (string) $archive['title']) . '.' . $extension . '"');
        header('Content-Length: ' . (string) filesize($file));
        readfile($file);
        exit;
    }

    if ($method === 'POST' && $path === '/api/contributions') {
        $title = trim((string) ($_POST['title'] ?? ''));
        $content = trim((string) ($_POST['content'] ?? ''));
        $authorEmail = strtolower(trim((string) ($_POST['author_email'] ?? '')));
        $hasUploadedFile = isset($_FILES['file'])
            && is_array($_FILES['file'])
            && ($_FILES['file']['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE;
        if ($title === '' || strlen($title) > 255 || ($content === '' && !$hasUploadedFile)) {
            sendJson(400, ['error' => 'A title and either contribution text or an attached file are required.']);
        }
        if ($authorEmail !== '' && !filter_var($authorEmail, FILTER_VALIDATE_EMAIL)) {
            sendJson(400, ['error' => 'The author email is invalid.']);
        }

        $pdo = database();
        $identityHash = hash('sha256', $_SERVER['REMOTE_ADDR'] ?? 'unknown');
        $pdo->prepare('DELETE FROM contribution_attempts WHERE attempted_at < UTC_TIMESTAMP() - INTERVAL 1 DAY')->execute();
        $count = $pdo->prepare('SELECT COUNT(*) FROM contribution_attempts WHERE identity_hash = :identity_hash AND attempted_at >= UTC_TIMESTAMP() - INTERVAL 1 HOUR');
        $count->execute(['identity_hash' => $identityHash]);
        if ((int) $count->fetchColumn() >= 5) {
            sendJson(429, ['error' => 'Too many contributions have been submitted from this connection.']);
        }

        $fileUrl = saveUploadedFile('file', 'contributions', true);
        if ($content === '' && $fileUrl === null) {
            sendJson(400, ['error' => 'Add contribution text or attach a file.']);
        }
        $id = createUuid();
        try {
            $query = $pdo->prepare('INSERT INTO contributions_goutte_dor (id, title, content, author_email, file_url) VALUES (:id, :title, :content, :author_email, :file_url)');
            $query->execute([
                'id' => $id,
                'title' => $title,
                'content' => $content,
                'author_email' => $authorEmail === '' ? null : $authorEmail,
                'file_url' => $fileUrl,
            ]);
            $pdo->prepare('INSERT INTO contribution_attempts (identity_hash) VALUES (:identity_hash)')
                ->execute(['identity_hash' => $identityHash]);
        } catch (Throwable $error) {
            if ($fileUrl !== null) {
                $storedFile = dirname(__DIR__) . '/storage/uploads/contributions/' . basename((string) parse_url($fileUrl, PHP_URL_PATH));
                if (is_file($storedFile) && !unlink($storedFile)) {
                    error_log('[Saint-Bernard API] Unable to remove a contribution upload after database failure.');
                }
            }
            throw $error;
        }
        sendJson(201, ['id' => $id, 'status' => 'pending']);
    }

    if ($method === 'GET' && $path === '/api/admin/dashboard') {
        requireAdmin();
        $pdo = database();
        $pendingArticles = (int) $pdo->query("SELECT COUNT(*) FROM contributions_goutte_dor WHERE status = 'pending'")->fetchColumn();
        $totalArticles = (int) $pdo->query('SELECT COUNT(*) FROM contributions_goutte_dor')->fetchColumn();
        $uniqueUsers = (int) $pdo->query('SELECT COUNT(DISTINCT LOWER(TRIM(email))) FROM connection_logs')->fetchColumn();
        $totalDonations = (float) $pdo->query('SELECT COALESCE(SUM(amount), 0) FROM donations')->fetchColumn();
        $carouselSlides = $pdo->query('SELECT id, title, description, image_url, link_url, display_order, is_active, image_position FROM carousel_slides ORDER BY display_order ASC, created_at ASC')->fetchAll();
        $banners = $pdo->query('SELECT id, title, subtitle, image_url, link_url, button_text, button_url, is_active, duration_type, starts_at, ends_at, price_amount, payment_status, created_at FROM banners ORDER BY created_at DESC')->fetchAll();
        $galleryItems = $pdo->query('SELECT id, title, type, category, url, description, display_order, is_active, created_at FROM gallery_items ORDER BY display_order ASC, created_at DESC')->fetchAll();
        $destinsPortraits = $pdo->query('SELECT id, name, role, bio, image_url, display_order, is_active, created_at FROM destins_portraits ORDER BY display_order ASC, created_at ASC')->fetchAll();
        $videosArchives = $pdo->query('SELECT id, title, youtube_id, description, badge_date, display_order, is_active, created_at FROM videos_archives ORDER BY display_order ASC, created_at ASC')->fetchAll();
        $carouselPaused = (bool) $pdo->query('SELECT is_paused FROM carousel_settings WHERE id = 1')->fetchColumn();
        $totalBannerRevenue = (float) $pdo->query("SELECT COALESCE(SUM(price_amount), 0) FROM banners WHERE payment_status = 'paid'")->fetchColumn();
        sendJson(200, [
            'metrics' => [
                'pendingArticles' => $pendingArticles,
                'totalArticles' => $totalArticles,
                'uniqueUsers' => $uniqueUsers,
                'totalDonations' => $totalDonations,
                'totalBannerRevenue' => $totalBannerRevenue,
            ],
            'carouselSlides' => $carouselSlides,
            'carouselPaused' => $carouselPaused,
            'banners' => $banners,
            'galleryItems' => $galleryItems,
            'destinsPortraits' => $destinsPortraits,
            'videosArchives' => $videosArchives,
        ]);
    }

    if ($method === 'POST' && $path === '/api/admin/banners') {
        requireAdmin();
        requireCsrfToken();
        $title = trim((string) ($_POST['title'] ?? ''));
        $subtitle = trim((string) ($_POST['subtitle'] ?? ''));
        $buttonText = trim((string) ($_POST['button_text'] ?? ''));
        $buttonUrl = validateOptionalUrl($_POST['button_url'] ?? null, 'button_url');
        $durationType = strtolower(trim((string) ($_POST['duration_type'] ?? 'month')));
        $paymentStatus = strtolower(trim((string) ($_POST['payment_status'] ?? 'unpaid')));
        $priceAmount = filter_var($_POST['price_amount'] ?? 0, FILTER_VALIDATE_FLOAT);
        if ($title === '' || strlen($title) > 255) {
            sendJson(400, ['error' => 'A banner title of up to 255 characters is required.']);
        }
        if (!in_array($durationType, ['week', 'month', 'year', 'lifetime'], true)) {
            sendJson(400, ['error' => 'Invalid banner duration.']);
        }
        if (!in_array($paymentStatus, ['paid', 'unpaid'], true)) {
            sendJson(400, ['error' => 'Invalid payment status.']);
        }
        if ($priceAmount === false || $priceAmount < 0) {
            sendJson(400, ['error' => 'The banner amount must be a positive number.']);
        }

        $imageUrl = saveUploadedFile('file', 'banners');
        if ($imageUrl === null) {
            sendJson(400, ['error' => 'A banner image is required.']);
        }
        $startsAt = (new DateTimeImmutable('now', new DateTimeZone('UTC')))->format('Y-m-d H:i:s');
        $endsAt = null;
        if ($durationType === 'week') $endsAt = (new DateTimeImmutable($startsAt))->modify('+7 days')->format('Y-m-d H:i:s');
        if ($durationType === 'month') $endsAt = (new DateTimeImmutable($startsAt))->modify('+1 month')->format('Y-m-d H:i:s');
        if ($durationType === 'year') $endsAt = (new DateTimeImmutable($startsAt))->modify('+1 year')->format('Y-m-d H:i:s');
        $isActive = $paymentStatus === 'paid' ? 1 : 0;
        $id = createUuid();
        try {
            $query = database()->prepare('INSERT INTO banners (id, title, subtitle, image_url, button_text, button_url, is_active, duration_type, starts_at, ends_at, price_amount, payment_status) VALUES (:id, :title, :subtitle, :image_url, :button_text, :button_url, :is_active, :duration_type, :starts_at, :ends_at, :price_amount, :payment_status)');
            $query->execute([
                'id' => $id,
                'title' => $title,
                'subtitle' => $subtitle === '' ? null : $subtitle,
                'image_url' => $imageUrl,
                'button_text' => $buttonText === '' ? null : $buttonText,
                'button_url' => $buttonUrl,
                'is_active' => $isActive,
                'duration_type' => $durationType,
                'starts_at' => $startsAt,
                'ends_at' => $endsAt,
                'price_amount' => number_format((float) $priceAmount, 2, '.', ''),
                'payment_status' => $paymentStatus,
            ]);
        } catch (Throwable $error) {
            $storedFile = dirname(__DIR__) . '/storage/uploads/banners/' . basename((string) parse_url($imageUrl, PHP_URL_PATH));
            if (is_file($storedFile) && !unlink($storedFile)) {
                error_log('[Saint-Bernard API] Unable to remove a banner upload after database failure.');
            }
            throw $error;
        }
        sendJson(201, [
            'id' => $id,
            'title' => $title,
            'subtitle' => $subtitle === '' ? null : $subtitle,
            'image_url' => $imageUrl,
            'button_text' => $buttonText === '' ? null : $buttonText,
            'button_url' => $buttonUrl,
            'is_active' => $isActive === 1,
            'duration_type' => $durationType,
            'starts_at' => $startsAt,
            'ends_at' => $endsAt,
            'price_amount' => number_format((float) $priceAmount, 2, '.', ''),
            'payment_status' => $paymentStatus,
        ]);
    }

    if (($method === 'PATCH' || $method === 'DELETE') && preg_match('#^/api/admin/banners/([a-f0-9-]{36})$#', $path, $matches)) {
        requireAdmin();
        requireCsrfToken();
        $id = $matches[1];
        $pdo = database();
        $query = $pdo->prepare('SELECT id, image_url FROM banners WHERE id = :id LIMIT 1');
        $query->execute(['id' => $id]);
        $banner = $query->fetch();
        if (!$banner) sendJson(404, ['error' => 'Banner not found.']);

        if ($method === 'DELETE') {
            $delete = $pdo->prepare('DELETE FROM banners WHERE id = :id');
            $delete->execute(['id' => $id]);
            $storedFile = dirname(__DIR__) . '/storage/uploads/banners/' . basename((string) parse_url((string) $banner['image_url'], PHP_URL_PATH));
            if (is_file($storedFile)) unlink($storedFile);
            sendJson(200, ['success' => true]);
        }

        $body = readJsonBody();
        $allowed = ['title', 'subtitle', 'button_text', 'button_url', 'is_active', 'payment_status', 'duration_type', 'price_amount'];
        $updates = [];
        $params = ['id' => $id];
        foreach ($allowed as $field) {
            if (!array_key_exists($field, $body)) continue;
            if ($field === 'title') {
                $title = trim((string) $body[$field]);
                if ($title === '' || strlen($title) > 255) {
                    sendJson(400, ['error' => 'A banner title of up to 255 characters is required.']);
                }
                $updates[] = 'title = :title';
                $params['title'] = $title;
            } elseif (in_array($field, ['subtitle', 'button_text'], true)) {
                $updates[] = $field . ' = :' . $field;
                $value = trim((string) $body[$field]);
                $params[$field] = $value === '' ? null : $value;
            } elseif ($field === 'button_url') {
                $updates[] = 'button_url = :button_url';
                $params['button_url'] = validateOptionalUrl($body[$field], 'button_url');
            } elseif ($field === 'is_active') {
                $updates[] = 'is_active = :is_active';
                $params['is_active'] = filter_var($body[$field], FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE) === true ? 1 : 0;
            } elseif ($field === 'payment_status' && in_array((string) $body[$field], ['paid', 'unpaid'], true)) {
                $updates[] = 'payment_status = :payment_status';
                $params['payment_status'] = (string) $body[$field];
            } elseif ($field === 'duration_type' && in_array((string) $body[$field], ['week', 'month', 'year', 'lifetime'], true)) {
                $duration = (string) $body[$field];
                $updates[] = 'duration_type = :duration_type';
                $params['duration_type'] = $duration;
                $startsAt = new DateTimeImmutable('now', new DateTimeZone('UTC'));
                $endsAt = $duration === 'week' ? $startsAt->modify('+7 days')->format('Y-m-d H:i:s') : ($duration === 'month' ? $startsAt->modify('+1 month')->format('Y-m-d H:i:s') : ($duration === 'year' ? $startsAt->modify('+1 year')->format('Y-m-d H:i:s') : null));
                $updates[] = 'starts_at = :starts_at';
                $updates[] = 'ends_at = :ends_at';
                $params['starts_at'] = $startsAt->format('Y-m-d H:i:s');
                $params['ends_at'] = $endsAt;
            } elseif ($field === 'price_amount' && is_numeric($body[$field]) && (float) $body[$field] >= 0) {
                $updates[] = 'price_amount = :price_amount';
                $params['price_amount'] = number_format((float) $body[$field], 2, '.', '');
            }
        }
        if (!$updates) sendJson(400, ['error' => 'No valid banner update was provided.']);
        $pdo->prepare('UPDATE banners SET ' . implode(', ', $updates) . ' WHERE id = :id')->execute($params);
        $select = $pdo->prepare('SELECT id, title, subtitle, image_url, link_url, button_text, button_url, is_active, duration_type, starts_at, ends_at, price_amount, payment_status, created_at FROM banners WHERE id = :id LIMIT 1');
        $select->execute(['id' => $id]);
        $updated = $select->fetch();
        sendJson(200, $updated);
    }

    if (($method === 'PATCH' || $method === 'DELETE') && preg_match('#^/api/admin/carousel-slides/([a-f0-9-]{36})$#', $path, $matches)) {
        requireAdmin();
        requireCsrfToken();
        $id = $matches[1];
        $pdo = database();
        $query = $pdo->prepare('SELECT id, image_url FROM carousel_slides WHERE id = :id LIMIT 1');
        $query->execute(['id' => $id]);
        $slide = $query->fetch();
        if (!$slide) sendJson(404, ['error' => 'Carousel slide not found.']);

        if ($method === 'DELETE') {
            $pdo->prepare('DELETE FROM carousel_slides WHERE id = :id')->execute(['id' => $id]);
            $storedFile = dirname(__DIR__) . '/storage/uploads/carousel/' . basename((string) parse_url((string) $slide['image_url'], PHP_URL_PATH));
            if (is_file($storedFile)) unlink($storedFile);
            sendJson(200, ['success' => true]);
        }

        $body = readJsonBody();
        $updates = [];
        $params = ['id' => $id];
        if (array_key_exists('is_active', $body)) {
            $updates[] = 'is_active = :is_active';
            $params['is_active'] = filter_var($body['is_active'], FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE) === true ? 1 : 0;
        }
        foreach (['title', 'description'] as $field) {
            if (array_key_exists($field, $body)) {
                $updates[] = $field . ' = :' . $field;
                $value = trim((string) $body[$field]);
                $params[$field] = $value === '' ? null : $value;
            }
        }
        if (array_key_exists('link_url', $body)) {
            $linkUrl = validateOptionalUrl($body['link_url'], 'link_url');
            $updates[] = 'link_url = :link_url';
            $params['link_url'] = $linkUrl;
        }
        if (array_key_exists('display_order', $body) && filter_var($body['display_order'], FILTER_VALIDATE_INT) !== false) {
            $updates[] = 'display_order = :display_order';
            $params['display_order'] = (int) $body['display_order'];
        }
        if (array_key_exists('image_position', $body)) {
            $imagePosition = $body['image_position'];
            $allowedPositions = ['50% 15%', '50% 25%', '50% 30%', '50% 50%', '25% 35%', '75% 35%', '50% 60%', '50% 70%'];
            if (!is_string($imagePosition) || !in_array($imagePosition, $allowedPositions, true)) {
                sendJson(400, ['error' => 'A valid carousel image position is required.']);
            }
            $updates[] = 'image_position = :image_position';
            $params['image_position'] = $imagePosition;
        }
        if (!$updates) sendJson(400, ['error' => 'No valid carousel slide update was provided.']);
        $pdo->prepare('UPDATE carousel_slides SET ' . implode(', ', $updates) . ' WHERE id = :id')->execute($params);
        $select = $pdo->prepare('SELECT id, title, description, image_url, link_url, display_order, is_active, image_position FROM carousel_slides WHERE id = :id LIMIT 1');
        $select->execute(['id' => $id]);
        sendJson(200, $select->fetch());
    }

    if ($method === 'PATCH' && $path === '/api/admin/carousel-settings') {
        requireAdmin();
        requireCsrfToken();
        $body = readJsonBody();
        $isPaused = filter_var($body['is_paused'] ?? null, FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE);
        if ($isPaused === null) {
            sendJson(400, ['error' => 'A boolean is_paused value is required.']);
        }
        database()->prepare('UPDATE carousel_settings SET is_paused = :is_paused WHERE id = 1')
            ->execute(['is_paused' => $isPaused ? 1 : 0]);
        sendJson(200, ['is_paused' => $isPaused]);
    }

    if ($method === 'POST' && $path === '/api/admin/carousel-slides') {
        requireAdmin();
        requireCsrfToken();
        $title = trim((string) ($_POST['title'] ?? ''));
        $description = trim((string) ($_POST['description'] ?? ''));
        $displayOrder = filter_var($_POST['display_order'] ?? '0', FILTER_VALIDATE_INT);
        $imagePosition = $_POST['image_position'] ?? '50% 30%';
        $allowedPositions = ['50% 15%', '50% 25%', '50% 30%', '50% 50%', '25% 35%', '75% 35%', '50% 60%', '50% 70%'];
        $linkUrl = validateOptionalUrl($_POST['link_url'] ?? null, 'link_url');
        if ($displayOrder === false) {
            sendJson(400, ['error' => 'display_order must be an integer.']);
        }
        if (!is_string($imagePosition) || !in_array($imagePosition, $allowedPositions, true)) {
            sendJson(400, ['error' => 'A valid carousel image position is required.']);
        }
        $imageUrl = saveUploadedFile('file', 'carousel');
        if ($imageUrl === null) {
            sendJson(400, ['error' => 'A carousel image is required.']);
        }
        $id = createUuid();
        try {
            $query = database()->prepare('INSERT INTO carousel_slides (id, title, description, image_url, link_url, display_order, is_active, image_position) VALUES (:id, :title, :description, :image_url, :link_url, :display_order, 1, :image_position)');
            $query->execute([
                'id' => $id,
                'title' => $title === '' ? null : $title,
                'description' => $description === '' ? null : $description,
                'image_url' => $imageUrl,
                'link_url' => $linkUrl,
                'display_order' => $displayOrder,
                'image_position' => $imagePosition,
            ]);
        } catch (Throwable $error) {
            $storedFile = dirname(__DIR__) . '/storage/uploads/carousel/' . basename((string) parse_url($imageUrl, PHP_URL_PATH));
            if (is_file($storedFile) && !unlink($storedFile)) {
                error_log('[Saint-Bernard API] Unable to remove a carousel upload after database failure.');
            }
            throw $error;
        }
        sendJson(201, [
            'id' => $id,
            'title' => $title === '' ? null : $title,
            'description' => $description === '' ? null : $description,
            'image_url' => $imageUrl,
            'link_url' => $linkUrl,
            'display_order' => $displayOrder,
            'image_position' => $imagePosition,
            'is_active' => true,
        ]);
    }

    if ($method === 'GET' && $path === '/api/admin/gallery') {
        requireAdmin();
        $items = database()->query('SELECT id, title, type, category, url, description, display_order, is_active, created_at FROM gallery_items ORDER BY display_order ASC, created_at DESC')->fetchAll();
        sendJson(200, ['data' => $items]);
    }

    if (($method === 'PATCH' || $method === 'DELETE') && preg_match('#^/api/admin/gallery/([a-f0-9-]{36})$#', $path, $matches)) {
        requireAdmin();
        requireCsrfToken();
        $id = $matches[1];
        $pdo = database();
        $query = $pdo->prepare('SELECT id, url FROM gallery_items WHERE id = :id LIMIT 1');
        $query->execute(['id' => $id]);
        $item = $query->fetch();
        if (!$item) sendJson(404, ['error' => 'Élément de la galerie introuvable.']);

        if ($method === 'DELETE') {
            $pdo->prepare('DELETE FROM gallery_items WHERE id = :id')->execute(['id' => $id]);
            $pathValue = parse_url((string) $item['url'], PHP_URL_PATH);
            if (is_string($pathValue) && str_contains($pathValue, '/api/media/gallery/')) {
                $storedFile = dirname(__DIR__) . '/storage/uploads/gallery/' . basename($pathValue);
                if (is_file($storedFile)) unlink($storedFile);
            }
            sendJson(200, ['success' => true]);
        }

        $body = readJsonBody();
        $updates = [];
        $params = ['id' => $id];
        if (array_key_exists('is_active', $body)) {
            $updates[] = 'is_active = :is_active';
            $params['is_active'] = filter_var($body['is_active'], FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE) === true ? 1 : 0;
        }
        foreach (['title', 'description', 'type', 'category', 'url'] as $field) {
            if (array_key_exists($field, $body)) {
                $updates[] = $field . ' = :' . $field;
                $value = trim((string) $body[$field]);
                $params[$field] = $value === '' ? null : $value;
            }
        }
        if (array_key_exists('display_order', $body) && filter_var($body['display_order'], FILTER_VALIDATE_INT) !== false) {
            $updates[] = 'display_order = :display_order';
            $params['display_order'] = (int) $body['display_order'];
        }
        if (!$updates) sendJson(400, ['error' => 'Aucune modification valide fournie.']);
        $pdo->prepare('UPDATE gallery_items SET ' . implode(', ', $updates) . ' WHERE id = :id')->execute($params);
        $select = $pdo->prepare('SELECT id, title, type, category, url, description, display_order, is_active FROM gallery_items WHERE id = :id LIMIT 1');
        $select->execute(['id' => $id]);
        sendJson(200, $select->fetch());
    }

    if ($method === 'POST' && $path === '/api/admin/gallery') {
        requireAdmin();
        requireCsrfToken();
        $title = trim((string) ($_POST['title'] ?? ''));
        $type = trim((string) ($_POST['type'] ?? 'photo'));
        $category = trim((string) ($_POST['category'] ?? 'Histoire'));
        $description = trim((string) ($_POST['description'] ?? ''));
        $displayOrder = filter_var($_POST['display_order'] ?? '0', FILTER_VALIDATE_INT);
        $url = trim((string) ($_POST['url'] ?? ''));

        if ($title === '') {
            sendJson(400, ['error' => 'Un titre est requis.']);
        }
        if ($displayOrder === false) {
            $displayOrder = 0;
        }

        $uploadedUrl = saveUploadedFile('file', 'gallery', true);
        if ($uploadedUrl !== null) {
            $url = $uploadedUrl;
        }

        if ($url === '') {
            sendJson(400, ['error' => 'Une image ou un lien URL est requis.']);
        }

        $id = createUuid();
        try {
            $query = database()->prepare('INSERT INTO gallery_items (id, title, type, category, url, description, display_order, is_active) VALUES (:id, :title, :type, :category, :url, :description, :display_order, 1)');
            $query->execute([
                'id' => $id,
                'title' => $title,
                'type' => in_array($type, ['photo', 'video', 'document'], true) ? $type : 'photo',
                'category' => $category === '' ? 'Histoire' : $category,
                'url' => $url,
                'description' => $description === '' ? null : $description,
                'display_order' => $displayOrder,
            ]);
        } catch (Throwable $error) {
            if ($uploadedUrl !== null) {
                $storedFile = dirname(__DIR__) . '/storage/uploads/gallery/' . basename((string) parse_url($uploadedUrl, PHP_URL_PATH));
                if (is_file($storedFile) && !unlink($storedFile)) {
                    error_log('[Saint-Bernard API] Unable to remove a gallery upload after database failure.');
                }
            }
            throw $error;
        }
        sendJson(201, [
            'id' => $id,
            'title' => $title,
            'type' => $type,
            'category' => $category,
            'url' => $url,
            'description' => $description,
            'display_order' => $displayOrder,
            'is_active' => true,
        ]);
    }

    if ($method === 'GET' && $path === '/api/admin/destins') {
        requireAdmin();
        $items = database()->query('SELECT id, name, role, bio, image_url, display_order, is_active, created_at FROM destins_portraits ORDER BY display_order ASC, created_at ASC')->fetchAll();
        sendJson(200, ['data' => $items]);
    }

    if (($method === 'PATCH' || $method === 'DELETE') && preg_match('#^/api/admin/destins/([a-f0-9-]{36})$#', $path, $matches)) {
        requireAdmin();
        requireCsrfToken();
        $id = $matches[1];
        $pdo = database();
        $query = $pdo->prepare('SELECT id, image_url FROM destins_portraits WHERE id = :id LIMIT 1');
        $query->execute(['id' => $id]);
        $portrait = $query->fetch();
        if (!$portrait) sendJson(404, ['error' => 'Portrait introuvable.']);

        if ($method === 'DELETE') {
            $pdo->prepare('DELETE FROM destins_portraits WHERE id = :id')->execute(['id' => $id]);
            $pathValue = parse_url((string) $portrait['image_url'], PHP_URL_PATH);
            if (is_string($pathValue) && str_contains($pathValue, '/api/media/destins/')) {
                $storedFile = dirname(__DIR__) . '/storage/uploads/destins/' . basename($pathValue);
                if (is_file($storedFile)) unlink($storedFile);
            }
            sendJson(200, ['success' => true]);
        }

        $body = readJsonBody();
        $updates = [];
        $params = ['id' => $id];
        if (array_key_exists('is_active', $body)) {
            $updates[] = 'is_active = :is_active';
            $params['is_active'] = filter_var($body['is_active'], FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE) === true ? 1 : 0;
        }
        foreach (['name', 'role', 'bio', 'image_url'] as $field) {
            if (array_key_exists($field, $body)) {
                $updates[] = $field . ' = :' . $field;
                $value = trim((string) $body[$field]);
                $params[$field] = $value === '' ? null : $value;
            }
        }
        if (array_key_exists('display_order', $body) && filter_var($body['display_order'], FILTER_VALIDATE_INT) !== false) {
            $updates[] = 'display_order = :display_order';
            $params['display_order'] = (int) $body['display_order'];
        }
        if (!$updates) sendJson(400, ['error' => 'Aucune modification valide fournie.']);
        $pdo->prepare('UPDATE destins_portraits SET ' . implode(', ', $updates) . ' WHERE id = :id')->execute($params);
        $select = $pdo->prepare('SELECT id, name, role, bio, image_url, display_order, is_active FROM destins_portraits WHERE id = :id LIMIT 1');
        $select->execute(['id' => $id]);
        sendJson(200, $select->fetch());
    }

    if ($method === 'POST' && $path === '/api/admin/destins') {
        requireAdmin();
        requireCsrfToken();
        $name = trim((string) ($_POST['name'] ?? ''));
        $role = trim((string) ($_POST['role'] ?? ''));
        $bio = trim((string) ($_POST['bio'] ?? ''));
        $displayOrder = filter_var($_POST['display_order'] ?? '0', FILTER_VALIDATE_INT);
        $imageUrl = trim((string) ($_POST['image_url'] ?? ''));

        if ($name === '' || $role === '') {
            sendJson(400, ['error' => 'Le nom et le rôle sont requis.']);
        }
        if ($displayOrder === false) {
            $displayOrder = 0;
        }

        $uploadedUrl = saveUploadedFile('file', 'destins');
        if ($uploadedUrl !== null) {
            $imageUrl = $uploadedUrl;
        }

        if ($imageUrl === '') {
            sendJson(400, ['error' => 'Une photo (fichier ou lien URL) est requise.']);
        }

        $id = createUuid();
        try {
            $query = database()->prepare('INSERT INTO destins_portraits (id, name, role, bio, image_url, display_order, is_active) VALUES (:id, :name, :role, :bio, :image_url, :display_order, 1)');
            $query->execute([
                'id' => $id,
                'name' => $name,
                'role' => $role,
                'bio' => $bio === '' ? null : $bio,
                'image_url' => $imageUrl,
                'display_order' => $displayOrder,
            ]);
        } catch (Throwable $error) {
            if ($uploadedUrl !== null) {
                $storedFile = dirname(__DIR__) . '/storage/uploads/destins/' . basename((string) parse_url($uploadedUrl, PHP_URL_PATH));
                if (is_file($storedFile) && !unlink($storedFile)) {
                    error_log('[Saint-Bernard API] Unable to remove a destins upload after database failure.');
                }
            }
            throw $error;
        }
        sendJson(201, [
            'id' => $id,
            'name' => $name,
            'role' => $role,
            'bio' => $bio,
            'image_url' => $imageUrl,
            'display_order' => $displayOrder,
            'is_active' => true,
        ]);
    }

    if ($method === 'GET' && $path === '/api/admin/videos') {
        requireAdmin();
        $items = database()->query('SELECT id, title, youtube_id, description, badge_date, display_order, is_active, created_at FROM videos_archives ORDER BY display_order ASC, created_at ASC')->fetchAll();
        sendJson(200, ['data' => $items]);
    }

    if (($method === 'PATCH' || $method === 'DELETE') && preg_match('#^/api/admin/videos/([a-f0-9-]{36})$#', $path, $matches)) {
        requireAdmin();
        requireCsrfToken();
        $id = $matches[1];
        $pdo = database();
        $query = $pdo->prepare('SELECT id FROM videos_archives WHERE id = :id LIMIT 1');
        $query->execute(['id' => $id]);
        $video = $query->fetch();
        if (!$video) sendJson(404, ['error' => 'Vidéo introuvable.']);

        if ($method === 'DELETE') {
            $pdo->prepare('DELETE FROM videos_archives WHERE id = :id')->execute(['id' => $id]);
            sendJson(200, ['success' => true]);
        }

        $body = readJsonBody();
        $updates = [];
        $params = ['id' => $id];
        if (array_key_exists('is_active', $body)) {
            $updates[] = 'is_active = :is_active';
            $params['is_active'] = filter_var($body['is_active'], FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE) === true ? 1 : 0;
        }
        foreach (['title', 'description', 'badge_date'] as $field) {
            if (array_key_exists($field, $body)) {
                $updates[] = $field . ' = :' . $field;
                $value = trim((string) $body[$field]);
                $params[$field] = $value === '' ? null : $value;
            }
        }
        if (array_key_exists('youtube_id', $body)) {
            $rawYt = trim((string) $body['youtube_id']);
            if (preg_match('#(?:youtube\.com/(?:watch\?v=|embed/|v/)|youtu\.be/|youtube-nocookie\.com/embed/)([a-zA-Z0-9_-]{11})#', $rawYt, $m)) {
                $rawYt = $m[1];
            }
            $updates[] = 'youtube_id = :youtube_id';
            $params['youtube_id'] = $rawYt;
        }
        if (array_key_exists('display_order', $body) && filter_var($body['display_order'], FILTER_VALIDATE_INT) !== false) {
            $updates[] = 'display_order = :display_order';
            $params['display_order'] = (int) $body['display_order'];
        }
        if (!$updates) sendJson(400, ['error' => 'Aucune modification valide fournie.']);
        $pdo->prepare('UPDATE videos_archives SET ' . implode(', ', $updates) . ' WHERE id = :id')->execute($params);
        $select = $pdo->prepare('SELECT id, title, youtube_id, description, badge_date, display_order, is_active FROM videos_archives WHERE id = :id LIMIT 1');
        $select->execute(['id' => $id]);
        sendJson(200, $select->fetch());
    }

    if ($method === 'POST' && $path === '/api/admin/videos') {
        requireAdmin();
        requireCsrfToken();
        $title = trim((string) ($_POST['title'] ?? ''));
        $rawYoutubeId = trim((string) ($_POST['youtube_id'] ?? ''));
        $description = trim((string) ($_POST['description'] ?? ''));
        $badgeDate = trim((string) ($_POST['badge_date'] ?? 'Archive'));
        $displayOrder = filter_var($_POST['display_order'] ?? '0', FILTER_VALIDATE_INT);

        if ($title === '' || $rawYoutubeId === '') {
            sendJson(400, ['error' => 'Le titre et le lien ou identifiant YouTube sont requis.']);
        }
        if ($displayOrder === false) {
            $displayOrder = 0;
        }

        $youtubeId = $rawYoutubeId;
        if (preg_match('#(?:youtube\.com/(?:watch\?v=|embed/|v/)|youtu\.be/|youtube-nocookie\.com/embed/)([a-zA-Z0-9_-]{11})#', $rawYoutubeId, $m)) {
            $youtubeId = $m[1];
        }

        $id = createUuid();
        $query = database()->prepare('INSERT INTO videos_archives (id, title, youtube_id, description, badge_date, display_order, is_active) VALUES (:id, :title, :youtube_id, :description, :badge_date, :display_order, 1)');
        $query->execute([
            'id' => $id,
            'title' => $title,
            'youtube_id' => $youtubeId,
            'description' => $description === '' ? null : $description,
            'badge_date' => $badgeDate === '' ? 'Archive' : $badgeDate,
            'display_order' => $displayOrder,
        ]);

        sendJson(201, [
            'id' => $id,
            'title' => $title,
            'youtube_id' => $youtubeId,
            'description' => $description,
            'badge_date' => $badgeDate,
            'display_order' => $displayOrder,
            'is_active' => true,
        ]);
    }

    if ($method === 'POST' && $path === '/api/admin/contributions') {
        requireAdmin();
        requireCsrfToken();
        $title = trim((string) ($_POST['title'] ?? ''));
        $content = trim((string) ($_POST['content'] ?? ''));
        $authorEmail = strtolower(trim((string) ($_POST['author_email'] ?? '')));
        $hasUploadedFile = isset($_FILES['file'])
            && is_array($_FILES['file'])
            && ($_FILES['file']['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE;
        if ($title === '' || strlen($title) > 255 || ($content === '' && !$hasUploadedFile)) {
            sendJson(400, ['error' => 'A title and either contribution text or an attached file are required.']);
        }
        try {
            $content = normalizeContributionContent($content);
        } catch (InvalidArgumentException $error) {
            sendJson(400, ['error' => $error->getMessage()]);
        }
        if (!$hasUploadedFile && !contributionContentHasText($content)) {
            sendJson(400, ['error' => 'Add contribution text or attach a file.']);
        }
        if (!filter_var($authorEmail, FILTER_VALIDATE_EMAIL)) {
            sendJson(400, ['error' => 'A valid member email is required.']);
        }

        $pdo = database();
        $member = $pdo->prepare('SELECT email FROM users WHERE email = :email LIMIT 1');
        $member->execute(['email' => $authorEmail]);
        $registeredEmail = $member->fetchColumn();
        if (!is_string($registeredEmail)) {
            sendJson(400, ['error' => 'The selected author does not have an association account.']);
        }

        $fileUrl = saveUploadedFile('file', 'contributions', true);
        if ($content === '' && $fileUrl === null) {
            sendJson(400, ['error' => 'Add contribution text or attach a file.']);
        }
        $id = createUuid();
        try {
            $query = $pdo->prepare('INSERT INTO contributions_goutte_dor (id, title, content, author_email, file_url) VALUES (:id, :title, :content, :author_email, :file_url)');
            $query->execute([
                'id' => $id,
                'title' => $title,
                'content' => $content,
                'author_email' => $registeredEmail,
                'file_url' => $fileUrl,
            ]);
        } catch (Throwable $error) {
            if ($fileUrl !== null) {
                $storedFile = dirname(__DIR__) . '/storage/uploads/contributions/' . basename((string) parse_url($fileUrl, PHP_URL_PATH));
                if (is_file($storedFile) && !unlink($storedFile)) {
                    error_log('[Saint-Bernard API] Unable to remove an admin contribution upload after database failure.');
                }
            }
            throw $error;
        }
        sendJson(201, [
            'id' => $id,
            'title' => $title,
            'content' => $content,
            'author_email' => $registeredEmail,
            'file_url' => $fileUrl,
            'status' => 'pending',
            'created_at' => gmdate('Y-m-d H:i:s'),
        ]);
    }

    if ($method === 'GET' && $path === '/api/admin/contributions') {
        requireAdmin();
        $query = database()->query('SELECT id, title, content, author_email, file_url, status, is_archive, archived_at, created_at FROM contributions_goutte_dor ORDER BY created_at DESC');
        sendJson(200, ['data' => $query->fetchAll()]);
    }

    if ($method === 'PATCH' && preg_match('#^/api/admin/contributions/([a-f0-9-]{36})$#', $path, $matches)) {
        requireAdmin();
        requireCsrfToken();
        $body = readJsonBody();

        if (array_key_exists('is_archive', $body)) {
            $isArchive = filter_var($body['is_archive'], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            if ($isArchive === null) {
                sendJson(400, ['error' => 'is_archive must be a boolean.']);
            }
            $check = database()->prepare('SELECT status FROM contributions_goutte_dor WHERE id = :id LIMIT 1');
            $check->execute(['id' => $matches[1]]);
            $status = $check->fetchColumn();
            if ($status === false) sendJson(404, ['error' => 'Contribution not found.']);
            if ($isArchive && $status !== 'published') sendJson(409, ['error' => 'Only a published contribution can be added to archives.']);
            database()->prepare('UPDATE contributions_goutte_dor SET is_archive = :is_archive, archived_at = :archived_at WHERE id = :id')->execute([
                'is_archive' => $isArchive ? 1 : 0,
                'archived_at' => $isArchive ? gmdate('Y-m-d H:i:s') : null,
                'id' => $matches[1],
            ]);
            sendJson(200, ['is_archive' => $isArchive, 'archived_at' => $isArchive ? gmdate('Y-m-d H:i:s') : null]);
        }

        if (array_key_exists('title', $body) || array_key_exists('content', $body)) {
            if (
                !array_key_exists('title', $body)
                || !array_key_exists('content', $body)
                || !is_string($body['title'])
                || !is_string($body['content'])
            ) {
                sendJson(400, ['error' => 'Both a title and contribution text are required for editing.']);
            }

            $title = trim($body['title']);
            $content = trim($body['content']);
            if ($title === '' || strlen($title) > 255 || $content === '') {
                sendJson(400, ['error' => 'A non-empty title (up to 255 characters) and contribution text are required.']);
            }
            try {
                $content = normalizeContributionContent($content);
            } catch (InvalidArgumentException $error) {
                sendJson(400, ['error' => $error->getMessage()]);
            }
            if (!contributionContentHasText($content)) {
                sendJson(400, ['error' => 'The contribution text cannot be empty.']);
            }

            $pdo = database();
            $pdo->beginTransaction();
            try {
                $check = $pdo->prepare('SELECT status FROM contributions_goutte_dor WHERE id = :id FOR UPDATE');
                $check->execute(['id' => $matches[1]]);
                $currentStatus = $check->fetchColumn();
                if ($currentStatus === false) {
                    $pdo->rollBack();
                    sendJson(404, ['error' => 'Contribution not found.']);
                }
                if ($currentStatus !== 'suspended') {
                    $pdo->rollBack();
                    sendJson(409, ['error' => 'Suspend the contribution before editing it.']);
                }

                $query = $pdo->prepare('UPDATE contributions_goutte_dor SET title = :title, content = :content WHERE id = :id');
                $query->execute(['title' => $title, 'content' => $content, 'id' => $matches[1]]);
                $pdo->commit();
            } catch (Throwable $error) {
                if ($pdo->inTransaction()) {
                    $pdo->rollBack();
                }
                throw $error;
            }

            sendJson(200, ['status' => 'ok']);
        }

        $status = $body['status'] ?? null;
        if (!in_array($status, ['pending', 'published', 'rejected', 'suspended'], true)) {
            sendJson(400, ['error' => 'The requested contribution status is invalid.']);
        }
        if ($status === 'published') {
            $query = database()->prepare('UPDATE contributions_goutte_dor SET status = :status WHERE id = :id');
            $query->execute(['status' => $status, 'id' => $matches[1]]);
        } else {
            $query = database()->prepare('UPDATE contributions_goutte_dor SET status = :status, is_archive = 0, archived_at = NULL WHERE id = :id');
            $query->execute(['status' => $status, 'id' => $matches[1]]);
        }
        if ($query->rowCount() === 0) {
            $exists = database()->prepare('SELECT 1 FROM contributions_goutte_dor WHERE id = :id');
            $exists->execute(['id' => $matches[1]]);
            if (!$exists->fetchColumn()) {
                sendJson(404, ['error' => 'Contribution not found.']);
            }
        }
        sendJson(200, ['status' => 'ok']);
    }

    if ($method === 'DELETE' && preg_match('#^/api/admin/contributions/([a-f0-9-]{36})$#', $path, $matches)) {
        requireAdmin();
        requireCsrfToken();
        $pdo = database();
        $id = $matches[1];
        $pdo->beginTransaction();
        try {
            $query = $pdo->prepare('SELECT file_url FROM contributions_goutte_dor WHERE id = :id FOR UPDATE');
            $query->execute(['id' => $id]);
            $contribution = $query->fetch();
            if (!$contribution) {
                $pdo->rollBack();
                sendJson(404, ['error' => 'Contribution not found.']);
            }

            $fileUrl = $contribution['file_url'];
            if (is_string($fileUrl) && $fileUrl !== '') {
                $path = parse_url($fileUrl, PHP_URL_PATH);
                if (!is_string($path) || !preg_match('#/api/media/contributions/([a-f0-9]{32}\.(?:jpg|png|webp|gif|pdf))$#', $path, $fileMatches)) {
                    throw new RuntimeException('The contribution contains an invalid stored file URL.');
                }
                $storedFile = dirname(__DIR__) . '/storage/uploads/contributions/' . $fileMatches[1];
                if (is_file($storedFile) && !unlink($storedFile)) {
                    throw new RuntimeException('Unable to remove the contribution upload.');
                }
            }

            $delete = $pdo->prepare('DELETE FROM contributions_goutte_dor WHERE id = :id');
            $delete->execute(['id' => $id]);
            $pdo->commit();
        } catch (Throwable $error) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $error;
        }
        sendJson(200, ['status' => 'ok']);
    }

    if ($method === 'GET' && $path === '/api/admin/users') {
        requireAdmin();
        $query = database()->query('SELECT id, email, role, is_active, created_at FROM users ORDER BY email ASC');
        sendJson(200, ['data' => $query->fetchAll()]);
    }

    if ($method === 'POST' && $path === '/api/admin/users') {
        requireAdmin();
        requireCsrfToken();
        $body = readJsonBody();
        $email = strtolower(trim((string) ($body['email'] ?? '')));
        $password = $body['password'] ?? null;
        $role = $body['role'] ?? 'member';
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            sendJson(400, ['error' => 'A valid email is required.']);
        }
        if (!is_string($password) || strlen($password) < 12) {
            sendJson(400, ['error' => 'The password must contain at least 12 characters.']);
        }
        if (!in_array($role, ['admin', 'member'], true)) {
            sendJson(400, ['error' => 'The requested role is invalid.']);
        }

        try {
            $query = database()->prepare('INSERT INTO users (email, password_hash, role) VALUES (:email, :password_hash, :role)');
            $query->execute([
                'email' => $email,
                'password_hash' => password_hash($password, PASSWORD_DEFAULT),
                'role' => $role,
            ]);
        } catch (PDOException $error) {
            if ($error->getCode() === '23000') {
                sendJson(409, ['error' => 'A user with this email already exists.']);
            }
            throw $error;
        }
        sendJson(201, ['id' => (int) database()->lastInsertId(), 'email' => $email, 'role' => $role]);
    }

    if ($method === 'PATCH' && preg_match('#^/api/admin/users/([1-9][0-9]*)$#', $path, $matches)) {
        $admin = requireAdmin();
        requireCsrfToken();
        $userId = (int) $matches[1];
        $body = readJsonBody();
        $pdo = database();

        $role = $body['role'] ?? null;
        $isActive = $body['isActive'] ?? null;
        $password = $body['password'] ?? null;
        if ($role !== null && !in_array($role, ['admin', 'member'], true)) {
            sendJson(400, ['error' => 'The requested role is invalid.']);
        }
        if ($isActive !== null && !is_bool($isActive)) {
            sendJson(400, ['error' => 'isActive must be a boolean.']);
        }
        if ($password !== null && (!is_string($password) || strlen($password) < 12)) {
            sendJson(400, ['error' => 'The password must contain at least 12 characters.']);
        }
        if ($role === null && $isActive === null && $password === null) {
            sendJson(400, ['error' => 'At least one account field must be provided.']);
        }

        try {
            $pdo->beginTransaction();
            $query = $pdo->prepare('SELECT id, role, is_active FROM users WHERE id = :id FOR UPDATE');
            $query->execute(['id' => $userId]);
            $target = $query->fetch();
            if (!$target) {
                $pdo->rollBack();
                sendJson(404, ['error' => 'User not found.']);
            }

            $nextRole = $role ?? $target['role'];
            $nextActive = $isActive ?? (bool) $target['is_active'];
            if ((int) $admin['id'] === $userId && ($nextRole !== 'admin' || !$nextActive)) {
                $pdo->rollBack();
                sendJson(409, ['error' => 'You cannot disable or demote your own administrator account.']);
            }

            if ($target['role'] === 'admin' && (bool) $target['is_active'] && ($nextRole !== 'admin' || !$nextActive)) {
                $activeAdmins = $pdo->query("SELECT id FROM users WHERE role = 'admin' AND is_active = 1 FOR UPDATE")->fetchAll();
                if (count($activeAdmins) <= 1) {
                    $pdo->rollBack();
                    sendJson(409, ['error' => 'At least one active administrator must remain.']);
                }
            }

            $query = $pdo->prepare(
                'UPDATE users SET role = :role, is_active = :is_active, password_hash = COALESCE(:password_hash, password_hash) WHERE id = :id'
            );
            $query->execute([
                'role' => $nextRole,
                'is_active' => $nextActive ? 1 : 0,
                'password_hash' => $password === null ? null : password_hash($password, PASSWORD_DEFAULT),
                'id' => $userId,
            ]);
            $pdo->commit();
        } catch (Throwable $error) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $error;
        }
        sendJson(200, ['status' => 'ok']);
    }

    if ($method === 'POST' && $path === '/api/stripe/checkout') {
        if (isset($_SESSION['user']) && is_array($_SESSION['user'])) {
            requireCsrfToken();
        }
        $body = readJsonBody();
        $amount = $body['amount'] ?? null;
        if (!is_int($amount) && !is_float($amount) && !(is_string($amount) && is_numeric($amount))) {
            sendJson(400, ['error' => 'A valid donation amount is required.']);
        }
        $amountInCents = (int) round((float) $amount * 100);
        if ($amountInCents < 100 || $amountInCents > 99999999) {
            sendJson(400, ['error' => 'The donation amount must be between 1 and 999999.99 EUR.']);
        }
        $frontendUrl = rtrim((string) envValue('APP_FRONTEND_URL', ''), '/');
        if ($frontendUrl === '') {
            throw new RuntimeException('APP_FRONTEND_URL is not configured.');
        }

        $donorEmail = null;
        $sessionUser = $_SESSION['user'] ?? null;
        if (is_array($sessionUser) && isset($sessionUser['email']) && is_string($sessionUser['email']) && filter_var($sessionUser['email'], FILTER_VALIDATE_EMAIL)) {
            $donorEmail = $sessionUser['email'];
        }
        if (is_array($sessionUser) && ($sessionUser['role'] ?? '') === 'member') {
            $successUrl = $frontendUrl . '/dashboard/don?payment=success';
        } else {
            $successUrl = $frontendUrl . '/faire-un-don/merci';
        }
        $cancelUrl = is_array($sessionUser) && ($sessionUser['role'] ?? '') === 'member'
            ? $frontendUrl . '/dashboard/don?payment=cancelled'
            : $frontendUrl . '/faire-un-don?payment=cancelled';

        $session = createStripeCheckoutSession($amountInCents, $successUrl, $cancelUrl, $donorEmail);
        if (!isset($session['url']) || !is_string($session['url'])) {
            throw new RuntimeException('Stripe did not return a checkout URL.');
        }
        sendJson(200, ['url' => $session['url']]);
    }

    if ($method === 'POST' && $path === '/api/stripe/verify-session') {
        $verifiedUser = authenticatedUser();
        requireCsrfToken();
        $body = readJsonBody();
        $sessionId = $body['session_id'] ?? null;
        if (!is_string($sessionId) || !str_starts_with($sessionId, 'cs_')) {
            sendJson(400, ['error' => 'A valid Stripe checkout session is required.']);
        }
        $session = retrieveStripeCheckoutSession($sessionId);
        $paymentStatus = $session['payment_status'] ?? null;
        $status = $session['status'] ?? null;
        if ($paymentStatus !== 'paid' || $status !== 'complete') {
            sendJson(200, ['verified' => false]);
        }

        $amount = $session['amount_total'] ?? null;
        $paymentId = $session['payment_intent'] ?? $session['id'] ?? null;
        $donorEmail = $session['metadata']['donor_email'] ?? $session['customer_details']['email'] ?? null;
        if (!is_int($amount) || $amount < 100 || !is_string($paymentId) || $paymentId === '') {
            sendJson(400, ['error' => 'The Stripe session does not contain a valid payment.']);
        }
        if (!is_string($donorEmail) || !filter_var($donorEmail, FILTER_VALIDATE_EMAIL)) {
            $sessionUser = $verifiedUser['email'] ?? null;
            $donorEmail = is_string($sessionUser) && filter_var($sessionUser, FILTER_VALIDATE_EMAIL) ? $sessionUser : null;
        }
        $query = database()->prepare('INSERT IGNORE INTO donations (id, amount, donor_email, stripe_payment_id) VALUES (:id, :amount, :donor_email, :stripe_payment_id)');
        $query->execute([
            'id' => createUuid(),
            'amount' => number_format($amount / 100, 2, '.', ''),
            'donor_email' => $donorEmail,
            'stripe_payment_id' => $paymentId,
        ]);
        sendJson(200, ['verified' => true, 'amount' => $amount / 100]);
    }

    if ($method === 'POST' && $path === '/api/stripe/webhook') {
        $body = file_get_contents('php://input');
        $signature = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';
        $secret = (string) envValue('STRIPE_WEBHOOK_SECRET', '');
        if ($body === false || $secret === '' || !verifyStripeSignature($body, $signature, $secret)) {
            sendJson(400, ['error' => 'Invalid webhook signature.']);
        }
        try {
            $event = json_decode($body, true, 512, JSON_THROW_ON_ERROR);
        } catch (JsonException) {
            sendJson(400, ['error' => 'Invalid webhook payload.']);
        }
        if (($event['type'] ?? null) === 'checkout.session.completed') {
            $session = $event['data']['object'] ?? [];
            $amount = $session['amount_total'] ?? null;
            $paymentId = $session['payment_intent'] ?? $session['id'] ?? null;
            $donorEmail = $session['metadata']['donor_email'] ?? $session['customer_details']['email'] ?? null;
            if (is_int($amount) && $amount > 0 && is_string($paymentId) && $paymentId !== '') {
                if (!is_string($donorEmail) || !filter_var($donorEmail, FILTER_VALIDATE_EMAIL)) {
                    $donorEmail = null;
                }
                $query = database()->prepare('INSERT IGNORE INTO donations (id, amount, donor_email, stripe_payment_id) VALUES (:id, :amount, :donor_email, :stripe_payment_id)');
                $query->execute([
                    'id' => createUuid(),
                    'amount' => number_format($amount / 100, 2, '.', ''),
                    'donor_email' => $donorEmail,
                    'stripe_payment_id' => $paymentId,
                ]);
            }
        }
        sendJson(200, ['received' => true]);
    }

    sendJson(404, ['error' => 'Route not found.']);
} catch (Throwable $error) {
    error_log(sprintf('[Saint-Bernard API] %s in %s:%d', $error->getMessage(), $error->getFile(), $error->getLine()));
    sendJson(500, ['error' => 'An unexpected server error occurred.']);
}

function createUuid(): string
{
    $bytes = random_bytes(16);
    $bytes[6] = chr((ord($bytes[6]) & 0x0f) | 0x40);
    $bytes[8] = chr((ord($bytes[8]) & 0x3f) | 0x80);
    $hex = bin2hex($bytes);
    return sprintf('%s-%s-%s-%s-%s', substr($hex, 0, 8), substr($hex, 8, 4), substr($hex, 12, 4), substr($hex, 16, 4), substr($hex, 20));
}
