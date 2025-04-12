<?php

namespace App\Http\Controllers;
use Illuminate\Support\Facades\DB;
use App\Models\TransferredItems;
use App\Models\Signatory;
use App\Models\Item;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\URL;


class ItemController extends Controller
{
    public function index()
    {
        $items = Item::with('user')->orderBy('created_at', 'desc')->get();



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
        $request->merge([
            'price' => $request->price ? (float) str_replace(',', '', $request->price) : null
        ]);
        $request->validate([
            'image' => 'nullable|image|max:2048',
            'categories' => 'required|string',
            'items' => 'required|string',
            'description' => 'required|string',
            'estimated_life' => 'required|string',
            'quantity' => 'required|integer',
            'price' => 'required|numeric|min:0',
            'suppliers' => 'required|string',
            'ics' => 'nullable|string',
            'pr' => 'nullable|string',
            'pr_date' => 'nullable|date',
            'po' => 'nullable|string',
            'po_date' => 'nullable|date',
            'vc' => 'nullable|string',
            'vc_date' => 'nullable|date',
            'property_no' => 'nullable|string',
            'classification_no' => 'nullable|string',
            'date_purchase' => 'nullable|date',
            'ch' => 'nullable|string',
            'ch_date' => 'nullable|date',
            'or' => 'nullable|string',
            'or_date' => 'nullable|date',
        ]);

        $user = Auth::user();
        $fullName = trim($user->firstname . ' ' . $user->lastname);

        $imagePath = null;
        if ($request->hasFile('image')) {
            $image = $request->file('image');
            $imagePath = $image->storeAs('images', $image->getClientOriginalName(), 'public');
        }

        $prDate = $request->pr_date ? Carbon::parse($request->pr_date)->format('Y-m-d') : null;
        $poDate = $request->po_date ? Carbon::parse($request->po_date)->format('Y-m-d') : null;
        $vcDate = $request->vc_date ? Carbon::parse($request->vc_date)->format('Y-m-d') : null;
        $chDate = $request->ch_date ? Carbon::parse($request->ch_date)->format('Y-m-d') : null;
        $orDate = $request->or_date ? Carbon::parse($request->or_date)->format('Y-m-d') : null;
        $datePurchase = $request->date_purchase ? Carbon::parse($request->date_purchase)->format('Y-m-d') : null;

        $item = Item::create([
            'user_id' => $user->id,
            'name' => $fullName,
            'department' => $user->department ?? 'N/A',
            'image' => $imagePath,
            'categories' => $request->categories,
            'items' => $request->items,
            'description' => $request->description,
            'estimated_life' => $request->estimated_life,
            'quantity' => $request->quantity,
            'remaining_quantity' => $request->quantity, // Set initial remaining quantity equal to quantity
            'price' => $request->price,
            'suppliers' => $request->suppliers,
            'ics' => $request->ics,
            'pr' => $request->pr,
            'pr_date' => $prDate,
            'po' => $request->po,
            'po_date' => $poDate,
            'property_no' => $request->property_no,
            'classification_no' => $request->classification_no,
            'date_purchase' => $datePurchase,
            'vc' => $request->vc,
            'vc_date' => $vcDate,
            'ch' => $request->ch,
            'ch_date' => $chDate,
            'or' => $request->or,
            'or_date' => $orDate
        ]);

        return redirect()->route('item-list')->with('success', 'Item added successfully.');
    }


