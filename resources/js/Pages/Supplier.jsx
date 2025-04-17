import { Head, useForm, usePage } from "@inertiajs/react";
import { useState, useEffect, useMemo } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import Table from "@/Components/Table";
import Dropdown from "@/Components/Dropdown";
import Checkbox from "@/Components/Checkbox";
import SettingsIcon from "@mui/icons-material/Settings";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import Drawer from "@/Components/Drawer";
import InputLabel from "@/Components/InputLabel";
import InputError from "@/Components/InputError";
import TextInput from "@/Components/TextInput";
import SecondaryButton from "@/Components/SecondaryButton";
import Pagination from "@/Components/Pagination";
import ConfirmationDialog from "@/Components/ConfirmationDialog";
import SuccessDialog from "@/Components/SuccessDialog";

export default function Supplier() {

    // Extract user authentication information
    const { user } = usePage().props.auth;

    //Drawer Management
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);

    //Dialog Management
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
    const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
    const [confirmMessage, setConfirmMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const { data, setData, post, reset, errors, setError } = useForm({
        name: "",
        address: "",
        mobile_number: "",
        email: "",
    });
    

    const [processing, setProcessing] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [suppliers, setSuppliers] = useState([]);
    const [filteredSuppliers, setFilteredSuppliers] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedSuppliers, setSelectedSuppliers] = useState([]);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const itemsPerPage = 5;

    const fetchSuppliers = () => {
        axios
            .get(route("suppliers.index"))
            .then((response) => {
                setSuppliers(response.data.suppliers);
                setFilteredSuppliers(response.data.suppliers);
            })
            .catch((error) =>
                console.error("Error fetching suppliers:", error)
            );
    };

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const toggleDrawer = (open, isEdit = false, item = null) => {
        setIsDrawerOpen(open);
        setIsEditMode(isEdit);

        if (open) {
            if (isEdit && item) {
                setData({
                    id: item.id,
                    name: item.name || "",
                    address: item.address || "",
                    mobile_number: item.mobile_number || "",
                    email: item.email || "",
                });
            } else {
                reset();
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setProcessing(true);
    
        if (!data.id) {
            // Create new supplier
            axios
                .post(route("suppliers.store"), data)
                .then((response) => {
                    setSuppliers((prev) => [...prev, response.data.supplier]);
                    setFilteredSuppliers((prev) => [
                        ...prev,
                        response.data.supplier,
                    ]);
                    toggleDrawer(false);
                    reset();
                    setSuccessMessage("Supplier successfully added!");
                    setIsSuccessDialogOpen(true);
                })
                .catch((error) => {
                    if (error.response?.status === 422) {
                        setError(error.response.data.errors); // 👈 Set validation errors
                    }
                })
                .finally(() => {
                    setProcessing(false);
                });
        } else {
            // Update supplier
            axios
                .put(route("suppliers.update", { id: data.id }), {
                    ...data,
                    _method: "PUT",
                })
                .then((response) => {
                    setSuppliers((prev) =>
                        prev.map((s) =>
                            s.id === response.data.supplier.id
                                ? response.data.supplier
                                : s
                        )
                    );
                    setFilteredSuppliers((prev) =>
                        prev.map((s) =>
                            s.id === response.data.supplier.id
                                ? response.data.supplier
                                : s
                        )
                    );
                    toggleDrawer(false);
                    reset();
                    setSuccessMessage("Supplier successfully updated!");
                    setIsSuccessDialogOpen(true);
                })
                .catch((error) => {
                    if (error.response?.status === 422) {
                        setError(error.response.data.errors); // 👈 Again for update
                    }
                })
                .finally(() => {
                    setProcessing(false);
                });
        }
    };
    

    useEffect(() => {
        if (!Array.isArray(suppliers) || suppliers.length === 0) return;

        const searchLower = searchTerm.toLowerCase();
        const filtered = suppliers
            .filter((supplier) => supplier && supplier.name)
            .filter(
                (supplier) =>
                    supplier.name.toLowerCase().includes(searchLower) ||
                    supplier.email.toLowerCase().includes(searchLower)
            );

        setFilteredSuppliers(filtered);
        setCurrentPage(1);
    }, [searchTerm, suppliers]);

    const totalPages = Math.ceil(filteredSuppliers.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    const paginatedSuppliers = useMemo(() => {
        if (!Array.isArray(filteredSuppliers)) return [];
        return filteredSuppliers.slice(startIndex, endIndex);
    }, [filteredSuppliers, currentPage, itemsPerPage]);

    const handleSelectAll = () => {
        if (selectedSuppliers.length === filteredSuppliers.length) {
            setSelectedSuppliers([]);
        } else {
            setSelectedSuppliers(
                filteredSuppliers.map((supplier) => supplier.id)
            );
        }
    };

    const handleCheckboxChange = (supplier) => {
        setSelectedSuppliers((prev) =>
            prev.includes(supplier.id)
                ? prev.filter((id) => id !== supplier.id)
                : [...prev, supplier.id]
        );
    };

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    const confirmDelete = (id = null) => {
        const count = id ? 1 : selectedSuppliers.length;

        setConfirmMessage(
            count === 1
                ? "Are you sure you want to delete this supplier?"
                : `Are you sure you want to delete these (${count}) suppliers?`
        );

        setDeleteTarget(id ? [id] : [...selectedSuppliers]);
        setIsConfirmDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!deleteTarget || deleteTarget.length === 0) return;

        try {
            await axios.post(route("suppliers.bulk-destroy"), {
                ids: deleteTarget,
            });

            fetchSuppliers(); // ✅ Fetch updated supplier list
            setSelectedSuppliers([]);
            setDeleteTarget(null);
            setIsConfirmDialogOpen(false);

            setTimeout(() => {
                setSuccessMessage(
                    deleteTarget.length === 1
                        ? "Supplier successfully deleted!"
                        : `(${deleteTarget.length}) Suppliers successfully deleted!`
                );
                setIsSuccessDialogOpen(true);
            }, 100);
        } catch (error) {
            console.error("Error deleting suppliers:", error);
        }
    };

    const isSelectAllChecked =
        selectedSuppliers.length === filteredSuppliers.length &&
        filteredSuppliers.length > 0;

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
        { label: "Address", key: "address" },
        { label: "Mobile No.", key: "mobile_number" },
        { label: "Email", key: "email" },
    ];

    const rows = paginatedSuppliers.map((supplier, index) => ({
        id: supplier.id,
        select: (
            <Checkbox
                checked={selectedSuppliers.includes(supplier.id)}
                onChange={() => handleCheckboxChange(supplier)}
            />
        ),
        index: index + 1 + (currentPage - 1) * itemsPerPage,
        name: supplier.name,
        address: supplier.address,
        mobile_number: supplier.mobile_number,
        email: supplier.email,
    }));

    const actions = (row) => (
        <Dropdown className="">
            <Dropdown.Trigger>
                <SettingsIcon className="cursor-pointer text-gray-600 dark:text-gray-300" />
            </Dropdown.Trigger>
            <Dropdown.Content contentClasses="relative py-1 right-7 top-[-80px] bg-gray-100 dark:bg-gray-700">
                <Dropdown.Link
                    onClick={(e) => {
                        e.preventDefault();
                        toggleDrawer(true, true, row);
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
                    Supplier
                </h2>
            }
        >
            <Head title="Supplier" />
          
                    <div className="px-4 py-4  overflow-hidden bg-white ring-1 ring-black/10 sm:rounded-lg dark:bg-gray-800/40">
                        <div className="flex mb-3 gap-2 items-center justify-between ">
                            <input
                                type="text"
                                placeholder="Search..."
                                className="dark:placeholder-gray-300 placeholder-gray-600 dark:text-gray-300 border border-black/20 dark:border-white bg-transparent rounded-sm px-4 py-1 focus:outline-none focus:ring-none dark:focus:border-white"
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <div className="pl-2 border-l border-gray-500 flex gap-2 items-center">
                             
                                    <DeleteIcon
                                        className={`text-gray-600 dark:text-gray-300 cursor-pointer ${
                                            selectedSuppliers.length < 2
                                                ? "opacity-50 pointer-events-none"
                                                : ""
                                        }`}
                                        onClick={() => confirmDelete()}
                                        disabled={selectedSuppliers.length < 2}
                                    />
                        
                                <AddCircleIcon
                                    className="text-gray-600 dark:text-gray-300 cursor-pointer"
                                    onClick={() => toggleDrawer(true, false)}
                                />
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
           
            <Drawer
                isDrawerOpen={isDrawerOpen}
                toggleDrawer={toggleDrawer}
                title={isEditMode ? "Edit Supplier" : "Add Supplier"}
                width="350px"
            >
                <form onSubmit={handleSubmit}>
                    {/* Name Field */}
                    <div className="mt-2">
                        <InputLabel htmlFor="name" value="Name" />
                        <TextInput
                            id="name"
                            className="mt-2 block w-full h-10 rounded-sm text-sm"
                            value={data.name}
                            onChange={(e) => setData("name", e.target.value)}
                        />
                        <InputError message={errors.name} className="mt-2" />
                    </div>

                    <div className="mt-4">
                        <InputLabel htmlFor="address" value="Address" />
                        <TextInput
                            id="address"
                            className="mt-2 block w-full h-10 rounded-sm text-sm"
                            value={data.address}
                            onChange={(e) => setData("address", e.target.value)}
                        />
                        <InputError message={errors.address} className="mt-2" />
                    </div>

                    <div className="mt-4">
                        <InputLabel
                            htmlFor="mobile_number"
                            value="Mobile No."
                        />
                        <TextInput
                            id="mobile_number"
                            type="tel"
                            className="mt-2 block w-full h-10 rounded-sm text-sm"
                            value={data.mobile_number}
                            onChange={(e) =>
                                setData("mobile_number", e.target.value)
                            }
                        />
                        <InputError
                            message={errors.mobile_number}
                            className="mt-2"
                        />
                    </div>

                    <div className="mt-4">
                        <InputLabel htmlFor="email" value="Email" />
                        <TextInput
                            id="email"
                            type="email"
                            className="mt-2 block w-full h-10 rounded-sm text-sm"
                            value={data.email}
                            onChange={(e) => setData("email", e.target.value)}
                        />
                        <InputError message={errors.email} className="mt-2" />
                    </div>

                    <div className="mt-6">
                        <SecondaryButton
                            type="submit"
                            className="w-full h-10 rounded-sm"
                            disabled={processing}
                        >
                            {processing
                                ? "Saving..."
                                : isEditMode
                                ? "SAVE"
                                : "SAVE"}
                        </SecondaryButton>
                    </div>
                </form>
            </Drawer>

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
