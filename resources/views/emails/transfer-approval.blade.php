@component('mail::message')
# Approval Request for Item Transfer

**Item:**
{!! $transferredItem->items !!}

**Quantity:**
{{ $transferredItem->quantity }}

**Transfer To:**
{{ $transferredItem->transfer_to }}

@if($type == 'name_designation')
You have been identified as the recipient for this item transfer.
@elseif($type == 'recommended')
You have been identified as the 'Recommended By' signatory for this transfer.
@elseif($type == 'approved')
You have been identified as the 'Approved By' signatory for this transfer.
@elseif($type == 'witnessed')
You have been identified as the 'Witnessed By' signatory for this transfer.
@elseif($type == 'office_name_designation')
You have been identified as the final recipient's office representative for this transfer.
@else
You have been identified as a signatory for this transfer.
@endif

Please review this transfer request.

@component('mail::button', ['url' => $url, 'color' => 'success'])
Approve Transfer
@endcomponent

@component('mail::button', ['url' => $declineUrl, 'color' => 'error'])
Decline Transfer
@endcomponent

Thanks,<br>
{{ config('app.name') }}
@endcomponent
