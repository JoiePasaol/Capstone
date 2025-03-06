import {
    Sidebar,
    Home,
    Users,
    User,
    Package,
    Truck,
    ChevronDown,
    LogOut,
} from "lucide-react";
import SimpleLightDarkToggle from "@/Components/SimpleLightDarkToggle";
import { Link, usePage } from "@inertiajs/react";
import { useState, useEffect } from "react";
import { checkRole } from "@/utils/CheckRole";

export default function AuthenticatedLayout({ header, children }) {
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [activeDropdown, setActiveDropdown] = useState(null);
    const { url } = usePage(); // Get current page URL

    const { user } = usePage().props.auth;

    const isActive = (paths) => {
        if (!Array.isArray(paths)) {
            paths = [paths];
        }
        return paths.some((path) => url.startsWith(`/${path}`));
    };

    const toggleDropdown = (menu) => {
        setActiveDropdown((prev) => (prev === menu ? null : menu));
    };

    // Keep dropdown open when navigating between user pages
    useEffect(() => {
        if (isActive(["user-status", "user-management"])) {
            setActiveDropdown("users");
        }
    }, [window.location.pathname]);

    useEffect(() => {
        if (isActive(["item-list", "item-report", "item-borrow"])) {
            setActiveDropdown("items");
        }
    }, [window.location.pathname]);

    return (
        <div className="h-screen flex bg-gray-200 dark:bg-gray-900 overflow-hidden duration-300">
            {/* Sidebar */}
            <div
                className={`fixed inset-y-0 left-0 z-30 transform bg-white dark:bg-gray-800 shadow-lg transition-all duration-300 ease-in-out ${
                    isSidebarOpen ? "w-64" : "w-20"
                }`}
            >
                {/* Logo */}
                <div className="flex items-center justify-center h-16 px-4 border-b dark:border-gray-700 text-4xl font-bold text-stroke">
                    IIS
                </div>

                {/* Navigation Links */}
                <nav className="p-4 space-y-2 dark:text-gray-200">
                    <Link
                        href={route("dashboard")}
                        className={`flex items-center px-4 py-3 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 ${
                            isActive("dashboard")
                                ? "bg-blue-100 text-blue-500 dark:bg-indigo-900/50 dark:text-indigo-400"
                                : ""
                        }`}
                    >
                        <Home className="w-5 h-5 min-w-[20px]" />
                        <span
                            className={`ml-3 ${isSidebarOpen ? "" : "hidden"}`}
                        >
                            Dashboard
                        </span>
                    </Link>

                    {/* Users Dropdown */}
                    {checkRole(user, ["Super Admin", "Admin"]) && (
                        <div>
                            <button
                                onClick={() => toggleDropdown("users")}
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                                    isActive([
                                        "user-status",
                                        "user-management",
                                    ]) || activeDropdown === "users"
                                        ? "bg-blue-100 text-blue-500 dark:bg-indigo-900/50 dark:text-indigo-400"
                                        : ""
                                }`}
                            >
                                <div className="flex items-center">
                                    <Users className="w-5 h-5 min-w-[20px]" />
                                    <span
                                        className={`ml-3 ${
                                            isSidebarOpen ? "" : "hidden"
                                        }`}
                                    >
                                        Users
                                    </span>
                                </div>
                                <ChevronDown
                                    className={`w-4 h-4 transition-transform ${
                                        activeDropdown === "users"
                                            ? "rotate-180"
                                            : ""
                                    }`}
                                />
                            </button>

                            {activeDropdown === "users" && isSidebarOpen && (
                                <div className="ml-5 mt-2 border-l border-gray-300 dark:border-gray-600 pl-4 space-y-2">
                                    <Link
                                        href={route("user-status")}
                                        className={`relative block px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 ${
                                            isActive("user-status")
                                                ? "bg-blue-100 text-blue-500 dark:bg-indigo-900/50 dark:text-indigo-400"
                                                : ""
                                        } before:absolute before:-left-4 before:top-1/2 before:h-0.5 before:w-3 before:bg-gray-300 dark:before:bg-gray-600`}
                                    >
                                        User Pending
                                    </Link>

                                    <Link
                                        href={route("user-management")}
                                        className={`relative block px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 ${
                                            isActive("user-management")
                                                ? "bg-blue-100 text-blue-500 dark:bg-indigo-900/50 dark:text-indigo-400"
                                                : ""
                                        } before:absolute before:-left-4 before:top-1/2 before:h-0.5 before:w-3 before:bg-gray-300 dark:before:bg-gray-600`}
                                    >
                                        User Management
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}
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
                        <span
                            className={`ml-3 ${isSidebarOpen ? "" : "hidden"}`}
                        >
                            Categories
                        </span>
                    </Link>

                    <Link
                        href={route("supplier")}
                        className={`flex items-center px-4 py-3 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 ${
                            isActive("supplier")
                                ? "bg-blue-100 text-blue-500 dark:bg-indigo-900/50 dark:text-indigo-400"
                                : ""
                        }`}
                    >
                        <Truck className="w-5 h-5 min-w-[20px]" />
                        <span
                            className={`ml-3 ${isSidebarOpen ? "" : "hidden"}`}
                        >
                            Suppliers
                        </span>
                    </Link>

                    {checkRole(user, ["Basic"]) ? (
                        <button
                            onClick={() => toggleDropdown("items")}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                                isActive([
                                    "item-list",
                                    "item-report",
                                    "item-borrow",
                                ]) || activeDropdown === "items"
                                    ? "bg-blue-100 text-blue-500 dark:bg-indigo-900/50 dark:text-indigo-400"
                                    : ""
                            }`}
                        >
                            <div className="flex items-center">
                                <Package className="w-5 h-5 min-w-[20px]" />
                                <span
                                    className={`ml-3 transition-opacity duration-300 ${
                                        isSidebarOpen
                                            ? "opacity-100"
                                            : "opacity-0 w-0"
                                    }`}
                                >
                                    Items
                                </span>
                            </div>
                            <ChevronDown
                                className={`w-4 h-4 transition-transform ${
                                    activeDropdown === "items"
                                        ? "rotate-180"
                                        : ""
                                } ${
                                    isSidebarOpen
                                        ? "opacity-100"
                                        : "opacity-0 w-0"
                                }`}
                            />
                        </button>
                    ) : (
                        checkRole(user, ["Super Admin", "Admin"]) && (
                            <button
                                onClick={() => toggleDropdown("items")}
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                                    isActive([
                                        "item-list",
                                        "item-report",
                                        "item-borrow",
                                    ]) || activeDropdown === "items"
                                        ? "bg-blue-100 text-blue-500 dark:bg-indigo-900/50 dark:text-indigo-400"
                                        : ""
                                }`}
                            >
                                <div className="flex items-center">
                                    <Package className="w-5 h-5 min-w-[20px]" />
                                    <span
                                        className={`ml-3 transition-opacity ${
                                            isSidebarOpen
                                                ? "opacity-100"
                                                : "opacity-0 w-0"
                                        }`}
                                    >
                                        Items
                                    </span>
                                </div>
                                <ChevronDown
                                    className={`w-4 h-4 transition-transform ${
                                        activeDropdown === "items"
                                            ? "rotate-180"
                                            : ""
                                    } ${
                                        isSidebarOpen
                                            ? "opacity-100"
                                            : "opacity-0 w-0"
                                    }`}
                                />
                            </button>
                        )
                    )}

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
                                        href={route("item-report")}
                                        className={`relative block px-4 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 ${
                                            isActive("item-report")
                                                ? "bg-blue-100 text-blue-500 dark:bg-indigo-900/50 dark:text-indigo-400"
                                                : ""
                                        } before:absolute before:-left-4 before:top-1/2 before:h-0.5 before:w-3 before:bg-gray-300 dark:before:bg-gray-600`}
                                    >
                                        Item Report
                                    </Link>
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
                                </>
                            )}
                        </div>
                    )}
                    {/* Logout */}
                    <div className="absolute bottom-0 left-0 right-0 border-t dark:border-gray-700">
                        <div className="p-4">
                            <Link
                                href={route("profile.edit")}
                                className="w-full flex items-center px-4 py-3 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/50"
                            >
                                <User className="w-5 h-5 min-w-[20px]" />
                                {isSidebarOpen && (
                                    <div className="ml-3">
                                        <div className="font-medium">
                                            {user.firstname}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {user.role}
                                        </div>
                                    </div>
                                )}
                            </Link>
                            <Link
                                href={route("logout")}
                                method="post"
                                as="button"
                                className="w-full flex items-center px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/50"
                            >
                                <LogOut className="w-5 h-5 min-w-[20px]" />
                                <span
                                    className={`ml-3 ${
                                        isSidebarOpen ? "" : "hidden"
                                    }`}
                                >
                                    Logout
                                </span>
                            </Link>
                        </div>
                    </div>
                </nav>
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
                            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                            <Sidebar className="w-6 h-6 text-gray-500" />
                        </button>

                        <SimpleLightDarkToggle />
                    </div>
                </div>

                {/* Page Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    <main>{children}</main>
                </div>
            </div>
        </div>
    );
}
