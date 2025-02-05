import { useState, useEffect, useMemo } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm } from "@inertiajs/react";
import Table from "@/Components/Table";
import Checkbox from "@/Components/Checkbox";
import SettingsIcon from "@mui/icons-material/Settings";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import { CiImport } from "react-icons/ci";
import { CiExport } from "react-icons/ci";
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
import { exportToCSV } from "@/Context/exportToCSV";
import { importCSV } from "@/Context/importCSV";
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
        brand: "",
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
                    brand: item.brand || "",
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
        formData.append("brand", data.brand || "");
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

    useEffect(() => {
        const filtered = items.filter((item) =>
            [
                item.name,
                item.department,
                item.categories,
                item.brand,
                item.items,
            ].some((field) =>
                field?.toLowerCase().includes(searchTerm.toLowerCase())
            )
        );
        setFilteredItems(filtered);
        setCurrentPage(1);
    }, [searchTerm, items]);

    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

    const paginatedItems = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredItems.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredItems, currentPage]);

    //Pagination Logic

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
            await Promise.all(
                deleteTarget.map((id) =>
                    axios.delete(route("items.destroy", { id }))
                )
            );

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
        { label: "Brand", key: "brand" },
        { label: "Item", key: "items" },
        { label: "Quantity", key: "quantity" },
        { label: "Amount", key: "price" },
        { label: "Timestamp", key: "created_at" },
    ];

    const sortedPaginatedItems = [...paginatedItems].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

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
        department: item.user?.department ?? "N/A",
        image: item.image ? item.image.split("/").pop() : "No Image",
        categories: item.categories ?? "N/A",
        brand: item.brand ?? "N/A",
        items: item.items ?? "N/A",
        quantity: item.quantity ?? 0,
        price: item.price ? `₱ ${item.price}` : "N/A",
        created_at: item.created_at ? new Date(item.created_at).toLocaleString() : "N/A",
    }));
    
    //Select Option for Categories

    const selectOption = categories.map((category) => ({
        label: category.name,
        value: category.name,
    }));

    //Action Buttons for Items

    const actions = (row) => (
        <Dropdown>
            <Dropdown.Trigger>
                <SettingsIcon className="cursor-pointer text-gray-600 dark:text-gray-300" />
            </Dropdown.Trigger>
            <Dropdown.Content>
                <Dropdown.Link
                    onClick={(e) => {
                        e.preventDefault();
                        let imageSrc =
                            row.image !== "No Image"
                                ? `/storage/images/${row.image}`
                                : null;

                        console.log("🚀 Image Debug - Full Image URL:", imageSrc);

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
                    <div className=" px-6 py-4  overflow-hidden bg-white ring-1 ring-black/10 sm:rounded-lg dark:bg-gray-800">
                        <div className="w-full flex justify-between">
                            <div className="flex-1">
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    className="dark:text-white border-black/20 dark:border-white bg-transparent rounded-md px-4 py-1 focus:outline-none focus:ring-none dark:focus:border-white"
                                    onChange={(e) =>
                                        setSearchTerm(e.target.value)
                                    }
                                />
                            </div>
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

                                    {/* Hidden file input */}
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
                        <InputLabel htmlFor="categories" value="Categories" />
                        <SelectOption
                            id="categories"
                            className="mt-2 block w-full h-10 rounded-sm"
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
                        <InputLabel htmlFor="brand" value="Brand" />
                        <TextInput
                            id="brand"
                            className="mt-2 block w-full h-10 rounded-sm"
                            value={data.brand}
                            onChange={(e) => setData("brand", e.target.value)}
                        />
                        <InputError message={errors.brand} className="mt-2" />
                    </div>
                    <div className="mt-4">
                        <InputLabel htmlFor="items" value="Items" />
                        <TextInput
                            id="items"
                            className="mt-2 block w-full h-10 rounded-sm"
                            value={data.items}
                            onChange={(e) => setData("items", e.target.value)}
                        />
                        <InputError message={errors.items} className="mt-2" />
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
