<?php
/**
 * Debug Version of Registration Endpoint
 * Shows detailed error messages
 */

// Enable ALL error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/../error.log');

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Log all PHP errors
set_error_handler(function($errno, $errstr, $errfile, $errline) {
    $error = [
        'type' => 'PHP Error',
        'severity' => $errno,
        'message' => $errstr,
        'file' => $errfile,
        'line' => $errline
    ];
    error_log('PHP Error: ' . json_encode($error));
    return false; // Let PHP handle it
});

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Log request
error_log('=== Registration Request ===');
error_log('Method: ' . $_SERVER['REQUEST_METHOD']);
error_log('Content-Type: ' . ($_SERVER['CONTENT_TYPE'] ?? 'not set'));

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed', 'method' => $_SERVER['REQUEST_METHOD']]);
    exit;
}

// Get JSON input
$rawInput = file_get_contents('php://input');
error_log('Raw Input: ' . $rawInput);

$input = json_decode($rawInput, true);

if (!$input && json_last_error() !== JSON_ERROR_NONE) {
    $response = [
        'error' => 'Invalid JSON',
        'json_error' => json_last_error_msg(),
        'raw_input' => substr($rawInput, 0, 200)
    ];
    error_log('JSON Error: ' . json_encode($response));
    http_response_code(400);
    echo json_encode($response);
    exit;
}

// Validate required fields
$required = ['name', 'college', 'course', 'year'];
$missing = [];
foreach ($required as $field) {
    if (empty($input[$field])) {
        $missing[] = $field;
    }
}

if (!empty($missing)) {
    $response = [
        'error' => 'Missing required fields',
        'missing' => $missing,
        'received' => array_keys($input)
    ];
    error_log('Validation Error: ' . json_encode($response));
    http_response_code(422);
    echo json_encode($response);
    exit;
}

// Database connection
$dbConfig = [
    'host' => '127.0.0.1',
    'database' => 'ready2study',
    'username' => 'root',
    'password' => '',
];

error_log('Attempting database connection...');
error_log('Host: ' . $dbConfig['host']);
error_log('Database: ' . $dbConfig['database']);
error_log('Username: ' . $dbConfig['username']);

try {
    // Step 1: Connect to MySQL server
    error_log('Step 1: Connecting to MySQL server...');
    $pdo = new PDO(
        "mysql:host={$dbConfig['host']};charset=utf8mb4",
        $dbConfig['username'],
        $dbConfig['password'],
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_TIMEOUT => 5
        ]
    );
    error_log('✓ Connected to MySQL server');
    
    // Step 2: Create database if needed
    error_log('Step 2: Checking if database exists...');
    $stmt = $pdo->query("SHOW DATABASES LIKE '{$dbConfig['database']}'");
    if ($stmt->rowCount() == 0) {
        error_log('Database does not exist, creating...');
        $pdo->exec("CREATE DATABASE IF NOT EXISTS `{$dbConfig['database']}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        error_log('✓ Database created');
    } else {
        error_log('✓ Database exists');
    }
    
    // Step 3: Connect to database
    error_log('Step 3: Connecting to database...');
    $pdo = new PDO(
        "mysql:host={$dbConfig['host']};dbname={$dbConfig['database']};charset=utf8mb4",
        $dbConfig['username'],
        $dbConfig['password'],
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
        ]
    );
    error_log('✓ Connected to database');
    
    // Step 4: Create users table if needed
    error_log('Step 4: Checking if users table exists...');
    $stmt = $pdo->query("SHOW TABLES LIKE 'users'");
    if ($stmt->rowCount() == 0) {
        error_log('Users table does not exist, creating...');
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS `users` (
                `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
                `name` varchar(255) NOT NULL,
                `email` varchar(255) DEFAULT NULL,
                `password` varchar(255) DEFAULT NULL,
                `college` varchar(255) NOT NULL,
                `course` varchar(255) NOT NULL,
                `year` int(11) NOT NULL,
                `created_at` timestamp NULL DEFAULT NULL,
                `updated_at` timestamp NULL DEFAULT NULL,
                PRIMARY KEY (`id`),
                UNIQUE KEY `users_email_unique` (`email`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
        error_log('✓ Users table created');
    } else {
        error_log('✓ Users table exists');
    }
    
    // Step 5: Check if user exists
    error_log('Step 5: Checking if user exists...');
    $stmt = $pdo->prepare("SELECT id, name, email, college, course, year FROM users WHERE name = ?");
    $stmt->execute([$input['name']]);
    $existing = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($existing) {
        error_log('User already exists: ' . $existing['id']);
        http_response_code(200);
        echo json_encode([
            'message' => 'User already exists',
            'user' => $existing
        ]);
        exit;
    }
    
    // Step 6: Create new user
    error_log('Step 6: Creating new user...');
    $stmt = $pdo->prepare("
        INSERT INTO users (name, email, password, college, course, year, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
    ");
    
    $password = !empty($input['password']) ? password_hash($input['password'], PASSWORD_DEFAULT) : null;
    
    $stmt->execute([
        $input['name'],
        $input['email'] ?? null,
        $password,
        $input['college'],
        $input['course'],
        (int)$input['year']
    ]);
    
    $userId = $pdo->lastInsertId();
    error_log('✓ User created with ID: ' . $userId);
    
    // Step 7: Get created user
    $stmt = $pdo->prepare("SELECT id, name, email, college, course, year FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    error_log('=== Registration Successful ===');
    
    http_response_code(201);
    echo json_encode([
        'message' => 'User registered successfully',
        'user' => $user,
        'debug' => [
            'steps_completed' => 7,
            'database_connected' => true,
            'table_exists' => true,
            'user_created' => true
        ]
    ]);
    
} catch (PDOException $e) {
    error_log('=== DATABASE ERROR ===');
    error_log('Error Code: ' . $e->getCode());
    error_log('Error Message: ' . $e->getMessage());
    error_log('Error File: ' . $e->getFile());
    error_log('Error Line: ' . $e->getLine());
    error_log('Stack Trace: ' . $e->getTraceAsString());
    
    http_response_code(500);
    
    // Provide detailed error info
    $errorInfo = [
        'error' => 'Database error',
        'code' => $e->getCode(),
        'message' => $e->getMessage(),
        'file' => basename($e->getFile()),
        'line' => $e->getLine(),
        'debug' => [
            'host' => $dbConfig['host'],
            'database' => $dbConfig['database'],
            'username' => $dbConfig['username'],
            'php_version' => phpversion(),
            'pdo_drivers' => PDO::getAvailableDrivers()
        ]
    ];
    
    echo json_encode($errorInfo, JSON_PRETTY_PRINT);
    
} catch (Exception $e) {
    error_log('=== GENERAL ERROR ===');
    error_log('Error Message: ' . $e->getMessage());
    error_log('Error File: ' . $e->getFile());
    error_log('Error Line: ' . $e->getLine());
    error_log('Stack Trace: ' . $e->getTraceAsString());
    
    http_response_code(500);
    echo json_encode([
        'error' => 'Registration failed',
        'message' => $e->getMessage(),
        'file' => basename($e->getFile()),
        'line' => $e->getLine(),
        'trace' => $e->getTraceAsString()
    ], JSON_PRETTY_PRINT);
}


