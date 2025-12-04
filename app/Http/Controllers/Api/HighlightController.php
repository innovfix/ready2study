<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Highlight;
use App\Models\Question;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class HighlightController extends Controller
{
    /**
     * Get highlights for a question
     */
    public function show($questionId)
    {
        $question = Question::findOrFail($questionId);
        
        $highlight = Highlight::where('user_id', Auth::id())
                              ->where('question_id', $questionId)
                              ->first();

        return response()->json([
            'highlight' => $highlight ? $highlight->highlight_data : [],
        ]);
    }

    /**
     * Save highlights for a question
     */
    public function store(Request $request, $questionId)
    {
        $question = Question::findOrFail($questionId);

        $request->validate([
            'highlight_data' => 'required|array',
        ]);

        $highlight = Highlight::updateOrCreate(
            [
                'user_id' => Auth::id(),
                'question_id' => $questionId,
            ],
            [
                'highlight_data' => $request->highlight_data,
            ]
        );

        return response()->json([
            'message' => 'Highlights saved successfully',
            'highlight' => $highlight,
        ]);
    }

    /**
     * Delete highlights for a question
     */
    public function destroy($questionId)
    {
        Highlight::where('user_id', Auth::id())
                 ->where('question_id', $questionId)
                 ->delete();

        return response()->json([
            'message' => 'Highlights deleted successfully',
        ]);
    }

    /**
     * Get all highlights for user
     */
    public function index()
    {
        $highlights = Highlight::where('user_id', Auth::id())
                              ->with('question')
                              ->get();

        return response()->json([
            'highlights' => $highlights,
        ]);
    }
}

