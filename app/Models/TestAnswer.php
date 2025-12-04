<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TestAnswer extends Model
{
    use HasFactory;

    protected $fillable = [
        'test_id',
        'question_id',
        'answer_text',
        'input_mode',
        'marks_obtained',
    ];

    // Relationships
    public function test()
    {
        return $this->belongsTo(Test::class);
    }

    public function question()
    {
        return $this->belongsTo(Question::class);
    }

    public function highlights()
    {
        return $this->hasMany(TestAnswerHighlight::class);
    }
}

