<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Register a new user
     */
    public function register(Request $request)
    {
        try {
            $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'nullable|email|unique:users,email',
                'password' => 'nullable|string|min:6',
                'college' => 'required|string|max:255',
                'course' => 'required|string|max:255',
                'year' => 'required|integer|min:1|max:5',
            ]);

            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => $request->password ? Hash::make($request->password) : null,
                'college' => $request->college,
                'course' => $request->course,
                'year' => $request->year,
            ]);

            Auth::login($user);

            return response()->json([
                'message' => 'User registered successfully',
                'user' => $user,
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Registration failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Login user
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required_without:name|email',
            'name' => 'required_without:email|string',
            'password' => 'nullable|string',
        ]);

        // For simplicity, allow login by name if no email/password system
        if ($request->name && !$request->email) {
            $user = User::where('name', $request->name)->first();
            if ($user) {
                Auth::login($user);
                return response()->json([
                    'message' => 'Logged in successfully',
                    'user' => $user,
                ]);
            }
        }

        // Standard email/password login
        if ($request->email && $request->password) {
            $credentials = $request->only('email', 'password');
            if (Auth::attempt($credentials)) {
                $user = Auth::user();
                return response()->json([
                    'message' => 'Logged in successfully',
                    'user' => $user,
                ]);
            }
        }

        throw ValidationException::withMessages([
            'email' => ['The provided credentials are incorrect.'],
        ]);
    }

    /**
     * Logout user
     */
    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'message' => 'Logged out successfully',
        ]);
    }

    /**
     * Get authenticated user
     */
    public function user(Request $request)
    {
        return response()->json([
            'user' => Auth::user(),
        ]);
    }

    /**
     * Get CSRF token
     */
    public function csrfToken(Request $request)
    {
        return response()->json([
            'token' => csrf_token(),
        ]);
    }
}

