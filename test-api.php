<?php
/**
 * Test API Endpoint
 * Use this to verify the API is accessible
 */
header('Content-Type: application/json');

echo json_encode([
    'status' => 'success',
    'message' => 'API endpoint is accessible',
    'method' => $_SERVER['REQUEST_METHOD'],
    'uri' => $_SERVER['REQUEST_URI'],
    'file' => __FILE__,
    'php_version' => PHP_VERSION
]);



