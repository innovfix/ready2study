<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Test extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'pdf_id',
        'total_marks',
        'time_limit_minutes',
        'started_at',
        'completed_at',
        'marks_obtained',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function pdf()
    {
        return $this->belongsTo(PDF::class);
    }

    public function answers()
    {
        return $this->hasMany(TestAnswer::class);
    }
}

