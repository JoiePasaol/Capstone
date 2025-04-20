<?php

namespace App\Providers;

use Illuminate\Contracts\Http\Kernel;
use Illuminate\Support\ServiceProvider;
use App\Http\Middleware\RoleMiddleware;
use Illuminate\Support\Facades\Config;

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
        // Set mail configuration dynamically
        Config::set('mail.default', 'smtp');
        Config::set('mail.mailers.smtp', [
            'transport' => 'smtp',
            'host' => 'smtp.gmail.com',
            'port' => 465,
            'encryption' => 'ssl',
            'username' => 'villanuevajohn519@gmail.com',
            'password' => 'sqiyqwyejqecypzl',
            'timeout' => null,
        ]);
        Config::set('mail.from', [
            'address' => 'villanuevajohn519@gmail.com',
            'name' => 'Please Check The Mail',
        ]);

        // Optionally, if you want to register RoleMiddleware globally:
        // $kernel->appendMiddlewareToGroup('web', RoleMiddleware::class);
    }
}
