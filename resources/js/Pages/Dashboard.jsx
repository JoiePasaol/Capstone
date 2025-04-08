import { useState, useEffect } from "react";
import { Head, usePage } from "@inertiajs/react";
import { GrMoney } from "react-icons/gr";
import { toast, Toaster } from "react-hot-toast";
import "../../css/toaster.css";
import { IoIosCheckmarkCircle } from "react-icons/io";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import InventoryIcon from "@mui/icons-material/Inventory";
import CategoryIcon from "@mui/icons-material/Category";
import DashboardCard from "@/Components/DashboardCard";
import LineChart from "@/components/LineChart";
import axios from "axios";
import { checkRole } from "@/utils/CheckRole";

export default function Dashboard({ successMessage }) {
    // const [pendingUsers, setPendingUsers] = useState(0);
    // const [approvedUsers, setApprovedUsers] = useState(0);
    const [totalItems, setTotalItems] = useState(0);
    // const [totalAmount, setTotalAmount] = useState(0);
    const [totalCategories, setTotalCategories] = useState(0);
    const [totalSuppliers, setTotalSuppliers] = useState(0);
    const [totalBorrowed, setTotalBorrowed] = useState(0);
    const [totalOverdue, setTotalOverdue] = useState(0);
    const { user } = usePage().props.auth;

    useEffect(() => {
        const fetchCounts = async () => {
            try {
                const [
                    // pendingResponse,
                    // approvedResponse,
                    itemsResponse,
                    // amountResponse,
                    categoriesResponse,
                    supplierResponse,
                    borrowedResponse,
                    overdueResponse,
                ] = await Promise.all([
                    // axios.get("/api/users/pending-count"),
                    // axios.get("/api/users/approved-count"),
                    axios.get("/api/items/total-count"),
                    // axios.get("/api/items/total-amount"),
                    axios.get("/api/categories/total-count"),
                    axios.get("/api/suppliers/total-count"),
                    axios.get("/api/borrowed-items/total-count"),
                    axios.get("/api/borrowed-items/total-overdue"),
                ]);

                // setPendingUsers(pendingResponse.data.pending_users);
                // setApprovedUsers(approvedResponse.data.approved_users);
                setTotalItems(itemsResponse.data.total_items);
                // setTotalAmount(amountResponse.data.total_amount);
                setTotalCategories(categoriesResponse.data.total_categories);
                setTotalSuppliers(supplierResponse.data.total_suppliers);
                setTotalBorrowed(borrowedResponse.data.total_borrowed);
                setTotalOverdue(overdueResponse.data.total_overdue);
            } catch (error) {
                console.error("Error fetching counts:", error);
            }
        };

        fetchCounts();
    }, []);

    useEffect(() => {
        console.log("Success Message:", successMessage); // Debugging
        if (successMessage) {
            toast.custom(
                (t) => (
                    <div
                        className="slide-in flex items-center p-3 bg-[#008558] text-white rounded-md shadow-md"
                        style={{
                            marginBottom: "60px",
                        }}
                    >
                        <IoIosCheckmarkCircle
                            style={{ fontSize: "24px", marginRight: "8px" }}
                        />
                        {successMessage}
                    </div>
                ),
                {
                    duration: 3000,
                    position: "bottom-right",
                }
            );
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <DashboardCard
                    title="Total Categories"
                    value={totalCategories}
                    icon={
                        <CategoryIcon
                            className="absolute right-[-50px] bottom-[-40px]"
                            style={{ fontSize: "205px" }}
                        />
                    }
                    bgColor="bg-teal-500"
                    link={route("categories")}
                />

                <DashboardCard
                    title="Total Suppliers"
                    value={totalSuppliers}
                    icon={
                        <PeopleAltIcon
                            className="absolute right-[-40px] bottom-[-40px]"
                            style={{ fontSize: "230px" }}
                        />
                    }
                    bgColor="bg-purple-500"
                    link={route("supplier")}
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
                    bgColor="bg-blue-500"
                    link={route("item-list")}
                />

                {/* {checkRole(user, ["Super Admin", "Admin"]) && ( */}
                <>
                    <DashboardCard
                        title="Total Borrowed Item"
                        value={totalBorrowed}
                        icon={
                            <InventoryIcon
                            className="absolute right-[-40px] bottom-[-40px]"
                            style={{ fontSize: "205px" }}
                        />
                        }
                        bgColor="bg-green-500"
                        link={route("user-management")}
                    />

                    <DashboardCard
                        title="Total Overdue Item"
                        value={totalOverdue}
                        icon={
                            <InventoryIcon
                            className="absolute right-[-40px] bottom-[-40px]"
                            style={{ fontSize: "205px" }}
                        />
                        }
                        bgColor="bg-red-500"
                        link={route("user-status")}
                    />
                </>
                {/* )} */}

                {/* <DashboardCard
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

                        <div className="lg:col-span-2 p-6 bg-white dark:bg-gray-900 ring-1 ring-gray-400 dark:ring-gray-400  rounded-lg shadow-md flex flex-col justify-between">
                            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">
                                Monthly Report
                            </h2>
                            <LineChart />
                        </div> */}
            </div>
        </AuthenticatedLayout>
    );
}
