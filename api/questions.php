<?php
/**
 * Standalone Questions Endpoint
 * Handles bulk creation of questions linked to a PDF
 */

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Set error handler for fatal errors
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
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Handle GET requests for fetching questions
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        // Get PDF ID from query parameter
        $pdfId = isset($_GET['pdf_id']) ? (int)$_GET['pdf_id'] : null;
        
        if (!$pdfId) {
            http_response_code(400);
            echo json_encode([
                'error' => 'Missing parameter',
                'message' => 'pdf_id parameter is required'
            ]);
            exit;
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

        // Fetch questions for the PDF
        $stmt = $pdo->prepare("SELECT * FROM questions WHERE pdf_id = ? ORDER BY id ASC");
        $stmt->execute([$pdfId]);
        $questions = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Format questions for response
        $formattedQuestions = array_map(function($q) {
            return [
                'id' => (int)$q['id'],
                'pdf_id' => (int)$q['pdf_id'],
                'question_text' => $q['question_text'],
                'answer_text' => $q['answer_text'],
                'marks' => (int)$q['marks'],
                'exam_date' => $q['exam_date'],
                'created_at' => $q['created_at'],
            ];
        }, $questions);

        http_response_code(200);
        echo json_encode([
            'questions' => $formattedQuestions,
            'count' => count($formattedQuestions)
        ]);
        exit;

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'error' => 'Database error',
            'message' => $e->getMessage()
        ]);
        exit;
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'error' => 'Failed to fetch questions',
            'message' => $e->getMessage()
        ]);
        exit;
    }
}

// Only allow POST for creation
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed', 'method' => $_SERVER['REQUEST_METHOD']]);
    exit;
}

try {
    // Get JSON input
    $rawInput = file_get_contents('php://input');
    $input = json_decode($rawInput, true);

    if (!$input && json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        echo json_encode([
            'error' => 'Invalid JSON',
            'json_error' => json_last_error_msg()
        ]);
        exit;
    }

    // Validate required fields
    if (empty($input['pdf_id'])) {
        http_response_code(422);
        echo json_encode([
            'error' => 'Missing required field',
            'message' => 'pdf_id is required'
        ]);
        exit;
    }

    if (empty($input['questions']) || !is_array($input['questions'])) {
        http_response_code(422);
        echo json_encode([
            'error' => 'Missing required field',
            'message' => 'questions array is required'
        ]);
        exit;
    }

    $pdfId = (int)$input['pdf_id'];
    $questions = $input['questions'];

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

    // Verify PDF exists
    $stmt = $pdo->prepare("SELECT id FROM pdfs WHERE id = ?");
    $stmt->execute([$pdfId]);
    if (!$stmt->fetch()) {
        http_response_code(404);
        echo json_encode([
            'error' => 'PDF not found',
            'message' => "PDF with ID {$pdfId} does not exist"
        ]);
        exit;
    }

    // Create questions table if it doesn't exist
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS questions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            pdf_id INT NOT NULL,
            question_text TEXT NOT NULL,
            answer_text TEXT,
            marks INT NOT NULL DEFAULT 1,
            exam_date DATE NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_pdf_id (pdf_id),
            FOREIGN KEY (pdf_id) REFERENCES pdfs(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");

    // Insert questions in bulk
    $createdQuestions = [];
    $stmt = $pdo->prepare("
        INSERT INTO questions (pdf_id, question_text, answer_text, marks, exam_date, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, NOW(), NOW())
    ");

    $pdo->beginTransaction();
    
    try {
        foreach ($questions as $question) {
            // Validate each question
            if (empty($question['question_text'])) {
                throw new Exception('Each question must have question_text');
            }

            $examDate = null;
            if (!empty($question['exam_date'])) {
                $examDate = date('Y-m-d', strtotime($question['exam_date']));
            }

            $stmt->execute([
                $pdfId,
                $question['question_text'],
                $question['answer_text'] ?? '',
                (int)($question['marks'] ?? 1),
                $examDate
            ]);

            $questionId = $pdo->lastInsertId();

            // Fetch the created question
            $fetchStmt = $pdo->prepare("SELECT * FROM questions WHERE id = ?");
            $fetchStmt->execute([$questionId]);
            $createdQuestion = $fetchStmt->fetch(PDO::FETCH_ASSOC);
            
            $createdQuestions[] = [
                'id' => (int)$createdQuestion['id'],
                'pdf_id' => (int)$createdQuestion['pdf_id'],
                'question_text' => $createdQuestion['question_text'],
                'answer_text' => $createdQuestion['answer_text'],
                'marks' => (int)$createdQuestion['marks'],
                'exam_date' => $createdQuestion['exam_date'],
                'created_at' => $createdQuestion['created_at'],
            ];
        }

        $pdo->commit();

        http_response_code(201);
        echo json_encode([
            'message' => 'Questions created successfully',
            'questions' => $createdQuestions,
            'count' => count($createdQuestions)
        ]);

    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Database error',
        'message' => $e->getMessage()
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Failed to create questions',
        'message' => $e->getMessage()
    ]);
}


