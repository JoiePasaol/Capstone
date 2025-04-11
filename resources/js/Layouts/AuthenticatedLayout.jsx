import {
    Sidebar,
    Home,
    Users,
    User,
    Package,
    Truck,
    ChevronDown,
    LogOut,
    ArrowLeftRight,
} from "lucide-react";
import SimpleLightDarkToggle from "@/Components/SimpleLightDarkToggle";
import { Link, usePage } from "@inertiajs/react";
import { useState, useEffect } from "react";
import { checkRole } from "@/utils/CheckRole";

export default function AuthenticatedLayout({ header, children }) {
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [activeDropdown, setActiveDropdown] = useState(null);
    const { url } = usePage();
    const { user } = usePage().props.auth;

    const isActive = (paths) => {
        if (!Array.isArray(paths)) {
            paths = [paths];
        }
        const currentPath = url.replace(/^\//, '');
        return paths.some(path => {
            const routePath = path.replace(/^\//, '');
            return currentPath === routePath ||
                   currentPath.startsWith(`${routePath}/`);
        });
    };

    const toggleDropdown = (menu) => {
        setActiveDropdown((prev) => (prev === menu ? null : menu));
    };

    useEffect(() => {
        if (isActive(["user-status", "user-management"])) {
            setActiveDropdown("users");
        }
    }, [url]);

    useEffect(() => {
        if (isActive(["item-list", "item-report", "item-borrow"])) {
            setActiveDropdown("items");
        } else if (isActive(["transferred-items", "signatory"])) {
            setActiveDropdown("transfer");
        }
    }, [url]);

    return (
        <div className="h-screen flex bg-gray-200 dark:bg-gray-900 overflow-hidden duration-300">
            {/* Sidebar */}
            <div
                className={`fixed inset-y-0 left-0 z-30 transform bg-white dark:bg-gray-800 shadow-lg transition-all duration-300 ease-in-out flex flex-col ${
                    isSidebarOpen ? "w-64" : "w-20"
                }`}
            >
                {/* Logo */}
                <div className="flex items-center justify-center h-16 px-4 border-b dark:border-gray-700 text-5xl font-bold text-stroke">
                    LGU
                </div>

                {/* Navigation Links - Scrollable Area */}
                <nav className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-2 dark:text-gray-200">
                    <Link
                        href={route("dashboard")}
                        className={`flex items-center px-4 py-3 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 ${
                            isActive("dashboard")
                                ? "bg-blue-100 text-blue-500 dark:bg-indigo-900/50 dark:text-indigo-400"
                                : ""
                        }`}
                    >
                        <Home className="w-5 h-5 min-w-[20px]" />
                        <span className={`ml-3 ${isSidebarOpen ? "" : "hidden"}`}>
                            Dashboard
                        </span>
                    </Link>


                    {/* Categories */}
                    <Link
                        href={route("categories")}
                        className={`flex items-center px-4 py-3 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 ${
                            isActive("categories")
                                ? "bg-blue-100 text-blue-500 dark:bg-indigo-900/50 dark:text-indigo-400"
                                : ""
                        }`}
                    >
                        <Package className="w-5 h-5 min-w-[20px]" />
                        <span className={`ml-3 ${isSidebarOpen ? "" : "hidden"}`}>
                            Categories
                        </span>
                    </Link>

                    {/* Suppliers */}
                    <Link
                        href={route("supplier")}
                        className={`flex items-center px-4 py-3 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 ${
                            isActive("supplier")
                                ? "bg-blue-100 text-blue-500 dark:bg-indigo-900/50 dark:text-indigo-400"
                                : ""
                        }`}
                    >
                        <Truck className="w-5 h-5 min-w-[20px]" />
                        <span className={`ml-3 ${isSidebarOpen ? "" : "hidden"}`}>
                            Suppliers
                        </span>
                    </Link>

                    {/* Items Dropdown */}
                    {(checkRole(user, ["Basic"]) || checkRole(user, ["Super Admin", "Admin"])) && (
                        <div>
                            <button
                                onClick={() => toggleDropdown("items")}
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors hover:bg-gray-200 dark:hover:bg-gray-700 ${
                                    isActive(["item-list", "item-report", "item-borrow"]) || activeDropdown === "items"
                                        ? "bg-blue-100 text-blue-500 dark:bg-indigo-900/50 dark:text-indigo-400"
                                        : ""
                                }`}
                            >
                                <div className="flex items-center">
                                    <Package className="w-5 h-5 min-w-[20px]" />
                                    <span className={`ml-3 ${isSidebarOpen ? "" : "hidden"}`}>
                                        Items
                                    </span>
                                </div>
                                {isSidebarOpen && (
                                    <ChevronDown
                                        className={`w-4 h-4 transition-transform ${
                                            activeDropdown === "items" ? "rotate-180" : ""
                                        }`}
                                    />
                                )}
                            </button>

                            {activeDropdown === "items" && isSidebarOpen && (
                                <div className="ml-5 mt-2 border-l border-gray-300 dark:border-gray-600 pl-4 space-y-2">
                                    <Link
                                        href={route("item-list")}
                                        className={`relative block px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 ${
                                            isActive("item-list")
                                                ? "bg-blue-100 text-blue-500 dark:bg-indigo-900/50 dark:text-indigo-400"
                                                : ""
                                        } before:absolute before:-left-4 before:top-1/2 before:h-0.5 before:w-3 before:bg-gray-300 dark:before:bg-gray-600`}
                                    >
                                        Item List
                                    </Link>

                                    {user.role === "Super Admin" && (
                                        <>
                                            <Link
                                                href={route("item-borrow")}
                                                className={`relative block px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 ${
                                                    isActive("item-borrow")
                                                        ? "bg-blue-100 text-blue-500 dark:bg-indigo-900/50 dark:text-indigo-400"
                                                        : ""
                                                } before:absolute before:-left-4 before:top-1/2 before:h-0.5 before:w-3 before:bg-gray-300 dark:before:bg-gray-600`}
                                            >
                                                Item Borrow
                                            </Link>
                                           
                                            <Link
                                                href={route("item-report")}
                                                className={`relative block px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 ${
                                                    isActive("item-report")
                                                        ? "bg-blue-100 text-blue-500 dark:bg-indigo-900/50 dark:text-indigo-400"
                                                        : ""
                                                } before:absolute before:-left-4 before:top-1/2 before:h-0.5 before:w-3 before:bg-gray-300 dark:before:bg-gray-600`}
                                            >
                                                Item Report
                                            </Link>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Transfer Dropdown */}
                    <div>
                        <button
                            onClick={() => toggleDropdown("transfer")}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors hover:bg-gray-200 dark:hover:bg-gray-700 ${
                                isActive(["transferred-items", "signatory"]) || activeDropdown === "transfer"
                                    ? "bg-blue-100 text-blue-500 dark:bg-indigo-900/50 dark:text-indigo-400"
                                    : ""
                            }`}
                        >
                            <div className="flex items-center">
                                <ArrowLeftRight className="w-5 h-5 min-w-[20px]" />
                                <span className={`ml-3 ${isSidebarOpen ? "" : "hidden"}`}>
                                    Transfer
                                </span>
                            </div>
                            {isSidebarOpen && (
                                <ChevronDown
                                    className={`w-4 h-4 transition-transform ${
                                        activeDropdown === "transfer" ? "rotate-180" : ""
                                    }`}
                                />
                            )}
                        </button>

                        {activeDropdown === "transfer" && isSidebarOpen && (
                            <div className="ml-5 mt-2 border-l border-gray-300 dark:border-gray-600 pl-4 space-y-2">
                                <Link
                                    href={route("transferred-items")}
                                    className={`relative block px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 ${
                                        isActive("transferred-items")
                                            ? "bg-blue-100 text-blue-500 dark:bg-indigo-900/50 dark:text-indigo-400"
                                            : ""
                                    } before:absolute before:-left-4 before:top-1/2 before:h-0.5 before:w-3 before:bg-gray-300 dark:before:bg-gray-600`}
                                >
                                    Transferred Items
                                </Link>
                                <Link
                                    href={route("signatory")}
                                    className={`relative block px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 ${
                                        isActive("signatory")
                                            ? "bg-blue-100 text-blue-500 dark:bg-indigo-900/50 dark:text-indigo-400"
                                            : ""
                                    } before:absolute before:-left-4 before:top-1/2 before:h-0.5 before:w-3 before:bg-gray-300 dark:before:bg-gray-600`}
                                >
                                    Signatory
                                </Link>
                            </div>
                        )}
                    </div>
                </nav>

                {/* Footer - Profile and Logout */}
                <div className="border-t dark:border-gray-700 p-4 space-y-2">
                    <Link
                        href={route("profile.edit")}
                        className="w-full flex items-center px-4 py-3 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
                    >
                        <User className="w-5 h-5 min-w-[20px] dark:text-gray-300" />
                        {isSidebarOpen && (
                            <div className="ml-3">
                                <div className="font-medium dark:text-gray-300">{user.firstname}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-500">{user.role}</div>
                            </div>
                        )}
                    </Link>
                    <Link
                        href={route("logout")}
                        method="post"
                        as="button"
                        className="w-full flex items-center px-4 py-3 rounded-lg text-red-600 hover:bg-red-200 dark:hover:bg-red-900/30"
                    >
                        <LogOut className="w-5 h-5 min-w-[20px]" />
                        <span className={`ml-3 ${isSidebarOpen ? "" : "hidden"}`}>
                            Logout
                        </span>
                    </Link>
                </div>
            </div>

            {/* Main Content */}
            <div
                className={`flex-1 flex flex-col h-screen overflow-hidden transition-all duration-300 ${
                    isSidebarOpen ? "ml-64" : "ml-20"
                }`}
            >
                {/* Top Bar */}
                <div className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 duration-300">
                    <div className="flex items-center justify-between h-16 px-4">
                        <button
                            onClick={() => setSidebarOpen(!isSidebarOpen)}
                            className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
                        >
                            <Sidebar className="w-6 h-6 text-gray-500" />
                        </button>
                        <SimpleLightDarkToggle />
                    </div>
                </div>

                {/* Page Content */}
                <div className="flex-1 overflow-y-auto scrollbar-hide p-4">
                    <main>{children}</main>
                </div>
            </div>
        </div>
    );
}