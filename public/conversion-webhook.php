<?php
declare(strict_types=1);

require_once __DIR__ . '/analytics-bootstrap.php';

header('Content-Type: application/json; charset=utf-8');
$allowedOrigins = [
    'https://admin.jenanggemi.com',
    'https://jenanggemi.com',
    'http://localhost:5555',
    'http://127.0.0.1:5555',
];
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '' && in_array($origin, $allowedOrigins, true)) {
    header('Access-Control-Allow-Origin: ' . $origin);
}
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-JG-Webhook-Token');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    analyticsJsonResponse(['error' => 'Method not allowed.'], 405);
}

$expectedSecret = analyticsResolveWebhookSecret();
if ($expectedSecret === '') {
    analyticsJsonResponse(['error' => 'Webhook secret is not configured.'], 503);
}

$providedSecret = trim((string) ($_SERVER['HTTP_X_JG_WEBHOOK_TOKEN'] ?? ''));
if ($providedSecret === '' || !hash_equals($expectedSecret, $providedSecret)) {
    analyticsJsonResponse(['error' => 'Unauthorized webhook request.'], 401);
}

$payload = json_decode(file_get_contents('php://input') ?: '', true);
if (!is_array($payload)) {
    analyticsJsonResponse(['error' => 'Invalid JSON payload.'], 400);
}

$storageFile = analyticsResolveStorageFile();
analyticsEnsureStorage($storageFile);

$event = [
    'event_type' => 'conversion_confirmed',
    'session_id' => substr((string) ($payload['session_id'] ?? ''), 0, 120),
    'source' => substr((string) ($payload['source'] ?? 'unknown'), 0, 50),
    'page_path' => substr((string) ($payload['page_path'] ?? ''), 0, 255),
    'page_url' => substr((string) ($payload['page_url'] ?? ''), 0, 500),
    'page_title' => substr((string) ($payload['page_title'] ?? ''), 0, 255),
    'referrer' => '',
    'cta_location' => substr((string) ($payload['cta_location'] ?? 'webhook'), 0, 120),
    'product_code' => substr((string) ($payload['product_code'] ?? ''), 0, 20),
    'product_label' => substr((string) ($payload['product_label'] ?? ''), 0, 120),
    'flavor_label' => substr((string) ($payload['flavor_label'] ?? ''), 0, 120),
    'flavor_code' => substr((string) ($payload['flavor_code'] ?? ''), 0, 20),
    'package_label' => substr((string) ($payload['package_label'] ?? ''), 0, 120),
    'package_size' => substr((string) ($payload['package_size'] ?? ''), 0, 20),
    'package_price' => substr((string) ($payload['package_price'] ?? ''), 0, 40),
    'order_code' => substr((string) ($payload['order_code'] ?? ''), 0, 40),
    'conversion_status' => substr((string) ($payload['conversion_status'] ?? 'confirmed'), 0, 40),
    'external_id' => substr((string) ($payload['external_id'] ?? ''), 0, 120),
    'notes' => substr((string) ($payload['notes'] ?? ''), 0, 255),
    'elapsed_ms' => 0,
    'occurred_at' => substr((string) ($payload['occurred_at'] ?? gmdate(DATE_ATOM)), 0, 80),
];

analyticsAppendEvent($storageFile, $event);

analyticsJsonResponse([
    'ok' => true,
    'event_type' => $event['event_type'],
    'order_code' => $event['order_code'],
], 201);
