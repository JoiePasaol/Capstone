<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up()
    {
        Schema::table('borrows', function (Blueprint $table) {
            // First add the new array columns
            $table->json('item_ids')->after('name')->nullable();
            $table->json('item_names')->after('item_ids')->nullable();
        });

        // Now convert existing single items to arrays
        DB::table('borrows')->update([
            'item_ids' => DB::raw('JSON_ARRAY(item_id)'),
            'item_names' => DB::raw('JSON_ARRAY(item_name)')
        ]);

        // Finally remove the old single item columns
        Schema::table('borrows', function (Blueprint $table) {
            $table->dropForeign(['item_id']);
            $table->dropColumn(['item_id', 'item_name']);
        });
    }

    public function down()
    {
        Schema::table('borrows', function (Blueprint $table) {
            // First add back the single item columns
            $table->unsignedBigInteger('item_id')->nullable()->after('name');
            $table->string('item_name')->nullable()->after('item_id');
        });

        // Convert array data back to single items (taking first element)
        DB::table('borrows')->update([
            'item_id' => DB::raw('JSON_EXTRACT(item_ids, "$[0]")'),
            'item_name' => DB::raw('JSON_EXTRACT(item_names, "$[0]")')
        ]);

        // Add foreign key constraint
        Schema::table('borrows', function (Blueprint $table) {
            $table->foreign('item_id')->references('id')->on('items')->onDelete('cascade');
        });

        // Remove the array columns
        Schema::table('borrows', function (Blueprint $table) {
            $table->dropColumn(['item_ids', 'item_names']);
        });
    }
};