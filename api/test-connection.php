<?php
/**
 * Database Connection Test
 * Run this to diagnose connection issues
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$result = [
    'php_version' => phpversion(),
    'tests' => []
];

// Test 1: Can we connect to MySQL?
$result['tests']['mysql_connection'] = [
    'name' => 'MySQL Connection',
    'status' => 'pending'
];

try {
    $pdo = new PDO(
        "mysql:host=127.0.0.1;charset=utf8mb4",
        'root',
        '',
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_TIMEOUT => 3
        ]
    );
    $result['tests']['mysql_connection']['status'] = 'success';
    $result['tests']['mysql_connection']['message'] = 'Successfully connected to MySQL server';
} catch (PDOException $e) {
    $result['tests']['mysql_connection']['status'] = 'failed';
    $result['tests']['mysql_connection']['error'] = $e->getMessage();
    $result['tests']['mysql_connection']['code'] = $e->getCode();
    echo json_encode($result, JSON_PRETTY_PRINT);
    exit;
}

// Test 2: Does the database exist?
$result['tests']['database_exists'] = [
    'name' => 'Database Exists',
    'status' => 'pending'
];

try {
    $stmt = $pdo->query("SHOW DATABASES LIKE 'ready2study'");
    if ($stmt->rowCount() > 0) {
        $result['tests']['database_exists']['status'] = 'success';
        $result['tests']['database_exists']['message'] = 'Database "ready2study" exists';
    } else {
        $result['tests']['database_exists']['status'] = 'warning';
        $result['tests']['database_exists']['message'] = 'Database "ready2study" does not exist - will be created automatically';
        
        // Try to create it
        try {
            $pdo->exec("CREATE DATABASE IF NOT EXISTS `ready2study` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
            $result['tests']['database_exists']['message'] .= ' - Created successfully!';
            $result['tests']['database_exists']['status'] = 'success';
        } catch (PDOException $e) {
            $result['tests']['database_exists']['status'] = 'failed';
            $result['tests']['database_exists']['error'] = 'Cannot create database: ' . $e->getMessage();
        }
    }
} catch (PDOException $e) {
    $result['tests']['database_exists']['status'] = 'failed';
    $result['tests']['database_exists']['error'] = $e->getMessage();
}

// Test 3: Can we connect to the database?
$result['tests']['database_connection'] = [
    'name' => 'Database Connection',
    'status' => 'pending'
];

try {
    $pdo = new PDO(
        "mysql:host=127.0.0.1;dbname=ready2study;charset=utf8mb4",
        'root',
        '',
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
        ]
    );
    $result['tests']['database_connection']['status'] = 'success';
    $result['tests']['database_connection']['message'] = 'Successfully connected to ready2study database';
} catch (PDOException $e) {
    $result['tests']['database_connection']['status'] = 'failed';
    $result['tests']['database_connection']['error'] = $e->getMessage();
    echo json_encode($result, JSON_PRETTY_PRINT);
    exit;
}

// Test 4: Does the users table exist?
$result['tests']['users_table'] = [
    'name' => 'Users Table',
    'status' => 'pending'
];

try {
    $stmt = $pdo->query("SHOW TABLES LIKE 'users'");
    if ($stmt->rowCount() > 0) {
        $result['tests']['users_table']['status'] = 'success';
        $result['tests']['users_table']['message'] = 'Users table exists';
        
        // Count users
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM users");
        $count = $stmt->fetch(PDO::FETCH_ASSOC);
        $result['tests']['users_table']['user_count'] = $count['count'];
    } else {
        $result['tests']['users_table']['status'] = 'warning';
        $result['tests']['users_table']['message'] = 'Users table does not exist - will be created automatically';
    }
} catch (PDOException $e) {
    $result['tests']['users_table']['status'] = 'failed';
    $result['tests']['users_table']['error'] = $e->getMessage();
}

// Test 5: Can we write to the database?
$result['tests']['database_write'] = [
    'name' => 'Database Write Test',
    'status' => 'pending'
];

try {
    // Create table if doesn't exist
    $pdo->exec("CREATE TABLE IF NOT EXISTS `users` (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    
    $result['tests']['database_write']['status'] = 'success';
    $result['tests']['database_write']['message'] = 'Table structure verified/created successfully';
} catch (PDOException $e) {
    $result['tests']['database_write']['status'] = 'failed';
    $result['tests']['database_write']['error'] = $e->getMessage();
}

// Overall status
$allSuccess = true;
foreach ($result['tests'] as $test) {
    if ($test['status'] === 'failed') {
        $allSuccess = false;
        break;
    }
}

$result['overall_status'] = $allSuccess ? 'ready' : 'needs_attention';
$result['summary'] = $allSuccess 
    ? 'All tests passed! The registration API should work now.' 
    : 'Some tests failed. Please check the details above.';

echo json_encode($result, JSON_PRETTY_PRINT);


