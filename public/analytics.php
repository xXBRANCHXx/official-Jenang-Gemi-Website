<?php
declare(strict_types=1);

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
} else {
    header('Access-Control-Allow-Origin: https://admin.jenanggemi.com');
}
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$storageDir = __DIR__ . '/analytics-data';
$storageFile = $storageDir . '/landing-events.json';

if (!is_dir($storageDir)) {
    mkdir($storageDir, 0775, true);
}

if (!file_exists($storageFile)) {
    file_put_contents($storageFile, json_encode([], JSON_PRETTY_PRINT));
}

function jsonResponse(array $payload, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    exit;
}

function readEvents(string $storageFile): array
{
    $raw = file_get_contents($storageFile);
    if ($raw === false || trim($raw) === '') {
        return [];
    }

    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

function writeEvent(string $storageFile, array $event): void
{
    $handle = fopen($storageFile, 'c+');
    if ($handle === false) {
        jsonResponse(['error' => 'Unable to open analytics storage.'], 500);
    }

    flock($handle, LOCK_EX);
    $contents = stream_get_contents($handle);
    $events = $contents ? json_decode($contents, true) : [];
    if (!is_array($events)) {
        $events = [];
    }

    $events[] = $event;

    rewind($handle);
    ftruncate($handle, 0);
    fwrite($handle, json_encode($events, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
    fflush($handle);
    flock($handle, LOCK_UN);
    fclose($handle);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $payload = json_decode(file_get_contents('php://input') ?: '', true);
    if (!is_array($payload)) {
        jsonResponse(['error' => 'Invalid JSON payload.'], 400);
    }

    $event = [
        'event_type' => substr((string) ($payload['event_type'] ?? 'unknown'), 0, 80),
        'session_id' => substr((string) ($payload['session_id'] ?? ''), 0, 120),
        'source' => substr((string) ($payload['source'] ?? 'unknown'), 0, 50),
        'page_path' => substr((string) ($payload['page_path'] ?? ''), 0, 255),
        'page_url' => substr((string) ($payload['page_url'] ?? ''), 0, 500),
        'page_title' => substr((string) ($payload['page_title'] ?? ''), 0, 255),
        'referrer' => substr((string) ($payload['referrer'] ?? ''), 0, 500),
        'cta_location' => substr((string) ($payload['cta_location'] ?? ''), 0, 120),
        'package_label' => substr((string) ($payload['package_label'] ?? ''), 0, 120),
        'package_price' => substr((string) ($payload['package_price'] ?? ''), 0, 40),
        'elapsed_ms' => max(0, (int) ($payload['elapsed_ms'] ?? 0)),
        'occurred_at' => substr((string) ($payload['occurred_at'] ?? gmdate(DATE_ATOM)), 0, 80),
    ];

    writeEvent($storageFile, $event);
    jsonResponse(['ok' => true], 201);
}

$events = readEvents($storageFile);
$byUrl = [];
$bySource = [];
$sessionTimeByUrl = [];
$sessionTimeBySource = [];
$summary = [
    'total_views' => 0,
    'order_now_clicks' => 0,
    'checkout_clicks' => 0,
    'avg_time_spent_seconds' => 0,
];

foreach ($events as $event) {
    $pagePath = (string) ($event['page_path'] ?? '/');
    $source = (string) ($event['source'] ?? 'unknown');
    $sessionId = (string) ($event['session_id'] ?? 'no-session');
    $eventType = (string) ($event['event_type'] ?? 'unknown');
    $elapsedMs = (int) ($event['elapsed_ms'] ?? 0);

    $urlKey = $pagePath . '|' . $source;

    if (!isset($byUrl[$urlKey])) {
        $byUrl[$urlKey] = [
            'page_path' => $pagePath,
            'source' => $source,
            'views' => 0,
            'order_now_clicks' => 0,
            'checkout_clicks' => 0,
            'avg_time_spent_seconds' => 0,
        ];
    }

    if (!isset($bySource[$source])) {
        $bySource[$source] = [
            'source' => $source,
            'views' => 0,
            'order_now_clicks' => 0,
            'checkout_clicks' => 0,
            'avg_time_spent_seconds' => 0,
        ];
    }

    if ($eventType === 'page_view') {
        $byUrl[$urlKey]['views']++;
        $bySource[$source]['views']++;
        $summary['total_views']++;
    }

    if ($eventType === 'order_now_click') {
        $byUrl[$urlKey]['order_now_clicks']++;
        $bySource[$source]['order_now_clicks']++;
        $summary['order_now_clicks']++;
    }

    if ($eventType === 'checkout_click') {
        $byUrl[$urlKey]['checkout_clicks']++;
        $bySource[$source]['checkout_clicks']++;
        $summary['checkout_clicks']++;
    }

    if ($eventType === 'time_spent') {
        $sessionTimeByUrl[$urlKey][$sessionId] = max($sessionTimeByUrl[$urlKey][$sessionId] ?? 0, $elapsedMs);
        $sessionTimeBySource[$source][$sessionId] = max($sessionTimeBySource[$source][$sessionId] ?? 0, $elapsedMs);
    }
}

$allSessionTimes = [];

foreach ($byUrl as $key => &$item) {
    $sessionTimes = array_values($sessionTimeByUrl[$key] ?? []);
    foreach ($sessionTimes as $time) {
        $allSessionTimes[] = $time;
    }
    $item['avg_time_spent_seconds'] = count($sessionTimes) ? round(array_sum($sessionTimes) / count($sessionTimes) / 1000, 1) : 0;
}
unset($item);

foreach ($bySource as $source => &$item) {
    $sessionTimes = array_values($sessionTimeBySource[$source] ?? []);
    $item['avg_time_spent_seconds'] = count($sessionTimes) ? round(array_sum($sessionTimes) / count($sessionTimes) / 1000, 1) : 0;
}
unset($item);

$summary['avg_time_spent_seconds'] = count($allSessionTimes) ? round(array_sum($allSessionTimes) / count($allSessionTimes) / 1000, 1) : 0;

usort($byUrl, static function (array $a, array $b): int {
    return ($b['views'] <=> $a['views']) ?: strcmp((string) $a['page_path'], (string) $b['page_path']);
});

usort($bySource, static function (array $a, array $b): int {
    return ($b['views'] <=> $a['views']) ?: strcmp((string) $a['source'], (string) $b['source']);
});

usort($events, static function (array $a, array $b): int {
    return strcmp((string) ($b['occurred_at'] ?? ''), (string) ($a['occurred_at'] ?? ''));
});

jsonResponse([
    'summary' => $summary,
    'by_url' => $byUrl,
    'by_source' => $bySource,
    'recent_events' => array_slice($events, 0, 25),
]);
