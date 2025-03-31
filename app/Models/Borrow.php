<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Borrow extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'item_ids',   
        'item_names',  
        'return_date',
        'status'
    ];
 


    protected $casts = [
        'item_ids' => 'array',
        'item_names' => 'array',
    ];

    // Add mutators to ensure clean storage
    public function setItemIdsAttribute($value)
    {
        $this->attributes['item_ids'] = is_array($value) 
            ? implode(',', $value) 
            : str_replace(['"', '[', ']', '\\'], '', $value);
    }

    public function setItemNamesAttribute($value)
    {
        $this->attributes['item_names'] = is_array($value) 
            ? implode(',', $value) 
            : str_replace(['"', '[', ']', '\\'], '', $value);
    }

    // Accessors remain to convert back to arrays
    public function getItemIdsAttribute($value)
    {
        return explode(',', $value);
    }

    public function getItemNamesAttribute($value)
    {
        return explode(',', $value);
    }
}