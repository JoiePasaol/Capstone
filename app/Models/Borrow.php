<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Borrow extends Model
{
    use HasFactory;

    protected $fillable = [
        'id', // Add this if not present
        'name',
        'item_ids',
        'item_names',
        'quantity',
        'borrowed_date', 
        'return_date',
        'status'
    ];
 


  // app/Models/Borrow.php

protected $casts = [
    'item_ids' => 'array',
    'item_names' => 'array',
];

public function setItemIdsAttribute($value)
{
    $this->attributes['item_ids'] = json_encode((array) $value);
}

public function setItemNamesAttribute($value)
{
    $this->attributes['item_names'] = json_encode((array) $value);
}

public function getItemIdsAttribute($value)
{
    return json_decode($value, true) ?: [];
}

public function getItemNamesAttribute($value)
{
    return json_decode($value, true) ?: [];
}
}