    public function transfer(Request $request)
    {
        DB::beginTransaction();
        try {
            $validated = $request->validate([
                'item_id' => 'required|exists:items,id',
                'quantity_transferred' => 'required|integer|min:1',
                'transferTo' => 'required|string',
                'nameDesignation' => 'required|string',
                'positionIntended' => 'required|string',
                'designatedOffice' => 'required|string',
                'officeNameDesignation' => 'required|string',
                'officePositionIntended' => 'required|string',
                'recommended_by_name' => 'required|string',
                'recommended_by_title' => 'required|string',
                'approved_by_name' => 'required|string',
                'approved_by_title' => 'required|string',
                'witnessed_by_name' => 'required|string',
                'witnessed_by_title' => 'required|string',
            ]);

            $originalItem = Item::findOrFail($validated['item_id']);

            // Check available quantity
            if ($validated['quantity_transferred'] > $originalItem->remaining_quantity) {
                return response()->json([
                    'message' => 'Cannot transfer more than available remaining quantity'
                ], 422);
            }

            // Calculate new remaining quantity
            $newRemainingQuantity = $originalItem->remaining_quantity - $validated['quantity_transferred'];

            // Create transferred item record
            $transferredItem = TransferredItems::create([
                'original_item_id' => $originalItem->id,
                'quantity' => $validated['quantity_transferred'],
                'remaining_quantity' => $validated['quantity_transferred'],
                'transfer_to' => $validated['transferTo'],
                'name_designation' => $validated['nameDesignation'],
                'position_intended' => $validated['positionIntended'],
                'designated_office' => $validated['designatedOffice'],
                'office_name_designation' => $validated['officeNameDesignation'],
                'office_position_intended' => $validated['officePositionIntended'],
                'recommended_by_name' => $validated['recommended_by_name'],
                'recommended_by_title' => $validated['recommended_by_title'],
                'approved_by_name' => $validated['approved_by_name'],
                'approved_by_title' => $validated['approved_by_title'],
                'witnessed_by_name' => $validated['witnessed_by_name'],
                'witnessed_by_title' => $validated['witnessed_by_title'],
                'category' => $originalItem->categories,
                'description' => $originalItem->description,
                'property_no' => $originalItem->property_no,
                'classification_no' => $originalItem->classification_no,
                'amount' => $originalItem->price,
                'date_purchase' => $originalItem->date_purchase,
                'transferred_at' => now(),
            ]);

            // Update the original item's remaining quantity
            $originalItem->remaining_quantity -= $validated['quantity_transferred'];
            $originalItem->save();
            // Send emails to signatories
            $this->sendTransferNotifications($transferredItem);

            DB::commit();

            return response()->json([
                'message' => 'Item transferred successfully',
                'transferred_item' => $transferredItem,
                'original_item' => $originalItem->fresh()
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Transfer failed: ' . $e->getMessage()
            ], 500);
        }
    }
    // ✅ Add this method below the transfer method in the same controller
    protected function sendTransferNotifications($transferredItem)
    {
        $signatories = [
            'recommended' => [
                'signatory' => Signatory::where('name_designation', $transferredItem->recommended_by_name)->first(),
                'email_field' => 'recommended_by_email'
            ],
            'approved' => [
                'signatory' => Signatory::where('name_designation', $transferredItem->approved_by_name)->first(),
                'email_field' => 'approved_by_email'
            ],
            'witnessed' => [
                'signatory' => Signatory::where('name_designation', $transferredItem->witnessed_by_name)->first(),
                'email_field' => 'witnessed_by_email'
            ],
            'name_designation' => [
                'signatory' => Signatory::where('name_designation', $transferredItem->name_designation)->first(),
                'email_field' => 'email'
            ],
            'office_name_designation' => [
                'signatory' => Signatory::where('name_designation', $transferredItem->office_name_designation)->first(),
                'email_field' => 'email'
            ],
        ];

        foreach ($signatories as $type => $data) {
            if ($data['signatory'] && $data['signatory']->email) {
                $url = URL::signedRoute('transfer.approve', [
                    'id' => $transferredItem->id,
                    'signatory_type' => $type
                ]);

                \Mail::to($data['signatory']->email)->send(new \App\Mail\TransferApprovalRequest(
                    $transferredItem,
                    $type,
                    $data['signatory'],
                    $url
                ));
            }
        }
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
        // Convert comma-formatted price to numeric before validation
        $request->merge([
            'price' => $request->price ? (float) str_replace(',', '', $request->price) : null
        ]);
    $validatedData = $request->validate([
        'image' => 'nullable|image|max:2048',
        'categories' => 'nullable|string',
        'description' => 'nullable|string',
        'items' => 'nullable|string',
        'estimated_life'=> 'nullable|string',
        'quantity' => 'nullable|integer',
        'price' => 'required|numeric|min:0',
        'suppliers' => 'nullable|string',
        'ics' => 'nullable|string',
        'pr' => 'nullable|string',
        'pr_date' => 'nullable|date',
        'po' => 'nullable|string',
        'po_date' => 'nullable|date',
        'property_no' => 'nullable|string',
        'classification_no' => 'nullable|string',
        'date_purchase' => 'nullable|date',
        'vc' => 'nullable|string',
        'vc_date' => 'nullable|date',
        'ch' => 'nullable|string',
        'ch_date' => 'nullable|date',
        'or' => 'nullable|string',
        'or_date' => 'nullable|date',

    ]);

    $item = Item::findOrFail($id);
    if (isset($validatedData['quantity'])) {
        $quantityChange = $validatedData['quantity'] - $item->quantity;
        $item->remaining_quantity += $quantityChange;
    }
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
    $item->suppliers = $validatedData['suppliers'] ?? $item->suppliers;
    $item->ics = $validatedData['ics'] ?? $item->ics;
    $item->pr = $validatedData['pr'] ?? $item->pr;
    $item->pr_date = $validatedData['pr_date'] ?? $item->pr_date;
    $item->po = $validatedData['po'] ?? $item->po;
    $item->po_date = $validatedData['po_date'] ?? $item->po_date;
    $item->property_no = $validatedData['property_no'] ?? $item->property_no;
    $item->classification_no = $validatedData['classification_no'] ?? $item->classification_no;
    $item->date_purchase = $validatedData['date_purchase'] ?? $item->date_purchase;
    $item->vc = $validatedData['vc'] ?? $item->vc;
    $item->vc_date = $validatedData['vc_date'] ?? $item->vc_date;
    $item->ch = $validatedData['ch'] ?? $item->ch;
    $item->ch_date = $validatedData['ch_date'] ?? $item->ch_date;
    $item->or = $validatedData['or'] ?? $item->or;
    $item->or_date = $validatedData['or_date'] ?? $item->or_date;

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

        // ✅ Required CSV columns
        $requiredHeaders = [
            'name', 'department', 'categories', 'items', 'description', 'estimated_life',
            'quantity', 'price', 'suppliers', 'ics', 'pr', 'pr_date', 'po', 'po_date',
            'vc', 'vc_date', 'ch', 'ch_date', 'or','property_no','classification_no','date_purchase','or_date', 'created_at', 'updated_at'
        ];

        // ✅ Check for missing columns
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

            // ✅ Check if the item already exists
            $exists = Item::where([
                ['categories', $row['categories']],
                ['description', $row['description']],
                ['items', $row['items']],
                ['estimated_life', $row['estimated_life']],
                ['quantity', $row['quantity']],
                ['price', $row['price']],
                ['suppliers', $row['suppliers']],
                ['department', $department],
                ['name', $row['name']],
                ['ics', $row['ics']],
                ['pr', $row['pr']],
                ['pr_date', $row['pr_date']],
                ['po', $row['po']],
                ['po_date', $row['po_date']],
                ['vc', $row['vc']],
                ['vc_date', $row['vc_date']],
                ['ch', $row['ch']],
                ['ch_date', $row['ch_date']],
                ['or', $row['or']],
                ['or_date', $row['or_date']],
            ])->exists();

            if (!$exists) {
                // ✅ Ensure `created_at` & `updated_at` are formatted correctly
                $createdAt = !empty($row['created_at']) ? Carbon::parse($row['created_at']) : now();
                $updatedAt = !empty($row['updated_at']) ? Carbon::parse($row['updated_at']) : now();

                // ✅ Insert while disabling automatic timestamps
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
                    'suppliers' => $row['suppliers'],
                    'ics' => $row['ics'] ?? null,
                    'pr' => $row['pr'] ?? null,
                    'pr_date' => !empty($row['pr_date']) ? Carbon::parse($row['pr_date']) : null,
                    'po' => $row['po'] ?? null,
                    'po_date' => !empty($row['po_date']) ? Carbon::parse($row['po_date']) : null,
                    'vc' => $row['vc'] ?? null,
                    'vc_date' => !empty($row['vc_date']) ? Carbon::parse($row['vc_date']) : null,
                    'ch' => $row['ch'] ?? null,
                    'ch_date' => !empty($row['ch_date']) ? Carbon::parse($row['ch_date']) : null,
                    'or' => $row['or'] ?? null,
                    'or_date' => !empty($row['or_date']) ? Carbon::parse($row['or_date']) : null,
                    'created_at' => $createdAt,
                    'updated_at' => $updatedAt,
                ]);

                $inserted++;
            } else {
                \Log::info('Duplicate item skipped:', $row);
            }
        }

        if ($inserted == 1) {
            $message = '1 new item imported successfully!';
        } else {
            $message = "$inserted items imported successfully!";
        }

        return response()->json([
            'message' => $message,
        ]);

    } catch (\Exception $e) {
        \Log::error('Import failed: ' . $e->getMessage());
        return response()->json([
            'message' => 'Import failed. Please try again later.',
            'error' => $e->getMessage(),
        ], 500);
    }
}



public function getTotalItemsCount(Request $request)
{
    try {
        $user = $request->user();

        // If the user is a Super Admin, count all items
        if ($user->role === 'Super Admin') {
            $count = Item::count();
        } else {
            // Otherwise, apply filters based on user role
            $query = Item::query();

            if ($user->role === 'Basic') {
                $query->where('user_id', $user->id);
            } elseif ($user->role === 'Admin') {
                $query->where('department', $user->department);
            }

            $count = $query->count();
        }

        return response()->json(['total_items' => $count], 200);
    } catch (\Exception $e) {
        \Log::error("Error fetching total items count: {$e->getMessage()}");
        return response()->json(['error' => 'Server error'], 500);
    }
}
}
