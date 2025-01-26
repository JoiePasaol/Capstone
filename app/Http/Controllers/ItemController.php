<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Category;

class ItemController extends Controller
{
    public function index()
    {
        $categories = Category::all(['id', 'name']); 
        return Inertia::render('ItemList', [
            'categories' => $categories,
        ]);
    }
}