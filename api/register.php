<?php
/**
 * Standalone Registration Endpoint
 * Works without full Laravel bootstrap for static HTML files
 */

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 0); // Don't display raw PHP errors, return JSON instead
ini_set('log_errors', 1);

// Set error handler to catch fatal errors
register_shutdown_function(function() {
    $error = error_get_last();
    if ($error !== NULL && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
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
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed', 'method' => $_SERVER['REQUEST_METHOD']]);
    exit;
}

// Get JSON input
$rawInput = file_get_contents('php://input');
$input = json_decode($rawInput, true);

if (!$input && json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode([
        'error' => 'Invalid JSON',
        'json_error' => json_last_error_msg(),
        'raw_input' => substr($rawInput, 0, 100)
    ]);
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
    http_response_code(422);
    echo json_encode([
        'error' => 'Missing required fields',
        'missing' => $missing
    ]);
    exit;
}

// Try to use Laravel if available
$laravelBootstrap = __DIR__ . '/../bootstrap/app.php';
if (file_exists($laravelBootstrap)) {
    try {
        require $laravelBootstrap;
        exit; // Laravel will handle the request
    } catch (Exception $e) {
        // Fall through to standalone handler
        error_log("Laravel bootstrap failed: " . $e->getMessage());
    }
}

// Standalone database connection (fallback)
try {
    // Load database config - try .env file first
    $envFile = __DIR__ . '/../.env';
    $dbConfig = [
        'host' => '127.0.0.1',
        'database' => 'ready2study',
        'username' => 'root',
        'password' => '',
    ];
    
    // Try to read .env file
    if (file_exists($envFile)) {
        $envContent = file_get_contents($envFile);
        preg_match('/DB_HOST=(.+)/', $envContent, $hostMatch);
        preg_match('/DB_DATABASE=(.+)/', $envContent, $dbMatch);
        preg_match('/DB_USERNAME=(.+)/', $envContent, $userMatch);
        preg_match('/DB_PASSWORD=(.+)/', $envContent, $passMatch);
        
        if (!empty($hostMatch[1])) $dbConfig['host'] = trim($hostMatch[1]);
        if (!empty($dbMatch[1])) $dbConfig['database'] = trim($dbMatch[1]);
        if (!empty($userMatch[1])) $dbConfig['username'] = trim($userMatch[1]);
        if (!empty($passMatch[1])) $dbConfig['password'] = trim($passMatch[1]);
    }

    // First, try to connect without database to create it if needed
    try {
        // Try connecting to MySQL server first
        $pdo = new PDO(
            "mysql:host={$dbConfig['host']};charset=utf8mb4",
            $dbConfig['username'],
            $dbConfig['password'],
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_TIMEOUT => 3
            ]
        );
        
        // Check if database exists, create if not
        try {
            $stmt = $pdo->query("SHOW DATABASES LIKE '{$dbConfig['database']}'");
            if ($stmt->rowCount() == 0) {
                $pdo->exec("CREATE DATABASE IF NOT EXISTS `{$dbConfig['database']}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
            }
        } catch (PDOException $e) {
            // If we can't create database, try connecting anyway (might already exist)
        }
        
        // Now connect to the database
        $pdo = new PDO(
            "mysql:host={$dbConfig['host']};dbname={$dbConfig['database']};charset=utf8mb4",
            $dbConfig['username'],
            $dbConfig['password'],
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_TIMEOUT => 3
            ]
        );
        
    } catch (PDOException $e) {
        $errorCode = $e->getCode();
        $errorMsg = $e->getMessage();
        
        // Provide user-friendly error messages
        if ($errorCode == 2002 || strpos($errorMsg, 'Connection refused') !== false || strpos($errorMsg, 'No connection') !== false || strpos($errorMsg, 'Connection timed out') !== false) {
            throw new Exception("Cannot connect to MySQL server. Please ensure MySQL is running in XAMPP Control Panel.");
        } elseif ($errorCode == 1045 || strpos($errorMsg, 'Access denied') !== false) {
            throw new Exception("Database access denied. Please check MySQL username and password. Default XAMPP: root, no password.");
        } elseif (strpos($errorMsg, 'Unknown database') !== false) {
            throw new Exception("Database '{$dbConfig['database']}' does not exist. Please create it in phpMyAdmin or check database name.");
        } else {
            throw new Exception("Database connection failed: " . $errorMsg . " (Code: {$errorCode})");
        }
    }

    // Check if users table exists, create if not
    try {
        $stmt = $pdo->query("SHOW TABLES LIKE 'users'");
        if ($stmt->rowCount() == 0) {
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
        }
    } catch (PDOException $e) {
        // If table creation fails, try to continue (table might exist with different structure)
        error_log("Table creation/check failed: " . $e->getMessage());
    }

    // Check if user exists
    $stmt = $pdo->prepare("SELECT id FROM users WHERE name = ?");
    $stmt->execute([$input['name']]);
    $existing = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($existing) {
        // User exists, return user data
        $stmt = $pdo->prepare("SELECT id, name, email, college, course, year FROM users WHERE id = ?");
        $stmt->execute([$existing['id']]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        http_response_code(200);
        echo json_encode([
            'message' => 'User already exists',
            'user' => $user
        ]);
        exit;
    }

    // Create new user
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

    // Get created user
    $stmt = $pdo->prepare("SELECT id, name, email, college, course, year FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    http_response_code(201);
    echo json_encode([
        'message' => 'User registered successfully',
        'user' => $user
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    $errorMsg = $e->getMessage();
    // Make error message more user-friendly
    if (strpos($errorMsg, 'Access denied') !== false) {
        $errorMsg = 'Database access denied. Please check MySQL username and password.';
    } elseif (strpos($errorMsg, 'Unknown database') !== false) {
        $errorMsg = 'Database not found. Please create the database or check database name.';
    } elseif (strpos($errorMsg, 'Connection refused') !== false || strpos($errorMsg, 'Connection refused') !== false) {
        $errorMsg = 'Cannot connect to MySQL. Please ensure MySQL is running in XAMPP.';
    }
    
    echo json_encode([
        'error' => 'Database error',
        'message' => $errorMsg,
        'code' => $e->getCode(),
        'details' => $e->getMessage()
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Registration failed',
        'message' => $e->getMessage(),
        'file' => basename($e->getFile()),
        'line' => $e->getLine(),
        'trace' => $e->getTraceAsString()
    ]);
}

