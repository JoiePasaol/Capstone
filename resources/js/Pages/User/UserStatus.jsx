import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import Table from "@/Components/Table";
import Checkbox from "@/Components/Checkbox";
import TrueButton from "@/Components/TrueButton";
import FalseButton from "@/Components/FalseButton";
import { useState, useEffect } from "react";
import axios from "axios";

export default function UserStatus() {
    const [users, setUsers] = useState([]);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await axios.get("/api/users?status=pending");
            setUsers(response.data);
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    };

    const handleAccept = async (id, user) => {
        try {
            if (!user.role) {
                console.error("Role is missing");
                return;
            }

            await axios.patch(`/api/users/${id}/status`, {
                status: "approved",
                role: user.role,
            });

            fetchUsers();
        } catch (error) {
            console.error("Error updating user status:", error);
        }
    };

    const handleDecline = async (id) => {
        console.log("Deleting user with ID:", id);
        try {
            await axios.delete(`/api/users/${id}`);
            fetchUsers();
        } catch (error) {
            console.error("Error deleting user:", error);
        }
    };

    const handleRoleChange = (id, newRole) => {
        setUsers((prevUsers) =>
            prevUsers.map((user) =>
                user.id === id ? { ...user, role: newRole } : user
            )
        );
    };

    const headers = [
        { label: <Checkbox />, key: "select-all" },
        { label: "#", key: "index" },
        { label: "First Name", key: "firstname" },
        { label: "Last Name", key: "lastname" },
        { label: "Email", key: "email" },
        { label: "Department", key: "department" },
        { label: "Role", key: "role" },
        { label: "Action", key: "actions" }
    ];
    

    const rows = users.map((user, index) => ({
        checkbox: <Checkbox key={`checkbox-${user.id}`} />,
        index: index + 1,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        department: user.department || "N/A",
        role: (
            <select
            value={user.role}
            onChange={(e) => handleRoleChange(user.id, e.target.value)}
            className="w-full flex dark:bg-gray-800 border-none focus:outline-none focus:ring-0"
          >
             <option value="Basic">Basic</option>
            <option value="Admin">Admin</option>
          
          </select>
          
        ),
        actions: (
            <div className="flex justify-center" key={`actions-${user.id}`}>
                <TrueButton onClick={() => handleAccept(user.id, user)}>
                    Accept
                </TrueButton>
                <FalseButton onClick={() => handleDecline(user.id)}>
                    Decline
                </FalseButton>
            </div>
        ),
    }));

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    User Pending
                </h2>
            }
        >
            <Head title="User Status" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white ring-1 ring-black/10 sm:rounded-lg dark:bg-gray-800">
                        <div className="p-6 text-gray-900 dark:text-gray-100">
                            {users.length > 0 ? (
                                <Table headers={headers} rows={rows} />
                            ) : (
                                <div className="flex items-center justify-center h-48">
                                    <p className="text-xl font-semibold text-gray-500 dark:text-gray-400">
                                        No Pending User!
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
};