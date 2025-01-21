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
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
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

    // Calculate total pages based on the filtered users
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

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

    const toggleDrawer = (state) => {
        setIsDrawerOpen(state);
    };

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

    const handleEditClick = (user) => {
        const userToEdit = users.find((u) => u.id === user.id);

        if (!userToEdit) {
            console.error("User not found:", user);
            return;
        }

        setSelectedUser(userToEdit);
        setIsDrawerOpen(true);
    };

    const handleDeleteClick = (user) => {
        setSelectedUser(user);
        setIsDialogOpen(true);
        setDialogTitle(`Are you sure you want to delete this user?`);
    };

    const handleConfirmDelete = async () => {
        if (!selectedUser || !selectedUser.id) {
            console.error("No user selected for deletion:", selectedUser);
            return;
        }

        try {
            const response = await axios.delete(
                `/api/users/${selectedUser.id}`
            );
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
    // Handle save functionality
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

    const actions = (user) => (
        <div className="flex justify-center" key={`actions-${user.id}`}>
            <TrueButton onClick={() => handleEditClick(user)}>Edit</TrueButton>
            <FalseButton onClick={() => handleDeleteClick(user)}>
                Delete
            </FalseButton>
        </div>
    );

    const departmentOptions = [
        { value: "HR", label: "HR" },
        { value: "IT", label: "IT" },
    ];

    const roleOptions = [
        { value: "Admin", label: "Admin" },
        { value: "Basic", label: "Basic" },
    ];

    const headers = [
        <Checkbox key="select-all" />,
        "#",
        "First Name",
        "Last Name",
        "Email",
        "Department",
        "Role",
    ];

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
            checkbox: <Checkbox key={`checkbox-${user.id}`} />,
            index: (currentPage - 1) * itemsPerPage + index + 1,
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            department: user.department,
            role: user.role,
        }));

    const handlePageChange = (newPage) => {
        if (newPage < 1 || newPage > totalPages) return;
        setCurrentPage(newPage);
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    User Management Wow
                </h2>
            }
        >
            <Head title="User Management" />
            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="px-6 py-4 overflow-hidden bg-white shadow-sm sm:rounded-lg dark:bg-gray-800">
                        <div className="w-full flex justify-between gap-4 ">
                            <div className="flex-1">
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    className="text-white border-white bg-transparent rounded-md px-4 py-1 focus:outline-none focus:ring-none focus:border-white"
                                    onChange={(e) => onSearch(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-2 items-center">
                                <DeleteIcon className="cursor-pointer text-white" />
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
                        <div className="text-gray-900 dark:text-gray-100">
                            <Table
                                headers={headers}
                                rows={paginatedRows} // Pass the paginated rows to the table
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
