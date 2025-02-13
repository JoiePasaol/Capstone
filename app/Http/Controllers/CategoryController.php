<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
 
    public function index(Request $request)
    {
   
        $categories = Category::all(['id', 'name']);
    
      
        if ($request->wantsJson()) {
            return response()->json(['categories' => $categories]);
        }
    
   
        return inertia('Categories', ['categories' => $categories]);
    }

  
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
        ]);
    
        $category = Category::create(['name' => $request->name]);
    
       
        return response()->json($category);
    }
    

   
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
    
   
    public function bulkDestroy(Request $request)
    {
        $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'exists:categories,id', 
        ]);
    
        try {
         
            Category::whereIn('id', $request->ids)->delete();
    
            return response()->json(['message' => 'Categories deleted successfully'], 200);
        } catch (\Exception $e) {
            \Log::error("Error deleting categories: {$e->getMessage()}");
            return response()->json(['error' => 'Server error'], 500);
        }
    }

    public function getTotalCategoriesCount()
{
    try {
        $count = Category::count();
        return response()->json(['total_categories' => $count], 200);
    } catch (\Exception $e) {
        \Log::error("Error fetching total categories count: {$e->getMessage()}");
        return response()->json(['error' => 'Server error'], 500);
    }
}

    
}
