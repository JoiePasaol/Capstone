<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use App\Models\User;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    
     public function store(Request $request)
     {
         $request->validate([
             'email' => 'required|email',
             'password' => 'required',
         ]);
     
         $user = User::where('email', $request->email)->first();
     
         if ($user && $user->status === 'pending') {
            throw ValidationException::withMessages([
                'pending' => 'Your registration is under review. Access will be granted once approved.',
            ]);
        }
     
         if (!Auth::attempt($request->only('email', 'password'), $request->filled('remember'))) {
             throw ValidationException::withMessages([
                 'email' => 'The provided credentials do not match our records.',
             ]);
         }
     
         $request->session()->regenerate();
     
         return redirect()->intended(route('dashboard'));
     }
    

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect('/');
    }
}
