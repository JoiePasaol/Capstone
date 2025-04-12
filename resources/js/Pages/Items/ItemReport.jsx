import { Head } from "@inertiajs/react";
import { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import "quill/dist/quill.snow.css";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import axios from "axios";
import Table from "@/Components/Table";
import Pagination from "@/Components/Pagination";
import TrueButton from "@/Components/TrueButton";
import PrintIcon from "@mui/icons-material/Print";
import handlePrint from "@/Utils/PrintReport";

export default function ItemReport() {
    const [showPicker, setShowPicker] = useState(false);
    const [filteredItems, setFilteredItems] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [selectedDepartment, setSelectedDepartment] = useState("");
    const [selectedYear, setSelectedYear] = useState("");
    const [selectedMonth, setSelectedMonth] = useState("");
    const [years, setYears] = useState([]);
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);

    // Fetch data when filters change
    useEffect(() => {
        const fetchData = async () => {
            // Check if any filter is applied
            const hasFilters = selectedDepartment || selectedYear || (startDate && endDate);
            if (!hasFilters) {
                setFilteredItems([]);
                return;
            }

            const params = {};

            if (selectedDepartment) {
                params.department = selectedDepartment;
            }

            let start = null;
            let end = null;

            // Prioritize Year and Month selection over Date Range
            if (selectedYear) {
                if (selectedMonth) {
                    start = new Date(selectedYear, selectedMonth - 1, 1);
                    end = new Date(selectedYear, selectedMonth, 0);
                } else {
                    start = new Date(selectedYear, 0, 1);
                    end = new Date(selectedYear, 11, 31);
                }
                params.start_date = format(start, "yyyy-MM-dd");
                params.end_date = format(end, "yyyy-MM-dd");
            } else if (startDate && endDate) {
                params.start_date = format(startDate, "yyyy-MM-dd");
                params.end_date = format(endDate, "yyyy-MM-dd");
            }

            try {
                const response = await axios.get("/api/items-report", { params });

                // Sort items by created_at in descending order
                const sortedData = response.data.sort((a, b) => 
                    new Date(b.created_at) - new Date(a.created_at)
                );
                
                setFilteredItems(sortedData);
                setCurrentPage(1);
            } catch (error) {
                console.error("Error fetching data:", error);
                setFilteredItems([]);
            }
        };

        fetchData();
    }, [selectedDepartment, selectedYear, selectedMonth, startDate, endDate]);

    // Generate years list
    useEffect(() => {
        const currentYear = new Date().getFullYear();
        const yearsList = Array.from(
            { length: currentYear - 2000 + 1 },
            (_, i) => i + 2000
        );
        setYears(yearsList);
    }, []);

    // Year selection handler
    const handleYearChange = (e) => {
        setSelectedYear(e.target.value || "");
    };

    // Month selection handler
    const handleMonthChange = (e) => {
        setSelectedMonth(e.target.value || "");
    };

    // Department selection handler
    const handleDepartmentChange = (e) => {
        setSelectedDepartment(e.target.value);
    };

    // Reset all filters
    const handleResetFilters = () => {
        setSelectedDepartment("");
        setSelectedYear("");
        setSelectedMonth("");
        setStartDate(null);
        setEndDate(null);
    };

    // Pagination and table rendering
    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    const paginatedItems = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredItems.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredItems, currentPage]);

    const headers = [
        { label: "Item", key: "item" },
        { label: "Description", key: "description" },
        { label: "Life_Span", key: "estimated_life" },
        { label: "Quantity", key: "quantity" },
        { label: "Amount", key: "amount" },
        { label: "Total Amount", key: "totalAmount" },
    ];

    const rows = paginatedItems.map((item, index) => {
        const quantity = Number(item.quantity) || 0;
        const amount = Number(item.amount) || 0;
        const totalAmount = quantity * amount;

        return {
            id: index,
            item: item.item,
            description: (
                <div
                    className="ql-editor ql-snow"
                    dangerouslySetInnerHTML={{ __html: item.description }}
                />
            ),
            estimated_life: item.estimated_life,
            quantity: quantity,
            amount: amount ? `₱ ${amount.toFixed(2)}` : "N/A",
            totalAmount: totalAmount ? `₱ ${totalAmount.toFixed(2)}` : "N/A",
        };
    });

    const totalSum = filteredItems.reduce((sum, item) => {
        const quantity = Number(item.quantity) || 0;
        const amount = Number(item.amount) || 0;
        return sum + quantity * amount;
    }, 0);

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    Item Report
                </h2>
            }
        >
            <Head title="Item Report" />
            <div className="flex justify-end mb-4 mt-4">
                <TrueButton
                    className="bg-green-500 hover:bg-green-600 rounded-sm py-[5px] active:bg-green-700 dark:active:bg-green-700"
                    onClick={() =>
                        handlePrint(
                            startDate,
                            endDate,
                            filteredItems,
                            selectedYear,
                            selectedMonth,
                            selectedDepartment
                        )
                    }
                >
                    <PrintIcon className="mr-1 " />
                    Print
                </TrueButton>
            </div>
            <div className="px-4 py-4 bg-white ring-1 ring-black/10 sm:rounded-lg dark:bg-gray-800/40  relative ">
                <div className=" text-gray-900 dark:text-gray-100 ">
                    <div className="flex items-center justify-between mb-3  flex-wrap gap-2">
                        <div className="flex items-center gap-3">
                            {/* Department Filter */}
                            <select
                                value={selectedDepartment}
                                onChange={handleDepartmentChange}
                                className="border border-black/20 dark:border-white py-1 rounded-sm text-gray-700 dark:text-gray-300 bg-transparent cursor-pointer"
                            >
                                <option className="dark:bg-gray-800 dark:text-gray-300"  value="">Select Deparment</option>
                                {["IT", "HR"].map((department) => (
                                    <option  className="dark:bg-gray-800 dark:text-gray-300" key={department} value={department}>
                                        {department}
                                    </option>
                                ))}
                            </select>

                            {/* Year Filter */}
                            <select
                                value={selectedYear}
                                onChange={handleYearChange}
                                className="border border-black/20 dark:border-white py-1 rounded-sm text-gray-700 dark:text-gray-300 bg-transparent cursor-pointer"
                            >
                                <option className="dark:bg-gray-800 dark:text-gray-300" value="">Filter Year</option>
                                {years.map((year) => (
                                    <option   className="dark:bg-gray-800 dark:text-gray-300" key={year} value={year}>
                                        {year}
                                    </option>
                                ))}
                            </select>

                            {/* Month Filter */}
                            <select
                                value={selectedMonth}
                                onChange={handleMonthChange}
                                className="border border-black/20 dark:border-white py-1 rounded-sm text-gray-700 dark:text-gray-300 bg-transparent cursor-pointer"
                            >
                                <option className="dark:bg-gray-800 dark:text-gray-300" value="">Filter Month</option>
                                {[
                                    "January",
                                    "February",
                                    "March",
                                    "April",
                                    "May",
                                    "June",
                                    "July",
                                    "August",
                                    "September",
                                    "October",
                                    "November",
                                    "December",
                                ].map((month, index) => (
                                    <option   className="dark:bg-gray-800 dark:text-gray-300" key={month} value={index + 1}>
                                        {month}
                                    </option>
                                ))}
                            </select>

                            {/* Date Range Picker */}
                            <div className="relative">
                                <select
                                    onClick={() => setShowPicker(!showPicker)}
                                    className="border border-black/20 dark:border-white py-1 rounded-sm text-gray-700 dark:text-gray-300 bg-transparent cursor-pointer w-60"
                                >
                                    <option hidden value="">
                                        {startDate && endDate
                                            ? `${format(
                                                  startDate,
                                                  "MM/dd/yyyy"
                                              )} - ${format(
                                                  endDate,
                                                  "MM/dd/yyyy"
                                              )}`
                                            : "Filter Date Range"}
                                    </option>
                                </select>
                                {showPicker && (
                                    <div className="absolute z-50 top-10 right-0">
                                        <DatePicker
                                            selectsRange
                                            startDate={startDate}
                                            endDate={endDate}
                                            onChange={([start, end]) => {
                                                setStartDate(start);
                                                setEndDate(end);
                                            }}
                                            inline
                                            calendarClassName="dark:bg-gray-800 pb-7"
                                        />
                                        <button
                                            onClick={handleResetFilters}
                                            className="absolute bottom-4 right-2 px-3 py-1 text-sm bg-[#216ba5] text-white rounded-md shadow-md transition duration-300 hover:bg-blue-500"
                                        >
                                            Reset All
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                        {/* Total Sum Display */}
                        <div className="flex dark:bg-gray-900 w-[200px] min-w-[200px] p-2 rounded-sm  border-[1px] border-gray-400 dark:border-gray-400">
                            <p className="text-lg text-black dark:text-white">
                                ₱ {totalSum.toFixed(2)}
                            </p>
                        </div>
                    </div>

                    {/* Table */}
                    <Table headers={headers} rows={rows} />

                    {/* Pagination */}
                    {filteredItems.length > 0 && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}