<?php
declare(strict_types=1);

require dirname(__DIR__) . '/src/bootstrap.php';

$body = '{"type":"test.event"}';
$timestamp = time();
$secret = 'whsec_local_test';
$signature = hash_hmac('sha256', $timestamp . '.' . $body, $secret);

if (!verifyStripeSignature($body, "t=$timestamp,v1=$signature", $secret)) {
    fwrite(STDERR, "A valid Stripe signature was rejected.\n");
    exit(1);
}

if (verifyStripeSignature($body, "t=$timestamp,v1=" . str_repeat('0', 64), $secret)) {
    fwrite(STDERR, "An invalid Stripe signature was accepted.\n");
    exit(1);
}

$expiredTimestamp = $timestamp - 301;
$expiredSignature = hash_hmac('sha256', $expiredTimestamp . '.' . $body, $secret);
if (verifyStripeSignature($body, "t=$expiredTimestamp,v1=$expiredSignature", $secret)) {
    fwrite(STDERR, "An expired Stripe signature was accepted.\n");
    exit(1);
}

fwrite(STDOUT, "Stripe signature checks passed.\n");
