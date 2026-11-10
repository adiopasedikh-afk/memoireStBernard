<?php
declare(strict_types=1);

require dirname(__DIR__) . '/src/bootstrap.php';

try {
    $email = strtolower(trim((string) envValue('BOOTSTRAP_ADMIN_EMAIL', '')));
    $password = (string) envValue('BOOTSTRAP_ADMIN_PASSWORD', '');
    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 12) {
        fwrite(STDERR, "Set BOOTSTRAP_ADMIN_EMAIL and a BOOTSTRAP_ADMIN_PASSWORD of at least 12 characters.\n");
        exit(1);
    }

    $pdo = database();
    $adminCount = (int) $pdo->query("SELECT COUNT(*) FROM users WHERE role = 'admin'")->fetchColumn();
    if ($adminCount > 0) {
        fwrite(STDERR, "An administrator already exists; bootstrap is disabled.\n");
        exit(1);
    }

    $insert = $pdo->prepare("INSERT INTO users (email, password_hash, role) VALUES (:email, :password_hash, 'admin')");
    $insert->execute([
        'email' => $email,
        'password_hash' => password_hash($password, PASSWORD_DEFAULT),
    ]);
    fwrite(STDOUT, "Initial administrator created. Remove the bootstrap credentials from the environment.\n");
} catch (Throwable $error) {
    fwrite(STDERR, "Administrator bootstrap failed: " . $error->getMessage() . "\n");
    exit(1);
}
