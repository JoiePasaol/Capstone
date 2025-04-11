<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Faker\Factory as Faker;
use Illuminate\Support\Str;
use Carbon\Carbon;

class ItemListSeeder extends Seeder
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

        for ($i = 0; $i < 60; $i++) {
            $createdAt = Carbon::now()->subDays(rand(0, 365))->format('Y-m-d H:i:s');
            $updatedAt = Carbon::parse($createdAt)->addDays(rand(1, 30))->format('Y-m-d H:i:s');
            $datePurchase = Carbon::now()->subDays(rand(0, 365))->format('Y-m-d');

            DB::table('items')->insert([
                'user_id' => $faker->randomElement($userIds),
                'name' => $faker->name,
                'department' => $faker->randomElement(['System', 'HR', 'IT', 'Finance']),
                'image' => $faker->boolean(50) ? 'item-image-' . rand(1, 5) . '.jpg' : null,
                'categories' => $faker->randomElement(['Hardware', 'Software', 'Furniture', 'Appliances']),
                'items' => $faker->randomElement([
                    'Desktop Computer',
                    'Laptop',
                    'Printer',
                    'Scanner',
                    'Office Chair',
                    'Desk',
                    'Filing Cabinet',
                    'Monitor'
                ]),
                'description' => $faker->sentence(10),
                'estimated_life' => rand(1, 10) . ' years',
                'quantity' => rand(1, 100),
                'price' => $faker->randomFloat(2, 1000, 50000),
                'suppliers' => $faker->randomElement($supplierNames),
                'ics' => 'ICS-' . rand(1000, 9999),
                'pr' => 'PR-' . rand(1000, 9999),
                'pr_date' => $faker->date('Y-m-d'),
                'po' => 'PO-' . rand(1000, 9999),
                'po_date' => $faker->date('Y-m-d'),
                'vc' => 'VC-' . rand(1000, 9999),
                'vc_date' => $faker->date('Y-m-d'),
                'ch' => 'CH-' . rand(1000, 9999),
                'ch_date' => $faker->date('Y-m-d'),
                'or' => 'OR-' . rand(1000, 9999),
                'or_date' => $faker->date('Y-m-d'),
                'property_no' => 'PROP-' . rand(10000, 99999),
                'classification_no' => 'CL-' . rand(100, 999),
                'date_purchase' => $datePurchase,
                'created_at' => $createdAt,
                'updated_at' => $updatedAt,
            ]);
        }
    }
}
