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
            $table->dropColumn('item_id');
        });
    }
    
    public function down()
    {
        Schema::table('borrows', function (Blueprint $table) {
            $table->foreignId('item_id')->constrained('items')->onDelete('cascade');
        });
    }
    
};
