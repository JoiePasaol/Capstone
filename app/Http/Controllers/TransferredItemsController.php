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
use Illuminate\Support\Facades\URL;

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
                    'remaining_quantity' => $item->remaining_quantity,
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
                    'items' => $item->items,
                    'property_no' => $item->property_no,
                    'classification_no' => $item->classification_no,
                    'amount' => $item->amount,
                    'date_purchase' => $item->date_purchase?->format('Y-m-d'),
                    'transferred_at' => $item->transferred_at->format('Y-m-d H:i:s'),
                    'original_item' => $item->originalItem ? [
                        'id' => $item->originalItem->id,
                        'remaining_quantity' => $item->originalItem->remaining_quantity,
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

    // Modified to implement sequential approval process
    protected function sendTransferNotifications($transferredItem)
    {
        // Define the order of approval
        $approvalOrder = ['name_designation', 'recommended', 'approved', 'witnessed', 'office_name_designation'];

        // Get the first signatory type that needs to receive notification
        $firstSignatoryType = $approvalOrder[0]; // 'name_designation'

        // Get the signatory information
        $signatory = null;
        $signatoryName = null;

        switch ($firstSignatoryType) {
            case 'recommended':
                $signatoryName = $transferredItem->recommended_by_name;
                break;
            case 'approved':
                $signatoryName = $transferredItem->approved_by_name;
                break;
            case 'witnessed':
                $signatoryName = $transferredItem->witnessed_by_name;
                break;
            case 'name_designation':
                $signatoryName = $transferredItem->name_designation;
                break;
            case 'office_name_designation':
                $signatoryName = $transferredItem->office_name_designation;
                break;
        }

        $signatory = Signatory::where('name_designation', $signatoryName)->first();

        // Send email only to the first signatory in the sequence
        if ($signatory && $signatory->email) {
            $url = URL::signedRoute('transfer.approve', [
                'id' => $transferredItem->id,
                'signatory_type' => $firstSignatoryType
            ]);

            \Mail::to($signatory->email)->send(new \App\Mail\TransferApprovalRequest(
                $transferredItem,
                $firstSignatoryType,
                $signatory,
                $url
            ));

            // Initialize approval_status if it doesn't exist
            $approvalStatus = $transferredItem->approval_status ?? [];
            if (is_string($approvalStatus)) {
                $approvalStatus = json_decode($approvalStatus, true) ?? [];
            }

            // Set current_approval_step to track the approval flow
            $approvalStatus['current_approval_step'] = 0; // Index of the first step in approvalOrder
            $transferredItem->approval_status = $approvalStatus;
            $transferredItem->save();

            Log::info('Sent initial approval request to ' . $firstSignatoryType . ' - ' . $signatoryName);
        }
    }

    public function transferFromTransferred(Request $request)
    {
        DB::beginTransaction();
        try {
            $validated = $request->validate([
                'transferred_item_id' => 'required|exists:transferred_items,id',
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

            // Get the source transferred item
            $sourceItem = TransferredItems::findOrFail($validated['transferred_item_id']);

            // Check available quantity
            if ($validated['quantity_transferred'] > $sourceItem->remaining_quantity) {
                return response()->json([
                    'message' => 'Cannot transfer more than available remaining quantity'
                ], 422);
            }

            // Create new transferred item record (don't deduct quantity yet)
            $transferredItem = TransferredItems::create([
                'original_item_id' => $sourceItem->original_item_id,
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
                'category' => $sourceItem->category,
                'description' => $sourceItem->description,
                'items' => $sourceItem->items,
                'property_no' => $sourceItem->property_no,
                'classification_no' => $sourceItem->classification_no,
                'amount' => $sourceItem->amount,
                'date_purchase' => $sourceItem->date_purchase,
                'transferred_at' => now(),
                'approval_status' => null,
                'is_fully_approved' => false,
                'source_transferred_item_id' => $sourceItem->id, // Track the source transferred item
            ]);

            // Send notifications to signatories
            $this->sendTransferNotifications($transferredItem);

            DB::commit();

            return response()->json([
                'message' => 'Transfer request created successfully. Quantity will be deducted after full approval.',
                'transferred_item' => $transferredItem,
                'source_item' => $sourceItem->fresh(),
                'remaining_quantity' => $sourceItem->remaining_quantity
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Transfer from transferred item failed: ' . $e->getMessage());
            return response()->json([
                'message' => 'Transfer failed. Please try again.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function decline(Request $request, $id)
    {
        try {
            DB::beginTransaction();

            $transferredItem = TransferredItems::findOrFail($id);
            $signatory_type = $request->input('signatory_type', $request->query('signatory_type'));

            if (!in_array($signatory_type, ['recommended', 'approved', 'witnessed', 'name_designation', 'office_name_designation'])) {
                throw new \Exception('Invalid signatory type');
            }

            // If this is a GET request, show the decline form
            if ($request->isMethod('get')) {
                return response()->view('decline-form', [
                    'id' => $id,
                    'signatory_type' => $signatory_type
                ]);
            }

            // If this is a POST request, process the decline
            $declineReason = $request->input('decline_reason', 'No reason provided');

            // Mark as declined
            $approvalStatus = $transferredItem->approval_status ?? [];
            if (is_string($approvalStatus)) {
                $approvalStatus = json_decode($approvalStatus, true) ?? [];
            }

            $approvalStatus[$signatory_type] = [
                'approved' => false,
                'declined_at' => now()->toDateTimeString(),
                'decline_reason' => $declineReason
            ];

            // Set the transfer as fully declined to stop further approvals
            $transferredItem->approval_status = $approvalStatus;
            $transferredItem->is_fully_approved = false;
            $transferredItem->save();

            // Send decline notification to all parties
            $this->sendTransferDeclinedNotification($transferredItem, $signatory_type, $declineReason);

            DB::commit();

            return response()->view('approval-processing', [
                'message' => 'Transfer has been declined. All parties have been notified.'
            ], 200)->header('Refresh', '3;url=https://mail.google.com/mail/u/0/#inbox');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Decline failed: ' . $e->getMessage());
            return response()->view('approval-error', [
                'error' => $e->getMessage()
            ], 500);
        }
    }

    protected function sendTransferDeclinedNotification($transferredItem, $declinedByType, $declineReason)
    {
        try {
            $signatories = [
                $transferredItem->recommended_by_name,
                $transferredItem->approved_by_name,
                $transferredItem->witnessed_by_name,
                $transferredItem->name_designation,
                $transferredItem->office_name_designation,
            ];

            $declinerName = $this->getSignatoryName($declinedByType, $transferredItem);

            $emails = Signatory::whereIn('name_designation', $signatories)
                ->pluck('email')
                ->filter()
                ->unique()
                ->toArray();

            foreach ($emails as $email) {
                Mail::to($email)->send(new \App\Mail\TransferDeclined(
                    $transferredItem,
                    $declinedByType,
                    $declinerName,
                    $declineReason
                ));
            }

            // Also notify the original owner
            if ($transferredItem->originalItem && $transferredItem->originalItem->user) {
                Mail::to($transferredItem->originalItem->user->email)->send(new \App\Mail\TransferDeclined(
                    $transferredItem,
                    $declinedByType,
                    $declinerName,
                    $declineReason
                ));
            }
        } catch (\Exception $e) {
            Log::error("Failed to send transfer declined notifications: " . $e->getMessage());
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

            // Define the approval order
            $approvalOrder = ['name_designation', 'recommended', 'approved', 'witnessed', 'office_name_designation'];

            // Get current step or initialize
            $currentStep = isset($approvalStatus['current_approval_step']) ? $approvalStatus['current_approval_step'] : 0;

            // Ensure the current signatory is the one who should be approving now
            if ($signatory_type !== $approvalOrder[$currentStep]) {
                return response()->view('approval-processing', [
                    'message' => 'This approval is not currently awaiting your action. Please wait for your turn in the approval process.'
                ], 400)->header('Refresh', '3;url=https://mail.google.com/mail/u/0/#inbox');
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

            // Move to next step in approval chain
            $nextStep = $currentStep + 1;
            $approvalStatus['current_approval_step'] = $nextStep;

            $transferredItem->approval_status = $approvalStatus;

            // Check if all required steps are complete
            $isFullyApproved = $nextStep >= count($approvalOrder);
            $transferredItem->is_fully_approved = $isFullyApproved;

            // Only deduct quantity when fully approved
            if ($isFullyApproved) {
                // Check if this transfer is from another transferred item
                if (isset($transferredItem->source_transferred_item_id)) {
                    // This is a transfer from another transferred item
                    $sourceTransferredItem = TransferredItems::find($transferredItem->source_transferred_item_id);

                    if ($sourceTransferredItem) {
                        // Check if source has enough remaining quantity
                        if ($transferredItem->quantity > $sourceTransferredItem->remaining_quantity) {
                            throw new \Exception('Cannot complete transfer - insufficient remaining quantity in source transferred item');
                        }

                        // Deduct from the source transferred item's remaining quantity
                        $sourceTransferredItem->remaining_quantity -= $transferredItem->quantity;
                        $sourceTransferredItem->save();

                        Log::info("Deducted {$transferredItem->quantity} from source transferred item ID: {$sourceTransferredItem->id}");
                    } else {
                        Log::error("Source transferred item not found: {$transferredItem->source_transferred_item_id}");
                    }
                } else {
                    // This is a direct transfer from original item
                    $originalItem = Item::find($transferredItem->original_item_id);
                    if ($originalItem) {
                        // Check again in case quantity changed since initial request
                        if ($transferredItem->quantity > $originalItem->remaining_quantity) {
                            throw new \Exception('Cannot complete transfer - insufficient remaining quantity in original item');
                        }
                        $originalItem->remaining_quantity -= $transferredItem->quantity;
                        $originalItem->save();

                        Log::info("Deducted {$transferredItem->quantity} from original item ID: {$originalItem->id}");
                    }
                }
            }

            $transferredItem->save();

            // Send approval confirmation email to current signatory
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

            // If there's a next step in the approval chain, send notification to the next signatory
            if ($nextStep < count($approvalOrder)) {
                $nextSignatoryType = $approvalOrder[$nextStep];
                $nextSignatoryName = $this->getSignatoryName($nextSignatoryType, $transferredItem);
                $nextSignatory = Signatory::where('name_designation', $nextSignatoryName)->first();

                if ($nextSignatory && $nextSignatory->email) {
                    $url = URL::signedRoute('transfer.approve', [
                        'id' => $transferredItem->id,
                        'signatory_type' => $nextSignatoryType
                    ]);

                    Mail::to($nextSignatory->email)->send(new \App\Mail\TransferApprovalRequest(
                        $transferredItem,
                        $nextSignatoryType,
                        $nextSignatory,
                        $url
                    ));

                    Log::info("Sent next approval request to: " . $nextSignatoryType . " - " . $nextSignatoryName);
                }
            }

            // If fully approved, send notification to all parties
            if ($isFullyApproved) {
                $this->sendTransferCompleteNotification($transferredItem);
            }

            DB::commit();

            return response()->view('approval-processing', [
                'message' => 'Transfer approved successfully! ' .
                             ($nextStep < count($approvalOrder) ? 'The next approver has been notified.' : 'All approvals complete! Quantity has been deducted.')
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
            array_filter($approvalStatus, fn($s) => isset($s['approved']) && $s['approved']),
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
