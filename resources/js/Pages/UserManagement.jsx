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
import { useState, useEffect } from "react";
import axios from "axios";

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
    const [dialogTitle, setDialogTitle] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const toggleDrawer = (state) => {
        setIsDrawerOpen(state);
    };

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await axios.get("/api/users?status=approved");
                setUsers(response.data);
            } catch (error) {
                console.error("Error fetching users:", error);
            }
        };

        fetchUsers();
    }, []);

    const handleEditClick = (user) => {
        const { id, firstname, lastname, email, department, role } = user;

        if (!id) {
            console.error("Invalid user object:", user);
            return;
        }

        setSelectedUser({
            id,
            firstname,
            lastname,
            email,
            department,
            role,
        });

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

    const handleSaveClick = async () => {
        if (!selectedUser || !selectedUser.id) {
            console.error("Invalid selectedUser object:", selectedUser);
            return;
        }

        console.log("Saving user with ID:", selectedUser.id);

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
            <FalseButton onClick={() => handleDeleteClick(user.id)}>
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

    const rows = users.map((user, index) => ({
        id: user.id,
        checkbox: <Checkbox key={`checkbox-${user.id}`} />,
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
                    User Management
                </h2>
            }
        >
            <Head title="User Management" />
            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg dark:bg-gray-800">
                        <div className="p-6 text-gray-900 dark:text-gray-100">
                            <Table
                                headers={headers}
                                rows={rows}
                                actions={actions}
                            />
                        </div>
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
