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
            $table->string('department'); 
            $table->string('image')->nullable();
            $table->string('categories');
            $table->string('items');
            $table->longText('description');
            $table->string('estimated_life');
            $table->integer('quantity');
            $table->decimal('price', 15, 2);
            $table->string('ics')->nullable();
            $table->string('pr')->nullable();
            $table->date('pr_date')->nullable();
            $table->string('po')->nullable();
            $table->date('po_date')->nullable();
            $table->string('vc')->nullable();
            $table->date('vc_date')->nullable();
            $table->string('ch')->nullable();
            $table->date('ch_date')->nullable();
            $table->string('or')->nullable();
            $table->date('or_date')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('items');
    }
};
