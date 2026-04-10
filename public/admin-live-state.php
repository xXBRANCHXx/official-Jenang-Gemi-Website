<?php
declare(strict_types=1);

require_once __DIR__ . '/analytics-bootstrap.php';

header('Content-Type: application/json; charset=utf-8');

$expectedToken = 'ba7e42d060466c149e331452cc58339e64b62a3b61ed953e90f3ec274495f59d';
$providedToken = (string) ($_SERVER['HTTP_X_JG_ADMIN_TOKEN'] ?? '');

if (!hash_equals($expectedToken, $providedToken)) {
    analyticsJsonResponse(['error' => 'Unauthorized'], 401);
}

analyticsJsonResponse([
    'live_state' => analyticsReadLiveState(),
]);
