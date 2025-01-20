<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Faker\Factory as Faker;

class AdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $faker = Faker::create();

        // Creating the admin user
        User::updateOrCreate(
            ['email' => 'admin@example.com'], 
            [
                'firstname' => 'Admin',
                'lastname' => 'User',
                'email' => 'admin@example.com',
                'department' => 'n/a',
                'role' => 'Super Admin',
                'password' => Hash::make('password'), 
                'email_verified_at' => now(),
            ]
        );

        // Creating more than 200 users
        for ($i = 0; $i < 100; $i++) {
            User::create([
                'firstname' => $faker->firstName,
                'lastname' => $faker->lastName,
                'email' => $faker->unique()->safeEmail,
                'department' => $faker->word,
                'role' => $faker->randomElement(['Admin', 'User', 'Manager']),
                'password' => Hash::make('password'), 
                'email_verified_at' => now(),
            ]);
        }
    }
}
