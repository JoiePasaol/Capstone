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
                    supplier: item.supplier || "",
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
        formData.append("categories", data.categories || "");
        formData.append("description", data.description || "");
        formData.append("items", data.items || "");
        formData.append("estimated_life", data.estimated_life || "");
        formData.append("quantity", data.quantity || 0);
        formData.append("price", data.price || 0);
        formData.append("supplier", data.supplier || "");
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
                    setSelectedFileName("Select file");

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
            setSelectedFileName("Select file");
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
                setItems(itemsResponse.data.items || []);
                setFilteredItems(itemsResponse.data.items || []);
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

            return matchesSearch && isInRange && matchesCategory;
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
    
     const userFilteredItems = basicUser
     ? filteredItems.filter(item => item.user_id === currentUser.id) 
     : checkRole(currentUser, ["Admin"]) 
     ? filteredItems.filter(item => item.department === currentUser.department)
     : filteredItems; 
 
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
        ...(!basicUser
            ? [
                  { label: "Name", key: "name" },
                  { label: "Department", key: "department" },
              ]
            : []),
        { label: "Image", key: "image" },
        { label: "Category", key: "categories" },
        { label: "Item", key: "items" },
        { label: "Description", key: "description" },
        { label: "Life_Span", key: "estimated_life" },
        { label: "Quantity", key: "quantity" },
        { label: "Remaining", key: "remaining" },
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
        { label: "Created_At", key: "created_at" },
        { label: "Updated_At", key: "updated_at" },
    ];

    const rows = sortedPaginatedItems.map((item, index) => {
        let parsedPrDate = item.pr_date
            ? parse(item.pr_date, "yyyy-MM-dd", new Date())
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
            name: item.name,
            department: item.department ?? "N/A",
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
            remaining: item.quantity ?? 0,
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
            <Dropdown.Content contentClasses="relative py-1 right-7 top-[-90px] bg-gray-100 dark:bg-gray-700">
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
                {checkRole(user, ["Super Admin"]) && (
                <>
                <Dropdown.Link
                    onClick={(e) => {
                        e.preventDefault();
                        confirmDelete(row.id);
                    }}
                >
                    Delete
                </Dropdown.Link>
                </>
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
                                    value={data.suppliers || ""}
                                    onChange={(e) =>
                                        setData("suppliers", e.target.value)
                                    }
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
