<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    /**
     * Display a listing of categories.
     */
    public function index()
    {
        // Fetch categories from the database
        $categories = Category::all(['id', 'name']);
        
        // Return the categories to the Inertia page
        return inertia('Categories', ['categories' => $categories]);
    }

    /**
     * Store a newly created category.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
        ]);
    
        $category = Category::create(['name' => $request->name]);
    
        // Return the newly created category as JSON response
        return response()->json($category);
    }
    

    /**
     * Update the specified category.
     */
    public function update(Request $request, $id)
    {
        \Log::info("Updating category with ID: {$id}");
        
        try {
            $category = Category::findOrFail($id);
    
            $request->validate([
                'name' => 'string|max:255',
            ]);
    
            $category->name = $request->input('name');
            $category->save();
    
            return response()->json($category, 200);
        
        } catch (\Exception $e) {
            \Log::error("Error updating category: {$e->getMessage()}");
            return response()->json(['error' => 'Server error'], 500);
        }
    }

    /**
     * Delete the specified category.
     */
    public function destroy($id)
    {
        try {
            $category = Category::findOrFail($id);
            $category->delete();
    
            return response()->json(['message' => 'Category deleted successfully'], 200);
        } catch (\Exception $e) {
            \Log::error("Error deleting category: {$e->getMessage()}");
            return response()->json(['error' => 'Server error'], 500);
        }
    }
    
    /**
     * Bulk delete categories.
     */
    public function bulkDestroy(Request $request)
    {
        $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'exists:categories,id', // Ensure each ID exists in the database
        ]);
    
        try {
            // Delete all categories with the given IDs
            Category::whereIn('id', $request->ids)->delete();
    
            return response()->json(['message' => 'Categories deleted successfully'], 200);
        } catch (\Exception $e) {
            \Log::error("Error deleting categories: {$e->getMessage()}");
            return response()->json(['error' => 'Server error'], 500);
        }
    }
    
}
