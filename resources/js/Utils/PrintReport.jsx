import { format } from "date-fns";

const handlePrint = (startDate, endDate, filteredItems, totalSum) => {
    const printFrame = document.createElement("iframe");
    printFrame.style.position = "absolute";
    printFrame.style.width = "0";
    printFrame.style.height = "0";
    printFrame.style.border = "none";
    document.body.appendChild(printFrame);

    const doc = printFrame.contentDocument || printFrame.contentWindow.document;
    doc.open();
    doc.write(`
        <html>
        <head>
            <title>Item Report</title>
            <style>
                body { font-family: Arial, sans-serif; text-align: center; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th, td { border: 1px solid black; padding: 8px; text-align: left; }
                .title { font-size: 20px; font-weight: bold; margin-bottom: 5px; }
                .date-range { font-size: 14px; margin-bottom: 10px; }
                .total-row { font-weight: bold; background-color: #f2f2f2; }
        
                th { background-color: #2196f3 !important; color: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }

                tbody tr:nth-child(even) { background-color: #bbdefb !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }

            </style>
        </head>
        <body>
            <div class="title">Item Inventory System - Report</div>
            <div class="date-range">${
                startDate ? format(startDate, "MM/dd/yyyy") : "N/A"
            } 
                TILL DATE 
                ${endDate ? format(endDate, "MM/dd/yyyy") : "N/A"}</div>
            <table>
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Description</th>
                        <th>Quantity</th>
                        <th>Amount</th>
                        <th>Total Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${filteredItems
                        .map(
                            (item, index) => ` 
                        <tr style="background-color: ${
                            index % 2 === 0 ? "#90caf9" : "transparent"
                        };">
                            <td>${item.item}</td>
                            <td>${item.description}</td>
                            <td>${item.quantity}</td>
                            <td>₱ ${Number(item.amount).toFixed(2)}</td>
                            <td>₱ ${(item.quantity * item.amount).toFixed(2)}</td>
                        </tr>`
                        )
                        .join("")}
                    <tr class="total-row">
                        <td colspan="4">Total Sum</td>
                        <td>₱ ${totalSum.toFixed(2)}</td>
                    </tr>
                </tbody>
            </table>
        </body>
        </html>
    `);
    doc.close();

    printFrame.contentWindow.focus();
    printFrame.contentWindow.print();

    setTimeout(() => {
        document.body.removeChild(printFrame);
    }, 1000);
};

export default handlePrint;
