export const salesQuotationTemplate = (data) => {
    const {
        company = {},
        customer = {},
        items = [],
        totals = {},
        quotationNumber = "",
        date = "",
        status = "",
        notes = ""
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
            <td>${item.quantity || 0}</td>
            <td>${item.unit || "-"}</td>
            <td>₹ ${formatCurrency(item.baseRate)}</td>
            <td>₹ ${formatCurrency(item.difference)}</td>
            <td>₹ ${formatCurrency(item.sellingPrice)}</td>
            <td>₹ ${formatCurrency(item.finalAmount)}</td>
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
                gap: 12px;
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
                font-size: 11px;
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
                width: 360px;
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

            .notes {
                margin-top: 24px;
                padding: 12px;
                border: 1px solid #ddd;
                border-radius: 6px;
                background: #fafafa;
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

            .status {
                margin-top: 6px;
                font-size: 12px;
            }
        </style>
    </head>

    <body>
        <div class="header">
            <div>
                <div class="company">${company.name || ""}</div>
                <div>${company.address || ""}</div>
                <div>${company.phone || ""}</div>
                <div>GST: ${company.gstNumber || ""}</div>
            </div>

            <div class="meta">
                <strong>SALES QUOTATION</strong><br/>
                Quotation #: ${quotationNumber}<br/>
                Date: ${date}
                <div class="status">Status: ${status || "draft"}</div>
            </div>
        </div>

        <div class="grid">
            <div class="card">
                <strong>Quotation For</strong><br/>
                ${customer.name || "-"}<br/>
                ${customer.gstNumber || ""}<br/>
                ${customer.billingAddress?.addressLine || ""}<br/>
                ${customer.billingAddress?.city || ""}
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th>#</th>
                    <th>Product</th>
                    <th>Variant</th>
                    <th>Qty</th>
                    <th>Unit</th>
                    <th>Base Rate</th>
                    <th>Diff</th>
                    <th>Selling Rate</th>
                    <th>Amount</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
        </table>

        <div class="totals">
            <table>
                <tr>
                    <td>Items Total</td>
                    <td>₹ ${formatCurrency(totals.totalAmount)}</td>
                </tr>
                <tr>
                    <td>Transport</td>
                    <td>₹ ${formatCurrency(totals.transportCost)}</td>
                </tr>
                <tr>
                    <td>Loading</td>
                    <td>₹ ${formatCurrency(totals.loadingCost)}</td>
                </tr>
                <tr>
                    <td>Subtotal</td>
                    <td>₹ ${formatCurrency(totals.subtotal)}</td>
                </tr>
                <tr>
                    <td>GST (${totals.gstPercent || 0}%)</td>
                    <td>₹ ${formatCurrency(totals.gstAmount)}</td>
                </tr>
                <tr class="grand">
                    <td>Final Total</td>
                    <td>₹ ${formatCurrency(totals.finalTotal)}</td>
                </tr>
            </table>
        </div>

        ${notes
            ? `<div class="notes">
                    <strong>Notes:</strong><br/>
                    ${notes}
                  </div>`
            : ""
        }

        <div class="footer">
            <div>This quotation is subject to stock availability and final confirmation.</div>

            <div class="signature">
                <div class="line">Authorized Signatory</div>
            </div>
        </div>
    </body>
    </html>
    `;
};