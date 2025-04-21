@component('mail::message')
# Transfer Process Completed

The following item transfer has been fully approved by all required signatories:
**Item :**
{!! $transferredItem->items !!}
**Item Description:**
{{ strip_tags($transferredItem->description) }}

**Quantity Transferred:**
{{ $transferredItem->quantity }}

**Property No:**
{{ $transferredItem->property_no ?? 'N/A' }}

**Classification No:**
{{ $transferredItem->classification_no ?? 'N/A' }}

**Amount:**
₱{{ number_format($transferredItem->amount, 2) }}

**Date Purchased:**
{{ $transferredItem->date_purchase?->format('F j, Y') ?? 'N/A' }}

**Transfer Details:**
- **To:** {{ $transferredItem->transfer_to }}
- **Name/Designation:** {{ $transferredItem->name_designation }}
- **Position Intended:** {{ $transferredItem->position_intended }}
- **Designated Office:** {{ $transferredItem->designated_office }}

**Approval Timeline:**
@foreach($transferredItem->approval_status as $type => $status)
- {{ ucfirst($type) }}: Approved on {{ \Carbon\Carbon::parse($status['approved_at'])->setTimezone('Asia/Manila')->format('F j, Y \a\t g:i a') }}
@endforeach

This transfer is now considered complete and official. Please keep this notification for your records.

Thanks,
{{ config('app.name') }}
@endcomponent
