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
        $supplierNames = ['Supplier A', 'Supplier B', 'Supplier C', 'Supplier D', 'Supplier E'];

        for ($i = 0; $i < 200; $i++) {
            // Timestamps
            $createdAt = Carbon::now()->subDays(rand(0, 365))->format('Y-m-d H:i:s');
            $updatedAt = Carbon::parse($createdAt)->addDays(rand(1, 30))->format('Y-m-d H:i:s');
            $datePurchase = Carbon::parse($createdAt)->format('Y-m-d');

            $quantity = $faker->numberBetween(1, 100);
            $remainingQuantity = $faker->numberBetween(0, $quantity);

            DB::table('items')->insert([
                'user_id' => $faker->randomElement($userIds),
                'name' => $faker->word . ' ' . $faker->word,
                'department' => $faker->randomElement(['System', 'HR', 'IT', 'Finance']),
                'image' => $faker->boolean(50) ? $faker->imageUrl() : null,
                'categories' => $faker->randomElement(['Hardware', 'Software', 'Furniture', 'Appliances']),
                'items' => strtoupper(Str::random(8)),
                'description' => $faker->sentence(10),
                'estimated_life' => $faker->numberBetween(1, 10) . ' years',
                'quantity' => $quantity,
                'remaining_quantity' => $remainingQuantity,
                'price' => $faker->randomFloat(2, 1000, 50000),
                'suppliers' => $faker->randomElement($supplierNames),
                'ics' => '24-' . $faker->randomNumber(4, true),
                'pr' => '01-24-' . $faker->randomNumber(4, true),
                'pr_date' => $faker->date('Y-m-d'),
                'po' => '01-2024-' . $faker->randomNumber(3, true),
                'po_date' => $faker->date('Y-m-d'),
                'vc' => '100-24-' . $faker->randomNumber(4, true),
                'vc_date' => $faker->date('Y-m-d'),
                'ch' => (string) $faker->randomNumber(7, true),
                'ch_date' => $faker->date('Y-m-d'),
                'or' => (string) $faker->randomNumber(6, true),
                'or_date' => $faker->date('Y-m-d'),
                'property_no' => 'PN-' . strtoupper(Str::random(6)),
                'classification_no' => 'CL-' . strtoupper(Str::random(4)),
                'date_purchase' => $datePurchase,
                'created_at' => $createdAt,
                'updated_at' => $updatedAt,
            ]);
        }
    }
}
