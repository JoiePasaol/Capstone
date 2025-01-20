import { useState } from "react";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";

const Table = ({ headers, rows, actions, onSort, onSearch }) => {
    const [sortOrder, setSortOrder] = useState("asc");

    const handleSortClick = () => {
        const newOrder = sortOrder === "asc" ? "desc" : "asc";
        setSortOrder(newOrder);
        onSort(newOrder);
    };

    return (
        <div className="overflow-x-auto">
            <div className="w-full flex justify-between gap-4 mb-3">
                <div className="flex-1">
                    <input
                        type="text"
                        placeholder="Search..."
                        className="border-white bg-transparent rounded-md px-4 py-1 focus:outline-none focus:ring-none focus:border-white"
                        onChange={(e) => onSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 items-center">
                    <DeleteIcon className="cursor-pointer" />
                    <div
                        onClick={handleSortClick}
                        className="cursor-pointer text-gray-600 dark:text-gray-300"
                    >
                        {sortOrder === "asc" ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />}
                    </div>
                </div>
            </div>
            <table className="min-w-full table-auto border-collapse border border-gray-300 dark:border-gray-700">
                <thead>
                    <tr className="bg-gray-200 dark:bg-gray-700">
                        {headers.map((header, index) => (
                            <th key={index} className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-left">
                                {header}
                            </th>
                        ))}
                        {actions && (
                            <th className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-left">
                                Action
                            </th>
                        )}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, rowIndex) => (
                        <tr key={rowIndex} className="odd:bg-white even:bg-gray-100 dark:odd:bg-gray-800 dark:even:bg-gray-700">
                            {Object.keys(row).map((key, index) => {
                                if (key === "id") return null; 
                                return (
                                    <td key={index} className="border border-gray-300 dark:border-gray-700 px-4 py-2 whitespace-nowrap">
                                        {row[key]}
                                    </td>
                                );
                            })}
                            {actions && (
                                <td className="border border-gray-300 dark:border-gray-700 px-4 py-2 whitespace-nowrap">
                                    {actions(row)}
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Table;
