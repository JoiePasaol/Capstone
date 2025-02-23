<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Item extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'department',
        'image',
        'categories',
        'items',
        'description',
        'estimated_life',
        'quantity',
        'price',
        'ics',
        'pr',
        'pr_date',
        'po',
        'po_date',
        'vc',
        'vc_date',
       
    ];


    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
