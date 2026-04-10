<?php
declare(strict_types=1);

require_once __DIR__ . '/analytics-bootstrap.php';

header('Content-Type: application/json; charset=utf-8');

$verifyToken = analyticsResolveWhatsappVerifyToken();
$appSecret = analyticsResolveWhatsappAppSecret();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $mode = (string) ($_GET['hub_mode'] ?? $_GET['hub.mode'] ?? '');
    $token = (string) ($_GET['hub_verify_token'] ?? $_GET['hub.verify_token'] ?? '');
    $challenge = (string) ($_GET['hub_challenge'] ?? $_GET['hub.challenge'] ?? '');

    if ($mode !== 'subscribe' || $verifyToken === '' || !hash_equals($verifyToken, $token)) {
        http_response_code(403);
        echo 'Forbidden';
        exit;
    }

    header('Content-Type: text/plain; charset=utf-8');
    echo $challenge;
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    analyticsJsonResponse(['error' => 'Method not allowed.'], 405);
}

$rawBody = file_get_contents('php://input') ?: '';

if ($appSecret !== '') {
    $signature = (string) ($_SERVER['HTTP_X_HUB_SIGNATURE_256'] ?? '');
    $expectedSignature = 'sha256=' . hash_hmac('sha256', $rawBody, $appSecret);
    if ($signature === '' || !hash_equals($expectedSignature, $signature)) {
        analyticsJsonResponse(['error' => 'Invalid signature.'], 401);
    }
}

$payload = json_decode($rawBody, true);
if (!is_array($payload)) {
    analyticsJsonResponse(['error' => 'Invalid JSON payload.'], 400);
}

$processedMessages = 0;
$matchedConversions = 0;
$matchedOrderCodes = [];

$extractBodies = static function (array $message): array {
    $candidates = [];

    if (isset($message['text']['body']) && is_string($message['text']['body'])) {
        $candidates[] = $message['text']['body'];
    }

    if (isset($message['button']['text']) && is_string($message['button']['text'])) {
        $candidates[] = $message['button']['text'];
    }

    if (isset($message['interactive']['button_reply']['title']) && is_string($message['interactive']['button_reply']['title'])) {
        $candidates[] = $message['interactive']['button_reply']['title'];
    }

    if (isset($message['interactive']['button_reply']['id']) && is_string($message['interactive']['button_reply']['id'])) {
        $candidates[] = $message['interactive']['button_reply']['id'];
    }

    if (isset($message['interactive']['list_reply']['title']) && is_string($message['interactive']['list_reply']['title'])) {
        $candidates[] = $message['interactive']['list_reply']['title'];
    }

    if (isset($message['interactive']['list_reply']['id']) && is_string($message['interactive']['list_reply']['id'])) {
        $candidates[] = $message['interactive']['list_reply']['id'];
    }

    return $candidates;
};

foreach (($payload['entry'] ?? []) as $entry) {
    foreach (($entry['changes'] ?? []) as $change) {
        if (($change['field'] ?? '') !== 'messages') {
            continue;
        }

        $value = is_array($change['value'] ?? null) ? $change['value'] : [];
        $contacts = is_array($value['contacts'] ?? null) ? $value['contacts'] : [];
        $contactName = (string) ($contacts[0]['profile']['name'] ?? '');
        $contactWaId = (string) ($contacts[0]['wa_id'] ?? '');
        $metadataPhone = (string) ($value['metadata']['display_phone_number'] ?? '');

        foreach (($value['messages'] ?? []) as $message) {
            if (!is_array($message)) {
                continue;
            }

            $processedMessages++;
            $foundCode = null;
            $matchedBody = '';

            foreach ($extractBodies($message) as $candidate) {
                $parsed = analyticsExtractOrderCode($candidate);
                if ($parsed !== null) {
                    $foundCode = $parsed;
                    $matchedBody = $candidate;
                    break;
                }
            }

            if ($foundCode === null) {
                continue;
            }

            $matchedConversions++;
            $matchedOrderCodes[] = $foundCode['order_code'];

            $occurredAt = gmdate(DATE_ATOM);
            $timestamp = (string) ($message['timestamp'] ?? '');
            if ($timestamp !== '' && ctype_digit($timestamp)) {
                $occurredAt = gmdate(DATE_ATOM, (int) $timestamp);
            }

            $event = [
                'event_type' => 'conversion_confirmed',
                'session_id' => '',
                'source' => $foundCode['source'],
                'page_path' => '',
                'page_url' => '',
                'page_title' => 'WhatsApp Cloud API',
                'referrer' => '',
                'cta_location' => 'whatsapp_webhook',
                'product_code' => $foundCode['product_code'],
                'product_label' => $foundCode['product_label'],
                'flavor_label' => $foundCode['flavor_label'],
                'flavor_code' => $foundCode['flavor_code'],
                'package_label' => $foundCode['package_label'],
                'package_size' => $foundCode['package_size'],
                'package_price' => '',
                'order_code' => $foundCode['order_code'],
                'conversion_status' => 'confirmed',
                'external_id' => substr((string) ($message['id'] ?? ''), 0, 120),
                'notes' => substr($matchedBody, 0, 255),
                'customer_name' => substr($contactName, 0, 120),
                'customer_wa_id' => substr($contactWaId !== '' ? $contactWaId : (string) ($message['from'] ?? ''), 0, 120),
                'business_phone' => substr($metadataPhone, 0, 50),
                'elapsed_ms' => 0,
                'occurred_at' => $occurredAt,
            ];

            analyticsAppendEvent($event);
        }
    }
}

analyticsJsonResponse([
    'ok' => true,
    'processed_messages' => $processedMessages,
    'matched_conversions' => $matchedConversions,
    'matched_order_codes' => array_values(array_unique($matchedOrderCodes)),
]);
