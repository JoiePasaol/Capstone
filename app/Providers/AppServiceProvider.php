<?php

namespace App\Providers;

use Illuminate\Contracts\Http\Kernel;
use Illuminate\Support\ServiceProvider;
use App\Http\Middleware\RoleMiddleware;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(Kernel $kernel): void
    {
        // Optionally, if you want to register RoleMiddleware globally:
        // $kernel->appendMiddlewareToGroup('web', RoleMiddleware::class);

        // You can add other middleware or configurations here if needed
    }
}

