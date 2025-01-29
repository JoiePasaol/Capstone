<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Item extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'firstname', 'department', 'image', 'categories', 'brand', 'items', 'quantity', 'price'
    ];

    // Define the relationship: Each item belongs to a user
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
