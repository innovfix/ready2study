<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class QuestionGeneratorService
{
    private $apiKey;
    private $apiUrl;

    public function __construct()
    {
        $this->apiKey = config('services.openrouter.api_key', env('OPENROUTER_API_KEY'));
        $this->apiUrl = config('services.openrouter.api_url', env('OPENROUTER_API_URL', 'https://openrouter.ai/api/v1/chat/completions'));
    }

    /**
     * Generate questions from PDF content using Claude Sonnet 4.5
     *
     * @param string $pdfContent The extracted text from PDF
     * @return array Array of questions with answers
     */
    public function generateQuestions(string $pdfContent): array
    {
        if (empty($pdfContent)) {
            throw new \Exception('PDF content is empty. Cannot generate questions.');
        }

        // Truncate content if too long (Claude has token limits)
        $maxLength = 100000; // ~25k tokens
        if (strlen($pdfContent) > $maxLength) {
            $pdfContent = substr($pdfContent, 0, $maxLength) . '... [Content truncated]';
        }

        $prompt = $this->buildPrompt($pdfContent);

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type' => 'application/json',
                'HTTP-Referer' => config('app.url', 'http://localhost'),
                'X-Title' => 'Ready2Study Question Generator',
            ])->timeout(120)->post($this->apiUrl, [
                'model' => 'anthropic/claude-3.5-sonnet',
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => 'You are an expert educational content generator. You create exam questions with detailed answers based on provided study material. Always respond with valid JSON only.'
                    ],
                    [
                        'role' => 'user',
                        'content' => $prompt
                    ]
                ],
                'temperature' => 0.7,
                'max_tokens' => 4000,
            ]);

            if (!$response->successful()) {
                Log::error('OpenRouter API Error', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
                throw new \Exception('Failed to generate questions: ' . $response->body());
            }

            $responseData = $response->json();
            
            if (!isset($responseData['choices'][0]['message']['content'])) {
                throw new \Exception('Invalid response from AI service');
            }

            $content = $responseData['choices'][0]['message']['content'];
            
            // Extract JSON from response (handle markdown code blocks)
            $jsonContent = $this->extractJson($content);
            
            $questions = json_decode($jsonContent, true);
            
            if (json_last_error() !== JSON_ERROR_NONE) {
                Log::error('JSON Parse Error', [
                    'error' => json_last_error_msg(),
                    'content' => $content,
                ]);
                throw new \Exception('Failed to parse AI response as JSON');
            }

            // Validate and normalize questions structure
            return $this->validateAndNormalizeQuestions($questions);

        } catch (\Exception $e) {
            Log::error('Question Generation Error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }

    /**
     * Build the prompt for question generation
     */
    private function buildPrompt(string $pdfContent): string
    {
        return <<<PROMPT
Analyze the following PDF content and generate exam questions with answers. The questions should be distributed across different mark categories (1 mark, 2 marks, 3 marks, and 10 marks) based on the complexity and depth of the content.

PDF Content:
{$pdfContent}

Instructions:
1. Analyze the content depth and complexity
2. Generate an appropriate mix of questions:
   - 1-mark questions: Simple recall, definitions, basic facts (generate 3-5 questions)
   - 2-mark questions: Short explanations, brief comparisons (generate 3-5 questions)
   - 3-mark questions: Detailed explanations, step-by-step processes (generate 2-4 questions)
   - 10-mark questions: Comprehensive answers, essays, detailed analysis (generate 1-2 questions)
3. Each question must have a detailed answer appropriate for its mark value
4. Questions should cover different topics/concepts from the PDF
5. Answers should be accurate, comprehensive, and educational

Respond ONLY with valid JSON in this exact format:
{
  "questions": [
    {
      "question_text": "Question text here",
      "answer_text": "Detailed answer here",
      "marks": 1
    },
    {
      "question_text": "Question text here",
      "answer_text": "Detailed answer here",
      "marks": 2
    }
  ]
}

Important: Return ONLY the JSON object, no markdown formatting, no explanations, no code blocks.
PROMPT;
    }

    /**
     * Extract JSON from response (handles markdown code blocks)
     */
    private function extractJson(string $content): string
    {
        // Remove markdown code blocks if present
        $content = preg_replace('/```json\s*/', '', $content);
        $content = preg_replace('/```\s*/', '', $content);
        $content = trim($content);

        // Try to find JSON object
        $start = strpos($content, '{');
        $end = strrpos($content, '}');
        
        if ($start !== false && $end !== false && $end > $start) {
            return substr($content, $start, $end - $start + 1);
        }

        return $content;
    }

    /**
     * Validate and normalize questions structure
     */
    private function validateAndNormalizeQuestions($questions): array
    {
        if (!is_array($questions)) {
            throw new \Exception('Questions must be an array');
        }

        if (!isset($questions['questions']) || !is_array($questions['questions'])) {
            throw new \Exception('Invalid questions structure');
        }

        $validated = [];
        $validMarks = [1, 2, 3, 10];

        foreach ($questions['questions'] as $question) {
            if (!isset($question['question_text']) || !isset($question['answer_text'])) {
                continue; // Skip invalid questions
            }

            $marks = isset($question['marks']) ? (int)$question['marks'] : 1;
            
            // Ensure marks are valid
            if (!in_array($marks, $validMarks)) {
                $marks = 1; // Default to 1 mark
            }

            $validated[] = [
                'question_text' => trim($question['question_text']),
                'answer_text' => trim($question['answer_text']),
                'marks' => $marks,
            ];
        }

        if (empty($validated)) {
            throw new \Exception('No valid questions generated');
        }

        return $validated;
    }
}


