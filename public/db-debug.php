<?php
declare(strict_types=1);

require_once __DIR__ . '/analytics-bootstrap.php';

header('Content-Type: application/json; charset=utf-8');

$config = analyticsResolveDatabaseConfig();
$localConfigFile = __DIR__ . '/whatsapp-config.local.php';
$localConfig = file_exists($localConfigFile) ? require $localConfigFile : null;

try {
    $pdo = analyticsDb();
    $tables = $pdo->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN);

    echo json_encode([
        'paths' => [
            'script_dir' => __DIR__,
            'local_config_file' => $localConfigFile,
            'local_config_exists' => file_exists($localConfigFile),
        ],
        'local_config' => [
            'loaded' => is_array($localConfig),
            'keys' => is_array($localConfig) ? array_keys($localConfig) : [],
            'db_host' => is_array($localConfig) && trim((string) ($localConfig['db_host'] ?? '')) !== '' ? 'SET' : 'MISSING',
            'db_user' => is_array($localConfig) && trim((string) ($localConfig['db_user'] ?? '')) !== '' ? 'SET' : 'MISSING',
            'db_password' => is_array($localConfig) && (string) ($localConfig['db_password'] ?? '') !== '' ? 'SET' : 'MISSING',
        ],
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
        'paths' => [
            'script_dir' => __DIR__,
            'local_config_file' => $localConfigFile,
            'local_config_exists' => file_exists($localConfigFile),
        ],
        'local_config' => [
            'loaded' => is_array($localConfig),
            'keys' => is_array($localConfig) ? array_keys($localConfig) : [],
            'db_host' => is_array($localConfig) && trim((string) ($localConfig['db_host'] ?? '')) !== '' ? 'SET' : 'MISSING',
            'db_user' => is_array($localConfig) && trim((string) ($localConfig['db_user'] ?? '')) !== '' ? 'SET' : 'MISSING',
            'db_password' => is_array($localConfig) && (string) ($localConfig['db_password'] ?? '') !== '' ? 'SET' : 'MISSING',
        ],
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
