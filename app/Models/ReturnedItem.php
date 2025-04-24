<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ReturnedItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'item_name',
        'user_id',
        'person_name',
        'office_name',
        'quantity_returned',
        'return_date',
        'condition',
        'damage',
        'description',
        'unit_of_measures',
        'property_no',
        'purchased_date',
        'amount'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}