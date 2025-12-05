<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PDF;
use App\Models\Question;
use App\Services\QuestionGeneratorService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class PDFController extends Controller
{
    /**
     * Upload PDF
     */
    public function upload(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:pdf', // No size limit
            'content_text' => 'nullable|string',
        ]);

        $user = Auth::user();
        $file = $request->file('file');
        
        // Store file
        $filename = time() . '_' . $file->getClientOriginalName();
        $path = $file->storeAs('pdfs', $filename, 'public');

        // Extract text from PDF if content_text not provided
        $contentText = $request->content_text;
        if (empty($contentText)) {
            try {
                $contentText = $this->extractTextFromPDF($file);
            } catch (\Exception $e) {
                Log::warning('PDF text extraction failed', [
                    'error' => $e->getMessage(),
                    'pdf_id' => null,
                ]);
                // Continue without extracted text - user can provide it manually
            }
        }

        // Create PDF record
        $pdf = PDF::create([
            'user_id' => $user->id,
            'filename' => $filename,
            'path' => $path,
            'content_text' => $contentText,
            'original_name' => $file->getClientOriginalName(),
            'file_size' => $file->getSize(),
        ]);

        return response()->json([
            'message' => 'PDF uploaded successfully',
            'pdf' => $pdf,
            'url' => Storage::url($path),
        ], 201);
    }

    /**
     * Get user's PDFs
     */
    public function index()
    {
        $pdfs = Auth::user()->pdfs()->with('questions')->latest()->get();
        
        return response()->json([
            'pdfs' => $pdfs,
        ]);
    }

    /**
     * Get specific PDF
     */
    public function show($id)
    {
        $pdf = PDF::where('user_id', Auth::id())
                  ->with('questions')
                  ->findOrFail($id);

        return response()->json([
            'pdf' => $pdf,
            'url' => Storage::url($pdf->path),
        ]);
    }

    /**
     * Update PDF content text
     */
    public function updateContent(Request $request, $id)
    {
        $pdf = PDF::where('user_id', Auth::id())->findOrFail($id);

        $request->validate([
            'content_text' => 'required|string',
        ]);

        $pdf->update([
            'content_text' => $request->content_text,
        ]);

        return response()->json([
            'message' => 'PDF content updated',
            'pdf' => $pdf,
        ]);
    }

    /**
     * Delete PDF
     */
    public function destroy($id)
    {
        $pdf = PDF::where('user_id', Auth::id())->findOrFail($id);
        
        // Delete file
        Storage::disk('public')->delete($pdf->path);
        
        // Delete PDF (cascade will delete questions)
        $pdf->delete();

        return response()->json([
            'message' => 'PDF deleted successfully',
        ]);
    }

    /**
     * Generate questions from PDF using AI
     */
    public function generateQuestions(Request $request, $id)
    {
        $pdf = PDF::where('user_id', Auth::id())->findOrFail($id);

        if (empty($pdf->content_text)) {
            return response()->json([
                'message' => 'PDF content is empty. Please upload PDF content first.',
                'error' => 'NO_CONTENT',
            ], 400);
        }

        try {
            $generator = new QuestionGeneratorService();
            $generatedQuestions = $generator->generateQuestions($pdf->content_text);

            // Bulk create questions directly
            $createdQuestions = [];
            foreach ($generatedQuestions as $questionData) {
                $question = \App\Models\Question::create([
                    'pdf_id' => $pdf->id,
                    'question_text' => $questionData['question_text'],
                    'answer_text' => $questionData['answer_text'],
                    'marks' => $questionData['marks'],
                    'exam_date' => null,
                ]);
                $createdQuestions[] = $question;
            }

            return response()->json([
                'message' => 'Questions generated successfully',
                'questions' => $createdQuestions,
                'count' => count($createdQuestions),
            ], 201);

        } catch (\Exception $e) {
            Log::error('Question generation failed', [
                'pdf_id' => $pdf->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Failed to generate questions: ' . $e->getMessage(),
                'error' => 'GENERATION_FAILED',
            ], 500);
        }
    }

    /**
     * Extract text from PDF file
     */
    private function extractTextFromPDF($file): string
    {
        // Check if smalot/pdfparser is available
        if (!class_exists('\Smalot\PdfParser\Parser')) {
            throw new \Exception('PDF parser library not installed. Please run: composer require smalot/pdfparser');
        }

        try {
            $parser = new \Smalot\PdfParser\Parser();
            $pdf = $parser->parseFile($file->getRealPath());
            $text = $pdf->getText();

            if (empty(trim($text))) {
                throw new \Exception('No text could be extracted from PDF');
            }

            return $text;
        } catch (\Exception $e) {
            Log::error('PDF text extraction error', [
                'error' => $e->getMessage(),
            ]);
            throw new \Exception('Failed to extract text from PDF: ' . $e->getMessage());
        }
    }
}

