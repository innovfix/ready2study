<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Question;
use App\Models\PDF;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class QuestionController extends Controller
{
    /**
     * Get questions for a PDF
     */
    public function index(Request $request)
    {
        $request->validate([
            'pdf_id' => 'required|exists:pdfs,id',
        ]);

        $pdf = PDF::where('user_id', Auth::id())->findOrFail($request->pdf_id);
        
        $questions = $pdf->questions()
            ->with('media')
            ->get();

        return response()->json([
            'questions' => $questions,
        ]);
    }

    /**
     * Create questions (bulk)
     */
    public function store(Request $request)
    {
        $request->validate([
            'pdf_id' => 'required|exists:pdfs,id',
            'questions' => 'required|array',
            'questions.*.question_text' => 'required|string',
            'questions.*.answer_text' => 'required|string',
            'questions.*.marks' => 'required|integer|in:1,2,3,10',
            'questions.*.exam_date' => 'nullable|string',
        ]);

        $pdf = PDF::where('user_id', Auth::id())->findOrFail($request->pdf_id);

        $createdQuestions = [];
        foreach ($request->questions as $questionData) {
            $question = Question::create([
                'pdf_id' => $pdf->id,
                'question_text' => $questionData['question_text'],
                'answer_text' => $questionData['answer_text'],
                'marks' => $questionData['marks'],
                'exam_date' => $questionData['exam_date'] ?? null,
            ]);
            $createdQuestions[] = $question;
        }

        return response()->json([
            'message' => 'Questions created successfully',
            'questions' => $createdQuestions,
        ], 201);
    }

    /**
     * Update a question
     */
    public function update(Request $request, $id)
    {
        $question = Question::whereHas('pdf', function($query) {
            $query->where('user_id', Auth::id());
        })->findOrFail($id);

        $request->validate([
            'question_text' => 'sometimes|string',
            'answer_text' => 'sometimes|string',
            'marks' => 'sometimes|integer|in:1,2,3,10',
        ]);

        $question->update($request->only(['question_text', 'answer_text', 'marks']));

        return response()->json([
            'message' => 'Question updated successfully',
            'question' => $question,
        ]);
    }

    /**
     * Delete a question
     */
    public function destroy($id)
    {
        $question = Question::whereHas('pdf', function($query) {
            $query->where('user_id', Auth::id());
        })->findOrFail($id);

        $question->delete();

        return response()->json([
            'message' => 'Question deleted successfully',
        ]);
    }
}

