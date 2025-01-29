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
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // Ensure a user relation
            $table->string('firstname')->nullable();  
        $table->string('department')->nullable(); 
            $table->string('image')->nullable();
            $table->string('categories');
            $table->string('brand');
            $table->string('items');
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