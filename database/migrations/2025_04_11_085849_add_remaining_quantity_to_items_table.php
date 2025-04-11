<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::table('items', function (Blueprint $table) {
            $table->integer('remaining_quantity')->after('quantity');
        });

        // Initialize remaining_quantity with quantity values for existing records
        DB::statement('UPDATE items SET remaining_quantity = quantity');
    }

    public function down()
    {
        Schema::table('items', function (Blueprint $table) {
            $table->dropColumn('remaining_quantity');
        });
    }
};
