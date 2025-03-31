<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('borrows', function (Blueprint $table) {
            // Change JSON columns to text
            $table->text('item_ids')->change();
            $table->text('item_names')->change();
        });
    }

    public function down()
    {
        Schema::table('borrows', function (Blueprint $table) {
            // Revert back to JSON if needed
            $table->json('item_ids')->change();
            $table->json('item_names')->change();
        });
    }
};