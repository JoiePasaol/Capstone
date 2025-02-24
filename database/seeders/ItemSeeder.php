<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Faker\Factory as Faker;
use Illuminate\Support\Str;
use Carbon\Carbon;

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
            // Ensure created_at is within the past year with proper format
            $createdAt = Carbon::now()->subDays(rand(0, 365))->format('Y-m-d H:i:s');
            $updatedAt = Carbon::parse($createdAt)->addDays(rand(1, 30))->format('Y-m-d H:i:s');

            DB::table('items')->insert([
                'user_id' => $faker->randomElement($userIds),
                'name' => $faker->word . ' ' . $faker->word,
                'department' => $faker->randomElement(['System', 'HR', 'IT', 'Finance']),
                'image' => $faker->boolean(50) ? $faker->imageUrl() : null,
                'categories' => $faker->randomElement(['Hardware', 'Software', 'Furniture', 'Appliances']),
                'items' => strtoupper(Str::random(8)),
                'description' => $faker->sentence(10),
                'estimated_life' => $faker->numberBetween(1, 10) . ' years',
                'quantity' => $faker->numberBetween(1, 100),
                'price' => $faker->randomFloat(2, 1000, 50000), 
                'ics' => '24-' . $faker->randomNumber(4),
                'pr' => '01-24-' . $faker->randomNumber(4),
                'pr_date' => $faker->date('Y-m-d'),
                'po' => '01-2024-' . $faker->randomNumber(3),
                'po_date' => $faker->date('Y-m-d'),
                'vc' => '100-24-' . $faker->randomNumber(4),
                'vc_date' => $faker->date('Y-m-d'),
                'ch' => (string) $faker->randomNumber(7),
                'ch_date' => $faker->date('Y-m-d'),
                'or' => (string) $faker->randomNumber(6),
                'or_date' => $faker->date('Y-m-d'),
                'created_at' => $createdAt, 
                'updated_at' => $updatedAt, 
            ]);
        }
    }
}
