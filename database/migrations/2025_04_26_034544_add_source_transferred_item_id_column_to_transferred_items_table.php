<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('transferred_items', function (Blueprint $table) {
            $table->unsignedBigInteger('source_transferred_item_id')->nullable()->after('original_item_id');

            // Add foreign key constraint if needed
            // This can be removed if you'd prefer not to have a foreign key constraint
            $table->foreign('source_transferred_item_id')
                  ->references('id')
                  ->on('transferred_items')
                  ->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('transferred_items', function (Blueprint $table) {
            // Drop foreign key first if you added it
            if (Schema::hasColumn('transferred_items', 'source_transferred_item_id')) {
                $table->dropForeign(['source_transferred_item_id']);
                $table->dropColumn('source_transferred_item_id');
            }
        });
    }
};
