<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Item;
use App\Models\Borrow;
use Carbon\Carbon;

class BorrowController extends Controller
{
    public function index()
    {
        $now = Carbon::now();
    
        $borrows = Borrow::orderBy('created_at', 'desc')->get()->map(function ($borrow) use ($now) {
            // Auto update status to 'Overdue' if current date is past return_date
            if (
                $borrow->status === 'Borrowed' &&
                $borrow->return_date &&
                Carbon::parse($borrow->return_date)->isBefore($now)
            ) {
                $borrow->status = 'Overdue';
                $borrow->save();
            }
    
            return [
                'id' => $borrow->id,
                'name' => $borrow->name,
                'item_ids' => $borrow->item_ids, // The casts should handle this
                'item_names' => $borrow->item_names, // The casts should handle this
                'quantity' => $borrow->quantity,
                'return_date' => $borrow->return_date ? Carbon::parse($borrow->return_date)->format('Y-m-d') : null,
                'status' => $borrow->status,
                'created_at' => $borrow->created_at->toISOString(),
                'updated_at' => $borrow->updated_at->toISOString()
            ];
        });
    
        return response()->json($borrows);
    }
    public function searchItems(Request $request)
    {
        $query = $request->input('query');
        
        // Assuming 'quantity' exists in the 'items' table
        $items = Item::where('items', 'LIKE', "%{$query}%")
                     ->limit(10)
                     ->get(['id', 'items', 'remaining_quantity']);
        
        return response()->json($items);
    }

