<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); 
            $table->string('name');
            $table->string('department')->nullable(); 
            $table->string('image')->nullable();
            $table->string('categories');
            $table->string('items');
            $table->longText('description');
            $table->integer('quantity');
            $table->decimal('price', 8, 2);
            $table->timestamps();
        });
        
    }

    public function down(): void
    {
        Schema::dropIfExists('items');

    }
};