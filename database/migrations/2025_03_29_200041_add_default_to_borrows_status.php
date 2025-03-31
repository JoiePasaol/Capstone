<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('borrows', function (Blueprint $table) {
            $table->string('status')
                  ->default('Borrowed')  // Set default value
                  ->change();            // Modify existing column
        });
    }

    public function down()
    {
        Schema::table('borrows', function (Blueprint $table) {
            $table->string('status')
                  ->default(null)        // Remove default value
                  ->change();
        });
    }
};