<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::table('borrows', function (Blueprint $table) {
            $table->json('item_ids')->nullable();     // stores array of item IDs
            $table->json('item_names')->nullable();   // stores array of item names
        });
    }
    
    public function down()
    {
        Schema::table('borrows', function (Blueprint $table) {
            $table->dropColumn(['item_ids', 'item_names']);
        });
    }
    
};
