import React from 'react';

const PrintTemplate = ({ selectedItems }) => {
  const calculateTotal = () => {
    return selectedItems.reduce((sum, item) => sum + (item.quantity * item.amount), 0);
  };

  // Add this console.log to debug the data
  console.log('Selected Items:', selectedItems);

  return (
    <div id="print-template" className="print:block hidden">
      <style type="text/css" media="print">{`
        @page {
          size: A4;
          margin: 1cm;
        }

        @media print {
          body * {
            visibility: hidden;
          }

          #print-template,
          #print-template * {
            visibility: visible;
          }

          #print-template {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin: 0;
            padding: 0;
          }

          th, td {
            border: 1px solid black;
            padding: 5px;
            font-size: 12px;
          }

          .no-border {
            border: none !important;
          }

          .invoice-header {
            background-color: #ff0000 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>

      {/* Header */}
      <table className="mx-auto">
        <tbody>
          <tr>
            <td className="no-border">Gen. Form No. 30-A</td>
          </tr>
          <tr>
            <td className="invoice-header text-center font-bold text-lg py-2">
              INVOICE RECEIPT FOR PROPERTY
            </td>
          </tr>
        </tbody>
      </table>

      <table className="mx-auto">
        <thead>
          <tr>
            <th className="w-[5%] text-center">QTY</th>
            <th className="w-[25%] text-center">Description</th>
            <th className="w-[12%] text-center">Date<br />Purchase</th>
            <th className="w-[12%] text-center">Property<br />No.</th>
            <th className="w-[12%] text-center">Classification<br />No.</th>
            <th className="w-[17%] text-center">Unit Value</th>
            <th className="w-[17%] text-center">Total Value</th>
          </tr>
        </thead>
        <tbody>
          {selectedItems.map((item) => (
            <tr key={item.id}>
              <td className="text-center">{item.quantity}</td>
              <td className="text-center">
                <strong>{item.category}</strong><br />
                {item.description.replace(/<[^>]*>?/gm, '')}
              </td>
              <td className="text-center">
                {item.date_purchase ? new Date(item.date_purchase).toLocaleDateString() : 'N/A'}
              </td>
              <td className="text-center">{item.property_no || 'N/A'}</td>
              <td className="text-center">{item.classification_no || 'N/A'}</td>
              <td className="text-right">₱ {item.amount?.toLocaleString() || '0'}</td>
              <td className="text-right">₱ {(item.quantity * item.amount)?.toLocaleString() || '0'}</td>
            </tr>
          ))}
          <tr>
            <td colSpan={7} className="text-center font-bold">
              SUB TOTAL: ₱ {calculateTotal().toLocaleString()}
            </td>
          </tr>
        </tbody>
      </table>

      <table className="mx-auto">
        <tbody>
          <tr>
            <td className="w-1/2 p-4 border-r text-center">
              <div className="text-blue-600 mb-2">INVOICE</div>
              <div className="mb-4">
                This is to certify that I have this _____, day<br />
                of _____ 20_____ transferred to:
              </div>
              <div className="text-center mb-4">
  <strong><div>{selectedItems[0]?.transfer_to || 'N/A'}</div></strong>
  <div className="relative border-b border-black w-48 mx-auto mb-1">
    {selectedItems[0]?.approval_status?.name_designation?.approved && (
      <img
        src="/img/approved.png"
        className="absolute top-[-30px] left-1/2 transform -translate-x-1/2 h-12 opacity-50"
        alt="Approved"
      />
    )}
    <div className="font-bold text-center">
      {selectedItems[0]?.name_designation || 'N/A'}
    </div>
  </div>
  <div className="text-red-600">Name/Designation</div>
</div>
              <div className="text-center">
                the above listed supplies or property<br />
                <div className="border-b border-black w-48 mx-auto mt-1">{selectedItems[0]?.position_intended || 'N/A'}</div>
              </div>
            </td>
            <td className="w-1/2 p-4 text-center">
              <div className="text-blue-600 mb-2">RECEIPT</div>
              <div className="mb-4">
                This is to certify that I have this _____, day of _____<br />
                20_____ received from:
              </div>
              <div className="text-center mb-4">
              <strong><div>{selectedItems[0]?.designated_office || 'N/A'}</div></strong>
  <div className="relative border-b border-black w-48 mx-auto mb-1">
    {selectedItems[0]?.approval_status?.office_name_designation?.approved && (
      <img
        src="/img/approved.png"
        className="absolute top-[-30px] left-1/2 transform -translate-x-1/2 h-12 opacity-50"
        alt="Approved"
      />
    )}
    <div className="font-bold text-center">
      {selectedItems[0]?.office_name_designation || 'N/A'}
    </div>
  </div>
  <div className="text-red-600">Name/Designation</div>
</div>
              <div className="text-center">
                the above listed supplies or property<br />
                <div className="border-b border-black w-48 mx-auto mt-1">{selectedItems[0]?.office_position_intended || 'N/A'}</div>
              </div>
            </td>
          </tr>
          <tr>
            <td className="w-1/2 p-4 text-center border-t border-r">
              <div className="text-blue-600 font-bold">Invoicing Accountable Officer</div>
            </td>
            <td className="w-1/2 p-4 text-center border-t">
              <div className="text-blue-600 font-bold">Receiving Accountable Officer</div>
            </td>
          </tr>
        </tbody>
      </table>

      <table>
        <tbody>
          <tr>
            <td className="p-4 text-center">
              <div>This certify that I recommended the foregoing transfer of Supplies or Property</div>
              <div className="relative mt-4">
  {selectedItems[0]?.approval_status?.recommended?.approved && (
    <img
      src="/img/approved.png"
      className="absolute top-[-30px] left-1/2 transform -translate-x-1/2 h-12 opacity-50"
      alt="Approved"
    />
  )}
  <div className="font-bold text-center">
    {selectedItems[0]?.recommended_by_name || 'N/A'}
  </div>
</div>
              <div>
                {selectedItems[0]?.recommended_by_title|| 'N/A'}
                </div>
              <div className="text-left mt-4">
                Date: _________________
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <table>
        <tbody>
          <tr>
            <td className="p-4 text-center">
              <div>This certificate that I approved the foregoing transfer of Supplies or Property</div>
              <div className="relative mt-4">
  {selectedItems[0]?.approval_status?.approved?.approved && (
    <img
      src="/img/approved.png"
      className="absolute top-[-30px] left-1/2 transform -translate-x-1/2 h-12 opacity-50"
      alt="Approved"
    />
  )}
  <div className="font-bold text-center">
    {selectedItems[0]?.approved_by_name || 'N/A'}
  </div>
</div>
              <div>{selectedItems[0]?.approved_by_title|| 'N/A'}</div>
              <div className="text-left mt-4">
                Date: _________________
              </div>
            </td>
          </tr>
        </tbody>
      </table>

<table>
  <tbody>
    <tr>
      <td className="p-4">
        <div className="text-left">Transfer Witness By:</div>
        <div className="text-center">
          <div className="relative mt-4">
            {selectedItems[0]?.approval_status?.witnessed?.approved && (
              <img
                src="/img/approved.png"
                className="absolute top-[-30px] left-1/2 transform -translate-x-1/2 h-12 opacity-50"
                alt="Approved"
              />
            )}
            <div className="font-bold text-center">
              {selectedItems[0]?.witnessed_by_name || 'N/A'}
            </div>
          </div>
          <div>{selectedItems[0]?.witnessed_by_title || 'N/A'}</div>
        </div>
        <div className="text-left mt-4">
          Date: _________________
        </div>
      </td>
    </tr>
  </tbody>
</table>
    </div>
  );
};

export default PrintTemplate;
