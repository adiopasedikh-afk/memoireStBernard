<?php
declare(strict_types=1);

function loadEnvironment(): void
{
    $envFile = dirname(__DIR__) . '/.env';
    if (!is_file($envFile) || !is_readable($envFile)) {
        return;
    }

    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if ($lines === false) {
        throw new RuntimeException('Unable to read backend environment file.');
    }

    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#') || !str_contains($line, '=')) {
            continue;
        }

        [$name, $value] = explode('=', $line, 2);
        $name = trim($name);
        $value = trim($value);
        if (strlen($value) >= 2 && (($value[0] === '"' && $value[-1] === '"') || ($value[0] === "'" && $value[-1] === "'"))) {
            $value = substr($value, 1, -1);
        }
        if ($name !== '' && getenv($name) === false) {
            putenv($name . '=' . $value);
            $_ENV[$name] = $value;
        }
    }
}

function envValue(string $name, ?string $default = null): ?string
{
    $value = getenv($name);
    return $value === false ? $default : $value;
}

function sendJson(int $status, array $payload): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
    exit;
}

function readJsonBody(): array
{
    $body = file_get_contents('php://input');
    if ($body === false || $body === '') {
        sendJson(400, ['error' => 'A JSON request body is required.']);
    }

    try {
        $data = json_decode($body, true, 512, JSON_THROW_ON_ERROR);
    } catch (JsonException) {
        sendJson(400, ['error' => 'The request body must be valid JSON.']);
    }

    if (!is_array($data)) {
        sendJson(400, ['error' => 'The JSON request body must be an object.']);
    }

    return $data;
}

function database(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $host = envValue('DB_HOST', '127.0.0.1');
    $port = envValue('DB_PORT', '3306');
    $name = envValue('DB_NAME');
    $user = envValue('DB_USER');
    $password = envValue('DB_PASSWORD', '');
    if (!$name || !$user) {
        throw new RuntimeException('Database configuration is incomplete.');
    }

    $dsn = sprintf('mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4', $host, $port, $name);
    $pdo = new PDO($dsn, $user, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    $pdo->exec("SET time_zone = '+00:00'");

    return $pdo;
}

function configureCorsAndSession(): void
{
    $allowedOrigin = envValue('APP_ORIGIN', 'http://localhost:3000');
    $origin = $_SERVER['HTTP_ORIGIN'] ?? null;

    if ($origin !== null && !hash_equals((string) $allowedOrigin, $origin)) {
        sendJson(403, ['error' => 'Origin is not allowed.']);
    }

    if ($origin !== null) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Vary: Origin');
        header('Access-Control-Allow-Credentials: true');
        header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token');
        header('Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS');
    }

    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
        http_response_code(204);
        exit;
    }

    $secureCookie = envValue('APP_ENV', 'local') === 'production'
        || (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
    session_name('saint_bernard_session');
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => $secureCookie,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_start();
}

function authenticatedUser(): array
{
    $user = $_SESSION['user'] ?? null;
    if (!is_array($user) || !isset($user['id'], $user['email'], $user['role'])) {
        sendJson(401, ['error' => 'Authentication is required.']);
    }

    $query = database()->prepare('SELECT id, email, role, is_active FROM users WHERE id = :id LIMIT 1');
    $query->execute(['id' => $user['id']]);
    $currentUser = $query->fetch();
    if (!$currentUser || !(bool) $currentUser['is_active']) {
        $_SESSION = [];
        session_destroy();
        sendJson(401, ['error' => 'Authentication is required.']);
    }

    $_SESSION['user'] = [
        'id' => (int) $currentUser['id'],
        'email' => $currentUser['email'],
        'role' => $currentUser['role'],
    ];

    return $_SESSION['user'];
}

function requireAdmin(): array
{
    $user = authenticatedUser();
    if ($user['role'] !== 'admin') {
        sendJson(403, ['error' => 'Administrator access is required.']);
    }

    return $user;
}

function requireCsrfToken(): void
{
    $expected = $_SESSION['csrf_token'] ?? '';
    $provided = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (!is_string($expected) || $expected === '' || !is_string($provided) || !hash_equals($expected, $provided)) {
        sendJson(403, ['error' => 'Invalid CSRF token.']);
    }
}

