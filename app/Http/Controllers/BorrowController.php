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
        $borrows = Borrow::all()->map(function ($borrow) {
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
        \Log::info('Store request received', $request->all());
        
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'item_ids' => 'required|array',
            'item_ids.*' => 'exists:items,id',
            'item_names' => 'required|array',
            'item_names.*' => 'string|max:255',
            'return_date' => 'required|date_format:m/d/Y',
            'status' => 'sometimes|string|max:50|in:Borrowed,overdue,returned',
        ]);
    
        try {
            $returnDate = Carbon::createFromFormat('m/d/Y', $validated['return_date'])->format('Y-m-d');
    
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
            'return_date' => 'required|date_format:m/d/Y',
            'status' => 'required|string|max:50|in:Borrowed,overdue,returned',
        ]);
    
        $borrow = Borrow::findOrFail($id);
        
        $returnDate = Carbon::createFromFormat('m/d/Y', $validated['return_date'])->format('Y-m-d');
        
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
    }
}