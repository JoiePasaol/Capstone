import { useState, useEffect, useCallback } from "react";
import { usePage, Head } from "@inertiajs/react";
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


export default function Categories({ categories }) {
    // State Management
    const { user } = usePage().props.auth;
    const { reload } = usePage();
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [category, setCategory] = useState("");
    const [rows, setRows] = useState(
        categories.map((cat, index) => ({
            checkbox: false,
            id: cat.id,
            index: index + 1,
            categories: cat.name,
        }))
    );
    const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [dialogTitle, setDialogTitle] = useState("");
    const [selectedCategory, setSelectedCategory] = useState(null);
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
        updateSelectAllState();
    }, [rows, updateSelectAllState]);

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
        { label: "Categories", key: "categories" },
    ];

    // Add Category Logic
    const handleAddCategory = async () => {
        if (category.trim() === "") return;
    
        setProcessing(true);
    
        try {
            const response = await axios.post(route("categories.store"), {
                name: category,
            });
    
            const newCategory = response.data;
            const newRow = {
                checkbox: false,
                id: newCategory.id,
                index: rows.length + 1,
                categories: newCategory.name,
            };
    
            setRows((prevRows) => [...prevRows, newRow]);
            setCategory("");
            setSuccessMessage("Category successfully added!");
            setIsSuccessDialogOpen(true);
    
            // Ensure this function exists and is needed
            if (typeof reload === "function") {
                reload();
            }
        } catch (error) {
            console.error("Failed to add category:", error);
        } finally {
            setProcessing(false);
        }
    };
    

    // Edit Category Logic

    const handleEditClick = (category) => {
        const categoryToEdit = rows.find((row) => row.id === category.id);
        if (categoryToEdit) {
            setEditingCategory({
                id: categoryToEdit.id,
                name: categoryToEdit.categories,
            });
            setIsDrawerOpen(true);
        }
    };

    const handleSaveCategory = async () => {
        if (!editingCategory || editingCategory.name.trim() === "") return;

        setProcessing(true);

        try {
            const response = await axios.put(
                route("categories.update", editingCategory.id),
                {
                    name: editingCategory.name,
                }
            );

            if (response.status === 200) {
                setRows((prevRows) =>
                    prevRows.map((row) =>
                        row.id === editingCategory.id
                            ? { ...row, categories: editingCategory.name }
                            : row
                    )
                );

                categories = categories.map((cat) =>
                    cat.id === editingCategory.id
                        ? { ...cat, name: editingCategory.name }
                        : cat
                );

                setEditingCategory(null);
                setIsDrawerOpen(false);
                setSuccessMessage("Category successfully updated!");
                setIsSuccessDialogOpen(true);
            }
        } catch (error) {
            console.error("Failed to update category:", error);
        } finally {
            setProcessing(false);
        }
    };

    // Delete Category Logic

    const handleDeleteClick = (category) => {
        setSelectedCategory([category]);
        setDialogTitle("Are you sure you want to delete this category?");
        setIsDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedCategory || selectedCategory.length === 0) return;

        try {
            const response = await axios.delete(
                route("categories.destroy", selectedCategory[0].id)
            );
            if (response.status === 200) {
                setRows((prevRows) => {
                    const updatedRows = prevRows.filter(
                        (row) => row.id !== selectedCategory[0].id
                    );
                    return updatedRows.map((row, index) => ({
                        ...row,
                        index: index + 1,
                    }));
                });
                setSuccessMessage("Category successfully deleted!");
                setIsSuccessDialogOpen(true);
            }
        } catch (error) {
            console.error("Failed to delete category:", error);
        } finally {
            setIsDialogOpen(false);
            setSelectedCategory(null);
        }
    };

    const handleBulkDeleteClick = () => {
        const selectedCategories = rows.filter((row) => row.checkbox);
        if (selectedCategories.length < 2) return;

        setDialogTitle(
            `Are you sure you want to delete these (${selectedCategories.length}) categories?`
        );
        setSelectedCategory(selectedCategories);
        setIsDialogOpen(true);
    };

    const handleBulkDeleteConfirm = async () => {
        if (!selectedCategory || selectedCategory.length === 0) return;

        try {
            const response = await axios.post(route("categories.bulk-destroy"), {
                ids: selectedCategory.map((category) => category.id),
            });
            if (response.status === 200) {
                setRows((prevRows) => {
                    const updatedRows = prevRows.filter(
                        (row) =>
                            !selectedCategory.some((cat) => cat.id === row.id)
                    );
                    return updatedRows.map((row, index) => ({
                        ...row,
                        index: index + 1,
                    }));
                });
                setSuccessMessage(
                    `(${selectedCategory.length}) categories successfully deleted!`
                );
                setIsSuccessDialogOpen(true);
            }
        } catch (error) {
            console.error("Failed to delete categories:", error);
        } finally {
            setIsDialogOpen(false);
            setSelectedCategory(null);
        }
    };

    const handleCancelDelete = () => {
        setSelectedCategory(null);
        setIsDialogOpen(false);
    };

    // Action Buttons for Categories
    const actions = useCallback(
        (category) => (
            <div className="flex justify-center" key={`actions-${category.id}`}>
                <Dropdown>
                    <Dropdown.Trigger>
                        <SettingsIcon className="cursor-pointer text-gray-600 dark:text-gray-300" />
                    </Dropdown.Trigger>
                    <Dropdown.Content contentClasses="relative py-1 right-7 top-[-80px]  bg-gray-100 dark:bg-gray-700">
                    <Dropdown.Link
                            onClick={(e) => {
                                e.preventDefault();
                                handleEditClick(category);
                            }}
                        >
                            Edit
                        </Dropdown.Link>
                   
                            <Dropdown.Link
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleDeleteClick(category);
                                }}
                            >
                                Delete
                            </Dropdown.Link>
                
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
                    Categories
                </h2>
            }
        >
            <Head title="Categories" />
                    <div className="grid grid-cols-1 md:grid-cols-[350px,1fr] lg:grid-cols-[350px,1fr] overflow-hidden">
                        <div className="py-4 px-3">
                            <div className="h-60 bg-white ring-1 ring-gray-400 dark:ring-gray-400 sm:rounded-lg dark:bg-gray-800">
                                <div className="border-b border-gray-400 dark:border-gray-600 p-4 text-xl font-bold text-blue-500 dark:text-gray-300">
                                    Add New Category
                                </div>
                                <div className="w-full p-4">
                                    <TextInput
                                        className="w-full"
                                        placeholder="Category..."
                                        value={category}
                                        onChange={(e) =>
                                            setCategory(e.target.value)
                                        }
                                    />
                                    <SecondaryButton
                                        className="h-10 mt-4 w-full rounded-sm"
                                        onClick={handleAddCategory}
                                        disabled={processing}
                                    >
                                        {processing ? "Saving..." : "Save"}
                                    </SecondaryButton>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 px-3">
                            <div className="pb-4 bg-white ring-1 ring-gray-400 dark:ring-gray-400 sm:rounded-lg dark:bg-gray-800">
                                <div className="border-b border-gray-400 dark:border-gray-600 p-4 text-xl font-bold text-blue-500 dark:text-gray-300">
                                    All Categories
                                </div>
                                <div className="w-full flex justify-end px-4 mt-4 mb-3 text-gray-900 dark:text-gray-100">
                               
                                        <DeleteIcon
                                            className={`text-gray-600 dark:text-gray-300 cursor-pointer ${
                                                rows.filter((row) => row.checkbox)
                                                    .length < 2
                                                    ? "opacity-50 cursor-not-allowed"
                                                    : ""
                                            }`}
                                            onClick={handleBulkDeleteClick}
                                            disabled={
                                                rows.filter((row) => row.checkbox)
                                                    .length < 2
                                            }
                                        />
                              
                                </div>
                                <div className="w-full px-4 text-gray-900 dark:text-gray-100">
                                    <Table
                                        headers={headers}
                                        rows={rows.map((row) => ({
                                            ...row,
                                            checkbox: (
                                                <Checkbox
                                                    checked={row.checkbox}
                                                    onChange={() =>
                                                        handleRowCheckboxChange(
                                                            row.id
                                                        )
                                                    }
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
                title="Edit Category"
            >
                {editingCategory && (
                    <>
                        <TextInput
                            className="w-full"
                            value={editingCategory.name}
                            onChange={(e) =>
                                setEditingCategory((prev) => ({
                                    ...prev,
                                    name: e.target.value,
                                }))
                            }
                        />
                        <div className="mt-5">
                            <SecondaryButton
                                type="submit"
                                className="w-full h-10 rounded-sm"
                                onClick={handleSaveCategory}
                                disabled={processing}
                            >
                                {processing ? "Saving..." : "Save"}
                            </SecondaryButton>
                        </div>
                    </>
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
                    selectedCategory?.length > 1
                        ? handleBulkDeleteConfirm
                        : handleConfirmDelete
                }
                onCancel={handleCancelDelete}
            />
        </AuthenticatedLayout>
    );
}
