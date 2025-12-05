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
        'database' => 'ready2study',
        'username' => 'root',
        'password' => '',
    ];
    
    // First try without database
    $pdo = new PDO(
        "mysql:host={$dbConfig['host']};charset=utf8mb4",
        $dbConfig['username'],
        $dbConfig['password'],
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
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



