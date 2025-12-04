<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'college',
        'course',
        'year',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
        ];
    }

    // Relationships
    public function pdfs()
    {
        return $this->hasMany(PDF::class);
    }

    public function highlights()
    {
        return $this->hasMany(Highlight::class);
    }

    public function importantQuestions()
    {
        return $this->belongsToMany(Question::class, 'important_questions')
                    ->withTimestamps();
    }

    public function tests()
    {
        return $this->hasMany(Test::class);
    }
}

