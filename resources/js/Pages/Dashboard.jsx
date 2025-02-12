import { useState, useEffect } from "react";
import { Head } from "@inertiajs/react";
import { GrMoney } from "react-icons/gr";
import { toast, Toaster } from "react-hot-toast";
import { IoIosCheckmarkCircle } from "react-icons/io";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import InventoryIcon from "@mui/icons-material/Inventory";
import DashboardCard from "@/Components/DashboardCard";
import "../../css/toaster.css"
import axios from "axios";



export default function Dashboard({ successMessage }) {

    const [pendingUsers, setPendingUsers] = useState(0);
    const [approvedUsers, setApprovedUsers] = useState(0);
    const [totalItems, setTotalItems] = useState(0);
    const [totalAmount, setTotalAmount] = useState(0);

    useEffect(() => {
        const fetchCounts = async () => {
            try {
                const [
                    pendingResponse,
                    approvedResponse,
                    itemsResponse,
                    amountResponse,
                ] = await Promise.all([
                    axios.get("/api/users/pending-count"),
                    axios.get("/api/users/approved-count"),
                    axios.get("/api/items/total-count"),
                    axios.get("/api/items/total-amount"),
                ]);

                setPendingUsers(pendingResponse.data.pending_users);
                setApprovedUsers(approvedResponse.data.approved_users);
                setTotalItems(itemsResponse.data.total_items);
                setTotalAmount(amountResponse.data.total_amount);
            } catch (error) {
                console.error("Error fetching counts:", error);
            }
        };

        fetchCounts();
    }, []);

    useEffect(() => {
        if (successMessage) {
            toast.custom((t) => (
                <div
                    className="slide-in flex items-center p-3 bg-[#008558] text-white rounded-md shadow-md"
                    style={{
                        marginTop: "60px",
                    }}
                >
                    <IoIosCheckmarkCircle style={{ fontSize: "24px", marginRight: "8px" }} />
                    {successMessage}
                </div>
            ), {
                duration: 3000,
                position: "top-right",
            });
        }
    }, [successMessage]);

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    Dashboard
                </h2>
            }
        >
            <Head title="Dashboard" />
            <Toaster />
            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        <DashboardCard
                            title="User Pending"
                            value={pendingUsers}
                            icon={
                                <PeopleAltIcon
                                    className="absolute right-[-40px] bottom-[-40px]"
                                    style={{ fontSize: "230px" }}
                                />
                            }
                            bgColor=" bg-red-500"
                        />
                        <DashboardCard
                            title="Total Users"
                            value={approvedUsers}
                            icon={
                                <PeopleAltIcon
                                    className="absolute right-[-40px] bottom-[-40px]"
                                    style={{ fontSize: "230px" }}
                                />
                            }
                            bgColor="bg-green-500"
                        />
                        <DashboardCard
                            title="Total Items"
                            value={totalItems}
                            icon={
                                <InventoryIcon
                                    className="absolute right-[-40px] bottom-[-40px]"
                                    style={{ fontSize: "205px" }}
                                />
                            }
                            bgColor=" bg-blue-500"
                            link={route("item-list")}
                        />
                        <DashboardCard
                            title="Total Amount"
                            value={`₱${totalAmount.toLocaleString()}`}
                            icon={
                                <GrMoney
                                    className="absolute right-[-40px] bottom-[-40px]"
                                    style={{ fontSize: "195px" }}
                                />
                            }
                            bgColor="bg-orange-500"
                        />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
