<?php
/**
 * Standalone Chat Endpoint (OpenAI proxy)
 * - Avoids browser CORS issues
 * - Keeps API key on server (.env / environment variable)
 *
 * Request (POST JSON):
 * {
 *   "message": "string",
 *   "question": "optional string",
 *   "answer": "optional string",
 *   "marks": 1|2|3|10 (optional),
 *   "history": [{ "role": "user"|"assistant", "content": "..." }, ...] (optional)
 * }
 *
 * Response (JSON):
 * { "reply": "..." }
 */

// Error reporting (log, don't display)
error_reporting(E_ALL);
ini_set('display_errors', '0');
ini_set('log_errors', '1');

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(200);
    exit;
}

function sendJson(int $status, array $data): void {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function readDotEnvVars(string $envPath): array {
    if (!is_file($envPath)) return [];

    $vars = [];
    $lines = @file($envPath, FILE_IGNORE_NEW_LINES);
    if (!is_array($lines)) return [];

    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#')) continue;
        if (!str_contains($line, '=')) continue;

        [$k, $v] = explode('=', $line, 2);
        $k = trim($k);
        $v = trim($v);

        // Strip quotes
        if ($v !== '' && ((str_starts_with($v, '"') && str_ends_with($v, '"')) || (str_starts_with($v, "'") && str_ends_with($v, "'")))) {
            $v = substr($v, 1, -1);
        }

        if ($k !== '') $vars[$k] = $v;
    }
    return $vars;
}

function getConfig(string $key, array $dotenvVars, string $default = ''): string {
    $envVal = getenv($key);
    if ($envVal !== false && $envVal !== '') return (string)$envVal;
    if (isset($dotenvVars[$key]) && $dotenvVars[$key] !== '') return (string)$dotenvVars[$key];
    return $default;
}

function safeTrim(?string $value, int $maxLen): string {
    $v = trim((string)$value);
    if (mb_strlen($v) > $maxLen) {
        $v = mb_substr($v, 0, $maxLen);
    }
    return $v;
}

function openAiHttpPost(string $url, array $headers, array $payload, int $timeoutSec = 30): array {
    $body = json_encode($payload);
    if ($body === false) {
        return [
            'ok' => false,
            'status' => 500,
            'error' => 'Failed to encode request payload as JSON.',
            'raw' => null
        ];
    }

    // Prefer cURL when available
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_POSTFIELDS => $body,
            CURLOPT_TIMEOUT => $timeoutSec,
        ]);
        $respBody = curl_exec($ch);
        $curlErr = curl_error($ch);
        $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($respBody === false) {
            return [
                'ok' => false,
                'status' => 500,
                'error' => 'cURL error: ' . ($curlErr ?: 'Unknown error'),
                'raw' => null
            ];
        }

        return [
            'ok' => $status >= 200 && $status < 300,
            'status' => $status,
            'error' => null,
            'raw' => $respBody
        ];
    }

    // Fallback: PHP streams
    $context = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => implode("\r\n", $headers),
            'content' => $body,
            'timeout' => $timeoutSec,
        ],
    ]);

    $respBody = @file_get_contents($url, false, $context);
    $status = 0;
    if (isset($http_response_header) && is_array($http_response_header)) {
        foreach ($http_response_header as $h) {
            if (preg_match('/^HTTP\\/(?:1\\.1|2)\\s+(\\d{3})\\b/i', $h, $m)) {
                $status = (int)$m[1];
                break;
            }
        }
    }

    if ($respBody === false) {
        return [
            'ok' => false,
            'status' => $status ?: 500,
            'error' => 'HTTP request failed (file_get_contents).',
            'raw' => null
        ];
    }

    return [
        'ok' => $status >= 200 && $status < 300,
        'status' => $status,
        'error' => null,
        'raw' => $respBody
    ];
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    sendJson(405, ['error' => 'Method not allowed']);
}

$rawInput = file_get_contents('php://input');
$input = json_decode($rawInput ?: '', true);
if (!is_array($input)) {
    sendJson(400, [
        'error' => 'Invalid JSON',
        'message' => 'Request body must be valid JSON.'
    ]);
}

