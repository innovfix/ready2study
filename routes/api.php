<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\PDFController;
use App\Http\Controllers\Api\QuestionController;
use App\Http\Controllers\Api\HighlightController;
use App\Http\Controllers\Api\ImportantQuestionController;
use App\Http\Controllers\Api\MediaController;
use App\Http\Controllers\Api\TestController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group.
|
*/

// Public routes
Route::get('/csrf-token', [AuthController::class, 'csrfToken']);
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Protected routes - using web auth for session-based authentication
Route::middleware('auth:web')->group(function () {
    // Authentication
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);

    // User profile
    Route::get('/profile', [UserController::class, 'profile']);
    Route::put('/profile', [UserController::class, 'update']);

    // PDFs
    Route::post('/pdfs/upload', [PDFController::class, 'upload']);
    Route::get('/pdfs', [PDFController::class, 'index']);
    Route::get('/pdfs/{id}', [PDFController::class, 'show']);
    Route::put('/pdfs/{id}/content', [PDFController::class, 'updateContent']);
    Route::post('/pdfs/{id}/generate-questions', [PDFController::class, 'generateQuestions']);
    Route::delete('/pdfs/{id}', [PDFController::class, 'destroy']);

    // Questions
    Route::get('/questions', [QuestionController::class, 'index']);
    Route::post('/questions', [QuestionController::class, 'store']);
    Route::put('/questions/{id}', [QuestionController::class, 'update']);
    Route::delete('/questions/{id}', [QuestionController::class, 'destroy']);

    // Highlights
    Route::get('/highlights', [HighlightController::class, 'index']);
    Route::get('/highlights/{questionId}', [HighlightController::class, 'show']);
    Route::post('/highlights/{questionId}', [HighlightController::class, 'store']);
    Route::delete('/highlights/{questionId}', [HighlightController::class, 'destroy']);

    // Important Questions
    Route::get('/important-questions', [ImportantQuestionController::class, 'index']);
    Route::post('/important-questions/{questionId}', [ImportantQuestionController::class, 'store']);
    Route::delete('/important-questions/{questionId}', [ImportantQuestionController::class, 'destroy']);
    Route::get('/important-questions/{questionId}/check', [ImportantQuestionController::class, 'check']);

    // Media
    Route::get('/questions/{questionId}/media', [MediaController::class, 'index']);
    Route::post('/questions/{questionId}/media', [MediaController::class, 'store']);
    Route::delete('/questions/{questionId}/media/{mediaId}', [MediaController::class, 'destroy']);

    // Tests
    Route::post('/tests', [TestController::class, 'create']);
    Route::get('/tests', [TestController::class, 'index']);
    Route::get('/tests/{id}', [TestController::class, 'show']);
    Route::post('/tests/{testId}/answers', [TestController::class, 'saveAnswer']);
    Route::post('/tests/{testId}/answers/{answerId}/highlights', [TestController::class, 'saveAnswerHighlights']);
    Route::post('/tests/{id}/submit', [TestController::class, 'submit']);
});

