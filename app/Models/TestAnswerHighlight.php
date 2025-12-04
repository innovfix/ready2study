<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TestAnswerHighlight extends Model
{
    use HasFactory;

    protected $table = 'test_answer_highlights';

    protected $fillable = [
        'test_answer_id',
        'highlight_data',
    ];

    protected $casts = [
        'highlight_data' => 'array',
    ];

    // Relationships
    public function testAnswer()
    {
        return $this->belongsTo(TestAnswer::class);
    }
}

