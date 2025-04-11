<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
// In the migration file
public function up()
{
    Schema::table('transferred_items', function (Blueprint $table) {
        $table->json('approval_status')->nullable()->comment('JSON of signatory approval statuses');
        $table->boolean('is_fully_approved')->default(false);
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('transferred_items', function (Blueprint $table) {
            //
        });
    }
};
