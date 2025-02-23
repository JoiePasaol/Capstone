import { useState, useEffect } from "react";
import { Head, useForm, usePage } from "@inertiajs/react";
import { format } from "date-fns";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import Drawer from "@/Components/Drawer";
import InputLabel from "@/Components/InputLabel";
import InputError from "@/Components/InputError";
import TextInput from "@/Components/TextInput";
import SecondaryButton from "@/Components/SecondaryButton";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import SelectOption from "@/Components/SelectOption";
import Table from "@/Components/Table";
import Checkbox from "@/Components/Checkbox";
import Dropdown from "@/Components/Dropdown";
import SettingsIcon from "@mui/icons-material/Settings";
import SuccessDialog from "@/Components/SuccessDialog";
import "../../../css/select.css";
import axios from "axios";

export default function ItemBorrow() {
    
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [showPicker, setShowPicker] = useState(false);

    const [options, setOptions] = useState([]);
    const [selectedOption, setSelectedOption] = useState(null);
    const [selectedStatus, setSelectedStatus] = useState(null);
    const [returnDate, setReturnDate] = useState(null);
    const { data, setData, post, reset, errors } = useForm({
        name: "",
        item_id: "",
        return_date: "",
        status: "",
    });

    const toggleDrawer = (open, isEdit = false) => {
        console.log("Toggling Drawer:", open, "Edit Mode:", isEdit);
        setIsDrawerOpen(open);
        setIsEditMode(isEdit);
    };

    const handleInputChange = async (inputValue) => {
        console.log("User input:", inputValue); // Debugging

        if (!inputValue) {
            setOptions([]);
            return;
        }

        try {
            const response = await axios.get(
                `/search-items?query=${inputValue}`
            );

            console.log("API response:", response.data); // Debugging

            if (!Array.isArray(response.data)) {
                console.error("API response is not an array:", response.data);
                setOptions([]);
                return;
            }

            const items = response.data.map((item) => ({
                value: item.id,
                label: item.items, // Ensure it correctly maps to `items`
            }));

            setOptions(items);
        } catch (error) {
            console.error("Error fetching items:", error);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
    
        if (!selectedOption) {
            alert("Please select an item.");
            return;
        }
    
        post("/borrow", {
            name: data.name,
            item_id: selectedOption ? selectedOption.value : "",
            item_name: selectedOption ? selectedOption.label : "", 
            return_date: data.return_date,
            status: selectedStatus || "borrowed",
        }, {
            onSuccess: () => {
                alert("Borrow record saved successfully!");
                reset();
            },
            onError: (err) => {
                console.error("Error saving borrow record:", err);
                alert("Failed to save. Please try again.");
            },
        });
    };
    

    const headers = [
        {
            label: <Checkbox />,
            key: "select-all",
        },
        { label: "#", key: "index" },
        { label: "Name", key: "name" },
        { label: "Item", key: "item" },
        { label: "Date_Return", key: "date_return" },
        { label: "Status", key: "status" },
        { label: "Created_at", key: "created_at" },
        { label: "Updated_at", key: "updated_at" },
    ];

    const rows = [
        {
            select: <Checkbox />,
            id: 1,
            index: 1,
            name: "John Doe",
            item: "Item 1",
            date_return: "2022-01-01",
            status: "borrowed",
            created_at: "2022-01-01",
            updated_at: "2022-01-01",
        },
        {
            select: <Checkbox />,
            id: 2,
            index: 2,
            name: "Jane Doe",
            item: "Item 2",
            date_return: "2022-02-02",
            status: "returned",
            created_at: "2022-01-02",
            updated_at: "2022-01-02",
        },
        {
            select: <Checkbox />,
            id: 3,
            index: 3,
            name: "Bob Doe",
            item: "Item 3",
            date_return: "2022-03-03",
            status: "borrowed",
            created_at: "2022-01-03",
            updated_at: "2022-01-03",
        },
    ];

    const actions = () => (
        <div className="flex justify-center">
            <Dropdown>
                <Dropdown.Trigger>
                    <SettingsIcon className="cursor-pointer text-gray-600 dark:text-gray-300" />
                </Dropdown.Trigger>
                <Dropdown.Content contentClasses="relative py-1 right-7 top-[-90px] bg-gray-700">
                    <Dropdown.Link
                        onClick={(e) => {
                            e.preventDefault();
                            toggleDrawer(true, true);
                        }}
                    >
                        Edit
                    </Dropdown.Link>
                    <Dropdown.Link
                    // onClick={(e) => {
                    //     e.preventDefault();
                    //     console.log("Delete clicked");
                    //     // Handle delete functionality here
                    // }}
                    >
                        Delete
                    </Dropdown.Link>
                </Dropdown.Content>
            </Dropdown>
        </div>
    );

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    Item Borrow
                </h2>
            }
        >
            <Head title="Dashboard" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="px-6 py-4 overflow-visible bg-white ring-1 ring-black/20 sm:rounded-lg dark:bg-gray-800">
                        <div className="w-full flex justify-between items-center">
                            {/* Search and Date Range Picker */}
                            <div className="flex gap-2 items-center">
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    className="dark:text-white border border-black/20 dark:border-white bg-transparent rounded-md px-4 py-1 focus:outline-none focus:ring-none dark:focus:border-white"
                                />

                                {/* Date Range Picker Input */}
                                <div className="relative z-50">
                                    <select
                                        // onClick={() =>
                                        //     setShowDateRangePicker(!showPicker)
                                        // }
                                        className="border border-black/20 dark:border-white py-1 rounded-md text-gray-700 dark:text-gray-500 bg-transparent cursor-pointer  w-60"
                                    >
                                        {" "}
                                        <option hidden value="">
                                            {/* {startDate && endDate
                                                ? `${format(
                                                      startDate,
                                                      "MM/dd/yyyy"
                                                  )} - ${format(
                                                      endDate,
                                                      "MM/dd/yyyy"
                                                  )}`
                                                : "Select date range"} */}
                                        </option>
                                    </select>
                                    {/* Date Picker Dropdown */}
                                    {/* {showDateRangePicker && (
                                        <div className="absolute z-50">
                                            <DatePicker
                                                selectsRange
                                                startDate={startDate}
                                                endDate={endDate}
                                                onChange={(dates) => {
                                                    const [start, end] = dates;
                                                    setStartDate(start);
                                                    setEndDate(end);
                                                }}
                                                inline
                                                calendarClassName="dark:bg-gray-800 pb-7"
                                            />
                                            <button
                                                onClick={() => {
                                                    setStartDate(null);
                                                    setEndDate(null);
                                                    setFilteredItems(items);
                                                }}
                                                className="absolute bottom-4 right-2 px-3 py-1 text-sm bg-[#216ba5] text-white rounded-md shadow-md transition duration-300 hover:bg-blue-500"
                                            >
                                                Reset Filter
                                            </button>
                                        </div>
                                    )} */}
                                </div>
                            </div>

                            {/*  Add, and Delete Icons */}
                            <div className="flex">
                                <div className="pl-2 border-l border-gray-500 flex gap-2 items-center">
                                    <DeleteIcon
                                    // className={`text-gray-600 dark:text-gray-300 cursor-pointer ${
                                    //     selectedItems.length < 2
                                    //         ? "opacity-50 pointer-events-none"
                                    //         : ""
                                    // }`}
                                    // onClick={() => confirmDelete()}
                                    // disabled={selectedItems.length < 2}
                                    />
                                    <AddCircleIcon
                                        className="text-gray-600 dark:text-gray-300 cursor-pointer"
                                        onClick={() => {
                                            console.log(
                                                "AddCircleIcon clicked"
                                            ); // Debugging
                                            toggleDrawer(true);
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="text-gray-900 dark:text-gray-100">
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
                title={isEditMode ? "Edit Item borrow" : "Add Item borrow"}
            >
                <form onSubmit={handleSubmit}>
                    <div className="mt-4">
                        <InputLabel htmlFor="name" value="Name" />
                        <TextInput
                            id="name"
                            className="mt-2 block w-full h-10 rounded-sm"
                            value={data.name}
                            onChange={(e) => setData("name", e.target.value)}
                        />
                        <InputError message={errors.name} className="mt-2" />
                    </div>

                    <div className="mt-4">
                        <InputLabel htmlFor="Item" value="Item" />
                        <Select
                             id="Item"
                             className="mt-2"
                             placeholder="Search item..."
                             noOptionsMessage={() => "No items found"}
                             isClearable
                             isSearchable
                             value={selectedOption}
                             onChange={(option) => {
                                 setSelectedOption(option);
                                 setData({
                                     ...data,
                                     item_id: option ? option.value : "",
                                     item_name: option ? option.label : "", // ✅ Update item_name
                                 });
                             }}
                             onInputChange={(newValue) => {
                                 if (newValue) {
                                     handleInputChange(newValue);
                                 }
                             }}
                             options={options}
                            classNames={{
                                control: ({ isFocused }) =>
                                    isFocused
                                        ? "custom-select-container custom-select-container--focused"
                                        : "custom-select-container",
                                valueContainer: () => "custom-select-value",
                                singleValue: () => "custom-select-value",
                                menu: () => "custom-select-menu",
                                option: () => "custom-select-option",
                                placeholder: () => "custom-select-placeholder",
                                input: () => "custom-select-input",
                            }}
                        />

                        <InputError message={errors.item_id} className="mt-2" />
                    </div>
                    <div className="mt-4 w-full">
                        <InputLabel htmlFor="Date" value="Date Return" />
                        <div className="relative">
                            <div
                                className="px-3 w-full h-10 mt-2 block border dark:bg-gray-900 border-black/20 dark:border-gray-700 rounded-sm text-gray-700 dark:text-gray-500 bg-transparent cursor-pointer flex items-center"
                                onClick={() => setShowPicker(!showPicker)}
                            >
                                {data.return_date
                                    ? format(
                                          new Date(data.return_date),
                                          "MM/dd/yyyy"
                                      )
                                    : "Select date"}
                            </div>
                            {showPicker && (
                                <div className="absolute z-50">
                                    <DatePicker
                                        selected={
                                            data.return_date
                                                ? new Date(data.return_date)
                                                : null
                                        }
                                        onChange={(date) => {
                                            const formattedDate = format(
                                                date,
                                                "MM/dd/yyyy"
                                            ); // ✅ Format MM/DD/YYYY
                                            setData(
                                                "return_date",
                                                formattedDate
                                            );
                                        }}
                                        inline
                                        calendarClassName="dark:bg-gray-800 pb-7"
                                    />
                                </div>
                            )}
                        </div>
                        <InputError message={errors.Date} className="mt-2" />
                    </div>

                    <div className="mt-4">
                        <InputLabel htmlFor="status" value="Status" />
                        <SelectOption
                            id="status"
                            className="mt-2 block w-full h-10 rounded-sm text-sm"
                            value={data.status || "borrowed"}
                            onChange={(e) => setData("status", e.target.value)} // ✅ Update useForm
                            options={[
                                { value: "borrowed", label: "Borrowed" },
                                { value: "overdue", label: "Overdue" },
                                { value: "returned", label: "Returned" },
                            ]}
                        />
                        <InputError message={errors.status} className="mt-2" />
                    </div>
                    <div className="mt-5">
                        <SecondaryButton
                            type="submit"
                            className="w-full h-10 rounded-sm"
                            // disabled={processing}
                        >
                            Save {/* {processing ? "Saving..." : "Save"} */}
                        </SecondaryButton>
                    </div>
                </form>
            </Drawer>
            {/* <SuccessDialog
                isOpen={isSuccessDialogOpen}
                onClose={() => setIsSuccessDialogOpen(false)}
                message={successMessage}
            /> */}
        </AuthenticatedLayout>
    );
}
