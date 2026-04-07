export const purchaseOrderTemplate = (data) => {

    const {
        company = {},
        supplier = {},
        items = [],
        totals = {},
        orderNumber = "",
        date = ""
    } = data;

    const formatCurrency = (num) =>
        Number(num || 0).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
        });

    const rows = items.map((item, i) => {
        const rate = (item.baseRate || 0) + (item.difference || 0);
        const amount = item.finalAmount || 0;

        return `
        <tr>
            <td>${i + 1}</td>
            <td class="left">${item?.product?.name || "-"}</td>
            <td>${item?.variant?.size || ""} ${item?.variant?.grade || ""}</td>
            <td>${item.quantity}</td>
            <td>${item.unit}</td>
            <td>₹ ${formatCurrency(item.baseRate)}</td>
            <td>₹ ${formatCurrency(item.difference)}</td>
            <td>₹ ${formatCurrency(rate)}</td>
            <td>₹ ${formatCurrency(amount)}</td>
        </tr>
        `;
    }).join("");

    return `
    <html>
    <head>
        <style>
            body {
                font-family: "Segoe UI", Arial, sans-serif;
                padding: 32px;
                color: #222;
                font-size: 12px;
                line-height: 1.5;
            }

            h1, h2, h3 {
                margin: 0;
            }

            .header {
                display: flex;
                justify-content: space-between;
                border-bottom: 2px solid #000;
                padding-bottom: 12px;
                margin-bottom: 20px;
            }

            .company {
                font-size: 18px;
                font-weight: 700;
            }

            .meta {
                text-align: right;
                font-size: 12px;
            }

            .badge {
                display: inline-block;
                padding: 4px 10px;
                font-size: 10px;
                background: #000;
                color: #fff;
                border-radius: 12px;
                margin-top: 4px;
            }

            .grid {
                display: flex;
                justify-content: space-between;
                margin-top: 20px;
                gap: 20px;
            }

            .card {
                flex: 1;
                border: 1px solid #ddd;
                border-radius: 8px;
                padding: 12px;
                background: #fafafa;
            }

            .card-title {
                font-size: 11px;
                color: #666;
                margin-bottom: 6px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
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
            }

            th {
                background: #f5f5f5;
                font-weight: 600;
                text-align: center;
            }

            td {
                text-align: center;
            }

            td.left {
                text-align: left;
            }

            .totals {
                width: 320px;
                margin-left: auto;
                margin-top: 24px;
                border: 1px solid #ddd;
                border-radius: 8px;
                overflow: hidden;
            }

            .totals table {
                width: 100%;
                border-collapse: collapse;
            }

            .totals td {
                padding: 8px;
                border-bottom: 1px solid #eee;
                text-align: right;
            }

            .totals tr:last-child td {
                border-bottom: none;
            }

            .grand-total {
                font-size: 14px;
                font-weight: bold;
                background: #000;
                color: #fff;
            }

            .terms {
                margin-top: 30px;
                font-size: 11px;
                color: #444;
            }

            .footer {
                margin-top: 50px;
                display: flex;
                justify-content: space-between;
                align-items: flex-end;
            }

            .signature {
                text-align: right;
            }

            .signature-line {
                margin-top: 40px;
                border-top: 1px solid #000;
                width: 180px;
                text-align: center;
                font-size: 11px;
                padding-top: 4px;
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
            </div>

            <div class="meta">
                <div><strong>PURCHASE ORDER</strong></div>
                <div>PO #: ${orderNumber}</div>
                <div>Date: ${date}</div>
                <div class="badge">CONFIRMED</div>
            </div>
        </div>

        <!-- COMPANY + SUPPLIER -->
        <div class="grid">
            <div class="card">
                <div class="card-title">Buyer</div>
                <strong>${company.name || "-"}</strong><br/>
                <strong>${company.gstNumber || "-"}</strong><br/>
                ${company.address || "-"}<br/>
                ${company.phone || "-"}
            </div>

            <div class="card">
                <div class="card-title">Supplier</div>
                <strong>${supplier.name || "-"}</strong><br/>
                <strong>${supplier.gstNumber || "-"}</strong><br/>
                ${supplier.address || "-"}<br/>
                ${supplier.phone || "-"}
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
                    <th>Base</th>
                    <th>Diff</th>
                    <th>Rate</th>
                    <th>Amount</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
        </table>

        <!-- TOTALS -->
        <div class="totals">
            <table>
                <tr>
                    <td>Subtotal</td>
                    <td>₹ ${formatCurrency(totals.subtotal)}</td>
                </tr>
                <tr>
                    <td>Transport</td>
                    <td>₹ ${formatCurrency(totals.transport)}</td>
                </tr>
                <tr>
                    <td>Loading</td>
                    <td>₹ ${formatCurrency(totals.loading)}</td>
                </tr>
                <tr>
                    <td>GST (18%)</td>
                    <td>₹ ${formatCurrency(totals.gst)}</td>
                </tr>
                <tr class="grand-total">
                    <td>Grand Total</td>
                    <td>₹ ${formatCurrency(totals.finalAmount)}</td>
                </tr>
            </table>
        </div>

        <!-- TERMS -->
        <div class="terms">
            <strong>Terms & Conditions</strong>
            <ul>
                <li>Material must meet agreed specifications</li>
                <li>Delivery within agreed timeline</li>
                <li>Payment terms as agreed</li>
            </ul>
        </div>

        <!-- FOOTER -->
        <div class="footer">
            <div>
                <p>Authorized By</p>
            </div>

            <div class="signature">
                <p>For ${company.name || ""}</p>
                <div class="signature-line">
                    Authorized Signatory
                </div>
            </div>
        </div>

    </body>
    </html>
    `;
};