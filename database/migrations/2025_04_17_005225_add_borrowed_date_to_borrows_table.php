<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddBorrowedDateToBorrowsTable extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('borrows', function (Blueprint $table) {
            $table->date('borrowed_date')->after('quantity')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('borrows', function (Blueprint $table) {
            $table->dropColumn('borrowed_date');
        });
    }
}
