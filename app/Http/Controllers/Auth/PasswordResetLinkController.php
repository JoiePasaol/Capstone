<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\User;

class PasswordResetLinkController extends Controller
{
    /**
     * Display the password reset link request view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/ForgotPassword', [
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming password reset link request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
public function store(Request $request): RedirectResponse
{
    $request->validate([
        'email' => 'required|email',
    ]);

    // First try to find user by primary email
    $user = User::where('email', $request->email)->first();

    // If not found, try alternative email
    if (!$user) {
        $user = User::where('email_reset_pass', $request->email)->first();
    }

    if ($user) {
        // Send reset link to the email they entered (could be primary or alternative)
        $status = Password::sendResetLink(['email' => $request->email]);

        return $status === Password::RESET_LINK_SENT
            ? back()->with('status', __($status))
            : back()->withErrors(['email' => __($status)]);
    }

    throw ValidationException::withMessages([
        'email' => [trans('passwords.user')],
    ]);
}
}
