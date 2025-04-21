@component('mail::message')
# Transfer Approval Confirmation

**Item:**
{!! $transferredItem->items !!}

**Quantity Transferred:**
{{ $transferredItem->quantity }}

**Transfer To:**
{{ $transferredItem->transfer_to }}

@if($signatory)
**Approved By:**
{{ $signatory->name_designation }}

**Position:**
{{ $signatory->position }}
@endif

**Approval Type:** {{ ucfirst($type) }}
**Approval Date:** {{ now()->setTimezone('Asia/Manila')->format('F j, Y \a\t g:i a') }}

@if($transferredItem->is_fully_approved)
### This transfer has been fully approved by all required signatories.
@else
### Note: This transfer still requires additional approvals.
@endif

Thanks,<br>
{{ config('app.name') }}
@endcomponent
