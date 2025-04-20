import { useState, useEffect, useMemo, useCallback } from "react";
import { Head, usePage } from "@inertiajs/react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import Table from "@/Components/Table";
import Checkbox from "@/Components/Checkbox";
import SettingsIcon from "@mui/icons-material/Settings";
import Dropdown from "@/Components/Dropdown";
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
import axios from "axios";

const UserManagement = () => {
    //State Management
    const { auth } = usePage().props;
    const currentUser = auth.user;
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
    const [dialogTitle, setDialogTitle] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    //Drawer & Edit Handling

    const toggleDrawer = (state) => setIsDrawerOpen(state);

    //Search Handling

    const debounceSearch = (term) => {
        const timer = setTimeout(() => onSearch(term), 300);
        return () => clearTimeout(timer);
    };

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

    useEffect(() => {
        debounceSearch(searchTerm);
    }, [searchTerm]);

    //Fetching Data

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await axios.get("/api/users?status=approved");

                // Sort users by ID (Descending)
                const sortedUsers = response.data.sort((a, b) => b.id - a.id);

                // If the user is NOT a Super Admin, filter by department
                const filteredUsers =
                    currentUser.role === "Super Admin"
                        ? sortedUsers // Super Admin sees all users
                        : sortedUsers.filter(
                              (user) =>
                                  user.department === currentUser.department
                          );

                setUsers(filteredUsers);
                setFilteredUsers(filteredUsers);
            } catch (error) {
                console.error("Error fetching users:", error);
            }
        };

        fetchUsers();
    }, []);

    //User Actions

    const handleEditClick = (user) => {
        const userToEdit = users.find((u) => u.id === user.id);
        setSelectedUser(userToEdit || {});
        setIsDrawerOpen(true);
    };

    const handleCheckboxChange = (user) => {
        setSelectedUsers((prev) => {
            const isSelected = prev.some((u) => u.id === user.id);
            return isSelected
                ? prev.filter((u) => u.id !== user.id)
                : [...prev, user];
        });
    };

    const handleSelectAll = (e) => {
        setSelectedUsers(e.target.checked ? filteredUsers : []);
    };

    const handleDeleteClick = (user = null) => {
        if (user) {
            setSelectedUsers([user]);
            setDialogTitle("Are you sure you want to delete this user?");
        } else {
            setDialogTitle(
                `Are you sure you want to delete these (${selectedUsers.length}) users?`
            );
        }
        setIsDialogOpen(true);
    };

    const handleBulkDeleteClick = () => {
        if (selectedUsers.length < 2) return;

        setDialogTitle(
            `Are you sure you want to delete these (${selectedUsers.length}) users?`
        );
        setIsDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedUsers || selectedUsers.length === 0) return;

        try {
            console.log(
                "Deleting users:",
                selectedUsers.map((user) => user.id)
            ); // Debugging

            const response = await axios.post(route("users.bulk-destroy"), {
                ids: selectedUsers.map((user) => user.id),
            });

            if (response.status === 200) {
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
                    `(${selectedUsers.length}) users successfully deleted!`
                );
                setIsSuccessDialogOpen(true);
            }
        } catch (error) {
            console.error(
                "Failed to delete users:",
                error.response?.data || error
            );
        } finally {
            setIsDialogOpen(false);
            setSelectedUsers([]);
        }
    };

    const handleCancelDelete = () => {
        setIsDialogOpen(false);
        setSelectedUsers([]);
    };

    const handleSaveClick = async () => {
        setProcessing(true);
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
        } finally {
            setProcessing(false); // Ensures processing state is reset
        }
    };

    //Dropdown Options

    const departmentOptions = [
        { value: "H.R", label: "H.R" },
        { value: "I.T", label: "I.T" },
    ];

    const roleOptions = [
        { value: "Admin", label: "Admin" },
        { value: "Basic", label: "Basic" },
    ];

    //Table Headers & Rows

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
        { label: "First_Name", key: "firstname" },
        { label: "Last_Name", key: "lastname" },
        { label: "Email", key: "email" },
        { label: "Department", key: "department" },
    ];

    // Only add the Role column if the user is allowed (e.g., Super Admin)
    if (checkRole(currentUser, ["Super Admin"])) {
        headers.push({ label: "Role", key: "role" });
    }

    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

    const paginatedRows = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredUsers
            .filter((user) => user.id !== currentUser.id)
            .slice(startIndex, startIndex + itemsPerPage)
            .map((user, index) => {
                const row = {
                    id: user.id,
                    checkbox: (
                        <Checkbox
                            key={`checkbox-${user.id}`}
                            checked={selectedUsers.some(
                                (u) => u.id === user.id
                            )}
                            onChange={() => handleCheckboxChange(user)}
                        />
                    ),
                    index: startIndex + index + 1,
                    firstname: user.firstname,
                    lastname: user.lastname,
                    email: user.email,
                    department: user.department,
                };

                // Add the role field only if the user is a Super Admin
                if (checkRole(currentUser, ["Super Admin"])) {
                    row.role = user.role;
                }

                return row;
            });
    }, [filteredUsers, selectedUsers, currentPage]);

    const handlePageChange = (newPage) => {
        if (newPage < 1 || newPage > totalPages) return;
        setCurrentPage(newPage);
    };

    const actions = useCallback(
        (user) => (
            <div className="flex justify-center" key={`actions-${user.id}`}>
                <Dropdown className="">
                    <Dropdown.Trigger>
                        <SettingsIcon className="cursor-pointer text-gray-600 dark:text-gray-300" />
                    </Dropdown.Trigger>
                    <Dropdown.Content contentClasses="relative py-1 right-7 top-[-82px] bg-gray-100 dark:bg-gray-700">
                        <Dropdown.Link
                            onClick={(e) => {
                                e.preventDefault();
                                handleEditClick(user);
                            }}
                        >
                            Edit
                        </Dropdown.Link>
                        <Dropdown.Link
                            onClick={(e) => {
                                e.preventDefault();
                                handleDeleteClick(user);
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

    //Returning the JSX Layout

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    User Management
                </h2>
            }
        >
            <Head title="User Management" />
            <div className="px-4 py-4  overflow-hidden bg-white ring-1 ring-black/10 sm:rounded-lg dark:bg-gray-800/40">
                {users.length > 0 && (
                    <div className="w-full flex justify-between mb-3">
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                className="dark:text-white border-black/20 dark:border-white bg-transparent rounded-sm px-4 py-1 focus:outline-none focus:ring-none dark:focus:border-white"
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 items-center">
                            <DeleteIcon
                                className={`text-gray-600 dark:text-gray-300 cursor-pointer ${
                                    selectedUsers.length < 2
                                        ? "opacity-50 cursor-not-allowed"
                                        : ""
                                }`}
                                onClick={handleBulkDeleteClick}
                                disabled={selectedUsers.length < 2}
                            />
                        </div>
                    </div>
                )}

                <div className="text-gray-900 dark:text-gray-100">
                    <Table
                        headers={headers}
                        rows={paginatedRows}
                        actions={actions}
                    />
                </div>

                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                />
            </div>

            {/* Drawer for User */}
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

                        {checkRole(currentUser, ["Super Admin"]) && (
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
                        )}

                        {checkRole(currentUser, ["Super Admin"]) && (
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
                        )}

                        <div className="mt-5">
                            <SecondaryButton
                                className="h-10 mt-4 w-full  rounded-sm"
                                onClick={handleSaveClick}
                                disabled={processing}
                            >
                                {processing ? "Saving..." : "Save"}
                            </SecondaryButton>
                        </div>
                    </>
                )}
            </Drawer>

            {/* Confirmation Dialog */}
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
