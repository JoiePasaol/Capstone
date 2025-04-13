import { useState, useEffect } from "react";
import { Head } from "@inertiajs/react";
import { toast, Toaster } from "react-hot-toast";
import "../../css/toaster.css";
import { IoIosCheckmarkCircle } from "react-icons/io";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import InventoryIcon from "@mui/icons-material/Inventory";
import CategoryIcon from "@mui/icons-material/Category";
import DashboardCard from "@/Components/DashboardCard";
import axios from "axios";


export default function Dashboard({ successMessage }) {
    const [totalItems, setTotalItems] = useState(0);
    const [totalCategories, setTotalCategories] = useState(0);
    const [totalSuppliers, setTotalSuppliers] = useState(0); 
    const [totalBorrowed, setTotalBorrowed] = useState(0);
    const [totalOverdue, setTotalOverdue] = useState(0);
    const [totalTransferred, setTotalTransferred] = useState(0);

    


    useEffect(() => {
        // Fetch total items, categories, and suppliers count
        const fetchCounts = async () => {
            try {
                console.log("Fetching counts...");

                const [
                    itemsResponse,
                    categoriesResponse,
                    suppliersResponse,
                    borrowedResponse,
                    overdueResponse,
                    transferredResponse,
                ] = await Promise.all([
                    axios.get("/api/items/total"),
                    axios.get("/api/categories/total"),
                    axios.get("/api/suppliers"),
                    axios.get("/api/borrowed-items/total-count"),
                    axios.get("/api/borrowed-items/total-overdue"),
                    axios.get("/api/transferred-items/total-transferred")
                ]);
                setTotalItems(itemsResponse.data.totalItems);
                setTotalCategories(categoriesResponse.data.totalCategories);
                setTotalSuppliers(suppliersResponse.data.suppliers.length);
                setTotalBorrowed(borrowedResponse.data.total_borrowed);
                setTotalOverdue(overdueResponse.data.total_overdue);
                setTotalTransferred(transferredResponse.data.total_transferred || 0);
            } catch (error) {
                console.error("Error fetching counts:", error);
                // Keep existing values on error
            }
        };
        
        fetchCounts();
    }, []);

    useEffect(() => {
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
                    value={totalCategories} // Display the total count
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
                    value={totalSuppliers} // Display the total supplier count
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
                        link={route("item-borrow")}
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
                        link={route("item-borrow")}
                    />
                         <DashboardCard
                    title="Total Transferred Item"
                    value={totalTransferred}
                    icon={
                        <InventoryIcon
                            className="absolute right-[-40px] bottom-[-40px]"
                            style={{ fontSize: "205px" }}
                        />
                    }
                    bgColor="bg-yellow-500"
                    link={route("transferred-items")}
                />
                </>

            </div>
        </AuthenticatedLayout>
    );
}
