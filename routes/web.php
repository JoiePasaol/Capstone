<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\UserController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Public Routes
Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

// Authenticated and Verified Routes
Route::middleware(['auth', 'verified'])->group(function () {
    // Dashboard
    Route::get('/dashboard', function () {
        return Inertia::render('Dashboard');
    })->name('dashboard');

    // User Status
    Route::get('/user-status', function () {
        return Inertia::render('UserStatus');
    })->name('user-status');

    // User Management
    Route::get('/user-management', function () {
        return Inertia::render('UserManagement');
    })->name('user-management');

    // User API Endpoints
    
    Route::prefix('api')->group(function () {
        Route::get('/users', [UserController::class, 'fetchUsers'])->name('users.fetch');
        Route::patch('/users/{id}/status', [UserController::class, 'updateStatus'])->name('users.update-status');

    // Delete User
    Route::delete('/users/{id}', [UserController::class, 'destroy'])->name('users.destroy');
    });

    // Update User
    Route::put('/api/users/{id}', [UserController::class, 'update'])->name('users.update');

    // Profile Routes
    Route::prefix('profile')->group(function () {
        Route::get('/', [ProfileController::class, 'edit'])->name('profile.edit');
        Route::patch('/', [ProfileController::class, 'update'])->name('profile.update');
        Route::delete('/', [ProfileController::class, 'destroy'])->name('profile.destroy');
    });
});

// Authentication Routes
require __DIR__ . '/auth.php';
