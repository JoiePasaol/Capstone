import { useState, useEffect, useMemo } from "react";
import { Head, useForm, usePage } from "@inertiajs/react";
import { format } from "date-fns";
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
import "../../../css/select.css";
import axios from "axios";

export default function ItemBorrow() {
    const { csrf, auth } = usePage().props;
    const { user } = auth;

    // Drawer state
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [showPicker, setShowPicker] = useState(false);

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
    const [returnDate, setReturnDate] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedBorrowedItems, setSelectedBorrowedItems] = useState([]);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [statusFilter, setStatusFilter] = useState("All");

    const itemsPerPage = 10;

    const { post, data, setData, errors, reset } = useForm({
        name: "",
        item_ids: [],
        item_names: [],
        return_date: "",
        status: "Borrowed",
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
    const filteredBorrowedItems = useMemo(() => {
        if (!Array.isArray(borrowedItems) || borrowedItems.length === 0) return [];
        
        const searchLower = searchTerm.toLowerCase();
        return borrowedItems
            .filter((item) => item && item.name)
            .filter(
                (item) =>
                    item.name.toLowerCase().includes(searchLower) ||
                    (Array.isArray(item.item_names)
                        ? item.item_names.some(name => name.toLowerCase().includes(searchLower))
                        : false)
            )
            .filter((item) => 
                statusFilter === "All" || item.status === statusFilter
            )
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }, [borrowedItems, searchTerm, statusFilter]);

    const fetchBorrowedItems = async () => {
        try {
            const response = await axios.get("/borrows");
            // Sort by created_at in descending order (newest first)
            const sortedItems = response.data.sort((a, b) => 
                new Date(b.created_at) - new Date(a.created_at)
            );
            setBorrowedItems(sortedItems);
        } catch (error) {
            console.error("Error fetching borrowed items:", error);
            setSuccessMessage("Failed to load borrowed items. Please try again.");
            setIsSuccessDialogOpen(true);
        }
    };

    useEffect(() => {
        fetchBorrowedItems();
    }, []);

    const toggleDrawer = (open, isEdit = false, row = null) => {
        setIsDrawerOpen(open);
        setIsEditMode(isEdit);

        if (open && isEdit && row) {
            const itemNames = Array.isArray(row.item_names)
                ? row.item_names
                : typeof row.item_names === 'string'
                    ? JSON.parse(row.item_names)
                    : [];

            const itemIds = Array.isArray(row.item_ids)
                ? row.item_ids
                : typeof row.item_ids === 'string'
                    ? JSON.parse(row.item_ids)
                    : [];

            const selectedOpts = itemNames.map((name, index) => ({
                value: itemIds[index] || name.toLowerCase().replace(/\s+/g, "-"),
                label: name,
            }));

            setSelectedOptions(selectedOpts);
            setSelectedStatus(row.status);

            setData({
                id: row.id,
                name: row.name,
                item_ids: itemIds,
                item_names: itemNames,
                return_date: row.return_date,
                status: row.status,
            });

            if (row.return_date) {
                const date = new Date(row.return_date);
                setReturnDate(isNaN(date.getTime()) ? null : date);
            }
        } else if (!open) {
            reset();
            setSelectedOptions([]);
            setSelectedStatus(null);
            setReturnDate(null);
        }
    };

    const handleInputChange = async (inputValue) => {
        if (!inputValue) {
            setOptions([]);
            return;
        }

        try {
            const response = await axios.get(
                `/search-items?query=${inputValue}`
            );

            if (!Array.isArray(response.data)) {
                console.error("API response is not an array:", response.data);
                setOptions([]);
                return;
            }

            const newOptions = response.data.map((item) => ({
                value: item.id,
                label: item.items,
            }));

            const combinedOptions = [...selectedOptions, ...newOptions];
            const uniqueOptions = combinedOptions.filter(
                (option, index, self) =>
                    index === self.findIndex((o) => o.value === option.value)
            );

            setOptions(uniqueOptions);
        } catch (error) {
            console.error("Error fetching items:", error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setProcessing(true);
    
        if (selectedOptions.length === 0) {
            alert("Please select at least one item.");
            setProcessing(false);
            return;
        }
    
        const formattedReturnDate = returnDate
            ? format(returnDate, "MM/dd/yyyy")
            : "";
    
        const formData = {
            name: data.name,
            item_ids: selectedOptions.map((opt) => opt.value),
            item_names: selectedOptions.map((opt) => opt.label),
            return_date: formattedReturnDate,
            status: data.status || "Borrowed",
            _token: csrf,
        };
    
        try {
            if (isEditMode && !data.id) {
                throw new Error("Missing ID for update operation");
            }
    
            const endpoint = isEditMode ? `/borrow/${data.id}` : "/borrow";
            const method = isEditMode ? "put" : "post";
    
            const response = await axios[method](endpoint, formData, {
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    "X-CSRF-TOKEN": csrf,
                },
            });
    
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
                
                // Fetch items again to ensure proper sorting
                await fetchBorrowedItems();
            } else {
                throw new Error(response.data.message || "Failed to save");
            }
        } catch (error) {
            console.error("Full error:", error);
            if (error.response) {
                console.error("Server response:", error.response.data);
                alert(
                    `Server error: ${error.response.data.message ||
                    JSON.stringify(error.response.data)
                    }`
                );
            } else {
                alert(`Error: ${error.message}`);
            }
        } finally {
            setProcessing(false);
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
        const count = id ? 1 : selectedBorrowedItems.length;

        if (count === 0) return;

        setConfirmMessage(
            count === 1
                ? "Are you sure you want to delete this borrowed item?"
                : `Are you sure you want to delete these ${count} borrowed items?`
        );

        setDeleteTarget(id ? [id] : [...selectedBorrowedItems]);
        setIsConfirmDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!deleteTarget || deleteTarget.length === 0) return;
    
        try {
            const response = await axios.post(route('borrows.bulkDestroy'), {
                ids: deleteTarget
            });
    
            if (response.data.success) {
                // Update all related states
                setBorrowedItems(prevItems => 
                    prevItems.filter(item => !deleteTarget.includes(item.id))
                );
                setSelectedBorrowedItems(prev => 
                    prev.filter(id => !deleteTarget.includes(id))
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
                throw new Error(response.data.message || "Failed to delete items");
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

    const headers = [
        {
            label: (
                <Checkbox
                    checked={isSelectAllChecked}
                    onChange={handleSelectAll}
                />
            ),
            key: "select-all"
        },
        { label: "#", key: "index" },
        { label: "Name", key: "name" },
        { label: "Item", key: "item" },
        { label: "Date_Return", key: "date_return" },
        { label: "Status", key: "status" },
        { label: "Created_at", key: "created_at" },
        { label: "Updated_at", key: "updated_at" },
    ];

    const rows = paginatedBorrowedItems.map((item, index) => {
        const itemNames = Array.isArray(item.item_names)
            ? item.item_names
            : typeof item.item_names === 'string'
                ? JSON.parse(item.item_names)
                : [];

        const formatDate = (dateString) => {
            if (!dateString) return '';
            const date = new Date(dateString);
            return isNaN(date.getTime()) ? dateString : format(date, 'MM/dd/yyyy');
        };

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
            date_return: formatDate(item.return_date),
            status: item.status,
            created_at: formatDate(item.created_at),
            updated_at: formatDate(item.updated_at),
        };

        Object.defineProperty(displayRow, "_raw", {
            value: {
                id: item.id,
                item_names: itemNames,
                item_ids: Array.isArray(item.item_ids)
                    ? item.item_ids
                    : JSON.parse(item.item_ids),
                return_date: item.return_date,
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
                    </div>

                    <div className="flex">
                        <div className="pl-2 border-l border-gray-500 flex gap-2 items-center">
                            <DeleteIcon
                                className={`text-gray-600 dark:text-gray-300 cursor-pointer ${selectedBorrowedItems.length === 0
                                        ? "opacity-50 pointer-events-none"
                                        : ""
                                    }`}
                                onClick={() => {
                                    if (selectedBorrowedItems.length > 0) {
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
                        <InputError message={errors.name} className="mt-2" />
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
                                isMulti
                                value={selectedOptions}
                                onChange={(options) => {
                                    const uniqueOptions = options
                                        ? options.filter(
                                            (option, index, self) =>
                                                index ===
                                                self.findIndex(
                                                    (o) =>
                                                        o.value ===
                                                        option.value
                                                )
                                        )
                                        : [];

                                    setSelectedOptions(uniqueOptions);
                                    setData({
                                        ...data,
                                        item_ids: uniqueOptions.map(
                                            (opt) => opt.value
                                        ),
                                        item_names: uniqueOptions.map(
                                            (opt) => opt.label
                                        ),
                                    });
                                }}
                                onInputChange={(newValue) => {
                                    if (newValue) {
                                        handleInputChange(newValue);
                                    }
                                }}
                                options={options}
                                components={{
                                    MultiValueContainer: ({
                                        children,
                                        ...props
                                    }) => (
                                        <div className="flex flex-wrap gap-2">
                                            {children}
                                        </div>
                                    ),
                                }}
                                classNames={{
                                    control: ({ isFocused }) =>
                                        isFocused
                                            ? "custom-select-container custom-select-container--focused"
                                            : "custom-select-container",
                                    valueContainer: () =>
                                        "custom-select-value py-1 pl-2 min-h-[40px]",
                                    multiValue: () =>
                                        "text-sm bg-gray-200 dark:bg-gray-700 rounded px-2 py-1",
                                    multiValueLabel: () =>
                                        "text-gray-800 dark:text-gray-200",
                                    multiValueRemove: () =>
                                        "text-gray-500 hover:text-red-500 dark:hover:text-red-400 ml-1",
                                    singleValue: () => "custom-select-value",
                                    menu: () => "custom-select-menu",
                                    option: () => "custom-select-option",
                                    placeholder: () =>
                                        "custom-select-placeholder",
                                    input: () => "custom-select-input",
                                }}
                                closeMenuOnSelect={false}
                            />
                        </div>
                        <InputError message={errors.item_id} className="mt-2" />
                    </div>
                    <div className="mt-4 w-full">
                        <InputLabel htmlFor="Date" value="Date Return" />
                        <div className="relative">
                            <div
                                className="px-3 w-full h-10 mt-2 block border dark:bg-gray-900 border-black/20 dark:border-gray-700 rounded-sm text-gray-700 dark:text-gray-500 bg-transparent cursor-pointer flex items-center"
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
                                            setData(
                                                "return_date",
                                                format(date, "MM/dd/yyyy")
                                            );
                                        }}
                                        dateFormat="MM/dd/yyyy"
                                        inline
                                        calendarClassName="dark:bg-gray-800 pb-7"
                                    />
                                </div>
                            )}
                        </div>
                        <InputError message={errors.Date} className="mt-2" />
                    </div>

                    {isEditMode && (
                        <div className="mt-4">
                            <InputLabel htmlFor="status" value="Status" />
                            <SelectOption
                                id="status"
                                className="mt-2 block w-full h-10 rounded-sm text-sm"
                                value={data.status || "Borrowed"}
                                onChange={(e) =>
                                    setData("status", e.target.value)
                                }
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