function requestMethod(): string
{
    return strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
}

function requestPath(): string
{
    $path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
    return is_string($path) ? rtrim($path, '/') ?: '/' : '/';
}

function saveUploadedFile(string $field, string $category, bool $allowPdf = false, bool $allowText = false): ?string
{
    $upload = $_FILES[$field] ?? null;
    if ($upload === null || !is_array($upload) || ($upload['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
        return null;
    }
    if (($upload['error'] ?? UPLOAD_ERR_OK) !== UPLOAD_ERR_OK) {
        $uploadError = (int) ($upload['error'] ?? UPLOAD_ERR_UNKNOWN);
        sendJson(400, ['error' => 'The uploaded file could not be received (PHP upload error ' . $uploadError . ').']);
    }
    if (!is_uploaded_file($upload['tmp_name'] ?? '')) {
        sendJson(400, ['error' => 'The uploaded file is not available for secure processing. Please select it again.']);
    }
    if (($upload['size'] ?? 0) < 1 || $upload['size'] > 8 * 1024 * 1024) {
        sendJson(413, ['error' => 'Files must be no larger than 8 MB.']);
    }

    $allowedTypes = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
        'image/gif' => 'gif',
    ];
    if ($allowPdf) {
        $allowedTypes['application/pdf'] = 'pdf';
    }
    if ($allowText) {
        $allowedTypes['text/plain'] = 'txt';
    }

    $mime = null;
    if ($allowPdf && file_get_contents($upload['tmp_name'], false, null, 0, 5) === '%PDF-') {
        $mime = 'application/pdf';
    } elseif ($allowText && is_string($upload['tmp_name']) && mime_content_type($upload['tmp_name']) === 'text/plain') {
        $mime = 'text/plain';
    } else {
        $image = getimagesize($upload['tmp_name']);
        if (is_array($image) && isset($image['mime'])) {
            $mime = $image['mime'];
        }
    }
    if (!is_string($mime) || !isset($allowedTypes[$mime])) {
        sendJson(415, ['error' => 'This file type is not allowed.']);
    }

    $storageDirectory = dirname(__DIR__) . '/storage/uploads/' . $category;
    if (!is_dir($storageDirectory) && !mkdir($storageDirectory, 0750, true) && !is_dir($storageDirectory)) {
        throw new RuntimeException('Unable to create upload directory.');
    }
    $filename = bin2hex(random_bytes(16)) . '.' . $allowedTypes[$mime];
    if (!move_uploaded_file($upload['tmp_name'], $storageDirectory . '/' . $filename)) {
        throw new RuntimeException('Unable to store uploaded file.');
    }

    $baseUrl = rtrim((string) envValue('APP_BASE_URL', ''), '/');
    if ($baseUrl === '') {
        $storedPath = $storageDirectory . '/' . $filename;
        if (is_file($storedPath) && !unlink($storedPath)) {
            error_log('[Saint-Bernard API] Unable to remove an upload after configuration failure.');
        }
        throw new RuntimeException('APP_BASE_URL is required for file uploads.');
    }
    return $baseUrl . '/api/media/' . $category . '/' . $filename;
}

function validateOptionalUrl(mixed $value, string $field): ?string
{
    if ($value === null || $value === '') {
        return null;
    }
    if (!is_string($value) || !filter_var($value, FILTER_VALIDATE_URL)) {
        sendJson(400, ['error' => $field . ' must be a valid absolute URL.']);
    }
    $scheme = strtolower((string) parse_url($value, PHP_URL_SCHEME));
    if (!in_array($scheme, ['http', 'https'], true)) {
        sendJson(400, ['error' => $field . ' must use HTTP or HTTPS.']);
    }
    return $value;
}

function createStripeCheckoutSession(int $amountInCents, string $successUrl, string $cancelUrl, ?string $donorEmail = null): array
{
    $secretKey = (string) envValue('STRIPE_SECRET_KEY', '');
    if ($secretKey === '') {
        throw new RuntimeException('STRIPE_SECRET_KEY is not configured.');
    }

    $form = [
        'mode' => 'payment',
        'payment_method_types[0]' => 'card',
        'line_items[0][price_data][currency]' => 'eur',
        'line_items[0][price_data][product_data][name]' => "Don à l'association Saint-Bernard",
        'line_items[0][price_data][unit_amount]' => (string) $amountInCents,
        'line_items[0][quantity]' => '1',
        'success_url' => $successUrl . (str_contains($successUrl, '?') ? '&session_id=' : '?session_id=') . '{CHECKOUT_SESSION_ID}',
        'cancel_url' => $cancelUrl,
    ];
    if ($donorEmail !== null && $donorEmail !== '') {
        $form['metadata[donor_email]'] = $donorEmail;
        $form['customer_email'] = $donorEmail;
    }
    $context = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => [
                'Authorization: Basic ' . base64_encode($secretKey . ':'),
                'Content-Type: application/x-www-form-urlencoded',
                'Accept: application/json',
            ],
            'content' => http_build_query($form),
            'timeout' => 20,
            'ignore_errors' => true,
        ],
    ]);

    set_error_handler(static function (int $severity, string $message): never {
        throw new ErrorException($message, 0, $severity);
    });
    try {
        $response = file_get_contents('https://api.stripe.com/v1/checkout/sessions', false, $context);
    } finally {
        restore_error_handler();
    }
    if ($response === false) {
        throw new RuntimeException('Stripe checkout request failed.');
    }

    $decoded = json_decode($response, true);
    if (!is_array($decoded)) {
        throw new RuntimeException('Stripe returned an invalid response.');
    }
    $status = 0;
    foreach ($http_response_header ?? [] as $header) {
        if (preg_match('#^HTTP/\S+\s+([0-9]{3})#', $header, $matches)) {
            $status = (int) $matches[1];
            break;
        }
    }
    if ($status < 200 || $status >= 300) {
        $message = $decoded['error']['message'] ?? 'Stripe rejected the checkout request.';
        throw new RuntimeException(is_string($message) ? $message : 'Stripe rejected the checkout request.');
    }
    return $decoded;
}

