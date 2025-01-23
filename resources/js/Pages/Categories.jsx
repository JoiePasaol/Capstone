import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head } from "@inertiajs/react";
import TextInput from "@/Components/TextInput";
import SecondaryButton from "@/Components/SecondaryButton";
import Checkbox from "@/Components/Checkbox";
import Table from "@/Components/Table";
import TrueButton from "@/Components/TrueButton";
import FalseButton from "@/Components/FalseButton";

export default function Categories() {
    const headers = [
        {
            label: <Checkbox key="select-all" />,
            key: "select-all",
        },
        { label: "#", key: "index" },
        { label: "Category", key: "category" },
    
    ];

    const rows = [
     
        { checkbox: <Checkbox/>, id: 1, index: 1, firstname: "John", firstname: "John" },
        { checkbox: <Checkbox/>, id: 1, index: 1, firstname: "John", firstname: "John" },
        { checkbox: <Checkbox/>, id: 1, index: 1, firstname: "John", firstname: "John" },
    
  

    ];
    

    const actions = () => (
        <div className="flex justify-center" key="">
            <TrueButton >Edit</TrueButton>
            <FalseButton>Delete</FalseButton>
        </div>
    );

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    Categories
                </h2>
            }
        >
            <Head title="Categories" />
            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="grid grid-cols-custom overflow-hidden">
                        <div className="py-4 px-3">
                            <div className="h-[400px]bg-white ring-1 ring-gray-400 dark:ring-gray-400 sm:rounded-lg dark:bg-gray-800">
                                <div className="border-b border-gray-400 dark:border-gray-600 p-4 text-xl font-medium text-gray-500 dark:text-gray-300">
                                    Add New Category
                                </div>
                                <div className="w-full p-4">
                                    <TextInput
                                        className="w-full"
                                        placeholder="Category..."
                                    />
                                    <SecondaryButton className="h-10 mt-4 w-full capitalize rounded-sm">
                                        Add Category
                                    </SecondaryButton>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 px-3">
                            <div className="pb-4 bg-white ring-1 ring-gray-400 dark:ring-gray-400 sm:rounded-lg dark:bg-gray-800">
                            <div className="border-b border-gray-400 dark:border-gray-600 p-4 text-xl font-medium text-gray-500 dark:text-gray-300">
                                    Add New Category
                                </div>
                                <div className="w-full px-4 text-gray-900 dark:text-gray-100">
                                <Table
                                    headers={headers}
                                    rows={rows}
                                    actions={actions}
                                />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
