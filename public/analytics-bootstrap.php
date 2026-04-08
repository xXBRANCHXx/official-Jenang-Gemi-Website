<?php
declare(strict_types=1);

function analyticsJsonResponse(array $payload, int $status = 200): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    exit;
}

function analyticsResolveStorageFile(): string
{
    $overrideFile = trim((string) getenv('JG_ANALYTICS_STORAGE_FILE'));
    if ($overrideFile !== '') {
        return $overrideFile;
    }

    $defaultFile = dirname(__DIR__) . '/analytics-storage/landing-events.json';
    $legacyFile = __DIR__ . '/analytics-data/landing-events.json';

    if (!file_exists($defaultFile) && file_exists($legacyFile)) {
        $defaultDir = dirname($defaultFile);
        if (!is_dir($defaultDir)) {
            mkdir($defaultDir, 0775, true);
        }
        @copy($legacyFile, $defaultFile);
    }

    return $defaultFile;
}

function analyticsEnsureStorage(string $storageFile): void
{
    $storageDir = dirname($storageFile);
    if (!is_dir($storageDir)) {
        mkdir($storageDir, 0775, true);
    }

    if (!file_exists($storageFile)) {
        file_put_contents($storageFile, json_encode([], JSON_PRETTY_PRINT));
    }
}

function analyticsAppendEvent(string $storageFile, array $event): void
{
    $handle = fopen($storageFile, 'c+');
    if ($handle === false) {
        analyticsJsonResponse(['error' => 'Unable to open analytics storage.'], 500);
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

function analyticsResolveTimezone(?string $requestedTimezone = null): DateTimeZone
{
    $timezoneName = trim((string) ($requestedTimezone ?? ''));
    if ($timezoneName === '') {
        $timezoneName = trim((string) getenv('JG_ANALYTICS_TIMEZONE'));
    }
    if ($timezoneName === '') {
        $timezoneName = 'Asia/Jakarta';
    }

    if (!in_array($timezoneName, timezone_identifiers_list(), true)) {
        $timezoneName = 'Asia/Jakarta';
    }

    return new DateTimeZone($timezoneName);
}

function analyticsResolveWebhookSecret(): string
{
    return trim((string) getenv('JG_CONVERSION_WEBHOOK_SECRET'));
}
