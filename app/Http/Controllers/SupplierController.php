<?php

namespace App\Http\Controllers;

use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SupplierController extends Controller
{
    public function index()
    {
        $suppliers = Supplier::all();
        return response()->json(['suppliers' => $suppliers]);
    }

    public function store(Request $request)
    {
        \Log::info('Received Request Data:', $request->all());

        $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'required|string',
            'mobile_number' => 'nullable|numeric|digits_between:10,15',
            'email' => 'nullable|email|max:255|unique:suppliers,email',
        ]);

        $supplier = Supplier::create([
            'name' => $request->name,
            'address' => $request->address,
            'mobile_number' => $request->mobile_number,
            'email' => $request->email,
        ]);

        return response()->json(['supplier' => $supplier, 'message' => 'Supplier added successfully!']);
    }


    public function edit($id)
    {
        $supplier = Supplier::findOrFail($id);
        return response()->json(['supplier' => $supplier]);
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'required|string',
            'mobile_number' => 'nullable|numeric|digits_between:10,15',
            'email' => 'nullable|email|max:255|unique:suppliers,email,'.$id,
        ]);

        $supplier = Supplier::findOrFail($id);
        $supplier->update([
            'name' => $request->name,
            'address' => $request->address,
            'mobile_number' => $request->mobile_number,
            'email' => $request->email,
        ]);

        return response()->json(['message' => 'Supplier updated successfully!', 'supplier' => $supplier]);
    }

            public function destroy($id)
        {
            $supplier = Supplier::findOrFail($id);
            $supplier->delete();

            return response()->json(['message' => 'Supplier deleted successfully.']);
        }

        public function bulkDestroy(Request $request)
        {
            $ids = $request->input('ids', []);

            if (empty($ids)) {
                return response()->json(['message' => 'No suppliers selected.'], 400);
            }

            Supplier::whereIn('id', $ids)->delete();

            return response()->json(['message' => count($ids) . ' suppliers deleted successfully.']);
        }

        public function getTotalSuppliers()
        {
            $totalSuppliers = Supplier::count();
            return response()->json(['total_suppliers' => $totalSuppliers]);
        }



}