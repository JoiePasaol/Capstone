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
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import Pagination from "@/Components/Pagination";
import { useState, useEffect } from "react";
import axios from "axios";

const UserManagement = () => {
    // State variables for managing user data and UI state
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
    const [dialogTitle, setDialogTitle] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [sortConfig, setSortConfig] = useState({
        key: "firstname",
        direction: "asc",
    });
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10; // Number of items per page

    // Calculate total pages based on filtered users
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

    // Fetching users from API when the component mounts
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

    // Sorting Function - Handles sorting users based on the selected key
    const handleSortClick = (key) => {
        let direction = "asc";
        if (sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc";
        }
        setSortConfig({ key, direction });

        const sortedUsers = [...(searchTerm ? filteredUsers : users)].sort(
            (a, b) => {
                const aValue = a[key]?.toString().toLowerCase();
                const bValue = b[key]?.toString().toLowerCase();

                if (aValue < bValue) return direction === "asc" ? -1 : 1;
                if (aValue > bValue) return direction === "asc" ? 1 : -1;
                return 0;
            }
        );

        setFilteredUsers(sortedUsers);
    };

    // Search Function - Filters users based on the search term
    const onSearch = (searchTerm) => {
        setSearchTerm(searchTerm);
        if (searchTerm === "") {
            setFilteredUsers(users);
        } else {
            const filtered = users.filter((user) => {
                const fullName =
                    `${user.firstname} ${user.lastname}`.toLowerCase();
                const searchTermLower = searchTerm.toLowerCase();

                return (
                    fullName.includes(searchTermLower) ||
                    user.email.toLowerCase().includes(searchTermLower) ||
                    user.department.toLowerCase().includes(searchTermLower) ||
                    user.role.toLowerCase().includes(searchTermLower)
                );
            });
            setFilteredUsers(filtered);
        }
    };

    // Toggle the drawer state (open/close)
    const toggleDrawer = (state) => {
        setIsDrawerOpen(state);
    };

    // Handle the click event for editing a user
    const handleEditClick = (user) => {
        const userToEdit = users.find((u) => u.id === user.id);

        if (!userToEdit) {
            console.error("User not found:", user);
            return;
        }

        setSelectedUser(userToEdit);
        setIsDrawerOpen(true);
    };

    // Handle checkbox selection for a user
    const handleCheckboxChange = (user) => {
        setSelectedUsers((prev) =>
            prev.some((u) => u.id === user.id)
                ? prev.filter((u) => u.id !== user.id)
                : [...prev, user]
        );
    };

    // Select all checkboxes for bulk actions
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedUsers(filteredUsers);
        } else {
            setSelectedUsers([]);
        }
    };

    // Handle delete action (for single or multiple users)
    const handleDeleteClick = (user = null) => {
        if (user) {
            setSelectedUsers([user]);
        }
        const userCount = user ? 1 : selectedUsers.length;
        setIsDialogOpen(true);
        setDialogTitle(
            user
                ? `Are you sure you want to delete this user?`
                : `Are you sure you want to delete these (${userCount}) users?`
        );
    };

    // Confirm delete action
    const handleConfirmDelete = async () => {
        if (selectedUsers.length === 0) {
            console.error("No users selected for deletion");
            return;
        }

        const userCount = selectedUsers.length;

        try {
            await Promise.all(
                selectedUsers.map((user) =>
                    axios.delete(`/api/users/${user.id}`)
                )
            );

            setUsers(
                users.filter(
                    (user) => !selectedUsers.some((u) => u.id === user.id)
                )
            );
            setFilteredUsers(
                filteredUsers.filter(
                    (user) => !selectedUsers.some((u) => u.id === user.id)
                )
            );

            setSuccessMessage(
                `${userCount} user${
                    userCount > 1 ? "s" : ""
                } successfully deleted!`
            );
            setIsSuccessDialogOpen(true);
        } catch (error) {
            console.error("Error deleting users:", error);
        } finally {
            setIsDialogOpen(false);
            setSelectedUsers([]);
        }
    };
    // Cancel delete operation
    const handleCancelDelete = () => {
        setSelectedUser(null);
        setIsDialogOpen(false);
    };

    // Handle saving user updates (editing a user)
    const handleSaveClick = async () => {
        if (!selectedUser || !selectedUser.id) {
            console.error("Invalid selectedUser object:", selectedUser);
            return;
        }

        try {
            const response = await axios.put(`/api/users/${selectedUser.id}`, {
                firstname: selectedUser.firstname,
                lastname: selectedUser.lastname,
                email: selectedUser.email,
                department: selectedUser.department,
                role: selectedUser.role,
            });

            setUsers((prevUsers) =>
                prevUsers.map((user) =>
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

    // Action buttons (edit and delete) for each user row
    const actions = (user) => (
        <div className="flex justify-center" key={`actions-${user.id}`}>
            <TrueButton onClick={() => handleEditClick(user)}>Edit</TrueButton>
            <FalseButton onClick={() => handleDeleteClick(user)}>
                Delete
            </FalseButton>
        </div>
    );

    // Options for department and role
    const departmentOptions = [
        { value: "HR", label: "HR" },
        { value: "IT", label: "IT" },
    ];

    const roleOptions = [
        { value: "Admin", label: "Admin" },
        { value: "Basic", label: "Basic" },
    ];

    // Table headers
    const headers = [
        <Checkbox
            key="select-all"
            checked={
                selectedUsers.length === filteredUsers.length &&
                filteredUsers.length > 0
            }
            onChange={handleSelectAll}
        />,
        "#",
        "First Name",
        "Last Name",
        "Email",
        "Department",
        "Role",
    ];

    // Paginate and sort users for display
    const paginatedRows = [...(searchTerm ? filteredUsers : users)]
        .sort((a, b) => {
            const aValue = a[sortConfig.key]?.toString().toLowerCase();
            const bValue = b[sortConfig.key]?.toString().toLowerCase();

            if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
            return 0;
        })
        .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
        .map((user, index) => ({
            id: user.id,
            checkbox: (
                <Checkbox
                    key={`checkbox-${user.id}`}
                    checked={selectedUsers.some((u) => u.id === user.id)}
                    onChange={() => handleCheckboxChange(user)}
                />
            ),
            index: (currentPage - 1) * itemsPerPage + index + 1,
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            department: user.department,
            role: user.role,
        }));

    // Handle page change for pagination
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
                    <div className="px-6 py-4 overflow-hidden bg-white shadow-sm sm:rounded-lg dark:bg-gray-800">
                        {users.length > 0 && (
                            <div className="w-full flex justify-between gap-4 ">
                                <div className="flex-1">
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        className="text-white border-white bg-transparent rounded-md px-4 py-1 focus:outline-none focus:ring-none focus:border-white"
                                        onChange={(e) =>
                                            onSearch(e.target.value)
                                        }
                                    />
                                </div>
                                <div className="flex gap-2 items-center">
                                    <DeleteIcon
                                        className={`cursor-pointer text-white ${
                                            selectedUsers.length <= 1
                                                ? "opacity-50 cursor-not-allowed"
                                                : ""
                                        }`}
                                        onClick={() =>
                                            selectedUsers.length > 1 &&
                                            handleDeleteClick()
                                        }
                                    />

                                    <div
                                        onClick={() =>
                                            handleSortClick(sortConfig.key)
                                        }
                                        className="cursor-pointer text-gray-600 dark:text-gray-300"
                                    >
                                        {sortConfig.direction === "asc" ? (
                                            <ArrowUpwardIcon />
                                        ) : (
                                            <ArrowDownwardIcon />
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="text-gray-900 dark:text-gray-100">
                            {users.length > 0 ? (
                                <Table
                                    headers={headers}
                                    rows={paginatedRows}
                                    actions={actions}
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
                title="Edit"
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