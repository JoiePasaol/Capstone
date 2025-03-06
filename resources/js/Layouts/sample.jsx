
import { Menu, X, Home, Users, Package, Truck, ChevronDown, User, LogOut, Sun, Moon } from 'lucide-react';
import LightDarkToggle from "@/Components/SimpleLightDarkToggle";
import { Link, usePage } from "@inertiajs/react";
import { useState } from "react";
import { checkRole } from "@/utils/CheckRole";

export default function AuthenticatedLayout({ header, children }) {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isDarkMode, setDarkMode] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Mock user and route data (replace with your actual data/logic)
  const user = {
    firstname: "John Doe",
    role: "Super Admin"
  };

  const isActive = (path: string) => false; 

  const toggleDropdown = (menu: string) => {
    setActiveDropdown(activeDropdown === menu ? null : menu);
  };

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 z-30 transform bg-white dark:bg-gray-800 shadow-lg transition-all duration-300 ease-in-out ${
          isSidebarOpen ? 'w-64' : 'w-20'
        } lg:static`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b dark:border-gray-700">
          <div className={`text-2xl font-bold text-indigo-600 dark:text-indigo-400 transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>IIS</div>
          <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            {isSidebarOpen ? <X className="w-5 h-5 text-gray-500" /> : <Menu className="w-5 h-5 text-gray-500" />}
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="p-4 space-y-2">
          <a href="/dashboard" className={`flex items-center px-4 py-3 rounded-lg transition-colors ${isActive('dashboard') ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
            <Home className="w-5 h-5 min-w-[20px]" />
            <span className={`ml-3 transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>Dashboard</span>
          </a>

          {/* Users Dropdown */}
          {user.role === "Super Admin" && (
            <div>
              <button 
                onClick={() => toggleDropdown('users')} 
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${activeDropdown === 'users' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              >
                <div className="flex items-center">
                {checkRole(user, ["Super Admin", "Admin"]) && (
                  <Users className="w-5 h-5 min-w-[20px]" />
                  <span className={`ml-3 transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>Users</span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${activeDropdown === 'users' ? 'rotate-180' : ''} ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0'}`} />
              </button>
              
              {activeDropdown === 'users' && isSidebarOpen && (
                <div className="ml-9 mt-2 space-y-2">
                      active={
                                            route().current("user-status") ||
                                            route().current("user-management")
                                        }
                                        dropdownItems={[
                                            {
                                                label: "User Pending",
                                                href: route("user-status"),
                                            },
                                            {
                                                label: "User Management",
                                                href: route("user-management"),
                                            },
                                        ]}
              )}
            </div>

)}
          )}

          {/* Categories */}
          <a href="/categories" className={`flex items-center px-4 py-3 rounded-lg transition-colors ${isActive('categories') ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
            <Package className="w-5 h-5 min-w-[20px]" />
            <span className={`ml-3 transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>Categories</span>
            href={route("categories")}
                                active={route().current("categories")}
                            >
                                Categories
          </a>

          {/* Suppliers */}
          <a href="/suppliers" className={`flex items-center px-4 py-3 rounded-lg transition-colors ${isActive('suppliers') ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
            <Truck className="w-5 h-5 min-w-[20px]" />
            <span className={`ml-3 transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>Suppliers</span>
            href={route("supplier")}
                                active={route().current("supplier")}
                            >
                                Suppliers
          </a>

          {/* Items Dropdown */}
          <div>
          {checkRole(user, ["Basic"]) ? (
            <button 
              onClick={() => toggleDropdown('items')} 
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${activeDropdown === 'items' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            >
                      ) : (
              <div className="flex items-center">
                <Package className="w-5 h-5 min-w-[20px]" />
                <span className={`ml-3 transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>Items</span>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${activeDropdown === 'items' ? 'rotate-180' : ''} ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0'}`} />
            </button>
               checkRole(user, ["Super Admin", "Admin"]) && {
            
            {activeDropdown === 'items' && isSidebarOpen && (
              <div className="ml-9 mt-2 space-y-2">
                <a href="/item-list" className="block px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">Item List</a>
                {user.role === "Super Admin" && (
                  <>
                       label: "Item Report",
                                            href: route("item-report"),
                                            label: "Item Borrow",
                                            href: route("item-borrow"),
                  </>
                )}
              </div>
            )}
          </div>
        </nav>

        {/* User Profile Section */}
        <div className="absolute bottom-0 left-0 right-0 border-t dark:border-gray-700">
          <div className="p-4">
            <div className="flex items-center px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
              <User className="w-5 h-5 min-w-[20px]" />
              <div className={`ml-3 transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>
                <div className="font-medium">{user.firstname}</div>
                <div className="text-sm text-gray-500">{user.role}</div>
                href={route("profile.edit")}
              </div>
            </div>
            <div className="mt-2">
              <button className="w-full flex items-center px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/50">
                <LogOut className="w-5 h-5 min-w-[20px]" />
                href={route("logout")}
                                            method="post"
                                            as="button"
                <span className={`ml-3 transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {/* Top Bar */}
        <div className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
          <div className="flex items-center justify-between h-16 px-4">
            <button 
              onClick={() => setSidebarOpen(!isSidebarOpen)} 
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Menu className="w-6 h-6 text-gray-500" />
            </button>
            
            {/* Dark Mode Toggle */}
            <button 
              onClick={() => setDarkMode(!isDarkMode)} 
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-6">
        {header && (
                <header className="bg-white shadow dark:bg-gray-800">
                    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                        {header}
                    </div>
                </header>
            )}

            <main>{children}</main>
        </div>
      </div>
    </div>
  );
}

export default App;