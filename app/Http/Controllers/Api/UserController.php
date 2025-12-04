<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class UserController extends Controller
{
    /**
     * Get user profile
     */
    public function profile()
    {
        return response()->json([
            'user' => Auth::user(),
        ]);
    }

    /**
     * Update user profile
     */
    public function update(Request $request)
    {
        $user = Auth::user();

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $user->id,
            'college' => 'sometimes|string|max:255',
            'course' => 'sometimes|string|max:255',
            'year' => 'sometimes|integer|min:1|max:5',
        ]);

        $user->update($request->only(['name', 'email', 'college', 'course', 'year']));

        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => $user->fresh(),
        ]);
    }
}

