<?php
declare(strict_types=1);

require_once __DIR__ . '/analytics-bootstrap.php';

header('Content-Type: application/json; charset=utf-8');

$config = analyticsResolveDatabaseConfig();

try {
    $pdo = analyticsDb();
    $tables = $pdo->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN);

    echo json_encode([
        'env' => [
            'JG_DB_HOST' => $config['host'] !== '' ? $config['host'] : 'MISSING',
            'JG_DB_PORT' => $config['port'],
            'JG_DB_NAME' => $config['name'] !== '' ? $config['name'] : 'MISSING',
            'JG_DB_USER' => $config['user'] !== '' ? $config['user'] : 'MISSING',
            'JG_DB_PASSWORD' => $config['pass'] !== '' ? 'SET' : 'MISSING',
            'JG_DB_CHARSET' => $config['charset'],
        ],
        'connected' => true,
        'tables' => $tables,
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
} catch (Throwable $error) {
    echo json_encode([
        'env' => [
            'JG_DB_HOST' => $config['host'] !== '' ? $config['host'] : 'MISSING',
            'JG_DB_PORT' => $config['port'],
            'JG_DB_NAME' => $config['name'] !== '' ? $config['name'] : 'MISSING',
            'JG_DB_USER' => $config['user'] !== '' ? $config['user'] : 'MISSING',
            'JG_DB_PASSWORD' => $config['pass'] !== '' ? 'SET' : 'MISSING',
            'JG_DB_CHARSET' => $config['charset'],
        ],
        'connected' => false,
        'error' => $error->getMessage(),
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
}
