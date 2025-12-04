<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Test;
use App\Models\TestAnswer;
use App\Models\TestAnswerHighlight;
use App\Models\PDF;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TestController extends Controller
{
    /**
     * Create a new test
     */
    public function create(Request $request)
    {
        $request->validate([
            'pdf_id' => 'required|exists:pdfs,id',
            'total_marks' => 'required|integer',
            'time_limit_minutes' => 'sometimes|integer|default:60',
        ]);

        $pdf = PDF::where('user_id', Auth::id())->findOrFail($request->pdf_id);

        $test = Test::create([
            'user_id' => Auth::id(),
            'pdf_id' => $pdf->id,
            'total_marks' => $request->total_marks,
            'time_limit_minutes' => $request->time_limit_minutes ?? 60,
            'started_at' => now(),
        ]);

        return response()->json([
            'message' => 'Test created successfully',
            'test' => $test,
        ], 201);
    }

    /**
     * Get test details
     */
    public function show($id)
    {
        $test = Test::where('user_id', Auth::id())
                    ->with(['answers.question', 'pdf'])
                    ->findOrFail($id);

        return response()->json([
            'test' => $test,
        ]);
    }

    /**
     * Get user's tests
     */
    public function index()
    {
        $tests = Test::where('user_id', Auth::id())
                    ->with('pdf')
                    ->latest()
                    ->get();

        return response()->json([
            'tests' => $tests,
        ]);
    }

    /**
     * Save test answer
     */
    public function saveAnswer(Request $request, $testId)
    {
        $test = Test::where('user_id', Auth::id())->findOrFail($testId);

        $request->validate([
            'question_id' => 'required|exists:questions,id',
            'answer_text' => 'nullable|string',
            'input_mode' => 'sometimes|string|in:text,voice',
        ]);

        $answer = TestAnswer::updateOrCreate(
            [
                'test_id' => $testId,
                'question_id' => $request->question_id,
            ],
            [
                'answer_text' => $request->answer_text,
                'input_mode' => $request->input_mode ?? 'text',
            ]
        );

        return response()->json([
            'message' => 'Answer saved successfully',
            'answer' => $answer,
        ]);
    }

    /**
     * Save test answer highlights
     */
    public function saveAnswerHighlights(Request $request, $testId, $answerId)
    {
        $answer = TestAnswer::where('test_id', $testId)
                           ->whereHas('test', function($query) {
                               $query->where('user_id', Auth::id());
                           })
                           ->findOrFail($answerId);

        $request->validate([
            'highlight_data' => 'required|array',
        ]);

        $highlight = TestAnswerHighlight::updateOrCreate(
            [
                'test_answer_id' => $answerId,
            ],
            [
                'highlight_data' => $request->highlight_data,
            ]
        );

        return response()->json([
            'message' => 'Answer highlights saved',
            'highlight' => $highlight,
        ]);
    }

    /**
     * Submit test
     */
    public function submit(Request $request, $id)
    {
        $test = Test::where('user_id', Auth::id())->findOrFail($id);

        // Calculate marks (simplified - in production, use AI or manual grading)
        $answers = $test->answers;
        $totalMarks = 0;
        
        foreach ($answers as $answer) {
            // Simple scoring logic - can be enhanced
            if ($answer->answer_text && strlen($answer->answer_text) > 10) {
                $totalMarks += $answer->question->marks; // Full marks for now
            }
        }

        $test->update([
            'completed_at' => now(),
            'marks_obtained' => $totalMarks,
        ]);

        return response()->json([
            'message' => 'Test submitted successfully',
            'test' => $test->fresh(),
        ]);
    }
}

