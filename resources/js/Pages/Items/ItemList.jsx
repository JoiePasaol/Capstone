import { useState, useEffect, useMemo } from "react";
import { Head, useForm } from "@inertiajs/react";
import { CiImport, CiExport } from "react-icons/ci";
import { exportToCSV } from "@/Context/exportToCSV";
import { importCSV } from "@/Context/importCSV";
import { format } from "date-fns";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import Table from "@/Components/Table";
import Checkbox from "@/Components/Checkbox";
import SettingsIcon from "@mui/icons-material/Settings";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import Drawer from "@/Components/Drawer";
import Modal from "@/Components/Modal";
import InputLabel from "@/Components/InputLabel";
import InputError from "@/Components/InputError";
import TextInput from "@/Components/TextInput";
import SelectOption from "@/Components/SelectOption";
import SecondaryButton from "@/Components/SecondaryButton";
import Dropdown from "@/Components/Dropdown";
import Pagination from "@/Components/Pagination";
import ConfirmationDialog from "@/Components/ConfirmationDialog";
import SuccessDialog from "@/Components/SuccessDialog";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import QuillEditor from "@/Context/QuillEditor";
import "quill/dist/quill.snow.css";
import axios from "axios";

export default function ItemList() {
    //State Management

    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
    const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
    const [confirmMessage, setConfirmMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [deleteTarget, setDeleteTarget] = useState(null);
    const { data, setData, post, reset, errors } = useForm({
        image: null,
        categories: "",
        description: "",
        items: "",
        quantity: "",
        price: "",
    });
    const [processing, setProcessing] = useState(false);
    const [categories, setCategories] = useState([]);
    const [items, setItems] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState(null);
    const [selectedFileName, setSelectedFileName] = useState("Select a file");
    const [filteredItems, setFilteredItems] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedItems, setSelectedItems] = useState([]);
    const itemsPerPage = 10;

    //Import/Export Logic

    const handleImport = async (data) => {
        console.log("Data being sent to backend:", data);

        try {
            const response = await axios.post(route("items.import"), { data });
            setSuccessMessage(
                response.data.message || "Item imported successfully!"
            );
            fetchItems();
        } catch (error) {
            console.error("Error importing data:", error);
            setSuccessMessage(
                error.response?.data?.message ||
                    "Import failed. Please check the CSV format and try again."
            );
        } finally {
            setIsSuccessDialogOpen(true);
        }
    };

    const triggerFileInput = () => {
        document.getElementById("importFile").click();
    };

    //Drawer and Form Submission Logic

    const toggleDrawer = (open, isEdit = false, item = null) => {
        setIsDrawerOpen(open);
        setIsEditMode(isEdit);

        if (open) {
            if (isEdit && item) {
                setData({
                    id: item.id,
                    categories: item.categories || "",
                    description: item.description || "",
                    items: item.items || "",
                    quantity: item.quantity || "",
                    price: item.price || "",
                    image: null,
                });

                setSelectedFileName(
                    item.image ? item.image.split("/").pop() : "Select a file"
                );
            } else {
                reset();
                setSelectedFileName("Select a file");
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setProcessing(true);

        const formData = new FormData();
        formData.append("categories", data.categories || "");
        formData.append("description", data.description || "");
        formData.append("items", data.items || "");
        formData.append("quantity", data.quantity || 0);
        formData.append("price", data.price || 0);

        if (data.image instanceof File) {
            formData.append("image", data.image);
        }

        if (!data.id) {
            post(route("items.store"), {
                data: formData,
                headers: { "Content-Type": "multipart/form-data" },
                onSuccess: () => {
                    toggleDrawer(false);
                    reset();
                    fetchItems();
                    setSuccessMessage("Item successfully added!");
                    setIsSuccessDialogOpen(true);
                    setProcessing(false);
                },
                onError: () => {
                    setProcessing(false);
                },
            });
        } else {
            formData.append("_method", "PUT");

            axios
                .post(route("items.update", { id: data.id }), formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                })
                .then((response) => {
                    toggleDrawer(false);
                    reset();
                    setSelectedFileName("Select a file");

                    setItems((prevItems) =>
                        prevItems.map((item) =>
                            item.id === data.id ? response.data.item : item
                        )
                    );

                    setSuccessMessage("Item successfully updated!");
                    setIsSuccessDialogOpen(true);
                    setProcessing(false);
                })
                .catch((error) => {
                    console.error("Error updating item:", error);
                    setProcessing(false);
                });
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData("image", file);
            setSelectedFileName(file.name);
        } else {
            setSelectedFileName("Select a file");
        }
    };

    //Fetching Data

    const fetchItems = async () => {
        try {
            const response = await axios.get(route("items.index"));
            setItems(response.data.items);
            setFilteredItems(response.data.items);
        } catch (error) {
            console.error("Error fetching items:", error);
        }
    };

    const fetchItem = async (id) => {
        try {
            const response = await axios.get(route("items.edit", { id }));
            const item = response.data.item;
            toggleDrawer(true, true, item);
        } catch (error) {
            console.error("Error fetching item:", error);
        }
    };

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await axios.get(route("categories"));
                setCategories(response.data.categories);
            } catch (error) {
                console.error("Error fetching categories:", error);
            }
        };

        fetchCategories();
    }, []);

    useEffect(() => {
        fetchItems();
    }, []);

    //Filtering Items
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [showPicker, setShowPicker] = useState(false);

    useEffect(() => {
        if (items.length === 0) return;

        const filtered = items.filter((item) => {
            const itemDate = new Date(item.created_at);

            // Ensure endDate includes the full day
            const adjustedEndDate = endDate
                ? new Date(endDate.setHours(23, 59, 59, 999))
                : null;

            const isInRange =
                (!startDate || itemDate.getTime() >= startDate.getTime()) &&
                (!adjustedEndDate ||
                    itemDate.getTime() <= adjustedEndDate.getTime());

            const matchesSearch = [
                item.name,
                item.department,
                item.categories,
                item.description,
                item.items,
            ].some((field) =>
                field?.toLowerCase().includes(searchTerm.toLowerCase())
            );

            return matchesSearch && isInRange;
        });

        setFilteredItems(filtered);
        setCurrentPage(1);
    }, [searchTerm, startDate, endDate, items]);

    //Pagination Logic

    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

    const handlePageChange = (newPage) => {
        if (newPage < 1 || newPage > totalPages) return;
        setCurrentPage(newPage);
    };

    const handleCheckboxChange = (item) => {
        setSelectedItems((prev) =>
            prev.includes(item.id)
                ? prev.filter((id) => id !== item.id)
                : [...prev, item.id]
        );
    };

    //Select All Checkbox Handler

    const handleSelectAll = () => {
        if (selectedItems.length === filteredItems.length) {
            setSelectedItems([]);
        } else {
            setSelectedItems(filteredItems.map((item) => item.id));
        }
    };

    //Deleting Items Logic

    const confirmDelete = (id = null) => {
        const count = id ? 1 : selectedItems.length;

        setConfirmMessage(
            count === 1
                ? "Are you sure you want to delete this Item?"
                : `Are you sure you want to delete these (${count}) Items?`
        );

        setDeleteTarget(id ? [id] : [...selectedItems]);
        setIsConfirmDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!deleteTarget || deleteTarget.length === 0) return;

        try {
            // Send one request to delete multiple items
            await axios.post(route("items.bulkDestroy"), { ids: deleteTarget });

            fetchItems();
            setSelectedItems([]);
            setDeleteTarget(null);
            setIsConfirmDialogOpen(false);

            setTimeout(() => {
                setSuccessMessage(
                    deleteTarget.length === 1
                        ? "Item successfully deleted!"
                        : `(${deleteTarget.length}) Items successfully deleted!`
                );
                setIsSuccessDialogOpen(true);
            }, 100);
        } catch (error) {
            console.error("Error deleting items:", error);
        }
    };

    //Table Headers and Rows Mapping

    const isSelectAllChecked = selectedItems.length === filteredItems.length;

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
        { label: "Department", key: "department" },
        { label: "Image", key: "image" },
        { label: "Category", key: "categories" },
        { label: "Item", key: "items" },
        { label: "Description", key: "description" },
        { label: "Quantity", key: "quantity" },
        { label: "Amount", key: "price" },
        { label: "Created_At", key: "created_at" },
    ];

    const paginatedItems = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredItems.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredItems, currentPage]);

    const sortedPaginatedItems = [...paginatedItems].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );

    const rows = sortedPaginatedItems.map((item, index) => ({
        id: item.id,
        select: (
            <Checkbox
                checked={selectedItems.includes(item.id)}
                onChange={() => handleCheckboxChange(item)}
            />
        ),
        index: index + 1 + (currentPage - 1) * itemsPerPage,
        name: item.name,
        department: item.department ?? "N/A",
        image: item.image ? item.image.split("/").pop() : "No Image",
        categories: item.categories ?? "N/A",
        items: item.items ?? "N/A",
        description: (
            <div
                className="ql-editor ql-snow"
                dangerouslySetInnerHTML={{ __html: item.description }}
            />
        ),
        quantity: item.quantity ?? 0,
        price: item.price ? `₱ ${item.price}` : "N/A",
        created_at: item.created_at
            ? new Date(item.created_at).toLocaleString()
            : "N/A",
    }));

    //Select Option for Categories

    const selectOption = categories.map((category) => ({
        label: category.name,
        value: category.name,
    }));

    //Action Buttons for Items

    const actions = (row) => (
        <Dropdown className="">
            <Dropdown.Trigger>
                <SettingsIcon className="cursor-pointer text-gray-600 dark:text-gray-300" />
            </Dropdown.Trigger>
            <Dropdown.Content contentClasses="relative py-1 right-7 top-[-108px] bg-gray-700 ">
                <Dropdown.Link
                    onClick={(e) => {
                        e.preventDefault();
                        let imageSrc =
                            row.image !== "No Image"
                                ? `/storage/images/${row.image}`
                                : null;

                        console.log(
                            "🚀 Image Debug - Full Image URL:",
                            imageSrc
                        );

                        setModalContent(
                            <div className="flex justify-center items-center p-4">
                                {imageSrc ? (
                                    <img src={imageSrc} />
                                ) : (
                                    <span className="text-white text-xl">
                                        No Image Available!
                                    </span>
                                )}
                            </div>
                        );
                        setIsModalOpen(true);
                    }}
                >
                    View
                </Dropdown.Link>
                <Dropdown.Link
                    onClick={(e) => {
                        e.preventDefault();
                        fetchItem(row.id);
                    }}
                >
                    Edit
                </Dropdown.Link>
                <Dropdown.Link
                    onClick={(e) => {
                        e.preventDefault();
                        confirmDelete(row.id);
                    }}
                >
                    Delete
                </Dropdown.Link>
            </Dropdown.Content>
        </Dropdown>
    );

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    Items
                </h2>
            }
        >
            <Head title="Item List" />

            {/* Main Content */}
            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="px-6 py-4 overflow-visible bg-white ring-1 ring-black/10 sm:rounded-lg dark:bg-gray-800">
                        <div className="w-full flex justify-between items-center">
                            {/* Search and Date Range Picker */}
                            <div className="flex gap-2 items-center">
        
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    className="dark:text-white border border-black/20 dark:border-white bg-transparent rounded-md px-4 py-1 focus:outline-none focus:ring-none dark:focus:border-white"
                                    onChange={(e) =>
                                        setSearchTerm(e.target.value)
                                    }
                                />

                                {/* Date Range Picker Input */}
                                <div className="relative z-50">
                                    <input
                                        type="text"
                                        readOnly
                                        placeholder="Select date range"
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
                                        className="border border-black/20 dark:border-white py-1 rounded-md text-gray-700 dark:text-gray-300 bg-transparent cursor-pointer  w-60"
                                    />
                                    {/* Date Picker Dropdown */}
                                    {showPicker && (
                                        <div className="absolute mt-2 z-50">
                                            <DatePicker
                                                selectsRange
                                                startDate={startDate}
                                                endDate={endDate}
                                                onChange={(dates) => {
                                                    const [start, end] = dates;
                                                    setStartDate(start);
                                                    setEndDate(end);
                                                }}
                                                inline
                                                calendarClassName="dark:bg-gray-800 pb-7"
                                            />
                                            <button
                                                onClick={() => {
                                                    setStartDate(null);
                                                    setEndDate(null);
                                                    setFilteredItems(items);
                                                }}
                                                className="absolute bottom-4 right-2 px-3 py-1 text-sm bg-[#216ba5] text-white rounded-md shadow-md transition duration-300 hover:bg-blue-500"
                                            >
                                                Reset Filter
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Export, Import, Add, and Delete Icons */}
                            <div className="flex">
                                <div className="pr-2 flex gap-2 items-center">
                                    <CiExport
                                        onClick={() =>
                                            exportToCSV(
                                                items,
                                                "items_export.csv"
                                            )
                                        }
                                        className="text-2xl stroke-[1] text-gray-600 dark:text-gray-300 cursor-pointer"
                                    />
                                    <CiImport
                                        className="text-2xl stroke-[1] text-gray-600 dark:text-gray-300 cursor-pointer"
                                        onClick={triggerFileInput}
                                    />
                                    <input
                                        id="importFile"
                                        type="file"
                                        accept=".csv"
                                        className="hidden"
                                        onChange={(e) =>
                                            importCSV(e, handleImport)
                                        }
                                    />
                                </div>
                                <div className="pl-2 border-l border-gray-500 flex gap-2 items-center">
                                    <DeleteIcon
                                        className={`text-gray-600 dark:text-gray-300 cursor-pointer ${
                                            selectedItems.length < 2
                                                ? "opacity-50 pointer-events-none"
                                                : ""
                                        }`}
                                        onClick={() => confirmDelete()}
                                        disabled={selectedItems.length < 2}
                                    />
                                    <AddCircleIcon
                                        className="text-gray-600 dark:text-gray-300 cursor-pointer"
                                        onClick={() =>
                                            toggleDrawer(true, false)
                                        }
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="text-gray-900 dark:text-gray-100">
                            <Table
                                headers={headers}
                                rows={rows}
                                actions={actions}
                            />
                        </div>

                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                        />
                    </div>
                </div>
            </div>

            {/* Drawer for Item */}
            <Drawer
                isDrawerOpen={isDrawerOpen}
                toggleDrawer={toggleDrawer}
                title={isEditMode ? "Edit Item" : "Add Item"}
            >
                <form onSubmit={handleSubmit}>
                    <div className="mt-2">
                        <InputLabel htmlFor="image" value="Image" />
                        <div className="relative mt-2">
                            <TextInput
                                id="image"
                                type="file"
                                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                                onChange={handleImageChange}
                            />
                            <div className="block w-full h-10 rounded-sm ring-1 ring-gray-300 dark:ring-gray-600 dark:bg-gray-900 flex items-center text-gray-700 dark:text-gray-300 px-2">
                                <span className="text-sm truncate">
                                    {selectedFileName}
                                </span>
                            </div>
                        </div>
                        <InputError message={errors.image} className="mt-2" />
                    </div>

                    <div className="mt-4">
                        <InputLabel htmlFor="categories" value="Category" />
                        <SelectOption
                            id="categories"
                            className="mt-2 block w-full h-10 rounded-sm text-sm"
                            placeholder="Select a category"
                            options={selectOption}
                            value={data.categories}
                            onChange={(e) =>
                                setData("categories", e.target.value)
                            }
                        />
                        <InputError
                            message={errors.categories}
                            className="mt-2"
                        />
                    </div>
                    <div className="mt-4">
                        <InputLabel htmlFor="items" value="Item" />
                        <TextInput
                            id="items"
                            className="mt-2 block w-full h-10 rounded-sm"
                            value={data.items}
                            onChange={(e) => setData("items", e.target.value)}
                        />
                        <InputError message={errors.items} className="mt-2" />
                    </div>
                    <div className="mt-4">
                        <InputLabel htmlFor="description" value="Description" />
                        <QuillEditor
                            value={data.description}
                            onChange={(content) =>
                                setData("description", content)
                            }
                        />
                        <InputError
                            message={errors.description}
                            className="mt-2"
                        />
                    </div>
                    <div className="mt-4">
                        <InputLabel htmlFor="quantity" value="Quantity" />
                        <TextInput
                            id="quantity"
                            className="mt-2 block w-full h-10 rounded-sm"
                            value={data.quantity}
                            onChange={(e) =>
                                setData("quantity", e.target.value)
                            }
                        />
                        <InputError
                            message={errors.quantity}
                            className="mt-2"
                        />
                    </div>
                    <div className="mt-4">
                        <InputLabel htmlFor="price" value="Amount" />
                        <TextInput
                            id="price"
                            className="mt-2 block w-full h-10 rounded-sm"
                            value={data.price}
                            onChange={(e) => setData("price", e.target.value)}
                        />
                        <InputError message={errors.price} className="mt-2" />
                    </div>
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

            {/* Modal for Image */}
            <Modal
                show={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                maxWidth="2xl"
            >
                {modalContent}
            </Modal>

            {/* Confirmation Dialog */}
            <ConfirmationDialog
                isOpen={isConfirmDialogOpen}
                onConfirm={handleConfirmDelete}
                onCancel={() => setIsConfirmDialogOpen(false)}
                title={confirmMessage}
            />

            {/* Success Dialog */}
            <SuccessDialog
                isOpen={isSuccessDialogOpen}
                onClose={() => setIsSuccessDialogOpen(false)}
                message={successMessage}
            />
        </AuthenticatedLayout>
    );
}
