<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::table('borrows', function (Blueprint $table) {
            // Only drop foreign key if the column and constraint are expected to exist
            if (Schema::hasColumn('borrows', 'item_id')) {
                $table->dropForeign(['item_id']);
                $table->dropColumn('item_id');
            }

            if (Schema::hasColumn('borrows', 'item_name')) {
                $table->dropColumn('item_name');
            }
        });
    }

    public function down()
    {
        Schema::table('borrows', function (Blueprint $table) {
            $table->unsignedBigInteger('item_id')->nullable();
            $table->string('item_name')->nullable();

            // Re-add foreign key only if `items` table exists
            if (Schema::hasTable('items')) {
                $table->foreign('item_id')->references('id')->on('items')->onDelete('cascade');
            }
        });
    }
};
