<?php
/**
 * Test Database Connection
 * Use this to verify database is accessible
 */
header('Content-Type: application/json');

try {
    // Try to connect to MySQL
    $dbConfig = [
        'host' => '127.0.0.1',
        'port' => 3306,
        'database' => 'ready2study',
        'username' => 'root',
        'password' => '',
    ];

    // Fast reachability check to avoid long hangs when MySQL isn't running
    $errno = 0;
    $errstr = '';
    $timeoutSec = 2.0;
    $socket = @stream_socket_client(
        "tcp://{$dbConfig['host']}:{$dbConfig['port']}",
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
        http_response_code(503);
        echo json_encode([
            'status' => 'error',
            'message' => 'MySQL is not reachable. Please start MySQL in the XAMPP Control Panel.',
            'host' => $dbConfig['host'],
            'port' => $dbConfig['port'],
            'details' => $errstr ? "{$errstr} ({$errno})" : 'Connection attempt timed out'
        ]);
        exit;
    }
    fclose($socket);
    
    // First try without database
    $pdo = new PDO(
        "mysql:host={$dbConfig['host']};port={$dbConfig['port']};charset=utf8mb4",
        $dbConfig['username'],
        $dbConfig['password'],
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_TIMEOUT => 3
        ]
    );
    
    echo json_encode([
        'status' => 'success',
        'message' => 'MySQL connection successful',
        'host' => $dbConfig['host'],
        'username' => $dbConfig['username']
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Database connection failed',
        'error' => $e->getMessage(),
        'code' => $e->getCode()
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Unexpected error',
        'error' => $e->getMessage()
    ]);
}



