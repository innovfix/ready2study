<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Question;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ImportantQuestionController extends Controller
{
    /**
     * Get all important questions for user
     */
    public function index()
    {
        $importantQuestions = Auth::user()
            ->importantQuestions()
            ->with('pdf')
            ->get();

        return response()->json([
            'important_questions' => $importantQuestions,
        ]);
    }

    /**
     * Mark question as important
     */
    public function store(Request $request, $questionId)
    {
        $question = Question::findOrFail($questionId);

        Auth::user()->importantQuestions()->syncWithoutDetaching([$questionId]);

        return response()->json([
            'message' => 'Question marked as important',
            'question' => $question,
        ], 201);
    }

    /**
     * Remove question from important
     */
    public function destroy($questionId)
    {
        Auth::user()->importantQuestions()->detach($questionId);

        return response()->json([
            'message' => 'Question removed from important',
        ]);
    }

    /**
     * Check if question is important
     */
    public function check($questionId)
    {
        $isImportant = Auth::user()
            ->importantQuestions()
            ->where('question_id', $questionId)
            ->exists();

        return response()->json([
            'is_important' => $isImportant,
        ]);
    }
}

