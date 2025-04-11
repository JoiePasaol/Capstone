<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('transferred_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('original_item_id')->constrained('items')->onDelete('cascade');
            $table->integer('quantity');
            $table->string('transfer_to');

            // Original fields
            $table->string('name_designation');
            $table->string('position_intended');
            $table->string('designated_office');
            $table->string('office_name_designation');
            $table->string('office_position_intended');

            // New authorization fields
            $table->string('recommended_by_name');
            $table->string('recommended_by_title');
            $table->string('approved_by_name');
            $table->string('approved_by_title');
            $table->string('witnessed_by_name');
            $table->string('witnessed_by_title');

            // Item details
            $table->string('category');
            $table->text('description')->nullable();
            $table->string('property_no')->nullable();
            $table->string('classification_no')->nullable();
            $table->decimal('amount', 10, 2);
            $table->date('date_purchase')->nullable();

            // Timestamps
            $table->timestamp('transferred_at')->useCurrent();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('transferred_items');
    }
};
