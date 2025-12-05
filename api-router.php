<?php
/**
 * API Router for Static HTML Files
 * Routes API requests to Laravel when accessed from static HTML files
 */

// Check if this is an API request
$requestUri = $_SERVER['REQUEST_URI'] ?? '';
$requestMethod = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// Only handle API requests
if (strpos($requestUri, '/api/') === false) {
    http_response_code(404);
    die('Not Found');
}

// Try to bootstrap Laravel
$laravelPaths = [
    __DIR__ . '/bootstrap/app.php',
    __DIR__ . '/public/index.php',
];

foreach ($laravelPaths as $path) {
    if (file_exists($path)) {
        // Set up environment
        $_SERVER['SCRIPT_NAME'] = '/index.php';
        $_SERVER['REQUEST_URI'] = $requestUri;
        
        // Bootstrap Laravel
        require $path;
        exit;
    }
}

// If Laravel not found, return error
http_response_code(500);
header('Content-Type: application/json');
echo json_encode([
    'error' => 'Laravel bootstrap file not found',
    'message' => 'Please ensure Laravel is properly installed'
]);