$message = safeTrim($input['message'] ?? '', 4000);
$question = safeTrim($input['question'] ?? '', 4000);
$answer = safeTrim($input['answer'] ?? '', 12000);
$marks = (int)($input['marks'] ?? 0);
$history = $input['history'] ?? [];

if ($message === '') {
    sendJson(422, ['error' => 'Validation error', 'message' => 'message is required']);
}

// Load .env (if present) so standalone endpoints can use the same key as Laravel.
$dotenvVars = readDotEnvVars(__DIR__ . '/../.env');

$apiKey =
    getConfig('OPENAI_API_KEY', $dotenvVars) ?:
    getConfig('CHATGPT_API_KEY', $dotenvVars) ?:
    getConfig('OPENAI_KEY', $dotenvVars);

if (!$apiKey) {
    sendJson(503, [
        'error' => 'AI not configured',
        'message' => 'OpenAI API key is not configured on the server. Create/Update the .env file in the project root with: OPENAI_API_KEY=your_key_here'
    ]);
}

$model = getConfig('OPENAI_MODEL', $dotenvVars, 'gpt-4o-mini');

// Build messages (system + optional history + user)
$systemPrompt = "You are Ready2Study AI, a helpful study assistant. "
    . "Explain concepts clearly and step-by-step, using simple language. "
    . "Reply in the same language as the student's message (Tamil/English). "
    . "If the student uses Tamil-English (e.g. 'na enna'), reply in simple Tamil with common English technical words when useful. "
    . "If a question + correct answer are provided, treat the provided answer as the source of truth and explain it (do not contradict it).";

$messages = [
    ['role' => 'system', 'content' => $systemPrompt]
];

// Keep a small recent history to support follow-up questions.
if (is_array($history)) {
    $maxHistory = 10;
    $count = 0;
    foreach ($history as $item) {
        if ($count >= $maxHistory) break;
        if (!is_array($item)) continue;
        $role = $item['role'] ?? '';
        $content = $item['content'] ?? '';
        if (!in_array($role, ['user', 'assistant'], true)) continue;
        $content = safeTrim($content, 4000);
        if ($content === '') continue;
        $messages[] = ['role' => $role, 'content' => $content];
        $count++;
    }
}

$userPrompt = $message;
if ($question !== '' && $answer !== '') {
    $marksLabel = $marks > 0 ? "{$marks}-mark" : 'exam';
    $userPrompt =
        "Context:\n"
        . "- {$marksLabel} Question: {$question}\n"
        . "- Correct Answer (do not change): {$answer}\n\n"
        . "Student message: {$message}\n\n"
        . "Task: Explain the correct answer clearly. If helpful, give a short example or memory tip.";
}

$messages[] = ['role' => 'user', 'content' => $userPrompt];

$payload = [
    'model' => $model,
    'messages' => $messages,
    'temperature' => 0.5,
    'max_tokens' => 700,
];

$result = openAiHttpPost(
    'https://api.openai.com/v1/chat/completions',
    [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $apiKey,
    ],
    $payload,
    35
);

if (!$result['ok']) {
    $raw = $result['raw'];
    $details = null;
    if (is_string($raw) && $raw !== '') {
        $parsed = json_decode($raw, true);
        if (is_array($parsed)) {
            $details = $parsed['error']['message'] ?? ($parsed['message'] ?? null);
        }
    }
    sendJson(502, [
        'error' => 'AI request failed',
        'message' => $details ?: ($result['error'] ?: ('HTTP ' . $result['status'])),
        'status' => $result['status'],
    ]);
}

$data = json_decode((string)$result['raw'], true);
if (!is_array($data)) {
    sendJson(502, [
        'error' => 'AI response invalid',
        'message' => 'OpenAI returned an invalid JSON response.',
    ]);
}

$reply = $data['choices'][0]['message']['content'] ?? '';
$reply = is_string($reply) ? trim($reply) : '';

if ($reply === '') {
    sendJson(502, [
        'error' => 'AI response empty',
        'message' => 'OpenAI returned an empty response.'
    ]);
}

sendJson(200, [
    'reply' => $reply,
    'model' => $model,
]);

