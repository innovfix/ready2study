<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PDF extends Model
{
    use HasFactory;

    protected $table = 'pdfs';

    protected $fillable = [
        'user_id',
        'filename',
        'path',
        'content_text',
        'original_name',
        'file_size',
        'upload_date',
    ];

    protected $casts = [
        'upload_date' => 'datetime',
    ];

    // Relationships
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function questions()
    {
        return $this->hasMany(Question::class, 'pdf_id');
    }

    public function tests()
    {
        return $this->hasMany(Test::class);
    }
}

