<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Item;
use App\Models\Borrow;

class BorrowController extends Controller
{
    
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
        $request->validate([
            'name' => 'required|string|max:255',
            'item_id' => 'required|exists:items,id',
            'item_name' => 'required|string|max:255', // ✅ Validate item name
            'return_date' => 'required|date',
            'status' => 'required|string|max:50',
        ], [
            'item_id.required' => 'The item field is required.',
            'item_id.exists' => 'The selected item is invalid.',
            'item_name.required' => 'The item name field is required.', // ✅ Custom error
        ]);
    
        $borrow = new Borrow();
        $borrow->name = $request->name;
        $borrow->item_id = $request->item_id;
        $borrow->item_name = $request->item_name; // ✅ Save item name
        $borrow->return_date = \Carbon\Carbon::createFromFormat('m/d/Y', $request->return_date)->format('Y-m-d');
        $borrow->status = $request->status;
        $borrow->save();
    
        return redirect()->route('item-borrow')->with('success', 'Item borrow added successfully.');
    }
    
    
}
