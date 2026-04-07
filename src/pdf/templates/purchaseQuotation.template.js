export const purchaseQuotationTemplate = (data) => {

    const {
        company,
        supplier,
        product,
        variant,
        pricing,
        totals,
        date,
        quotationNumber
    } = data;

    return `
    <html>
    <head>
        <style>
            body {
                font-family: Arial;
                padding: 20px;
                color: #333;
            }

            .header {
                display: flex;
                justify-content: space-between;
                border-bottom: 2px solid #000;
                padding-bottom: 10px;
            }

            .title {
                font-size: 22px;
                font-weight: bold;
            }

            .section {
                margin-top: 20px;
            }

            table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 10px;
            }

            th, td {
                border: 1px solid #ddd;
                padding: 8px;
                text-align: left;
            }

            th {
                background: #f5f5f5;
            }

            .total {
                text-align: right;
                font-weight: bold;
                font-size: 16px;
            }

        </style>
    </head>

    <body>

        <div class="header">
            <div>
                <div class="title">${company.name}</div>
                <div>${company.address}</div>
                <div>${company.phone}</div>
            </div>

            <div>
                <div><strong>Quotation #:</strong> ${quotationNumber}</div>
                <div><strong>Date:</strong> ${date}</div>
            </div>
        </div>

        <div class="section">
            <strong>Supplier:</strong> ${supplier.name}
        </div>

        <div class="section">
            <table>
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Variant</th>
                        <th>Base Rate</th>
                        <th>Difference</th>
                        <th>Final Rate</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>${product.name}</td>
                        <td>${variant.size || ""} ${variant.grade || ""}</td>
                        <td>${pricing.baseRate}</td>
                        <td>${pricing.difference}</td>
                        <td>${pricing.finalRate}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="section">
            <table>
                <tr>
                    <td>Transport</td>
                    <td>${pricing.transport}</td>
                </tr>
                <tr>
                    <td>Loading</td>
                    <td>${pricing.loading}</td>
                </tr>
                <tr>
                    <td>GST (18%)</td>
                    <td>${pricing.gst}</td>
                </tr>
            </table>
        </div>

        <div class="section total">
            Total: ₹ ${totals.finalAmount}
        </div>

    </body>
    </html>
    `;
};