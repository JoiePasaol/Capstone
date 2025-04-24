import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { router, useForm, Link } from '@inertiajs/react';
import { Search, Edit2, Trash2, Calendar, FileText, BarChart, Info, AlertCircle, Plus, Wrench } from 'lucide-react';
import { 
    BarChart as RechartsBarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    Legend, 
    PieChart, 
    Pie, 
    Cell,
    LineChart,
    Line,
    ResponsiveContainer
} from 'recharts';

export default function ReturnHistory({ returns }) {
    // Get search parameters from the URL
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get('search') || '';
    const conditionParam = urlParams.get('condition') || '';
    const startDateParam = urlParams.get('start') || '';
    const endDateParam = urlParams.get('end') || '';
    
    // Initialize state with URL parameters if available
    const [searchTerm, setSearchTerm] = useState(searchParam);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [dateRange, setDateRange] = useState({ 
        start: startDateParam, 
        end: endDateParam 
    });
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [selectedReport, setSelectedReport] = useState('');
    const [selectedYear, setSelectedYear] = useState('');
    const [selectedCondition, setSelectedCondition] = useState(conditionParam);
    
    // State for managing filtered data and pagination
    const [allReturns, setAllReturns] = useState(returns.data);
    const [filteredReturns, setFilteredReturns] = useState(returns.data);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(Math.ceil(returns.total / 10));
    const [paginatedData, setPaginatedData] = useState(returns.data);
    const [itemsPerPage] = useState(10);
    
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [itemToEdit, setItemToEdit] = useState(null);
    const [isSolutionModalOpen, setIsSolutionModalOpen] = useState(false);
    const [solutionContent, setSolutionContent] = useState('');
    const [currentSolutionStep, setCurrentSolutionStep] = useState(0);
    const [solutionSteps, setSolutionSteps] = useState([]);
    const [solutionItem, setSolutionItem] = useState(null);
    const [showAllPossibleIssues, setShowAllPossibleIssues] = useState(false);
    const [issueSolved, setIssueSolved] = useState(false);

    const { data, setData, post, processing, reset, errors } = useForm({
        item_name: '',
        person_name: '',
        office_name: '',
        quantity_returned: 1,
        return_date: new Date().toISOString().split('T')[0],
        condition: 'good',
        damage: '',
        description: '',
        unit_of_measures: '',
        property_no: '',
        purchased_date: '',
        amount: ''
    });

    const { data: editData, setData: setEditData, put, processing: editProcessing, reset: resetEdit, errors: editErrors } = useForm({
        item_name: '',
        person_name: '',
        office_name: '',
        quantity_returned: 1,
        return_date: '',
        condition: 'good',
        damage: '',
        description: '',
        unit_of_measures: '',
        property_no: '',
        purchased_date: '',
        amount: ''
    });

    // Generate array of years from 2000 to 2025
    const years = Array.from({ length: 26 }, (_, i) => 2025 - i);

    // Helper function to get description for each report type
    const getReportDescription = (reportType) => {
        switch (reportType) {
            case 'most_returned':
                return `
                    <div class="report-description">
                        <p>This report provides an analysis of the most frequently returned equipment, sorted by total quantity returned. 
                        For each item, you'll see the breakdown of their condition status and common issues reported during inspection.</p>
                    </div>
                `;
            case 'damage_summary':
                return `
                    <div class="report-description">
                        <p>This report summarizes damages across different items, identifying patterns of equipment failure and 
                        highlighting the most common types of damage reported for each item category.</p>
                    </div>
                `;
            case 'condition_summary':
                return `
                    <div class="report-description">
                        <p>This report analyzes the condition of returned items, categorizing them by their assessed condition 
                        and showing which items fall into each condition category.</p>
                    </div>
                `;
            case 'monthly_trends':
                return `
                    <div class="report-description">
                        <p>This report shows monthly return patterns, helping identify seasonal trends or periods with 
                        higher return rates that may require additional attention.</p>
                    </div>
                `;
            case 'office_summary':
                return `
                    <div class="report-description">
                        <p>This report breaks down returns by office, helping identify which departments or locations 
                        have the highest return rates and may need additional support or equipment assessment.</p>
                    </div>
                `;
            case 'person_summary':
                return `
                    <div class="report-description">
                        <p>This report analyzes returns by individual, which can help identify potential training needs 
                        or patterns of equipment usage that may be contributing to higher return rates.</p>
                    </div>
                `;
            default:
                return '';
        }
    };

    // Helper function to get summary analysis for each report type
    const getReportSummary = (reportType, reportData) => {
        if (!reportData || reportData.length === 0) {
            return '<p>No data available for summary analysis.</p>';
        }

        switch (reportType) {
            case 'most_returned':
                // For most returned equipment, highlight top items and common issues
                const topItems = reportData.slice(0, 3).map(row => row[0]);
                const totalReturns = reportData.reduce((sum, row) => sum + parseInt(row[1]), 0);
                
                return `
                    <p><strong>Top returned items:</strong> ${topItems.join(', ')}</p>
                    <p><strong>Total quantity returned:</strong> ${totalReturns}</p>
                    <p><strong>Analysis:</strong> The top 3 items account for ${Math.round((reportData.slice(0, 3).reduce((sum, row) => sum + parseInt(row[1]), 0) / totalReturns) * 100)}% of all returns.</p>
                `;
                
            case 'damage_summary':
                return `
                    <p><strong>Total damaged items:</strong> ${reportData.reduce((sum, row) => sum + parseInt(row[1]), 0)}</p>
                    <p><strong>Most common damage type:</strong> ${getMostCommonElement(reportData.map(row => row[2]))}</p>
                `;
                
            case 'condition_summary':
                return `
                    <p><strong>Condition breakdown:</strong> ${reportData.map(row => `${row[0]}: ${row[1]} items`).join(', ')}</p>
                `;
                
            case 'monthly_trends':
                // Find the month with highest returns
                const highestMonth = reportData.reduce((highest, current) => 
                    parseInt(current[1]) > parseInt(highest[1]) ? current : highest, ['', 0]);
                
                return `
                    <p><strong>Month with highest returns:</strong> ${highestMonth[0]} (${highestMonth[1]} returns)</p>
                `;
                
            case 'office_summary':
                // Find the office with highest returns
                const highestOffice = reportData.reduce((highest, current) => 
                    parseInt(current[1]) > parseInt(highest[1]) ? current : highest, ['', 0]);
                
                return `
                    <p><strong>Office with highest returns:</strong> ${highestOffice[0]} (${highestOffice[1]} returns)</p>
                    <p><strong>Total offices:</strong> ${reportData.length}</p>
                `;
                
            case 'person_summary':
                // Find the person with highest returns
                const highestPerson = reportData.reduce((highest, current) => 
                    parseInt(current[1]) > parseInt(highest[1]) ? current : highest, ['', 0]);
                
                return `
                    <p><strong>Person with highest returns:</strong> ${highestPerson[0]} (${highestPerson[1]} returns)</p>
                    <p><strong>Total individuals:</strong> ${reportData.length}</p>
                `;
                
            default:
                return '';
        }
    };

    // Helper function to find most common element in a list
    const getMostCommonElement = (array) => {
        if (!array || array.length === 0) return 'None';
        
        // Get all words from possibly comma-separated values
        const allWords = array.flatMap(item => 
            typeof item === 'string' ? item.split(/,\s*/) : [item]
        );
        
        // Count occurrences
        const counts = allWords.reduce((acc, word) => {
            acc[word] = (acc[word] || 0) + 1;
            return acc;
        }, {});
        
        // Find the most common
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])[0][0];
    };

    // Apply all filters
    const applyFilters = (searchValue = searchTerm, condition = selectedCondition, dateStart = dateRange.start, dateEnd = dateRange.end) => {
        let filtered = allReturns;

        // Apply condition filter
        if (condition) {
            filtered = filtered.filter(item => 
                item.condition && item.condition.toLowerCase() === condition.toLowerCase()
            );
        }

        // Apply search filter
        if (searchValue) {
            const searchLower = searchValue.toLowerCase();
            filtered = filtered.filter(item => 
                (item.item_name && item.item_name.toLowerCase().includes(searchLower)) ||
                (item.description && item.description.toLowerCase().includes(searchLower)) ||
                (item.person_name && item.person_name.toLowerCase().includes(searchLower)) ||
                (item.office_name && item.office_name.toLowerCase().includes(searchLower)) ||
                (item.property_no && item.property_no && item.property_no.toLowerCase().includes(searchLower))
            );
        }

        // Apply date range filter
        if (dateStart && dateEnd) {
            filtered = filtered.filter(item => {
                const itemDate = new Date(item.return_date);
                const start = new Date(dateStart);
                const end = new Date(dateEnd);
                return itemDate >= start && itemDate <= end;
            });
        }

        // Update filtered results and reset to first page
        setFilteredReturns(filtered);
        setCurrentPage(1);
        setTotalPages(Math.ceil(filtered.length / itemsPerPage));
        updatePaginatedData(filtered, 1);
    };

    // Update paginated data based on current page
    const updatePaginatedData = (data, page) => {
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        setPaginatedData(data.slice(startIndex, endIndex));
    };

    // Handle page change
    const handlePageChange = (page) => {
        setCurrentPage(page);
        updatePaginatedData(filteredReturns, page);
    };

    // Handle search
    const handleSearch = (value) => {
        setSearchTerm(value);
        applyFilters(value, selectedCondition, dateRange.start, dateRange.end);
    };

    // Handle condition filter change
    const handleConditionChange = (value) => {
        setSelectedCondition(value);
        applyFilters(searchTerm, value, dateRange.start, dateRange.end);
    };

    // Handle date range change
    const handleDateRangeChange = (type, value) => {
        const newDateRange = { ...dateRange, [type]: value };
        setDateRange(newDateRange);
        applyFilters(searchTerm, selectedCondition, newDateRange.start, newDateRange.end);
    };

    // Handle year change
    const handleYearChange = (value) => {
        setSelectedYear(value);
        
        if (value) {
            const startDate = `${value}-01-01`;
            const endDate = `${value}-12-31`;
            setDateRange({ start: startDate, end: endDate });
            applyFilters(searchTerm, selectedCondition, startDate, endDate);
        } else {
            setDateRange({ start: '', end: '' });
            applyFilters(searchTerm, selectedCondition, '', '');
        }
    };

    // Initialize filtered and paginated data
    useEffect(() => {
        setAllReturns(returns.data);
        setFilteredReturns(returns.data);
        updatePaginatedData(returns.data, currentPage);

        // Fetch all data for client-side filtering if not already loaded
        if (returns.data.length < returns.total) {
            router.get(route('return-history'), 
                { get_all: 'true' },
                { 
                    preserveState: true,
                    only: ['returns'],
                    onSuccess: (page) => {
                        if (page.props.returns && page.props.returns.data) {
                            const allData = page.props.returns.data;
                            setAllReturns(allData);
                            
                            // Re-apply any existing filters
                            let filtered = allData;
                            
                            if (selectedCondition) {
                                filtered = filtered.filter(item => 
                                    item.condition && item.condition.toLowerCase() === selectedCondition.toLowerCase()
                                );
                            }
                            
                            if (searchTerm) {
                                const searchLower = searchTerm.toLowerCase();
                                filtered = filtered.filter(item => 
                                    (item.item_name && item.item_name.toLowerCase().includes(searchLower)) ||
                                    (item.description && item.description.toLowerCase().includes(searchLower)) ||
                                    (item.person_name && item.person_name.toLowerCase().includes(searchLower)) ||
                                    (item.office_name && item.office_name.toLowerCase().includes(searchLower)) ||
                                    (item.property_no && item.property_no && item.property_no.toLowerCase().includes(searchLower))
                                );
                            }
                            
                            if (dateRange.start && dateRange.end) {
                                filtered = filtered.filter(item => {
                                    const itemDate = new Date(item.return_date);
                                    const start = new Date(dateRange.start);
                                    const end = new Date(dateRange.end);
                                    return itemDate >= start && itemDate <= end;
                                });
                            }
                            
                            setFilteredReturns(filtered);
                            setTotalPages(Math.ceil(filtered.length / itemsPerPage));
                            updatePaginatedData(filtered, currentPage);
                        }
                    }
                }
            );
        }
    }, [returns.data]);

    // Generate reports
    const generateReport = () => {
        let reportData = {};
        let reportTitle = '';
        let reportHeaders = [];
        let reportRows = [];
        let chartData = [];
        
        // Add filter information to report title
        let filterInfo = [];
        if (selectedCondition) {
            filterInfo.push(`Condition: ${selectedCondition}`);
        }
        if (dateRange.start && dateRange.end) {
            filterInfo.push(`Date Range: ${dateRange.start} to ${dateRange.end}`);
        }
        if (selectedYear) {
            filterInfo.push(`Year: ${selectedYear}`);
        }
        if (searchTerm) {
            filterInfo.push(`Search: ${searchTerm}`);
        }
        
        switch (selectedReport) {
            case 'most_returned':
                reportTitle = 'Most Returned Equipment Report';
                reportData = filteredReturns.reduce((acc, item) => {
                    const key = item.item_name || (item.item && item.item.items);
                    if (!key) return acc; // Skip items with no name
                    
                    if (!acc[key]) {
                        acc[key] = {
                            totalQuantity: 0,
                            returns: []
                        };
                    }
                    acc[key].totalQuantity += parseInt(item.quantity_returned) || 1;
                    acc[key].returns.push(item);
                    return acc;
                }, {});
                
                reportHeaders = ['Item', 'Total Returns', 'Condition Status', 'Common Issues'];
                
                // Sort items by total quantity in descending order
                reportRows = Object.entries(reportData)
                    .sort((a, b) => b[1].totalQuantity - a[1].totalQuantity)
                    .map(([item, data]) => {
                        // Calculate condition breakdown
                        const conditions = data.returns.reduce((acc, ret) => {
                            const condition = ret.condition || 'unknown';
                            acc[condition] = (acc[condition] || 0) + 1;
                            return acc;
                        }, {});
                        
                        // Get condition percentages
                        const totalItems = data.returns.length;
                        const conditionStatus = Object.entries(conditions)
                            .map(([condition, count]) => {
                                const percentage = Math.round((count / totalItems) * 100);
                                return `${condition} (${percentage}%)`;
                            })
                            .join(', ');
                        
                        // Calculate most common damages
                        const damages = data.returns.reduce((acc, ret) => {
                            if (ret.damage && ret.damage.trim()) {
                                acc[ret.damage] = (acc[ret.damage] || 0) + 1;
                            }
                            return acc;
                        }, {});
                        
                        // Get top 3 damages
                        const commonIssues = Object.entries(damages)
                            .sort((a, b) => b[1] - a[1])
                            .slice(0, 3)
                            .map(([damage, count]) => `${damage} (${count})`)
                            .join(', ') || 'None reported';
                        
                        return [item, data.totalQuantity, conditionStatus, commonIssues];
                    });
                
                // Prepare chart data for most returned equipment
                chartData = reportRows.slice(0, 10).map(row => ({
                    name: row[0],
                    value: row[1]
                }));
                break;
                
            case 'damage_summary':
                reportTitle = 'Damage Summary Report';
                reportData = filteredReturns.filter(item => item.condition !== 'good')
                    .reduce((acc, item) => {
                        const key = item.item_name || (item.item && item.item.items);
                        if (!acc[key]) {
                            acc[key] = {
                                count: 0,
                                damages: new Map(),
                                solutions: new Map()
                            };
                        }
                        acc[key].count++;
                        if (item.damage) {
                            const damageCount = acc[key].damages.get(item.damage) || 0;
                            acc[key].damages.set(item.damage, damageCount + 1);
                        }
                        return acc;
                    }, {});
                
                reportHeaders = ['Item', 'Total Damages', 'Damage Types'];
                reportRows = Object.entries(reportData).map(([item, data]) => {
                    const damageTypes = Array.from(data.damages.entries())
                        .map(([damage, count]) => `${damage} (${count})`)
                        .join(', ');
                    
                    return [item, data.count, damageTypes];
                });
                
                // Prepare chart data for damage summary
                chartData = reportRows.slice(0, 8).map(row => ({
                    name: row[0],
                    value: row[1]
                }));
                break;
                
            case 'condition_summary':
                reportTitle = 'Condition Summary Report';
                reportData = filteredReturns.reduce((acc, item) => {
                    const condition = item.condition;
                    if (!acc[condition]) {
                        acc[condition] = {
                            count: 0,
                            items: new Map()
                        };
                    }
                    acc[condition].count++;
                    
                    const itemName = item.item_name || (item.item && item.item.items);
                    const itemCount = acc[condition].items.get(itemName) || 0;
                    acc[condition].items.set(itemName, itemCount + 1);
                    
                    return acc;
                }, {});
                
                reportHeaders = ['Condition', 'Total Items', 'Items Affected'];
                reportRows = Object.entries(reportData).map(([condition, data]) => {
                    const itemsList = Array.from(data.items.entries())
                        .map(([item, count]) => `${item} (${count})`)
                        .join(', ');
                    
                    return [condition, data.count, itemsList];
                });
                
                // Prepare chart data for condition summary
                chartData = reportRows.map(row => ({
                    name: row[0],
                    value: row[1]
                }));
                break;

            case 'monthly_trends':
                reportTitle = 'Monthly Return Trends Report';
                reportHeaders = ['Month', 'Total Returns'];
                reportRows = calculateMonthlyTrends(filteredReturns);
                
                // Prepare chart data for monthly trends
                chartData = reportRows.map(row => ({
                    name: row[0],
                    value: row[1]
                }));
                break;

            case 'office_summary':
                reportTitle = 'Office-wise Return Summary Report';
                reportHeaders = ['Office', 'Total Returns'];
                reportRows = summarizeByOffice(filteredReturns);
                
                // Prepare chart data for office summary
                chartData = reportRows.map(row => ({
                    name: row[0],
                    value: row[1]
                }));
                break;

            case 'person_summary':
                reportTitle = 'Person-wise Return Summary Report';
                reportHeaders = ['Person', 'Total Returns'];
                reportRows = summarizeByPerson(filteredReturns);
                
                // Prepare chart data for person summary
                chartData = reportRows.map(row => ({
                    name: row[0],
                    value: row[1]
                }));
                break;
        }

        // Generate chart visualization based on report type
        const chartVisualization = generateChartVisualization(selectedReport, chartData);

        // Add filter information to the report content
        const filterInfoText = filterInfo.length > 0 
            ? `<div class="filter-info"><strong>Filters Applied:</strong> ${filterInfo.join(' | ')}</div>`
            : '';

        // Prepare the report content
        const reportContent = `
            <html>
                <head>
                    <title>${reportTitle}</title>
                    <style>
                        body { 
                            font-family: Arial, sans-serif; 
                            padding: 20px;
                            color: #333;
                            line-height: 1.4;
                        }
                        .report-header {
                            text-align: center;
                            margin-bottom: 30px;
                            padding-bottom: 20px;
                            border-bottom: 2px solid #eee;
                        }
                        .report-title {
                            font-size: 24px;
                            font-weight: bold;
                            margin-bottom: 10px;
                            color: #2c3e50;
                        }
                        .filter-info {
                            margin: 10px 0;
                            padding: 10px;
                            background-color: #f8f9fa;
                            border-radius: 4px;
                            font-size: 14px;
                            color: #666;
                        }
                        .report-info {
                            margin-bottom: 20px;
                            font-size: 14px;
                            color: #666;
                        }
                        .chart-container {
                            width: 100%;
                            height: 400px;
                            margin: 20px 0;
                            border: 1px solid #eee;
                            padding: 10px;
                            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                        }
                        table {
                            width: 100%;
                            border-collapse: collapse;
                            margin: 20px 0;
                            font-size: 14px;
                        }
                        th, td {
                            padding: 12px 15px;
                            text-align: left;
                            border-bottom: 1px solid #ddd;
                        }
                        th {
                            background-color: #f8f9fa;
                            font-weight: bold;
                            color: #2c3e50;
                        }
                        tr:hover {
                            background-color: #f5f5f5;
                        }
                        .report-description {
                            margin-bottom: 20px;
                            line-height: 1.6;
                            color: #555;
                        }
                        .report-summary {
                            margin: 20px 0;
                            padding: 15px;
                            background-color: #f8f9fa;
                            border-left: 4px solid #3498db;
                            border-radius: 4px;
                        }
                        .report-footer {
                            margin-top: 30px;
                            padding-top: 20px;
                            border-top: 1px solid #eee;
                            font-size: 12px;
                            color: #777;
                            text-align: center;
                        }
                        @media print {
                            body {
                                padding: 0;
                                margin: 0;
                            }
                            @page {
                                size: A4;
                                margin: 1cm;
                            }
                            .chart-container {
                                break-inside: avoid;
                                page-break-inside: avoid;
                            }
                            table { 
                                break-inside: auto;
                                page-break-inside: auto;
                            }
                            tr { 
                                break-inside: avoid;
                                page-break-inside: avoid;
                            }
                            thead { 
                                display: table-header-group; 
                            }
                            tfoot {
                                display: table-footer-group;
                            }
                        }
                    </style>
                    <script src="https://cdn.jsdelivr.net/npm/recharts@2.15.1/dist/recharts.min.js"></script>
                </head>
                <body>
                    <div class="report-header">
                        <div class="report-title">${reportTitle}</div>
                        <div class="report-info">Generated on: ${new Date().toLocaleString()}</div>
                        ${filterInfoText}
                    </div>
                    
                    <div class="report-description">
                    ${getReportDescription(selectedReport)}
                    </div>
                    
                    <div class="report-summary">
                        ${getReportSummary(selectedReport, reportRows)}
                    </div>
                    
                    <div class="chart-container" id="chart-container">
                        ${chartVisualization}
                    </div>
                    
                    <table>
                        <thead>
                            <tr>
                                ${reportHeaders.map(header => `<th>${header}</th>`).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${reportRows.map(row => `
                                <tr>
                                    ${row.map(cell => `<td>${cell}</td>`).join('')}
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    
                    <div class="report-footer">
                        © ${new Date().getFullYear()} LGU Equipment Monitoring System
                    </div>

                    <script>
                        // Automatically adjust SVG for printing
                        document.addEventListener('DOMContentLoaded', function() {
                            var svgs = document.querySelectorAll('svg');
                            for (var i = 0; i < svgs.length; i++) {
                                var svg = svgs[i];
                                if (!svg.getAttribute('viewBox')) {
                                    var width = svg.getAttribute('width');
                                    var height = svg.getAttribute('height');
                                    if (width && height) {
                                        width = width.toString().replace('%', '');
                                        height = height.toString().replace('%', '');
                                        svg.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
                                        svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
                                    }
                                }
                            }
                            // Automatically print after a short delay to ensure everything is loaded
                            setTimeout(function() {
                                window.print();
                            }, 500);
                        });
                    </script>
                </body>
            </html>
        `;

        // Create a hidden iframe to handle printing
        const printIframe = document.createElement('iframe');
        printIframe.style.position = 'fixed';
        printIframe.style.right = '0';
        printIframe.style.bottom = '0';
        printIframe.style.width = '0';
        printIframe.style.height = '0';
        printIframe.style.border = '0';
        
        // Add the iframe to the document
        document.body.appendChild(printIframe);
        
        // Write content to the iframe
        const iframeDoc = printIframe.contentWindow.document;
        iframeDoc.open();
        iframeDoc.write(reportContent);
        iframeDoc.close();
        
        // Clean up after printing
        const removePrintFrame = () => {
            printIframe.parentNode.removeChild(printIframe);
        };
        
        // Listen for the iframe's load event
        printIframe.onload = function() {
            // The frame has loaded, give it a moment to render
        setTimeout(() => {
                // Set focus to trigger the print dialog
                printIframe.contentWindow.focus();
                try {
                    // This will trigger the print dialog
                    // The print() command is triggered automatically via the script in the iframe
                    
                    // Add a callback for when printing is done or canceled
                    printIframe.contentWindow.addEventListener('afterprint', removePrintFrame);
                    
                    // Fallback in case afterprint doesn't fire
                    setTimeout(removePrintFrame, 5000);
                } catch (e) {
                    console.error('Print error:', e);
                    removePrintFrame();
                }
            }, 500);
        };
    };

    // Function to generate chart visualization HTML based on report type
    const generateChartVisualization = (reportType, data) => {
        if (!data || data.length === 0) {
            return '<div>No data available for visualization</div>';
        }

        // Simple color array for better compatibility
        const COLORS = ['#4285F4', '#EA4335', '#FBBC05', '#34A853', '#8A2BE2', '#00BFFF', '#FF6347', '#32CD32'];
        
        // Format the data for inline SVG rendering
        switch (reportType) {
            case 'most_returned':
            case 'damage_summary': {
                // Simple horizontal bar chart for better browser compatibility
                const maxValue = Math.max(...data.map(item => parseInt(item.value)));
                const barHeight = 30;
                const hBarChartHeight = Math.min(500, data.length * (barHeight + 15) + 100);
                const barWidth = 450;
                const chartTitle = reportType === 'most_returned' ? 'Most Frequently Returned Items' : 'Items with Most Reported Damages';
                
                // Limit to at most 8 items to ensure it fits on the page
                const barDisplayData = data.slice(0, 8);
                
                // Build bars manually for better browser compatibility
                let barElements = '';
                barDisplayData.forEach((item, index) => {
                    const width = Math.max(1, (parseInt(item.value) / maxValue) * barWidth);
                    const y = index * (barHeight + 15) + 60;
                    const color = COLORS[index % COLORS.length];
                    
                    // Truncate long names
                    let displayName = item.name;
                    if (displayName.length > 18) {
                        displayName = displayName.substring(0, 15) + '...';
                    }
                    
                    barElements += `
                        <!-- Bar group ${index} -->
                        <rect x="150" y="${y}" width="${barWidth}" height="${barHeight}" fill="#f0f0f0" rx="3" ry="3"></rect>
                        <rect x="150" y="${y}" width="${width}" height="${barHeight}" fill="${color}" rx="3" ry="3"></rect>
                        <text x="145" y="${y + barHeight/2 + 5}" text-anchor="end" font-size="12" fill="#333333">${displayName}</text>
                        <text x="${width + 160}" y="${y + barHeight/2 + 5}" font-size="12" fill="#333333" font-weight="bold">${item.value}</text>
                    `;
                });
                
                return `
                    <svg width="650" height="${hBarChartHeight}" xmlns="http://www.w3.org/2000/svg" style="font-family: Arial, sans-serif;">
                        <!-- Chart Title -->
                        <text x="325" y="30" text-anchor="middle" font-weight="bold" font-size="16" fill="#333333">${chartTitle}</text>
                        
                        <!-- Chart grid lines -->
                        <line x1="150" y1="${hBarChartHeight - 20}" x2="${barWidth + 150}" y2="${hBarChartHeight - 20}" stroke="#cccccc" stroke-width="1"></line>
                        <line x1="150" y1="50" x2="150" y2="${hBarChartHeight - 20}" stroke="#cccccc" stroke-width="1"></line>
                        
                        <!-- Value axis ticks -->
                        ${(() => {
                            let ticks = '';
                            for (let i = 0; i <= 5; i++) {
                                const x = 150 + (barWidth * i / 5);
                                const value = Math.round(maxValue * i / 5);
                                ticks += `
                                    <line x1="${x}" y1="${hBarChartHeight - 20}" x2="${x}" y2="${hBarChartHeight - 15}" stroke="#333333" stroke-width="1"></line>
                                    <text x="${x}" y="${hBarChartHeight - 5}" text-anchor="middle" font-size="10" fill="#666666">${value}</text>
                                `;
                            }
                            return ticks;
                        })()}
                        
                        <!-- Bars and labels -->
                        ${barElements}
                    </svg>
                `;
            }
            
            case 'condition_summary': {
                // Simple pie chart for condition summary - using basic SVG for compatibility
                const total = data.reduce((sum, item) => sum + parseInt(item.value), 0);
                const radius = 100; // Smaller radius for better print fit
                const centerX = 180;
                const centerY = 150;
                const pieHeight = 350; // Fixed height for pie chart
                
                let startAngle = 0;
                let slices = '';
                let legends = '';
                
                // Create simple pie slices
                data.forEach((item, index) => {
                    const value = parseInt(item.value);
                    const percentage = value / total;
                    const endAngle = startAngle + percentage * 2 * Math.PI;
                    const color = COLORS[index % COLORS.length];
                    
                    // Calculate path coordinates
                    const x1 = centerX + radius * Math.cos(startAngle);
                    const y1 = centerY + radius * Math.sin(startAngle);
                    const x2 = centerX + radius * Math.cos(endAngle);
                    const y2 = centerY + radius * Math.sin(endAngle);
                    
                    const largeArcFlag = percentage > 0.5 ? 1 : 0;
                    
                    // Create pie slice path - simpler version for better compatibility
                    const pathData = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
                    
                    slices += `<path d="${pathData}" fill="${color}" stroke="#ffffff" stroke-width="1"></path>`;
                    
                    // Add percentage label if slice is big enough
                    if (percentage > 0.05) {
                        const labelAngle = startAngle + (endAngle - startAngle) / 2;
                        const labelRadius = radius * 0.7;
                        const labelX = centerX + labelRadius * Math.cos(labelAngle);
                        const labelY = centerY + labelRadius * Math.sin(labelAngle);
                        slices += `<text x="${labelX}" y="${labelY}" text-anchor="middle" font-size="12" fill="#ffffff" font-weight="bold">${Math.round(percentage * 100)}%</text>`;
                    }
                    
                    // Create legend item - maintain compact layout
                    legends += `
                        <rect x="340" y="${60 + index * 25}" width="18" height="18" fill="${color}"></rect>
                        <text x="365" y="${74 + index * 25}" font-size="12" fill="#333333">${item.name} (${item.value})</text>
                    `;
                    
                    startAngle = endAngle;
                });
                
                return `
                    <svg width="600" height="${pieHeight}" xmlns="http://www.w3.org/2000/svg" style="font-family: Arial, sans-serif;">
                        <!-- Chart Title -->
                        <text x="300" y="30" text-anchor="middle" font-weight="bold" font-size="16" fill="#333333">Item Condition Distribution</text>
                        
                        <!-- Pie Chart -->
                        <g>
                            ${slices}
                        </g>
                        
                        <!-- Legend -->
                        <text x="340" y="45" font-weight="bold" font-size="14" fill="#333333">Condition Categories</text>
                        ${legends}
                        
                        <!-- Total counter -->
                        <text x="${centerX}" y="${centerY - 15}" text-anchor="middle" font-size="14" fill="#333333">Total Items</text>
                        <text x="${centerX}" y="${centerY + 15}" text-anchor="middle" font-size="18" font-weight="bold" fill="#333333">${total}</text>
                    </svg>
                `;
            }
            
            case 'monthly_trends': {
                // Simple line chart for monthly trends
                const months = data.map(item => item.name);
                const values = data.map(item => parseInt(item.value));
                const maxY = Math.max(...values) * 1.1;
                const lineWidth = 600; // Reduced width
                const lineHeight = 350; // Reduced height
                const marginLeft = 60;
                const marginRight = 30;
                const marginTop = 60;
                const marginBottom = 90;
                
                const graphWidth = lineWidth - marginLeft - marginRight;
                const graphHeight = lineHeight - marginTop - marginBottom;
                
                // Generate points for the line
                let pointsString = '';
                let pointsWithLabels = '';
                
                // Limit months to a reasonable number for display
                const displayLimit = Math.min(12, data.length);
                const lineDisplayData = data.slice(0, displayLimit);
                
                lineDisplayData.forEach((item, index) => {
                    const x = marginLeft + (index * graphWidth / (lineDisplayData.length - 1 || 1));
                    const y = lineHeight - marginBottom - (parseInt(item.value) / maxY * graphHeight);
                    
                    if (index === 0) {
                        pointsString += `${x},${y}`;
                    } else {
                        pointsString += ` ${x},${y}`;
                    }
                    
                    // Add points and labels
                    pointsWithLabels += `
                        <circle cx="${x}" cy="${y}" r="4" fill="#4285F4" stroke="#ffffff" stroke-width="1"></circle>
                        <text x="${x}" y="${y - 10}" text-anchor="middle" font-size="11" fill="#333333">${item.value}</text>
                    `;
                });
                
                // Generate X-axis labels - show fewer labels for better fit
                let xLabels = '';
                lineDisplayData.forEach((month, index) => {
                    // Only show every other label if there are many months
                    if (lineDisplayData.length <= 6 || index % 2 === 0) {
                        const x = marginLeft + (index * graphWidth / (lineDisplayData.length - 1 || 1));
                        xLabels += `
                            <text x="${x}" y="${lineHeight - marginBottom + 20}" text-anchor="middle" font-size="10" fill="#666666" transform="rotate(-45 ${x},${lineHeight - marginBottom + 20})">${month.name}</text>
                        `;
                    }
                });
                
                // Generate Y-axis labels and grid lines
                let yLabels = '';
                for (let i = 0; i <= 5; i++) {
                    const y = lineHeight - marginBottom - (i / 5) * graphHeight;
                    const value = Math.round(maxY * i / 5);
                    yLabels += `
                        <line x1="${marginLeft}" y1="${y}" x2="${lineWidth - marginRight}" y2="${y}" stroke="#eeeeee" stroke-width="1" stroke-dasharray="5,5"></line>
                        <text x="${marginLeft - 10}" y="${y + 5}" text-anchor="end" font-size="10" fill="#666666">${value}</text>
                    `;
                }
                
                return `
                    <svg width="${lineWidth}" height="${lineHeight}" xmlns="http://www.w3.org/2000/svg" style="font-family: Arial, sans-serif;">
                        <!-- Chart Title -->
                        <text x="${lineWidth/2}" y="30" text-anchor="middle" font-weight="bold" font-size="16" fill="#333333">Monthly Return Trends</text>
                        
                        <!-- Background -->
                        <rect x="${marginLeft}" y="${marginTop}" width="${graphWidth}" height="${graphHeight}" fill="#f9f9f9" rx="3" ry="3"></rect>
                        
                        <!-- Grid lines and labels -->
                        ${yLabels}
                        
                        <!-- X and Y axis -->
                        <line x1="${marginLeft}" y1="${lineHeight - marginBottom}" x2="${lineWidth - marginRight}" y2="${lineHeight - marginBottom}" stroke="#333333" stroke-width="1"></line>
                        <line x1="${marginLeft}" y1="${marginTop}" x2="${marginLeft}" y2="${lineHeight - marginBottom}" stroke="#333333" stroke-width="1"></line>
                        
                        <!-- X-axis labels -->
                        ${xLabels}
                        
                        <!-- Y-axis title -->
                        <text x="20" y="${lineHeight/2}" text-anchor="middle" font-size="11" fill="#666666" transform="rotate(-90 20,${lineHeight/2})">Number of Returns</text>
                        
                        <!-- Data line -->
                        <polyline points="${pointsString}" fill="none" stroke="#4285F4" stroke-width="2"></polyline>
                        
                        <!-- Data points and labels -->
                        ${pointsWithLabels}
                    </svg>
                `;
            }
            
            case 'office_summary':
            case 'person_summary': {
                // Simple horizontal bar chart for office/person summary
                const maxVal = Math.max(...data.map(item => parseInt(item.value)));
                const barH = 30;
                // Limit the number of offices/persons to display
                const officeDisplayData = data.slice(0, 8);
                const officeChartHeight = Math.min(500, officeDisplayData.length * (barH + 15) + 100);
                const barW = 450; // Reduced width
                const title = reportType === 'office_summary' ? 'Returns by Office Location' : 'Returns by Personnel';
                
                // Build bars manually
                let officeBarElements = '';
                officeDisplayData.forEach((item, index) => {
                    const width = Math.max(1, (parseInt(item.value) / maxVal) * barW);
                    const y = index * (barH + 15) + 60;
                    const color = reportType === 'office_summary' ? '#8A2BE2' : '#00BFFF';
                    
                    // Truncate long names
                    let displayName = item.name;
                    if (displayName.length > 18) {
                        displayName = displayName.substring(0, 15) + '...';
                    }
                    
                    officeBarElements += `
                        <!-- Bar group ${index} -->
                        <rect x="150" y="${y}" width="${barW}" height="${barH}" fill="#f0f0f0" rx="3" ry="3"></rect>
                        <rect x="150" y="${y}" width="${width}" height="${barH}" fill="${color}" rx="3" ry="3"></rect>
                        <text x="145" y="${y + barH/2 + 5}" text-anchor="end" font-size="12" fill="#333333">${displayName}</text>
                        <text x="${width + 160}" y="${y + barH/2 + 5}" font-size="12" fill="#ffffff" font-weight="bold">${item.value}</text>
                    `;
                });
                
                return `
                    <svg width="650" height="${officeChartHeight}" xmlns="http://www.w3.org/2000/svg" style="font-family: Arial, sans-serif;">
                        <!-- Chart Title -->
                        <text x="325" y="30" text-anchor="middle" font-weight="bold" font-size="16" fill="#333333">${title}</text>
                        
                        <!-- Chart grid lines -->
                        <line x1="150" y1="${officeChartHeight - 20}" x2="${barW + 150}" y2="${officeChartHeight - 20}" stroke="#cccccc" stroke-width="1"></line>
                        <line x1="150" y1="50" x2="150" y2="${officeChartHeight - 20}" stroke="#cccccc" stroke-width="1"></line>
                        
                        <!-- Value axis ticks -->
                        ${(() => {
                            let ticks = '';
                            for (let i = 0; i <= 5; i++) {
                                const x = 150 + (barW * i / 5);
                                const value = Math.round(maxVal * i / 5);
                                ticks += `
                                    <line x1="${x}" y1="${officeChartHeight - 20}" x2="${x}" y2="${officeChartHeight - 15}" stroke="#333333" stroke-width="1"></line>
                                    <text x="${x}" y="${officeChartHeight - 5}" text-anchor="middle" font-size="10" fill="#666666">${value}</text>
                                `;
                            }
                            return ticks;
                        })()}
                        
                        <!-- Bars and labels -->
                        ${officeBarElements}
                    </svg>
                `;
            }
            
            default:
                return '<div style="text-align: center; padding: 20px;">No visualization available for this report type</div>';
        }
    };

    // Example functions to calculate new report data
    const calculateMonthlyTrends = (data) => {
        const monthlyData = data.reduce((acc, item) => {
            const month = new Date(item.return_date).toLocaleString('default', { month: 'long', year: 'numeric' });
            acc[month] = (acc[month] || 0) + item.quantity_returned;
            return acc;
        }, {});

        return Object.entries(monthlyData).map(([month, totalReturns]) => [month, totalReturns]);
    };

    const summarizeByOffice = (data) => {
        const officeData = data.reduce((acc, item) => {
            const office = item.office_name;
            acc[office] = (acc[office] || 0) + item.quantity_returned;
            return acc;
        }, {});

        return Object.entries(officeData).map(([office, totalReturns]) => [office, totalReturns]);
    };

    const summarizeByPerson = (data) => {
        const personData = data.reduce((acc, item) => {
            const person = item.person_name;
            acc[person] = (acc[person] || 0) + item.quantity_returned;
            return acc;
        }, {});

        return Object.entries(personData).map(([person, totalReturns]) => [person, totalReturns]);
    };

    const handleDelete = (item) => {
        setItemToDelete(item);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        router.delete(route('returned-items.destroy', itemToDelete.id), {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                setItemToDelete(null);
            },
        });
    };

    const handleEdit = (item) => {
        setItemToEdit(item);
        setEditData({
            item_name: item.item_name || '',
            person_name: item.person_name || '',
            office_name: item.office_name || '',
            quantity_returned: item.quantity_returned || 1,
            return_date: item.return_date || '',
            condition: item.condition || 'good',
            damage: item.damage || '',
            description: item.description || '',
            unit_of_measures: item.unit_of_measures || '',
            property_no: item.property_no || '',
            purchased_date: item.purchased_date ? new Date(item.purchased_date).toISOString().split('T')[0] : '',
            amount: item.amount || ''
        });
        setIsEditModalOpen(true);
    };

    const handleUpdate = (e) => {
        e.preventDefault();
        put(route('returned-items.update', itemToEdit.id), {
            onSuccess: () => {
                setIsEditModalOpen(false);
                setItemToEdit(null);
                resetEdit();
            }
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('returned-items.store'), {
            onSuccess: () => {
                reset();
                setIsAddModalOpen(false);
            }
        });
    };

    // Helper function to get printer repair solutions with interactive steps
    const getPrinterSolution = (damage) => {
        // Convert damage to lowercase for case-insensitive matching
        const damageLower = damage.toLowerCase();
        
        let title = "Printer Troubleshooting";
        let steps = [];
        let possibleIssues = [];
        
        // Check for ink-related issues
        if (damageLower.includes('ink') || damageLower.includes('smudge') || damageLower.includes('smear')) {
            title = "Ink System Troubleshooting";
            steps = [
                {
                    title: "Clean Print Heads",
                    description: "Print head clogs or dirty nozzles can cause smudging or poor print quality.",
                    instructions: "1. Access printer maintenance menu\n2. Select 'Clean Print Heads' or similar option\n3. Follow on-screen instructions\n4. Run a test print to verify improvement",
                    expectedResult: "Print quality should improve with clean nozzles."
                },
                {
                    title: "Check Ink Levels",
                    description: "Low ink levels can cause streaking and poor quality.",
                    instructions: "1. Access printer settings or status screen\n2. Check ink level indicators\n3. Replace low cartridges if necessary",
                    expectedResult: "Ink levels should be sufficient for quality printing."
                },
                {
                    title: "Replace Ink Cartridge",
                    description: "If cleaning doesn't work, the cartridge may need replacement.",
                    instructions: "1. Power on the printer\n2. Open the ink cartridge access door\n3. Wait for carriage to move to access position\n4. Remove old cartridge\n5. Insert new cartridge\n6. Close access door\n7. Run alignment if prompted",
                    expectedResult: "New cartridge should resolve ink issues."
                }
            ];
            possibleIssues = [
                "Clogged print head nozzles",
                "Low or empty ink cartridge",
                "Incorrect paper type settings",
                "Misaligned print heads",
                "Old or expired ink cartridges"
            ];
        }
        
        // Check for paper jam issues
        else if (damageLower.includes('jam') || damageLower.includes('stuck') || damageLower.includes('feed')) {
            title = "Paper Jam Troubleshooting";
            steps = [
                {
                    title: "Clear Visible Paper Jams",
                    description: "Paper is physically stuck in the printer path.",
                    instructions: "1. Turn off the printer\n2. Open all access panels\n3. Gently pull jammed paper straight out (not at an angle)\n4. Check for and remove any torn pieces\n5. Close all panels\n6. Power on the printer",
                    expectedResult: "Paper path should be clear of obstructions."
                },
                {
                    title: "Check Paper Tray",
                    description: "Improper paper loading can cause jams.",
                    instructions: "1. Remove paper from tray\n2. Fan the stack to separate sheets\n3. Check for damaged or wrinkled paper\n4. Align paper edges before reinserting\n5. Don't overfill tray (observe max fill line)\n6. Adjust paper guides to fit paper size",
                    expectedResult: "Paper should be properly aligned in tray."
                },
                {
                    title: "Clear Internal Paper Path",
                    description: "Paper debris might be hidden in rollers or paths.",
                    instructions: "1. Turn off and unplug printer\n2. Open rear access panel if available\n3. Check for debris or obstructions in rollers\n4. Use tweezers to remove any debris\n5. Close panels and plug in printer\n6. Run a test print",
                    expectedResult: "Internal components should be clean and free of paper debris."
                }
            ];
            possibleIssues = [
                "Damaged or wrinkled paper",
                "Overfilled paper tray",
                "Misaligned paper guides",
                "Dirty or worn feed rollers",
                "Foreign objects in paper path"
            ];
        }
        
        // Check for connectivity issues
        else if (damageLower.includes('offline') || damageLower.includes('connect') || damageLower.includes('network')) {
            title = "Printer Connectivity Troubleshooting";
            steps = [
                {
                    title: "Check Physical Connections",
                    description: "Loose cables can cause connectivity issues.",
                    instructions: "1. Check power cable is securely connected to printer and outlet\n2. For USB printers: disconnect and reconnect USB cable at both ends\n3. For network printers: ensure ethernet cable is firmly connected\n4. Try different cables if available\n5. Restart printer after reconnecting",
                    expectedResult: "All connections should be secure with no loose cables."
                },
                {
                    title: "Restart Devices",
                    description: "Temporary software glitches can cause connectivity issues.",
                    instructions: "1. Turn off the printer\n2. Restart your computer\n3. If networked, restart your router/switch\n4. Turn the printer back on\n5. Wait for full initialization\n6. Try printing a test page",
                    expectedResult: "Devices should reconnect after restart."
                },
                {
                    title: "Check Network Settings",
                    description: "Incorrect network settings can prevent connectivity.",
                    instructions: "1. Print network configuration page from printer menu\n2. Verify IP address is assigned\n3. Check printer is on same network as computer\n4. For wireless: verify printer is connected to correct network\n5. Check for firewalls blocking printer communication",
                    expectedResult: "Printer should have valid network configuration."
                }
            ];
            possibleIssues = [
                "Loose or damaged cables",
                "Router/network issues",
                "Wrong WiFi password",
                "IP address conflicts",
                "Firewall blocking printer communication",
                "Outdated printer drivers"
            ];
        }
        
        // Check for print quality issues
        else if (damageLower.includes('streak') || damageLower.includes('line') || damageLower.includes('quality') || damageLower.includes('faded')) {
            title = "Print Quality Troubleshooting";
            steps = [
                {
                    title: "Run Print Quality Diagnostic",
                    description: "Built-in diagnostics can identify and fix quality issues.",
                    instructions: "1. Access printer maintenance menu\n2. Select 'Print Quality Diagnostic' or similar\n3. Review the test page for issues\n4. Follow printer's recommended steps based on results",
                    expectedResult: "Test pattern should identify specific quality problems."
                },
                {
                    title: "Align Print Heads",
                    description: "Misaligned print heads cause quality issues.",
                    instructions: "1. Access printer maintenance menu\n2. Select 'Align Print Heads' option\n3. Follow on-screen instructions\n4. Allow alignment process to complete\n5. Print test page to verify improvement",
                    expectedResult: "Properly aligned print heads should improve quality."
                },
                {
                    title: "Check Paper Settings",
                    description: "Incorrect media settings affect print quality.",
                    instructions: "1. Check paper loaded matches printer settings\n2. In print dialog, select correct paper type\n3. Ensure paper quality is appropriate for job\n4. Adjust print quality settings (draft, normal, best)\n5. Test with higher quality paper if available",
                    expectedResult: "Paper settings should match actual media being used."
                }
            ];
            possibleIssues = [
                "Clogged or dirty print heads",
                "Low ink or toner levels",
                "Misaligned print heads",
                "Incorrect paper settings",
                "Low quality paper",
                "Aging printer components"
            ];
        }
        
        // Check for mechanical issues
        else if (damageLower.includes('noise') || damageLower.includes('grind') || damageLower.includes('squeaking')) {
            title = "Mechanical Issue Troubleshooting";
            steps = [
                {
                    title: "Check for Foreign Objects",
                    description: "Objects in the printer can cause unusual noises.",
                    instructions: "1. Power off and unplug the printer\n2. Open all access panels and covers\n3. Look for paper clips, staples, torn paper pieces\n4. Remove any foreign objects carefully\n5. Check for obstructions in moving carriage\n6. Close all panels and test",
                    expectedResult: "Printer should be free of foreign objects."
                },
                {
                    title: "Inspect Moving Parts",
                    description: "Worn components can cause grinding or squeaking.",
                    instructions: "1. Power off and unplug the printer\n2. Open access panels to reveal mechanical components\n3. Gently move the print carriage (if allowed by manual)\n4. Listen for location of noise\n5. Check for worn gears or belts\n6. Consult manual for serviceable parts",
                    expectedResult: "Mechanical components should move smoothly."
                },
                {
                    title: "Apply Approved Lubricant",
                    description: "If specified in manual, lubrication may help.",
                    instructions: "1. Consult printer manual for lubrication points\n2. Use ONLY manufacturer-approved lubricant\n3. Apply minimal amount to specified points\n4. Move components to distribute lubricant\n5. Wipe excess lubricant\n6. Test printer operation",
                    expectedResult: "Lubricated components should move quietly."
                }
            ];
            possibleIssues = [
                "Foreign objects in printer mechanism",
                "Worn or damaged gears",
                "Loose belts or pulleys",
                "Damaged carriage assembly",
                "Aging mechanical components"
            ];
        }
        
        // Default solution if no specific issue is identified
        else {
            title = "General Printer Troubleshooting";
            steps = [
                {
                    title: "Power Cycle the Printer",
                    description: "Simple restart can resolve many issues.",
                    instructions: "1. Turn off the printer\n2. Unplug from power source\n3. Wait 60 seconds\n4. Plug back in\n5. Turn printer on\n6. Allow full initialization\n7. Test printer functionality",
                    expectedResult: "Printer should initialize correctly after restart."
                },
                {
                    title: "Check for Updates",
                    description: "Outdated firmware or drivers can cause issues.",
                    instructions: "1. Check manufacturer website for latest firmware\n2. Download and install printer firmware update if available\n3. Update printer drivers on computer\n4. Restart computer and printer\n5. Test printer functionality",
                    expectedResult: "Printer should be running latest software versions."
                },
                {
                    title: "Perform Factory Reset",
                    description: "Reset to default settings can resolve configuration issues.",
                    instructions: "1. Access printer settings menu\n2. Look for 'Factory Reset' or 'Restore Defaults' option\n3. Select and confirm reset\n4. Allow printer to restart\n5. Reconfigure necessary settings\n6. Test printer functionality",
                    expectedResult: "Printer should return to default working state."
                }
            ];
            possibleIssues = [
                "Software or firmware issues",
                "Incorrect configuration settings",
                "Memory corruption",
                "Temporary electronic glitch",
                "Hardware component failure"
            ];
        }
        
        return {
            title: title,
            steps: steps,
            possibleIssues: possibleIssues
        };
    };

    // Handler to view solution
    const handleViewSolution = (item) => {
        // Basic check if it might be a printer based on damage keywords
        const potentialPrinterDamages = ['power', 'ink', 'smudge', 'smear', 'paper jam', 'toner', 'print quality'];
        const isPotentialPrinter = potentialPrinterDamages.some(keyword => 
            item.damage && item.damage.toLowerCase().includes(keyword)
        );

        let solutionData;
        if (isPotentialPrinter) {
            solutionData = getPrinterSolution(item.damage);
        } else {
            solutionData = {
                title: `Troubleshooting: ${item.item_name}`,
                steps: [
                    {
                        title: "Refer to Manual",
                        description: `No specific step-by-step solution is available for "${item.damage}" on a "${item.item_name}" at this time.`,
                        instructions: "1. Check the device's user manual for troubleshooting information.\n2. Look for online resources specific to your device model.\n3. Contact the manufacturer's technical support for assistance.",
                        expectedResult: "The product manual should provide guidance specific to your device."
                    }
                ],
                possibleIssues: [
                    "Unknown issue requiring manufacturer support",
                    "Potential hardware failure requiring professional diagnosis",
                    "Issue may require parts replacement or servicing"
                ]
            };
        }

        setSolutionItem(item);
        setSolutionSteps(solutionData.steps);
        setSolutionContent(solutionData);
        setCurrentSolutionStep(0);
        setShowAllPossibleIssues(false);
        setIsSolutionModalOpen(true);
    };

    return (
        <AuthenticatedLayout>
            <Head title="Returned Items List" />
            
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-gray-800 shadow-sm sm:rounded-lg overflow-hidden">
                        {/* Header Section */}
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex flex-col space-y-4">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
                                            Returned Items List
                                        </h2>
                                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                            View and analyze inspected items
                                        </p>
                                    </div>
                                    
                                    <div className="flex space-x-4">
                                        {/* Add Inspect Item Button */}
                                        <button
                                            onClick={() => setIsAddModalOpen(true)}
                                            className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Add Return Item
                                        </button>
                                        
                                        {/* Report Generation Button */}
                                        <button
                                            onClick={() => {
                                                setSelectedReport('most_returned');
                                                setIsReportModalOpen(true);
                                            }}
                                            className="inline-flex items-center px-4 py-2 bg-green-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-green-700"
                                        >
                                            <FileText className="w-4 h-4 mr-2" />
                                            Generate Report
                                        </button>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-4 items-center">
                                    {/* Search Bar */}
                                    <div className="relative flex-1 min-w-[200px]">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Search className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white dark:bg-gray-700 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            placeholder="Search returns..."
                                            value={searchTerm}
                                            onChange={(e) => handleSearch(e.target.value)}
                                        />
                                    </div>

                                    {/* Year Filter Dropdown */}
                                    <div className="flex items-center space-x-2">
                                        <Calendar className="h-5 w-5 text-gray-400" />
                                        <select
                                            value={selectedYear}
                                            onChange={(e) => handleYearChange(e.target.value)}
                                            className="border border-gray-300 rounded-md text-sm dark:bg-gray-700 dark:border-gray-600 py-2 px-3"
                                        >
                                            <option value="">Select Year</option>
                                            {years.map((year) => (
                                                <option key={year} value={year}>
                                                    {year}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Condition Filter Dropdown */}
                                    <div className="flex items-center space-x-2">
                                        <AlertCircle className="h-5 w-5 text-gray-400" />
                                        <select
                                            value={selectedCondition}
                                            onChange={(e) => handleConditionChange(e.target.value)}
                                            className="border border-gray-300 rounded-md text-sm dark:bg-gray-700 dark:border-gray-600 py-2 px-3"
                                        >
                                            <option value="">All Conditions</option>
                                            <option value="good">Good</option>
                                            <option value="damaged">Damaged</option>
                                            <option value="repairable">Repairable</option>
                                        </select>
                                    </div>

                                    {/* Date Range Filters */}
                                    <div className="flex gap-2 items-center">
                                        <div className="flex items-center space-x-2">
                                            <Calendar className="h-5 w-5 text-gray-400" />
                                            <input
                                                type="date"
                                                value={dateRange.start}
                                                onChange={(e) => handleDateRangeChange('start', e.target.value)}
                                                className="border border-gray-300 rounded-md text-sm dark:bg-gray-700 dark:border-gray-600"
                                            />
                                            <span className="text-gray-500">to</span>
                                            <input
                                                type="date"
                                                value={dateRange.end}
                                                onChange={(e) => handleDateRangeChange('end', e.target.value)}
                                                className="border border-gray-300 rounded-md text-sm dark:bg-gray-700 dark:border-gray-600"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Return History Table */}
                        <div className="p-6">
                            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-800">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Item</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Person Name</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Office</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Quantity</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Return Date</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Condition</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Damage</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Property No.</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Purchased Date</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Unit of Measures</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        {paginatedData.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{item.item_name || (item.item && item.item.items)}</td>
                                                <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">{item.description || '-'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{item.person_name}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{item.office_name}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{item.quantity_returned}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{item.return_date}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 capitalize">{item.condition}</td>
                                                <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">{item.damage || '-'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{item.property_no || '-'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{item.purchased_date || '-'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{item.amount || '-'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{item.unit_of_measures || '-'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <div className="flex space-x-3">
                                                        {item.condition === 'repairable' && (
                                                            <button
                                                                onClick={() => handleViewSolution(item)}
                                                                className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                                                                title="View Solution"
                                                            >
                                                                <Wrench className="h-5 w-5" />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleEdit(item)}
                                                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                                            title="Edit Item"
                                                        >
                                                            <Edit2 className="h-5 w-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(item)}
                                                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                                            title="Delete Item"
                                                        >
                                                            <Trash2 className="h-5 w-5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {/* Pagination Controls */}
                            {filteredReturns.length > 0 && (
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
                                                <span className="font-medium">{filteredReturns.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</span>
                                                {' '}to{' '}
                                                <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredReturns.length)}</span>
                                                {' '}of{' '}
                                                <span className="font-medium">{filteredReturns.length}</span>
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

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                            Confirm Delete
                        </h3>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                            Are you sure you want to delete this return record? This action cannot be undone.
                        </p>
                        <div className="mt-4 flex justify-end space-x-3">
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Report Generation Modal */}
            {isReportModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                            Generate Report
                        </h3>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Report Type
                            </label>
                            <select
                                value={selectedReport}
                                onChange={(e) => setSelectedReport(e.target.value)}
                                className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="most_returned">Most Returned Equipment</option>
                                <option value="damage_summary">Damage Summary</option>
                                <option value="condition_summary">Condition Summary</option>
                                <option value="monthly_trends">Monthly Return Trends</option>
                                <option value="office_summary">Office-wise Return Summary</option>
                                <option value="person_summary">Person-wise Return Summary</option>
                            </select>
                        </div>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setIsReportModalOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    generateReport();
                                    setIsReportModalOpen(false);
                                }}
                                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                            >
                                Generate
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Inspect Item Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
                    <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full p-6">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                                Add New Return Item
                            </h3>
                            <button
                                onClick={() => {
                                    setIsAddModalOpen(false);
                                    reset();
                                }}
                                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                            >
                                <span className="sr-only">Close</span>
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {/* Item Selection */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Item
                                    </label>
                                    <input
                                        type="text"
                                        value={data.item_name}
                                        onChange={e => setData('item_name', e.target.value)}
                                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Enter item name"
                                        required
                                    />
                                    {errors.item_name && (
                                        <p className="mt-1 text-sm text-red-600">{errors.item_name}</p>
                                    )}
                                </div>

                                {/* Item Description */}
                                <div className="space-y-2 col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Item Description
                                    </label>
                                    <textarea
                                        value={data.description}
                                        onChange={e => setData('description', e.target.value)}
                                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-blue-500 focus:border-blue-500"
                                        rows={3}
                                    />
                                    {errors.description && (
                                        <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                                    )}
                                </div>

                                {/* Person Name */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Person Name
                                    </label>
                                    <input
                                        type="text"
                                        value={data.person_name}
                                        onChange={e => setData('person_name', e.target.value)}
                                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Enter name of person returning"
                                        required
                                    />
                                    {errors.person_name && (
                                        <p className="mt-1 text-sm text-red-600">{errors.person_name}</p>
                                    )}
                                </div>

                                {/* Office Name */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Office Name
                                    </label>
                                    <input
                                        type="text"
                                        value={data.office_name}
                                        onChange={e => setData('office_name', e.target.value)}
                                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Enter office name"
                                        required
                                    />
                                    {errors.office_name && (
                                        <p className="mt-1 text-sm text-red-600">{errors.office_name}</p>
                                    )}
                                </div>

                                {/* Quantity */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Quantity
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={data.quantity_returned}
                                        onChange={e => setData('quantity_returned', e.target.value)}
                                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                    {errors.quantity_returned && (
                                        <p className="mt-1 text-sm text-red-600">{errors.quantity_returned}</p>
                                    )}
                                </div>

                                {/* Property No. */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Property No.
                                    </label>
                                    <input
                                        type="text"
                                        value={data.property_no}
                                        onChange={e => setData('property_no', e.target.value)}
                                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    {errors.property_no && (
                                        <p className="mt-1 text-sm text-red-600">{errors.property_no}</p>
                                    )}
                                </div>

                                {/* Purchased Date */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Purchased Date
                                    </label>
                                    <input
                                        type="date"
                                        value={data.purchased_date}
                                        onChange={e => setData('purchased_date', e.target.value)}
                                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    {errors.purchased_date && (
                                        <p className="mt-1 text-sm text-red-600">{errors.purchased_date}</p>
                                    )}
                                </div>

                                {/* Amount */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Amount
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={data.amount}
                                        onChange={e => setData('amount', e.target.value)}
                                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Enter amount"
                                    />
                                    {errors.amount && (
                                        <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
                                    )}
                                </div>

                                {/* Unit of Measures */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Unit of Measures
                                    </label>
                                    <input
                                        type="text"
                                        value={data.unit_of_measures}
                                        onChange={e => setData('unit_of_measures', e.target.value)}
                                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Enter unit of measures"
                                    />
                                    {errors.unit_of_measures && (
                                        <p className="mt-1 text-sm text-red-600">{errors.unit_of_measures}</p>
                                    )}
                                </div>

                                {/* Return Date */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Return Date
                                    </label>
                                    <input
                                        type="date"
                                        value={data.return_date}
                                        onChange={e => setData('return_date', e.target.value)}
                                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                    {errors.return_date && (
                                        <p className="mt-1 text-sm text-red-600">{errors.return_date}</p>
                                    )}
                                </div>

                                {/* Condition */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Condition
                                    </label>
                                    <select
                                        value={data.condition}
                                        onChange={e => setData('condition', e.target.value)}
                                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="good">Good</option>
                                        <option value="damaged">Damaged</option>
                                        <option value="repairable">Repairable</option>
                                    </select>
                                    {errors.condition && (
                                        <p className="mt-1 text-sm text-red-600">{errors.condition}</p>
                                    )}
                                </div>

                                {/* Damage */}
                                {data.condition !== 'good' && (
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Damage
                                        </label>
                                        <input
                                            type="text"
                                            value={data.damage}
                                            onChange={e => setData('damage', e.target.value)}
                                            className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Enter damage details"
                                        />
                                        {errors.damage && (
                                            <p className="mt-1 text-sm text-red-600">{errors.damage}</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsAddModalOpen(false);
                                        reset();
                                    }}
                                    className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                                >
                                    {processing ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Processing...
                                        </>
                                    ) : 'Submit'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {isEditModalOpen && itemToEdit && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
                    <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full p-6">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                                Edit Return Item
                            </h3>
                            <button
                                onClick={() => {
                                    setIsEditModalOpen(false);
                                    setItemToEdit(null);
                                    resetEdit();
                                }}
                                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                            >
                                <span className="sr-only">Close</span>
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleUpdate} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {/* Item Name */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Item
                                    </label>
                                    <input
                                        type="text"
                                        value={editData.item_name}
                                        onChange={e => setEditData('item_name', e.target.value)}
                                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                    {editErrors.item_name && (
                                        <p className="mt-1 text-sm text-red-600">{editErrors.item_name}</p>
                                    )}
                                </div>

                                {/* Description */}
                                <div className="space-y-2 col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Description
                                    </label>
                                    <textarea
                                        value={editData.description}
                                        onChange={e => setEditData('description', e.target.value)}
                                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-blue-500 focus:border-blue-500"
                                        rows={3}
                                    />
                                    {editErrors.description && (
                                        <p className="mt-1 text-sm text-red-600">{editErrors.description}</p>
                                    )}
                                </div>

                                {/* Person Name */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Person Name
                                    </label>
                                    <input
                                        type="text"
                                        value={editData.person_name}
                                        onChange={e => setEditData('person_name', e.target.value)}
                                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                    {editErrors.person_name && (
                                        <p className="mt-1 text-sm text-red-600">{editErrors.person_name}</p>
                                    )}
                                </div>

                                {/* Office Name */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Office Name
                                    </label>
                                    <input
                                        type="text"
                                        value={editData.office_name}
                                        onChange={e => setEditData('office_name', e.target.value)}
                                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                    {editErrors.office_name && (
                                        <p className="mt-1 text-sm text-red-600">{editErrors.office_name}</p>
                                    )}
                                </div>

                                {/* Quantity */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Quantity
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={editData.quantity_returned}
                                        onChange={e => setEditData('quantity_returned', e.target.value)}
                                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                    {editErrors.quantity_returned && (
                                        <p className="mt-1 text-sm text-red-600">{editErrors.quantity_returned}</p>
                                    )}
                                </div>

                                {/* Property No */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Property No.
                                    </label>
                                    <input
                                        type="text"
                                        value={editData.property_no}
                                        onChange={e => setEditData('property_no', e.target.value)}
                                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    {editErrors.property_no && (
                                        <p className="mt-1 text-sm text-red-600">{editErrors.property_no}</p>
                                    )}
                                </div>

                                {/* Purchased Date */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Purchased Date
                                    </label>
                                    <input
                                        type="date"
                                        value={editData.purchased_date}
                                        onChange={e => setEditData('purchased_date', e.target.value)}
                                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    {editErrors.purchased_date && (
                                        <p className="mt-1 text-sm text-red-600">{editErrors.purchased_date}</p>
                                    )}
                                </div>

                                {/* Amount */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Amount
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={editData.amount}
                                        onChange={e => setEditData('amount', e.target.value)}
                                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    {editErrors.amount && (
                                        <p className="mt-1 text-sm text-red-600">{editErrors.amount}</p>
                                    )}
                                </div>

                                {/* Unit of Measures */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Unit of Measures
                                    </label>
                                    <input
                                        type="text"
                                        value={editData.unit_of_measures}
                                        onChange={e => setEditData('unit_of_measures', e.target.value)}
                                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    {editErrors.unit_of_measures && (
                                        <p className="mt-1 text-sm text-red-600">{editErrors.unit_of_measures}</p>
                                    )}
                                </div>

                                {/* Return Date */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Return Date
                                    </label>
                                    <input
                                        type="date"
                                        value={editData.return_date}
                                        onChange={e => setEditData('return_date', e.target.value)}
                                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                    {editErrors.return_date && (
                                        <p className="mt-1 text-sm text-red-600">{editErrors.return_date}</p>
                                    )}
                                </div>

                                {/* Condition */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Condition
                                    </label>
                                    <select
                                        value={editData.condition}
                                        onChange={e => setEditData('condition', e.target.value)}
                                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="good">Good</option>
                                        <option value="damaged">Damaged</option>
                                        <option value="repairable">Repairable</option>
                                    </select>
                                    {editErrors.condition && (
                                        <p className="mt-1 text-sm text-red-600">{editErrors.condition}</p>
                                    )}
                                </div>

                                {/* Damage */}
                                {(editData.condition === 'damaged' || editData.condition === 'repairable') && (
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Damage
                                        </label>
                                        <input
                                            type="text"
                                            value={editData.damage}
                                            onChange={e => setEditData('damage', e.target.value)}
                                            className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="Enter damage details"
                                        />
                                        {editErrors.damage && (
                                            <p className="mt-1 text-sm text-red-600">{editErrors.damage}</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsEditModalOpen(false);
                                        setItemToEdit(null);
                                        resetEdit();
                                    }}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={editProcessing}
                                    className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                                >
                                    {editProcessing ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Processing...
                                        </>
                                    ) : 'Update'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Solution Modal - completely replaced with interactive version */}
            {isSolutionModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 overflow-y-auto">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full p-6 max-h-[90vh] flex flex-col transition-all duration-300 ease-in-out">
                        <div className="flex justify-between items-center mb-6 border-b pb-4 dark:border-gray-700">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                                {issueSolved ? (
                                    <>
                                        <svg className="w-6 h-6 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                        </svg>
                                        Issue Solved
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-6 h-6 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                        </svg>
                                        {solutionContent.title}
                                    </>
                                )}
                            </h3>
                            <button
                                onClick={() => {
                                    setIsSolutionModalOpen(false);
                                    setIssueSolved(false);
                                }}
                                className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-600 dark:hover:text-white transition-colors duration-200"
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
                            </button>
                        </div>
                        
                        {/* Item info banner */}
                        <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-md mb-5 text-sm text-blue-800 dark:text-blue-200 flex items-start space-x-3">
                            <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <div>
                                <p className="mb-1"><strong>Item:</strong> {solutionItem?.item_name}</p>
                                <p><strong>Issue:</strong> {solutionItem?.damage}</p>
                            </div>
                        </div>

                        {issueSolved ? (
                            <div className="mb-4 overflow-y-auto flex-grow pr-2 text-gray-700 dark:text-gray-300">
                                <div className="flex flex-col items-center justify-center p-8 text-center">
                                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                                        <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                        </svg>
                                    </div>
                                    <h4 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Great! The issue has been successfully resolved</h4>
                                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                                        The troubleshooting steps have successfully resolved the {solutionItem?.damage} issue with the {solutionItem?.item_name}.
                                    </p>
                                    <div className="border-t border-b border-gray-200 dark:border-gray-700 py-5 w-full my-4">
                                        <h5 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Problem solved by:</h5>
                                        <p className="text-gray-700 dark:text-gray-300">
                                            {solutionSteps[currentSolutionStep]?.title}
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                            {solutionSteps[currentSolutionStep]?.description}
                                        </p>
                                    </div>
                                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                                        You can now close this window and continue.
                                    </p>
                                </div>
                            </div>
                        ) : showAllPossibleIssues ? (
                            <div className="mb-4 overflow-y-auto flex-grow pr-2 text-gray-700 dark:text-gray-300">
                                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-5 rounded-md mb-6">
                                    <div className="flex items-start">
                                        <svg className="w-6 h-6 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                                        </svg>
                                        <div>
                                            <h4 className="font-bold text-yellow-800 dark:text-yellow-200 mb-2 text-lg">All Possible Issues</h4>
                                            <p className="text-yellow-800 dark:text-yellow-200 mb-3">
                                                If none of the troubleshooting steps resolved the issue, it could be due to one of the following:
                                            </p>
                                        </div>
                                    </div>
                                    <ul className="list-disc pl-8 space-y-2 mt-4">
                                        {solutionContent.possibleIssues.map((issue, index) => (
                                            <li key={index} className="text-yellow-800 dark:text-yellow-200">{issue}</li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-700 p-5 rounded-md">
                                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                                        <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                        </svg>
                                        Next Steps
                                    </h4>
                                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                                        Consider contacting technical support or a repair service for professional assistance with this issue. 
                                        For complex issues, it's often best to seek help from authorized service centers.
                                    </p>
                                </div>
                                <div className="flex justify-between mt-6">
                                    <button
                                        onClick={() => setShowAllPossibleIssues(false)}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 flex items-center"
                                    >
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 17l-5-5m0 0l5-5m-5 5h12"></path>
                                        </svg>
                                        Return to Troubleshooting Steps
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="mb-4 overflow-y-auto flex-grow pr-2 text-gray-700 dark:text-gray-300">
                                {/* Progress indicator */}
                                <div className="mb-5">
                                    <div className="flex justify-between mb-2 text-xs text-gray-600 dark:text-gray-400">
                                        <span>Step {currentSolutionStep + 1} of {solutionSteps.length}</span>
                                        <span>{Math.round(((currentSolutionStep + 1) / solutionSteps.length) * 100)}% Complete</span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                                        <div 
                                            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out" 
                                            style={{ width: `${((currentSolutionStep + 1) / solutionSteps.length) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>

                                {/* Current step content */}
                                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 mb-5 shadow-sm">
                                    <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                                        <span className="flex items-center justify-center bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 w-7 h-7 rounded-full mr-3 text-sm">
                                            {currentSolutionStep + 1}
                                        </span>
                                        {solutionSteps[currentSolutionStep]?.title}
                                    </h4>
                                    
                                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                                        {solutionSteps[currentSolutionStep]?.description}
                                    </p>
                                    
                                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md mb-4">
                                        <h5 className="font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center">
                                            <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                                            </svg>
                                            Instructions:
                                        </h5>
                                        <div className="whitespace-pre-line text-gray-700 dark:text-gray-300">
                                            {solutionSteps[currentSolutionStep]?.instructions}
                                        </div>
                                    </div>
                                    
                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md">
                                        <h5 className="font-semibold text-blue-800 dark:text-blue-200 mb-2 flex items-center">
                                            <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                                            </svg>
                                            Expected Result:
                                        </h5>
                                        <p className="text-blue-800 dark:text-blue-200">
                                            {solutionSteps[currentSolutionStep]?.expectedResult}
                                        </p>
                                    </div>
                                </div>

                                {/* Question after step */}
                                <div className="bg-gray-50 dark:bg-gray-700 p-5 rounded-lg shadow-sm mb-5">
                                    <p className="font-medium text-gray-800 dark:text-gray-200 mb-4 flex items-center">
                                        <svg className="w-5 h-5 text-gray-600 dark:text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                        </svg>
                                        Did this step fix the issue?
                                    </p>
                                    <div className="flex flex-wrap gap-3">
                                        <button
                                            onClick={() => {
                                                // If this worked, show success message
                                                setIssueSolved(true);
                                            }}
                                            className="px-5 py-2.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200 flex items-center shadow-sm"
                                        >
                                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                            </svg>
                                            Yes, it worked!
                                        </button>
                                        <button
                                            onClick={() => {
                                                // If more steps available, go to next step
                                                if (currentSolutionStep < solutionSteps.length - 1) {
                                                    setCurrentSolutionStep(currentSolutionStep + 1);
                                                } else {
                                                    // If last step, show all possible issues
                                                    setShowAllPossibleIssues(true);
                                                }
                                            }}
                                            className="px-5 py-2.5 bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors duration-200 flex items-center shadow-sm"
                                        >
                                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                            </svg>
                                            No, continue troubleshooting
                                        </button>
                                    </div>
                                </div>

                                {/* Navigation buttons */}
                                <div className="flex justify-between mt-6">
                                    <button
                                        onClick={() => {
                                            if (currentSolutionStep > 0) {
                                                setCurrentSolutionStep(currentSolutionStep - 1);
                                            }
                                        }}
                                        disabled={currentSolutionStep === 0}
                                        className={`px-4 py-2 rounded-md flex items-center ${
                                            currentSolutionStep === 0 
                                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500' 
                                            : 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors duration-200'
                                        }`}
                                    >
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                                        </svg>
                                        Previous Step
                                    </button>
                                    <button
                                        onClick={() => setShowAllPossibleIssues(true)}
                                        className="px-4 py-2 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center transition-colors duration-200"
                                    >
                                        Skip to All Possible Issues
                                        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        )}
                        
                        <div className="flex justify-end space-x-3 pt-4 border-t dark:border-gray-700">
                            <button
                                onClick={() => {
                                    setIsSolutionModalOpen(false);
                                    setIssueSolved(false);
                                }}
                                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600 transition-colors duration-200"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
} 