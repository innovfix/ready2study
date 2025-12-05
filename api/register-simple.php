<?php
/**
 * Simplified Registration Endpoint
 * Minimal version for testing
 */
header('Content-Type: application/json');

try {
    // Get input
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        throw new Exception('Invalid JSON input');
    }
    
    // Validate
    if (empty($input['name']) || empty($input['college']) || empty($input['course']) || empty($input['year'])) {
        throw new Exception('Missing required fields');
    }
    
    // Connect to database
    $host = '127.0.0.1';
    $db = 'ready2study';
    $user = 'root';
    $pass = '';
    
    try {
        // Try connecting to MySQL
        $pdo = new PDO("mysql:host=$host;charset=utf8mb4", $user, $pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_TIMEOUT => 3
        ]);
        
        // Create database if needed
        $pdo->exec("CREATE DATABASE IF NOT EXISTS `$db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        
        // Connect to database
        $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
        ]);
        
        // Create table if needed
        $pdo->exec("CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255),
            password VARCHAR(255),
            college VARCHAR(255) NOT NULL,
            course VARCHAR(255) NOT NULL,
            year INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )");
        
        // Check if user exists
        $stmt = $pdo->prepare("SELECT * FROM users WHERE name = ?");
        $stmt->execute([$input['name']]);
        $existing = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($existing) {
            echo json_encode([
                'message' => 'User already exists',
                'user' => [
                    'id' => $existing['id'],
                    'name' => $existing['name'],
                    'college' => $existing['college'],
                    'course' => $existing['course'],
                    'year' => $existing['year']
                ]
            ]);
            exit;
        }
        
        // Insert new user
        $stmt = $pdo->prepare("INSERT INTO users (name, email, password, college, course, year) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $input['name'],
            $input['email'] ?? null,
            null,
            $input['college'],
            $input['course'],
            (int)$input['year']
        ]);
        
        $userId = $pdo->lastInsertId();
        
        echo json_encode([
            'message' => 'User registered successfully',
            'user' => [
                'id' => $userId,
                'name' => $input['name'],
                'college' => $input['college'],
                'course' => $input['course'],
                'year' => (int)$input['year']
            ]
        ]);
        
    } catch (PDOException $e) {
        throw new Exception("Database error: " . $e->getMessage());
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Registration failed',
        'message' => $e->getMessage()
    ]);
}



