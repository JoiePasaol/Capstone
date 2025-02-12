export function exportToCSV(data, filename = "items.csv") {
    if (!data || data.length === 0) {
        console.warn("No data available for export.");
        return;
    }


    const headers = Object.keys(data[0]).filter((key) => 
        !["id", "user_id", "updated_at", "image", "user"].includes(key)
    );


    const csvContent = [
        headers.join(","), 
        ...data.map((row) =>
            headers.map((field) => `"${row[field] ?? ""}"`).join(",")
        ),
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
