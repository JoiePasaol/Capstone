import { format } from "date-fns";

const handlePrint = (
    startDate,
    endDate,
    filteredItems,
    selectedYear,
    selectedMonth,
    selectedDepartment
) => {
    const printFrame = document.createElement("iframe");
    printFrame.style.position = "absolute";
    printFrame.style.width = "0";
    printFrame.style.height = "0";
    printFrame.style.border = "none";
    document.body.appendChild(printFrame);

    let dateType = "";
    let dateValue = "";

    // Date label construction
    if (startDate && endDate) {
        dateType = "DATE RANGE:";
        dateValue = `${format(startDate, "MM/dd/yyyy")} - ${format(endDate, "MM/dd/yyyy")}`;
    } else if (selectedYear || selectedMonth) {
        const year = selectedYear || new Date().getFullYear();
        
        if (selectedMonth) {
            dateType = "DATE:";
            dateValue = `${year}, ${format(new Date(year, selectedMonth - 1), "MMMM")}`;
        } else if (selectedYear) {
            dateType = "YEAR:";
            dateValue = selectedYear;
        }
    }

    const totalSum = filteredItems.reduce(
        (sum, item) => sum + (Number(item.amount) * Number(item.quantity) || 0),
        0
    );

    const doc = printFrame.contentDocument || printFrame.contentWindow.document;
    doc.open();
    doc.write(`
        <html>
        <head>
        <title style="color:transparent;">&#8203;</title>
            <style>
                @page {
                    size: A4;
                    margin: 15mm;
                }
                body { 
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 10px;
                    font-size: 12px;
                }
                .main-container {
                    border: 2px solid black;
                    width: 100%;
                    /* Main content layout stays as is */
                    box-sizing: border-box;
                }
                .header {
                    text-align: center;
                    border-bottom: 1px solid black;
                    padding: 5px;
                    background-color: #ffebee;
                    font-size: 20px;
                    font-weight: bold;
                }
                .org-info {
                    display: grid;
                    grid-template-columns: 1fr 1fr; 
                    padding: 5px 10px;
                    gap: 5px;
                }
                
                .org-label {
                    font-weight: normal;
                }
                
              
                table {
                    width: 100%;
                    border-collapse: collapse;
                    table-layout: fixed;
                    border:none;
                }

                thead, tr, th {
                    font-size: 12px;
                }

                th, td {
                  
                    padding: 6px;
                    text-align: left; 
                    word-wrap: break-word;
                    border: 1px solid black;
                }

                th:nth-child(1), td:nth-child(1) { width: 15%; }
                th:nth-child(2), td:nth-child(2) { width: 35%; } 
                th:nth-child(3), td:nth-child(3) { width: 15%; } 
                th:nth-child(4), td:nth-child(4) { width: 10%; } 
                th:nth-child(5), td:nth-child(5) { width: 15%; } 
                th:nth-child(6), td:nth-child(6) { width: 20%; } 

                .signature-section {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    border-top: 1px solid black;
                }
                
                .signature-box {
                    padding: 15px;
                    border-right: 1px solid black;
                    text-align: left;
                }
                
                .signature-box:last-child {
                    border-right: none;
                }
                
                .signature-line {
                    margin-top: 40px;
                    border-top: 1px solid black;
                    padding-top: 5px;
                    text-align: center;
                }
                
                .signature-name {
                    font-weight: bold;
                }
                
                .signature-title {
                    color: #666;
                    font-size: 11px;
                }
                
                .date-label {
                  margin-left: 8px;
                  margin-bottom: 8px
                }
                
            </style>
        </head>
        <body>

        <div class="main-container">
        <div class="header">INVENTORY REPORT</div>
        
        ${(selectedDepartment || dateType) ? `
        <div class="org-info">
            <div class="org-label">
                LGU: MAGALLANES, AGUSAN DEL NORTE<br />
                FUND: GENERAL FUND
            </div>
            <div class="org-label">
                ${selectedDepartment ? `DEPARTMENT: ${selectedDepartment}<br />` : ''}
                ${dateType ? `${dateType} ${dateValue}` : ''}
            </div>
        </div>
        ` : ''}

            <table>
            <thead>
                <tr>
                    <th>Inventory Items</th>
                    <th>Description</th>
                    <th>Estimated Useful Life</th>
                    <th>Quantity</th>
                    <th>Cost</th>
                    <th>Total Cost</th>
                </tr>
            </thead>
            <tbody>
                ${filteredItems
                    .map(
                        (item) => `
                    <tr>
                        <td>${item.item || "N/A"}</td>
                        <td>${item.description || "N/A"}</td>
                        <td>${item.estimated_life || "N/A"}</td>
                        <td>${item.quantity || "0"}</td>
                        <td>₱${Number(item.amount).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        })}</td>
                        <td>₱${(
                            Number(item.amount) * Number(item.quantity)
                        ).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        })}</td>
                    </tr>
                `
                    )
                    .join("")}

              
                <tr class="total-sum-row">
                    <td colspan="5"><strong>Total Sum:</strong></td>
                    <td>₱${totalSum.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    })}</td>
                </tr>
            </tbody>
        </table>

                <div class="signature-section">
                    <div class="signature-box">
                        <div><strong>Received from:</strong></div>
                        <div class="signature-line">
                            <div class="signature-name">EMMANUEL A. LAVADOR</div>
                            <div class="signature-title">Signature over Printed Name</div>
                            <div class="signature-name">GSO-Designate</div>
                            <div class="signature-title">Position/Office</div>
                        </div>
                        <div style="margin-top: 10px;">Date:</div>
                    </div>
                    <div class="signature-box">
                        <div><strong>Received by:</strong></div>
                        <div class="signature-line">
                            <div class="signature-name">CESAR C. CUMBA, JR.</div>
                            <div class="signature-title">Signature over Printed Name of Enduser</div>
                            <div class="signature-name">Municipal Mayor</div>
                            <div class="signature-title">Position/Office</div>
                        </div>
                        <div style="margin-top: 10px;">Date:</div>
                    </div>
                </div>
            </div>
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
