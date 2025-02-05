<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ItemController;
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
        return Inertia::render('User/UserStatus');
    })->name('user-status');

    // User Management
    Route::get('/user-management', function () {
        return Inertia::render('User/UserManagement');
    })->name('user-management');

    // Categories
    Route::get('/categories', function () {
        return Inertia::render('Categories');
    })->name('categories');

    // Items
    Route::get('/item-list', function () {
        return Inertia::render('Items/ItemList');
    })->name('item-list');

    
    Route::get('/item-report', function () {
        return Inertia::render('Items/ItemReport');
    })->name('item-report');

    // User API Endpoints
    Route::prefix('api')->group(function () {
        Route::get('/users', [UserController::class, 'fetchUsers'])->name('users.fetch');
        Route::patch('/users/{id}/status', [UserController::class, 'updateStatus'])->name('users.update-status');
        Route::delete('/users/{id}', [UserController::class, 'destroy'])->name('users.destroy');
    });
    

    Route::post('/items', [ItemController::class, 'store'])->name('items.store');
    Route::get('/items', [ItemController::class, 'index'])->name('items.index');
    Route::delete('/items/{id}', [ItemController::class, 'destroy'])->name('items.destroy');
    Route::get('items/{id}/edit', [ItemController::class, 'edit'])->name('items.edit');
    Route::put('items/{id}', [ItemController::class, 'update'])->name('items.update');
    Route::post('/items/import', [ItemController::class, 'import'])->name('items.import');




    // Update User
    Route::put('/api/users/{id}', [UserController::class, 'update'])->name('users.update');

    // Categories Routes
    Route::get('/categories', [CategoryController::class, 'index'])->name('categories');
    Route::post('/categories', [CategoryController::class, 'store'])->name('categories.store');
    Route::put('categories/{id}', [CategoryController::class, 'update'])->name('categories.update');
    Route::delete('/categories/{id}', [CategoryController::class, 'destroy'])->name('categories.destroy');
    Route::post('/categories/bulkDestroy', [CategoryController::class, 'bulkDestroy'])->name('categories.bulkDestroy');
    
    // Profile Routes
    Route::prefix('profile')->group(function () {
        Route::get('/', [ProfileController::class, 'edit'])->name('profile.edit');
        Route::patch('/', [ProfileController::class, 'update'])->name('profile.update');
        Route::delete('/', [ProfileController::class, 'destroy'])->name('profile.destroy');
    });
});

// Authentication Routes
require __DIR__ . '/auth.php';
