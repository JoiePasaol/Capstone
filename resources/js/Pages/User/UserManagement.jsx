import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import Table from "@/Components/Table";
import Checkbox from "@/Components/Checkbox";
import TrueButton from "@/Components/TrueButton";
import FalseButton from "@/Components/FalseButton";
import Drawer from "@/Components/Drawer";
import InputLabel from "@/Components/InputLabel";
import TextInput from "@/Components/TextInput";
import InputError from "@/Components/InputError";
import SelectOption from "@/Components/SelectOption";
import SecondaryButton from "@/Components/SecondaryButton";
import ConfirmationDialog from "@/Components/ConfirmationDialog";
import SuccessDialog from "@/Components/SuccessDialog";
import DeleteIcon from "@mui/icons-material/Delete";
import Pagination from "@/Components/Pagination";
import { useState, useEffect, useMemo } from "react";
import axios from "axios";

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
    const [dialogTitle, setDialogTitle] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Toggles the drawer state for user editing
    const toggleDrawer = (state) => setIsDrawerOpen(state);

    // Debounce function to delay the search operation and optimize performance
    const debounceSearch = (term) => {
        const timer = setTimeout(() => onSearch(term), 300);
        return () => clearTimeout(timer);
    };

    // Fetch users data from the API when the component mounts
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await axios.get("/api/users?status=approved");
                setUsers(response.data);
                setFilteredUsers(response.data);
            } catch (error) {
                console.error("Error fetching users:", error);
            }
        };
        fetchUsers();
    }, []);

    // Calls debounce function whenever the search term changes
    useEffect(() => {
        debounceSearch(searchTerm);
    }, [searchTerm]);

    // Filters users based on the provided search term
    const onSearch = (term) => {
        if (term === "") {
            setFilteredUsers(users);
        } else {
            const filtered = users.filter((user) =>
                [
                    `${user.firstname} ${user.lastname}`,
                    user.email,
                    user.department,
                    user.role,
                ].some((field) =>
                    field.toLowerCase().includes(term.toLowerCase())
                )
            );
            setFilteredUsers(filtered);
        }
    };

    // Handles edit action when a user is selected
    const handleEditClick = (user) => {
        const userToEdit = users.find((u) => u.id === user.id);
        setSelectedUser(userToEdit || {});
        setIsDrawerOpen(true);
    };

    // Handles individual checkbox selection for users
    const handleCheckboxChange = (user) => {
        setSelectedUsers((prev) => {
            const isSelected = prev.some((u) => u.id === user.id);
            return isSelected
                ? prev.filter((u) => u.id !== user.id)
                : [...prev, user];
        });
    };

    // Handles "select all" checkbox functionality
    const handleSelectAll = (e) => {
        setSelectedUsers(e.target.checked ? filteredUsers : []);
    };

    // Prepares for user deletion by setting dialog title and selected users
    const handleDeleteClick = (user = null) => {
        // If a single user is passed, set the dialog message for that user
        if (user) {
            setSelectedUsers([user]); // Single user selection
            setDialogTitle("Are you sure you want to delete this user?");
        } else {
            // If no user is passed, it's a multi-delete
            const userCount = selectedUsers.length;
            setDialogTitle(
                `Are you sure you want to delete these ${userCount} user${
                    userCount > 1 ? "s" : ""
                }?`
            );
        }
        setIsDialogOpen(true);
    };

    // Handles the confirmed deletion of selected users
    const handleConfirmDelete = async () => {
        try {
            await Promise.all(
                selectedUsers.map((user) =>
                    axios.delete(`/api/users/${user.id}`)
                )
            );
            setUsers((prev) =>
                prev.filter(
                    (user) => !selectedUsers.some((u) => u.id === user.id)
                )
            );
            setFilteredUsers((prev) =>
                prev.filter(
                    (user) => !selectedUsers.some((u) => u.id === user.id)
                )
            );
            setSuccessMessage(
                `${selectedUsers.length} user${
                    selectedUsers.length > 1 ? "s" : ""
                } deleted successfully.`
            );
            setIsSuccessDialogOpen(true);
        } catch (error) {
            console.error("Error deleting users:", error);
        } finally {
            setIsDialogOpen(false);
            setSelectedUsers([]);
        }
    };

    // Cancels the delete confirmation dialog
    const handleCancelDelete = () => setIsDialogOpen(false);

    // Handles saving updated user data to the server
    const handleSaveClick = async () => {
        try {
            const response = await axios.put(
                `/api/users/${selectedUser.id}`,
                selectedUser
            );
            setUsers((prev) =>
                prev.map((user) =>
                    user.id === selectedUser.id
                        ? { ...user, ...selectedUser }
                        : user
                )
            );
            setFilteredUsers((prev) =>
                prev.map((user) =>
                    user.id === selectedUser.id
                        ? { ...user, ...selectedUser }
                        : user
                )
            );
            setSuccessMessage("User successfully updated!");
            setIsSuccessDialogOpen(true);
            setIsDrawerOpen(false);
        } catch (error) {
            console.error("Error saving user:", error);
        }
    };

    // Options for department dropdown
    const departmentOptions = [
        { value: "HR", label: "HR" },
        { value: "IT", label: "IT" },
    ];

    // Options for role dropdown
    const roleOptions = [
        { value: "Admin", label: "Admin" },
        { value: "Basic", label: "Basic" },
    ];

    // Defines table headers, including a select-all checkbox
    const headers = [
        {
            label: (
                <Checkbox
                    key="select-all"
                    checked={
                        selectedUsers.length === filteredUsers.length &&
                        filteredUsers.length > 0
                    }
                    onChange={handleSelectAll}
                />
            ),
            key: "select-all",
        },
        { label: "#", key: "index" },
        { label: "First Name", key: "firstname" },
        { label: "Last Name", key: "lastname" },
        { label: "Email", key: "email" },
        { label: "Department", key: "department" },
        { label: "Role", key: "role" },
    ];

    // Calculates total number of pages for pagination
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

    // Paginates the filtered users for display
    const paginatedRows = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredUsers
            .slice(startIndex, startIndex + itemsPerPage)
            .map((user, index) => ({
                id: user.id,
                checkbox: (
                    <Checkbox
                        key={`checkbox-${user.id}`}
                        checked={selectedUsers.some((u) => u.id === user.id)}
                        onChange={() => handleCheckboxChange(user)}
                    />
                ),
                index: startIndex + index + 1,
                firstname: user.firstname,
                lastname: user.lastname,
                email: user.email,
                department: user.department,
                role: user.role,
            }));
    }, [filteredUsers, selectedUsers, currentPage]);

    // Handles changing the current page for pagination
    const handlePageChange = (newPage) => {
        if (newPage < 1 || newPage > totalPages) return;
        setCurrentPage(newPage);
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    User Management
                </h2>
            }
        >
            <Head title="User Management" />
            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="px-6 py-4 overflow-hidden bg-white ring-1 ring-black/10 sm:rounded-lg dark:bg-gray-800">
                        {users.length > 0 && (
                            <div className="w-full flex justify-between">
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        value={searchTerm}
                                        className="dark:text-white border-black/20 dark:border-white bg-transparent rounded-md px-4 py-1 focus:outline-none focus:ring-none dark:focus:border-white"
                                        onChange={(e) =>
                                            setSearchTerm(e.target.value)
                                        }
                                    />
                                </div>
                                <div className="flex gap-2 items-center">
                                    <DeleteIcon
                                        className={`text-gray-600 dark:text-gray-300 cursor-pointer ${
                                            selectedUsers.length <= 1
                                                ? "opacity-50 cursor-not-allowed"
                                                : ""
                                        }`}
                                        onClick={() =>
                                            selectedUsers.length > 1 &&
                                            handleDeleteClick()
                                        }
                                    />
                                </div>
                            </div>
                        )}

                        <div className="text-gray-900 dark:text-gray-100">
                            {users.length > 0 ? (
                                <Table
                                    headers={headers}
                                    rows={paginatedRows}
                                    actions={(user) => (
                                        <div
                                            className="flex justify-center shrink-0"
                                            key={`actions-${user.id}`}
                                        >
                                            <TrueButton
                                                onClick={() =>
                                                    handleEditClick(user)
                                                }
                                            >
                                                Edit
                                            </TrueButton>
                                            <FalseButton
                                                onClick={() =>
                                                    handleDeleteClick(user)
                                                }
                                            >
                                                Delete
                                            </FalseButton>
                                        </div>
                                    )}
                                />
                            ) : (
                                <div className="flex items-center justify-center h-48">
                                    <p className="text-xl font-semibold text-gray-500 dark:text-gray-400">
                                        No User!
                                    </p>
                                </div>
                            )}
                        </div>

                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                        />
                    </div>
                </div>
            </div>

            <Drawer
                isDrawerOpen={isDrawerOpen}
                toggleDrawer={toggleDrawer}
                title="Edit User"
            >
                {selectedUser && (
                    <>
                        <div>
                            <InputLabel
                                htmlFor="firstname"
                                value="First Name"
                            />
                            <TextInput
                                id="firstname"
                                className="mt-2 block w-full h-10 rounded-sm"
                                value={selectedUser.firstname}
                                onChange={(e) =>
                                    setSelectedUser({
                                        ...selectedUser,
                                        firstname: e.target.value,
                                    })
                                }
                            />
                            <InputError className="mt-2" />
                        </div>

                        <div className="mt-4">
                            <InputLabel htmlFor="lastname" value="Last Name" />
                            <TextInput
                                id="lastname"
                                className="mt-2 block w-full h-10 rounded-sm"
                                value={selectedUser.lastname}
                                onChange={(e) =>
                                    setSelectedUser({
                                        ...selectedUser,
                                        lastname: e.target.value,
                                    })
                                }
                            />
                            <InputError className="mt-2" />
                        </div>

                        <div className="mt-4">
                            <InputLabel htmlFor="email" value="Email" />
                            <TextInput
                                id="email"
                                className="mt-2 block w-full h-10 rounded-sm"
                                value={selectedUser.email}
                                onChange={(e) =>
                                    setSelectedUser({
                                        ...selectedUser,
                                        email: e.target.value,
                                    })
                                }
                            />
                            <InputError className="mt-2" />
                        </div>

                        <div className="mt-4">
                            <InputLabel
                                htmlFor="department"
                                value="Department"
                            />
                            <SelectOption
                                id="department"
                                options={departmentOptions}
                                className="mt-2 block w-full h-10 rounded-sm"
                                value={selectedUser.department}
                                onChange={(e) =>
                                    setSelectedUser({
                                        ...selectedUser,
                                        department: e.target.value,
                                    })
                                }
                            />
                            <InputError className="mt-2" />
                        </div>

                        <div className="mt-4">
                            <InputLabel htmlFor="role" value="Role" />
                            <SelectOption
                                id="role"
                                options={roleOptions}
                                className="mt-2 block w-full h-10 rounded-sm"
                                value={selectedUser.role}
                                onChange={(e) =>
                                    setSelectedUser({
                                        ...selectedUser,
                                        role: e.target.value,
                                    })
                                }
                            />
                            <InputError className="mt-2" />
                        </div>

                        <div className="mt-5">
                            <SecondaryButton
                                className="w-full h-10 rounded-sm"
                                onClick={handleSaveClick}
                            >
                                Save
                            </SecondaryButton>
                        </div>
                    </>
                )}
            </Drawer>

            <ConfirmationDialog
                isOpen={isDialogOpen}
                onConfirm={handleConfirmDelete}
                onCancel={handleCancelDelete}
                title={dialogTitle}
            />
            <SuccessDialog
                isOpen={isSuccessDialogOpen}
                onClose={() => setIsSuccessDialogOpen(false)}
                message={successMessage}
            />
        </AuthenticatedLayout>
    );
};

export default UserManagement;
