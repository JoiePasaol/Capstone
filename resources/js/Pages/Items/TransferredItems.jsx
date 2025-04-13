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
import { Head, useForm, usePage } from "@inertiajs/react";
import { CiImport, CiExport } from "react-icons/ci";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import Drawer from "@/Components/Drawer";
import InputLabel from "@/Components/InputLabel";
import InputError from "@/Components/InputError";
import TextInput from "@/Components/TextInput";
import SecondaryButton from "@/Components/SecondaryButton";
import SuccessDialog from "@/Components/SuccessDialog";
import ConfirmationDialog from "@/Components/ConfirmationDialog";

export default function TransferredItems({ items = [] }) {
    const { auth } = usePage().props;
    const currentUser = auth.user;

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [selectedDepartment, setSelectedDepartment] = useState("");
    const [selectedTransferTo, setSelectedTransferTo] = useState("");
    const [selectedTransferredAt, setSelectedTransferredAt] = useState("");
    const [filteredItems, setFilteredItems] = useState([]);
    const [selectedItems, setSelectedItems] = useState([]);
    const [approvalModalOpen, setApprovalModalOpen] = useState(false);
    const [selectedItemForApproval, setSelectedItemForApproval] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [transferItemId, setTransferItemId] = useState(null);
    const [isSuccessDialogOpen, setIsSuccessDialogOpen] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [processing, setProcessing] = useState(false);

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

    const departments = useMemo(() => {
        const uniqueCategories = [...new Set(items.map(item => item.category))];
        return uniqueCategories.sort((a, b) => a.localeCompare(b));
    }, [items]);

    const transferToOptions = useMemo(() => {
        const uniqueTransfers = [...new Set(items.map(item => item.transfer_to))];
        return uniqueTransfers.sort((a, b) => a.localeCompare(b));
    }, [items]);

    const transferredAtOptions = useMemo(() => {
        const uniqueDates = [...new Set(items.map(item =>
            format(new Date(item.transferred_at), 'yyyy-MM-dd')
        ))];
        return uniqueDates.sort((a, b) => b.localeCompare(a));
    }, [items]);

    const toggleSelectAll = () => {
        if (selectedItems.length === paginatedItems.length) {
            setSelectedItems([]);
        } else {
            setSelectedItems(paginatedItems.map(item => item.id));
        }
    };

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
                    <span className={`text-xs p-1 rounded ${approvalStatus?.recommended?.approved ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>
                        GSO: {approvalStatus?.recommended?.approved ? '✓' : 'Pending'}
                    </span>
                    <span className={`text-xs p-1 rounded ${approvalStatus?.approved?.approved ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>
                        Mayor: {approvalStatus?.approved?.approved ? '✓' : 'Pending'}
                    </span>
                </div>
                <div className="flex gap-2">
                    <span className={`text-xs p-1 rounded ${approvalStatus?.witnessed?.approved ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>
                        Witness: {approvalStatus?.witnessed?.approved ? '✓' : 'Pending'}
                    </span>
                    <span className={`text-xs p-1 rounded ${approvalStatus?.name_designation?.approved ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>
                        Office Head: {approvalStatus?.name_designation?.approved ? '✓' : 'Pending'}
                    </span>
                    <span className={`text-xs p-1 rounded ${approvalStatus?.office_name_designation?.approved ? 'bg-green-100 text-green-800' : 'bg-gray-100'}`}>
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
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        setFilteredItems(items);
    }, [items]);

    useEffect(() => {
        let filtered = [...items];

        if (selectedDepartment) {
            filtered = filtered.filter(item => item.category === selectedDepartment);
        }

        if (selectedTransferTo) {
            filtered = filtered.filter(item => item.transfer_to === selectedTransferTo);
        }

        if (selectedTransferredAt) {
            filtered = filtered.filter(item =>
                format(new Date(item.transferred_at), 'yyyy-MM-dd') === selectedTransferredAt
            );
        }

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(item =>
                item.description.toLowerCase().includes(term) ||
                item.property_no.toLowerCase().includes(term) ||
                item.classification_no.toLowerCase().includes(term) ||
                item.transfer_to.toLowerCase().includes(term) ||
                item.name_designation.toLowerCase().includes(term) ||
                item.designated_office.toLowerCase().includes(term) ||
                item.office_name_designation.toLowerCase().includes(term)
            );
        }

        setFilteredItems(filtered);
        setCurrentPage(1);
    }, [items, selectedDepartment, selectedTransferTo, selectedTransferredAt, searchTerm]);

    const handleResetFilters = () => {
        setSelectedDepartment("");
        setSelectedTransferTo("");
        setSelectedTransferredAt("");
        setSearchTerm("");
    };

    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    const paginatedItems = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredItems.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredItems, currentPage, itemsPerPage]);

    const overallTotal = filteredItems.reduce((sum, item) => sum + (item.quantity * item.amount), 0);

    const handlePrint = () => {
        if (selectedItems.length === 0) {
            alert('Please select at least one item to print');
            return;
        }
        window.print();
    };

    const TransferDrawer = () => {
        const [transferData, setTransferData] = useState({
            transferTo: "",
            nameDesignation: "",
            positionIntended: "",
            designatedOffice: "",
            officeNameDesignation: "",
            officePositionIntended: "",
            quantityToTransfer: 1,
            recommendedByName: "",
            recommendedByTitle: "",
            approvedByName: "",
            approvedByTitle: "",
            witnessedByName: "",
            witnessedByTitle: ""
        });

        const [signatories, setSignatories] = useState([]);
        const [maxQuantity, setMaxQuantity] = useState(1);

        useEffect(() => {
            const fetchSignatories = async () => {
                try {
                    const response = await axios.get(route('signatories.index'));
                    setSignatories(response.data);
                } catch (error) {
                    console.error("Failed to fetch signatories:", error);
                }
            };

            fetchSignatories();

            if (transferItemId) {
                const item = items.find(item => item.id === transferItemId);
                if (item) {
                    setMaxQuantity(item.remaining_quantity);
                    setTransferData(prev => ({
                        ...prev,
                        quantityToTransfer: Math.min(prev.quantityToTransfer, item.remaining_quantity),
                        transferTo: item.transfer_to || "",
                        nameDesignation: item.name_designation || "",
                        positionIntended: item.position_intended || "",
                        designatedOffice: item.designated_office || "",
                        officeNameDesignation: item.office_name_designation || "",
                        officePositionIntended: item.office_position_intended || ""
                    }));
                }
            }
        }, [transferItemId, items]);

        const handleInputChange = (field, value) => {
            setTransferData(prev => ({
                ...prev,
                [field]: value,
                ...(field === 'nameDesignation' ? {
                    positionIntended: signatories.find(s => s.name_designation === value)?.position_intended || ''
                } : {}),
                ...(field === 'officeNameDesignation' ? {
                    officePositionIntended: signatories.find(s => s.name_designation === value)?.position_intended || ''
                } : {}),
                ...(field === 'recommendedByName' ? {
                    recommendedByTitle: signatories.find(s => s.name_designation === value)?.position_intended || ''
                } : {}),
                ...(field === 'approvedByName' ? {
                    approvedByTitle: signatories.find(s => s.name_designation === value)?.position_intended || ''
                } : {}),
                ...(field === 'witnessedByName' ? {
                    witnessedByTitle: signatories.find(s => s.name_designation === value)?.position_intended || ''
                } : {})
            }));
        };

        const handleQuantityChange = (e) => {
            const value = Math.min(Math.max(1, parseInt(e.target.value) || 1), maxQuantity);
            setTransferData(prev => ({
                ...prev,
                quantityToTransfer: value
            }));
        };

        const handleTransferSubmit = async (e) => {
            e.preventDefault();
            try {
                setProcessing(true);
                const response = await axios.post(route('transferred-items.transfer-from-transferred'), {
                    transferred_item_id: transferItemId,
                    quantity_transferred: transferData.quantityToTransfer,
                    transferTo: transferData.transferTo,
                    nameDesignation: transferData.nameDesignation,
                    positionIntended: transferData.positionIntended,
                    designatedOffice: transferData.designatedOffice,
                    officeNameDesignation: transferData.officeNameDesignation,
                    officePositionIntended: transferData.officePositionIntended,
                    recommended_by_name: transferData.recommendedByName,
                    recommended_by_title: transferData.recommendedByTitle,
                    approved_by_name: transferData.approvedByName,
                    approved_by_title: transferData.approvedByTitle,
                    witnessed_by_name: transferData.witnessedByName,
                    witnessed_by_title: transferData.witnessedByTitle
                });

                // Refresh the data after successful transfer
                await refreshData();

                setSuccessMessage(response.data.message || "Item transferred successfully!");
                setIsSuccessDialogOpen(true);
                setIsTransferModalOpen(false);

            } catch (error) {
                console.error("Transfer failed:", error);
                let errorMessage = "Transfer failed. Please try again.";

                if (error.response) {
                    if (error.response.status === 422) {
                        errorMessage = error.response.data.message || errorMessage;
                    } else if (error.response.data && error.response.data.message) {
                        errorMessage = error.response.data.message;
                    }
                }

                setSuccessMessage(errorMessage);
                setIsSuccessDialogOpen(true);
            } finally {
                setProcessing(false);
            }
        };

        return (
            <Drawer
            isDrawerOpen={isTransferModalOpen}
            toggleDrawer={() => setIsTransferModalOpen(false)}
            title="Transfer Item"
            width="550px"
        >
            <form onSubmit={handleTransferSubmit} className="space-y-4">
                <div>
                    <InputLabel value="Quantity to Transfer:" />
                    <TextInput
                        type="number"
                        min="1"
                        max={maxQuantity}
                        value={transferData.quantityToTransfer}
                        onChange={handleQuantityChange}
                        className="mt-1 block w-full"
                        required
                    />
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Available: {maxQuantity}
                    </div>
                </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <InputLabel value="Transfer to:" />
                            <TextInput
                                className="mt-1 block w-full"
                                value={transferData.transferTo}
                                onChange={(e) => handleInputChange("transferTo", e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <InputLabel value="Name/Designation:" />
                            <select
                                className="mt-1 block w-full dark:bg-gray-700 dark:text-gray-300"
                                value={transferData.nameDesignation}
                                onChange={(e) => handleInputChange("nameDesignation", e.target.value)}
                                required
                            >
                                <option value="">Select Name/Designation</option>
                                {signatories.map((signatory) => (
                                    <option key={signatory.id} value={signatory.name_designation}>
                                        {signatory.name_designation}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <InputLabel value="Position Intended:" />
                        <TextInput
                            className="mt-1 block w-full"
                            value={transferData.positionIntended}
                            readOnly
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <InputLabel value="Designated Office:" />
                            <TextInput
                                className="mt-1 block w-full"
                                value={transferData.designatedOffice}
                                onChange={(e) => handleInputChange("designatedOffice", e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <InputLabel value="Office Name/Designation:" />
                            <select
                                className="mt-1 block w-full dark:bg-gray-700 dark:text-gray-300"
                                value={transferData.officeNameDesignation}
                                onChange={(e) => handleInputChange("officeNameDesignation", e.target.value)}
                                required
                            >
                                <option value="">Select Office Name/Designation</option>
                                {signatories.map((signatory) => (
                                    <option key={signatory.id} value={signatory.name_designation}>
                                        {signatory.name_designation}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <InputLabel value="Office Position Intended:" />
                        <TextInput
                            className="mt-1 block w-full"
                            value={transferData.officePositionIntended}
                            readOnly
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <InputLabel value="Recommended By:" />
                            <select
                                className="mt-1 block w-full dark:bg-gray-700 dark:text-gray-300"
                                value={transferData.recommendedByName}
                                onChange={(e) => handleInputChange("recommendedByName", e.target.value)}
                                required
                            >
                                <option value="">Select Recommended By</option>
                                {signatories.map((signatory) => (
                                    <option key={signatory.id} value={signatory.name_designation}>
                                        {signatory.name_designation}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <InputLabel value="Recommended By Title:" />
                            <TextInput
                                className="mt-1 block w-full"
                                value={transferData.recommendedByTitle}
                                readOnly
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <InputLabel value="Approved By:" />
                            <select
                                className="mt-1 block w-full dark:bg-gray-700 dark:text-gray-300"
                                value={transferData.approvedByName}
                                onChange={(e) => handleInputChange("approvedByName", e.target.value)}
                                required
                            >
                                <option value="">Select Approved By</option>
                                {signatories.map((signatory) => (
                                    <option key={signatory.id} value={signatory.name_designation}>
                                        {signatory.name_designation}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <InputLabel value="Approved By Title:" />
                            <TextInput
                                className="mt-1 block w-full"
                                value={transferData.approvedByTitle}
                                readOnly
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <InputLabel value="Witnessed By:" />
                            <select
                                className="mt-1 block w-full dark:bg-gray-700 dark:text-gray-300"
                                value={transferData.witnessedByName}
                                onChange={(e) => handleInputChange("witnessedByName", e.target.value)}
                                required
                            >
                                <option value="">Select Witnessed By</option>
                                {signatories.map((signatory) => (
                                    <option key={signatory.id} value={signatory.name_designation}>
                                        {signatory.name_designation}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <InputLabel value="Witnessed By Title:" />
                            <TextInput
                                className="mt-1 block w-full"
                                value={transferData.witnessedByTitle}
                                readOnly
                                required
                            />
                        </div>
                    </div>

                    <div className="mt-6">
                        <SecondaryButton
                            type="submit"
                            className="w-full h-10 rounded-sm"
                            disabled={processing}
                        >
                            {processing ? "Transferring..." : "Transfer Item"}
                        </SecondaryButton>
                    </div>
                </form>
            </Drawer>
        );
    };

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
        {
            label: "Transferred Qty",
            key: "quantity",
            render: (item) => <span className="dark:text-white">{item.quantity}</span>
        },
        {
            label: "Remaining Qty",
            key: "remaining_quantity",
            render: (item) => (
                <span className={`dark:text-white ${
                    item.remaining_quantity === 0 ? 'text-red-500 dark:text-red-400' : ''
                }`}>
                    {item.remaining_quantity ?? item.quantity}
                </span>
            )
        },
        { label: "Property No.", key: "property_no" },
        { label: "Classification No.", key: "classification_no" },
        { label: "Amount", key: "amount" },
        { label: "Total", key: "total" },
        { label: "Transferred At", key: "transferred_at" },
        { label: "Approval Status", key: "approval_status" },
        { label: "Actions", key: "actions" }
    ];

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
        description: <span className="dark:text-white" dangerouslySetInnerHTML={{ __html: item.description }}></span>,
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
        remaining_quantity: <span className="dark:text-white">{item.remaining_quantity}</span>,
        property_no: <span className="dark:text-white">{item.property_no}</span>,
        classification_no: <span className="dark:text-white">{item.classification_no}</span>,
        amount: <span className="dark:text-white">₱ {item.amount.toLocaleString()}</span>,
        total: <span className="dark:text-white">₱ {(item.quantity * item.amount).toLocaleString()}</span>,
        transferred_at: <span className="dark:text-white">{format(new Date(item.transferred_at), 'yyyy-MM-dd HH:mm')}</span>,
        approval_status: <ApprovalStatus item={item} />,
        actions: (
            <div className="relative">
                <Dropdown>
                    <Dropdown.Trigger>
                        <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                            <Settings className="w-5 h-5" />
                        </button>
                    </Dropdown.Trigger>
                    <Dropdown.Content className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none">
                        <Dropdown.Link
                            onClick={(e) => {
                                e.preventDefault();
                                setTransferItemId(item.id);
                                setIsTransferModalOpen(true);
                            }}
                            className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                            Transfer Item
                        </Dropdown.Link>
                    </Dropdown.Content>
                </Dropdown>
            </div>
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

            <Head title="Transferred Items" />
            <div className="py-6">
                <div className="max-w-6xl mx-auto">

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
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        value={searchTerm}
                                        className="dark:placeholder-gray-300 placeholder-gray-600 dark:text-gray-300 border border-black/20 dark:border-white bg-transparent rounded-sm px-4 py-1 focus:outline-none focus:ring-none dark:focus:border-white"
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />

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

            <TransferDrawer />
            <SuccessDialog
                isOpen={isSuccessDialogOpen}
                onClose={() => setIsSuccessDialogOpen(false)}
                message={successMessage}
            />
        </AuthenticatedLayout>
    );
}
