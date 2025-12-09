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

CRITICAL INSTRUCTIONS:
1. Questions and answers MUST be completely different - never use the same text for both question and answer
2. Questions should be exam-style questions (e.g., "What is...?", "Explain...", "Describe...", "Compare...")
3. DO NOT use prefixes like "Explain and solve the following problem:", "Solve the following:", "What is the solution to:" - just write the question directly
4. DO NOT use generic words, pronouns, or common words like "This", "These", "That", "Then", "There", "It", "They", "We", "You" as the main topic in questions (e.g., avoid "Describe This in detail" or "Write about Then" - instead use actual concepts like "Describe photosynthesis in detail" or "Write about cellular respiration")
5. Questions must reference specific concepts, topics, or subjects from the PDF content - never use vague references, pronouns, or generic words
6. Extract actual nouns, concepts, or topics from the content - never use pronouns or function words as topics
7. Answers should be detailed explanations that answer the question, not just repeat the question text
8. Generate an appropriate mix of questions:
   - 1-mark questions: Simple recall, definitions, basic facts (generate 3-5 questions)
     Example: Question: "What is photosynthesis?" Answer: "Photosynthesis is the process by which plants convert light energy into chemical energy..."
   - 2-mark questions: Short explanations, brief comparisons (generate 3-5 questions)
     Example: Question: "Explain the difference between mitosis and meiosis." Answer: "Mitosis produces two identical daughter cells for growth and repair, while meiosis produces four genetically different gametes for reproduction..."
   - 3-mark questions: Detailed explanations, step-by-step processes (generate 2-4 questions)
     Example: Question: "Describe the process of protein synthesis in detail." Answer: "Protein synthesis involves transcription where DNA is copied to mRNA in the nucleus, followed by translation where mRNA is read by ribosomes to assemble amino acids into proteins..."
   - 10-mark questions: Comprehensive answers, essays, detailed analysis (generate 1-2 questions)
     Example: Question: "Discuss the causes and consequences of climate change." Answer: "Climate change is caused by greenhouse gas emissions from human activities such as burning fossil fuels, deforestation, and industrial processes. The consequences include rising global temperatures, melting ice caps, sea level rise, extreme weather events, and impacts on biodiversity..."
9. Each question must have a detailed answer appropriate for its mark value
10. Questions should cover different topics/concepts from the PDF
11. Answers should be accurate, comprehensive, and educational
12. DO NOT use passage text directly as questions - convert passages into proper exam questions
13. Always extract the actual subject/concept from the content - if a passage mentions "Then the process continues", extract "the process" not "Then"

Respond ONLY with valid JSON in this exact format:
{
  "questions": [
    {
      "question_text": "Question text here (must be different from answer)",
      "answer_text": "Detailed answer here (must be different from question)",
      "marks": 1
    },
    {
      "question_text": "Question text here (must be different from answer)",
      "answer_text": "Detailed answer here (must be different from question)",
      "marks": 2
    }
  ]
}

Important: Return ONLY the JSON object, no markdown formatting, no explanations, no code blocks. Ensure every question_text is different from its corresponding answer_text.
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

            $questionText = trim($question['question_text']);
            $answerText = trim($question['answer_text']);
            
            // Skip if question or answer is empty
            if (empty($questionText) || empty($answerText)) {
                continue;
            }
            
            // Skip if question and answer are the same or too similar
            if ($questionText === $answerText || 
                strtolower($questionText) === strtolower($answerText) ||
                strlen($questionText) === strlen($answerText) && similar_text($questionText, $answerText) > 90) {
                continue; // Skip questions where question and answer are identical
            }
            
            // Ensure answer is longer than question (answers should contain more detail)
            if (strlen($answerText) <= strlen($questionText)) {
                continue; // Skip if answer is not longer than question
            }

            $marks = isset($question['marks']) ? (int)$question['marks'] : 1;
            
            // Ensure marks are valid
            if (!in_array($marks, $validMarks)) {
                $marks = 1; // Default to 1 mark
            }

            $validated[] = [
                'question_text' => $questionText,
                'answer_text' => $answerText,
                'marks' => $marks,
            ];
        }

        if (empty($validated)) {
            throw new \Exception('No valid questions generated');
        }

        return $validated;
    }
}



