<?php
declare(strict_types=1);

function analyticsLoadLocalConfig(): array
{
    static $config = null;

    if (is_array($config)) {
        return $config;
    }

    $config = [];
    $configFile = __DIR__ . '/whatsapp-config.local.php';
    if (file_exists($configFile)) {
        $loaded = require $configFile;
        if (is_array($loaded)) {
            $config = $loaded;
        }
    }

    return $config;
}

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
    $config = analyticsLoadLocalConfig();
    if (!empty($config['conversion_webhook_secret']) && is_string($config['conversion_webhook_secret'])) {
        return trim($config['conversion_webhook_secret']);
    }
    return trim((string) getenv('JG_CONVERSION_WEBHOOK_SECRET'));
}

function analyticsResolveWhatsappVerifyToken(): string
{
    $config = analyticsLoadLocalConfig();
    if (!empty($config['whatsapp_verify_token']) && is_string($config['whatsapp_verify_token'])) {
        return trim($config['whatsapp_verify_token']);
    }
    return trim((string) getenv('JG_WHATSAPP_VERIFY_TOKEN'));
}

function analyticsResolveWhatsappAppSecret(): string
{
    $config = analyticsLoadLocalConfig();
    if (!empty($config['whatsapp_app_secret']) && is_string($config['whatsapp_app_secret'])) {
        return trim($config['whatsapp_app_secret']);
    }
    return trim((string) getenv('JG_WHATSAPP_APP_SECRET'));
}

function analyticsExtractOrderCode(string $message): ?array
{
    if (!preg_match('/\b(FB|YT|TK|IG)(JGB|JGJ)(15|30|60)(OR|KL|VA|GU)\b/i', $message, $matches)) {
        return null;
    }

    $sourceMap = [
        'FB' => 'facebook',
        'YT' => 'youtube',
        'TK' => 'tiktok',
        'IG' => 'instagram',
    ];

    $productMap = [
        'JGB' => 'Jenang Gemi Bubur',
        'JGJ' => 'Jenang Gemi Jamu',
    ];

    $flavorMap = [
        'OR' => 'Original',
        'KL' => 'Klepon',
        'VA' => 'Vanilla',
        'GU' => 'Gula Aren',
    ];

    $sourceCode = strtoupper($matches[1]);
    $productCode = strtoupper($matches[2]);
    $packageSize = $matches[3];
    $flavorCode = strtoupper($matches[4]);

    return [
        'order_code' => strtoupper($matches[0]),
        'source_code' => $sourceCode,
        'source' => $sourceMap[$sourceCode] ?? 'unknown',
        'product_code' => $productCode,
        'product_label' => $productMap[$productCode] ?? $productCode,
        'package_size' => $packageSize,
        'package_label' => $packageSize . ' Sachet',
        'flavor_code' => $flavorCode,
        'flavor_label' => $flavorMap[$flavorCode] ?? $flavorCode,
    ];
}
