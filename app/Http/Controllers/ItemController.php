<?php

namespace App\Http\Controllers;

use App\Models\Item;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ItemController extends Controller
{
    public function index()
    {
        $items = Item::with('user')->get();
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
        ]);
    
        $item = Item::create([
            'user_id' => auth()->id(),
            'firstname' => auth()->user()->firstname ?? 'N/A',
            'department' => auth()->user()->department ?? 'N/A',
            'image' => $request->file('image') ? $request->file('image')->store('images', 'public') : null,
            'categories' => $request->categories,
            'brand' => $request->brand,
            'items' => $request->items,
            'quantity' => $request->quantity,
            'price' => $request->price,
        ]);
    
        return redirect()->route('item-list')->with('success', 'Item added successfully.');
    }
}