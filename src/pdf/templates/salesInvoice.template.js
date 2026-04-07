export const salesInvoiceTemplate = (data) => {

    const {
        company = {},
        customer = {},
        items = [],
        totals = {},
        invoiceNumber = "",
        date = ""
    } = data;

    const formatCurrency = (num) =>
        Number(num || 0).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
        });

    const rows = items.map((item, i) => `
        <tr>
            <td>${i + 1}</td>
            <td class="left">${item.product?.name || "-"}</td>
            <td>${item.variant?.size || ""} ${item.variant?.grade || ""}</td>
            <td>${item.quantity}</td>
            <td>${item.unit}</td>
            <td>₹ ${formatCurrency(item.sellingPrice)}</td>
            <td>₹ ${formatCurrency(item.amount)}</td>
        </tr>
    `).join("");

    return `
    <html>
    <head>
        <style>
            body {
                font-family: "Segoe UI", Arial, sans-serif;
                padding: 30px;
                font-size: 12px;
                color: #222;
            }

            .header {
                display: flex;
                justify-content: space-between;
                border-bottom: 2px solid #000;
                padding-bottom: 10px;
            }

            .company {
                font-size: 18px;
                font-weight: bold;
            }

            .meta {
                text-align: right;
            }

            .grid {
                display: flex;
                justify-content: space-between;
                margin-top: 20px;
            }

            .card {
                width: 48%;
                border: 1px solid #ddd;
                padding: 10px;
                border-radius: 6px;
                background: #fafafa;
            }

            table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
            }

            th, td {
                border: 1px solid #ddd;
                padding: 8px;
                text-align: center;
            }

            th {
                background: #f5f5f5;
            }

            .left {
                text-align: left;
            }

            .totals {
                width: 300px;
                margin-left: auto;
                margin-top: 20px;
            }

            .totals td {
                padding: 6px;
            }

            .grand {
                font-weight: bold;
                background: #000;
                color: #fff;
            }

            .footer {
                margin-top: 40px;
                display: flex;
                justify-content: space-between;
            }

            .signature {
                text-align: right;
            }

            .line {
                margin-top: 40px;
                border-top: 1px solid #000;
                width: 180px;
                text-align: center;
            }
        </style>
    </head>

    <body>

        <!-- HEADER -->
        <div class="header">
            <div>
                <div class="company">${company.name || ""}</div>
                <div>${company.address || ""}</div>
                <div>${company.phone || ""}</div>
                <div>GST: ${company.gstNumber || ""}</div>
            </div>

            <div class="meta">
                <strong>INVOICE</strong><br/>
                Invoice #: ${invoiceNumber}<br/>
                Date: ${date}
            </div>
        </div>

        <!-- CUSTOMER -->
        <div class="grid">
            <div class="card">
                <strong>Bill To</strong><br/>
                ${customer.name || "-"}<br/>
                ${customer.gstNumber || ""}<br/>
                ${customer.billingAddress?.addressLine || ""}<br/>
                ${customer.billingAddress?.city || ""}
            </div>
        </div>

        <!-- ITEMS -->
        <table>
            <thead>
                <tr>
                    <th>#</th>
                    <th>Product</th>
                    <th>Variant</th>
                    <th>Qty</th>
                    <th>Unit</th>
                    <th>Rate</th>
                    <th>Amount</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
        </table>

        <!-- TOTAL -->
        <div class="totals">
            <table>
                <tr>
                    <td>Subtotal</td>
                    <td>₹ ${formatCurrency(totals.subtotal)}</td>
                </tr>
                <tr>
                    <td>GST (18%)</td>
                    <td>₹ ${formatCurrency(totals.gst)}</td>
                </tr>
                <tr class="grand">
                    <td>Total</td>
                    <td>₹ ${formatCurrency(totals.totalAmount)}</td>
                </tr>
                <tr>
    <td>Paid</td>
    <td>₹ ${formatCurrency(totals.paidAmount)}</td>
</tr>
<tr>
    <td>Due</td>
    <td>₹ ${formatCurrency(totals.dueAmount)}</td>
</tr>
            </table>
        </div>

        <!-- FOOTER -->
        <div class="footer">
            <div>Thank you for your business!</div>

            <div class="signature">
                <div class="line">Authorized Signatory</div>
            </div>
        </div>

    </body>
    </html>
    `;
};