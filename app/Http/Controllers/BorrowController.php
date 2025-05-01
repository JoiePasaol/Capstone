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
                'item_ids' => is_array($borrow->item_ids) 
                    ? $borrow->item_ids 
                    : json_decode($borrow->item_ids, true),
                'item_names' => is_array($borrow->item_names) 
                    ? $borrow->item_names 
                    : json_decode($borrow->item_names, true),
                'return_date' => $borrow->return_date ? Carbon::parse($borrow->return_date)->format('Y-m-d') : null,
                'status' => $borrow->status,
                'created_at' => $borrow->created_at,
                'updated_at' => $borrow->updated_at
            ];
        });
    
        return response()->json($borrows);
    }
    public function searchItems(Request $request)
    {
        $query = $request->input('query');
    
        $items = Item::where('items', 'LIKE', "%{$query}%")
               ->limit(10)
               ->get(['id', 'items']);
    
        return response()->json($items);   
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
        ]);
    
        try {
            $returnDate = Carbon::parse($validated['return_date'])->format('Y-m-d');
    
            $borrow = Borrow::create([
                'name' => $validated['name'],
                'item_ids' => $validated['item_ids'],
                'item_names' => $validated['item_names'],
                'return_date' => $returnDate,
                'status' => $validated['status'] ?? 'Borrowed'
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Items borrowed successfully.',
                'data' => $borrow
            ]);
        } catch (\Exception $e) {
            \Log::error('Error creating borrow record: '.$e->getMessage());
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
        ]);
    
        try {
            $borrow = Borrow::findOrFail($id);
            
            $returnDate = Carbon::parse($validated['return_date'])->format('Y-m-d');
            
            $borrow->update([
                'name' => $validated['name'],
                'item_ids' => $validated['item_ids'],
                'item_names' => $validated['item_names'],
                'return_date' => $returnDate,
                'status' => $validated['status'],
            ]);
    
            return response()->json([
                'success' => true,
                'message' => 'Borrow record updated successfully.',
                'data' => $borrow
            ]);
        } catch (\Exception $e) {
            \Log::error('Error updating borrow record: '.$e->getMessage());
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