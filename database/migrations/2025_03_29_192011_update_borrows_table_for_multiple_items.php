<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('borrows', function (Blueprint $table) {
            // Add new columns
            $table->json('item_ids')->after('name');
            $table->json('item_names')->after('item_ids');
            
            // Remove old columns (do this in a separate migration if you want to preserve data)
            $table->dropForeign(['item_id']);
            $table->dropColumn('item_id');
            $table->dropColumn('item_name');
        });
    }

    public function down()
    {
        Schema::table('borrows', function (Blueprint $table) {
            // Reverse the changes
            $table->foreignId('item_id')->constrained('items')->onDelete('cascade');
            $table->string('item_name');
            
            $table->dropColumn('item_ids');
            $table->dropColumn('item_names');
        });
    }
};