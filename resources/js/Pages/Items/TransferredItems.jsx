import React, { useState, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import { Settings, Printer } from 'lucide-react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Table from '@/Components/Table';
import Pagination from '@/Components/Pagination';
import Checkbox from '@/Components/Checkbox';
import Dropdown from '@/Components/Dropdown';
import PrintTemplate from '@/Components/PrintTemplate';
import Modal from '@/Components/Modal';
import axios from 'axios';

export default function TransferredItems({ items = [] }) {
    // State management
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [selectedDepartment, setSelectedDepartment] = useState("");
    const [selectedDesignatedOffice, setSelectedDesignatedOffice] = useState("");
    const [selectedTransferTo, setSelectedTransferTo] = useState("");
    const [selectedTransferredAt, setSelectedTransferredAt] = useState("");
    const [filteredItems, setFilteredItems] = useState([]);
    const [selectedItems, setSelectedItems] = useState([]);
    const [approvalModalOpen, setApprovalModalOpen] = useState(false);
    const [selectedItemForApproval, setSelectedItemForApproval] = useState(null);

    // Toggle item selection
    const toggleItemSelection = (itemId) => {
        const itemToSelect = items.find(item => item.id === itemId);

        if (!itemToSelect) return;

        if (selectedItems.includes(itemId)) {
            setSelectedItems(prev => prev.filter(id => id !== itemId));
            return;
        }

        const referenceItem = selectedItems.length > 0
            ? items.find(item => item.id === selectedItems[0])
            : null;

        if (!referenceItem || (
            itemToSelect.transfer_to === referenceItem.transfer_to &&
            itemToSelect.name_designation === referenceItem.name_designation &&
            itemToSelect.designated_office === referenceItem.designated_office &&
            itemToSelect.office_name_designation === referenceItem.office_name_designation
        )) {
            setSelectedItems(prev => [...prev, itemId]);
        } else {
            alert('You can only select items with the same Transfer To, Name/Designation, Designated Office, and Office Name/Designation');
        }
    };

    // Get unique departments
    const departments = useMemo(() => {
        const uniqueCategories = [...new Set(items.map(item => item.category))];
        return uniqueCategories.sort((a, b) => a.localeCompare(b));
    }, [items]);

    // Get unique transfer_to options
    const transferToOptions = useMemo(() => {
        const uniqueTransfers = [...new Set(items.map(item => item.transfer_to))];
        return uniqueTransfers.sort((a, b) => a.localeCompare(b));
    }, [items]);

    // Get unique designated office options
    const designatedOfficeOptions = useMemo(() => {
        const uniqueOffices = [...new Set(items.map(item => item.designated_office))];
        return uniqueOffices.sort((a, b) => a.localeCompare(b));
    }, [items]);

    // Get unique transferred at dates (formatted)
    const transferredAtOptions = useMemo(() => {
        const uniqueDates = [...new Set(items.map(item =>
            format(new Date(item.transferred_at), 'yyyy-MM-dd')
        ))];
        return uniqueDates.sort((a, b) => b.localeCompare(a)); // Sort descending
    }, [items]);

    // Toggle select all items
    const toggleSelectAll = () => {
        if (selectedItems.length === paginatedItems.length) {
            setSelectedItems([]);
        } else {
            setSelectedItems(paginatedItems.map(item => item.id));
        }
    };

    // Handle bulk delete
    const handleBulkDelete = () => {
        if (confirm(`Are you sure you want to delete ${selectedItems.length} item(s)?`)) {
            console.log('Deleting:', selectedItems);
            setSelectedItems([]);
        }
    };

    const ApprovalStatus = ({ item }) => {
        const approvalStatus = typeof item.approval_status === 'string'
            ? JSON.parse(item.approval_status)
            : item.approval_status || {};

        return (
            <div className="flex flex-col gap-1">
                <div className="flex gap-2">
                    <span className={`text-xs p-1 rounded ${approvalStatus?.recommended?.approved ? 'bg-green-100 text-green-800' : 'bg-gray-100'
                        }`}>
                        GSO: {approvalStatus?.recommended?.approved ? '✓' : 'Pending'}
                    </span>
                    <span className={`text-xs p-1 rounded ${approvalStatus?.approved?.approved ? 'bg-green-100 text-green-800' : 'bg-gray-100'
                        }`}>
                        Mayor: {approvalStatus?.approved?.approved ? '✓' : 'Pending'}
                    </span>
                </div>
                <div className="flex gap-2">
                    <span className={`text-xs p-1 rounded ${approvalStatus?.witnessed?.approved ? 'bg-green-100 text-green-800' : 'bg-gray-100'
                        }`}>
                        Witness: {approvalStatus?.witnessed?.approved ? '✓' : 'Pending'}
                    </span>
                    <span className={`text-xs p-1 rounded ${approvalStatus?.name_designation?.approved ? 'bg-green-100 text-green-800' : 'bg-gray-100'
                        }`}>
                        Office Head: {approvalStatus?.name_designation?.approved ? '✓' : 'Pending'}
                    </span>
                    <span className={`text-xs p-1 rounded ${approvalStatus?.office_name_designation?.approved ? 'bg-green-100 text-green-800' : 'bg-gray-100'
                        }`}>
                        Office Head: {approvalStatus?.office_name_designation?.approved ? '✓' : 'Pending'}
                    </span>
                </div>
            </div>
        );
    };

    const refreshData = async () => {
        try {
            const response = await axios.get(route('transferred-items.index'));
            setFilteredItems(response.data);
        } catch (error) {
            console.error('Failed to refresh data:', error);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(route('transferred-items.index'));
                const items = response.data.map(item => ({
                    ...item,
                    approval_status: typeof item.approval_status === 'string'
                        ? JSON.parse(item.approval_status)
                        : item.approval_status
                }));
                setFilteredItems(items);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds

        return () => clearInterval(interval);
    }, []);

    // Initialize filtered items
    useEffect(() => {
        setFilteredItems(items);
    }, [items]);

    // Filter items based on selected filters
    useEffect(() => {
        let filtered = [...items];

        if (selectedDepartment) {
            filtered = filtered.filter(item => item.category === selectedDepartment);
        }

        if (selectedTransferTo) {
            filtered = filtered.filter(item => item.transfer_to === selectedTransferTo);
        }

        if (selectedDesignatedOffice) {
            filtered = filtered.filter(item => item.designated_office === selectedDesignatedOffice);
        }

        if (selectedTransferredAt) {
            filtered = filtered.filter(item =>
                format(new Date(item.transferred_at), 'yyyy-MM-dd') === selectedTransferredAt
            );
        }

        setFilteredItems(filtered);
        setCurrentPage(1);
    }, [items, selectedDepartment, selectedTransferTo, selectedDesignatedOffice, selectedTransferredAt]);

    // Reset all filters
    const handleResetFilters = () => {
        setSelectedDepartment("");
        setSelectedTransferTo("");
        setSelectedDesignatedOffice("");
        setSelectedTransferredAt("");
    };

    // Pagination logic
    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    const paginatedItems = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredItems.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredItems, currentPage, itemsPerPage]);

    // Calculate total value
    const overallTotal = filteredItems.reduce((sum, item) => sum + (item.quantity * item.amount), 0);

    // Handle print action
    const handlePrint = () => {
        if (selectedItems.length === 0) {
            alert('Please select at least one item to print');
            return;
        }
        window.print();
    };

    // Handle action selection
    const handleActionSelect = (itemId, action) => {
        console.log(`Action ${action} selected for item ${itemId}`);
    };

    // Table headers
    const headers = [
        {
            label: (
                <div className="flex justify-center">
                    <Checkbox
                        checked={selectedItems.length === paginatedItems.length && paginatedItems.length > 0}
                        onChange={toggleSelectAll}
                        indeterminate={selectedItems.length > 0 && selectedItems.length < paginatedItems.length ? "true" : undefined}
                    />
                </div>
            ),
            key: "checkbox",
            className: "w-12"
        },
        { label: "#", key: "id" },
        { label: "Category", key: "category" },
        { label: "Description", key: "description" },
        { label: "Date Purchase", key: "date_purchase" },
        { label: "Transfer To", key: "transfer_to" },
        { label: "Name/Designation", key: "name_designation" },
        { label: "Designated Office", key: "designated_office" },
        { label: "Office Name/Designation", key: "office_name_designation" },
        { label: "Transferred Qty", key: "quantity" },
        { label: "Remaining Qty", key: "remaining_quantity" },
        { label: "Property No.", key: "property_no" },
        { label: "Classification No.", key: "classification_no" },
        { label: "Amount", key: "amount" },
        { label: "Total", key: "total" },
        { label: "Transferred At", key: "transferred_at" },
        { label: "Approval Status", key: "approval_status" },
        { label: "Actions", key: "actions" }
    ];

    // Table rows
    const rows = paginatedItems.map((item) => ({
        checkbox: (
            <div className="flex justify-center">
                <Checkbox
                    checked={selectedItems.includes(item.id)}
                    onChange={() => toggleItemSelection(item.id)}
                />
            </div>
        ),
        "#": <span className="dark:text-white">{item.id}</span>,
        category: <span className="dark:text-white">{item.category}</span>,
        description: <span className="dark:text-white">{item.description}</span>,
        date_purchase: (
            <span className="dark:text-white">
                {item.date_purchase ? format(new Date(item.date_purchase), 'yyyy-MM-dd') : 'N/A'}
            </span>
        ),
        transfer_to: <span className="dark:text-white">{item.transfer_to}</span>,
        name_designation: <span className="dark:text-white">{item.name_designation}</span>,
        designated_office: <span className="dark:text-white">{item.designated_office}</span>,
        office_name_designation: <span className="dark:text-white">{item.office_name_designation}</span>,
        quantity: <span className="dark:text-white">{item.quantity}</span>,
        // Change this line in the rows mapping
remaining_quantity: <span className="dark:text-white">
{item.original_item?.remaining_quantity ?? 'N/A'}
</span>,
        property_no: <span className="dark:text-white">{item.property_no}</span>,
        classification_no: <span className="dark:text-white">{item.classification_no}</span>,
        amount: <span className="dark:text-white">₱ {item.amount.toLocaleString()}</span>,
        total: <span className="dark:text-white">₱ {(item.quantity * item.amount).toLocaleString()}</span>,
        transferred_at: <span className="dark:text-white">{format(new Date(item.transferred_at), 'yyyy-MM-dd HH:mm')}</span>,
        approval_status: <ApprovalStatus item={item} />,
        actions: (
            <Dropdown>
                <Dropdown.Trigger>
                    <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <Settings className="w-5 h-5" />
                    </button>
                </Dropdown.Trigger>
                <Dropdown.Content>
                    <button
                        onClick={() => handleActionSelect(item.id, 'delete')}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                        Delete
                    </button>
                </Dropdown.Content>
            </Dropdown>
        )
    }));

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    Transferred Items
                </h2>
            }
        >
            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <PrintTemplate
                        selectedItems={items.filter(item => selectedItems.includes(item.id))}
                    />

                    <div className="flex justify-end mb-4">
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-sm transition-colors"
                        >
                            <Printer className="w-5 h-5" />
                            Print Selected
                        </button>
                    </div>



                    <div className="bg-white dark:bg-gray-800/40 ring-1 ring-black/10 rounded-lg shadow-sm">
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                                <div className="flex items-center gap-3">
                                    <select
                                        value={selectedDepartment}
                                        onChange={(e) => setSelectedDepartment(e.target.value)}
                                        className="border border-black/20 dark:border-white py-1 rounded-sm text-gray-700 dark:text-gray-300 bg-transparent cursor-pointer"
                                    >
                                        <option className="dark:bg-gray-800 dark:text-gray-300" value="">Select Category</option>
                                        {departments.map((category) => (
                                            <option className="dark:bg-gray-800 dark:text-gray-300" key={category} value={category}>
                                                {category}
                                            </option>
                                        ))}
                                    </select>
                                    <select
                                        value={selectedTransferTo}
                                        onChange={(e) => setSelectedTransferTo(e.target.value)}
                                        className="border border-black/20 dark:border-white py-1 rounded-sm text-gray-700 dark:text-gray-300 bg-transparent cursor-pointer"
                                    >
                                        <option className="dark:bg-gray-800 dark:text-gray-300" value="">Filter Transfer To</option>
                                        {transferToOptions.map((transfer) => (
                                            <option className="dark:bg-gray-800 dark:text-gray-300" key={transfer} value={transfer}>
                                                {transfer}
                                            </option>
                                        ))}
                                    </select>
                                    <select
                                        value={selectedDesignatedOffice}
                                        onChange={(e) => setSelectedDesignatedOffice(e.target.value)}
                                        className="border border-black/20 dark:border-white py-1 rounded-sm text-gray-700 dark:text-gray-300 bg-transparent cursor-pointer"
                                    >
                                        <option className="dark:bg-gray-800 dark:text-gray-300" value="">Filter Designated Office</option>
                                        {designatedOfficeOptions.map((office) => (
                                            <option className="dark:bg-gray-800 dark:text-gray-300" key={office} value={office}>
                                                {office}
                                            </option>
                                        ))}
                                    </select>
                                    <select
                                        value={selectedTransferredAt}
                                        onChange={(e) => setSelectedTransferredAt(e.target.value)}
                                        className="border border-black/20 dark:border-white py-1 rounded-sm text-gray-700 dark:text-gray-300 bg-transparent cursor-pointer"
                                    >
                                        <option className="dark:bg-gray-800 dark:text-gray-300" value="">Filter Transferred At</option>
                                        {transferredAtOptions.map((date) => (
                                            <option className="dark:bg-gray-800 dark:text-gray-300" key={date} value={date}>
                                                {format(new Date(date), 'MMM dd, yyyy')}
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={handleResetFilters}
                                        className="px-3 py-1 text-sm bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                                    >
                                        Reset Filters
                                    </button>
                                </div>
                                <div className="flex dark:bg-gray-900 w-[200px] min-w-[200px] p-2 rounded-sm border-[1px] border-gray-400 dark:border-gray-400">
                                    <span className="text-lg text-black dark:text-white">
                                        ₱ {overallTotal.toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            <Table headers={headers} rows={rows} />

                            {filteredItems.length > 0 && (
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={setCurrentPage}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
