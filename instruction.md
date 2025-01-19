# Laravel + React Application

This is a Laravel + React project using Inertia.js, Laravel Breeze, and Tailwind CSS. Follow the instructions below to set up and run the application locally.
---
## Requirements

Ensure the following are installed on your machine:

-   **PHP** >= 8.2
-   **Composer** (latest version)
-   **Node.js** >= 16 and **npm** or **yarn**
-   **MySQL** or another supported database
-   **Git**

---

## Installation

1. **Clone the Repository**

bash
git clone <https://github.com/JoiePasaol/Capstone.git>
cd <repository-folder>

2. **Install PHP Dependencies**

composer install

3. **Install Node.js Dependencies**

npm install

4. **Set Up the Environment File**

cp .env <https://drive.google.com/file/d/1qVnZsZBZHyeiG0pNZjJ_BJdMoYuEOpnL/view?usp=sharing>

5. **Set Up the Database**

php artisan migrate

6. **Seeder**

php artisan db:seed --class=AdminSeeder

7. **Compile Frontend Assets**

npm run dev

8. **Run the Laravel Development Server**

php artisan serve

8. **Optional: Run Concurrently**

composer run dev
