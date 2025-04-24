<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Item;
use App\Models\ReturnedItem;
use Illuminate\Http\Request;

class ReturnedItemController extends Controller
{
    public function create()
    {
        return Inertia::render('Items/ReturnedItems', [
            'items' => Item::select('id', 'items', 'description')->get()
        ]);
    }

    public function returnHistory(Request $request)
    {
        $query = ReturnedItem::with(['user']);

        // Check if we should get all data for client-side processing
        if ($request->has('get_all') && $request->get_all === 'true') {
            $returns = $query->latest()->get();
            
            return Inertia::render('Items/ReturnHistory', [
                'returns' => [
                    'data' => $returns,
                    'total' => $returns->count(),
                    'from' => 1,
                    'to' => $returns->count(),
                    'current_page' => 1,
                    'last_page' => 1,
                    'per_page' => $returns->count(),
                    'links' => []
                ]
            ]);
        }

        // Apply search filter
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('item_name', 'like', '%' . $search . '%')
                  ->orWhere('condition', 'like', '%' . $search . '%')
                  ->orWhere('damage', 'like', '%' . $search . '%')
                  ->orWhere('person_name', 'like', '%' . $search . '%')
                  ->orWhere('office_name', 'like', '%' . $search . '%')
                  ->orWhere('description', 'like', '%' . $search . '%')
                  ->orWhere('property_no', 'like', '%' . $search . '%')
                  ->orWhere('purchased_date', 'like', '%' . $search . '%')
                  ->orWhere('amount', 'like', '%' . $search . '%')
                  ->orWhere('unit_of_measures', 'like', '%' . $search . '%');
            });
        }

        // Apply condition filter
        if ($request->has('condition') && $request->condition) {
            $query->where('condition', $request->condition);
        }

        // Apply date range filters
        if ($request->has('start') && $request->start) {
            $query->whereDate('return_date', '>=', $request->start);
        }
        if ($request->has('end') && $request->end) {
            $query->whereDate('return_date', '<=', $request->end);
        }

        $returns = $query->latest()->paginate(10)->withQueryString();

        return Inertia::render('Items/ReturnHistory', [
            'returns' => $returns
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'item_name' => 'required|string|max:255',
            'person_name' => 'required|string|max:255',
            'office_name' => 'required|string|max:255',
            'quantity_returned' => 'required|integer|min:1',
            'return_date' => 'required|date',
            'condition' => 'required|in:good,damaged,repairable',
            'damage' => 'nullable|required_if:condition,damaged,repairable|string|max:500',
            'description' => 'nullable|string',
            'unit_of_measures' => 'nullable|string|max:255',
            'property_no' => 'nullable|string|max:255',
            'purchased_date' => 'nullable|date',
            'amount' => 'nullable|numeric'
        ]);

        $returnedItem = ReturnedItem::create([
            'item_name' => $request->item_name,
            'user_id' => auth()->id(),
            'person_name' => $request->person_name,
            'office_name' => $request->office_name,
            'quantity_returned' => $request->quantity_returned,
            'return_date' => $request->return_date,
            'condition' => $request->condition,
            'damage' => $request->damage,
            'description' => $request->description,
            'unit_of_measures' => $request->unit_of_measures,
            'property_no' => $request->property_no,
            'purchased_date' => $request->purchased_date,
            'amount' => $request->amount
        ]);

        return redirect()->route('return-history')
            ->with('success', 'Return recorded successfully');
    }

    public function edit($id)
    {
        $return = ReturnedItem::findOrFail($id);
        $items = Item::select('id', 'items', 'description')->get();

        return Inertia::render('Items/EditReturnedItem', [
            'return' => $return,
            'items' => $items
        ]);
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'item_name' => 'required|string|max:255',
            'person_name' => 'required|string|max:255',
            'office_name' => 'required|string|max:255',
            'quantity_returned' => 'required|integer|min:1',
            'return_date' => 'required|date',
            'condition' => 'required|in:good,damaged,repairable',
            'damage' => 'nullable|required_if:condition,damaged,repairable|string|max:500',
            'description' => 'nullable|string',
            'unit_of_measures' => 'nullable|string|max:255',
            'property_no' => 'nullable|string|max:255',
            'purchased_date' => 'nullable|date',
            'amount' => 'nullable|numeric'
        ]);

        $return = ReturnedItem::findOrFail($id);
        $return->update([
            'item_name' => $request->item_name,
            'person_name' => $request->person_name,
            'office_name' => $request->office_name,
            'quantity_returned' => $request->quantity_returned,
            'return_date' => $request->return_date,
            'condition' => $request->condition,
            'damage' => $request->damage,
            'description' => $request->description,
            'unit_of_measures' => $request->unit_of_measures,
            'property_no' => $request->property_no,
            'purchased_date' => $request->purchased_date,
            'amount' => $request->amount
        ]);

        return redirect()->route('return-history')
            ->with('success', 'Return updated successfully');
    }

    public function destroy($id)
    {
        $return = ReturnedItem::findOrFail($id);
        $return->delete();

        return redirect()->back()->with('success', 'Return deleted successfully');
    }

    public function getTotalCount()
    {
        $total = ReturnedItem::count();
        return response()->json(['total_returned_items' => $total]);
    }

    public function inspectReport(Request $request)
    {
        $query = ReturnedItem::where('condition', 'damaged');

        // Check if we should get all data for client-side processing
        if ($request->has('get_all') && $request->get_all === 'true') {
            $items = $query->select('id', 'item_name', 'quantity_returned', 'unit_of_measures', 'description', 'property_no', 'purchased_date', 'amount', 'return_date')
                ->latest()
                ->get();
            
            return Inertia::render('Items/InspectReport', [
                'damagedItems' => [
                    'data' => $items,
                    'total' => $items->count(),
                    'from' => 1,
                    'to' => $items->count(),
                    'current_page' => 1,
                    'last_page' => 1,
                    'per_page' => $items->count(),
                    'links' => []
                ]
            ]);
        }

        $damagedItems = $query->select('id', 'item_name', 'quantity_returned', 'unit_of_measures', 'description', 'property_no', 'purchased_date', 'amount', 'return_date')
            ->latest()
            ->paginate(10);

        return Inertia::render('Items/InspectReport', [
            'damagedItems' => $damagedItems
        ]);
    }
}