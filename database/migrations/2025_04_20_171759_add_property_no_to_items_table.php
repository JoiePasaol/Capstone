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
    Schema::table('items', function (Blueprint $table) {
        $table->string('property_no')->nullable()->after('or_date');
        $table->string('classification_no')->nullable()->after('property_no');
    });
}

public function down()
{
    Schema::table('items', function (Blueprint $table) {
        $table->dropColumn(['property_no', 'classification_no']);
    });
}
};
