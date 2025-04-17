export function exportToCSV(data, filename = "items.csv") {
    if (!data || data.length === 0) {
        console.warn("No data available for export.");
        return;
    }

    const allowedHeaders = [
        'name', 'department', 'categories', 'items', 'description', 'estimated_life',
        'quantity', 'remaining_quantity', 'price', 'suppliers', 'ics', 'pr', 'pr_date', 'po', 'po_date',
        'vc', 'vc_date', 'ch', 'ch_date', 'or', 'or_date', 'created_at', 'updated_at',
        'property_no', 'classification_no', 'date_purchase'
    ];

    const headers = allowedHeaders.filter(h => h in data[0]);

    const cleanHTML = (str) => {
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = str;
        return tempDiv.textContent || tempDiv.innerText || "";
    };

    const csvContent = [
        headers.join(","), // header row
        ...data.map(row =>
            headers.map(field => {
                const value = row[field] ?? "";
                return `"${typeof value === 'string' ? cleanHTML(value) : value}"`;
            }).join(",")
        )
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
