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
        Schema::create('returned_items', function (Blueprint $table) {
            $table->id();
            $table->string('item_name', 255);
            $table->unsignedBigInteger('user_id');
            $table->string('person_name', 255);
            $table->string('office_name', 255);
            $table->integer('quantity_returned');
            $table->date('return_date');
            $table->enum('condition', ['good', 'damaged', 'repairable']);
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->string('damage', 255)->nullable();
            $table->text('repair_solution')->nullable();
            $table->text('description')->nullable();
            $table->string('unit_of_measures', 255)->nullable();
            $table->string('property_no', 255)->nullable();
            $table->date('purchased_date')->nullable();
            $table->decimal('amount', 10, 2)->nullable();
            
            // Foreign key relationship
            $table->foreign('user_id')->references('id')->on('users');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('returned_items');
    }
}; 