<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TransferredItems extends Model
{
    use HasFactory;

    protected $fillable = [
        'original_item_id',
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
        'property_no',
        'classification_no',
        'amount',
        'date_purchase',
        'transferred_at'
    ];
    protected $casts = [
        'transferred_at' => 'datetime',
        'date_purchase' => 'date',
        'amount' => 'decimal:2',
        'approval_status' => 'array',
    ];

    public function originalItem()
    {
        return $this->belongsTo(Item::class, 'original_item_id');
    }
}
