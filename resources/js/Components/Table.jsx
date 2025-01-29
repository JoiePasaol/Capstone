

const Table = ({ headers, rows, actions }) => {
    return (
        <div className="overflow-x-auto">
            <table className="mt-4 min-w-full table-auto border-collapse border border-gray-300 dark:border-gray-700">
                <thead>
                    <tr className="bg-gray-300 dark:bg-gray-700">
                        {headers.map((header, index) => (
                            <th
                                key={index}
                                onClick={() =>
                                    header.key !== "select-all"
                                }
                                className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-left cursor-pointer"
                            >
                                {header.label}
                            </th>
                        ))}

                        {actions && (
                            <th className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-left whitespace-nowrap">
                                Action
                            </th>
                        )}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, rowIndex) => (
                        <tr
                            key={rowIndex}
                            className="odd:bg-white even:bg-gray-300 dark:odd:bg-gray-800 dark:even:bg-gray-700"
                        >
                            {Object.keys(row).map((key, index) => {
                                if (key === "id") return null; 
                                return (
                                    <td
                                        key={index}
                                        className="border border-gray-300 dark:border-gray-600 px-4 py-2 whitespace-nowrap"
                                    >
                                        {key === "created_at" || key === "updated_at"
                                            ? new Date(row[key]).toLocaleString() 
                                            : row[key]}
                                    </td>
                                );
                            })}
                            {actions && (
                                <td className="border border-gray-300 dark:border-gray-700 px-2 py-2 whitespace-nowrap">
                                    <div className="flex items-center gap-2 justify-center">
                                        {actions(row)}
                                    </div>
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