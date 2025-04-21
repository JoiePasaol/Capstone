<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;
use Faker\Factory as Faker;

class ItemsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * Generates realistic inventory items for an organization with proper
     * documentation, tracking numbers, and departmental categorization.
     *
     * @return void
     */
    public function run()
    {
        $faker = Faker::create();
        $userIds = \App\Models\User::pluck('id')->toArray();

        // Realistic supplier companies with business names
        $supplierNames = [
            'TechVantage Solutions Inc.',
            'Office Essentials Co.',
            'Global IT Suppliers Ltd.',
            'Ergonomic Workspace Systems',
            'DataStor Equipment & Services',
            'Premier Business Furnishings',
            'Integrated Technology Partners',
            'Quality Computing Solutions'
        ];

        // Realistic hardware items by department
        $itemsByDepartment = [
            'IT' => [
                'Hardware' => [
                    'Dell Latitude 5420 Laptop',
                    'HP EliteDesk 800 G6 Desktop',
                    'Lenovo ThinkCentre M720 Workstation',
                    'Cisco Catalyst 2960 Switch',
                    'Ubiquiti UniFi AP Pro Access Point',
                    'WD 4TB External Hard Drive',
                    'Logitech MX Master 3 Mouse',
                    'Microsoft Ergonomic Keyboard',
                    'LG 27" UltraFine 4K Monitor',
                    'HP LaserJet Pro M404n Printer'
                ],
                'Software' => [
                    'Microsoft Office 365 Business License',
                    'Adobe Creative Cloud Subscription',
                    'Windows 11 Pro License',
                    'Autodesk AutoCAD License',
                    'VMware Workstation Pro License',
                    'QuickBooks Enterprise Solution',
                    'Symantec Endpoint Protection',
                    'SQL Server 2022 Standard Edition',
                    'Power BI Professional License',
                    'Zoom Enterprise Plan'
                ]
            ],
            'HR' => [
                'Furniture' => [
                    'Herman Miller Aeron Chair',
                    'Steelcase Gesture Office Chair',
                    'HON Ignition Task Chair',
                    'Varidesk Pro Plus 36 Standing Desk',
                    'Steelcase Flex Height-Adjustable Desk',
                    'Global Adaptabilities Bookcase',
                    'HON Brigade 5-Drawer File Cabinet',
                    'IKEA BEKANT Conference Table',
                    'IKEA BILLY Bookcase',
                    'Safco Mobile Literature Organizer'
                ],
                'Appliances' => [
                    'Keurig K155 Office Pro Coffee Maker',
                    'Frigidaire 4.5 cu ft Refrigerator',
                    'Panasonic 1.2 cu ft Microwave',
                    'Honeywell HEPA Air Purifier',
                    'Dyson Pure Hot+Cool Link Purifier',
                    'Fellowes AutoMax Paper Shredder',
                    'Samsung 43" Smart TV',
                    'JBL Charge 4 Bluetooth Speaker',
                    'Logitech ConferenceCam Connect',
                    'Sharp Digital Display Board'
                ]
            ],
            'Finance' => [
                'Hardware' => [
                    'HP Color LaserJet Pro MFP M479fdw',
                    'Brother HL-L8360CDW Color Laser Printer',
                    'Epson WorkForce Pro WF-4740 Scanner',
                    'Canon imageFORMULA DR-C225 II Scanner',
                    'Xerox WorkCentre 6515 MFP',
                    'HP ScanJet Pro 3000 s3 Scanner',
                    'Logitech C920 HD Webcam',
                    'Jabra Evolve 75 Headset',
                    'Dual Monitor Mount Stand',
                    'Kensington Expert Mouse Trackball'
                ],
                'Furniture' => [
                    'HON Validate L-Workstation Desk',
                    'Global Princeton Executive Desk',
                    'OFM ESS Collection 2-Drawer File Cabinet',
                    'Bush Business Furniture 5-Shelf Bookcase',
                    'Flash Furniture Conference Table',
                    'Sauder Heritage Hill Executive Desk',
                    'Safco Mobile Machine Stand',
                    'Lorell 87000 Series Hutch',
                    'Bush Business Furniture Storage Cabinet',
                    'HON Ignition Guest Chair (Set of 2)'
                ]
            ],
            'System' => [
                'Hardware' => [
                    'Dell PowerEdge R740 Server',
                    'HP ProLiant DL380 Gen10 Server',
                    'Synology DiskStation DS1821+ NAS',
                    'QNAP TS-h973AX NAS',
                    'APC Smart-UPS 1500VA LCD UPS',
                    'Cisco Meraki MX68 Security Appliance',
                    'SonicWall TZ400 Firewall',
                    'Ubiquiti UniFi Dream Machine Pro',
                    'NetApp FAS2750 Storage System',
                    'Seagate IronWolf Pro 16TB NAS HDD'
                ],
                'Software' => [
                    'VMware vSphere Enterprise Plus',
                    'Microsoft Windows Server 2022 Datacenter',
                    'Red Hat Enterprise Linux Subscription',
                    'Oracle Database Enterprise Edition',
                    'MongoDB Enterprise Advanced License',
                    'Veeam Backup & Replication Enterprise',
                    'Splunk Enterprise License',
                    'Citrix Virtual Apps and Desktops',
                    'Acronis Cyber Protect Cloud',
                    'ManageEngine ServiceDesk Plus'
                ]
            ]
        ];

        // Price ranges by category
        $priceRanges = [
            'Hardware' => [1500, 25000],
            'Software' => [500, 15000],
            'Furniture' => [800, 8000],
            'Appliances' => [500, 5000]
        ];

        // Expected useful life by category (in years)
        $lifeExpectancy = [
            'Hardware' => [3, 5],
            'Software' => [1, 3],
            'Furniture' => [5, 10],
            'Appliances' => [3, 7]
        ];

        // Generate 200 items with realistic data
        for ($i = 0; $i < 200; $i++) {
            // Select random department and category
            $department = $faker->randomElement(array_keys($itemsByDepartment));
            $category = $faker->randomElement(array_keys($itemsByDepartment[$department]));

            // Select random item name from the appropriate department and category
            $itemName = $faker->randomElement($itemsByDepartment[$department][$category]);

            // Generate realistic timestamps
            $createdAt = Carbon::now()->subDays(rand(1, 365))->format('Y-m-d H:i:s');
            $updatedAt = Carbon::parse($createdAt)->addDays(rand(0, 30))->format('Y-m-d H:i:s');
            $datePurchase = Carbon::parse($createdAt)->format('Y-m-d');

            // Generate PO date before purchase date
            $poDate = Carbon::parse($datePurchase)->subDays(rand(5, 20))->format('Y-m-d');

            // Generate PR date before PO date
            $prDate = Carbon::parse($poDate)->subDays(rand(3, 15))->format('Y-m-d');

            // Generate VC, CH, and OR dates after PO date
            $vcDate = Carbon::parse($poDate)->addDays(rand(1, 5))->format('Y-m-d');
            $chDate = Carbon::parse($vcDate)->addDays(rand(1, 3))->format('Y-m-d');
            $orDate = Carbon::parse($chDate)->addDays(rand(0, 2))->format('Y-m-d');

            // Generate realistic quantity values
            $quantity = $faker->numberBetween(1, 20);
            $remainingQuantity = $faker->numberBetween(0, $quantity);

            // Generate realistic price based on category
            $priceRange = $priceRanges[$category];
            $price = $faker->randomFloat(2, $priceRange[0], $priceRange[1]);

            // Generate realistic life expectancy based on category
            $lifeRange = $lifeExpectancy[$category];
            $estimatedLife = $faker->numberBetween($lifeRange[0], $lifeRange[1]) . ' years';

            // Generate realistic item description
            $descriptions = [
                'Hardware' => [
                    'High-performance enterprise-grade equipment for daily operations.',
                    'Energy-efficient device with extended warranty coverage.',
                    'Business-class equipment with manufacturer support.',
                    'Professional-grade hardware with technical specifications exceeding requirements.',
                    'Standard office equipment for administrative functions.'
                ],
                'Software' => [
                    'Enterprise software license with annual subscription and support plan.',
                    'Professional edition with cloud storage integration.',
                    'Multi-user license with technical support and updates.',
                    'Business subscription for department-wide usage.',
                    'Standard license with maintenance agreement and security updates.'
                ],
                'Furniture' => [
                    'Ergonomic design with adjustable components for comfort.',
                    'Commercial-grade construction with extended warranty.',
                    'Professional office furniture with modern aesthetic.',
                    'Durable construction with premium materials and finish.',
                    'Space-efficient design for optimal workspace utilization.'
                ],
                'Appliances' => [
                    'Energy Star certified with programmable features.',
                    'Commercial-grade appliance for office environment.',
                    'Multi-functional device with digital controls.',
                    'High-efficiency model with low maintenance requirements.',
                    'Compact design with advanced features for daily use.'
                ]
            ];

            $itemDescription = $faker->randomElement($descriptions[$category]) . ' ' .
                               'Asset ID: ' . strtoupper(Str::random(6)) . '.';

            // Current fiscal year
            $fiscalYear = date('y');

            // Generate a sequential item code
            $itemCode = strtoupper(substr($department, 0, 1) . substr($category, 0, 1) . '-' . $fiscalYear . '-' . str_pad($i + 1, 4, '0', STR_PAD_LEFT));

            // Insert the item into the database
            DB::table('items')->insert([
                'user_id' => $faker->randomElement($userIds),
                'name' => $itemName,
                'department' => $department,
                'image' => $faker->boolean(70) ? 'assets/images/items/' . strtolower(str_replace(' ', '-', $category)) . '/' . $faker->numberBetween(1, 10) . '.jpg' : null,
                'categories' => $category,
                'items' => $itemCode,
                'description' => $itemDescription,
                'estimated_life' => $estimatedLife,
                'quantity' => $quantity,
                'remaining_quantity' => $remainingQuantity,
                'price' => $price,
                'suppliers' => $faker->randomElement($supplierNames),
                'ics' => $fiscalYear . '-' . $faker->randomNumber(4, true),
                'pr' => sprintf('%02d', $faker->numberBetween(1, 12)) . '-' . $fiscalYear . '-' . $faker->randomNumber(4, true),
                'pr_date' => $prDate,
                'po' => sprintf('%02d', $faker->numberBetween(1, 12)) . '-' . $fiscalYear . '-' . $faker->randomNumber(3, true),
                'po_date' => $poDate,
                'vc' => '100-' . $fiscalYear . '-' . $faker->randomNumber(4, true),
                'vc_date' => $vcDate,
                'ch' => $fiscalYear . $faker->randomNumber(6, true),
                'ch_date' => $chDate,
                'or' => $fiscalYear . '-' . $faker->randomNumber(6, true),
                'or_date' => $orDate,
                'property_no' => 'PN-' . $department . '-' . $fiscalYear . '-' . str_pad($i + 1, 4, '0', STR_PAD_LEFT),
                'classification_no' => 'CL-' . substr($category, 0, 2) . '-' . $fiscalYear . str_pad($faker->numberBetween(1, 999), 3, '0', STR_PAD_LEFT),
                'date_purchase' => $datePurchase,
                'created_at' => $createdAt,
                'updated_at' => $updatedAt,
            ]);
        }
    }
}