function retrieveStripeCheckoutSession(string $sessionId): array
{
    $secretKey = (string) envValue('STRIPE_SECRET_KEY', '');
    if ($secretKey === '') {
        throw new RuntimeException('STRIPE_SECRET_KEY is not configured.');
    }

    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'header' => [
                'Authorization: Basic ' . base64_encode($secretKey . ':'),
                'Accept: application/json',
            ],
            'timeout' => 20,
            'ignore_errors' => true,
        ],
    ]);

    set_error_handler(static function (int $severity, string $message): never {
        throw new ErrorException($message, 0, $severity);
    });
    try {
        $response = file_get_contents('https://api.stripe.com/v1/checkout/sessions/' . rawurlencode($sessionId), false, $context);
    } finally {
        restore_error_handler();
    }
    if ($response === false) {
        throw new RuntimeException('Stripe session verification failed.');
    }

    $decoded = json_decode($response, true);
    if (!is_array($decoded)) {
        throw new RuntimeException('Stripe returned an invalid session response.');
    }
    $status = 0;
    foreach ($http_response_header ?? [] as $header) {
        if (preg_match('#^HTTP/\S+\s+([0-9]{3})#', $header, $matches)) {
            $status = (int) $matches[1];
            break;
        }
    }
    if ($status < 200 || $status >= 300) {
        $message = $decoded['error']['message'] ?? 'Stripe rejected the session request.';
        throw new RuntimeException(is_string($message) ? $message : 'Stripe rejected the session request.');
    }
    return $decoded;
}

function verifyStripeSignature(string $body, string $header, string $secret): bool
{
    $timestamp = null;
    $signatures = [];
    foreach (explode(',', $header) as $part) {
        [$key, $value] = array_pad(explode('=', trim($part), 2), 2, '');
        if ($key === 't' && ctype_digit($value)) {
            $timestamp = (int) $value;
        } elseif ($key === 'v1' && preg_match('/^[a-f0-9]{64}$/i', $value)) {
            $signatures[] = $value;
        }
    }
    if ($timestamp === null || abs(time() - $timestamp) > 300 || $signatures === []) {
        return false;
    }

    $expected = hash_hmac('sha256', $timestamp . '.' . $body, $secret);
    foreach ($signatures as $signature) {
        if (hash_equals($expected, strtolower($signature))) {
            return true;
        }
    }
    return false;
}

loadEnvironment();
