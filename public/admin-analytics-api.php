<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

$expectedToken = 'ba7e42d060466c149e331452cc58339e64b62a3b61ed953e90f3ec274495f59d';
$providedToken = (string) ($_SERVER['HTTP_X_JG_ADMIN_TOKEN'] ?? '');
$displayTimezone = new DateTimeZone('Asia/Jakarta');

if (!hash_equals($expectedToken, $providedToken)) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized'], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    exit;
}

$storageFile = __DIR__ . '/analytics-data/landing-events.json';
$timeframe = (string) ($_GET['timeframe'] ?? '7d');
$allowedTimeframes = ['24h', '7d', '30d', '90d', 'all'];
if (!in_array($timeframe, $allowedTimeframes, true)) {
    $timeframe = '7d';
}

$now = new DateTimeImmutable('now', $displayTimezone);
$rangeStart = match ($timeframe) {
    '24h' => $now->modify('-24 hours'),
    '7d' => $now->modify('-7 days'),
    '30d' => $now->modify('-30 days'),
    '90d' => $now->modify('-90 days'),
    default => null,
};

$bucketInterval = match ($timeframe) {
    '24h' => 'PT1H',
    '7d' => 'P1D',
    '30d' => 'P1D',
    '90d' => 'P7D',
    default => 'P30D',
};

$bucketLabelFormat = match ($timeframe) {
    '24h' => 'H:i',
    '7d' => 'd M',
    '30d' => 'd M',
    '90d' => 'd M',
    default => 'M Y',
};

