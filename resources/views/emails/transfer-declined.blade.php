@component('mail::message')
# Transfer Request Declined

**Item:**
{!! $transferredItem->items !!}

**Quantity:**
{{ $transferredItem->quantity }}

**Transfer To:**
{{ $transferredItem->transfer_to }}

The transfer request has been declined by {{ $declinerName }} ({{ $declinedByType }}).

**Reason for Decline:**
{{ $declineReason }}

@if($declinedByType == 'name_designation')
The intended recipient has declined to receive this item.
@elseif($declinedByType == 'recommended')
The recommended signatory has declined to approve this transfer.
@elseif($declinedByType == 'approved')
The approving authority has declined this transfer.
@elseif($declinedByType == 'witnessed')
The witnessing party has declined to witness this transfer.
@elseif($declinedByType == 'office_name_designation')
The office representative has declined this transfer.
@endif

This transfer request is now cancelled and no further approvals will be processed.

Thanks,<br>
{{ config('app.name') }}
@endcomponent
