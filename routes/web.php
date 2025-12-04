<?php

use App\Http\Controllers\PageController;
use App\Http\Controllers\Api\AuthController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group.
|
*/

// Home/Landing Page - PDF Upload
Route::get('/', [PageController::class, 'index'])->name('home');

// Student Information Form
Route::get('/student-info', [PageController::class, 'studentInfo'])->name('student.info');

// Questions Dashboard
Route::get('/dashboard', [PageController::class, 'dashboard'])->name('dashboard');

// Practice Test
Route::get('/test', [PageController::class, 'test'])->name('test');

// Test Results
Route::get('/test-results', [PageController::class, 'testResults'])->name('test.results');

// CSRF Token endpoint for static HTML files
Route::get('/api/csrf-token', function () {
    return response()->json([
        'token' => csrf_token()
    ]);
});

// API routes accessible from static HTML files
Route::post('/api/register', [AuthController::class, 'register']);
Route::post('/api/login', [AuthController::class, 'login']);







