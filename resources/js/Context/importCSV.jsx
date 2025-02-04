export function importCSV(event, callback) {
    const file = event.target.files[0];

    if (!file) return;
    if (!file.name.endsWith(".csv")) {
        alert("Please upload a valid CSV file.");
        return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
        const text = e.target.result.trim(); // Trim whitespace
        const rows = text.split("\n").map((row) => row.split(",").map(cell => cell.trim())); // Trim each cell

        if (rows.length < 2) {
            alert("Invalid CSV format.");
            return;
        }

        const headers = rows[0].map((h) => h.replace(/"/g, "").trim()); // Remove quotes and trim
        const data = rows.slice(1).map((row) => {
            let obj = {};
            headers.forEach((header, index) => {
                obj[header] = row[index]?.replace(/"/g, "").trim() ?? ""; // Remove quotes and trim
            });
            return obj;
        });

        // Ensure data is correctly structured before sending it
        console.log("Parsed CSV Data:", data);

        callback(data);
    };

    reader.readAsText(file);
}
