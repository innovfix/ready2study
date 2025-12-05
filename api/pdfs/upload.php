<?php
/**
 * Standalone PDF Upload Endpoint
 * Handles PDF upload and stores metadata in database
 */

// Suppress all output except JSON
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('html_errors', 0); // Disable HTML formatting of errors
ob_start(); // Start output buffering to catch any unwanted output

// Custom error handler to catch all errors and convert to JSON
set_error_handler(function($errno, $errstr, $errfile, $errline) {
    // Don't handle errors if they were suppressed with @
    if (!(error_reporting() & $errno)) {
        return false;
    }
    
    // Clear any output
    ob_clean();
    
    // Send JSON error response
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

// Set error handler for fatal errors
register_shutdown_function(function() {
    $error = error_get_last();
    if ($error !== NULL && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        ob_clean();
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
    ob_clean();
    http_response_code(405);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Method not allowed', 'method' => $_SERVER['REQUEST_METHOD']]);
    exit;
}

try {
    // Clear any output buffer
    while (ob_get_level()) {
        ob_end_clean();
    }
    ob_start();
    
    // Check if file was uploaded
    if (!isset($_FILES['file'])) {
        ob_clean();
        http_response_code(400);
        header('Content-Type: application/json');
        echo json_encode([
            'error' => 'No file uploaded',
            'message' => 'Please select a PDF file to upload'
        ]);
        ob_end_flush();
        exit;
    }

    $file = $_FILES['file'];
    
    // Validate file upload
    if ($file['error'] !== UPLOAD_ERR_OK) {
        $errorMessages = [
            UPLOAD_ERR_INI_SIZE => 'File exceeds upload_max_filesize',
            UPLOAD_ERR_FORM_SIZE => 'File exceeds MAX_FILE_SIZE',
            UPLOAD_ERR_PARTIAL => 'File was only partially uploaded',
            UPLOAD_ERR_NO_FILE => 'No file was uploaded',
            UPLOAD_ERR_NO_TMP_DIR => 'Missing temporary folder',
            UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk',
            UPLOAD_ERR_EXTENSION => 'File upload stopped by extension',
        ];
        
        throw new Exception($errorMessages[$file['error']] ?? 'Unknown upload error');
    }

    // Validate file type
    $mimeType = null;
    if (function_exists('finfo_open')) {
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        if ($finfo && file_exists($file['tmp_name'])) {
            $mimeType = finfo_file($finfo, $file['tmp_name']);
            finfo_close($finfo);
        }
    }
    
    // Fallback: check file extension and MIME type from $_FILES
    if (!$mimeType) {
        $mimeType = $file['type'] ?? null;
        if (!$mimeType) {
            $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
            if ($extension === 'pdf') {
                $mimeType = 'application/pdf';
            }
        }
    }
    
    if ($mimeType !== 'application/pdf') {
        ob_clean();
        http_response_code(400);
        header('Content-Type: application/json');
        echo json_encode([
            'error' => 'Invalid file type',
            'message' => 'Only PDF files are allowed. Detected type: ' . ($mimeType ?: 'unknown')
        ]);
        ob_end_flush();
        exit;
    }

    // File size validation removed - users can upload files of any size

    // Get content text from POST data
    $contentText = $_POST['content_text'] ?? '';
    
    // Trim whitespace and check if actually empty
    $contentText = trim($contentText);
    
    if (empty($contentText) || strlen($contentText) < 10) {
        ob_clean();
        http_response_code(400);
        header('Content-Type: application/json');
        echo json_encode([
            'error' => 'Validation failed',
            'message' => 'PDF content text is required and must be at least 10 characters long. Please ensure the PDF text was extracted correctly.'
        ]);
        ob_end_flush();
        exit;
    }

    // Get user ID from localStorage (passed as form data)
    // For now, we'll get it from the request or use a default
    $userId = $_POST['user_id'] ?? null;
    
    // If no user_id provided, try to get from user data
    if (!$userId && isset($_POST['user_data'])) {
        $userData = json_decode($_POST['user_data'], true);
        $userId = $userData['id'] ?? null;
    }

    // Connect to database
    $dbConfig = [
        'host' => '127.0.0.1',
        'database' => 'ready2study',
        'username' => 'root',
        'password' => '',
    ];

    try {
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
        throw new Exception("Database connection failed. Please ensure MySQL is running in XAMPP.");
    }

    // Create pdfs table if it doesn't exist
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

    // Create uploads directory if it doesn't exist
    $uploadDir = __DIR__ . '/../../uploads/pdfs';
    if (!is_dir($uploadDir)) {
        if (!@mkdir($uploadDir, 0755, true)) {
            throw new Exception('Failed to create upload directory. Please check permissions.');
        }
    }
    
    // Check if directory is writable
    if (!is_writable($uploadDir)) {
        throw new Exception('Upload directory is not writable. Please check permissions.');
    }

    // Generate unique filename
    $timestamp = time();
    $originalName = basename($file['name']);
    $filename = $timestamp . '_' . preg_replace('/[^a-zA-Z0-9._-]/', '_', $originalName);
    $filePath = $uploadDir . '/' . $filename;

    // Move uploaded file
    if (!move_uploaded_file($file['tmp_name'], $filePath)) {
        throw new Exception('Failed to save uploaded file');
    }

    // Store relative path for database
    $relativePath = 'uploads/pdfs/' . $filename;

    // Insert PDF record into database
    $stmt = $pdo->prepare("
        INSERT INTO pdfs (user_id, filename, original_name, path, content_text, file_size, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
    ");

    $stmt->execute([
        $userId,
        $filename,
        $originalName,
        $relativePath,
        $contentText,
        $file['size']
    ]);

    $pdfId = $pdo->lastInsertId();

    // Get the created PDF record
    $stmt = $pdo->prepare("SELECT * FROM pdfs WHERE id = ?");
    $stmt->execute([$pdfId]);
    $pdf = $stmt->fetch(PDO::FETCH_ASSOC);

    // Clear any output buffer before sending JSON
    while (ob_get_level()) {
        ob_end_clean();
    }
    ob_start();
    
    http_response_code(201);
    header('Content-Type: application/json');
    echo json_encode([
        'message' => 'PDF uploaded successfully',
        'pdf' => [
            'id' => (int)$pdf['id'],
            'user_id' => $pdf['user_id'] ? (int)$pdf['user_id'] : null,
            'filename' => $pdf['filename'],
            'original_name' => $pdf['original_name'],
            'path' => $pdf['path'],
            'file_size' => (int)$pdf['file_size'],
            'content_length' => strlen($pdf['content_text'] ?? ''),
            'created_at' => $pdf['created_at'],
        ],
        'url' => '/' . $relativePath
    ]);
    ob_end_flush();
    exit; // Ensure no other output

} catch (PDOException $e) {
    // Clear any output buffer before sending JSON
    while (ob_get_level()) {
        ob_end_clean();
    }
    ob_start();
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'error' => 'Database error',
        'message' => $e->getMessage()
    ]);
    ob_end_flush();
    exit;
} catch (Exception $e) {
    // Clear any output buffer before sending JSON
    while (ob_get_level()) {
        ob_end_clean();
    }
    ob_start();
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode([
        'error' => 'Upload failed',
        'message' => $e->getMessage()
    ]);
    ob_end_flush();
    exit;
} catch (Throwable $e) {
    // Catch any other errors (including PHP 7+ Throwable)
    while (ob_get_level()) {
        ob_end_clean();
    }
    ob_start();
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'error' => 'Server error',
        'message' => $e->getMessage(),
        'type' => get_class($e)
    ]);
    ob_end_flush();
    exit;
}


