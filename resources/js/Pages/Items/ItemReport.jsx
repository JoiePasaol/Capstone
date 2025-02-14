import { Head } from "@inertiajs/react";
import { useState, useMemo } from "react";
import { useEffect } from "react";
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
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [showPicker, setShowPicker] = useState(false);
    const [filteredItems, setFilteredItems] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [selectedYear, setSelectedYear] = useState("");
    const [years, setYears] = useState([]);

    const fetchData = async (start, end) => {
        if (!start) return;

        try {
            const startDateFormatted = format(start, "yyyy-MM-dd");
            const endDateFormatted = end ? format(end, "yyyy-MM-dd") : startDateFormatted;

            const response = await axios.get("/items-report", {
                params: {
                    start_date: startDateFormatted,
                    end_date: endDateFormatted,
                },
            });

            setFilteredItems(response.data);
            setCurrentPage(1);
        } catch (error) {
            console.error(
                "Error fetching data:",
                error.response?.data || error.message
            );
        }
    };

    useEffect(() => {
        const currentYear = new Date().getFullYear();
        const yearsList = Array.from(
            { length: currentYear - 2000 + 1 },
            (_, i) => i + 2000
        );
        setYears(yearsList);
    }, []);

    const handleYearChange = (e) => {
        setSelectedYear(e.target.value);
        const start = new Date(`${e.target.value}-01-01`);
        const end = new Date(`${e.target.value}-12-31`);
        fetchData(start, end);
    };

    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

    const paginatedItems = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredItems.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredItems, currentPage]);

    const headers = [
        { label: "Item", key: "item" },
        { label: "Description", key: "description" },
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

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="px-6 py-4  overflow-visible bg-white ring-1 ring-black/20 sm:rounded-lg dark:bg-gray-800">
                        <div className=" text-gray-900 dark:text-gray-100">
                            {/* Date Range Picker */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <select
                                        value={selectedYear}
                                        onChange={handleYearChange}
                                        className="border border-black/20 dark:border-white py-1 rounded-md  text-gray-700 dark:text-gray-500 bg-transparent cursor-pointer w-60"
                                    >
                                        <option
                                            hidden
                                            className="dark:bg-gray-800 dark:text-gray-300"
                                            value=""
                                        >
                                            Select year
                                        </option>
                                        {years.map((year) => (
                                            <option
                                                className="dark:bg-gray-800 dark:text-gray-300"
                                                key={year}
                                                value={year}
                                            >
                                                {year}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="relative z-50">
                                        <select
                                            value={
                                                startDate && endDate
                                                    ? `${format(
                                                          startDate,
                                                          "MM/dd/yyyy"
                                                      )} - ${format(
                                                          endDate,
                                                          "MM/dd/yyyy"
                                                      )}`
                                                    : ""
                                            }
                                            onClick={() =>
                                                setShowPicker(!showPicker)
                                            }
                                            className="border border-black/20 dark:border-white py-1 rounded-md text-gray-700 dark:text-gray-500 bg-transparent cursor-pointer w-60"
                                        >
                                            {" "}
                                            <option hidden value="">
                                                Select date range
                                            </option>
                                        </select>
                                        {showPicker && (
                                            <div className="absolute z-50">
                                                <DatePicker
                                                    selectsRange
                                                    startDate={startDate}
                                                    endDate={endDate}
                                                    onChange={(dates) => {
                                                        const [start, end] =
                                                            dates;
                                                        setStartDate(start);
                                                        setEndDate(end);
                                                        if (start && !end) {
                                                            fetchData(
                                                                start,
                                                                start
                                                            );
                                                        } else if (
                                                            start &&
                                                            end
                                                        ) {
                                                            fetchData(
                                                                start,
                                                                end
                                                            );
                                                        }
                                                    }}
                                                    onCalendarClose={() => {
                                                        if (
                                                            startDate &&
                                                            !endDate
                                                        ) {
                                                            setEndDate(
                                                                startDate
                                                            );
                                                            fetchData(
                                                                startDate,
                                                                startDate
                                                            );
                                                        }
                                                    }}
                                                    inline
                                                    calendarClassName="dark:bg-gray-800 pb-7"
                                                />
                                                <button
                                                    onClick={() => {
                                                        setStartDate(null);
                                                        setEndDate(null);
                                                        setFilteredItems([]);
                                                    }}
                                                    className="absolute bottom-4 right-2 px-3 py-1 text-sm bg-[#216ba5] text-white rounded-md shadow-md transition duration-300 hover:bg-blue-500"
                                                >
                                                    Reset Filter
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <TrueButton
                                        className="bg-green-500 hover:bg-green-600 rounded-md py-[5px] active:bg-green-700 dark:active:bg-green-700"
                                        onClick={() =>
                                            handlePrint(
                                                startDate,
                                                endDate,
                                                filteredItems,
                                                totalSum
                                            )
                                        }
                                    >
                                        <PrintIcon className="mr-1 " />
                                        Print
                                    </TrueButton>
                                </div>
                                <div className="flex  dark:bg-gray-900 w-[200px] p-2 rounded-md  border-[1px] border-gray-400 dark:border-gray-400">
                                    <p className="text-lg text-black dark:text-white">
                                        ₱ {totalSum.toFixed(2)}
                                    </p>
                                </div>
                            </div>

                            {/* Table Component */}
                            <Table headers={headers} rows={rows} />

                            {/* Pagination Component (Only show if data exists) */}
                            {filteredItems.length > 0 && (
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={setCurrentPage}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
