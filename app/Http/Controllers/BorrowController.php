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
                'item_ids' => $borrow->item_ids,
                'item_names' => $borrow->item_names,
                'quantity' => $borrow->quantity,
                'borrowed_date' => $borrow->borrowed_date ? Carbon::parse($borrow->borrowed_date)->format('Y-m-d') : null,
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
            'borrowed_date' => 'required|date',
            'return_date' => 'required|date',
            'status' => 'sometimes|string|max:50|in:Borrowed,Overdue,Returned',
            'quantity' => 'required|integer|min:1'
        ], [
            'name.required' => 'The name field is required.',
            'item_ids.required' => 'Please select at least one item.',
            'borrowed_date.required' => 'The borrowed date is required.',
            'return_date.required' => 'The return date is required.',
            'return_date.after_or_equal' => 'Return date must be after or equal to borrowed date.',
            'quantity.required' => 'Quantity is required.',
            'quantity.min' => 'Quantity must be at least 1.',
        ]);
    

        \DB::beginTransaction();

        try {
            $returnDate = Carbon::parse($validated['return_date'])->format('Y-m-d');
            $borrowDate = Carbon::parse($validated['borrowed_date'])->format('Y-m-d');

            $borrow = Borrow::create([
                'name' => $validated['name'],
                'item_ids' => $validated['item_ids'],
                'item_names' => $validated['item_names'],
                'borrowed_date' => $borrowDate,
                'return_date' => $returnDate,
                'status' => $validated['status'] ?? 'Borrowed',
                'quantity' => $validated['quantity'],
            ]);

            // Update remaining_quantity for each item
            foreach ($validated['item_ids'] as $itemId) {
                $item = Item::find($itemId);

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
            'borrowed_date' => 'required|date',
            'return_date' => 'required|date',
            'status' => 'sometimes|string|max:50|in:Borrowed,Overdue,Returned',
            'quantity' => 'required|integer|min:1'
        ], [
            'name.required' => 'The name field is required.',
            'item_ids.required' => 'Please select at least one item.',
            'borrowed_date.required' => 'The borrowed date is required.',
            'return_date.required' => 'The return date is required.',
            'quantity.required' => 'Quantity is required.',
            'quantity.min' => 'Quantity must be at least 1.',
        ]);
    
        \DB::beginTransaction();
    
        try {
            $borrow = Borrow::findOrFail($id);
            $originalStatus = $borrow->status;
            $originalQuantity = $borrow->quantity;
            $originalItemIds = $borrow->item_ids;
            
            $newStatus = $validated['status'] ?? $borrow->status;
            $newQuantity = $validated['quantity'];
            $newItemIds = $validated['item_ids'];
    
            // Convert dates to proper format
            $borrowedDate = Carbon::parse($validated['borrowed_date'])->format('Y-m-d');
            $returnDate = Carbon::parse($validated['return_date'])->format('Y-m-d');
    
            // Check if return date is before borrowed date
            if ($returnDate < $borrowedDate) {
                throw new \Exception("Return date must be after or equal to borrowed date.");
            }
    
            // Handle quantity and item changes
            if ($originalStatus === 'Returned') {
                // If item was returned, we need to adjust quantities based on changes
                if ($originalItemIds != $newItemIds || $originalQuantity != $newQuantity) {
                    throw new \Exception("Cannot change items or quantity for returned items.");
                }
            } else {
                // For non-returned items, handle quantity adjustments
                
                // First, restore quantities for original items
                foreach ($originalItemIds as $itemId) {
                    $item = Item::find($itemId);
                    if ($item) {
                        $item->remaining_quantity += $originalQuantity;
                        $item->save();
                    }
                }
                
                // Then deduct quantities for new items
                foreach ($newItemIds as $itemId) {
                    $item = Item::find($itemId);
                    if (!$item) {
                        throw new \Exception("Item with ID {$itemId} not found.");
                    }
    
                    if ($item->remaining_quantity < $newQuantity) {
                        throw new \Exception("Not enough stock for item: {$item->items} (Available: {$item->remaining_quantity}, Requested: {$newQuantity})");
                    }
    
                    $item->remaining_quantity -= $newQuantity;
                    $item->save();
                }
            }
    
            // Handle status change to Returned
            if ($originalStatus !== 'Returned' && $newStatus === 'Returned') {
                foreach ($newItemIds as $itemId) {
                    $item = Item::find($itemId);
                    if ($item) {
                        $item->remaining_quantity += $newQuantity;
                        $item->save();
                    }
                }
            }
            // Handle status change from Returned to Borrowed
            elseif ($originalStatus === 'Returned' && $newStatus !== 'Returned') {
                foreach ($newItemIds as $itemId) {
                    $item = Item::find($itemId);
                    if ($item) {
                        if ($item->remaining_quantity < $newQuantity) {
                            throw new \Exception("Not enough stock to mark as borrowed again.");
                        }
                        $item->remaining_quantity -= $newQuantity;
                        $item->save();
                    }
                }
            }
    
            // Update the borrow record
            $borrow->update([
                'name' => $validated['name'],
                'item_ids' => $validated['item_ids'],
                'item_names' => $validated['item_names'],
                'borrowed_date' => $borrowedDate,
                'return_date' => $returnDate,
                'status' => $newStatus,
                'quantity' => $newQuantity,
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
        \DB::beginTransaction();
    
        try {
            $borrow = Borrow::findOrFail($id);
    
            // If the item was borrowed and not returned, restore the quantity
            if ($borrow->status === 'Borrowed' || $borrow->status === 'Overdue') {
                foreach ($borrow->item_ids as $itemId) {
                    $item = Item::find($itemId);
                    if ($item) {
                        $item->remaining_quantity += $borrow->quantity;
                        $item->save();
                        \Log::info("Restored {$borrow->quantity} items to item ID {$itemId} (now has {$item->remaining_quantity})");
                    }
                }
            }
    
            $borrow->delete();
            \DB::commit();
    
            return response()->json([
                'success' => true,
                'message' => 'Borrow record deleted successfully.'
            ]);
        } catch (\Exception $e) {
            \DB::rollBack();
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
            \DB::beginTransaction();

            $borrows = Borrow::whereIn('id', $ids)->get();

            foreach ($borrows as $borrow) {
                // If the item was borrowed and not returned, restore the quantity
                if ($borrow->status === 'Borrowed' || $borrow->status === 'Overdue') {
                    foreach ($borrow->item_ids as $itemId) {
                        $item = Item::find($itemId);
                        if ($item) {
                            $item->remaining_quantity += $borrow->quantity;
                            $item->save();
                        }
                    }
                }
            }

            $deletedCount = Borrow::whereIn('id', $ids)->delete();

            \DB::commit();

            return response()->json([
                'success' => true,
                'message' => $deletedCount . ' items deleted successfully.',
                'deleted_count' => $deletedCount
            ]);
        } catch (\Exception $e) {
            \DB::rollBack();
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
                'total_borrowed' => $count
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
                'total_overdue' => $count
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