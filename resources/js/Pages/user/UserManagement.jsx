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
import SearchBar from "@/Components/SearchBar";
import { useState, useEffect } from "react";
import axios from "axios";

// Department and Role Options
const departmentOptions = [
    { value: "HR", label: "HR" },
    { value: "IT", label: "IT" },
];

const roleOptions = [
    { value: "Admin", label: "Admin" },
    { value: "Basic", label: "Basic" },
];

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
    const [dialogTitle, setDialogTitle] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [sortOrder, setSortOrder] = useState("asc");

    // Fetch Users on mount
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

    // Handle Search
    const handleSearch = (searchTerm) => {
        const filtered = users.filter((user) =>
            Object.values(user)
                .join(" ")
                .toLowerCase()
                .includes(searchTerm.toLowerCase())
        );
        setFilteredUsers(filtered);
    };

    // Handle Sort
    const handleSort = (order) => {
        setSortOrder(order);
        const sortedUsers = [...filteredUsers].sort((a, b) =>
            order === "asc"
                ? a.firstname.localeCompare(b.firstname)
                : b.firstname.localeCompare(a.firstname)
        );
        setFilteredUsers(sortedUsers);
    };

    // Toggle Drawer
    const toggleDrawer = (state) => {
        setIsDrawerOpen(state);
    };

    // Handle Edit
    const handleEditClick = (user) => {
        const { id, firstname, lastname, email, department, role } = user;
        setSelectedUser({ id, firstname, lastname, email, department, role });
        setIsDrawerOpen(true);
    };

    // Handle Delete
    const handleDeleteClick = (user) => {
        setSelectedUser(user);
        setDialogTitle("Are you sure you want to delete this user?");
        setIsDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedUser || !selectedUser.id) return;
        try {
            const response = await axios.delete(`/api/users/${selectedUser.id}`);
            if (response.status === 200) {
                setUsers(users.filter((user) => user.id !== selectedUser.id));
                setSuccessMessage("User successfully deleted!");
                setIsSuccessDialogOpen(true);
            }
            setIsDialogOpen(false);
        } catch (error) {
            console.error("Error deleting user:", error);
            setIsDialogOpen(false);
        }
    };

    const handleCancelDelete = () => {
        setSelectedUser(null);
        setIsDialogOpen(false);
    };

    // Handle Save
    const handleSaveClick = async () => {
        if (!selectedUser || !selectedUser.id) return;
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
                    user.id === selectedUser.id ? { ...user, ...selectedUser } : user
                )
            );
            setSuccessMessage("User successfully updated!");
            setIsSuccessDialogOpen(true);
            setIsDrawerOpen(false);
        } catch (error) {
            console.error("Error saving user:", error);
        }
    };

    // Actions for table rows
    const actions = (user) => (
        <div className="flex justify-center" key={`actions-${user.id}`}>
            <TrueButton onClick={() => handleEditClick(user)}>Edit</TrueButton>
            <FalseButton onClick={() => handleDeleteClick(user)}>
                Delete
            </FalseButton>
        </div>
    );

    // Table Headers and Rows
    const headers = [
        <Checkbox key="select-all" />,
        "#",
        "First Name",
        "Last Name",
        "Email",
        "Department",
        "Role",
    ];

    const rows = filteredUsers.map((user, index) => ({
        id: user.id,
        index: index + 1,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        department: user.department,
        role: user.role,
 
    }));

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    User Management wow
                </h2>
            }
        >
            <Head title="User Management" />
            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg dark:bg-gray-800">
                        <div className="px-6 py-3 text-gray-900 dark:text-gray-100">
                            <Table
                                headers={headers}
                                rows={rows}
                                actions={actions}
                                onSort={handleSort}
                                onSearch={handleSearch}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Drawer for Editing User */}
            <Drawer
                isDrawerOpen={isDrawerOpen}
                toggleDrawer={toggleDrawer}
                title="Edit"
            >
                {selectedUser && (
                    <>
                        <div>
                            <InputLabel htmlFor="firstname" value="First Name" />
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
                            <InputLabel htmlFor="department" value="Department" />
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

            {/* Confirmation Dialog */}
            <ConfirmationDialog
                isOpen={isDialogOpen}
                onConfirm={handleConfirmDelete}
                onCancel={handleCancelDelete}
                title={dialogTitle}
            />

            {/* Success Dialog */}
            <SuccessDialog
                isOpen={isSuccessDialogOpen}
                onClose={() => setIsSuccessDialogOpen(false)}
                message={successMessage}
            />
        </AuthenticatedLayout>
    );
};

export default UserManagement;
