<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Faker\Factory as Faker;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $faker = Faker::create();
    
        // Insert default account
        DB::table('users')->insert([
            'firstname' => 'Admin',
            'lastname' => 'User',
            'department' => 'System',
            'email' => 'admin@example.com',
            'role' => 'Admin',
            'status' => 'active',
            'email_verified_at' => now(),
            'password' => bcrypt('password'), 
            'remember_token' => Str::random(10),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    
        // Seed users table with random data
        for ($i = 0; $i < 100; $i++) {
            DB::table('users')->insert([
                'firstname' => $faker->firstName,
                'lastname' => $faker->lastName,
                'department' => $faker->word,
                'email' => $faker->unique()->safeEmail,
                'role' => $faker->randomElement(['Basic', 'Admin']),
                'status' => $faker->randomElement(['pending']),
                'email_verified_at' => $faker->boolean ? $faker->dateTimeThisYear : null,
                'password' => bcrypt('password'), // For simplicity, using a static password
                'remember_token' => Str::random(10),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    
        // Seed password_reset_tokens table
        for ($i = 0; $i < 100; $i++) {
            DB::table('password_reset_tokens')->insert([
                'email' => $faker->unique()->safeEmail,
                'token' => Str::random(60),
                'created_at' => now(),
            ]);
        }
    
        // Seed sessions table
        for ($i = 0; $i < 100; $i++) {
            DB::table('sessions')->insert([
                'id' => Str::random(40),
                'user_id' => $faker->randomElement(range(1, 100)), // Assuming you have at least 100 users
                'ip_address' => $faker->ipv4,
                'user_agent' => $faker->userAgent,
                'payload' => $faker->text,
                'last_activity' => now()->timestamp,
            ]);
        }
    }
    
}
