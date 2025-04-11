<?php

namespace App\Http\Controllers;

use App\Models\TransferredItems;
use App\Models\Item;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Models\Signatory;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class TransferredItemsController extends Controller
{
    public function index()
    {
        $transferredItems = TransferredItems::with(['originalItem' => function($query) {
            $query->select('id', 'remaining_quantity', 'property_no', 'classification_no');
        }])
        ->orderBy('transferred_at', 'desc')
        ->get()
        ->map(function ($item) {
            return [
                    'id' => $item->id,
                    'original_item_id' => $item->original_item_id,
                    'quantity' => $item->quantity,
                    'transfer_to' => $item->transfer_to,
                    'recommended_by_name' => $item->recommended_by_name,
                    'recommended_by_title' => $item->recommended_by_title,
                    'approved_by_name' => $item->approved_by_name,
                    'approved_by_title' => $item->approved_by_title,
                    'witnessed_by_name' => $item->witnessed_by_name,
                    'witnessed_by_title' => $item->witnessed_by_title,
                    'name_designation' => $item->name_designation,
                    'position_intended' => $item->position_intended,
                    'designated_office' => $item->designated_office,
                    'approval_status' => $item->approval_status,
                    'is_fully_approved' => $item->is_fully_approved,
                    'office_name_designation' => $item->office_name_designation,
                    'office_position_intended' => $item->office_position_intended,
                    'category' => $item->category,
                    'description' => $item->description,
                    'property_no' => $item->property_no,
                    'classification_no' => $item->classification_no,
                    'amount' => $item->amount,
                    'date_purchase' => $item->date_purchase?->format('Y-m-d'),
                    'transferred_at' => $item->transferred_at->format('Y-m-d H:i:s'),
'original_item' => $item->originalItem ? [
                'id' => $item->originalItem->id,
                'remaining_quantity' => $item->originalItem->remaining_quantity, // Add this
                'property_no' => $item->originalItem->property_no,
                'classification_no' => $item->originalItem->classification_no,
            ] : null,
                ];
            });

        return Inertia::render('Items/TransferredItems', [
            'items' => $transferredItems,
            'departments' => ['IT', 'HR', 'Finance', 'Operations'],
        ]);
    }
    public function getTotalTransferredCount()
    {
        try {
            $count = TransferredItems::count();

            return response()->json([
                'success' => true,
                'total_transferred' => $count
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to get transferred items count: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'total_transferred' => 0,
                'message' => 'Failed to get count'
            ], 500);
        }
    }


    public function approve(Request $request, $id)
    {
        try {
            DB::beginTransaction();

            $transferredItem = TransferredItems::findOrFail($id);
            $signatory_type = $request->query('signatory_type');

            if (!in_array($signatory_type, ['recommended', 'approved', 'witnessed', 'name_designation', 'office_name_designation'])) {
                throw new \Exception('Invalid signatory type');
            }

            // Check if already approved
            $approvalStatus = $transferredItem->approval_status ?? [];
            if (is_string($approvalStatus)) {
                $approvalStatus = json_decode($approvalStatus, true) ?? [];
            }

            if (isset($approvalStatus[$signatory_type]['approved']) && $approvalStatus[$signatory_type]['approved']) {
                return response()->view('approval-processing', [
                    'message' => 'This transfer has already been approved.'
                ], 200)->header('Refresh', '3;url=https://mail.google.com/mail/u/0/#inbox');
            }

            // Mark as approved
            $approvalStatus[$signatory_type] = [
                'approved' => true,
                'approved_at' => now()->toDateTimeString(),
            ];

            $transferredItem->approval_status = $approvalStatus;
            $transferredItem->is_fully_approved = $this->checkFullApproval($approvalStatus);
            $transferredItem->save();

            // Send approval confirmation email
            $signatoryName = $this->getSignatoryName($signatory_type, $transferredItem);
            $signatory = Signatory::where('name_designation', $signatoryName)->first();

            if ($signatory && $signatory->email) {
                try {
                    Mail::to($signatory->email)->send(new \App\Mail\TransferApproved(
                        $transferredItem,
                        $signatory_type,
                        $signatory
                    ));
                } catch (\Exception $e) {
                    Log::error("Failed to send approval confirmation email: " . $e->getMessage());
                }
            }

            // If fully approved, send notification to all parties
            if ($transferredItem->is_fully_approved) {
                $this->sendTransferCompleteNotification($transferredItem);
            }

            DB::commit();

            return response()->view('approval-processing', [
                'message' => 'Transfer approved successfully!'
            ], 200)->header('Refresh', '3;url=https://mail.google.com/mail/u/0/#inbox');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Approval failed: ' . $e->getMessage());
            return response()->view('approval-error', [
                'error' => $e->getMessage()
            ], 500);
        }
    }

    private function getSignatoryName($type, $transferredItem)
    {
        switch ($type) {
            case 'recommended':
                return $transferredItem->recommended_by_name;
            case 'approved':
                return $transferredItem->approved_by_name;
            case 'witnessed':
                return $transferredItem->witnessed_by_name;
            case 'name_designation':
                return $transferredItem->name_designation;
            case 'office_name_designation':
                return $transferredItem->office_name_designation;
            default:
                return null;
        }
    }

    private function checkFullApproval($approvalStatus)
    {
        $requiredSignatories = ['recommended', 'approved', 'witnessed', 'name_designation', 'office_name_designation'];
        return count(array_intersect_key(
            array_filter($approvalStatus, fn($s) => $s['approved']),
            array_flip($requiredSignatories)
        )) === count($requiredSignatories);
    }

    protected function sendTransferCompleteNotification($transferredItem)
    {
        try {
            $signatories = [
                $transferredItem->recommended_by_name,
                $transferredItem->approved_by_name,
                $transferredItem->witnessed_by_name,
                $transferredItem->name_designation,
                $transferredItem->office_name_designation,
            ];

            $emails = Signatory::whereIn('name_designation', $signatories)
                ->pluck('email')
                ->filter()
                ->unique()
                ->toArray();

            foreach ($emails as $email) {
                Mail::to($email)->send(new \App\Mail\TransferComplete(
                    $transferredItem
                ));
            }

            // Also notify the original owner
            if ($transferredItem->originalItem && $transferredItem->originalItem->user) {
                Mail::to($transferredItem->originalItem->user->email)->send(new \App\Mail\TransferComplete(
                    $transferredItem
                ));
            }
        } catch (\Exception $e) {
            Log::error("Failed to send transfer complete notifications: " . $e->getMessage());
        }
    }

    public function destroy($id)
    {
        $item = TransferredItems::findOrFail($id);
        $item->delete();
        return redirect()->back()->with('success', 'Transferred item deleted successfully');
    }

    public function bulkDestroy(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:transferred_items,id',
        ]);

        TransferredItems::whereIn('id', $request->ids)->delete();
        return redirect()->back()->with('success', 'Selected transferred items deleted successfully');
    }
}
