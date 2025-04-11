import { useState, useEffect, useCallback } from "react";
import { usePage, Head } from "@inertiajs/react";
import { checkRole } from "@/Utils/CheckRole";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import TextInput from "@/Components/TextInput";
import SecondaryButton from "@/Components/SecondaryButton";
import Checkbox from "@/Components/Checkbox";
import Table from "@/Components/Table";
import SettingsIcon from "@mui/icons-material/Settings";
import Dropdown from "@/Components/Dropdown";
import Drawer from "@/Components/Drawer";
import SuccessDialog from "@/Components/SuccessDialog";
import ConfirmationDialog from "@/Components/ConfirmationDialog";
import DeleteIcon from "@mui/icons-material/Delete";
import axios from "axios";

export default function Signatory() {
    // State Management
    const { user } = usePage().props.auth;
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [editingSignatory, setEditingSignatory] = useState(null);
    const [nameDesignation, setNameDesignation] = useState("");
    const [positionIntended, setPositionIntended] = useState("");
    const [email, setEmail] = useState("");
    const [rows, setRows] = useState([]);
    const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [dialogTitle, setDialogTitle] = useState("");
    const [selectedSignatory, setSelectedSignatory] = useState(null);
    const [isSelectAllChecked, setIsSelectAllChecked] = useState(false);
    const [processing, setProcessing] = useState(false);

    // Function Definitions
    const handleSelectAllChange = useCallback(() => {
        const newSelectAllState = !isSelectAllChecked;
        setIsSelectAllChecked(newSelectAllState);
        setRows((prevRows) =>
            prevRows.map((row) => ({ ...row, checkbox: newSelectAllState }))
        );
    }, [isSelectAllChecked]);

    const handleRowCheckboxChange = useCallback((id) => {
        setRows((prevRows) =>
            prevRows.map((row) =>
                row.id === id ? { ...row, checkbox: !row.checkbox } : row
            )
        );
    }, []);

    const updateSelectAllState = useCallback(() => {
        if (rows.length === 0) {
            setIsSelectAllChecked(false);
            return;
        }
        const allChecked = rows.every((row) => row.checkbox);
        setIsSelectAllChecked(allChecked);
    }, [rows]);

    useEffect(() => {
        const fetchSignatories = async () => {
            try {
                const response = await axios.get(route('signatories.index'));
                const signatories = response.data.map((signatory, index) => ({
                    checkbox: false,
                    id: signatory.id,
                    index: index + 1,
                    nameDesignation: signatory.name_designation,
                    positionIntended: signatory.position_intended,
                    email: signatory.email,
                }));
                setRows(signatories);
            } catch (error) {
                console.error("Failed to fetch signatories:", error);
            }
        };

        fetchSignatories();
    }, []);

    const headers = [
        {
            label: (
                <Checkbox
                    key="select-all"
                    checked={isSelectAllChecked}
                    onChange={handleSelectAllChange}
                />
            ),
            key: "select-all",
        },
        { label: "#", key: "index" },
        { label: "Name/Designation", key: "nameDesignation" },
        { label: "Position Intended", key: "positionIntended" },
        { label: "Email", key: "email" },
    ];

    // Add Signatory Logic
    const handleAddSignatory = async () => {
        if (nameDesignation.trim() === "" || positionIntended.trim() === "" || email.trim() === "") return;

        setProcessing(true);

        try {
            const response = await axios.post(route("signatories.store"), {
                name_designation: nameDesignation,
                position_intended: positionIntended,
                email: email,
            });

            const newSignatory = response.data;
            const newRow = {
                checkbox: false,
                id: newSignatory.id,
                index: rows.length + 1,
                nameDesignation: newSignatory.name_designation,
                positionIntended: newSignatory.position_intended,
                email: newSignatory.email,
            };

            setRows((prevRows) => [...prevRows, newRow]);
            setNameDesignation("");
            setPositionIntended("");
            setEmail("");
            setSuccessMessage("Signatory successfully added!");
            setIsSuccessDialogOpen(true);
        } catch (error) {
            console.error("Failed to add signatory:", error);
        } finally {
            setProcessing(false);
        }
    };

    // Edit Signatory Logic
    const handleEditClick = (signatory) => {
        const signatoryToEdit = rows.find((row) => row.id === signatory.id);
        if (signatoryToEdit) {
            setEditingSignatory({
                id: signatoryToEdit.id,
                nameDesignation: signatoryToEdit.nameDesignation,
                positionIntended: signatoryToEdit.positionIntended,
                email: signatoryToEdit.email,
            });
            setIsDrawerOpen(true);
        }
    };

    const handleSaveSignatory = async () => {
        if (!editingSignatory || editingSignatory.nameDesignation.trim() === "" || editingSignatory.positionIntended.trim() === "" || editingSignatory.email.trim() === "") return;

        setProcessing(true);

        try {
            const response = await axios.put(
                route("signatories.update", editingSignatory.id),
                {
                    name_designation: editingSignatory.nameDesignation,
                    position_intended: editingSignatory.positionIntended,
                    email: editingSignatory.email,
                }
            );

            if (response.status === 200) {
                setRows((prevRows) =>
                    prevRows.map((row) =>
                        row.id === editingSignatory.id
                            ? {
                                ...row,
                                nameDesignation: editingSignatory.nameDesignation,
                                positionIntended: editingSignatory.positionIntended,
                                email: editingSignatory.email,
                            }
                            : row
                    )
                );

                setEditingSignatory(null);
                setIsDrawerOpen(false);
                setSuccessMessage("Signatory successfully updated!");
                setIsSuccessDialogOpen(true);
            }
        } catch (error) {
            console.error("Failed to update signatory:", error);
        } finally {
            setProcessing(false);
        }
    };

    // Delete Signatory Logic
    const handleDeleteClick = (signatory) => {
        setSelectedSignatory([signatory]);
        setDialogTitle("Are you sure you want to delete this signatory?");
        setIsDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedSignatory || selectedSignatory.length === 0) return;

        try {
            const response = await axios.delete(
                route("signatories.destroy", selectedSignatory[0].id)
            );
            if (response.status === 200) {
                setRows((prevRows) => {
                    const updatedRows = prevRows.filter(
                        (row) => row.id !== selectedSignatory[0].id
                    );
                    return updatedRows.map((row, index) => ({
                        ...row,
                        index: index + 1,
                    }));
                });
                setSuccessMessage("Signatory successfully deleted!");
                setIsSuccessDialogOpen(true);
            }
        } catch (error) {
            console.error("Failed to delete signatory:", error);
        } finally {
            setIsDialogOpen(false);
            setSelectedSignatory(null);
        }
    };

    const handleBulkDeleteClick = () => {
        const selectedSignatories = rows.filter((row) => row.checkbox);
        if (selectedSignatories.length < 2) return;

        setDialogTitle(
            `Are you sure you want to delete these (${selectedSignatories.length}) signatories?`
        );
        setSelectedSignatory(selectedSignatories);
        setIsDialogOpen(true);
    };

    const handleBulkDeleteConfirm = async () => {
        if (!selectedSignatory || selectedSignatory.length === 0) return;

        try {
            const response = await axios.post(route("signatories.bulkDestroy"), {
                ids: selectedSignatory.map((signatory) => signatory.id),
            });
            if (response.status === 200) {
                setRows((prevRows) => {
                    const updatedRows = prevRows.filter(
                        (row) =>
                            !selectedSignatory.some((sig) => sig.id === row.id)
                    );
                    return updatedRows.map((row, index) => ({
                        ...row,
                        index: index + 1,
                    }));
                });
                setSuccessMessage(
                    `(${selectedSignatory.length}) signatories successfully deleted!`
                );
                setIsSuccessDialogOpen(true);
            }
        } catch (error) {
            console.error("Failed to delete signatories:", error);
        } finally {
            setIsDialogOpen(false);
            setSelectedSignatory(null);
        }
    };

    const handleCancelDelete = () => {
        setSelectedSignatory(null);
        setIsDialogOpen(false);
    };

    // Action Buttons for Signatories
    const actions = useCallback(
        (signatory) => (
            <div className="flex justify-center" key={`actions-${signatory.id}`}>
                <Dropdown>
                    <Dropdown.Trigger>
                        <SettingsIcon className="cursor-pointer text-gray-600 dark:text-gray-300" />
                    </Dropdown.Trigger>
                    <Dropdown.Content contentClasses="relative py-1 right-7 top-[-90px] bg-gray-100 dark:bg-gray-700">
                        <Dropdown.Link
                            onClick={(e) => {
                                e.preventDefault();
                                handleEditClick(signatory);
                            }}
                        >
                            Edit
                        </Dropdown.Link>
                        {checkRole(user, ["Super Admin"]) && (
                            <Dropdown.Link
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleDeleteClick(signatory);
                                }}
                            >
                                Delete
                            </Dropdown.Link>
                        )}
                    </Dropdown.Content>
                </Dropdown>
            </div>
        ),
        [handleEditClick, handleDeleteClick]
    );

    const toggleDrawer = (state) => setIsDrawerOpen(state);

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    Signatory
                </h2>
            }
        >
            <Head title="Signatory" />
            <div className="grid grid-cols-1 md:grid-cols-[350px,1fr] lg:grid-cols-[350px,1fr] overflow-hidden">
                <div className="py-4 px-3">
                    <div className="h-auto bg-white ring-1 ring-gray-400 dark:ring-gray-400 sm:rounded-lg dark:bg-gray-800">
                        <div className="border-b border-gray-400 dark:border-gray-600 p-4 text-xl font-bold text-blue-500 dark:text-gray-300">
                            Add New Signatory
                        </div>
                        <div className="w-full p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Name/Designation
                                </label>
                                <TextInput
                                    className="w-full"
                                    placeholder="Enter name and designation..."
                                    value={nameDesignation}
                                    onChange={(e) => setNameDesignation(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Position Intended
                                </label>
                                <TextInput
                                    className="w-full"
                                    placeholder="Enter position intended..."
                                    value={positionIntended}
                                    onChange={(e) => setPositionIntended(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Email
                                </label>
                                <TextInput
                                    type="email"
                                    className="w-full"
                                    placeholder="Enter email address..."
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <SecondaryButton
                                className="h-10 w-full rounded-sm"
                                onClick={handleAddSignatory}
                                disabled={processing}
                            >
                                {processing ? "Saving..." : "Save"}
                            </SecondaryButton>
                        </div>
                    </div>
                </div>
                <div className="p-4 px-1">
                    <div className="pb-4 bg-white ring-1 ring-gray-400 dark:ring-gray-400 sm:rounded-lg dark:bg-gray-800">
                        <div className="border-b border-gray-400 dark:border-gray-600 p-4 text-xl font-bold text-blue-500 dark:text-gray-300">
                            All Signatory
                        </div>
                        <div className="w-full flex justify-end px-4 mt-4 mb-3 text-gray-900 dark:text-gray-100">
                            {checkRole(user, ["Super Admin"]) && (
                                <DeleteIcon
                                    className={`text-gray-600 dark:text-gray-300 cursor-pointer ${
                                        rows.filter((row) => row.checkbox).length < 2
                                            ? "opacity-50 cursor-not-allowed"
                                            : ""
                                    }`}
                                    onClick={handleBulkDeleteClick}
                                    disabled={rows.filter((row) => row.checkbox).length < 2}
                                />
                            )}
                        </div>
                        <div className="w-full px-4 text-gray-900 dark:text-gray-100">
                            <Table
                                headers={headers}
                                rows={rows.map((row) => ({
                                    ...row,
                                    checkbox: (
                                        <Checkbox
                                            checked={row.checkbox}
                                            onChange={() => handleRowCheckboxChange(row.id)}
                                        />
                                    ),
                                }))}
                                actions={actions}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <Drawer
                isDrawerOpen={isDrawerOpen}
                toggleDrawer={toggleDrawer}
                title="Edit Signatory"
            >
                {editingSignatory && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Name/Designation
                            </label>
                            <TextInput
                                className="w-full"
                                value={editingSignatory.nameDesignation}
                                onChange={(e) =>
                                    setEditingSignatory((prev) => ({
                                        ...prev,
                                        nameDesignation: e.target.value,
                                    }))
                                }
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Position Intended
                            </label>
                            <TextInput
                                className="w-full"
                                value={editingSignatory.positionIntended}
                                onChange={(e) =>
                                    setEditingSignatory((prev) => ({
                                        ...prev,
                                        positionIntended: e.target.value,
                                    }))
                                }
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Email
                            </label>
                            <TextInput
                                type="email"
                                className="w-full"
                                value={editingSignatory.email}
                                onChange={(e) =>
                                    setEditingSignatory((prev) => ({
                                        ...prev,
                                        email: e.target.value,
                                    }))
                                }
                            />
                        </div>
                        <SecondaryButton
                            type="submit"
                            className="w-full h-10 rounded-sm"
                            onClick={handleSaveSignatory}
                            disabled={processing}
                        >
                            {processing ? "Saving..." : "Save"}
                        </SecondaryButton>
                    </div>
                )}
            </Drawer>

            <SuccessDialog
                isOpen={isSuccessDialogOpen}
                onClose={() => setIsSuccessDialogOpen(false)}
                message={successMessage}
            />

            <ConfirmationDialog
                isOpen={isDialogOpen}
                setIsOpen={setIsDialogOpen}
                title={dialogTitle}
                onConfirm={
                    selectedSignatory?.length > 1
                        ? handleBulkDeleteConfirm
                        : handleConfirmDelete
                }
                onCancel={handleCancelDelete}
            />
        </AuthenticatedLayout>
    );
}
