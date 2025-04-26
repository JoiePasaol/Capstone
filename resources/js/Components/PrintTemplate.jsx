import React from 'react';

const PrintTemplate = ({ selectedItems }) => {
  const calculateTotal = () => {
    return selectedItems.reduce((sum, item) => sum + (item.quantity * item.amount), 0);
  };
  const formatReceiptDate = (item) => {
    const isApproved = getApprovalStatus(item, 'office_name_designation').approved;
    if (!isApproved) return '_____, day of _____ 20_____';

    const date = new Date(item.transferred_at);
    return `${date.getDate()} day of ${date.toLocaleString('default', { month: 'long' })}, ${date.getFullYear()}`;
  };
  // Enhanced approval status checker with decline reason
  const getApprovalStatus = (item, signatory) => {
    if (!item || !item.approval_status) return { approved: false, declined: false, declineReason: '' };

    const approvalStatus = typeof item.approval_status === 'string' ?
      JSON.parse(item.approval_status) :
      item.approval_status;

    if (!approvalStatus || !approvalStatus[signatory]) {
      return { approved: false, declined: false, declineReason: '' };
    }

    return {
      approved: approvalStatus[signatory].approved === true,
      declined: approvalStatus[signatory].approved === false,
      declineReason: approvalStatus[signatory].decline_reason || ''
    };
  };

  const item = selectedItems[0] || {};
  const isFullyApproved = item.is_fully_approved || false;

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

          .approval-stamp {
            position: absolute;
            top: -30px;
            left: 50%;
            transform: translateX(-50%);
            height: 100px;
            opacity: 0.5;
          }

          .stamp-container {
            position: relative;
            display: inline-block;
            width: 100%;
          }

.decline-reason {
  position: absolute;
  top: 30px;
  left: 50%;
  transform: translateX(-50%);
  color: red;
  font-size: 8px;
  width: auto;
  text-align: center;
  word-wrap: break-word;
  background: rgba(216, 216, 216, 0.66);
  padding: 4px 6px;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  z-index: 20;
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
  This is to certify that I have this {new Date(item.transferred_at).getDate()} of {new Date(item.transferred_at).toLocaleString('default', { month: 'long' })}, {new Date(item.transferred_at).getFullYear()} transferred to:
</div>
              <div className="text-center mb-4">
                <strong><div>{item.transfer_to || 'N/A'}</div></strong>
                <div className="stamp-container border-b border-black w-48 mx-auto mb-1">
                  {(getApprovalStatus(item, 'name_designation').approved || isFullyApproved) && (
                    <img
                      src="/img/approved.png"
                      className="absolute top-[-30px] left-1/2 transform -translate-x-1/2 h-16 opacity-60 z-10"
                      alt="Approved"
                    />
                  )}
                  {getApprovalStatus(item, 'name_designation').declined && (
                    <>
                      <img
                        src="/img/declined.png"
                        className="absolute top-[-30px] left-1/2 transform -translate-x-1/2 h-16 opacity-60 z-10"
                        alt="Declined"
                      />
                      <div className="decline-reason">
                        {getApprovalStatus(item, 'name_designation').declineReason}
                      </div>
                    </>
                  )}
                  <div className="font-bold text-center relative z-0">
                    {item.name_designation || 'N/A'}
                  </div>
                </div>
                <div className="text-red-600">Name/Designation</div>
              </div>
              <div className="text-center">
                the above listed supplies or property<br />
                <div className="border-b border-black w-48 mx-auto mt-1">{item.position_intended || 'N/A'}</div>
              </div>
            </td>
            <td className="w-1/2 p-4 text-center">
              <div className="text-blue-600 mb-2">RECEIPT</div>
              <div className="mb-4">
  This is to certify that I have this {formatReceiptDate(item)} received from:
</div>
              <div className="text-center mb-4">
                <strong><div>{item.designated_office || 'N/A'}</div></strong>
                <div className="stamp-container border-b border-black w-48 mx-auto mb-1">
                  {(getApprovalStatus(item, 'office_name_designation').approved || isFullyApproved) && (
                    <img
                      src="/img/received.png"
                      className="absolute top-[-50px] left-1/2 transform -translate-x-1/2 opacity-80 z-10"
                      style={{ height: '6.75rem', transform: 'translateX(-50%) rotate(11deg)' }}
                      alt="Received"
                    />
                  )}
                  {getApprovalStatus(item, 'office_name_designation').declined && (
                    <>
                      <img
                        src="/img/declined.png"
                        className="absolute top-[-50px] left-1/2 transform -translate-x-1/2 opacity-80 z-10"
                        style={{ height: '6.75rem', transform: 'translateX(-50%) rotate(11deg)' }}
                        alt="Declined"
                      />
                      <div className="decline-reason">
                        {getApprovalStatus(item, 'office_name_designation').declineReason}
                      </div>
                    </>
                  )}
                  <div className="font-bold text-center relative z-0">
                    {item.office_name_designation || 'N/A'}
                  </div>
                </div>
                <div className="text-red-600">Name/Designation</div>
              </div>
              <div className="text-center">
                the above listed supplies or property<br />
                <div className="border-b border-black w-48 mx-auto mt-1">{item.office_position_intended || 'N/A'}</div>
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
              <div className="stamp-container mt-4">
                {(getApprovalStatus(item, 'recommended').approved || isFullyApproved) && (
                  <img
                    src="/img/approved.png"
                    className="absolute top-[-30px] left-1/2 transform -translate-x-1/2 h-16 opacity-60 z-10"
                    alt="Approved"
                  />
                )}
                {getApprovalStatus(item, 'recommended').declined && (
                  <>
                    <img
                      src="/img/declined.png"
                      className="absolute top-[-30px] left-1/2 transform -translate-x-1/2 h-16 opacity-60 z-10"
                      alt="Declined"
                    />
                    <div className="decline-reason">
                      {getApprovalStatus(item, 'recommended').declineReason}
                    </div>
                  </>
                )}
                <div className="font-bold text-center relative z-0">
                  {item.recommended_by_name || 'N/A'}
                </div>
              </div>
              <div>
                {item.recommended_by_title|| 'N/A'}
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
              <div className="stamp-container mt-4">
                {(getApprovalStatus(item, 'approved').approved || isFullyApproved) && (
                  <img
                    src="/img/approved.png"
                    className="absolute top-[-30px] left-1/2 transform -translate-x-1/2 h-16 opacity-60 z-10"
                    alt="Approved"
                  />
                )}
                {getApprovalStatus(item, 'approved').declined && (
                  <>
                    <img
                      src="/img/declined.png"
                      className="absolute top-[-30px] left-1/2 transform -translate-x-1/2 h-16 opacity-60 z-10"
                      alt="Declined"
                    />
                    <div className="decline-reason">
                      {getApprovalStatus(item, 'approved').declineReason}
                    </div>
                  </>
                )}
                <div className="font-bold text-center relative z-0">
                  {item.approved_by_name || 'N/A'}
                </div>
              </div>
              <div>{item.approved_by_title|| 'N/A'}</div>
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
                <div className="stamp-container mt-4">
                  {(getApprovalStatus(item, 'witnessed').approved || isFullyApproved) && (
                    <img
                      src="/img/approved.png"
                      className="absolute top-[-30px] left-1/2 transform -translate-x-1/2 h-16 opacity-60 z-10"
                      alt="Approved"
                    />
                  )}
                  {getApprovalStatus(item, 'witnessed').declined && (
                    <>
                      <img
                        src="/img/declined.png"
                        className="absolute top-[-30px] left-1/2 transform -translate-x-1/2 h-16 opacity-60 z-10"
                        alt="Declined"
                      />
                      <div className="decline-reason">
                        {getApprovalStatus(item, 'witnessed').declineReason}
                      </div>
                    </>
                  )}
                  <div className="font-bold text-center relative z-0">
                    {item.witnessed_by_name || 'N/A'}
                  </div>
                </div>
                <div>{item.witnessed_by_title || 'N/A'}</div>
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
