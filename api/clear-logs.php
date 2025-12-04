<?php
/**
 * Clear Error Logs
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$errorLogPath = __DIR__ . '/../error.log';

if (file_exists($errorLogPath)) {
    file_put_contents($errorLogPath, '');
    echo json_encode([
        'success' => true,
        'message' => 'Error log cleared successfully'
    ]);
} else {
    echo json_encode([
        'success' => true,
        'message' => 'No error log file found'
    ]);
}


