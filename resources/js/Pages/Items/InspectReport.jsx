import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { Printer, Search } from 'lucide-react';
import { Link, router } from '@inertiajs/react';

export default function InspectReport({ damagedItems }) {
    const [selectedYear, setSelectedYear] = useState('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [searchTerm, setSearchTerm] = useState('');
    
    // State for managing all data and pagination
    const [allItems, setAllItems] = useState(damagedItems.data);
    const [filteredItems, setFilteredItems] = useState(damagedItems.data);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(Math.ceil(damagedItems.total / 10));
    const [paginatedItems, setPaginatedItems] = useState(damagedItems.data);
    const [itemsPerPage] = useState(10);

    // Generate array of years from 2000 to current year
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: currentYear - 1999 }, (_, i) => currentYear - i);

    // Handle year change
    const handleYearChange = (value) => {
        setSelectedYear(value);
        let startDate = '';
        let endDate = '';
        
        if (value) {
            startDate = `${value}-01-01`;
            endDate = `${value}-12-31`;
            setDateRange({ start: startDate, end: endDate });
        } else {
            setDateRange({ start: '', end: '' });
        }
        
        applyFilters(searchTerm, value, startDate, endDate);
    };

    // Handle search
    const handleSearch = (value) => {
        setSearchTerm(value);
        applyFilters(value, selectedYear, dateRange.start, dateRange.end);
    };

    // Handle date range change
    const handleDateRangeChange = (type, value) => {
        const newDateRange = { ...dateRange, [type]: value };
        setDateRange(newDateRange);
        applyFilters(searchTerm, selectedYear, newDateRange.start, newDateRange.end);
    };

    // Apply all filters
    const applyFilters = (search, year, startDate, endDate) => {
        let filtered = [...allItems];

        // Apply search filter
        if (search) {
            const searchLower = search.toLowerCase();
            filtered = filtered.filter(item => 
                (item.item_name && item.item_name.toLowerCase().includes(searchLower)) ||
                (item.description && item.description.toLowerCase().includes(searchLower)) ||
                (item.property_no && item.property_no.toLowerCase().includes(searchLower))
            );
        }

        // Apply year filter directly or through date range
        if (year && (!startDate || !endDate)) {
            filtered = filtered.filter(item => {
                if (!item.return_date) return false;
                const itemDate = new Date(item.return_date);
                return itemDate.getFullYear().toString() === year;
            });
        }

        // Apply date range filter
        if (startDate && endDate) {
            filtered = filtered.filter(item => {
                if (!item.return_date) return false;
                const itemDate = new Date(item.return_date);
                const start = new Date(startDate);
                const end = new Date(endDate);
                // Set time to start of day for start and end of day for end
                start.setHours(0, 0, 0, 0);
                end.setHours(23, 59, 59, 999);
                return itemDate >= start && itemDate <= end;
            });
        }

        // Update filtered results and reset to first page
        setFilteredItems(filtered);
        setCurrentPage(1);
        setTotalPages(Math.ceil(filtered.length / itemsPerPage));
        updatePaginatedItems(filtered, 1);
    };

    // Update paginated items based on current page
    const updatePaginatedItems = (data, page) => {
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        setPaginatedItems(data.slice(startIndex, endIndex));
    };

    // Handle page change
    const handlePageChange = (page) => {
        setCurrentPage(page);
        updatePaginatedItems(filteredItems, page);
    };

    // Initialize data and fetch all items if needed
    useEffect(() => {
        setAllItems(damagedItems.data);
        setFilteredItems(damagedItems.data);
        updatePaginatedItems(damagedItems.data, currentPage);

        // If there's more data than what's loaded initially, fetch all data
        if (damagedItems.data.length < damagedItems.total) {
            router.get(route('inspect-report'), 
                { get_all: 'true' },
                { 
                    preserveState: true,
                    only: ['damagedItems'],
                    onSuccess: (page) => {
                        if (page.props.damagedItems && page.props.damagedItems.data) {
                            const allData = page.props.damagedItems.data;
                            setAllItems(allData);
                            
                            // Re-apply any existing filters
                            let filtered = allData;
                            
                            if (searchTerm) {
                                const searchLower = searchTerm.toLowerCase();
                                filtered = filtered.filter(item => 
                                    (item.item_name && item.item_name.toLowerCase().includes(searchLower)) ||
                                    (item.description && item.description.toLowerCase().includes(searchLower)) ||
                                    (item.property_no && item.property_no.toLowerCase().includes(searchLower))
                                );
                            }
                            
                            // Apply year filter directly or date range from year
                            if (selectedYear) {
                                if (dateRange.start && dateRange.end) {
                                    // Filter by date range if it exists
                                    filtered = filtered.filter(item => {
                                        if (!item.return_date) return false;
                                        const itemDate = new Date(item.return_date);
                                        const start = new Date(dateRange.start);
                                        const end = new Date(dateRange.end);
                                        // Set time to start of day for start and end of day for end
                                        start.setHours(0, 0, 0, 0);
                                        end.setHours(23, 59, 59, 999);
                                        return itemDate >= start && itemDate <= end;
                                    });
                                } else {
                                    // Otherwise filter directly by year
                                    filtered = filtered.filter(item => {
                                        if (!item.return_date) return false;
                                        const itemDate = new Date(item.return_date);
                                        return itemDate.getFullYear().toString() === selectedYear;
                                    });
                                }
                            } else if (dateRange.start && dateRange.end) {
                                // If no year but date range exists
                                filtered = filtered.filter(item => {
                                    if (!item.return_date) return false;
                                    const itemDate = new Date(item.return_date);
                                    const start = new Date(dateRange.start);
                                    const end = new Date(dateRange.end);
                                    // Set time to start of day for start and end of day for end
                                    start.setHours(0, 0, 0, 0);
                                    end.setHours(23, 59, 59, 999);
                                    return itemDate >= start && itemDate <= end;
                                });
                            }
                            
                            setFilteredItems(filtered);
                            setTotalPages(Math.ceil(filtered.length / itemsPerPage));
                            updatePaginatedItems(filtered, currentPage);
                        }
                    }
                }
            );
        }
    }, [damagedItems.data]);

    // Handle print report for all filtered items
    const handlePrintReport = () => {
        const printContent = `
            <html>
                <head>
                    <title>WASTE MATERIALS REPORT</title>
                    <style>
                        body { 
                            font-family: Arial, sans-serif; 
                            padding: 20px;
                            color: #333;
                        }
                        .report { 
                            width: 100%;
                            border-collapse: collapse;
                            margin-bottom: 20px;
                        }
                        .report td, .report th {
                            padding: 8px;
                            border: 1px solid #000;
                            vertical-align: top;
                        }
                        .header {
                            text-align: center;
                            font-weight: bold;
                            font-size: 16px;
                        }
                        .sub-header {
                            font-weight: bold;
                        }
                        .signature-line {
                            border-top: 1px solid #000;
                            width: 200px;
                            display: inline-block;
                            margin-top: 40px;
                        }
                        .signature-container {
                            margin-top: 20px;
                        }
                        .signature-name {
                            margin-top: 5px;
                            font-weight: bold;
                        }
                        .info-container {
                            display: flex;
                            justify-content: space-between;
                        }
                        .info-left {
                            width: 60%;
                        }
                        .info-right {
                            width: 35%;
                            text-align: right;
                        }
                        .info-row {
                            display: flex;
                            margin-bottom: 5px;
                        }
                        .info-label {
                            width: 100px;
                            font-weight: bold;
                        }
                        .info-value {
                            flex-grow: 1;
                        }
                        @media print {
                            body {
                                padding: 0;
                            }
                            .no-print {
                                display: none;
                            }
                        }
                    </style>
                </head>
                <body>
                    <table class="report">
                        <!-- Header Section -->
                        <tr>
                            <td colspan="7" class="header">Waste Materials Report</td>
                        </tr>
                        <tr>
                            <td colspan="7">
                                <div class="info-container">
                                    <div class="info-left">
                                        <div class="info-row">
                                            <div class="info-label">OFFICE</div>
                                            <div class="info-value">MAYOR OFFICE</div>
                                        </div>
                                        <div class="info-row">
                                            <div class="info-label">LGU</div>
                                            <div class="info-value">Municipality of Magallanes</div>
                                        </div>
                                        <div class="info-row">
                                            <div class="info-label">Place of</div>
                                            <div class="info-value">General Service Office SHOP</div>
                                        </div>
                                        <div class="info-row">
                                            <div class="info-label">Storage :</div>
                                            <div class="info-value"></div>
                                        </div>
                                    </div>
                                    <div class="info-right">
                                        <div class="info-row">
                                            <div class="info-label">Fund :</div>
                                            <div class="info-value">General Fund</div>
                                        </div>
                                        <div class="info-row">
                                            <div class="info-label">Date :</div>
                                            <div class="info-value">${new Date().toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                </div>
                            </td>
                        </tr>
                        
                        <!-- ITEMS FOR DISPOSAL SECTION -->
                        <tr>
                            <td colspan="7" class="header">ITEMS FOR DISPOSAL</td>
                        </tr>
                        <tr class="sub-header">
                            <td>ITEMS</td>
                            <td>QUANTITY</td>
                            <td>Unit of Measures</td>
                            <td>DESCRIPTION</td>
                            <td colspan="3">RECORD OF SALES<br><span style="font-weight:normal">Official Receipt</span></td>
                        </tr>
                        <tr class="sub-header">
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td>NO.</td>
                            <td>Date</td>
                            <td>Amount</td>
                        </tr>
                        ${filteredItems.map(item => `
                            <tr>
                                <td>${item.item_name || '-'}</td>
                                <td>${item.quantity_returned || '-'}</td>
                                <td>${item.unit_of_measures || '-'}</td>
                                <td>${item.description || '-'}</td>
                                <td>${item.property_no || '-'}</td>
                                <td>${item.purchased_date || '-'}</td>
                                <td>${item.amount ? Number(item.amount).toFixed(2) : '-'}</td>
                            </tr>
                        `).join('')}
                        
                        <!-- SIGNATURE SECTION 1 -->
                        <tr>
                            <td colspan="7">
                                <div style="display: flex; justify-content: space-between; margin-top: 20px;">
                                    <div>
                                        <div>Certified Correct:</div>
                                        <div class="signature-line"></div>
                                        <div class="signature-name">EMMANUEL A. LAVADOR</div>
                                        <div>GSO-Designate</div>
                                    </div>
                                    <div>
                                        <div>Disposal Approved:</div>
                                        <div class="signature-line"></div>
                                        <div class="signature-name">CESAR C. CUMBA, JR</div>
                                        <div>Municipal Mayor</div>
                                    </div>
                                </div>
                            </td>
                        </tr>
                        
                        <!-- CERTIFICATE OF INSPECTION SECTION -->
                        <tr>
                            <td colspan="7" class="header">CERTIFICATE OF INSPECTION</td>
                        </tr>
                        
                        <tr>
                            <td colspan="7">
                                <div style="margin-bottom: 20px; margin-left: 20px;">
                                    I HEREBY certify that the property/supplies enumerated above was disposed of as follows:
                                </div>
                                <div style="margin-left: 20px;">
                                    <div>Item ________________________________________________ Destroyed/Broken</div>
                                    <div>Item ________________________________________________ Sold at Private Sale</div>
                                    <div>Item ________________________________________________ Sold at Public Auction</div>
                                    <div>Item ________________________________________________ Transferred without cost to</div>
                                </div>
                            </td>
                        </tr>
                        
                        <!-- SIGNATURE SECTION 2 -->
                        <tr>
                            <td colspan="7">
                                <div style="display: flex; justify-content: space-between; margin-top: 20px;">
                                    <div>
                                        <div>Certified Correct:</div>
                                        <div class="signature-line"></div>
                                        <div class="signature-name">JEREMY S. NEDAMO</div>
                                        <div>GSO-Designate</div>
                                    </div>
                                    <div>
                                        <div>Disposal Approved:</div>
                                        <div class="signature-line"></div>
                                        <div class="signature-name">WILFREDO ROSEOS</div>
                                        <div>MACCO Representative</div>
                                    </div>
                                </div>
                            </td>
                        </tr>
                    </table>
                </body>
            </html>
        `;

        // Create a temporary iframe
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        
        // Write the content to the iframe
        const iframeDoc = iframe.contentWindow.document;
        iframeDoc.open();
        iframeDoc.write(printContent);
        iframeDoc.close();
        
        // Print the iframe content
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        
        // Remove the iframe after printing
        setTimeout(() => {
            document.body.removeChild(iframe);
        }, 1000);
    };

    // Handle print individual item
    const handlePrint = (item) => {
        const printContent = `
            <html>
                <head>
                    <title>Waste Materials Report</title>
                    <style>
                        body { 
                            font-family: Arial, sans-serif; 
                            padding: 20px;
                            color: #333;
                        }
                        .report { 
                            width: 100%;
                            border-collapse: collapse;
                            margin-bottom: 20px;
                        }
                        .report td, .report th {
                            padding: 8px;
                            border: 1px solid #000;
                            vertical-align: top;
                        }
                        .header {
                            text-align: center;
                            font-weight: bold;
                            font-size: 16px;
                        }
                        .sub-header {
                            font-weight: bold;
                        }
                        .signature-line {
                            border-top: 1px solid #000;
                            width: 200px;
                            display: inline-block;
                            margin-top: 40px;
                        }
                        .signature-container {
                            margin-top: 20px;
                        }
                        .signature-name {
                            margin-top: 5px;
                            font-weight: bold;
                        }
                        .no-print {
                            display: none;
                        }
                        .info-container {
                            display: flex;
                            justify-content: space-between;
                        }
                        .info-left {
                            width: 60%;
                        }
                        .info-right {
                            width: 35%;
                            text-align: right;
                        }
                        .info-row {
                            display: flex;
                            margin-bottom: 5px;
                        }
                        .info-label {
                            width: 100px;
                            font-weight: bold;
                        }
                        .info-value {
                            flex-grow: 1;
                        }
                        @media print {
                            body {
                                padding: 0;
                            }
                            .no-print {
                                display: none;
                            }
                        }
                    </style>
                </head>
                <body>
                    <table class="report">
                        <!-- Header Section -->
                        <tr>
                            <td colspan="7" class="header">WASTE MATERIALS REPORT</td>
                        </tr>
                        <tr>
                            <td colspan="7">
                                <div class="info-container">
                                    <div class="info-left">
                                        <div class="info-row">
                                            <div class="info-label">OFFICE</div>
                                            <div class="info-value">MAYOR OFFICE</div>
                                        </div>
                                        <div class="info-row">
                                            <div class="info-label">LGU</div>
                                            <div class="info-value">Municipality of Magallanes</div>
                                        </div>
                                        <div class="info-row">
                                            <div class="info-label">Place of</div>
                                            <div class="info-value">General Service Office SHOP</div>
                                        </div>
                                        <div class="info-row">
                                            <div class="info-label">Storage :</div>
                                            <div class="info-value"></div>
                                        </div>
                                    </div>
                                    <div class="info-right">
                                        <div class="info-row">
                                            <div class="info-label">Fund :</div>
                                            <div class="info-value">General Fund</div>
                                        </div>
                                        <div class="info-row">
                                            <div class="info-label">Date :</div>
                                            <div class="info-value">${new Date().toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                </div>
                            </td>
                        </tr>
                        
                        <!-- ITEMS FOR DISPOSAL SECTION -->
                        <tr>
                            <td colspan="7" class="header">ITEMS FOR DISPOSAL</td>
                        </tr>
                        <tr class="sub-header">
                            <td>ITEMS</td>
                            <td>QUANTITY</td>
                            <td>Unit of Measures</td>
                            <td>DESCRIPTION</td>
                            <td colspan="3">RECORD OF SALES<br><span style="font-weight:normal">Official Receipt</span></td>
                        </tr>
                        <tr class="sub-header">
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td>NO.</td>
                            <td>Date</td>
                            <td>Amount</td>
                        </tr>
                        <tr>
                            <td>${item.item_name || '-'}</td>
                            <td>${item.quantity_returned || '-'}</td>
                            <td>${item.unit_of_measures || '-'}</td>
                            <td>${item.description || '-'}</td>
                            <td>${item.property_no || '-'}</td>
                            <td>${item.purchased_date || '-'}</td>
                            <td>${item.amount || '-'}</td>
                        </tr>
                        
                        <!-- SIGNATURE SECTION 1 -->
                        <tr>
                            <td colspan="7">
                                <div style="display: flex; justify-content: space-between; margin-top: 20px;">
                                    <div>
                                        <div>Certified Correct:</div>
                                        <div class="signature-line"></div>
                                        <div class="signature-name">EMMANUEL A. LAVADOR</div>
                                        <div>GSO-Designate</div>
                                    </div>
                                    <div>
                                        <div>Disposal Approved:</div>
                                        <div class="signature-line"></div>
                                        <div class="signature-name">CESAR C. CUMBA, JR</div>
                                        <div>Municipal Mayor</div>
                                    </div>
                                </div>
                            </td>
                        </tr>
                        
                        <!-- CERTIFICATE OF INSPECTION SECTION -->
                        <tr>
                            <td colspan="7" class="header">CERTIFICATE OF INSPECTION</td>
                        </tr>
                        
                        <tr>
                            <td colspan="7">
                                <div style="margin-bottom: 20px; margin-left: 20px;">
                                    I HEREBY certify that the property/supplies enumerated above was disposed of as follows:
                                </div>
                                <div style="margin-left: 20px;">
                                    <div>Item ________________________________________________ Destroyed/Broken</div>
                                    <div>Item ________________________________________________ Sold at Private Sale</div>
                                    <div>Item ________________________________________________ Sold at Public Auction</div>
                                    <div>Item ________________________________________________ Transferred without cost to</div>
                                </div>
                            </td>
                        </tr>
                        
                        <!-- SIGNATURE SECTION 2 -->
                        <tr>
                            <td colspan="7">
                                <div style="display: flex; justify-content: space-between; margin-top: 20px;">
                                    <div>
                                        <div>Certified Correct:</div>
                                        <div class="signature-line"></div>
                                        <div class="signature-name">JEREMY S. NEDAMO</div>
                                        <div>GSO-Designate</div>
                                    </div>
                                    <div>
                                        <div>Disposal Approved:</div>
                                        <div class="signature-line"></div>
                                        <div class="signature-name">WILFREDO ROSEOS</div>
                                        <div>MACCO Representative</div>
                                    </div>
                                </div>
                            </td>
                        </tr>
                    </table>
                </body>
            </html>
        `;

        // Create a temporary iframe
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        
        // Write the content to the iframe
        const iframeDoc = iframe.contentWindow.document;
        iframeDoc.open();
        iframeDoc.write(printContent);
        iframeDoc.close();
        
        // Print the iframe content
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        
        // Remove the iframe after printing
        setTimeout(() => {
            document.body.removeChild(iframe);
        }, 1000);
    };

    return (
        <AuthenticatedLayout>
            <Head title="Unservices Item" />
            
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-gray-800 shadow-sm sm:rounded-lg overflow-hidden">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
                                        Unservices Item
                                    </h2>
                                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                        View and generate reports for damaged and waste materials
                                    </p>
                                </div>
                                
                                <button
                                    onClick={handlePrintReport}
                                    className="inline-flex items-center px-4 py-2 bg-green-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-green-700"
                                >
                                    <Printer className="w-4 h-4 mr-2" />
                                    Print Report
                                </button>
                            </div>

                            {/* Filters */}
                            <div className="mb-6 flex gap-4">
                                {/* Search Bar */}
                                <div className="flex-1">
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Search className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            value={searchTerm}
                                            onChange={(e) => handleSearch(e.target.value)}
                                            placeholder="Search items..."
                                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white dark:bg-gray-700 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="flex-1">
                                    <select
                                        value={selectedYear}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            handleYearChange(value);
                                            
                                            // Clear any custom date range when selecting a year
                                            if (value && (dateRange.start || dateRange.end)) {
                                                // We'll set the date range in handleYearChange
                                                // This is just to inform the user that the year selection
                                                // takes precedence over manual date range selection
                                                console.log('Year selection overrides custom date range');
                                            }
                                        }}
                                        className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:border-indigo-500 focus:ring-indigo-500"
                                    >
                                        <option value="">All Years</option>
                                        {years.map((year) => (
                                            <option key={year} value={year}>
                                                {year}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div className="flex-1">
                                    <div className="flex gap-2">
                                        <input
                                            type="date"
                                            value={dateRange.start}
                                            onChange={(e) => {
                                                const newStartDate = e.target.value;
                                                const newDateRange = { ...dateRange, start: newStartDate };
                                                setDateRange(newDateRange);
                                                // Year filter is overridden by manual date selection
                                                if (newStartDate && selectedYear) {
                                                    setSelectedYear('');
                                                }
                                                applyFilters(searchTerm, '', newStartDate, dateRange.end);
                                            }}
                                            className="flex-1 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:border-indigo-500 focus:ring-indigo-500"
                                        />
                                        <span className="text-gray-500 dark:text-gray-400 self-center">to</span>
                                        <input
                                            type="date"
                                            value={dateRange.end}
                                            onChange={(e) => {
                                                const newEndDate = e.target.value;
                                                const newDateRange = { ...dateRange, end: newEndDate };
                                                setDateRange(newDateRange);
                                                // Year filter is overridden by manual date selection
                                                if (newEndDate && selectedYear) {
                                                    setSelectedYear('');
                                                }
                                                applyFilters(searchTerm, '', dateRange.start, newEndDate);
                                            }}
                                            className="flex-1 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:border-indigo-500 focus:ring-indigo-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Table */}
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-800">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Item</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Quantity</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Unit of Measures</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Property No.</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Purchased Date</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        {paginatedItems.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{item.item_name || '-'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{item.quantity_returned || '-'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{item.unit_of_measures || '-'}</td>
                                                <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">{item.description || '-'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{item.property_no || '-'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{item.purchased_date || '-'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{item.amount ? Number(item.amount).toFixed(2) : '-'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <button
                                                        onClick={() => handlePrint(item)}
                                                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                                    >
                                                        <Printer className="h-5 w-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination Controls */}
                            {filteredItems.length > 0 && (
                                <div className="mt-4 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 sm:px-6">
                                    <div className="flex justify-between flex-1 sm:hidden">
                                        <button 
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 dark:hover:bg-gray-600'}`}
                                        >
                                            Previous
                                        </button>
                                        <button
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                            className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 dark:hover:bg-gray-600'}`}
                                        >
                                            Next
                                        </button>
                                    </div>
                                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                        <div>
                                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                                Showing{' '}
                                                <span className="font-medium">{filteredItems.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</span>
                                                {' '}to{' '}
                                                <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredItems.length)}</span>
                                                {' '}of{' '}
                                                <span className="font-medium">{filteredItems.length}</span>
                                                {' '}results
                                            </p>
                                        </div>
                                        <div>
                                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                                <button
                                                    onClick={() => handlePageChange(currentPage - 1)}
                                                    disabled={currentPage === 1}
                                                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 dark:hover:bg-gray-600'}`}
                                                >
                                                    <span className="sr-only">Previous</span>
                                                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                </button>
                                                
                                                {/* Page Numbers */}
                                                {[...Array(totalPages)].map((_, idx) => {
                                                    const pageNumber = idx + 1;
                                                    return (
                                                        <button
                                                            key={pageNumber}
                                                            onClick={() => handlePageChange(pageNumber)}
                                                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                                pageNumber === currentPage 
                                                                    ? 'z-10 bg-blue-50 dark:bg-blue-900 border-blue-500 text-blue-600 dark:text-blue-300'
                                                                    : 'bg-white dark:bg-gray-700 border-gray-300 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600'
                                                            }`}
                                                        >
                                                            {pageNumber}
                                                        </button>
                                                    );
                                                })}
                                                
                                                <button
                                                    onClick={() => handlePageChange(currentPage + 1)}
                                                    disabled={currentPage === totalPages}
                                                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 dark:hover:bg-gray-600'}`}
                                                >
                                                    <span className="sr-only">Next</span>
                                                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                </button>
                                            </nav>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
} 