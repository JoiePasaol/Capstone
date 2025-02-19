import { format } from "date-fns";

const handlePrint = (startDate, endDate, filteredItems) => {
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
                    grid-template-columns: 60px 1fr; /* Two columns with equal width */
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
                
                th:nth-child(1), td:nth-child(1) { width: 10%; } /* Quantity */
                th:nth-child(2), td:nth-child(2) { width: 15%; } /* Unit Cost */
                th:nth-child(3), td:nth-child(3) { width: 15%; } /* Total Cost */
                th:nth-child(4), td:nth-child(4) { width: 35%; } /* Description */
                th:nth-child(5), td:nth-child(5) { width: 12.5%; } /* Inventory Items */
                th:nth-child(6), td:nth-child(6) { width: 12.5%; } /* Estimated Useful Life */
                .purpose-row {
                    background-color: #fff9c4;
                    padding: 5px 10px;
                   
                }
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
                
            </style>
        </head>
        <body>
            <div class="main-container">
                <div class="header">INVENTORY REPORT</div>
                
                <div class="org-info">
                <div class="org-label">LGU</div>
                <div>MAGALLANES, AGUSAN DEL NORTE</div>
                <div class="org-label">FUND</div>
                <div>GENERAL FUND</div>
                <div class="org-label">Date:</div>
                <div>
                    ${startDate ? format(startDate, "MM/dd/yyyy") : "N/A"} - ${
                    endDate ? format(endDate, "MM/dd/yyyy") : "N/A"
                }
                </div>
            </div>
            

              

                <table>
                    <thead>
                        <tr>
                            <th>Quantity</th>
                            <th>Unit Cost</th>
                            <th>Total Cost</th>
                            <th>Description</th>
                            <th>Inventory Items</th>
                            <th>Estimated Useful Life</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredItems
                            .map(
                                (item) => `
                            <tr>
                                <td>${item.quantity || ""}</td>
                                <td>${Number(item.amount).toLocaleString(
                                    "en-US",
                                    {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    }
                                )}</td>
                                <td>${(
                                    Number(item.amount) * Number(item.quantity)
                                ).toLocaleString("en-US", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                })}</td>
                                <td>${item.description || ""}</td>
                                <td>${item.item || ""}</td>
                                <td>${item.estimated_life || ""}</td>
                            </tr>
                        `
                            )
                            .join("")}
                    </tbody>
                </table>

                <div class="purpose-row">
                    <strong>Purpose:</strong>
                </div>

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
