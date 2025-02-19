<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::create('borrows', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->foreignId('item_id')->constrained('items')->onDelete('cascade');
            $table->string('item_name');
            $table->date('return_date');
            $table->string('status');
            $table->timestamps();
        });
        
    }

    public function down()
    {
        Schema::dropIfExists('borrows');
    }
};