<?php
declare(strict_types=1);

require_once __DIR__ . '/analytics-bootstrap.php';

header('Content-Type: application/json; charset=utf-8');

$expectedToken = 'ba7e42d060466c149e331452cc58339e64b62a3b61ed953e90f3ec274495f59d';
$providedToken = (string) ($_SERVER['HTTP_X_JG_ADMIN_TOKEN'] ?? '');

if (!hash_equals($expectedToken, $providedToken)) {
    analyticsJsonResponse(['error' => 'Unauthorized'], 401);
}

function affiliateHydrate(array $affiliate): array
{
    $affiliate['code'] = strtoupper(substr((string) ($affiliate['code'] ?? ''), 0, 16));
    $affiliate['name'] = trim(substr((string) ($affiliate['name'] ?? ''), 0, 120));
    $affiliate['slug'] = analyticsSlugify((string) ($affiliate['slug'] ?? $affiliate['name']));
    $affiliate['platforms'] = analyticsNormalizePlatforms((array) ($affiliate['platforms'] ?? []));
    $affiliate['urls'] = analyticsWriteAffiliateLandingPages($affiliate);
    $affiliate['updated_at'] = gmdate(DATE_ATOM);
    if (empty($affiliate['created_at'])) {
        $affiliate['created_at'] = $affiliate['updated_at'];
    }
    return $affiliate;
}

function affiliateParseJsonBody(): array
{
    $payload = json_decode(file_get_contents('php://input') ?: '', true);
    if (!is_array($payload)) {
        analyticsJsonResponse(['error' => 'Invalid JSON payload.'], 400);
    }
    return $payload;
}

function affiliateListResponse(array $affiliates): void
{
    usort($affiliates, static function (array $a, array $b): int {
        return strcmp((string) ($a['name'] ?? ''), (string) ($b['name'] ?? ''));
    });

    analyticsJsonResponse([
        'platforms' => analyticsGetSupportedPlatforms(),
        'affiliates' => array_values($affiliates),
    ]);
}

$affiliates = analyticsLoadAffiliates();
$method = strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'));

if ($method === 'GET') {
    affiliateListResponse($affiliates);
}

if ($method === 'POST') {
    $payload = affiliateParseJsonBody();
    $name = trim((string) ($payload['name'] ?? ''));
    $platforms = analyticsNormalizePlatforms((array) ($payload['platforms'] ?? []));

    if ($name === '') {
        analyticsJsonResponse(['error' => 'Affiliate name is required.'], 422);
    }

    if ($platforms === []) {
        analyticsJsonResponse(['error' => 'Select at least one platform.'], 422);
    }

    $affiliate = affiliateHydrate([
        'code' => analyticsGenerateAffiliateCode($affiliates),
        'name' => $name,
        'slug' => analyticsSlugify($name),
        'platforms' => $platforms,
        'created_at' => gmdate(DATE_ATOM),
    ]);

    $affiliates[] = $affiliate;
    analyticsSaveAffiliates($affiliates);
    analyticsJsonResponse(['affiliate' => $affiliate], 201);
}

if ($method === 'PATCH' || $method === 'PUT') {
    $payload = affiliateParseJsonBody();
    $code = strtoupper(trim((string) ($payload['code'] ?? '')));

    if ($code === '') {
        analyticsJsonResponse(['error' => 'Affiliate code is required.'], 422);
    }

    foreach ($affiliates as $index => $affiliate) {
        if (strtoupper((string) ($affiliate['code'] ?? '')) !== $code) {
            continue;
        }

        $nextPlatforms = analyticsNormalizePlatforms((array) ($payload['platforms'] ?? $affiliate['platforms'] ?? []));
        if ($nextPlatforms === []) {
            analyticsJsonResponse(['error' => 'Select at least one platform.'], 422);
        }

        $nextName = trim((string) ($payload['name'] ?? $affiliate['name'] ?? ''));
        if ($nextName === '') {
            analyticsJsonResponse(['error' => 'Affiliate name is required.'], 422);
        }

        analyticsDeleteAffiliateLandingPages($affiliate);
        $affiliates[$index] = affiliateHydrate(array_merge($affiliate, [
            'name' => $nextName,
            'platforms' => $nextPlatforms,
        ]));
        analyticsSaveAffiliates($affiliates);
        analyticsJsonResponse(['affiliate' => $affiliates[$index]]);
    }

    analyticsJsonResponse(['error' => 'Affiliate not found.'], 404);
}

if ($method === 'DELETE') {
    $payload = affiliateParseJsonBody();
    $code = strtoupper(trim((string) ($payload['code'] ?? '')));

    if ($code === '') {
        analyticsJsonResponse(['error' => 'Affiliate code is required.'], 422);
    }

    foreach ($affiliates as $index => $affiliate) {
        if (strtoupper((string) ($affiliate['code'] ?? '')) !== $code) {
            continue;
        }

        analyticsDeleteAffiliateLandingPages($affiliate);
        array_splice($affiliates, $index, 1);
        analyticsSaveAffiliates($affiliates);
        analyticsJsonResponse(['deleted' => true]);
    }

    analyticsJsonResponse(['error' => 'Affiliate not found.'], 404);
}

analyticsJsonResponse(['error' => 'Method not allowed.'], 405);
