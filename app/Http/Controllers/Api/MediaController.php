<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Question;
use App\Models\QuestionMedia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class MediaController extends Controller
{
    /**
     * Upload media for a question
     */
    public function store(Request $request, $questionId)
    {
        $question = Question::whereHas('pdf', function($query) {
            $query->where('user_id', Auth::id());
        })->findOrFail($questionId);

        $request->validate([
            'file' => 'required|file|mimes:jpeg,jpg,png,gif,mp4,avi,mov|max:10240', // 10MB max
        ]);

        $file = $request->file('file');
        $mediaType = strpos($file->getMimeType(), 'image/') !== false ? 'image' : 'video';
        
        $filename = time() . '_' . $file->getClientOriginalName();
        $path = $file->storeAs('media', $filename, 'public');

        $media = QuestionMedia::create([
            'question_id' => $questionId,
            'media_type' => $mediaType,
            'media_path' => $path,
            'original_filename' => $file->getClientOriginalName(),
        ]);

        return response()->json([
            'message' => 'Media uploaded successfully',
            'media' => $media,
            'url' => Storage::url($path),
        ], 201);
    }

    /**
     * Get media for a question
     */
    public function index($questionId)
    {
        $question = Question::findOrFail($questionId);
        
        $media = $question->media;

        return response()->json([
            'media' => $media->map(function($item) {
                return [
                    'id' => $item->id,
                    'media_type' => $item->media_type,
                    'url' => Storage::url($item->media_path),
                    'original_filename' => $item->original_filename,
                ];
            }),
        ]);
    }

    /**
     * Delete media
     */
    public function destroy($questionId, $mediaId)
    {
        $media = QuestionMedia::where('question_id', $questionId)
                              ->whereHas('question.pdf', function($query) {
                                  $query->where('user_id', Auth::id());
                              })
                              ->findOrFail($mediaId);

        Storage::disk('public')->delete($media->media_path);
        $media->delete();

        return response()->json([
            'message' => 'Media deleted successfully',
        ]);
    }
}

