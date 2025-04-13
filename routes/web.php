<?php
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\ItemController;
use App\Http\Controllers\BorrowController;
use App\Http\Controllers\TransferredItemsController;
use App\Http\Controllers\SignatoryController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use Illuminate\Foundation\Auth\EmailVerificationRequest;
use App\Http\Controllers\Auth\VerifyEmailController;
use Illuminate\Support\Carbon;
use App\Models\Item;
use Inertia\Inertia;

// Public Routes
Route::get('/', function () {
    return redirect('/login');
});

Route::get('/login', function () {
    return Inertia::render('login', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

// Email Verification Routes
Route::get('/email/verify', function () {
    return Inertia::render('Auth/VerifyEmail');
})->middleware('auth')->name('verification.notice');

Route::get('/email/verify/{id}/{hash}', VerifyEmailController::class)
    ->middleware(['auth', 'signed'])
    ->name('verification.verify');

    Route::post('/transferred-items/transfer-from-transferred', [TransferredItemsController::class, 'transferFromTransferred'])
    ->name('transferred-items.transfer-from-transferred');
// Transfer approval routes (outside auth group for email access)

Route::get('/transferred-items/{id}/approve', [TransferredItemsController::class, 'approve'])
    ->name('transfer.approve');

Route::post('/transferred-items/{id}/approve', [TransferredItemsController::class, 'approve'])
    ->name('transfer.approve');

Route::get('/transferred-items/{id}/status', [TransferredItemsController::class, 'approvalStatus'])
    ->name('transfer.status');


// API Routes that don't require authentication
Route::prefix('api')->group(function () {
    // Move the transferred items count route here
    Route::get('/transferred-items/total-transferred', [TransferredItemsController::class, 'getTotalTransferredCount']);
});


// Authenticated and Verified Routes
Route::middleware(['auth', 'verified'])->group(function () {
    // Dashboard
    Route::get('/dashboard', function () {
        return Inertia::render('Dashboard', [
            'successMessage' => session('successMessage'),
        ]);
    })->name('dashboard');

    // Restricted to Admin and Super Admin Only
    Route::middleware(['role.admin'])->group(function () {
        Route::get('/item-report', function () {
            return Inertia::render('Items/ItemReport');
        })->name('item-report');

        Route::get('/item-borrow', function () {
            return Inertia::render('Items/ItemBorrow');
        })->name('item-borrow');

        Route::get('/user-status', function () {
            return Inertia::render('User/UserStatus');
        })->name('user-status');

        Route::get('/user-management', function () {
            return Inertia::render('User/UserManagement');
        })->name('user-management');
    });

    // Other Routes (Accessible by all authenticated users)
    Route::get('/categories', function () {
        return Inertia::render('Categories');
    })->name('categories');

    Route::get('/supplier', function () {
        return Inertia::render('Supplier');
    })->name('supplier');

    Route::get('/signatory', function () {
        return Inertia::render('Items/Signatory');
    })->name('signatory');

    Route::get('/item-list', function () {
        return Inertia::render('Items/ItemList');
    })->name('item-list');

    // Transfer routes
    Route::post('/items/transfer', [ItemController::class, 'transfer'])
        ->name('items.transfer');

    Route::get('/transferred-items', [TransferredItemsController::class, 'index'])
        ->name('transferred-items');

    Route::delete('/transferred-items/{id}', [TransferredItemsController::class, 'destroy'])
        ->name('transferred-items.destroy');

    Route::post('/transferred-items/bulk-delete', [TransferredItemsController::class, 'bulkDestroy'])
        ->name('transferred-items.bulkDestroy');


    // API Routes that require authentication

    Route::prefix('api')->group(function () {
        // User API Endpoints
        Route::get('/users', [UserController::class, 'fetchUsers'])->name('users.fetch');
        Route::patch('/users/{id}/status', [UserController::class, 'updateStatus'])->name('users.update-status');
        Route::delete('/users/{id}', [UserController::class, 'destroy'])->name('users.destroy');
        Route::post('/users/bulk-destroy', [UserController::class, 'bulkDestroy'])->name('users.bulk-destroy');
        Route::get('/users/pending-count', [UserController::class, 'getPendingUsersCount']);
        Route::get('/users/approved-count', [UserController::class, 'getApprovedUsersCount']);
        Route::put('/users/{id}', [UserController::class, 'update'])->name('users.update');

        // Categories Routes
        Route::get('/categories', [CategoryController::class, 'index'])->name('categories');
        Route::post('/categories', [CategoryController::class, 'store'])->name('categories.store');
        Route::put('/categories/{id}', [CategoryController::class, 'update'])->name('categories.update');
        Route::delete('/categories/{id}', [CategoryController::class, 'destroy'])->name('categories.destroy');

        Route::post('/categories/bulk-destroy', [CategoryController::class, 'bulkDestroy'])->name('categories.bulk-destroy');
        Route::get('/categories/total', [CategoryController::class, 'getTotalCategoriesCount']);


        // Signatory Routes
        Route::get('/signatories', [SignatoryController::class, 'index'])->name('signatories.index');
        Route::post('/signatories', [SignatoryController::class, 'store'])->name('signatories.store');
        Route::put('/signatories/{id}', [SignatoryController::class, 'update'])->name('signatories.update');
        Route::delete('/signatories/{id}', [SignatoryController::class, 'destroy'])->name('signatories.destroy');
        Route::post('/signatories/bulk-destroy', [SignatoryController::class, 'bulkDestroy'])->name('signatories.bulk-destroy');

        // Item Routes
        Route::get('/items', [ItemController::class, 'index'])->name('items.index');
        Route::post('/items', [ItemController::class, 'store'])->name('items.store');
        Route::delete('/items/{id}', [ItemController::class, 'destroy'])->name('items.destroy');
        Route::post('/items/bulk-delete', [ItemController::class, 'bulkDestroy'])->name('items.bulk-destroy');
        Route::get('/items/{id}/edit', [ItemController::class, 'edit'])->name('items.edit');
        Route::put('/items/{id}', [ItemController::class, 'update'])->name('items.update');

        // Report Route
        Route::get('/items-report', function (Request $request) {
            $startDate = $request->query('start_date');
            $endDate = $request->query('end_date');
            $department = $request->query('department');
        
            $query = Item::query();

        
            if ($startDate && $endDate) {
                $startDate = Carbon::parse($startDate)->startOfDay();
                $endDate = Carbon::parse($endDate)->endOfDay();
                $query->whereBetween('created_at', [$startDate, $endDate]);
            }

            if ($department) {
                $query->where('department', $department);
            }
        
            return $query->select(
                'items as item', 
                'description', 
                'estimated_life', 
                'quantity', 
                'price as amount', 
                'department', 
                'created_at'
            )->get();
        });
        Route::post('/items/import', [ItemController::class, 'import'])->name('items.import');
        Route::get('/items/total', [ItemController::class, 'getTotalItems']);

        // Borrow Routes
        Route::get('/borrows', [BorrowController::class, 'index'])->name('borrows.index');
        Route::get('/search-items', [BorrowController::class, 'searchItems'])->name('borrows.search');
        Route::post('/borrow', [BorrowController::class, 'store'])->name('borrows.store');
        Route::put('/borrow/{id}', [BorrowController::class, 'update'])->name('borrows.update');
        Route::delete('/borrow/{id}', [BorrowController::class, 'destroy'])->name('borrows.destroy');
        Route::post('/borrow/bulk-destroy', [BorrowController::class, 'bulkDestroy'])->name('borrows.bulk-destroy');
        Route::get('/borrowed-items/total-count', [BorrowController::class, 'countBorrowed']);
        Route::get('/borrowed-items/total-overdue', [BorrowController::class, 'countOverdue']);
        

        // Supplier Routes
        Route::get('/suppliers', [SupplierController::class, 'index'])->name('suppliers.index');
        Route::post('/suppliers', [SupplierController::class, 'store'])->name('suppliers.store');
        Route::get('/suppliers/{id}', [SupplierController::class, 'edit'])->name('suppliers.edit');
        Route::put('/suppliers/{id}', [SupplierController::class, 'update'])->name('suppliers.update');
        Route::delete('/suppliers/{id}', [SupplierController::class, 'destroy'])->name('suppliers.destroy');
        Route::post('/suppliers/bulk-destroy', [SupplierController::class, 'bulkDestroy'])->name('suppliers.bulk-destroy');
        Route::get('/suppliers/total', [SupplierController::class, 'getTotalSuppliersCount'])->name('suppliers.count');


        // Profile Routes
        Route::prefix('profile')->group(function () {
            Route::get('/', [ProfileController::class, 'edit'])->name('profile.edit');
            Route::patch('/', [ProfileController::class, 'update'])->name('profile.update');
            Route::delete('/', [ProfileController::class, 'destroy'])->name('profile.destroy');
        });
    });
});

// Authentication Routes
require __DIR__ . '/auth.php';