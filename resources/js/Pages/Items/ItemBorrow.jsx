import { useState, useEffect, useMemo } from "react";
import { Head, useForm, usePage } from "@inertiajs/react";
import { format, parseISO, isValid } from "date-fns";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import Drawer from "@/Components/Drawer";
import InputLabel from "@/Components/InputLabel";
import InputError from "@/Components/InputError";
import TextInput from "@/Components/TextInput";
import SecondaryButton from "@/Components/SecondaryButton";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import SelectOption from "@/Components/SelectOption";
import Table from "@/Components/Table";
import Checkbox from "@/Components/Checkbox";
import Dropdown from "@/Components/Dropdown";
import SettingsIcon from "@mui/icons-material/Settings";
import SuccessDialog from "@/Components/SuccessDialog";
import Pagination from "@/Components/Pagination";
import ConfirmationDialog from "@/Components/ConfirmationDialog";
import TrueButton from "@/Components/TrueButton";
import "../../../css/select.css";
import axios from "axios";

export default function ItemBorrow() {
    const { csrf, auth } = usePage().props;
    const { user } = auth;

    // Drawer state
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [showPicker, setShowPicker] = useState(false);
    const [showPickerBorrowed, setShowPickerBorrowed] = useState(false);

    // Dialog state
    const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [confirmMessage, setConfirmMessage] = useState("");
    const [processing, setProcessing] = useState(false);

    // Data state
    const [borrowedItems, setBorrowedItems] = useState([]);
    const [options, setOptions] = useState([]);
    const [selectedOptions, setSelectedOptions] = useState([]);
    const [selectedStatus, setSelectedStatus] = useState(null);
    const [years, setYears] = useState([]);
    const [selectedYear, setSelectedYear] = useState("");
    const [borrowedDate, setBorrowedDate] = useState(null);
    const [returnDate, setReturnDate] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedBorrowedItems, setSelectedBorrowedItems] = useState([]);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [statusFilter, setStatusFilter] = useState("All");
    const [availableQuantity, setAvailableQuantity] = useState(0);
    const [selectedQuantity, setSelectedQuantity] = useState(1);
    const [isBulkDelete, setIsBulkDelete] = useState(false);

    const itemsPerPage = 10;

    const { post, data, setData, errors, reset } = useForm({
        name: "",
        item_ids: [],
        item_names: [],
        borrowed_date: "",
        return_date: "",
        status: "Borrowed",
        quantity: 1,
    });

    const [formErrors, setFormErrors] = useState({
        name: null,
        items: null,
        item_ids: null,
        quantity: null,
        borrowed_date: null,
        return_date: null,
        status: null,
    });

    const ItemList = ({ items }) => {
        const chunkSize = 3;
        const chunks = [];

        for (let i = 0; i < items.length; i += chunkSize) {
            chunks.push(items.slice(i, i + chunkSize));
        }

        return (
            <div className="flex flex-col gap-1">
                {chunks.map((chunk, index) => (
                    <div key={index} className="flex gap-2">
                        {chunk.map((item, itemIndex) => (
                            <span key={itemIndex}>
                                {item}
                                {itemIndex < chunk.length - 1 ? ", " : ""}
                            </span>
                        ))}
                    </div>
                ))}
            </div>
        );
    };

    const [showDateRangePicker, setShowDateRangePicker] = useState(false);
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);

    useEffect(() => {
        const currentYear = new Date().getFullYear();
        const yearsList = Array.from(
            { length: currentYear - 2000 + 1 },
            (_, i) => currentYear - i
        );
        setYears(yearsList);
    }, []);

    const filteredBorrowedItems = useMemo(() => {
        if (!Array.isArray(borrowedItems)) return [];
    
        const today = new Date();
        const searchLower = searchTerm.toLowerCase();
    
        // Process and filter items
        const result = borrowedItems
            .map((item) => {
                // Handle status (including overdue calculation)
                const isOverdue =
                    item.status === "Borrowed" &&
                    new Date(item.return_date) < today;
                const status = isOverdue ? "Overdue" : item.status;
    
                // Parse item names
                const itemNames = Array.isArray(item.item_names)
                    ? item.item_names
                    : typeof item.item_names === "string"
                    ? JSON.parse(item.item_names)
                    : [];
    
                // Get the dates for filtering
                const createdAt = item.created_at
                    ? new Date(item.created_at)
                    : null;
                const createdYear = createdAt ? createdAt.getFullYear() : null;
    
                return {
                    ...item,
                    status,
                    itemNames,
                    createdYear,
                    createdAt, // This will be used for date range filtering
                };
            })
            .filter((item) => {
                // Filter by search term
                const matchesSearch =
                    item.name.toLowerCase().includes(searchLower) ||
                    item.itemNames.some((name) =>
                        name.toLowerCase().includes(searchLower)
                    );
    
                // Filter by status
                const matchesStatus =
                    statusFilter === "All" || item.status === statusFilter;
    
                // Filter by year
                const matchesYear =
                    !selectedYear ||
                    (item.createdYear &&
                        item.createdYear.toString() === selectedYear);
    
                // Filter by date range - now using createdAt instead of borrowedDate
                const matchesDateRange =
                    !startDate ||
                    !endDate ||
                    (item.createdAt &&
                        item.createdAt >= startDate &&
                        item.createdAt <= endDate);
    
                return (
                    matchesSearch &&
                    matchesStatus &&
                    matchesYear &&
                    matchesDateRange
                );
            })
            .sort((a, b) => {
                // Sort by created_at date (newest first)
                return new Date(b.created_at) - new Date(a.created_at);
            });
    
        return result;
    }, [
        borrowedItems,
        searchTerm,
        statusFilter,
        selectedYear,
        startDate,
        endDate,
    ]);
    
    const fetchBorrowedItems = async () => {
        try {
            const response = await axios.get("/api/borrows");
            if (response.status === 200 && response.data) {
                const sortedItems = response.data.sort(
                    (a, b) => new Date(b.created_at) - new Date(a.created_at)
                );
                setBorrowedItems(sortedItems);
            } else {
                throw new Error("Invalid response format");
            }
        } catch (error) {
            console.error("Error details:", {
                message: error.message,
                response: error.response,
            });
            setSuccessMessage(
                error.response?.data?.message ||
                    "Failed to load borrowed items. Please try again."
            );
            setIsSuccessDialogOpen(true);
        }
    };
    useEffect(() => {
        fetchBorrowedItems();
    }, []);

    const toggleDrawer = async (open, isEdit = false, row = null) => {
        setIsDrawerOpen(open);
        setIsEditMode(isEdit);

        setFormErrors({
            name: null,
            items: null,
            quantity: null,
            borrowedDate: null,
            returnDate: null,
        });

        if (open && isEdit && row) {
            const itemNames = Array.isArray(row.item_names)
                ? row.item_names
                : typeof row.item_names === "string"
                ? JSON.parse(row.item_names)
                : [];

            const itemIds = Array.isArray(row.item_ids)
                ? row.item_ids
                : typeof row.item_ids === "string"
                ? JSON.parse(row.item_ids)
                : [];

            const selectedOpts = itemNames
                .map((name, index) => {
                    const id = itemIds[index];
                    if (!id) return null;
                    return {
                        value: id,
                        label: name,
                    };
                })
                .filter(Boolean);

            setSelectedOptions(selectedOpts);
            setSelectedStatus(row.status);
            setSelectedQuantity(row.quantity);

            // Set form data
            setData({
                id: row.id,
                name: row.name,
                item_ids: itemIds,
                item_names: itemNames,
                borrowed_date: row.borrowed_date || "",
                return_date: row.return_date || "",
                status: row.status,
                quantity: row.quantity,
            });

            // Handle return date
            if (row.return_date) {
                const date = parseISO(row.return_date);
                setReturnDate(isValid(date) ? date : null);
            } else {
                setReturnDate(null);
            }

            // Handle borrowed date - improved parsing logic
            if (row.borrowed_date) {
                console.log("Original borrowed date:", row.borrowed_date);

                // First, try direct parsing with parseISO
                let parsedDate = parseISO(row.borrowed_date);

                // If not valid and it's in YYYY-MM-DD format
                if (
                    !isValid(parsedDate) &&
                    /^\d{4}-\d{2}-\d{2}/.test(row.borrowed_date)
                ) {
                    parsedDate = new Date(row.borrowed_date);
                }

                // If still not valid and it might be MM/DD/YYYY format
                if (!isValid(parsedDate) && row.borrowed_date.includes("/")) {
                    const parts = row.borrowed_date.split("/");
                    if (parts.length === 3) {
                        // Note: months are 0-indexed in JavaScript Date
                        parsedDate = new Date(
                            parts[2],
                            parseInt(parts[0]) - 1,
                            parseInt(parts[1])
                        );
                    }
                }

                console.log(
                    "Parsed borrowed date:",
                    parsedDate,
                    "isValid:",
                    isValid(parsedDate)
                );

                // Set the borrowed date state if valid
                if (isValid(parsedDate)) {
                    setBorrowedDate(parsedDate);
                    // Also update the form data with formatted date
                    setData((data) => ({
                        ...data,
                        borrowed_date: format(parsedDate, "MM/dd/yyyy"),
                    }));
                } else {
                    setBorrowedDate(null);
                }
            } else {
                setBorrowedDate(null);
            }

            if (selectedOpts.length > 0) {
                try {
                    const itemId = selectedOpts[0].value;
                    const response = await axios.get(`/api/item/${itemId}`);
                    const latestRemaining =
                        response.data.remaining_quantity ?? 0;

                    const originalTotal = latestRemaining + (row.quantity || 0);

                    // ✅ Set this as the total available for generating quantity options
                    setAvailableQuantity(originalTotal); // used in quantityOptions
                } catch (error) {
                    console.error("Failed to fetch item for edit:", error);
                    setAvailableQuantity(row.quantity || 10); // fallback
                }
            } else {
                setAvailableQuantity(row.quantity || 10); // fallback
            }
        } else if (!open) {
            reset();
            setSelectedOptions([]);
            setSelectedStatus(null);
            setReturnDate(null);
            setBorrowedDate(null);
            setSelectedQuantity(1);
        }
    };

    const handleInputChange = async (inputValue) => {
        console.log("Input value:", inputValue); // Debug what's being typed
        if (!inputValue) {
            setOptions([]);
            return;
        }

        try {
            console.log("Making API request..."); // Debug API call
            const response = await axios.get(
                `/api/search-items?query=${inputValue}`
            );
            console.log("API response:", response.data); // Debug response

            if (!Array.isArray(response.data)) {
                console.error("API response is not an array:", response.data);
                setOptions([]);
                return;
            }

            const newOptions = response.data.map((item) => ({
                value: item.id,
                label: item.items,
                remaining_quantity: item.remaining_quantity,
            }));

            console.log("Generated options:", newOptions); // Debug final options
            setOptions(newOptions);
        } catch (error) {
            console.error("Error fetching items:", error);
            setOptions([]);
        }
    };

    const quantityOptions = Array.from(
        { length: availableQuantity },
        (_, index) => ({
            key: index + 1,
            label: (index + 1).toString(),
        })
    );

    // Function to handle item selection
    const handleItemSelect = (selectedOption) => {
        setSelectedOptions(selectedOption);

        const ids = selectedOption ? [selectedOption.value] : [];
        const names = selectedOption ? [selectedOption.label] : [];

        setData({
            ...data,
            item_ids: ids,
            item_names: names,
            quantity: 1, // default to 1
        });

        if (selectedOption?.remaining_quantity) {
            setAvailableQuantity(selectedOption.remaining_quantity);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setProcessing(true);

        // Clear previous errors
        setFormErrors({
            name: null,
            items: null,
            quantity: null,
            borrowed_date: null,
            return_date: null,
            status: null,
        });

        // Validate inputs
        const newErrors = {};
        if (!data.name) newErrors.name = "Name is required";
        if (!selectedOptions || selectedOptions.length === 0)
            newErrors.items = "Please select at least one item";
        if (!borrowedDate)
            newErrors.borrowed_date = "Borrowed date is required";
        if (!returnDate) newErrors.return_date = "Return date is required";
        if (!selectedQuantity || selectedQuantity < 1)
            newErrors.quantity = "Quantity must be at least 1";

        if (Object.keys(newErrors).length > 0) {
            setFormErrors(newErrors);
            setProcessing(false);
            return;
        }

        // Format dates
        const formattedBorrowedDate = format(borrowedDate, "MM/dd/yyyy");
        const formattedReturnDate = format(returnDate, "MM/dd/yyyy");
        const quantity = parseInt(selectedQuantity) || 1;

        // Prepare form data
        const formData = {
            name: data.name,
            item_ids: Array.isArray(selectedOptions)
                ? selectedOptions.map((opt) => opt.value)
                : [selectedOptions.value],
            item_names: Array.isArray(selectedOptions)
                ? selectedOptions.map((opt) => opt.label)
                : [selectedOptions.label],
            borrowed_date: formattedBorrowedDate,
            return_date: formattedReturnDate,
            status: selectedStatus || "Borrowed", // Use selectedStatus from state
            quantity: quantity,
            _token: csrf,
        };

        try {
            const endpoint = isEditMode
                ? `/api/borrow/${data.id}`
                : "/api/borrow";
            const method = isEditMode ? "put" : "post";

            const response = await axios[method](endpoint, formData);

            if (response.data.success) {
                reset();
                setSelectedOptions([]);
                setIsDrawerOpen(false);
                setSuccessMessage(
                    isEditMode
                        ? "Item successfully updated!"
                        : "Item successfully borrowed!"
                );
                setIsSuccessDialogOpen(true);
                await fetchBorrowedItems();
            } else {
                throw new Error(response.data.message || "Failed to save");
            }
        } catch (error) {
            console.error("Error:", error);
            if (error.response?.data?.errors) {
                setFormErrors(error.response.data.errors);
            } else {
                setSuccessMessage(
                    error.response?.data?.message ||
                        "An error occurred. Please try again."
                );
                setIsSuccessDialogOpen(true);
            }
        } finally {
            setProcessing(false);
        }
    };

    const handleReturnItem = async (borrowId) => {
        try {
            const response = await axios.put(`/api/borrow/${borrowId}`, {
                status: "Returned",
                status_only: true,
                _token: csrf,
            });

            if (response.data.success) {
                setSuccessMessage("Item marked as returned successfully!");
                setIsSuccessDialogOpen(true);
                await fetchBorrowedItems();
            } else {
                throw new Error(
                    response.data.message || "Failed to update status"
                );
            }
        } catch (error) {
            console.error("Error marking item as returned:", error);
            setSuccessMessage(
                error.response?.data?.message ||
                    "Failed to mark item as returned. Please try again."
            );
            setIsSuccessDialogOpen(true);
        }
    };

    const totalPages = Math.ceil(filteredBorrowedItems.length / itemsPerPage);
    const paginatedBorrowedItems = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filteredBorrowedItems.slice(startIndex, endIndex);
    }, [filteredBorrowedItems, currentPage, itemsPerPage]);

    const handleSelectAll = () => {
        if (selectedBorrowedItems.length === filteredBorrowedItems.length) {
            setSelectedBorrowedItems([]);
        } else {
            setSelectedBorrowedItems(
                filteredBorrowedItems.map((item) => item.id)
            );
        }
    };

    const handleCheckboxChange = (item) => {
        setSelectedBorrowedItems((prev) =>
            prev.includes(item.id)
                ? prev.filter((id) => id !== item.id)
                : [...prev, item.id]
        );
    };

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    const confirmDelete = (id = null) => {
        const isBulk = id === null;
        const itemsToCheck = isBulk
            ? borrowedItems.filter((item) =>
                  selectedBorrowedItems.includes(item.id)
              )
            : [borrowedItems.find((item) => item.id === id)];

        // Check if any items are not returned
        const notReturnedItems = itemsToCheck.filter(
            (item) => item.status !== "Returned"
        );

        if (notReturnedItems.length > 0) {
            const itemNames = notReturnedItems
                .map((item) => item.name)
                .join(", ");
            setSuccessMessage(
                `Cannot delete items that haven't been returned: ${itemNames}. Please mark as returned first.`
            );
            setIsSuccessDialogOpen(true);
            return;
        }

        const count = isBulk ? selectedBorrowedItems.length : 1;

        if (count === 0) return;

        setConfirmMessage(
            count === 1
                ? "Are you sure you want to delete this borrowed item?"
                : `Are you sure you want to delete these ${count} borrowed items?`
        );

        setDeleteTarget(isBulk ? [...selectedBorrowedItems] : [id]);
        setIsConfirmDialogOpen(true);
        setIsBulkDelete(isBulk);
    };

    const handleConfirmDelete = async () => {
        if (!deleteTarget || deleteTarget.length === 0) return;

        try {
            let response;
            if (isBulkDelete) {
                response = await axios.post(route("borrows.bulk-destroy"), {
                    ids: deleteTarget,
                });
            } else {
                response = await axios.delete(
                    route("borrows.destroy", { id: deleteTarget[0] })
                );
            }

            if (response.data.success) {
                setBorrowedItems((prevItems) =>
                    prevItems.filter((item) => !deleteTarget.includes(item.id))
                );
                setSelectedBorrowedItems((prev) =>
                    prev.filter((id) => !deleteTarget.includes(id))
                );
                setDeleteTarget(null);
                setIsConfirmDialogOpen(false);
                setSuccessMessage(
                    deleteTarget.length === 1
                        ? "Borrowed item successfully deleted!"
                        : `${deleteTarget.length} borrowed items successfully deleted!`
                );
                setIsSuccessDialogOpen(true);
            } else {
                throw new Error(
                    response.data.message || "Failed to delete items"
                );
            }
        } catch (error) {
            console.error("Error deleting items:", error);
            setSuccessMessage(
                error.response?.data?.message ||
                    "Failed to delete items. Please try again."
            );
            setIsSuccessDialogOpen(true);
        }
    };

    const isSelectAllChecked =
        selectedBorrowedItems.length === filteredBorrowedItems.length &&
        filteredBorrowedItems.length > 0;

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = parseISO(dateString);
        return isValid(date) ? format(date, "MM/dd/yyyy hh:mm:ss a") : "N/A";
    };

    const formatDateOnly = (dateString) => {
        if (!dateString) return "N/A";
        const date = parseISO(dateString);
        return isValid(date) ? format(date, "MM/dd/yyyy") : "N/A";
    };

    const headers = [
        {
            label: (
                <Checkbox
                    checked={isSelectAllChecked}
                    onChange={handleSelectAll}
                />
            ),
            key: "select-all",
        },
        { label: "#", key: "index" },
        { label: "Name", key: "name" },
        { label: "Item", key: "item" },
        { label: "Quantity", key: "quantity" },
        { label: "Date_Borrow_From", key: "date_borrow" },
        { label: "Date_Return_", key: "date_return" },
        { label: "Status", key: "status" },
        { label: "Created_at", key: "created_at" },
        { label: "Updated_at", key: "updated_at" },
        { label: "Mark_As_Returned", key: "return_action" },
    ];

    const rows = paginatedBorrowedItems.map((item, index) => {
        const itemNames = Array.isArray(item.item_names)
            ? item.item_names
            : typeof item.item_names === "string"
            ? JSON.parse(item.item_names)
            : [];

        const quantity =
            item.quantity != null && item.quantity !== undefined
                ? item.quantity
                : "N/A";

        const displayRow = {
            id: item.id,
            select: (
                <Checkbox
                    checked={selectedBorrowedItems.includes(item.id)}
                    onChange={() => handleCheckboxChange(item)}
                />
            ),
            index: index + 1 + (currentPage - 1) * itemsPerPage,
            name: item.name,
            item: <ItemList items={itemNames} />,
            quantity: quantity,
            date_borrow: formatDateOnly(item.borrowed_date),
            date_return: formatDateOnly(item.return_date),
            status: item.status,
            created_at: item.created_at ? formatDate(item.created_at) : "N/A",
            updated_at: item.updated_at ? formatDate(item.updated_at) : "N/A",
            return_action: (
                <div className="flex justify-center">
                    <TrueButton
                        onClick={() => handleReturnItem(item.id)}
                        disabled={item.status === "Returned"}
                        className={`px-3 py-1 text-xs sm-rounded ${
                            item.status === "Returned"
                                ? "bg-gray-300 dark:bg-gray-600 cursor-not-allowed"
                                : "bg-green-500 hover:bg-green-600 text-white"
                        }`}
                    >
                        {item.status === "Returned"
                            ? "Already Returned"
                            : "Mark as Returned"}
                    </TrueButton>
                </div>
            ),
        };

        Object.defineProperty(displayRow, "_raw", {
            value: {
                id: item.id,
                name: item.name,
                item_names: itemNames,
                quantity: item.quantity,
                item_ids: Array.isArray(item.item_ids)
                    ? item.item_ids
                    : JSON.parse(item.item_ids),
                borrowed_date: item.borrowed_date,
                return_date: item.return_date,
                status: item.status,
            },
            enumerable: false,
        });

        return displayRow;
    });

    const statusOptions = [
        { value: "Borrowed", label: "Borrowed" },
        { value: "Overdue", label: "Overdue" },
        { value: "Returned", label: "Returned" },
    ];

    const actions = (row) => {
        const rawData = row._raw || {};

        return (
            <div className="flex justify-center">
                <Dropdown>
                    <Dropdown.Trigger>
                        <SettingsIcon className="cursor-pointer text-gray-600 dark:text-gray-300" />
                    </Dropdown.Trigger>
                    <Dropdown.Content contentClasses="relative py-1 right-7 top-[-80px] bg-gray-100 dark:bg-gray-700">
                        <Dropdown.Link
                            onClick={(e) => {
                                e.preventDefault();
                                toggleDrawer(true, true, {
                                    id: row.id,
                                    name: row.name,
                                    status: row.status,
                                    ...rawData,
                                });
                            }}
                        >
                            Edit
                        </Dropdown.Link>
                        <Dropdown.Link
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                confirmDelete(row.id);
                            }}
                        >
                            Delete
                        </Dropdown.Link>
                    </Dropdown.Content>
                </Dropdown>
            </div>
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    Item Borrow
                </h2>
            }
        >
            <Head title="Item Borrow" />

            <div className="px-4 py-4 bg-white ring-1 ring-black/10 sm:rounded-lg dark:bg-gray-800/40 relative">
                <div className="w-full mb-3 flex justify-between items-center gap-4 flex-wrap">
                    <div className="flex gap-2 items-center">
                        <input
                            type="text"
                            placeholder="Search..."
                            className="dark:text-white border border-black/20 dark:border-white bg-transparent rounded-sm px-4 py-1 focus:outline-none focus:ring-none dark:focus:border-white"
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <select
                            className="border border-black/20 dark:border-white py-1 rounded-sm text-md text-gray-600 dark:text-gray-300 bg-transparent cursor-pointer"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option
                                className="text-md dark:bg-gray-800 "
                                value="All"
                            >
                                All Status
                            </option>
                            {statusOptions.map((option, index) => (
                                <option
                                    key={index}
                                    value={option.value}
                                    className="dark:bg-gray-800 dark:text-gray-300"
                                >
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className="border border-black/20 dark:border-white py-1 rounded-sm text-gray-700 dark:text-gray-300 bg-transparent cursor-pointer"
                        >
                            <option
                                className="dark:bg-gray-800 dark:text-gray-300"
                                value=""
                            >
                                Filter Year
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
                        <div className="relative">
                            <select
                                onClick={() =>
                                    setShowDateRangePicker(!showDateRangePicker)
                                }
                                className="border border-black/20 dark:border-white py-1 rounded-sm text-gray-700 dark:text-gray-300 bg-transparent cursor-pointer w-[245px]"
                            >
                                <option hidden value="">
                                    {startDate && endDate
                                        ? `${format(
                                              startDate,
                                              "MM/dd/yyyy"
                                          )} - ${format(endDate, "MM/dd/yyyy")}`
                                        : "Filter date range"}
                                </option>
                            </select>
                            {/* Date Picker Dropdown */}
                            {showDateRangePicker && (
                                <div className="absolute z-50 top-10 right-0">
                                    <DatePicker
                                        selectsRange
                                        startDate={startDate}
                                        endDate={endDate}
                                        onChange={(dates) => {
                                            const [start, end] = dates;
                                            setStartDate(start);
                                            setEndDate(end);
                                            // Close the picker only when both dates are selected
                                            if (start && end) {
                                                setShowDateRangePicker(false);
                                            }
                                        }}
                                        onCalendarClose={() =>
                                            setShowDateRangePicker(false)
                                        } // Close when clicking outside
                                        inline
                                        calendarClassName="dark:bg-gray-800 pb-7"
                                    />
                                    <button
                                        onClick={() => {
                                            setStartDate(null);
                                            setEndDate(null);
                                            setShowDateRangePicker(false);
                                        }}
                                        className="absolute bottom-4 right-2 px-3 py-1 text-sm bg-[#216ba5] text-white rounded-md shadow-md transition duration-300 hover:bg-blue-500"
                                    >
                                        Reset Filter
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex">
                        <div className="pl-2 border-l border-gray-500 flex gap-2 items-center">
                            <DeleteIcon
                                className={`text-gray-600 dark:text-gray-300 cursor-pointer ${
                                    selectedBorrowedItems.length < 2
                                        ? "opacity-50 pointer-events-none"
                                        : ""
                                }`}
                                onClick={() => {
                                    if (selectedBorrowedItems.length >= 2) {
                                        confirmDelete();
                                    }
                                }}
                            />

                            <AddCircleIcon
                                className="text-gray-600 dark:text-gray-300 cursor-pointer"
                                onClick={() => toggleDrawer(true)}
                            />
                        </div>
                    </div>
                </div>

                <div className="text-gray-900 dark:text-gray-100">
                    <Table headers={headers} rows={rows} actions={actions} />
                </div>

                {filteredBorrowedItems.length > itemsPerPage && (
                    <div className="mt-4 flex justify-center">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                        />
                    </div>
                )}

                <SuccessDialog
                    isOpen={isSuccessDialogOpen}
                    message={successMessage}
                    onClose={() => setIsSuccessDialogOpen(false)}
                />

                <ConfirmationDialog
                    isOpen={isConfirmDialogOpen}
                    onConfirm={handleConfirmDelete}
                    onCancel={() => setIsConfirmDialogOpen(false)}
                    title={confirmMessage}
                />
            </div>

            <Drawer
                isDrawerOpen={isDrawerOpen}
                toggleDrawer={toggleDrawer}
                title={isEditMode ? "Edit Item borrow" : "Add Item borrow"}
            >
                <form onSubmit={handleSubmit}>
                    <input type="hidden" name="_token" value={csrf} />
                    <div className="mt-4">
                        <InputLabel htmlFor="name" value="Name" />
                        <TextInput
                            id="name"
                            className="mt-2 block w-full h-10 rounded-sm"
                            value={data.name}
                            onChange={(e) => setData("name", e.target.value)}
                        />
                        <InputError
                            message={formErrors.name}
                            className="mt-2"
                        />
                    </div>

                    <div className="mt-4">
                        <InputLabel htmlFor="Item" value="Item" />
                        <div className="relative">
                            <Select
                                id="Item"
                                className="mt-2"
                                placeholder="Search items..."
                                noOptionsMessage={() => "No items found"}
                                isClearable
                                isSearchable
                                value={selectedOptions}
                                onChange={(option) => handleItemSelect(option)}
                                onInputChange={(newValue) => {
                                    handleInputChange(newValue);
                                }}
                                options={options}
                                filterOption={null} // Important: Let the server handle filtering
                                debounce={300} // Add debounce to avoid too many requests
                                classNames={{
                                    control: ({ isFocused }) =>
                                        isFocused
                                            ? "custom-select-container custom-select-container--focused"
                                            : "custom-select-container",
                                    valueContainer: () =>
                                        "custom-select-value py-1 pl-2 min-h-[40px]",
                                    singleValue: () => "custom-select-value",
                                    menu: () => "custom-select-menu",
                                    option: () => "custom-select-option",
                                    placeholder: () =>
                                        "custom-select-placeholder",
                                    input: () => "custom-select-input",
                                }}
                            />
                        </div>
                        <InputError
                            message={formErrors.items}
                            className="mt-2"
                        />
                    </div>

                    {/* Quantity SelectOption */}
                    <div className="mt-4">
                        <InputLabel htmlFor="quantity" value="Quantity" />
                        <div className="relative">
                            <SelectOption
                                id="quantity"
                                className="mt-2 block w-full h-10 rounded-sm text-sm"
                                placeholder="Select quantity..."
                                options={quantityOptions}
                                value={selectedQuantity}
                                onChange={(e) => {
                                    const value = parseInt(e.target.value);
                                    setSelectedQuantity(value);
                                    setData({
                                        ...data,
                                        quantity: value,
                                    });
                                }}
                            />
                        </div>
                    </div>
                    {/* Date Borrowed */}
                    <div className="mt-4 w-full">
                        <InputLabel
                            htmlFor="borrowedDate"
                            value="Date Borrowed"
                        />
                        <div className="relative">
                            <div
                                className="px-3 w-full h-10 mt-2 block border dark:bg-gray-900 border-black/20 dark:border-gray-700 rounded-sm text-gray-700 dark:text-gray-300 bg-transparent cursor-pointer flex items-center"
                                onClick={() =>
                                    setShowPickerBorrowed(!showPickerBorrowed)
                                }
                            >
                                {borrowedDate
                                    ? format(borrowedDate, "MM/dd/yyyy")
                                    : "Select date"}
                            </div>
                            {showPickerBorrowed && (
                                <div className="absolute z-50">
                                    <DatePicker
                                        selected={borrowedDate}
                                        onChange={(date) => {
                                            setBorrowedDate(date);
                                            setData({
                                                ...data,
                                                borrowed_date: format(
                                                    date,
                                                    "MM/dd/yyyy"
                                                ),
                                            });
                                            setShowPickerBorrowed(false); // Close on selection
                                        }}
                                        onClickOutside={() =>
                                            setShowPickerBorrowed(false)
                                        } // Close when clicking outside
                                        dateFormat="MM/dd/yyyy"
                                        inline
                                        calendarClassName="dark:bg-gray-800 pb-7"
                                    />
                                </div>
                            )}
                        </div>
                        <InputError
                            message={formErrors.borrowed_date}
                            className="mt-2"
                        />
                    </div>

                    {/* Return Date */}
                    <div className="mt-4 w-full">
                        <InputLabel htmlFor="Date" value="Date Return" />
                        <div className="relative">
                            <div
                                className="px-3 w-full h-10 mt-2 block border dark:bg-gray-900 border-black/20 dark:border-gray-700 rounded-sm text-gray-700 dark:text-gray-300 bg-transparent cursor-pointer flex items-center"
                                onClick={() => setShowPicker(!showPicker)}
                            >
                                {returnDate
                                    ? format(returnDate, "MM/dd/yyyy")
                                    : "Select date"}
                            </div>
                            {showPicker && (
                                <div className="absolute z-50">
                                    <DatePicker
                                        selected={returnDate}
                                        onChange={(date) => {
                                            setReturnDate(date);
                                            setData({
                                                ...data,
                                                return_date: format(
                                                    date,
                                                    "MM/dd/yyyy"
                                                ),
                                            });
                                            setShowPicker(false); // Close on selection
                                        }}
                                        onClickOutside={() =>
                                            setShowPicker(false)
                                        } // Close when clicking outside
                                        dateFormat="MM/dd/yyyy"
                                        inline
                                        calendarClassName="dark:bg-gray-800 pb-7"
                                    />
                                </div>
                            )}
                        </div>
                        <InputError
                            message={formErrors.return_date}
                            className="mt-2"
                        />
                    </div>

                    {isEditMode && (
                        <div className="mt-4">
                            <InputLabel htmlFor="status" value="Status" />
                            <SelectOption
                                id="status"
                                className="mt-2 block w-full h-10 rounded-sm text-sm"
                                value={
                                    selectedStatus || data.status || "Borrowed"
                                }
                                onChange={(e) => {
                                    setSelectedStatus(e.target.value);
                                    setData("status", e.target.value);
                                }}
                                options={[
                                    { value: "Borrowed", label: "Borrowed" },
                                    { value: "Overdue", label: "Overdue" },
                                    { value: "Returned", label: "Returned" },
                                ]}
                            />
                            <InputError
                                message={errors.status}
                                className="mt-2"
                            />
                        </div>
                    )}
                    <div className="mt-5">
                        <SecondaryButton
                            type="submit"
                            className="w-full h-10 rounded-sm"
                            disabled={processing}
                        >
                            {processing ? "Saving..." : "Save"}
                        </SecondaryButton>
                    </div>
                </form>
            </Drawer>
        </AuthenticatedLayout>
    );
}
