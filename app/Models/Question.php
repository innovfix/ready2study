<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Question extends Model
{
    use HasFactory;

    protected $fillable = [
        'pdf_id',
        'question_text',
        'answer_text',
        'marks',
        'exam_date',
    ];

    // Relationships
    public function pdf()
    {
        return $this->belongsTo(PDF::class, 'pdf_id');
    }

    public function highlights()
    {
        return $this->hasMany(Highlight::class);
    }

    public function importantUsers()
    {
        return $this->belongsToMany(User::class, 'important_questions')
                    ->withTimestamps();
    }

    public function media()
    {
        return $this->hasMany(QuestionMedia::class);
    }

    public function testAnswers()
    {
        return $this->hasMany(TestAnswer::class);
    }
}

