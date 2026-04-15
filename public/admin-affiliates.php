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
    $affiliate['products'] = analyticsNormalizeProducts((array) ($affiliate['products'] ?? []));
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
    foreach ($affiliates as &$affiliate) {
        $affiliate['urls'] = analyticsWriteAffiliateLandingPages($affiliate);
    }
    unset($affiliate);

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
    $products = analyticsNormalizeProducts((array) ($payload['products'] ?? []));

    if ($name === '') {
        analyticsJsonResponse(['error' => 'Affiliate name is required.'], 422);
    }

    if ($platforms === []) {
        analyticsJsonResponse(['error' => 'Select at least one platform.'], 422);
    }

    if ($products === []) {
        analyticsJsonResponse(['error' => 'Select at least one product.'], 422);
    }

    $affiliate = affiliateHydrate([
        'code' => analyticsGenerateAffiliateCode($affiliates),
        'name' => $name,
        'slug' => analyticsSlugify($name),
        'platforms' => $platforms,
        'products' => $products,
        'created_at' => gmdate(DATE_ATOM),
    ]);

    $affiliate = analyticsCreateAffiliateRecord($affiliate);
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
        $nextProducts = analyticsNormalizeProducts((array) ($payload['products'] ?? $affiliate['products'] ?? []));
        if ($nextPlatforms === []) {
            analyticsJsonResponse(['error' => 'Select at least one platform.'], 422);
        }
        if ($nextProducts === []) {
            analyticsJsonResponse(['error' => 'Select at least one product.'], 422);
        }

        $nextName = trim((string) ($payload['name'] ?? $affiliate['name'] ?? ''));
        if ($nextName === '') {
            analyticsJsonResponse(['error' => 'Affiliate name is required.'], 422);
        }

        analyticsDeleteAffiliateLandingPages($affiliate);
        $updatedAffiliate = affiliateHydrate(array_merge($affiliate, [
            'name' => $nextName,
            'platforms' => $nextPlatforms,
            'products' => $nextProducts,
        ]));
        $updatedAffiliate = analyticsUpdateAffiliateRecord($code, $updatedAffiliate);
        analyticsJsonResponse(['affiliate' => $updatedAffiliate]);
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
        analyticsDeleteAffiliateRecord($code);
        analyticsJsonResponse(['deleted' => true]);
    }

    analyticsJsonResponse(['error' => 'Affiliate not found.'], 404);
}

analyticsJsonResponse(['error' => 'Method not allowed.'], 405);
