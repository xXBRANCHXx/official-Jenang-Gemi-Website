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
