import { useState, useEffect } from "react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, useForm } from "@inertiajs/react";
import Table from "@/Components/Table";
import Checkbox from "@/Components/Checkbox";
import SettingsIcon from "@mui/icons-material/Settings";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import { CiImport } from "react-icons/ci";
import { CiExport } from "react-icons/ci";
import Drawer from "@/Components/Drawer";
import InputLabel from "@/Components/InputLabel";
import InputError from "@/Components/InputError";
import TextInput from "@/Components/TextInput";
import SelectOption from "@/Components/SelectOption";
import SecondaryButton from "@/Components/SecondaryButton";
import Dropdown from "@/Components/Dropdown";
import axios from "axios"; 



export default function ItemList() {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        image: null,
        categories: "",
        brand: "",
        items: "",
        quantity: "",
        price: "",
    });

    const [items, setItems] = useState([]);
    

    const toggleDrawer = (open) => {
        setIsDrawerOpen(open);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("items.store"), {
            onSuccess: () => {
                toggleDrawer(false);
                reset();
                fetchItems(); // Refresh items after adding a new one
            },
        });
    };

    const fetchItems = async () => {
        try {
            const response = await axios.get(route("items.index"));
            console.log(response.data); // Debugging: Check the response structure
            setItems(response.data.items); 
        } catch (error) {
            console.error("Error fetching items:", error);
        }
    };

    // Fetch items when component mounts
    useEffect(() => {
        fetchItems();
    }, []); 


    const headers = [
        {
            label: <Checkbox />,
            key: "select-all",
        },
        { label: "#", key: "index" },
        { label: "Name", key: "name" },
        { label: "Department", key: "deparment" },
        { label: "Images", key: "image" },
        { label: "Categories", key: "categories" },
        { label: "Brand", key: "brand" },
        { label: "Items", key: "items" },
        { label: "Quantity", key: "quantity" },
        { label: "Price", key: "price" },
        { label: "Timestamp", key: "Created At" },
    ];

  
    const rows = items.map((item, index) => ({
        select: <Checkbox />,
        index: index + 1,
        name: item.user?.firstname ?? "N/A",  // Ensure user data exists
        department: item.user?.department ?? "N/A",
        image: item.image ? (
            <div className="h-12 w-12 rounded-full overflow-hidden">
                <img 
                    src={item.image.startsWith('http') ? item.image : `/storage/${item.image}`} 
                    alt="Item" 
                    className="h-full w-full object-cover" 
                />
            </div>
        ) : "No Image",
        categories: item.categories ?? "N/A",
        brand: item.brand ?? "N/A",
        items: item.items ?? "N/A",
        quantity: item.quantity ?? 0,
        price: item.price ? `$${item.price}` : "N/A",
        created_at: item.created_at ? new Date(item.created_at).toLocaleString() : "N/A",
    }));

    const selectOption = [
        { label: "HR", key: "hr" },
        { label: "IT", key: "it" },
    ];

    const actions = (row) => (
        <Dropdown>
            <Dropdown.Trigger>
                <SettingsIcon className="cursor-pointer text-gray-600 dark:text-gray-300" />
            </Dropdown.Trigger>
            <Dropdown.Content>
                <Dropdown.Link>View</Dropdown.Link>
                <Dropdown.Link>Edit</Dropdown.Link>
                <Dropdown.Link>Delete</Dropdown.Link>
            </Dropdown.Content>
        </Dropdown>
    );

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    Items
                </h2>
            }
        >
            <Head title="Dashboards" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className=" px-6 py-4  overflow-hidden bg-white ring-1 ring-black/10 sm:rounded-lg dark:bg-gray-800">
                        <div className="w-full flex justify-between">
                            <div className="flex-1">
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    className="dark:text-white border-black/20 dark:border-white bg-transparent rounded-md px-4 py-1 focus:outline-none focus:ring-none dark:focus:border-white"
                                />
                            </div>
                            <div className="flex">
                                <div className="pr-2 flex gap-2 items-center">
                                    <CiExport className="text-2xl stroke-[1] text-gray-600 dark:text-gray-300 cursor-pointer" />
                                    <CiImport className="text-2xl stroke-[1] text-gray-600 dark:text-gray-300 cursor-pointer" />
                                </div>
                                <div className="pl-2 border-l border-gray-500 flex gap-2 items-center">
                                    <DeleteIcon className="text-gray-600 dark:text-gray-300 cursor-pointer" />
                                    <AddCircleIcon
                                        className="text-gray-600 dark:text-gray-300 cursor-pointer "
                                        onClick={() => toggleDrawer(true)}
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
                title="Add Item"
            >
                <form onSubmit={handleSubmit}>
                    <div className="mt-2">
                        <InputLabel htmlFor="image" value="Image" />
                        <div className="relative mt-2">
                            <TextInput
                                id="image"
                                type="file"
                                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                                onChange={(e) =>
                                    setData("image", e.target.files[0])
                                }
                            />
                            <div className="block w-full h-10 rounded-sm ring-1 ring-gray-300 dark:ring-gray-600  dark:bg-gray-900  flex items-center text-gray-700 dark:text-gray-300">
                                <span className="text-sm pl-2">
                                    Select a file
                                </span>
                            </div>
                        </div>
                        <InputError message={errors.image} className="mt-2" />
                    </div>

                    <div className="mt-4">
                        <InputLabel htmlFor="categories" value="Categories" />
                        <SelectOption
                            id="categories"
                            className="mt-2 block w-full h-10 rounded-sm"
                            placeholder="Select a category"
                            options={selectOption}
                            value={data.categories} // Ensure value is set
                            onChange={(e) =>
                                setData("categories", e.target.value)
                            }
                        />
                        <InputError
                            message={errors.categories}
                            className="mt-2"
                        />
                    </div>

                    <div className="mt-4">
                        <InputLabel htmlFor="brand" value="Brand" />
                        <TextInput
                            id="brand"
                            className="mt-2 block w-full h-10 rounded-sm"
                            value={data.brand}
                            onChange={(e) => setData("brand", e.target.value)}
                        />
                        <InputError message={errors.brand} className="mt-2" />
                    </div>
                    <div className="mt-4">
                        <InputLabel htmlFor="items" value="Items" />
                        <TextInput
                            id="items"
                            className="mt-2 block w-full h-10 rounded-sm"
                            value={data.items}
                            onChange={(e) => setData("items", e.target.value)}
                        />
                        <InputError message={errors.items} className="mt-2" />
                    </div>
                    <div className="mt-4">
                        <InputLabel htmlFor="quantity" value="Quantity" />
                        <TextInput
                            id="quantity"
                            className="mt-2 block w-full h-10 rounded-sm"
                            value={data.quantity}
                            onChange={(e) =>
                                setData("quantity", e.target.value)
                            }
                        />
                        <InputError
                            message={errors.quantity}
                            className="mt-2"
                        />
                    </div>
                    <div className="mt-4">
                        <InputLabel htmlFor="price" value="Price" />
                        <TextInput
                            id="price"
                            className="mt-2 block w-full h-10 rounded-sm"
                            value={data.price}
                            onChange={(e) => setData("price", e.target.value)}
                        />
                        <InputError message={errors.price} className="mt-2" />
                    </div>
                    <div className="mt-5">
                        <SecondaryButton
                            type="submit"
                            className="w-full h-10 rounded-sm"
                            disabled={processing}
                        >
                            Save
                        </SecondaryButton>
                    </div>
                </form>
            </Drawer>
        </AuthenticatedLayout>
    );
}
