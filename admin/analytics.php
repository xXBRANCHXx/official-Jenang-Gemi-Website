<?php
declare(strict_types=1);

require __DIR__ . '/auth.php';
jg_admin_require_auth_json();

header('Content-Type: application/json; charset=utf-8');

$storageFile = dirname(__DIR__) . '/analytics-data/landing-events.json';

if (!file_exists($storageFile)) {
    echo json_encode([
        'summary' => [
            'total_views' => 0,
            'order_now_clicks' => 0,
            'checkout_clicks' => 0,
            'avg_time_spent_seconds' => 0,
        ],
        'by_url' => [],
        'by_source' => [],
        'recent_events' => [],
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    exit;
}

$raw = file_get_contents($storageFile);
$events = $raw ? json_decode($raw, true) : [];
if (!is_array($events)) {
    $events = [];
}

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

$byUrl = array_values($byUrl);
$bySource = array_values($bySource);

usort($byUrl, static function (array $a, array $b): int {
    return ($b['views'] <=> $a['views']) ?: strcmp((string) $a['page_path'], (string) $b['page_path']);
});
usort($bySource, static function (array $a, array $b): int {
    return ($b['views'] <=> $a['views']) ?: strcmp((string) $a['source'], (string) $b['source']);
});
usort($events, static function (array $a, array $b): int {
    return strcmp((string) ($b['occurred_at'] ?? ''), (string) ($a['occurred_at'] ?? ''));
});

echo json_encode([
    'summary' => $summary,
    'by_url' => $byUrl,
    'by_source' => $bySource,
    'recent_events' => array_slice($events, 0, 25),
], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
