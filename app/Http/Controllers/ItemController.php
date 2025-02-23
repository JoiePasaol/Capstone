<?php

namespace App\Http\Controllers;

use App\Models\Item;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;


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
        \Log::info('Received Request Data:', $request->all()); 
    
        $request->validate([
            'categories' => 'required|string',
            'description' => 'required|string',
            'items' => 'required|string',
            'estimated_life' => 'required|string',
            'quantity' => 'required|integer',
            'price' => 'required|numeric',
            'ics' => 'nullable|string',
            'pr' => 'nullable|string',
            'pr_date' => 'nullable|date',
            'po' => 'nullable|string',
            'po_date' => 'nullable|date',
            'image' => 'nullable|image|max:2048',
        ]);
    
        $user = Auth::user();
        $fullName = trim($user->firstname . ' ' . $user->lastname);
    
        $imagePath = null;
        if ($request->hasFile('image')) {
            $image = $request->file('image');
            $imagePath = $image->storeAs('images', $image->getClientOriginalName(), 'public');
        }
    
        // Convert dates to 'YYYY-MM-DD' format
        $prDate = $request->pr_date ? Carbon::createFromFormat('m/d/Y', $request->pr_date)->format('Y-m-d') : null;
        $poDate = $request->po_date ? Carbon::createFromFormat('m/d/Y', $request->po_date)->format('Y-m-d') : null;
    
        $item = Item::create([
            'user_id' => $user->id,
            'name' => $fullName,
            'department' => $user->department ?? 'N/A',
            'image' => $imagePath,
            'categories' => $request->categories,
            'description' => $request->description,
            'items' => $request->items,
            'estimated_life' => $request->estimated_life,
            'quantity' => $request->quantity,
            'price' => $request->price,
            'ics' => $request->ics,
            'pr' => $request->pr, 
            'pr_date' => $prDate,
            'po' => $request->po, 
            'po_date' => $poDate, 
        ]);
    
        return redirect()->route('item-list')->with('success', 'Item added successfully.');
    }
    
    
    
    public function destroy($id)
    {
        $item = Item::findOrFail($id);
    
        if ($item->image && \Storage::disk('public')->exists($item->image)) {
            \Storage::disk('public')->delete($item->image);
        }
    
   
        $item->delete();
    
        return response()->json(['message' => 'Item deleted successfully.']);
    }

  

    public function bulkDestroy(Request $request)
{
    $ids = $request->input('ids', []);

    if (empty($ids)) {
        return response()->json(['message' => 'No items selected.'], 400);
    }

    // Get items with images
    $items = Item::whereIn('id', $ids)->get();

    // Delete images if they exist
    foreach ($items as $item) {
        if ($item->image && \Storage::disk('public')->exists($item->image)) {
            \Storage::disk('public')->delete($item->image);
        }
    }

    // Delete items in one query
    Item::whereIn('id', $ids)->delete();

    return response()->json(['message' => count($ids) . ' items deleted successfully.']);
}


public function edit($id)
{

    $item = Item::findOrFail($id);

    return response()->json(['item' => $item]);
}

public function update(Request $request, $id)
{
    $validatedData = $request->validate([
        'image' => 'nullable|image|max:2048',
        'categories' => 'nullable|string',
        'description' => 'nullable|string',
        'items' => 'nullable|string',
        'estimated_life'=> 'nullable|string',
        'quantity' => 'nullable|integer',
        'price' => 'nullable|numeric',
        'ics' => 'nullable|string',
        'pr' => 'nullable|string',
        'pr_date' => 'nullable|date',
        'po' => 'nullable|string',
        'po_date' => 'nullable|date',
       
    ]);

    $item = Item::findOrFail($id);

    if ($request->hasFile('image')) {
        if ($item->image && \Storage::disk('public')->exists($item->image)) {
            \Storage::disk('public')->delete($item->image);
        }

        $image = $request->file('image');
        $imagePath = $image->storeAs('images', $image->getClientOriginalName(), 'public');
        $item->image = $imagePath; 
    }

    $item->categories = $validatedData['categories'] ?? $item->categories;
    $item->description = $validatedData['description'] ?? $item->description;
    $item->items = $validatedData['items'] ?? $item->items;
    $item->estimated_life = $validatedData['estimated_life'] ?? $item->estimated_life;
    $item->quantity = $validatedData['quantity'] ?? $item->quantity;
    $item->price = $validatedData['price'] ?? $item->price;
    $item->ics = $validatedData['ics'] ?? $item->ics;
    $item->pr = $validatedData['pr'] ?? $item->pr;
    $item->pr_date = $validatedData['pr_date'] ?? $item->pr_date;
    $item->po = $validatedData['po'] ?? $item->po;
    $item->po_date = $validatedData['po_date'] ?? $item->po_date;


    $item->save();

    return response()->json([
        'message' => 'Item successfully updated!',
        'item' => $item, 
    ]);
}

    
    
    public function import(Request $request)
    {
        try {
            \Log::debug('Import request received:', $request->all());
    
            $data = $request->input('data');
    
            if (!$data || !is_array($data)) {
                return response()->json(['message' => 'Invalid CSV data format.'], 400);
            }
    
            $requiredHeaders = ['name', 'department', 'categories', 'description', 'items', 'estimated_life', 'quantity', 'price', 'created_at'];
    
            $headers = array_keys($data[0] ?? []);
            foreach ($requiredHeaders as $requiredColumn) {
                if (!in_array($requiredColumn, $headers)) {
                    return response()->json([
                        'message' => "Missing column: $requiredColumn in CSV."
                    ], 400);
                }
            }
    
            $inserted = 0;
            foreach ($data as $row) {
                \Log::debug('Processing row:', $row);
    
                $department = $row['department'] ?? 'N/A';
    
                if (!$department || empty($department)) {
                    \Log::warning("Skipping row due to missing department:", $row);
                    continue;
                }
    
                $exists = Item::where([
                    ['categories', $row['categories']],
                    ['description', $row['description']],
                    ['items', $row['items']],
                    ['estimated_life', $row['estimated_life']],
                    ['quantity', $row['quantity']],
                    ['price', $row['price']],
                    ['department', $department], 
                    ['name', $row['name']]
                ])->exists();
    
                if (!$exists) {
                    // Ensure created_at is formatted correctly
                    $createdAt = !empty($row['created_at']) ? Carbon::parse($row['created_at']) : now();
    
                    // Insert while disabling automatic timestamps
                    Item::insert([
                        'user_id' => Auth::id(), 
                        'name' => $row['name'],
                        'department' => $department, 
                        'categories' => $row['categories'],
                        'description' => $row['description'],
                        'items' => $row['items'],
                        'estimated_life' => $row['estimated_life'],
                        'quantity' => intval($row['quantity']),
                        'price' => floatval($row['price']),
                        'created_at' => $createdAt,
                        'updated_at' => now(),
                    ]);
    
                    $inserted++;
                } else {
                    \Log::info('Duplicate item skipped:', $row);
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

        public function getTotalItemsCount()
    {
        try {
            $count = Item::count();
            return response()->json(['total_items' => $count], 200);
        } catch (\Exception $e) {
            \Log::error("Error fetching total items count: {$e->getMessage()}");
            return response()->json(['error' => 'Server error'], 500);
        }
    }

    public function getTotalAmount()
{
    try {
        $totalAmount = Item::sum(\DB::raw('quantity * price'));
        return response()->json(['total_amount' => $totalAmount], 200);
    } catch (\Exception $e) {
        \Log::error("Error fetching total amount: {$e->getMessage()}");
        return response()->json(['error' => 'Server error'], 500);
    }
}



    
    
     
}