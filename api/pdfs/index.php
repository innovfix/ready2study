<?php
/**
 * Standalone PDF List Endpoint
 * Returns uploaded PDFs from the database (optionally filtered by user_id)
 *
 * URL:
 *   GET /Ready2Study/api/pdfs           -> lists PDFs (latest first)
 *   GET /Ready2Study/api/pdfs?user_id=1 -> lists PDFs for a user
 */

// Suppress all output except JSON
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('html_errors', 0);
ob_start();

// Custom error handler to catch all errors and convert to JSON
set_error_handler(function ($errno, $errstr, $errfile, $errline) {
    if (!(error_reporting() & $errno)) {
        return false;
    }
    while (ob_get_level()) {
        ob_end_clean();
    }
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode([
        'error' => 'PHP Error',
        'message' => $errstr,
        'file' => basename($errfile),
        'line' => $errline,
        'type' => $errno
    ]);
    exit;
});

// Fatal error handler
register_shutdown_function(function () {
    $error = error_get_last();
    if ($error !== NULL && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR], true)) {
        while (ob_get_level()) {
            ob_end_clean();
        }
        header('Content-Type: application/json');
        http_response_code(500);
        echo json_encode([
            'error' => 'PHP Fatal Error',
            'message' => $error['message'],
            'file' => basename($error['file']),
            'line' => $error['line']
        ]);
        exit;
    }
});

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

/**
 * Fast MySQL reachability check to avoid long hangs when MySQL isn't running.
 * (PDO timeouts can be unreliable on some Windows/XAMPP setups.)
 */
function assertMySqlReachable(string $host, int $port): void
{
    $errno = 0;
    $errstr = '';
    $timeoutSec = 2.0;
    $socket = @stream_socket_client(
        "tcp://{$host}:{$port}",
        $errno,
        $errstr,
        $timeoutSec,
        STREAM_CLIENT_CONNECT | STREAM_CLIENT_ASYNC_CONNECT
    );
    $connected = false;
    if ($socket) {
        stream_set_blocking($socket, false);
        $read = [];
        $write = [$socket];
        $except = [$socket];
        $sec = (int)$timeoutSec;
        $usec = (int)(($timeoutSec - $sec) * 1000000);
        $selected = @stream_select($read, $write, $except, $sec, $usec);
        $connected = ($selected && count($write) > 0);
    }

    if (!$socket || !$connected) {
        while (ob_get_level()) {
            ob_end_clean();
        }
        http_response_code(503);
        header('Content-Type: application/json');
        echo json_encode([
            'error' => 'Database unavailable',
            'message' => "Cannot reach MySQL at {$host}:{$port}. Please start MySQL in the XAMPP Control Panel.",
            'details' => $errstr ? "{$errstr} ({$errno})" : 'Connection attempt timed out'
        ]);
        exit;
    }
    fclose($socket);
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    while (ob_get_level()) {
        ob_end_clean();
    }
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed', 'method' => $_SERVER['REQUEST_METHOD']]);
    exit;
}

try {
    // Connect to database
    $dbConfig = [
        'host' => '127.0.0.1',
        'port' => 3306,
        'database' => 'ready2study',
        'username' => 'root',
        'password' => '',
    ];

    assertMySqlReachable($dbConfig['host'], $dbConfig['port']);

    $pdo = new PDO(
        "mysql:host={$dbConfig['host']};port={$dbConfig['port']};dbname={$dbConfig['database']};charset=utf8mb4",
        $dbConfig['username'],
        $dbConfig['password'],
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_TIMEOUT => 3
        ]
    );

    // Ensure table exists (upload endpoint creates it, but keeping this defensive)
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS pdfs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NULL,
            filename VARCHAR(255) NOT NULL,
            original_name VARCHAR(255) NOT NULL,
            path VARCHAR(500) NOT NULL,
            content_text LONGTEXT,
            file_size INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_user_id (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    $userId = isset($_GET['user_id']) && $_GET['user_id'] !== '' ? (int)$_GET['user_id'] : null;

    // Fetch PDFs (latest first)
    if ($userId) {
        $stmt = $pdo->prepare("
            SELECT id, user_id, filename, original_name, path, file_size, created_at
            FROM pdfs
            WHERE user_id = ?
            ORDER BY id DESC
        ");
        $stmt->execute([$userId]);
    } else {
        $stmt = $pdo->query("
            SELECT id, user_id, filename, original_name, path, file_size, created_at
            FROM pdfs
            ORDER BY id DESC
        ");
    }

    $pdfs = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $formatted = array_map(function ($p) {
        return [
            'id' => (int)$p['id'],
            'user_id' => $p['user_id'] !== null ? (int)$p['user_id'] : null,
            'filename' => $p['filename'],
            'original_name' => $p['original_name'],
            'path' => $p['path'],
            'url' => '/' . ltrim($p['path'], '/'),
            'file_size' => (int)$p['file_size'],
            'created_at' => $p['created_at'],
        ];
    }, $pdfs);

    while (ob_get_level()) {
        ob_end_clean();
    }

    http_response_code(200);
    echo json_encode([
        'pdfs' => $formatted,
        'count' => count($formatted),
    ]);
    exit;
} catch (Exception $e) {
    while (ob_get_level()) {
        ob_end_clean();
    }
    http_response_code(500);
    echo json_encode([
        'error' => 'Failed to list PDFs',
        'message' => $e->getMessage()
    ]);
    exit;
}