    public function show($id)
{
    $item = Item::findOrFail($id);
    return response()->json([
        'id' => $item->id,
        'items' => $item->items,
        'remaining_quantity' => $item->remaining_quantity,
    ]);
}

    
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'item_ids' => 'required|array',
            'item_ids.*' => 'exists:items,id',
            'item_names' => 'required|array',
            'item_names.*' => 'string|max:255',
            'return_date' => 'required|date',
            'status' => 'sometimes|string|max:50|in:Borrowed,Overdue,Returned',
            'quantity' => 'required|integer|min:1',
        ]);
    
        \DB::beginTransaction();
    
        try {
            $returnDate = Carbon::parse($validated['return_date'])->format('Y-m-d');
    
            // Create the borrow record (let model handle casting)
            $borrow = Borrow::create([
                'name' => $validated['name'],
                'item_ids' => $validated['item_ids'],     // no json_encode
                'item_names' => $validated['item_names'], // no json_encode
                'return_date' => $returnDate,
                'status' => $validated['status'] ?? 'Borrowed',
                'quantity' => $validated['quantity'],
            ]);
    
            // Update remaining_quantity for each item
            foreach ($validated['item_ids'] as $itemId) {
                $item = \App\Models\Item::find($itemId);
    
                if (!$item) {
                    throw new \Exception("Item with ID {$itemId} not found.");
                }
    
                if ($item->remaining_quantity < $validated['quantity']) {
                    throw new \Exception("Not enough stock for item: {$item->items} (Available: {$item->remaining_quantity}, Requested: {$validated['quantity']})");
                }
    
                $item->remaining_quantity -= $validated['quantity'];
                $item->save();
            }
    
            \DB::commit();
    
            return response()->json([
                'success' => true,
                'message' => 'Items borrowed successfully.',
                'data' => $borrow
            ]);
        } catch (\Exception $e) {
            \DB::rollBack();
            \Log::error('Error creating borrow record: ' . $e->getMessage());
    
            return response()->json([
                'success' => false,
                'message' => 'Failed to save record. Please try again.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    
    
    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'item_ids' => 'required|array',
            'item_ids.*' => 'exists:items,id',
            'item_names' => 'required|array',
            'item_names.*' => 'string|max:255',
            'return_date' => 'required|date',
            'status' => 'required|string|max:50|in:Borrowed,Overdue,Returned',
            'quantity' => 'required|integer|min:1',
        ]);
    
        \DB::beginTransaction();
    
        try {
            $borrow = Borrow::findOrFail($id);
            $originalStatus = $borrow->status;
            $originalQuantity = $borrow->quantity;
            $newQuantity = $validated['quantity'];
    
            $quantityDifference = $originalQuantity - $newQuantity;
    
            foreach ($validated['item_ids'] as $itemId) {
                $item = \App\Models\Item::find($itemId);
    
                if (!$item) {
                    throw new \Exception("Item with ID {$itemId} not found.");
                }
    
                if ($originalStatus !== 'Returned' && $validated['status'] === 'Returned') {
                    // If item is being returned now
                    $item->remaining_quantity += $originalQuantity;
                } elseif ($originalStatus === 'Returned' && $validated['status'] !== 'Returned') {
                    // If previously returned and now marked as borrowed again
                    if ($item->remaining_quantity < $newQuantity) {
                        throw new \Exception("Not enough stock for item: {$item->items} (Available: {$item->remaining_quantity}, Requested: {$newQuantity})");
                    }
                    $item->remaining_quantity -= $newQuantity;
                } elseif ($validated['status'] === 'Borrowed') {
                    // Just a quantity update while still in borrowed status
                    if ($quantityDifference > 0) {
                        // Returning some quantity
                        $item->remaining_quantity += $quantityDifference;
                    } elseif ($quantityDifference < 0) {
                        // Borrowing more
                        $extraNeeded = abs($quantityDifference);
                        if ($item->remaining_quantity < $extraNeeded) {
                            throw new \Exception("Not enough stock for item: {$item->items} (Available: {$item->remaining_quantity}, Additional Requested: {$extraNeeded})");
                        }
                        $item->remaining_quantity -= $extraNeeded;
                    }
                }
    
                $item->save();
            }
    
            $returnDate = Carbon::parse($validated['return_date'])->format('Y-m-d');
    
            $borrow->update([
                'name' => $validated['name'],
                'item_ids' => $validated['item_ids'],
                'item_names' => $validated['item_names'],
                'return_date' => $returnDate,
                'status' => $validated['status'],
                'quantity' => $validated['quantity'],
            ]);
    
            \DB::commit();
    
            return response()->json([
                'success' => true,
                'message' => 'Borrow record updated successfully.',
                'data' => $borrow
            ]);
        } catch (\Exception $e) {
            \DB::rollBack();
            \Log::error('Error updating borrow record: ' . $e->getMessage());
    
            return response()->json([
                'success' => false,
                'message' => 'Failed to update record. Please try again.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    

    public function destroy($id)
    {
        try {
            $borrow = Borrow::findOrFail($id);
            $borrow->delete();
    
            return response()->json([
                'success' => true,
                'message' => 'Borrow record deleted successfully.'
            ]);
        } catch (\Exception $e) {
            \Log::error('Error deleting borrow record: '.$e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete record. Please try again.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function bulkDestroy(Request $request)
    {
        $ids = $request->input('ids', []);
    
        if (empty($ids)) {
            return response()->json([
                'success' => false,
                'message' => 'No items selected for deletion.'
            ], 400);
        }
    
        try {
            $deletedCount = Borrow::whereIn('id', $ids)->delete();
    
            return response()->json([
                'success' => true,
                'message' => $deletedCount . ' items deleted successfully.',
                'deleted_count' => $deletedCount
            ]);
        } catch (\Exception $e) {
            \Log::error('Bulk delete error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete items.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    
    public function countBorrowed()
{
    try {
        $count = Borrow::where('status', 'Borrowed')->count();

        return response()->json([
            'success' => true,
            'total_borrowed' => $count  // Changed from 'borrowed_count' to match frontend expectation
        ]);
    } catch (\Exception $e) {
        \Log::error('Error fetching borrowed items count: ' . $e->getMessage());
        return response()->json([
            'success' => false,
            'message' => 'Failed to fetch borrowed items count.',
            'error' => $e->getMessage()
        ], 500);
    }
}
public function countOverdue()
{
    try {
        $count = Borrow::where('status', 'Overdue')->count();

        return response()->json([
            'success' => true,
            'total_overdue' => $count  // Changed from 'overdue_count' to be consistent
        ]);
    } catch (\Exception $e) {
        \Log::error('Error fetching overdue items count: ' . $e->getMessage());
        return response()->json([
            'success' => false,
            'message' => 'Failed to fetch overdue items count.',
            'error' => $e->getMessage()
        ], 500);
    }
}

}