import { useState, useEffect, useMemo } from "react";
import { Head, useForm, usePage } from "@inertiajs/react";
import { CiImport, CiExport } from "react-icons/ci";
import { exportToCSV } from "@/Utils/exportToCSV";
import { importCSV } from "@/Utils/importCSV";
import { format, parse } from "date-fns";
import { checkRole } from "@/utils/CheckRole";
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
import QuillEditor from "@/Utils/QuillEditor";
import "quill/dist/quill.snow.css";
import axios from "axios";


export default function ItemList() {

    // Extract user authentication information
    const { user } = usePage().props.auth;
    const { auth } = usePage().props;
    const currentUser = auth.user;
    const basicUser = currentUser?.role === "Basic";

    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [transferItemId, setTransferItemId] = useState(null);

    //Drawer Management
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);

    //Dialog Management
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
    const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
    const [confirmMessage, setConfirmMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    //Form Management
    const { data, setData, post, reset, errors } = useForm({
        image: null,
        categories: "",
        description: "",
        items: "",
        estimated_life: "",
        quantity: "",
        price: "",
        suppliers: "", // Changed from 'supplier'
        ics: "",
        pr: "",
        pr_date: "",
        po: "",
        po_date: "",
        vc: "",
        vc_date: "",
        ch: "",
        ch_date: "",
        or: "",
        or_date: "",
        date_purchase: "",
        property_no: "",
        classification_no: "",
    });
    //Item Management
    const [processing, setProcessing] = useState(false);
    const [categories, setCategories] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [items, setItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedItems, setSelectedItems] = useState([]);
    const [deleteTarget, setDeleteTarget] = useState(null);

    //DatePicker Management
    const [activeDatePicker, setActiveDatePicker] = useState(null);
    const toggleDatePicker = (picker) => {
        setActiveDatePicker(activeDatePicker === picker ? null : picker);
    };

    //Modal Management
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState(null);
    const [selectedFileName, setSelectedFileName] = useState("Select file");





    const handleRowsPerPageChange = (event) => {
        setItemsPerPage(Number(event.target.value));
    };

    //Import Logic
    const TransferDrawer = () => {
        const [transferData, setTransferData] = useState({
            transferTo: "",
            nameDesignation: "",
            positionIntended: "",
            designatedOffice: "",
            officeNameDesignation: "",
            officePositionIntended: "",
            quantityToTransfer: 1,
            recommendedByName: "",
            recommendedByTitle: "",
            approvedByName: "",
            approvedByTitle: "",
            witnessedByName: "",
            witnessedByTitle: ""
        });

        const [signatories, setSignatories] = useState([]);
        const [maxQuantity, setMaxQuantity] = useState(1);

        useEffect(() => {
            const fetchSignatories = async () => {
                try {
                    const response = await axios.get(route('signatories.index'));
                    setSignatories(response.data);
                } catch (error) {
                    console.error("Failed to fetch signatories:", error);
                }
            };

            fetchSignatories();

            if (transferItemId) {
                const item = items.find(item => item.id === transferItemId);
                if (item) {
                    setMaxQuantity(item.quantity);
                    setTransferData(prev => ({
                        ...prev,
                        quantityToTransfer: Math.min(prev.quantityToTransfer, item.quantity)
                    }));
                }
            }
        }, [transferItemId, items]);

        const handleInputChange = (field, value) => {
            setTransferData(prev => ({
                ...prev,
                [field]: value,
                ...(field === 'nameDesignation' ? {
                    positionIntended: signatories.find(s => s.name_designation === value)?.position_intended || ''
                } : {}),
                ...(field === 'officeNameDesignation' ? {
                    officePositionIntended: signatories.find(s => s.name_designation === value)?.position_intended || ''
                } : {}),
                ...(field === 'recommendedByName' ? {
                    recommendedByTitle: signatories.find(s => s.name_designation === value)?.position_intended || ''
                } : {}),
                ...(field === 'approvedByName' ? {
                    approvedByTitle: signatories.find(s => s.name_designation === value)?.position_intended || ''
                } : {}),
                ...(field === 'witnessedByName' ? {
                    witnessedByTitle: signatories.find(s => s.name_designation === value)?.position_intended || ''
                } : {})
            }));
        };

        const handleQuantityChange = (e) => {
            const value = Math.min(Math.max(1, parseInt(e.target.value) || 1), maxQuantity);
            setTransferData(prev => ({
                ...prev,
                quantityToTransfer: value
            }));
        };

        const handleTransferSubmit = async (e) => {
            e.preventDefault();

            try {
                setProcessing(true);
                const response = await axios.post(route('items.transfer'), {
                    item_id: transferItemId,
                    quantity_transferred: transferData.quantityToTransfer,
                    transferTo: transferData.transferTo,
                    nameDesignation: transferData.nameDesignation,
                    positionIntended: transferData.positionIntended,
                    designatedOffice: transferData.designatedOffice,
                    officeNameDesignation: transferData.officeNameDesignation,
                    officePositionIntended: transferData.officePositionIntended,
                    recommended_by_name: transferData.recommendedByName,
                    recommended_by_title: transferData.recommendedByTitle,
                    approved_by_name: transferData.approvedByName,
                    approved_by_title: transferData.approvedByTitle,
                    witnessed_by_name: transferData.witnessedByName,
                    witnessed_by_title: transferData.witnessedByTitle
                }, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                });

                setSuccessMessage(response.data.message || "Item transferred successfully!");
                setIsSuccessDialogOpen(true);
                setIsTransferModalOpen(false);
                fetchItems();
            } catch (error) {
                console.error("Transfer failed:", error);
                let errorMessage = "Transfer failed. Please try again.";

                if (error.response) {
                    if (error.response.status === 422) {
                        errorMessage = error.response.data.message || errorMessage;
                    } else if (error.response.data && error.response.data.message) {
                        errorMessage = error.response.data.message;
                    }
                }

                setSuccessMessage(errorMessage);
                setIsSuccessDialogOpen(true);
            } finally {
                setProcessing(false);
            }
        };

        return (
            <Drawer
                isDrawerOpen={isTransferModalOpen}
                toggleDrawer={() => setIsTransferModalOpen(false)}
                title="Transfer Item"
                width="550px"
            >
                <form onSubmit={handleTransferSubmit} className="space-y-4">
                    {/* Quantity */}
                    <div>
                        <InputLabel value="Quantity to Transfer:" />
                        <TextInput
                            type="number"
                            min="1"
                            max={maxQuantity}
                            value={transferData.quantityToTransfer}
                            onChange={handleQuantityChange}
                            className="mt-1 block w-full"
                            required
                        />
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Available: {maxQuantity}
                        </div>
                    </div>

                    {/* Transfer To and Name/Designation */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <InputLabel value="Transfer to:" />
                            <TextInput
                                className="mt-1 block w-full"
                                value={transferData.transferTo}
                                onChange={(e) => handleInputChange("transferTo", e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <InputLabel value="Name/Designation:" />
                            <select
                                className="mt-1 block w-full dark:bg-gray-700 dark:text-gray-300"
                                value={transferData.nameDesignation}
                                onChange={(e) => handleInputChange("nameDesignation", e.target.value)}
                                required
                            >
                                <option value="">Select Name/Designation</option>
                                {signatories.map((signatory) => (
                                    <option key={signatory.id} value={signatory.name_designation}>
                                        {signatory.name_designation}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Position Intended */}
                    <div>
                        <InputLabel value="Position Intended:" />
                        <TextInput
                            className="mt-1 block w-full"
                            value={transferData.positionIntended}
                            readOnly
                            required
                        />
                    </div>

                    {/* Office Details */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <InputLabel value="Designated Office:" />
                            <TextInput
                                className="mt-1 block w-full"
                                value={transferData.designatedOffice}
                                onChange={(e) => handleInputChange("designatedOffice", e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <InputLabel value="Office Name/Designation:" />
                            <select
                                className="mt-1 block w-full dark:bg-gray-700 dark:text-gray-300"
                                value={transferData.officeNameDesignation}
                                onChange={(e) => handleInputChange("officeNameDesignation", e.target.value)}
                                required
                            >
                                <option value="">Select Office Name/Designation</option>
                                {signatories.map((signatory) => (
                                    <option key={signatory.id} value={signatory.name_designation}>
                                        {signatory.name_designation}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Office Position Intended */}
                    <div>
                        <InputLabel value="Office Position Intended:" />
                        <TextInput
                            className="mt-1 block w-full"
                            value={transferData.officePositionIntended}
                            readOnly
                            required
                        />
                    </div>

                    {/* Recommended By */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <InputLabel value="Recommended By:" />
                            <select
                                className="mt-1 block w-full dark:bg-gray-700 dark:text-gray-300"
                                value={transferData.recommendedByName}
                                onChange={(e) => handleInputChange("recommendedByName", e.target.value)}
                                required
                            >
                                <option value="">Select Recommended By</option>
                                {signatories.map((signatory) => (
                                    <option key={signatory.id} value={signatory.name_designation}>
                                        {signatory.name_designation}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <InputLabel value="Recommended By Title:" />
                            <TextInput
                                className="mt-1 block w-full"
                                value={transferData.recommendedByTitle}
                                readOnly
                                required
                            />
                        </div>
                    </div>

                    {/* Approved By */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <InputLabel value="Approved By:" />
                            <select
                                className="mt-1 block w-full dark:bg-gray-700 dark:text-gray-300"
                                value={transferData.approvedByName}
                                onChange={(e) => handleInputChange("approvedByName", e.target.value)}
                                required
                            >
                                <option value="">Select Approved By</option>
                                {signatories.map((signatory) => (
                                    <option key={signatory.id} value={signatory.name_designation}>
                                        {signatory.name_designation}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <InputLabel value="Approved By Title:" />
                            <TextInput
                                className="mt-1 block w-full"
                                value={transferData.approvedByTitle}
                                readOnly
                                required
                            />
                        </div>
                    </div>

                    {/* Witnessed By */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <InputLabel value="Witnessed By:" />
                            <select
                                className="mt-1 block w-full dark:bg-gray-700 dark:text-gray-300"
                                value={transferData.witnessedByName}
                                onChange={(e) => handleInputChange("witnessedByName", e.target.value)}
                                required
                            >
                                <option value="">Select Witnessed By</option>
                                {signatories.map((signatory) => (
                                    <option key={signatory.id} value={signatory.name_designation}>
                                        {signatory.name_designation}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <InputLabel value="Witnessed By Title:" />
                            <TextInput
                                className="mt-1 block w-full"
                                value={transferData.witnessedByTitle}
                                readOnly
                                required
                            />
                        </div>
                    </div>

                    <div className="mt-6">
                        <SecondaryButton
                            type="submit"
                            className="w-full h-10 rounded-sm"
                            disabled={processing}
                        >
                            {processing ? "Transferring..." : "Transfer Item"}
                        </SecondaryButton>
                    </div>
                </form>
            </Drawer>
        );
    };
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
                    estimated_life: item.estimated_life || "",
                    quantity: item.quantity || "",
                    price: item.price || "",
                    suppliers: item.suppliers || "", // Changed from 'supplier'
                    ics: item.ics || "",
                    pr: item.pr || "",
                    pr_date: item.pr_date || "",
                    po: item.po || "",
                    po_date: item.po_date || "",
                    vc: item.vc || "",
                    vc_date: item.vc_date || "",
                    ch: item.ch || "",
                    ch_date: item.ch_date || "",
                    or: item.or || "",
                    or_date: item.or_date || "",
                    date_purchase: item.date_purchase || "",
                    property_no: item.property_no || "",
                    classification_no: item.classification_no || "",
                    image: null,
                });

                setSelectedFileName(
                    item.image ? item.image.split("/").pop() : "Select file"
                );
            } else {
                reset();
                setSelectedFileName("Select file");
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setProcessing(true);

        const formData = new FormData();

        // Append all fields
        formData.append("categories", data.categories || "");
        formData.append("description", data.description || "");
        formData.append("items", data.items || "");
        formData.append("estimated_life", data.estimated_life || "");
        formData.append("quantity", data.quantity || 0);
        formData.append("price", data.price || 0);
        formData.append("suppliers", data.suppliers || ""); // Changed from 'supplier'
        formData.append("ics", data.ics || "");
        formData.append("pr", data.pr || "");
        formData.append("pr_date", data.pr_date || "");
        formData.append("po", data.po || "");
        formData.append("po_date", data.po_date || "");
        formData.append("vc", data.vc || "");
        formData.append("vc_date", data.vc_date || "");
        formData.append("ch", data.ch || "");
        formData.append("ch_date", data.ch_date || "");
        formData.append("or", data.or || "");
        formData.append("or_date", data.or_date || "");
        formData.append("property_no", data.property_no || "");
        formData.append("classification_no", data.classification_no || "");
        formData.append("date_purchase", data.date_purchase || "");

        if (data.image instanceof File) {
            formData.append("image", data.image);
        }

        try {
            if (!data.id) {
                const response = await axios.post(route("items.store"), formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });

                // Handle success
                toggleDrawer(false);
                reset();
                fetchItems();
                setSuccessMessage("Item added successfully!");
                setIsSuccessDialogOpen(true);
            } else {
                formData.append("_method", "PUT");
                const response = await axios.post(route("items.update", { id: data.id }), formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });

                // Handle success
                toggleDrawer(false);
                reset();
                setSelectedFileName("Select file");
                setItems(prevItems =>
                    prevItems.map(item => item.id === data.id ? response.data.item : item)
                );
                setSuccessMessage("Item successfully updated!");
                setIsSuccessDialogOpen(true);
            }
        } catch (error) {
            console.error("Error saving item:", error);
            setSuccessMessage(error.response?.data?.message || "Error saving item");
            setIsSuccessDialogOpen(true);
        } finally {
            setProcessing(false);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData("image", file);
            setSelectedFileName(file.name);
        } else {
            setSelectedFileName("Select file");
        }
    };

    //Fetching Data

    const fetchItems = async () => {
        try {
            const response = await axios.get(route("items.index"));
            // Filter out items with quantity 0
            const filtered = response.data.items.filter(item => item.quantity > 0);
            setItems(filtered);
            setFilteredItems(filtered);
        } catch (error) {
            console.error("Error fetching items:", error);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [categoriesResponse, suppliersResponse, itemsResponse] =
                    await Promise.all([
                        axios.get(route("categories")),
                        axios.get(route("suppliers.index")),
                        axios.get(route("items.index")),
                    ]);

                console.log("Categories Data:", categoriesResponse.data);
                console.log("Suppliers Data:", suppliersResponse.data);
                console.log("Items Data:", itemsResponse.data);

                setCategories(categoriesResponse.data.categories || []);
                setSuppliers(suppliersResponse.data.suppliers || []);
                // Filter out items with quantity 0
                const filteredItems = itemsResponse.data.items.filter(item => item.quantity > 0);
                setItems(filteredItems || []);
                setFilteredItems(filteredItems || []);
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };

        fetchData();
    }, []);

    const fetchItem = async (id) => {
        try {
            const response = await axios.get(route("items.edit", { id }));
            const item = response.data.item;
            toggleDrawer(true, true, item);
        } catch (error) {
            console.error("Error fetching item:", error);
        }
    };

    //Filtering Items
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [showDateRangePicker, setDateRangeShowPicker] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState("");
    const handleCategoryChange = (event) => {
        setSelectedCategory(event.target.value);
    };

    useEffect(() => {
        if (items.length === 0) return;

        const filtered = items.filter((item) => {
            const itemDate = new Date(item.created_at);

            // Create a copy of endDate to avoid mutating state
            const adjustedEndDate = endDate ? new Date(endDate) : null;
            adjustedEndDate?.setHours(23, 59, 59, 999);

            const isInRange =
                (!startDate || itemDate >= startDate) &&
                (!adjustedEndDate || itemDate <= adjustedEndDate);

            const matchesCategory =
                !selectedCategory || item.categories === selectedCategory;

            const matchesSearch =
                item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.department
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                item.categories
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                item.description
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                item.items.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.suppliers.toLowerCase().includes(searchTerm.toLowerCase());

            // Keep the quantity > 0 check here as well
            return item.quantity > 0 && matchesSearch && isInRange && matchesCategory;
        });

        setFilteredItems(filtered);
        setCurrentPage(1);
    }, [searchTerm, startDate, endDate, selectedCategory, items]);



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

     //Pagination Logic

     const userFilteredItems = (basicUser
        ? filteredItems.filter(item => item.user_id === currentUser.id)
        : checkRole(currentUser, ["Admin"])
        ? filteredItems.filter(item => item.department === currentUser.department)
        : filteredItems
    ).filter(item => item.quantity > 0); // Add this filter

     const [itemsPerPage, setItemsPerPage] = useState(5);
     const totalPages = Math.ceil(userFilteredItems.length / itemsPerPage);
     const isSelectAllChecked = selectedItems.length === filteredItems.length;

     const paginatedItems = useMemo(() => {
         const startIndex = (currentPage - 1) * itemsPerPage;
         return userFilteredItems.slice(startIndex, startIndex + itemsPerPage);
     }, [userFilteredItems, currentPage, itemsPerPage]);

     const sortedPaginatedItems = [...paginatedItems].sort(
         (a, b) => new Date(b.created_at) - new Date(a.created_at)
     );

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

    //Table Headers and Rows Mapping

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
        { label: "Image", key: "image" },
        { label: "Category", key: "categories" },
        { label: "Item", key: "items" },
        { label: "Description", key: "description" },
        { label: "Life_Span", key: "estimated_life" },
        { label: "Quantity", key: "quantity" },
        { label: "Remaining Quantity", key: "remaining_quantity" },
        { label: "Amount", key: "price" },
        { label: "Supplier", key: "suppliers" },
        { label: "ICS_#", key: "ics" },
        { label: "PR_#", key: "pr" },
        { label: "PR_Date", key: "pr_date" },
        { label: "PO_#", key: "po" },
        { label: "PO_Date", key: "po_date" },
        { label: "VC_#", key: "vc" },
        { label: "VC_Date", key: "vc_date" },
        { label: "CH_#", key: "ch" },
        { label: "CH_Date", key: "ch_date" },
        { label: "OR_#", key: "or" },
        { label: "OR_Date", key: "or_date" },
        { label: "Property No.", key: "property_no" },
        { label: "Classification No.", key: "classification_no" },
        { label: "Date Purchase", key: "date_purchase" },
        { label: "Created_At", key: "created_at" },
        { label: "Updated_At", key: "updated_at" },
    ];

    const rows = sortedPaginatedItems.map((item, index) => {
        let parsedPrDate = item.pr_date
            ? parse(item.pr_date, "yyyy-MM-dd", new Date())
            : null;
            let parsedDatePurchase = item.date_purchase  // Add this line
            ? parse(item.date_purchase, "yyyy-MM-dd", new Date())
            : null;
        let row = {
            id: item.id,
            select: (
                <Checkbox
                    checked={selectedItems.includes(item.id)}
                    onChange={() => handleCheckboxChange(item)}
                />
            ),
            index: index + 1 + (currentPage - 1) * itemsPerPage,
            image: item.image ? item.image.split("/").pop() : "N/A",
            categories: item.categories ?? "N/A",
            items: item.items ?? "N/A",
            description: (
                <div
                    className="ql-editor ql-snow w-[250px] whitespace-normal"
                    dangerouslySetInnerHTML={{ __html: item.description }}
                />
            ),
            estimated_life: item.estimated_life ?? "N/A",
            quantity: item.quantity ?? 0,
            remaining_quantity: item.remaining_quantity ?? item.quantity ?? 0,
            price: item.price ? `₱ ${item.price}` : "N/A",
            suppliers: item.suppliers ?? "N/A",
            ics: item.ics ?? "N/A",
            pr: item.pr ?? "N/A",
            pr_date:
                parsedPrDate && !isNaN(parsedPrDate)
                    ? format(parsedPrDate, "MM/dd/yyyy")
                    : "N/A",
            po: item.po ?? "N/A",
            po_date: item.po_date
                ? format(parse(item.po_date, "yyyy-MM-dd", new Date()), "MM/dd/yyyy")
                : "N/A",
            vc: item.vc ?? "N/A",
            vc_date: item.vc_date
                ? format(parse(item.vc_date, "yyyy-MM-dd", new Date()), "MM/dd/yyyy")
                : "N/A",
            ch: item.ch ?? "N/A",
            ch_date: item.ch_date
                ? format(parse(item.ch_date, "yyyy-MM-dd", new Date()), "MM/dd/yyyy")
                : "N/A",
            or: item.or ?? "N/A",
            or_date: item.or_date
                ? format(parse(item.or_date, "yyyy-MM-dd", new Date()), "MM/dd/yyyy")
                : "N/A",
            property_no: item.property_no ?? "N/A",
            classification_no: item.classification_no ?? "N/A",
            date_purchase: parsedDatePurchase && !isNaN(parsedDatePurchase)
                    ? format(parsedDatePurchase, "MM/dd/yyyy")
                    : "N/A",
            created_at: item.created_at
                ? new Date(item.created_at).toLocaleString()
                : "N/A",
            updated_at: item.updated_at
                ? new Date(item.updated_at).toLocaleString()
                : "N/A",
        };

        // Remove the "name" and "department" properties for Basic users.
        if (basicUser) {
            delete row.name;
            delete row.department;
        }

        return row;
    });

    //Select Option for Categories
    const categoryOptions = categories.map((category) => ({
        label: category.name,
        value: category.name,
    }));

    const supplierOptions = suppliers.map((supplier) => ({
        label: supplier.name,
        value: supplier.name,
    }));

    //Action Buttons for Items
    const actions = (row) => (
        <Dropdown className="">
            <Dropdown.Trigger>
                <SettingsIcon className="cursor-pointer text-gray-600 dark:text-gray-300" />
            </Dropdown.Trigger>
            <Dropdown.Content contentClasses="relative py-1 right-7 top-[-100px] bg-gray-100 dark:bg-gray-700">
                <Dropdown.Link
                    onClick={(e) => {
                        e.preventDefault();
                        let imageSrc =
                            row.image !== "N/A"
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
        setTransferItemId(row.id);
        setIsTransferModalOpen(true);
    }}
>
    Transfer Item
</Dropdown.Link>
            {checkRole(user, ["Super Admin"]) && (
                <Dropdown.Link
                    onClick={(e) => {
                        e.preventDefault();
                        confirmDelete(row.id);
                    }}
                >
                    Delete
                </Dropdown.Link>
            )}
        </Dropdown.Content>
    </Dropdown>
);

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    Item List
                </h2>
            }
        >
            <Head title="Item List" />

            {/* Main Content */}
            <div className="px-4 py-4 bg-white ring-1 ring-black/10 sm:rounded-lg dark:bg-gray-800/40 relative">
                        <div className="w-full mb-3  flex justify-between items-center gap-4 flex-wrap">
                            {/* Search and Date Range Picker */}
                            <div className="flex gap-2 items-center ">
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    className="dark:placeholder-gray-300 placeholder-gray-600 dark:text-gray-300 border border-black/20 dark:border-white bg-transparent rounded-sm px-4 py-1 focus:outline-none focus:ring-none dark:focus:border-white"
                                    onChange={(e) =>
                                        setSearchTerm(e.target.value)
                                    }
                                />

                                <select
                                    className="border border-black/20 dark:border-white py-1 rounded-sm text-md  text-gray-600 dark:text-gray-300 bg-transparent cursor-pointer w-[245px]"
                                    value={selectedCategory}
                                    onChange={handleCategoryChange}
                                >
                                    <option
                                        className="text-md dark:bg-gray-800 "
                                        value=""
                                    >
                                        Filter Category
                                    </option>
                                    {categoryOptions.map((option, index) => (
                                        <option
                                            key={index}
                                            value={option.value}
                                            className="dark:bg-gray-800 dark:text-gray-300"
                                        >
                                            {option.label}
                                        </option>
                                    ))}
                                </select>

                                {/* Date Range Picker Input */}
                                <div className="relative">
                                    <select
                                        onClick={() =>
                                            setDateRangeShowPicker(
                                                !showDateRangePicker
                                            )
                                        }
                                        className="border border-black/20 dark:border-white py-1 rounded-sm text-gray-700 dark:text-gray-300 bg-transparent cursor-pointer w-[245px]"
                                    >
                                        {" "}
                                        <option hidden value="">
                                            {startDate && endDate
                                                ? `${format(
                                                      startDate,
                                                      "MM/dd/yyyy"
                                                  )} - ${format(
                                                      endDate,
                                                      "MM/dd/yyyy"
                                                  )}`
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
                            <div className="flex flex-wrap items-center">
                                <div className="pr-2 flex gap-2 items-center">
                                    <div className="font-semibold text-gray-600 dark:text-gray-300">
                                        Rows per page:
                                        <select
                                            className="ml-2 border border-black/20 dark:border-white py-1 rounded-sm text-md text-gray-600 dark:text-gray-300 bg-transparent cursor-pointer w-[70px]"
                                            value={itemsPerPage}
                                            onChange={handleRowsPerPageChange}
                                        >
                                            {[5, 10, 15].map((num) => (
                                                <option
                                                    key={num}
                                                    className="dark:bg-gray-800 dark:text-gray-300"
                                                    value={num}
                                                >
                                                    {num}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    {checkRole(user, ["Super Admin"]) && (
                                        <>
                                            <CiExport
                                                onClick={() =>
                                                    exportToCSV(
                                                        items,
                                                        "items_export.csv"
                                                    )
                                                }
                                                className="text-2xl stroke-[1] text-gray-600 dark:text-gray-300 cursor-pointer flex-shrink-0"
                                            />
                                            <CiImport
                                                className="text-2xl stroke-[1] text-gray-600 dark:text-gray-300 cursor-pointer flex-shrink-0"
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
                                        </>
                                        )}
                                    </div>

                                <div className="pl-2 border-l border-gray-500 flex gap-2 items-center">
                                {checkRole(user, ["Super Admin"]) && (
                                        <>
                                    <DeleteIcon
                                        className={`text-gray-600 dark:text-gray-300 cursor-pointer ${
                                            selectedItems.length < 2
                                                ? "opacity-50 pointer-events-none"
                                                : ""
                                        }`}
                                        onClick={() => confirmDelete()}
                                        disabled={selectedItems.length < 2}
                                    />
                                    </>
                                    )}
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


            {/* Drawer for Item */}
            <Drawer
                isDrawerOpen={isDrawerOpen}
                toggleDrawer={toggleDrawer}
                title={isEditMode ? "Edit Item" : "Add Item"}
                width="550px"
            >
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
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
                                <InputError
                                    message={errors.image}
                                    className="mt-2"
                                />
                            </div>

                            <div className="mt-4">
                                <InputLabel
                                    htmlFor="categories"
                                    value="Category"
                                />
                                <SelectOption
                                    id="categories"
                                    className="mt-2 block w-full h-10 rounded-sm text-sm"
                                    placeholder="Select category"
                                    options={categoryOptions}
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
                                    className="mt-2 block w-full h-10 rounded-sm text-sm"
                                    value={data.items}
                                    onChange={(e) =>
                                        setData("items", e.target.value)
                                    }
                                />
                                <InputError
                                    message={errors.items}
                                    className="mt-2"
                                />
                            </div>
                            <div className="mt-4">
                                <InputLabel
                                    htmlFor="description"
                                    value="Description"
                                />
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
                                <InputLabel
                                    htmlFor="estimated_life"
                                    value="Life_Span"
                                />
                                <TextInput
                                    id="quantity"
                                    className="mt-2 block w-full h-10 rounded-sm text-sm"
                                    value={data.estimated_life}
                                    onChange={(e) =>
                                        setData(
                                            "estimated_life",
                                            e.target.value
                                        )
                                    }
                                />
                                <InputError
                                    message={errors.estimated_life}
                                    className="mt-2"
                                />
                            </div>
                            <div className="mt-4">
                                <InputLabel
                                    htmlFor="quantity"
                                    value="Quantity"
                                />
                                <TextInput
                                    id="quantity"
                                    className="mt-2 block w-full h-10 rounded-sm text-sm"
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
                                    className="mt-2 block w-full h-10 rounded-sm text-sm"
                                    value={data.price}
                                    onChange={(e) =>
                                        setData("price", e.target.value)
                                    }
                                />
                                <InputError
                                    message={errors.price}
                                    className="mt-2"
                                />
                            </div>

                            <div className="mt-2.5">
                                <InputLabel
                                    htmlFor="suppliers"
                                    value="Supplier"
                                />
<SelectOption
    id="suppliers"
    className="mt-2 block w-full h-10 rounded-sm text-sm"
    placeholder="Select supplier"
    options={supplierOptions}
    value={data.suppliers || ""} // Changed from 'supplier'
    onChange={(e) => setData("suppliers", e.target.value)}
/>
                                <InputError
                                    message={errors.suppliers}
                                    className="mt-2"
                                />
                            </div>

                            <div className="mt-2">
                                <InputLabel htmlFor="ics" value="ICS #" />
                                <TextInput
                                    id="ics"
                                    className="mt-2 block w-full h-10 rounded-sm text-sm"
                                    value={data.ics}
                                    onChange={(e) =>
                                        setData("ics", e.target.value)
                                    }
                                />
                                <InputError
                                    message={errors.ics}
                                    className="mt-2"
                                />
                            </div>
                                  {/* Add these new fields in the right column of your form */}
<div className="mt-4">
    <InputLabel htmlFor="property_no" value="Property No." />
    <TextInput
        id="property_no"
        className="mt-2 block w-60 h-10 rounded-sm text-sm"
        value={data.property_no}
        onChange={(e) => setData("property_no", e.target.value)}
    />
    <InputError message={errors.property_no} className="mt-2" />
</div>

<div className="mt-4">
    <InputLabel htmlFor="classification_no" value="Classification No." />
    <TextInput
        id="classification_no"
        className="mt-2 block w-60 h-10 rounded-sm text-sm"
        value={data.classification_no}
        onChange={(e) => setData("classification_no", e.target.value)}
    />
    <InputError message={errors.classification_no} className="mt-2" />
</div>


                        </div>
                        <div>
                            <div className="mt-2">
                                <InputLabel htmlFor="pr" value="PR #" />
                                <TextInput
                                    id="pr"
                                    className="mt-2 block w-60 h-10 rounded-sm text-sm"
                                    value={data.pr}
                                    onChange={(e) =>
                                        setData("pr", e.target.value)
                                    }
                                />
                                <InputError
                                    message={errors.pr}
                                    className="mt-2"
                                />
                            </div>
                            <div className="mt-4 w-60">
                                <InputLabel htmlFor="pr_date" value="PR Date" />
                                <div className="relative">
                                    <select
                                        className="px-3 w-60 h-10 mt-2 block border dark:bg-gray-900 border-black/20 dark:border-gray-700
                rounded-sm text-sm text-gray-700 dark:text-gray-200 bg-transparent cursor-pointer flex items-center"
                                        onClick={() =>
                                            toggleDatePicker("pr_date")
                                        }
                                    >
                                        <option hidden value="">
                                            {data.pr_date
                                                ? format(
                                                      parse(
                                                          data.pr_date,
                                                          "yyyy-MM-dd",
                                                          new Date()
                                                      ),
                                                      "MM/dd/yyyy"
                                                  )
                                                : "Select date"}
                                        </option>
                                    </select>
                                    {activeDatePicker === "pr_date" && (
                                        <div className="absolute z-50">
                                            <DatePicker
                                                selected={
                                                    data.pr_date
                                                        ? parse(
                                                              data.pr_date,
                                                              "yyyy-MM-dd",
                                                              new Date()
                                                          )
                                                        : null
                                                }
                                                onChange={(date) => {
                                                    setData(
                                                        "pr_date",
                                                        format(
                                                            date,
                                                            "yyyy-MM-dd"
                                                        )
                                                    );
                                                    setActiveDatePicker(null);
                                                }}
                                                inline
                                                calendarClassName="dark:bg-gray-800 pb-7"
                                            />
                                        </div>
                                    )}
                                </div>
                                <InputError
                                    message={errors.date}
                                    className="mt-2"
                                />
                            </div>

                            <div className="mt-4">
                                <InputLabel htmlFor="po#" value="P.O #" />
                                <TextInput
                                    id="po"
                                    className="mt-2 block w-60 h-10 rounded-sm text-sm"
                                    value={data.po}
                                    onChange={(e) =>
                                        setData("po", e.target.value)
                                    }
                                />
                                <InputError
                                    message={errors.po}
                                    className="mt-2"
                                />
                            </div>
                            <div className="mt-4 w-60">
                                <InputLabel
                                    htmlFor="po_date"
                                    value="P.O Date"
                                />
                                <div className="relative">
                                    <select
                                        className="px-3 w-60 h-10 mt-2 block border dark:bg-gray-900 border-black/20 dark:border-gray-700
                                         rounded-sm text-sm text-gray-700 dark:text-gray-200 bg-transparent cursor-pointer flex items-center"
                                        onClick={() =>
                                            toggleDatePicker("po_date")
                                        }
                                    >
                                        <option hidden value="">
                                            {data.po_date
                                                ? format(
                                                      parse(
                                                          data.po_date,
                                                          "yyyy-MM-dd",
                                                          new Date()
                                                      ),
                                                      "MM/dd/yyyy"
                                                  )
                                                : "Select date"}
                                        </option>
                                    </select>
                                    {activeDatePicker === "po_date" && (
                                        <div className="absolute z-50">
                                            <DatePicker
                                                selected={
                                                    data.po_date
                                                        ? parse(
                                                              data.po_date,
                                                              "yyyy-MM-dd",
                                                              new Date()
                                                          )
                                                        : null
                                                }
                                                onChange={(date) => {
                                                    setData(
                                                        "po_date",
                                                        format(
                                                            date,
                                                            "yyyy-MM-dd"
                                                        )
                                                    );
                                                    setActiveDatePicker(null);
                                                }}
                                                inline
                                                calendarClassName="dark:bg-gray-800 pb-7"
                                            />
                                        </div>
                                    )}
                                </div>
                                <InputError
                                    message={errors.po_date}
                                    className="mt-2"
                                />
                            </div>
                            <div className="mt-2">
                                <InputLabel htmlFor="vc#" value="V.C #" />
                                <TextInput
                                    id="vc"
                                    className="mt-2 block w-60 h-10 rounded-sm text-sm"
                                    value={data.vc}
                                    onChange={(e) =>
                                        setData("vc", e.target.value)
                                    }
                                />
                                <InputError
                                    message={errors.vc}
                                    className="mt-2"
                                />
                            </div>

                            <div className="mt-4 w-60">
                                <InputLabel
                                    htmlFor="vc_date"
                                    value="V.C Date"
                                />
                                <div className="relative">
                                    <select
                                        className="px-3 w-60 h-10 mt-2 block border dark:bg-gray-900 border-black/20 dark:border-gray-700
                                         rounded-sm text-sm text-gray-700 dark:text-gray-200 bg-transparent cursor-pointer flex items-center"
                                        onClick={() =>
                                            toggleDatePicker("vc_date")
                                        }
                                    >
                                        <option hidden value="">
                                            {data.vc_date
                                                ? format(
                                                      parse(
                                                          data.vc_date,
                                                          "yyyy-MM-dd",
                                                          new Date()
                                                      ),
                                                      "MM/dd/yyyy"
                                                  )
                                                : "Select date"}
                                        </option>
                                    </select>
                                    {activeDatePicker === "vc_date" && (
                                        <div className="absolute z-50">
                                            <DatePicker
                                                selected={
                                                    data.vc_date
                                                        ? parse(
                                                              data.vc_date,
                                                              "yyyy-MM-dd",
                                                              new Date()
                                                          )
                                                        : null
                                                }
                                                onChange={(date) => {
                                                    setData(
                                                        "vc_date",
                                                        format(
                                                            date,
                                                            "yyyy-MM-dd"
                                                        )
                                                    );
                                                    setActiveDatePicker(null);
                                                }}
                                                inline
                                                calendarClassName="dark:bg-gray-800 pb-7"
                                            />
                                        </div>
                                    )}
                                </div>
                                <InputError
                                    message={errors.vc_date}
                                    className="mt-2"
                                />
                            </div>
                            <div className="mt-4">
                                <InputLabel htmlFor="ch" value="CH #" />
                                <TextInput
                                    id="ch"
                                    className="mt-2 block w-60 h-10 rounded-sm text-sm"
                                    value={data.ch}
                                    onChange={(e) =>
                                        setData("ch", e.target.value)
                                    }
                                />
                                <InputError
                                    message={errors.ch}
                                    className="mt-2"
                                />
                            </div>
                            <div className="mt-4 w-60">
                                <InputLabel htmlFor="ch_date" value="CH Date" />
                                <div className="relative">
                                    <select
                                        className="px-3 w-60 h-10 mt-2 block border dark:bg-gray-900 border-black/20 dark:border-gray-700
                                         rounded-sm text-sm text-gray-700 dark:text-gray-200 bg-transparent cursor-pointer flex items-center"
                                        onClick={() =>
                                            toggleDatePicker("ch_date")
                                        }
                                    >
                                        <option hidden value="">
                                            {data.ch_date
                                                ? format(
                                                      parse(
                                                          data.ch_date,
                                                          "yyyy-MM-dd",
                                                          new Date()
                                                      ),
                                                      "MM/dd/yyyy"
                                                  )
                                                : "Select date"}
                                        </option>
                                    </select>
                                    {activeDatePicker === "ch_date" && (
                                        <div className="absolute z-50">
                                            <DatePicker
                                                selected={
                                                    data.ch_date
                                                        ? parse(
                                                              data.ch_date,
                                                              "yyyy-MM-dd",
                                                              new Date()
                                                          )
                                                        : null
                                                }
                                                onChange={(date) => {
                                                    setData(
                                                        "ch_date",
                                                        format(
                                                            date,
                                                            "yyyy-MM-dd"
                                                        )
                                                    );
                                                    setActiveDatePicker(null);
                                                }}
                                                inline
                                                calendarClassName="dark:bg-gray-800 pb-7"
                                            />
                                        </div>
                                    )}
                                </div>
                                <InputError
                                    message={errors.ch_date}
                                    className="mt-2"
                                />
                            </div>
                            <div className="mt-2">
                                <InputLabel htmlFor="or" value="OR #" />
                                <TextInput
                                    id="or"
                                    className="mt-2 block w-60 h-10 rounded-sm text-sm"
                                    value={data.or}
                                    onChange={(e) =>
                                        setData("or", e.target.value)
                                    }
                                />
                                <InputError
                                    message={errors.or}
                                    className="mt-2"
                                />
                            </div>
                            <div className="mt-2 w-60">
                                <InputLabel htmlFor="or_date" value="OR Date" />
                                <div className="relative">
                                    <select
                                        className="px-3 w-60 h-10 mt-2 block border dark:bg-gray-900 border-black/20 dark:border-gray-700
                                         rounded-sm text-sm text-gray-700 dark:text-gray-200 bg-transparent cursor-pointer flex items-center"
                                        onClick={() =>
                                            toggleDatePicker("or_date")
                                        }
                                    >
                                        <option hidden value="">
                                            {data.or_date
                                                ? format(
                                                      parse(
                                                          data.or_date,
                                                          "yyyy-MM-dd",
                                                          new Date()
                                                      ),
                                                      "MM/dd/yyyy"
                                                  )
                                                : "Select date"}
                                        </option>
                                    </select>
                                    {activeDatePicker === "or_date" && (
                                        <div className="absolute z-50">
                                            <DatePicker
                                                selected={
                                                    data.or_date
                                                        ? parse(
                                                              data.or_date,
                                                              "yyyy-MM-dd",
                                                              new Date()
                                                          )
                                                        : null
                                                }
                                                onChange={(date) => {
                                                    setData(
                                                        "or_date",
                                                        format(
                                                            date,
                                                            "yyyy-MM-dd"
                                                        )
                                                    );
                                                    setActiveDatePicker(null);
                                                }}
                                                inline
                                                calendarClassName="dark:bg-gray-800 pb-7"
                                            />
                                        </div>
                                    )}
                                </div>
                                <InputError
                                    message={errors.or_date}
                                    className="mt-2"
                                />
                            </div>
                            <div className="mt-4 w-60">
    <InputLabel htmlFor="date_purchase" value="Date Purchase" />
    <div className="relative">
        <select
            className="px-3 w-60 h-10 mt-2 block border dark:bg-gray-900 border-black/20 dark:border-gray-700
            rounded-sm text-sm text-gray-700 dark:text-gray-200 bg-transparent cursor-pointer flex items-center"
            onClick={() => toggleDatePicker("date_purchase")}
        >
            <option hidden value="">
                {data.date_purchase
                    ? format(parse(data.date_purchase, "yyyy-MM-dd", new Date()), "MM/dd/yyyy")
                    : "Select date"}
            </option>
        </select>
        {activeDatePicker === "date_purchase" && (
            <div className="absolute z-50">
                <DatePicker
                    selected={data.date_purchase ? parse(data.date_purchase, "yyyy-MM-dd", new Date()) : null}
                    onChange={(date) => {
                        setData("date_purchase", format(date, "yyyy-MM-dd"));
                        setActiveDatePicker(null);
                    }}
                    inline
                    calendarClassName="dark:bg-gray-800 pb-7"
                />
            </div>
        )}
    </div>
    <InputError message={errors.date_purchase} className="mt-2" />
</div>
                        </div>
                    </div>

                    <div className="mt-6">
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
            <TransferDrawer />
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
