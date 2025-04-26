<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TransferredItems extends Model
{
    use HasFactory;

    protected $fillable = [
        'original_item_id',
        'source_transferred_item_id',
        'quantity',
        'transfer_to',
        'name_designation',
        'position_intended',
        'remaining_quantity',
        'designated_office',
        'office_name_designation',
        'office_position_intended',
        'recommended_by_name',
        'recommended_by_title',
        'approved_by_name',
        'approved_by_title',
        'witnessed_by_name',
        'witnessed_by_title',
        'category',
        'description',
        'items',
        'property_no',
        'classification_no',
        'amount',
        'date_purchase',
        'transferred_at',
        'approval_status',
        'is_fully_approved'
    ];

    protected $casts = [
        'transferred_at' => 'datetime',
        'date_purchase' => 'date',
        'amount' => 'decimal:2',
        'approval_status' => 'array',
        'is_fully_approved' => 'boolean',
        'quantity' => 'integer',
        'remaining_quantity' => 'integer'
    ];

    public function originalItem()
    {
        return $this->belongsTo(Item::class, 'original_item_id');
    }

    public function sourceTransferredItem()
    {
        return $this->belongsTo(TransferredItems::class, 'source_transferred_item_id');
    }

    public function childTransfers()
    {
        return $this->hasMany(TransferredItems::class, 'source_transferred_item_id');
    }
}
