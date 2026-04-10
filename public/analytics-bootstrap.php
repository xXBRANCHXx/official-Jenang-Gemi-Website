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

function analyticsResolveStorageDir(): string
{
    return dirname(analyticsResolveStorageFile());
}

function analyticsResolveAffiliateStorageFile(): string
{
    return analyticsResolveStorageDir() . '/affiliates.json';
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

function analyticsReadJsonFile(string $storageFile): array
{
    if (!file_exists($storageFile)) {
        return [];
    }

    $raw = file_get_contents($storageFile);
    if ($raw === false || trim($raw) === '') {
        return [];
    }

    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

function analyticsWriteJsonFile(string $storageFile, array $payload): void
{
    analyticsEnsureStorage($storageFile);

    $handle = fopen($storageFile, 'c+');
    if ($handle === false) {
        analyticsJsonResponse(['error' => 'Unable to open analytics storage.'], 500);
    }

    flock($handle, LOCK_EX);
    rewind($handle);
    ftruncate($handle, 0);
    fwrite($handle, json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
    fflush($handle);
    flock($handle, LOCK_UN);
    fclose($handle);
}

function analyticsAppendEvent(string $storageFile, array $event): void
{
    analyticsEnsureStorage($storageFile);

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

function analyticsGetSupportedPlatforms(): array
{
    return ['youtube', 'facebook', 'instagram', 'tiktok'];
}

function analyticsNormalizePlatforms(array $platforms): array
{
    $allowed = analyticsGetSupportedPlatforms();
    $normalized = [];

    foreach ($platforms as $platform) {
        $candidate = strtolower(trim((string) $platform));
        if ($candidate !== '' && in_array($candidate, $allowed, true)) {
            $normalized[] = $candidate;
        }
    }

    $normalized = array_values(array_unique($normalized));
    sort($normalized);

    return $normalized;
}

function analyticsSlugify(string $value): string
{
    $slug = strtolower(trim($value));
    $slug = preg_replace('/[^a-z0-9]+/', '-', $slug) ?? '';
    $slug = trim($slug, '-');
    return $slug !== '' ? $slug : 'affiliate';
}

function analyticsGenerateAffiliateCode(array $existingAffiliates): string
{
    $existingCodes = array_map(
        static fn(array $affiliate): string => strtoupper((string) ($affiliate['code'] ?? '')),
        $existingAffiliates
    );

    do {
        $code = 'AFF' . strtoupper(bin2hex(random_bytes(3)));
    } while (in_array($code, $existingCodes, true));

    return $code;
}

function analyticsResolveSiteRoot(): string
{
    if (file_exists(__DIR__ . '/bubur-youtube.html')) {
        return __DIR__;
    }

    return dirname(__DIR__);
}

function analyticsResolveBaseLandingFile(string $platform): string
{
    return analyticsResolveSiteRoot() . '/bubur-' . $platform . '.html';
}

function analyticsBuildAffiliateLandingFilename(string $platform, string $affiliateCode): string
{
    return sprintf('bubur-%s-aff-%s.html', $platform, strtolower($affiliateCode));
}

function analyticsResolveAffiliateLandingFile(string $platform, string $affiliateCode): string
{
    return analyticsResolveSiteRoot() . '/' . analyticsBuildAffiliateLandingFilename($platform, $affiliateCode);
}

function analyticsBuildAffiliateLandingUrl(string $platform, string $affiliateCode): string
{
    return '/' . analyticsBuildAffiliateLandingFilename($platform, $affiliateCode);
}

function analyticsRenderAffiliateLandingPage(string $platform, array $affiliate): string
{
    $templatePath = analyticsResolveBaseLandingFile($platform);
    if (!file_exists($templatePath)) {
        analyticsJsonResponse([
            'error' => 'Missing base landing page template.',
            'platform' => $platform,
        ], 500);
    }

    $html = file_get_contents($templatePath);
    if ($html === false) {
        analyticsJsonResponse([
            'error' => 'Unable to read base landing page template.',
            'platform' => $platform,
        ], 500);
    }

    $rootMarker = sprintf(
        '<div class="landing-shell" data-landing-page data-source="%s" data-analytics-endpoint="/analytics.php">',
        $platform
    );
    $replacement = sprintf(
        '<div class="landing-shell" data-landing-page data-source="%s" data-analytics-endpoint="/analytics.php" data-traffic-kind="affiliate" data-affiliate-code="%s" data-affiliate-name="%s">',
        htmlspecialchars($platform, ENT_QUOTES),
        htmlspecialchars((string) ($affiliate['code'] ?? ''), ENT_QUOTES),
        htmlspecialchars((string) ($affiliate['name'] ?? ''), ENT_QUOTES)
    );

    return str_replace($rootMarker, $replacement, $html);
}

function analyticsWriteAffiliateLandingPages(array $affiliate): array
{
    $platforms = analyticsNormalizePlatforms((array) ($affiliate['platforms'] ?? []));
    $urls = [];

    foreach ($platforms as $platform) {
        $targetFile = analyticsResolveAffiliateLandingFile($platform, (string) $affiliate['code']);
        file_put_contents($targetFile, analyticsRenderAffiliateLandingPage($platform, $affiliate));
        $urls[$platform] = analyticsBuildAffiliateLandingUrl($platform, (string) $affiliate['code']);
    }

    ksort($urls);
    return $urls;
}

function analyticsDeleteAffiliateLandingPages(array $affiliate): void
{
    foreach (analyticsGetSupportedPlatforms() as $platform) {
        $targetFile = analyticsResolveAffiliateLandingFile($platform, (string) ($affiliate['code'] ?? ''));
        if (file_exists($targetFile)) {
            @unlink($targetFile);
        }
    }
}

function analyticsLoadAffiliates(): array
{
    $storageFile = analyticsResolveAffiliateStorageFile();
    analyticsEnsureStorage($storageFile);
    $affiliates = analyticsReadJsonFile($storageFile);
    return array_values(array_filter($affiliates, 'is_array'));
}

function analyticsSaveAffiliates(array $affiliates): void
{
    $storageFile = analyticsResolveAffiliateStorageFile();
    analyticsEnsureStorage($storageFile);
    analyticsWriteJsonFile($storageFile, array_values($affiliates));
}
