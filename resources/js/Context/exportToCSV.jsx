export function exportToCSV(data, filename = "items.csv") {
    if (!data || data.length === 0) {
        console.warn("No data available for export.");
        return;
    }

    // Exclude unwanted fields: 'id', 'user_id', 'updated_at', 'image', 'user'
    const headers = Object.keys(data[0]).filter((key) => 
        !["id", "user_id", "updated_at", "image", "user"].includes(key)
    );

    // Generate CSV content
    const csvContent = [
        headers.join(","), // Header row
        ...data.map((row) =>
            headers.map((field) => `"${row[field] ?? ""}"`).join(",")
        ),
    ].join("\n");

    // Create a Blob and trigger a download
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();

    // Cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
