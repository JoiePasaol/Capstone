<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Faker\Factory as Faker;
use Illuminate\Support\Str;

class ItemSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $faker = Faker::create();
        

        $userIds = \App\Models\User::pluck('id')->toArray();
      
        for ($i = 0; $i < 60; $i++) {
            DB::table('items')->insert([
                'user_id' => $faker->randomElement($userIds), 
                'name' => $faker->name,
                'department' => $faker->word,
                'categories' => $faker->word,
                'description' => $faker->word,
                'items' => $faker->word,
                'quantity' => $faker->numberBetween(1, 100),
                'price' => $faker->randomFloat(2, 1, 1000),
                'image' => $faker->boolean(50) ? $faker->imageUrl() : null, 
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
