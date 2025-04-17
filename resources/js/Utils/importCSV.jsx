export function importCSV(event, callback) {
    const file = event.target.files[0];

    if (!file) return;
    if (!file.name.endsWith(".csv")) {
        alert("Please upload a valid CSV file.");
        return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
        const text = e.target.result.trim();
        const rows = text.split("\n").map((row) => row.split(",").map(cell => cell.trim()));

        if (rows.length < 2) {
            alert("Invalid CSV format.");
            return;
        }

        const headers = rows[0].map((h) => h.replace(/"/g, "").trim());
        
        const data = rows.slice(1).map((row) => {
            let obj = {};
            headers.forEach((header, index) => {
                obj[header.toLowerCase()] = row[index]?.replace(/"/g, "").trim() ?? "";
            });
            return obj;
        });

     
        data.forEach(row => delete row.image);

        console.log("Parsed CSV Data Before Sending:", data);

        callback(data);
    };

    reader.readAsText(file);
}