if (!file_exists($storageFile)) {
    echo json_encode([
        'summary' => [
            'total_views' => 0,
            'order_now_clicks' => 0,
            'checkout_clicks' => 0,
            'avg_time_spent_seconds' => 0,
        ],
        'meta' => [
            'timeframe' => $timeframe,
            'generated_at' => $now->format(DATE_ATOM),
        ],
        'by_url' => [],
        'by_source' => [],
        'recent_events' => [],
        'timeseries' => [],
        'hour_of_day' => [],
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    exit;
}

$raw = file_get_contents($storageFile);
$events = $raw ? json_decode($raw, true) : [];
if (!is_array($events)) {
    $events = [];
}

$filteredEvents = [];
foreach ($events as $event) {
    $occurredAtRaw = (string) ($event['occurred_at'] ?? '');
    try {
        $occurredAt = new DateTimeImmutable($occurredAtRaw ?: 'now', new DateTimeZone('UTC'));
        $occurredAt = $occurredAt->setTimezone($displayTimezone);
    } catch (Throwable) {
        continue;
    }

    if ($rangeStart && $occurredAt < $rangeStart) {
        continue;
    }

    $event['_occurred_at_dt'] = $occurredAt;
    $filteredEvents[] = $event;
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

$timeBuckets = [];
$bucketStarts = [];
$hourOfDay = array_fill(0, 24, [
    'hour' => 0,
    'views' => 0,
    'order_now_clicks' => 0,
    'checkout_clicks' => 0,
]);
for ($hour = 0; $hour < 24; $hour++) {
    $hourOfDay[$hour]['hour'] = $hour;
}

$bucketStartCursor = $rangeStart;
if ($bucketStartCursor === null) {
    if (count($filteredEvents) > 0) {
        usort($filteredEvents, static function (array $a, array $b): int {
            return $a['_occurred_at_dt'] <=> $b['_occurred_at_dt'];
        });
        $bucketStartCursor = $filteredEvents[0]['_occurred_at_dt']->modify('first day of this month')->setTime(0, 0);
    } else {
        $bucketStartCursor = $now->modify('first day of this month')->setTime(0, 0);
    }
}

$intervalSpec = new DateInterval($bucketInterval);
$bucketEndCursor = $bucketStartCursor;
while ($bucketEndCursor <= $now) {
    $bucketKey = $bucketEndCursor->format(DATE_ATOM);
    $timeBuckets[$bucketKey] = [
        'bucket_start' => $bucketEndCursor->format(DATE_ATOM),
        'label' => $bucketEndCursor->format($bucketLabelFormat),
        'views' => 0,
        'order_now_clicks' => 0,
        'checkout_clicks' => 0,
    ];
    $bucketStarts[] = $bucketEndCursor;
    $bucketEndCursor = $bucketEndCursor->add($intervalSpec);
}

$findBucketKey = static function (DateTimeImmutable $dateTime) use ($bucketStarts, $intervalSpec): string {
    $selected = $bucketStarts[0];
    foreach ($bucketStarts as $start) {
        $end = $start->add($intervalSpec);
        if ($dateTime >= $start && $dateTime < $end) {
            $selected = $start;
            break;
        }
        if ($dateTime >= $start) {
            $selected = $start;
        }
    }
    return $selected->format(DATE_ATOM);
};

foreach ($filteredEvents as $event) {
    /** @var DateTimeImmutable $occurredAt */
    $occurredAt = $event['_occurred_at_dt'];
    $pagePath = (string) ($event['page_path'] ?? '/');
    $source = (string) ($event['source'] ?? 'unknown');
    $sessionId = (string) ($event['session_id'] ?? 'no-session');
    $eventType = (string) ($event['event_type'] ?? 'unknown');
    $elapsedMs = (int) ($event['elapsed_ms'] ?? 0);
    $urlKey = $pagePath . '|' . $source;
    $bucketKey = $findBucketKey($occurredAt);
    $hourIndex = (int) $occurredAt->format('G');

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
        $timeBuckets[$bucketKey]['views']++;
        $hourOfDay[$hourIndex]['views']++;
    }

    if ($eventType === 'order_now_click') {
        $byUrl[$urlKey]['order_now_clicks']++;
        $bySource[$source]['order_now_clicks']++;
        $summary['order_now_clicks']++;
        $timeBuckets[$bucketKey]['order_now_clicks']++;
        $hourOfDay[$hourIndex]['order_now_clicks']++;
    }

    if ($eventType === 'checkout_click') {
        $byUrl[$urlKey]['checkout_clicks']++;
        $bySource[$source]['checkout_clicks']++;
        $summary['checkout_clicks']++;
        $timeBuckets[$bucketKey]['checkout_clicks']++;
        $hourOfDay[$hourIndex]['checkout_clicks']++;
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
$timeseries = array_values($timeBuckets);

usort($byUrl, static function (array $a, array $b): int {
    return ($b['views'] <=> $a['views']) ?: strcmp((string) $a['page_path'], (string) $b['page_path']);
});
usort($bySource, static function (array $a, array $b): int {
    return ($b['views'] <=> $a['views']) ?: strcmp((string) $a['source'], (string) $b['source']);
});
usort($filteredEvents, static function (array $a, array $b): int {
    return $b['_occurred_at_dt'] <=> $a['_occurred_at_dt'];
});

$recentEvents = array_map(static function (array $event): array {
    /** @var DateTimeImmutable $occurredAt */
    $occurredAt = $event['_occurred_at_dt'];
    $event['occurred_at_iso'] = $occurredAt->format(DATE_ATOM);
    $event['occurred_at'] = $occurredAt->format('d M Y H:i') . ' WIB';
    unset($event['_occurred_at_dt']);
    return $event;
}, array_slice($filteredEvents, 0, 25));

echo json_encode([
    'meta' => [
        'timeframe' => $timeframe,
        'generated_at' => $now->format(DATE_ATOM),
        'timezone' => 'Asia/Jakarta',
        'range_start' => $rangeStart?->format(DATE_ATOM),
    ],
    'summary' => $summary,
    'by_url' => $byUrl,
    'by_source' => $bySource,
    'recent_events' => $recentEvents,
    'timeseries' => $timeseries,
    'hour_of_day' => $hourOfDay,
], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
