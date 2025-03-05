<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class RoleAdminMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::user();
        
        logger("RoleAdminMiddleware: user role is " . ($user->role ?? 'none'));
        
        if (!$user || !in_array($user->role, ['Super Admin', 'Admin'])) {
            abort(404);
        }
    
        return $next($request);
    }
    
    
}
