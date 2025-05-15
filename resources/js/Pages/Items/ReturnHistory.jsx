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

    // New state for guided troubleshooting
    const [issueSearchTerm, setIssueSearchTerm] = useState('');
    const [filteredIssues, setFilteredIssues] = useState([]);
    const [selectedIssue, setSelectedIssue] = useState(null);
    const [guidedSteps, setGuidedSteps] = useState([]);
    const [currentGuidedStep, setCurrentGuidedStep] = useState(0);
    const [recommendedAction, setRecommendedAction] = useState('');

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
                        © ${new Date().getFullYear()} LGU Magallanes
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
        const damageLower = damage ? damage.toLowerCase() : '';
        
        // Common printer issues
        const commonIssues = [
            {
                id: 'no_power',
                title: 'Printer Offline / No Power',
                keywords: ['power', 'offline', 'dead', 'not turning on', 'no lights', 'unresponsive'],
                guidedTroubleshooting: [
                    {
                        question: 'Is the power cable securely plugged into the printer and the power outlet?',
                        yesStep: 1,
                        noAction: 'Firmly plug the power cable into both the printer and the wall outlet. Remove and re-insert both ends to ensure a solid connection. If using a power strip, try plugging directly into the wall.',
                        helpText: 'Loose connections are a common cause of power issues. Double-check both ends of the cable.'
                    },
                    {
                        question: 'Is the power outlet working? (Try plugging in another device to verify)',
                        yesStep: 2,
                        noAction: 'Test the outlet with a lamp or phone charger. If it does not work, try a different outlet or reset the circuit breaker.',
                        helpText: 'Sometimes outlets or power strips fail. Always verify with another device.'
                    },
                    {
                        question: 'Is the printer power button turned on? (Press and hold for 3-5 seconds)',
                        yesStep: 3,
                        noAction: 'Locate the power button (often marked with a circle and line symbol). Press and hold for 3-5 seconds. Watch for any lights or sounds.',
                        helpText: 'Some printers require a long press to power on.'
                    },
                    {
                        question: 'Are there any lights or indicators on the printer that show it\'s receiving power?',
                        yesStep: 4,
                        noAction: 'Look for any LED lights, display screens, or sounds. If none, check for a secondary power switch on the back or side.',
                        helpText: 'Even a faint light or display means the printer is getting power.'
                    },
                    {
                        question: 'Have you tried power cycling the printer? (Turn off, unplug for 60 seconds, plug in, turn on)',
                        yesStep: 5,
                        noAction: 'Turn off the printer, unplug it from the wall, wait 60 seconds, then plug it back in and turn it on.',
                        helpText: 'This resets the printer\'s internal electronics.'
                    },
                    {
                        question: 'Have you checked for a tripped circuit breaker or blown fuse?',
                        yesStep: 6,
                        noAction: 'Check your home\'s breaker panel for any tripped breakers. If your printer has a user-accessible fuse, check and replace it if needed.',
                        helpText: 'Power surges can trip breakers or blow fuses.'
                    },
                    {
                        question: 'Have you inspected the power cable for any visible damage?',
                        yesStep: 7,
                        noAction: 'Look for cuts, frays, or bent connectors. Replace the cable if any damage is found.',
                        helpText: 'Damaged cables are a safety hazard and can prevent power delivery.'
                    },
                    {
                        question: 'Is the printer showing up in your computer\'s printer list?',
                        yesStep: 8,
                        noAction: 'Check your computer\'s printer settings. If not listed, reinstall the printer drivers or check the connection.',
                        helpText: 'A printer may be powered but not communicating with the computer.'
                    },
                    {
                        question: 'Have you tried resetting the printer to factory defaults?',
                        yesStep: 9,
                        noAction: 'Consult your printer\'s manual for reset instructions. This usually involves holding specific buttons while powering on.',
                        helpText: 'A factory reset can resolve persistent issues but will erase all settings.'
                    },
                    {
                        question: 'Is the issue resolved?',
                        yesStep: -1,
                        noAction: 'If the issue persists after all steps, please contact a technician or service center for further assistance.',
                        helpText: 'If you answered "No", further troubleshooting or professional repair may be needed.',
                        solution: 'If the device is now working, the issue has been resolved. If not, further service is required.'
                    }
                ],
                solutions: [
                    {
                        title: 'Check Power Connection',
                        description: 'Ensure the printer is properly connected to power.',
                        steps: [
                            'Verify power cable is securely connected to the printer',
                            'Check that the power cable is plugged into a working outlet',
                            'Ensure the printer\'s power button is turned on',
                            'Check if there\'s a separate power switch on the back or side of the printer',
                            'Look for indicator lights that show the printer is receiving power',
                            'Inspect the power cable for any visible damage or fraying',
                            'Try a different power outlet if available',
                            'If using a power strip or surge protector, try connecting directly to wall outlet',
                            'Make sure the power cable is fully inserted on both ends'
                        ]
                    },
                    {
                        title: 'Power Cycle the Printer',
                        description: 'A complete power reset can resolve many electronic issues.',
                        steps: [
                            'Turn off the printer using the power button',
                            'Unplug the power cable from the outlet',
                            'Wait at least 60 seconds to fully discharge internal components',
                            'While waiting, press and hold the power button for 5 seconds to drain residual power',
                            'Plug the power cable back in, ensuring a firm connection',
                            'Turn on the printer and wait for it to fully initialize',
                            'Listen for startup sounds and watch for lights or display activation',
                            'Wait at least 2 minutes for the printer to complete its startup sequence',
                            'Check if the printer appears in your computer\'s device list after startup'
                        ]
                    },
                    {
                        title: 'Check for Hardware Issues',
                        description: 'Identify possible hardware problems causing power issues.',
                        steps: [
                            'Check if your home\'s circuit breaker for that outlet is tripped',
                            'Inspect for blown fuses in the printer (if accessible according to manual)',
                            'Look for any burnt smell or visible damage on the printer',
                            'Test the power outlet with another device to confirm it works',
                            'Try a different power cable if you have a compatible one',
                            'Check if there\'s an emergency reset button (small pinhole) on the printer',
                            'Remove and reinsert ink or toner cartridges as they might trigger safety locks',
                            'Ensure paper trays are properly closed and detected by the printer',
                            'Check for paper jams that might cause the printer to enter error mode',
                            'Consult the printer manual for model-specific troubleshooting tips'
                        ]
                    },
                    {
                        title: 'Check Network Connection',
                        description: 'For network printers that appear powered off but may be in sleep mode.',
                        steps: [
                            'Ensure the network cable is securely connected (for wired connections)',
                            'Check that WiFi is enabled on the printer (for wireless connections)',
                            'Verify the printer is connected to the correct network',
                            'Restart your router and wait for it to fully initialize',
                            'Check if the printer has a dedicated IP address in your router settings',
                            'Try printing a network configuration page from the printer\'s control panel',
                            'Check if the printer responds to ping commands from your computer',
                            'Try resetting the printer\'s network settings if all else fails',
                            'Update printer firmware if available',
                            'Check if the printer is in power-saving or deep sleep mode'
                        ]
                    },
                    {
                        title: 'Check for Internal Fuse or Power Supply Issues',
                        description: 'Advanced troubleshooting for persistent power problems.',
                        steps: [
                            'Consult your printer manual to locate any user-serviceable fuses',
                            'Check if the fuse can be safely inspected or replaced (professional help recommended)',
                            'Look for signs of power supply failure such as no lights at all when plugged in',
                            'Check if the power supply is internal or external (power brick)',
                            'For external power supplies, check for indicator lights on the power brick',
                            'Measure voltage output with a multimeter if you have the skills and tools',
                            'Check online for known power issues with your specific printer model',
                            'Consider contacting the manufacturer for support if under warranty',
                            'For older printers, weigh repair costs against replacement costs',
                            'If all else fails, consider professional repair service'
                        ]
                    }
                ]
            },
            {
                id: 'ink_smudging',
                title: 'Ink Smudging',
                keywords: ['smudge', 'smear', 'ink', 'bleed', 'streaks', 'wet ink'],
                guidedTroubleshooting: [
                    {
                        question: 'Does the smudging occur immediately after printing?',
                        yesStep: 1,
                        noAction: 'Try waiting 30-60 seconds before handling printed documents to allow ink to dry completely.',
                        helpText: 'Touching pages before ink is dry is a common cause of smudging.'
                    },
                    {
                        question: 'Are you using the correct paper type settings for your print job?',
                        yesStep: 2,
                        noAction: 'Adjust your printer settings to match the paper type you\'re using (e.g., regular, photo, glossy).',
                        helpText: 'Using incorrect paper settings can cause the printer to apply too much ink.'
                    },
                    {
                        question: 'Are you using high-quality paper suitable for your printer?',
                        yesStep: 3,
                        noAction: 'Switch to paper that\'s designed for your printer type (inkjet/laser) and the specific print job.',
                        helpText: 'Low-quality paper may not properly absorb ink, leading to smudging.'
                    },
                    {
                        question: 'Have you run a print head cleaning cycle recently?',
                        yesStep: 4,
                        noAction: 'Run a print head cleaning cycle from your printer\'s maintenance menu.',
                        helpText: 'Clogged print heads can cause uneven ink distribution.'
                    },
                    {
                        question: 'Are you using genuine ink cartridges?',
                        yesStep: 5,
                        noAction: 'Consider switching to manufacturer-recommended ink cartridges.',
                        helpText: 'Third-party cartridges may not perform as well with your specific printer.'
                    },
                    {
                        question: 'Have you tried reducing the print density or quality settings?',
                        yesStep: 6,
                        noAction: 'Adjust your printer settings to reduce ink density or use a lower quality setting for drafts.',
                        helpText: 'Sometimes using too much ink can lead to smudging.'
                    },
                    {
                        question: 'Is the printer in a humid environment?',
                        yesStep: 7,
                        noAction: 'Move the printer to a less humid area or use a dehumidifier. High humidity can slow ink drying.',
                        helpText: 'Humidity can prevent ink from drying quickly.'
                    },
                    {
                        question: 'Have you checked for firmware or driver updates for your printer?',
                        yesStep: -1,
                        noAction: 'Update your printer\'s firmware and drivers from the manufacturer\'s website.',
                        helpText: 'Updates can resolve compatibility and print quality issues.',
                        solution: 'You have verified key factors affecting ink smudging. For persistent issues, consider contacting the manufacturer for service or cartridge replacement.'
                    }
                ],
                solutions: [
                    {
                        title: 'Allow Ink to Dry Completely',
                        description: 'After printing, avoid touching the paper immediately. Some inkjet printers require extra drying time, especially when printing on glossy or thick paper.',
                        steps: [
                            'Wait at least 30 seconds after printing before handling documents',
                            'For high-quality photo printing, allow 2-3 minutes drying time',
                            'Consider using quick-dry ink if available for your printer model',
                            'Place printed pages on a flat, open surface to dry',
                            'Avoid stacking freshly printed pages',
                            'Use a fan or gentle airflow to speed up drying',
                            'Store paper in a dry environment',
                            'Check for excess humidity in the room',
                            'If possible, use specialty paper designed for fast drying'
                        ]
                    },
                    {
                        title: 'Check Paper Type Settings',
                        description: 'Using incorrect paper type settings can cause excess ink application.',
                        steps: [
                            'Verify paper type matches printer settings',
                            'For glossy paper, ensure "Photo" or "Glossy" setting is selected',
                            'Adjust print quality settings if needed',
                            'Check if the paper is loaded correctly in the tray',
                            'Use the recommended paper weight for your printer',
                            'Avoid using damp or wrinkled paper',
                            'Test with a different brand of paper',
                            'Check for paper jams or misfeeds',
                            'Consult the printer manual for supported paper types'
                        ]
                    },
                    {
                        title: 'Clean Print Heads',
                        description: 'Clogged print heads can cause uneven ink distribution.',
                        steps: [
                            'Access printer maintenance menu',
                            'Select "Clean Print Heads" option',
                            'Run the cleaning cycle',
                            'Print a test page to verify improvement',
                            'Repeat cleaning if necessary',
                            'Manually clean print heads if automatic cleaning fails',
                            'Check for dried ink on print head nozzles',
                            'Use manufacturer-recommended cleaning kits',
                            'Replace print head if cleaning does not resolve issue'
                        ]
                    }
                ]
            },
            {
                id: 'wifi_connection',
                title: 'Printer Not Connecting to Wi-Fi',
                keywords: ['wifi', 'wireless', 'network', 'connection', 'not connecting', 'offline'],
                guidedTroubleshooting: [
                    {
                        question: 'Is your Wi-Fi network working properly? (Can other devices connect to it?)',
                        yesStep: 1,
                        noAction: 'Troubleshoot your Wi-Fi network first. Try restarting your router.',
                        helpText: 'Make sure your network is operational before troubleshooting the printer connection.'
                    },
                    {
                        question: 'Is the printer within range of your Wi-Fi router?',
                        yesStep: 2,
                        noAction: 'Move the printer closer to your Wi-Fi router or consider using a Wi-Fi extender.',
                        helpText: 'Walls and distance can significantly reduce Wi-Fi signal strength.'
                    },
                    {
                        question: 'Is your printer\'s Wi-Fi feature turned on?',
                        yesStep: 3,
                        noAction: 'Enable Wi-Fi on your printer through its control panel settings.',
                        helpText: 'Check the printer\'s control panel for network or wireless settings.'
                    },
                    {
                        question: 'Do you know the correct Wi-Fi password?',
                        yesStep: 4,
                        noAction: 'Verify your Wi-Fi password and re-enter it on the printer.',
                        helpText: 'Make sure you\'re entering the correct password, respecting uppercase/lowercase letters.'
                    },
                    {
                        question: 'Have you tried restarting the printer?',
                        yesStep: 5,
                        noAction: 'Turn off the printer, wait 30 seconds, then turn it back on.',
                        helpText: 'A simple restart can often resolve connection issues.'
                    },
                    {
                        question: 'Have you tried forgetting the network and reconnecting the printer to Wi-Fi?',
                        yesStep: 6,
                        noAction: 'Try removing the saved network from your printer and setting up the connection again from scratch.',
                        helpText: 'This process varies by printer model, but usually involves going to network settings.'
                    },
                    {
                        question: 'Are there any firmware updates available for your printer?',
                        yesStep: 7,
                        noAction: 'Check the manufacturer\'s website for firmware updates and install if available.',
                        helpText: 'Firmware updates can resolve connectivity issues.'
                    },
                    {
                        question: 'Is your router using MAC address filtering or other security features?',
                        yesStep: 8,
                        noAction: 'Disable MAC address filtering or add your printer\'s MAC address to the allowed list.',
                        helpText: 'Some routers block new devices by default.'
                    },
                    {
                        question: 'Have you tried assigning a static IP address to the printer?',
                        yesStep: -1,
                        noAction: 'Assign a static IP address to the printer through the control panel or router settings.',
                        helpText: 'Static IPs can help avoid network conflicts.',
                        solution: 'You have verified all the main Wi-Fi connection factors. For persistent issues, check if there\'s a firmware update for your printer or contact the manufacturer\'s support.'
                    }
                ],
                solutions: [
                    {
                        title: 'Check Wi-Fi Status',
                        description: 'Ensure the printer\'s Wi-Fi is enabled and functioning.',
                        steps: [
                            'Access the printer\'s control panel',
                            'Navigate to network or wireless settings',
                            'Verify Wi-Fi is turned on',
                            'Check for Wi-Fi signal strength indicators',
                            'Restart the printer\'s Wi-Fi module if possible',
                            'Check for error messages on the printer display',
                            'Ensure airplane mode is off',
                            'Test with a different Wi-Fi network',
                            'Consult the manual for model-specific Wi-Fi instructions'
                        ]
                    },
                    {
                        title: 'Reconnect to Network',
                        description: 'Re-establish the connection to your Wi-Fi network.',
                        steps: [
                            'Access network settings on the printer',
                            'Select "Forget" or "Remove" the current network (if applicable)',
                            'Select your Wi-Fi network from the list of available networks',
                            'Enter your Wi-Fi password carefully',
                            'Wait for the connection to be established',
                            'Check for confirmation or error messages',
                            'Restart the printer after reconnecting',
                            'Test printing a network configuration page',
                            'If needed, reset network settings and try again'
                        ]
                    },
                    {
                        title: 'Restart Network Equipment',
                        description: 'Refresh all network connections.',
                        steps: [
                            'Turn off your printer',
                            'Restart your Wi-Fi router (unplug, wait 30 seconds, plug back in)',
                            'Once the router is fully restarted, turn on the printer',
                            'Wait for all connections to be re-established',
                            'Check if other devices can connect to the network',
                            'Move the printer closer to the router',
                            'Check for interference from other electronics',
                            'Update router firmware if available',
                            'Contact your ISP if network issues persist'
                        ]
                    }
                ]
            },
            {
                id: 'paper_jam',
                title: 'Paper Jam',
                keywords: ['jam', 'stuck', 'feed', 'paper', 'not taking paper'],
                guidedTroubleshooting: [
                    {
                        question: 'Is the printer showing a paper jam error?',
                        yesStep: 1,
                        noAction: 'Check the printer display or software for specific error details.',
                        helpText: 'The error message might indicate where the jam is located.'
                    },
                    {
                        question: 'Have you turned off the printer before attempting to clear the jam?',
                        yesStep: 2,
                        noAction: 'Turn off the printer and unplug it before attempting to remove jammed paper.',
                        helpText: 'This is an important safety step to prevent damage to the printer or injury.'
                    },
                    {
                        question: 'Can you see the jammed paper?',
                        yesStep: 3,
                        noAction: 'Open all access doors and carefully look for jammed paper in the paper path.',
                        helpText: 'Check input trays, output trays, and any access panels.'
                    },
                    {
                        question: 'Have you gently pulled the jammed paper in the direction of the paper path?',
                        yesStep: 4,
                        noAction: 'Carefully pull the jammed paper in the direction it would normally move, not against it.',
                        helpText: 'Pulling paper against its intended direction can damage the printer.'
                    },
                    {
                        question: 'Have you checked for and removed any torn pieces of paper?',
                        yesStep: 5,
                        noAction: 'Ensure you\'ve removed all paper fragments, which can cause additional jams.',
                        helpText: 'Use a flashlight if necessary to spot small pieces of torn paper.'
                    },
                    {
                        question: 'Have you checked the rollers and feed mechanisms for debris or wear?',
                        yesStep: 6,
                        noAction: 'Inspect rollers for dust, debris, or wear. Clean or replace if needed.',
                        helpText: 'Worn or dirty rollers can cause repeated jams.'
                    },
                    {
                        question: 'Are you using the correct paper type and loading it properly?',
                        yesStep: 7,
                        noAction: 'Use only recommended paper types and do not overfill the tray.',
                        helpText: 'Incorrect paper or overfilling can cause jams.'
                    },
                    {
                        question: 'Have you checked for foreign objects in the paper path?',
                        yesStep: 8,
                        noAction: 'Remove any paper clips, staples, or other objects from the paper path.',
                        helpText: 'Foreign objects are a common cause of jams.'
                    },
                    {
                        question: 'After clearing the jam, have you properly loaded paper in the tray?',
                        yesStep: -1,
                        noAction: 'Make sure paper is properly aligned, not overfilled, and the correct size for your tray.',
                        helpText: 'Improper paper loading is a common cause of jams.',
                        solution: 'You have successfully cleared the paper jam. To prevent future jams, use recommended paper types, don\'t overfill the tray, and keep paper stored in a dry place.'
                    }
                ],
                solutions: [
                    {
                        title: 'Clear the Paper Jam',
                        description: 'Safely remove jammed paper from the printer.',
                        steps: [
                            'Turn off the printer and unplug if possible',
                            'Open all access doors and paper trays',
                            'Locate the jammed paper',
                            'Gently pull the paper in the direction of the normal paper path',
                            'Remove any torn pieces of paper',
                            'Check for paper fragments with a flashlight',
                            'Inspect rollers and feed mechanisms for debris or wear',
                            'Remove any foreign objects from the paper path',
                            'Close all doors and reconnect power',
                            'Turn the printer back on'
                        ]
                    },
                    {
                        title: 'Properly Load Paper',
                        description: 'Ensure paper is loaded correctly to prevent future jams.',
                        steps: [
                            'Remove all paper from the tray',
                            'Fan the stack to separate sheets',
                            'Align the edges on a flat surface',
                            'Load paper according to the tray\'s capacity limits',
                            'Adjust paper guides to fit the paper size snugly but not too tight',
                            'Use only recommended paper types and sizes',
                            'Avoid using wrinkled or curled paper',
                            'Store paper in a dry place',
                            'Do not overfill the tray'
                        ]
                    },
                    {
                        title: 'Check for Obstructions',
                        description: 'Ensure the paper path is clear of foreign objects.',
                        steps: [
                            'Turn off and unplug the printer',
                            'Open all access panels',
                            'Inspect for paper clips, staples or torn paper',
                            'Remove any foreign objects carefully',
                            'Check for stuck labels or envelope glue residue',
                            'Clean rollers with a lint-free cloth',
                            'Check for small pieces of paper in hard-to-see areas',
                            'Use compressed air to clear dust',
                            'Consult the manual for jam-clearing tips'
                        ]
                    }
                ]
            },
            {
                id: 'not_scanning',
                title: 'Printer Not Scanning',
                keywords: ['scan', 'scanner', 'not scanning', 'scanning error'],
                guidedTroubleshooting: [
                    {
                        question: 'Is the scanner lid completely closed?',
                        yesStep: 1,
                        noAction: 'Close the scanner lid completely.',
                        helpText: 'An open or partially closed lid can prevent proper scanning.'
                    },
                    {
                        question: 'Is the document placed correctly on the scanner glass?',
                        yesStep: 2,
                        noAction: 'Position the document face-down on the scanner glass, aligned with the reference marks.',
                        helpText: 'The document should be face-down, aligned with the corner or guides indicated on the scanner.'
                    },
                    {
                        question: 'Is the scanner glass clean and free of smudges?',
                        yesStep: 3,
                        noAction: 'Clean the scanner glass with a soft, lint-free cloth slightly dampened with water or glass cleaner.',
                        helpText: 'Fingerprints, dust, or smudges can affect scan quality or prevent scanning.'
                    },
                    {
                        question: 'Is the scanning software installed on your computer?',
                        yesStep: 4,
                        noAction: 'Install the printer\'s scanning software from the manufacturer\'s website.',
                        helpText: 'Without the proper software, your computer may not be able to communicate with the scanner.'
                    },
                    {
                        question: 'Is the printer properly connected to your computer (via USB, network, or Wi-Fi)?',
                        yesStep: 5,
                        noAction: 'Check and secure all connections between the printer and computer.',
                        helpText: 'A loose or faulty connection can interrupt communication between devices.'
                    },
                    {
                        question: 'Have you tried restarting both the printer and computer?',
                        yesStep: 6,
                        noAction: 'Restart both the printer and computer to reset the connection and software.',
                        helpText: 'A simple restart can resolve many communication issues.'
                    },
                    {
                        question: 'Have you checked for driver or firmware updates for your printer?',
                        yesStep: 7,
                        noAction: 'Update your printer\'s drivers and firmware from the manufacturer\'s website.',
                        helpText: 'Updates can resolve compatibility and scanning issues.'
                    },
                    {
                        question: 'Are you using the correct scan settings (e.g., file type, resolution)?',
                        yesStep: 8,
                        noAction: 'Adjust scan settings to match your document type and try again.',
                        helpText: 'Incorrect settings can cause scan failures.'
                    },
                    {
                        question: 'Have you tried scanning from a different device or app?',
                        yesStep: -1,
                        noAction: 'Try scanning from another computer or using a different scanning app.',
                        helpText: 'This can help determine if the issue is with the printer or the computer.',
                        solution: 'You have verified all common scanning issues. For persistent problems, consider updating your scanner drivers or contacting the manufacturer\'s support.'
                    }
                ],
                solutions: [
                    {
                        title: 'Check Scanner Setup',
                        description: 'Ensure the scanner is properly prepared for scanning.',
                        steps: [
                            'Clean the scanner glass with a soft, lint-free cloth',
                            'Place the document face-down on the glass',
                            'Align the document with the indicated corner or guides',
                            'Close the scanner lid completely',
                            'Check for obstructions or debris on the glass',
                            'Ensure the scanner is not in use by another program',
                            'Check for error messages on the printer display',
                            'Test scanning a different document',
                            'Consult the manual for scanner setup tips'
                        ]
                    },
                    {
                        title: 'Verify Software Installation',
                        description: 'Ensure the necessary scanning software is installed and working.',
                        steps: [
                            'Check if scanning software is installed on your computer',
                            'If missing, download from the manufacturer\'s website',
                            'Install the software following the provided instructions',
                            'Restart your computer after installation',
                            'Check for software updates',
                            'Ensure the software is compatible with your operating system',
                            'Try reinstalling the software if issues persist',
                            'Test scanning with a different app',
                            'Contact support if software will not install'
                        ]
                    },
                    {
                        title: 'Check Connections',
                        description: 'Verify all connections between scanner and computer.',
                        steps: [
                            'Ensure USB cable is securely connected (if applicable)',
                            'Check that the printer is on the same network as your computer',
                            'Restart the printer and computer',
                            'Try a different USB port or cable if available',
                            'Check for network issues or IP conflicts',
                            'Disable VPN or firewall temporarily',
                            'Test scanning from another device',
                            'Check for loose or damaged cables',
                            'Consult the manual for connection troubleshooting'
                        ]
                    }
                ]
            },
            {
                id: 'strange_noises',
                title: 'Printer Making Strange Noises',
                keywords: ['noise', 'loud', 'grinding', 'squeaking', 'clicking', 'banging'],
                guidedTroubleshooting: [
                    {
                        question: 'Is the noise coming from the paper feed area?',
                        yesStep: 1,
                        noAction: 'Check the paper feed area for obstructions or damaged components.',
                        helpText: 'Many printer noises originate from paper handling mechanisms.'
                    },
                    {
                        question: 'Have you checked for foreign objects inside the printer?',
                        yesStep: 2,
                        noAction: 'Turn off the printer and check for foreign objects like paper clips, staples, or torn paper.',
                        helpText: 'Small objects can create loud noises when they interfere with moving parts.'
                    },
                    {
                        question: 'Is the printer on a stable, level surface?',
                        yesStep: 3,
                        noAction: 'Place the printer on a sturdy, level surface to reduce vibration.',
                        helpText: 'An unstable surface can amplify normal operating sounds.'
                    },
                    {
                        question: 'Are the ink or toner cartridges properly installed?',
                        yesStep: 4,
                        noAction: 'Remove and reseat the ink or toner cartridges to ensure they\'re properly installed.',
                        helpText: 'Improperly seated cartridges can cause unusual noises during printing.'
                    },
                    {
                        question: 'Have you tried printing a test page to see if the noise continues?',
                        yesStep: 5,
                        noAction: 'Print a test page to determine if the noise is related to specific functions.',
                        helpText: 'This can help identify whether the noise is part of normal operation or a malfunction.'
                    },
                    {
                        question: 'Is the printer making noise even when idle (not printing)?',
                        yesStep: 6,
                        noAction: 'If the printer makes noise when idle, it may indicate a mechanical issue that requires service.',
                        helpText: 'Normal printers should be relatively quiet when not actively printing or preparing to print.'
                    },
                    {
                        question: 'Have you checked for worn or damaged gears or belts?',
                        yesStep: 7,
                        noAction: 'Inspect gears and belts for wear or damage. Replace if necessary.',
                        helpText: 'Worn gears or belts can cause grinding or squeaking noises.'
                    },
                    {
                        question: 'Have you lubricated moving parts as recommended by the manufacturer?',
                        yesStep: 8,
                        noAction: 'Apply manufacturer-recommended lubricant to moving parts if allowed.',
                        helpText: 'Lack of lubrication can cause squeaking or grinding.'
                    },
                    {
                        question: 'Have you checked for firmware updates that address noise issues?',
                        yesStep: -1,
                        noAction: 'Update your printer\'s firmware from the manufacturer\'s website.',
                        helpText: 'Firmware updates can resolve some mechanical issues.',
                        solution: 'You\'ve checked the common causes of printer noise. If the noise persists and is unusually loud or different from normal operation, consider contacting the manufacturer for service.'
                    }
                ],
                solutions: [
                    {
                        title: 'Check for Obstructions',
                        description: 'Foreign objects can cause unusual noises.',
                        steps: [
                            'Power off and unplug the printer',
                            'Open all access panels',
                            'Inspect for paper clips, staples or torn paper',
                            'Remove any foreign objects carefully',
                            'Check for stuck labels or debris',
                            'Inspect rollers and gears for obstructions',
                            'Use a flashlight to check hard-to-see areas',
                            'Test printer after removing obstructions',
                            'Consult the manual for noise troubleshooting'
                        ]
                    },
                    {
                        title: 'Inspect Carriage Movement',
                        description: 'Restricted carriage movement can cause grinding sounds.',
                        steps: [
                            'Power off the printer',
                            'Manually move print carriage (if accessible)',
                            'Check for smooth movement',
                            'Clear any obstructions in the carriage path',
                            'Check for worn or damaged belts',
                            'Lubricate moving parts if recommended',
                            'Check for loose screws or parts',
                            'Test carriage movement after adjustments',
                            'Contact support if carriage is stuck'
                        ]
                    }
                ]
            },
            {
                id: 'poor_quality',
                title: 'Poor Print Quality',
                keywords: ['quality', 'blurry', 'faded', 'streaks', 'lines', 'dots', 'spotty'],
                guidedTroubleshooting: [
                    {
                        question: 'Are your ink or toner levels sufficient?',
                        yesStep: 1,
                        noAction: 'Replace low ink or toner cartridges.',
                        helpText: 'Low supplies are the most common cause of poor print quality.'
                    },
                    {
                        question: 'Have you run a print head cleaning cycle recently?',
                        yesStep: 2,
                        noAction: 'Run a print head cleaning cycle from your printer\'s maintenance menu.',
                        helpText: 'Clogged nozzles can cause streaks or missing colors.'
                    },
                    {
                        question: 'Have you run a print head alignment?',
                        yesStep: 3,
                        noAction: 'Run a print head alignment from the printer\'s maintenance menu.',
                        helpText: 'Misaligned print heads can cause blurry or offset printing.'
                    },
                    {
                        question: 'Are you using high-quality paper appropriate for your printer type?',
                        yesStep: 4,
                        noAction: 'Use paper recommended for your printer type (inkjet/laser) and the specific print job.',
                        helpText: 'Paper quality significantly affects the final print result.'
                    },
                    {
                        question: 'Are you using the correct print quality settings in your print dialog?',
                        yesStep: 5,
                        noAction: 'Select higher quality settings in your print dialog for better output.',
                        helpText: 'Draft or fast print modes sacrifice quality for speed.'
                    },
                    {
                        question: 'Have you updated your printer drivers recently?',
                        yesStep: 6,
                        noAction: 'Download and install the latest printer drivers from the manufacturer\'s website.',
                        helpText: 'Outdated drivers can cause various print quality issues.'
                    },
                    {
                        question: 'Have you checked for firmware updates for your printer?',
                        yesStep: 7,
                        noAction: 'Update your printer\'s firmware from the manufacturer\'s website.',
                        helpText: 'Firmware updates can resolve print quality issues.'
                    },
                    {
                        question: 'Are you using genuine ink or toner cartridges?',
                        yesStep: 8,
                        noAction: 'Switch to manufacturer-recommended cartridges for best results.',
                        helpText: 'Third-party cartridges may not perform as well.'
                    },
                    {
                        question: 'Have you checked for clogged or dirty nozzles?',
                        yesStep: -1,
                        noAction: 'Clean the nozzles using the printer\'s maintenance menu or manually if needed.',
                        helpText: 'Dirty nozzles can cause streaks or missing colors.',
                        solution: 'You have verified all common factors affecting print quality. For persistent issues, consider servicing your printer or replacing worn components.'
                    }
                ],
                solutions: [
                    {
                        title: 'Run Print Head Alignment',
                        description: 'Misaligned print heads can cause poor quality prints.',
                        steps: [
                            'Access printer maintenance menu',
                            'Select "Align Print Heads" option',
                            'Follow on-screen instructions',
                            'Print a test page to verify improvement',
                            'Repeat alignment if necessary',
                            'Check for error messages during alignment',
                            'Consult the manual for alignment tips',
                            'Replace print head if alignment fails',
                            'Contact support if issue persists'
                        ]
                    },
                    {
                        title: 'Check Ink/Toner Levels',
                        description: 'Low supplies can cause faded or streaky prints.',
                        steps: [
                            'Check ink or toner levels through printer software',
                            'Replace low cartridges',
                            'After replacement, run cleaning cycle',
                            'Print test page to verify improvement',
                            'Check for leaks or spills in the cartridge area',
                            'Use only recommended cartridges',
                            'Store cartridges in a cool, dry place',
                            'Check expiration date on cartridges',
                            'Dispose of empty cartridges properly'
                        ]
                    },
                    {
                        title: 'Update Printer Drivers',
                        description: 'Outdated drivers can cause print quality issues.',
                        steps: [
                            'Visit manufacturer website',
                            'Download latest drivers for your printer model',
                            'Install updated drivers',
                            'Restart computer and printer',
                            'Check for firmware updates',
                            'Uninstall old drivers if needed',
                            'Test print after updating drivers',
                            'Consult support if driver update fails',
                            'Keep drivers up to date regularly'
                        ]
                    }
                ]
            }
        ];
        
        // If we have a specific damage description, try to match it
        if (damageLower) {
            if (damageLower.includes('ink') || damageLower.includes('smudge') || damageLower.includes('smear')) {
                const steps = commonIssues.find(issue => issue.id === 'ink_smudging')?.solutions || [];
                return {
                    title: "Ink System Troubleshooting",
                    steps: steps.map(solution => ({
                        title: solution.title,
                        description: solution.description,
                        instructions: solution.steps.join('\n'),
                        expectedResult: "Print quality should improve after these steps."
                    })),
                    possibleIssues: [
                        "Clogged print nozzles",
                        "Low quality ink cartridges",
                        "Incompatible paper type",
                        "Excessive ink application",
                        "Humidity affecting ink drying"
                    ]
                };
            } else if (damageLower.includes('jam') || damageLower.includes('feed') || damageLower.includes('paper')) {
                const steps = commonIssues.find(issue => issue.id === 'paper_jam')?.solutions || [];
                return {
                    title: "Paper Feed Troubleshooting",
                    steps: steps.map(solution => ({
                        title: solution.title,
                        description: solution.description,
                        instructions: solution.steps.join('\n'),
                        expectedResult: "Paper should feed properly after these steps."
                    })),
                    possibleIssues: [
                        "Paper dust accumulation",
                        "Worn feed rollers",
                        "Damaged paper tray",
                        "Foreign objects in paper path",
                        "Incompatible paper weight or texture"
                    ]
                };
            } else if (damageLower.includes('noise') || damageLower.includes('sound') || damageLower.includes('loud')) {
                const steps = commonIssues.find(issue => issue.id === 'strange_noises')?.solutions || [];
                return {
                    title: "Printer Noise Troubleshooting",
                    steps: steps.map(solution => ({
                        title: solution.title,
                        description: solution.description,
                        instructions: solution.steps.join('\n'),
                        expectedResult: "Printer should operate more quietly after these steps."
                    })),
                    possibleIssues: [
                        "Foreign objects in printer mechanism",
                        "Worn or damaged gears",
                        "Loose belts or pulleys",
                        "Damaged carriage assembly",
                        "Aging mechanical components"
                    ]
                };
            } else if (damageLower.includes('quality') || damageLower.includes('faded') || damageLower.includes('streak')) {
                const steps = commonIssues.find(issue => issue.id === 'poor_quality')?.solutions || [];
                return {
                    title: "Print Quality Troubleshooting",
                    steps: steps.map(solution => ({
                        title: solution.title,
                        description: solution.description,
                        instructions: solution.steps.join('\n'),
                        expectedResult: "Print quality should improve after these steps."
                    })),
                    possibleIssues: [
                        "Clogged print nozzles",
                        "Misaligned print heads",
                        "Low ink or toner",
                        "Outdated printer drivers",
                        "Incorrect print settings"
                    ]
                };
            }
        }
        
        // For repairable items or if no specific match, return the full issue list
        return {
            title: "Printer Repair Solutions",
            issues: commonIssues
        };
    };

    // Handler to view solution
    const handleViewSolution = (item) => {
        let solutionData;
        
        if (item.condition === 'repairable') {
            // For repairable items, show the issues and solutions interface
            const itemNameLower = item.item_name.toLowerCase();
            
            // Check if it's a printer-related item
            if (itemNameLower.includes('printer') || 
                itemNameLower.includes('scanner') || 
                itemNameLower.includes('copier') || 
                itemNameLower.includes('mfp')) {
                solutionData = getPrinterSolution();
            } else {
                // Generic repairable solution for non-printer items
                solutionData = {
                    title: `Repair Solutions for ${item.item_name}`,
                    issues: [
                        {
                            id: 'power_issues',
                            title: 'Power or Startup Issues',
                            keywords: ['power', 'startup', 'boot', 'on', 'off', 'dead'],
                            guidedTroubleshooting: [
                                {
                                    question: 'Is the device properly connected to power?',
                                    yesStep: 1,
                                    noAction: 'Connect the device to a power source securely.',
                                    helpText: 'Ensure the power cable is firmly connected to both the device and the power outlet.'
                                },
                                {
                                    question: 'Is the power outlet working?',
                                    yesStep: 2,
                                    noAction: 'Try a different power outlet or check if the current outlet needs to be reset.',
                                    helpText: 'Test the outlet with another device to confirm it\'s working.'
                                },
                                {
                                    question: 'Is the power button working properly?',
                                    yesStep: 3,
                                    noAction: 'Check if the power button is stuck or damaged.',
                                    helpText: 'Try pressing the power button firmly and holding it for a few seconds.'
                                },
                                {
                                    question: 'Have you tried a power cycle (turning off, unplugging, waiting, plugging back in)?',
                                    yesStep: -1,
                                    noAction: 'Perform a complete power cycle: Turn off the device, unplug from power, wait 60 seconds, plug back in, turn on.',
                                    helpText: 'This can reset internal electronics and clear temporary issues.',
                                    solution: 'You\'ve checked all common power-related issues. If the device still won\'t power on, it may require internal repair or component replacement.'
                                }
                            ],
                            solutions: [
                                {
                                    title: 'Check Power Connection',
                                    description: 'Ensure the device is properly connected to power.',
                                    steps: [
                                        'Verify power cable is securely connected',
                                        'Try a different power outlet',
                                        'Check if power indicator lights are on',
                                        'Ensure power switch is in the ON position'
                                    ]
                                },
                                {
                                    title: 'Perform Power Cycle',
                                    description: 'A complete power reset can resolve many electronic issues.',
                                    steps: [
                                        'Turn off the device',
                                        'Unplug from power source',
                                        'Wait 60 seconds',
                                        'Reconnect power and turn on'
                                    ]
                                }
                            ]
                        },
                        {
                            id: 'physical_damage',
                            title: 'Physical Damage',
                            keywords: ['broken', 'cracked', 'damaged', 'dented', 'scratched'],
                            guidedTroubleshooting: [
                                {
                                    question: 'Is the damage purely cosmetic (not affecting functionality)?',
                                    yesStep: -1,
                                    noAction: 'For cosmetic damage, consider using appropriate repair kits or protective covers.',
                                    helpText: 'Cosmetic damage usually doesn\'t require functional repair unless it affects usage.',
                                    solution: 'If the damage is purely cosmetic and doesn\'t affect functionality, the device can continue to be used normally.'
                                },
                                {
                                    question: 'Does the damage affect critical components?',
                                    yesStep: 1,
                                    noAction: 'Identify which components are damaged and assess if they need replacement.',
                                    helpText: 'Critical components might include screens, buttons, or internal hardware.'
                                },
                                {
                                    question: 'Are there loose parts that can be reattached?',
                                    yesStep: 2,
                                    noAction: 'Carefully secure loose parts if possible, using appropriate adhesives or fasteners.',
                                    helpText: 'Sometimes simple reattachment can restore functionality.'
                                },
                                {
                                    question: 'Is the device still under warranty?',
                                    yesStep: -1,
                                    noAction: 'Contact the manufacturer for warranty service instead of attempting repairs yourself.',
                                    helpText: 'Self-repair might void your warranty.',
                                    solution: 'For significant physical damage affecting functionality, professional repair is recommended. Contact the manufacturer or an authorized service center.'
                                }
                            ],
                            solutions: [
                                {
                                    title: 'Assess Damage Severity',
                                    description: 'Determine if the damage can be repaired or needs replacement parts.',
                                    steps: [
                                        'Inspect for cracked components',
                                        'Check for loose parts',
                                        'Test basic functionality',
                                        'Document damage for repair service'
                                    ]
                                }
                            ]
                        },
                        {
                            id: 'general_maintenance',
                            title: 'General Maintenance',
                            keywords: ['maintenance', 'clean', 'update', 'slow', 'performance'],
                            guidedTroubleshooting: [
                                {
                                    question: 'Is the device regularly cleaned?',
                                    yesStep: 1,
                                    noAction: 'Perform general cleaning following the manufacturer\'s guidelines.',
                                    helpText: 'Dust and debris can cause performance issues over time.'
                                },
                                {
                                    question: 'Is the device\'s software/firmware up to date?',
                                    yesStep: 2,
                                    noAction: 'Check for and install any available software or firmware updates.',
                                    helpText: 'Updates often include performance improvements and bug fixes.'
                                },
                                {
                                    question: 'Has the device been restarted recently?',
                                    yesStep: 3,
                                    noAction: 'Restart the device to clear temporary issues and refresh system resources.',
                                    helpText: 'Regular restarts help maintain optimal performance.'
                                },
                                {
                                    question: 'Are you following the manufacturer\'s maintenance schedule?',
                                    yesStep: -1,
                                    noAction: 'Review the user manual for recommended maintenance intervals and procedures.',
                                    helpText: 'Most devices have specific maintenance recommendations.',
                                    solution: 'You\'re following good maintenance practices. Regular cleaning, updates, and following the manufacturer\'s guidelines will help extend the life of your device.'
                                }
                            ],
                            solutions: [
                                {
                                    title: 'Clean the Device',
                                    description: 'Dust and debris can cause operational issues.',
                                    steps: [
                                        'Power off and unplug the device',
                                        'Use compressed air to remove dust',
                                        'Clean exterior with slightly damp cloth',
                                        'Allow to dry completely before use'
                                    ]
                                },
                                {
                                    title: 'Update Software/Firmware',
                                    description: 'Outdated software can cause compatibility issues.',
                                    steps: [
                                        'Check manufacturer website for updates',
                                        'Download latest software/firmware',
                                        'Follow installation instructions',
                                        'Restart device after update'
                                    ]
                                }
                            ]
                        }
                    ]
                };
            }
        } else if (item.condition === 'damaged') {
            // For damaged items, use the existing troubleshooting flow
            // Check if it's a printer based on damage keywords
        const potentialPrinterDamages = ['power', 'ink', 'smudge', 'smear', 'paper jam', 'toner', 'print quality'];
        const isPotentialPrinter = potentialPrinterDamages.some(keyword => 
            item.damage && item.damage.toLowerCase().includes(keyword)
        );

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
        }

        setSolutionItem(item);
        
        // Initialize filteredIssues with all issues
        if (solutionData.issues && solutionData.issues.length > 0) {
            setFilteredIssues(solutionData.issues);
            
            // Set initial guided troubleshooting steps if available
            if (solutionData.issues[0].guidedTroubleshooting) {
                setGuidedSteps(solutionData.issues[0].guidedTroubleshooting);
                setCurrentGuidedStep(0);
            }
            
            // Set the first issue's solutions as initial steps
            setSolutionSteps(solutionData.issues[0].solutions);
        } else if (solutionData.steps) {
        setSolutionSteps(solutionData.steps);
        } else {
            setSolutionSteps([]);
        }
        
        // Reset all states
        setIssueSearchTerm('');
        setCurrentSolutionStep(0);
        setSelectedIssue(solutionData.issues?.[0] || null);
        setRecommendedAction('');
        setSolutionContent(solutionData);
        setShowAllPossibleIssues(false);
        setIssueSolved(false);
        setIsSolutionModalOpen(true);
    };

    // Handle issue search
    const handleIssueSearch = (searchValue) => {
        setIssueSearchTerm(searchValue);
        if (!solutionContent.issues) return;
        
        if (searchValue.trim() === '') {
            setFilteredIssues(solutionContent.issues);
        } else {
            const filtered = solutionContent.issues.filter(issue => 
                issue.title.toLowerCase().includes(searchValue.toLowerCase()) ||
                issue.keywords?.some(keyword => keyword.toLowerCase().includes(searchValue.toLowerCase()))
            );
            setFilteredIssues(filtered);
        }
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
                                            View and analyze returned items
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
                                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white dark:bg-gray-700 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:text-gray-100"
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
                                            className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
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
                                            className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
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
                                                className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                            <span className="text-gray-500">to</span>
                                            <input
                                                type="date"
                                                value={dateRange.end}
                                                onChange={(e) => handleDateRangeChange('end', e.target.value)}
                                                className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
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
                                    <thead className="bg-blue-500">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Item</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Description</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Person Name</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Office</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Quantity</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Return Date</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Condition</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Damage</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Property No.</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Purchased Date</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Amount</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Unit of Measures</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        {paginatedData.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{item.item_name || (item.item && item.item.items) || 'N/A'}</td>
                                                <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">{item.description || 'N/A'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{item.person_name || 'N/A'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{item.office_name || 'N/A'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{item.quantity_returned || 'N/A'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{item.return_date || 'N/A'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 capitalize">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                        item.condition === 'good' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                                        item.condition === 'damaged' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                                        item.condition === 'repairable' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                                        'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                                                    }`}>
                                                        {item.condition || 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">{item.damage || 'N/A'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{item.property_no || 'N/A'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{item.purchased_date || 'N/A'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{item.amount || 'N/A'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{item.unit_of_measures || 'N/A'}</td>
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
                                className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
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
                                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-blue-500 focus:border-blue-500 dark:text-gray-100 dark:placeholder-gray-400"
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
                                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-blue-500 focus:border-blue-500 dark:text-gray-100 dark:placeholder-gray-400"
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
                                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-blue-500 focus:border-blue-500 dark:text-gray-100 dark:placeholder-gray-400"
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
                                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-blue-500 focus:border-blue-500 dark:text-gray-100 dark:placeholder-gray-400"
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
                                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-blue-500 focus:border-blue-500 dark:text-gray-100 dark:placeholder-gray-400"
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
                                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-blue-500 focus:border-blue-500 dark:text-gray-100 dark:placeholder-gray-400"
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
                                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-blue-500 focus:border-blue-500 dark:text-gray-100 dark:placeholder-gray-400"
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
                                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-blue-500 focus:border-blue-500 dark:text-gray-100 dark:placeholder-gray-400"
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
                                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-blue-500 focus:border-blue-500 dark:text-gray-100 dark:placeholder-gray-400"
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
                                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-blue-500 focus:border-blue-500 dark:text-gray-100 dark:placeholder-gray-400"
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
                                        onChange={e => {
                                            const newCondition = e.target.value;
                                            setData(prevData => ({
                                                ...prevData,
                                                condition: newCondition,
                                                damage: newCondition !== 'damaged' ? '' : prevData.damage
                                            }));
                                        }}
                                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-blue-500 focus:border-blue-500 dark:text-gray-100 dark:placeholder-gray-400"
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
                                {data.condition === 'damaged' && (
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Damage
                                        </label>
                                        <input
                                            type="text"
                                            value={data.damage}
                                            onChange={e => setData('damage', e.target.value)}
                                            className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-blue-500 focus:border-blue-500 dark:text-gray-100 dark:placeholder-gray-400"
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
                                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-blue-500 focus:border-blue-500 dark:text-gray-100 dark:placeholder-gray-400"
                                        placeholder="Enter name of person returning"
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
                                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-blue-500 focus:border-blue-500 dark:text-gray-100 dark:placeholder-gray-400"
                                        placeholder="Enter office name"
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
                                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-blue-500 focus:border-blue-500 dark:text-gray-100 dark:placeholder-gray-400"
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
                                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-blue-500 focus:border-blue-500 dark:text-gray-100 dark:placeholder-gray-400"
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
                                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-blue-500 focus:border-blue-500 dark:text-gray-100 dark:placeholder-gray-400"
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
                                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-blue-500 focus:border-blue-500 dark:text-gray-100 dark:placeholder-gray-400"
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
                                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-blue-500 focus:border-blue-500 dark:text-gray-100 dark:placeholder-gray-400"
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
                                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-blue-500 focus:border-blue-500 dark:text-gray-100 dark:placeholder-gray-400"
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
                                        onChange={e => {
                                            const newCondition = e.target.value;
                                            setEditData(prevData => ({
                                                ...prevData,
                                                condition: newCondition,
                                                damage: newCondition !== 'damaged' ? '' : prevData.damage
                                            }));
                                        }}
                                        className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-blue-500 focus:border-blue-500 dark:text-gray-100 dark:placeholder-gray-400"
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
                                {editData.condition === 'damaged' && (
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Damage
                                        </label>
                                        <input
                                            type="text"
                                            value={editData.damage}
                                            onChange={e => setEditData('damage', e.target.value)}
                                            className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-blue-500 focus:border-blue-500 dark:text-gray-100 dark:placeholder-gray-400"
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
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-5xl w-full p-6 max-h-[90vh] flex flex-col transition-all duration-300 ease-in-out">
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
                                        {solutionContent.title} - {solutionItem?.item_name}
                                    </>
                                )}
                            </h3>
                            <button
                                onClick={() => {
                                    setIsSolutionModalOpen(false);
                                    setIssueSolved(false);
                                }}
                                className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
                            >
                                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {issueSolved ? (
                            <div className="mb-4 text-center">
                                <div className="flex justify-center mb-6">
                                    <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/30">
                                        <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                        </svg>
                                    </div>
                                </div>
                                <h4 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-4">Great! The issue has been resolved.</h4>
                                    <div className="border-t border-b border-gray-200 dark:border-gray-700 py-5 w-full my-4">
                                        <h5 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Problem solved by:</h5>
                                    {recommendedAction ? (
                                        <p className="text-gray-700 dark:text-gray-300">{recommendedAction}</p>
                                    ) : (
                                        <>
                                        <p className="text-gray-700 dark:text-gray-300">
                                            {solutionSteps[currentSolutionStep]?.title}
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                            {solutionSteps[currentSolutionStep]?.description}
                                        </p>
                                        </>
                                    )}
                                    </div>
                                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                                        You can now close this window and continue.
                                    </p>
                            </div>
                        ) : solutionItem?.condition === 'repairable' && solutionContent?.issues ? (
                            <div className="flex flex-col md:flex-row gap-6 overflow-auto">
                                {/* Left column: Operational Issues */}
                                <div className="md:w-1/2 border-r dark:border-gray-700 pr-6">
                                    <h4 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
                                        Operational Issues
                                    </h4>
                                    
                                    {/* Search bar for issues */}
                                    <div className="relative mb-4">
                                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                            <Search className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500 dark:text-white"
                                            placeholder="Type an issue..."
                                            value={issueSearchTerm}
                                            onChange={(e) => handleIssueSearch(e.target.value)}
                                        />
                                    </div>
                                    
                                    <div className="space-y-2">
                                        {filteredIssues.length > 0 ? (
                                            filteredIssues.map((issue) => (
                                                <button
                                                    key={issue.id}
                                                    onClick={() => {
                                                        setSelectedIssue(issue);
                                                        setSolutionSteps(issue.solutions);
                                                        if (issue.guidedTroubleshooting) {
                                                            setGuidedSteps(issue.guidedTroubleshooting);
                                                            setCurrentGuidedStep(0);
                                                            setRecommendedAction('');
                                                        }
                                                        setCurrentSolutionStep(0);
                                                    }}
                                                    className={`text-left w-full p-3 rounded-lg transition-colors duration-200 ${
                                                        selectedIssue?.id === issue.id
                                                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                                            : 'bg-gray-100 dark:bg-gray-700/50 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700'
                                                    }`}
                                                >
                                                    {issue.title}
                                                </button>
                                            ))
                                        ) : (
                                            <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                                                No matching issues found
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Right column: Suggested Solutions */}
                                <div className="md:w-1/2">
                                    <h4 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200 flex items-center gap-2">
                                        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        {selectedIssue?.title || 'Suggested Solutions'}
                                    </h4>
                                    {selectedIssue?.description && (
                                        <p className="mb-4 text-gray-600 dark:text-gray-400 text-sm">{selectedIssue.description}</p>
                                    )}
                                    {/* Toggle to show all steps */}
                                    {solutionSteps && solutionSteps.length > 1 && (
                                        <div className="mb-4 flex items-center gap-2">
                                            <input
                                                id="showAllSteps"
                                                type="checkbox"
                                                checked={showAllPossibleIssues}
                                                onChange={() => setShowAllPossibleIssues(!showAllPossibleIssues)}
                                                className="form-checkbox h-4 w-4 text-blue-600 transition duration-150 ease-in-out"
                                            />
                                            <label htmlFor="showAllSteps" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">Show all steps</label>
                                        </div>
                                    )}
                                    {/* Progress bar */}
                                    {!showAllPossibleIssues && solutionSteps && solutionSteps.length > 1 && (
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
                                    )}
                                    {/* Step-by-step cards or all steps */}
                                    {showAllPossibleIssues ? (
                                        <div className="space-y-4">
                                            {solutionSteps.map((step, idx) => (
                                                <div key={idx} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="flex items-center justify-center bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 w-7 h-7 rounded-full text-sm font-bold">{idx + 1}</span>
                                                        <span className="font-semibold text-gray-900 dark:text-gray-100">{step.title}</span>
                                                    </div>
                                                    <p className="text-gray-700 dark:text-gray-300 mb-2">{step.description}</p>
                                                    {step.steps && (
                                                        <ul className="list-decimal ml-6 mb-2 text-gray-700 dark:text-gray-300 text-sm">
                                                            {step.steps.map((s, i) => <li key={i}>{s}</li>)}
                                                        </ul>
                                                    )}
                                                    {step.instructions && (
                                                        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded mb-2 text-sm">
                                                            <span className="font-medium text-gray-800 dark:text-gray-200">Instructions:</span>
                                                            <div className="whitespace-pre-line">{step.instructions}</div>
                                                        </div>
                                                    )}
                                                    {step.expectedResult && (
                                                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded text-blue-800 dark:text-blue-200 text-sm flex items-center gap-2">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                                            <span><b>Expected Result:</b> {step.expectedResult}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-5 mb-5 shadow-sm">
                                            <div className="flex items-center gap-2 mb-3">
                                                <span className="flex items-center justify-center bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 w-7 h-7 rounded-full text-sm font-bold">{currentSolutionStep + 1}</span>
                                                <span className="font-semibold text-gray-900 dark:text-gray-100">{solutionSteps[currentSolutionStep]?.title}</span>
                                            </div>
                                            <p className="text-gray-700 dark:text-gray-300 mb-2">{solutionSteps[currentSolutionStep]?.description}</p>
                                            {solutionSteps[currentSolutionStep]?.steps && (
                                                <ul className="list-decimal ml-6 mb-2 text-gray-700 dark:text-gray-300 text-sm">
                                                    {solutionSteps[currentSolutionStep]?.steps.map((s, i) => <li key={i}>{s}</li>)}
                                                </ul>
                                            )}
                                            {solutionSteps[currentSolutionStep]?.instructions && (
                                                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded mb-2 text-sm">
                                                    <span className="font-medium text-gray-800 dark:text-gray-200">Instructions:</span>
                                                    <div className="whitespace-pre-line">{solutionSteps[currentSolutionStep]?.instructions}</div>
                                                </div>
                                            )}
                                            {solutionSteps[currentSolutionStep]?.expectedResult && (
                                                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded text-blue-800 dark:text-blue-200 text-sm flex items-center gap-2">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                                    <span><b>Expected Result:</b> {solutionSteps[currentSolutionStep]?.expectedResult}</span>
                                                </div>
                                            )}
                                            {/* Navigation and action buttons */}
                                            <div className="flex justify-between mt-6">
                                                <button
                                                    onClick={() => {
                                                        if (currentSolutionStep > 0) setCurrentSolutionStep(currentSolutionStep - 1);
                                                    }}
                                                    disabled={currentSolutionStep === 0}
                                                    className={`px-4 py-2 rounded-md flex items-center ${currentSolutionStep === 0 ? 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500' : 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors duration-200'}`}
                                                >
                                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                                                    Previous
                                                </button>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => setIssueSolved(true)}
                                                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600"
                                                    >
                                                        This worked
                                                    </button>
                                                    {currentSolutionStep < solutionSteps.length - 1 && (
                                                        <button
                                                            onClick={() => setCurrentSolutionStep(currentSolutionStep + 1)}
                                                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
                                                        >
                                                            Next
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
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
                                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                                    <h5 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">Did this step solve your issue?</h5>
                                    <div className="flex flex-wrap gap-3">
                                        <button
                                            onClick={() => setIssueSolved(true)}
                                            className="px-5 py-2.5 bg-green-600 text-white rounded-md hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 transition-colors duration-200 flex items-center shadow-sm"
                                        >
                                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                            </svg>
                                            Yes, this solved it!
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