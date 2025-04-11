<?php

namespace App\Http\Controllers;

use App\Models\Signatory;
use Illuminate\Http\Request;

class SignatoryController extends Controller
{
    public function index()
    {
        $signatories = Signatory::all();
        return response()->json($signatories);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name_designation' => 'required|string|max:255',
            'position_intended' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:signatories',
        ]);

        return Signatory::create($request->all());
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'name_designation' => 'required|string|max:255',
            'position_intended' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:signatories,email,' . $id,
        ]);

        $signatory = Signatory::findOrFail($id);
        $signatory->update($request->all());

        return $signatory;
    }

    public function destroy($id)
    {
        $signatory = Signatory::findOrFail($id);
        $signatory->delete();

        return response()->json(['message' => 'Signatory deleted successfully']);
    }

    public function bulkDestroy(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:signatories,id',
        ]);

        Signatory::whereIn('id', $request->ids)->delete();

        return response()->json(['message' => 'Signatories deleted successfully']);
    }
}
