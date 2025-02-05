<?php

namespace App\Http\Controllers;

use App\Models\Item;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ItemController extends Controller
{
    public function index()
    {
        $items = Item::with('user')
                     ->orderBy('created_at', 'desc') 
                     ->get();
    
    
        $items->each(function($item) {
            if ($item->image) {
             
                $item->image = url('/storage/' . $item->image);
            }
        });
    
        return response()->json([
            'items' => $items,
        ]);
    }
    
    public function store(Request $request)
    {
        $request->validate([
            'categories' => 'required|string',
            'brand' => 'required|string',
            'items' => 'required|string',
            'quantity' => 'required|integer',
            'price' => 'required|numeric',
            'image' => 'nullable|image|max:2048',
        ]);
    
        $user = Auth::user();
        $fullName = trim($user->firstname . ' ' . $user->lastname);
    
        // Check if the image exists in the request and store it with its original name
        $imagePath = null;
        if ($request->hasFile('image')) {
            $image = $request->file('image');
            $imagePath = $image->storeAs('images', $image->getClientOriginalName(), 'public');  
        }
    
        $item = Item::create([
            'user_id' => $user->id,
            'name' => $fullName,
            'department' => $user->department ?? 'N/A',
            'image' => $imagePath,
            'categories' => $request->categories,
            'brand' => $request->brand,
            'items' => $request->items,
            'quantity' => $request->quantity,
            'price' => $request->price,
        ]);
    
        return redirect()->route('item-list')->with('success', 'Item added successfully.');
    }
    
    
    public function destroy($id)
    {
        $item = Item::findOrFail($id);
    
        // Check if the item has an image and delete it from storage
        if ($item->image && \Storage::disk('public')->exists($item->image)) {
            \Storage::disk('public')->delete($item->image);
        }
    
        // Delete the item from the database
        $item->delete();
    
        return response()->json(['message' => 'Item deleted successfully.']);
    }

   public function edit($id)
    {
        // Get the item by ID
        $item = Item::findOrFail($id);

        return response()->json(['item' => $item]);
    }

    public function update(Request $request, $id)
    {
        // Validate the request
        $validatedData = $request->validate([
            'image' => 'nullable|image|max:2048',
            'categories' => 'nullable|string',
            'brand' => 'nullable|string',
            'items' => 'nullable|string',
            'quantity' => 'nullable|integer',
            'price' => 'nullable|numeric',
        ]);
    
        // Find the item by ID
        $item = Item::findOrFail($id);
    
        // Handle the image upload if a new image is provided
        if ($request->hasFile('image')) {
            // Delete the old image from storage if it exists
            if ($item->image && \Storage::disk('public')->exists($item->image)) {
                \Storage::disk('public')->delete($item->image);
            }
    
            // Store the new image with its original name
            $image = $request->file('image');
            $imagePath = $image->storeAs('images', $image->getClientOriginalName(), 'public');
            $item->image = $imagePath; // Save the new image path
        }
    
        // Update the other fields (keep existing values if not provided)
        $item->categories = $validatedData['categories'] ?? $item->categories;
        $item->brand = $validatedData['brand'] ?? $item->brand;
        $item->items = $validatedData['items'] ?? $item->items;
        $item->quantity = $validatedData['quantity'] ?? $item->quantity;
        $item->price = $validatedData['price'] ?? $item->price;
    
        // Save the updated item
        $item->save();
    
        // Return response with success message and the updated item
        return response()->json([
            'message' => 'Item successfully updated!',
            'item' => $item, // Return the updated item, including the new image path
        ]);
    }
    
    

    public function import(Request $request)
    {
        try {
            \Log::debug('Import request received:', $request->all());
    
            $user = Auth::user();
            $data = $request->input('data');
    
            // Define required columns
            $requiredHeaders = ['name', 'department', 'categories', 'brand', 'items', 'quantity', 'price'];
    
            if (!$data || !is_array($data)) {
                return response()->json(['message' => 'Invalid CSV data format.'], 400);
            }
    
            // Get headers from the first row
            $headers = array_keys($data[0] ?? []);
    
            // Check if all required columns are present
            foreach ($requiredHeaders as $requiredColumn) {
                if (!in_array($requiredColumn, $headers)) {
                    return response()->json([
                        'message' => 'Import failed. Please check the CSV format and try again.'
                    ], 400);
                }
            }
    
            $inserted = 0;
            foreach ($data as $row) {
                \Log::debug('Processing row:', $row);
    
                // Ensure only necessary fields are processed
                $cleanedRow = array_filter($row, function ($key) {
                    return !in_array($key, ['id', 'user_id', 'updated_at']);
                }, ARRAY_FILTER_USE_KEY);
    
                // Validate required fields
                if (!isset($cleanedRow['categories'], $cleanedRow['brand'], $cleanedRow['items'], $cleanedRow['name'])) {
                    \Log::warning('Skipping row due to missing required fields:', $row);
                    continue;
                }
    
                // Check if item already exists
                $exists = Item::where([
                    ['categories', $cleanedRow['categories']],
                    ['brand', $cleanedRow['brand']],
                    ['items', $cleanedRow['items']],
                    ['department', $cleanedRow['department']],
                    ['name', $cleanedRow['name']]
                ])->exists();
    
                if (!$exists) {
                    Item::create([
                        'user_id' => $user->id,
                        'name' => $cleanedRow['name'] ?? 'Unknown',
                        'department' => $cleanedRow['department'] ?? 'N/A',
                        'categories' => $cleanedRow['categories'] ?? '',
                        'brand' => $cleanedRow['brand'] ?? '',
                        'items' => $cleanedRow['items'] ?? '',
                        'quantity' => intval($cleanedRow['quantity'] ?? 0),
                        'price' => floatval($cleanedRow['price'] ?? 0),
                        'created_at' => $cleanedRow['created_at'] ?? now(),
                    ]);
                    $inserted++;
                } else {
                    \Log::info('Duplicate item skipped:', $cleanedRow);
                }
            }
    
            return response()->json([
                'message' => "$inserted new items imported successfully.",
            ]);
        } catch (\Exception $e) {
            \Log::error('Import failed: ' . $e->getMessage());
            return response()->json([
                'message' => 'Import failed. Please try again later.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
    
}