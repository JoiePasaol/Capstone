@component('mail::message')
# Approval Request for Item Transfer

**Item:**
{!! $transferredItem->items !!}

**Quantity:**
{{ $transferredItem->quantity }}

**Transfer To:**
{{ $transferredItem->transfer_to }}

You have been identified as the {{ ucfirst($type) }} By for this transfer.

@component('mail::button', ['url' => $url])
Approve Transfer
@endcomponent


Thanks,<br>
{{ config('app.name') }}
@endcomponent
