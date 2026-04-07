export const salesOrderTemplate = (data) => {
    const {
        company = {},
        customer = {},
        items = [],
        totals = {},
        orderNumber = "",
        date = "",
        status = "",
    } = data;

    const formatCurrency = (num) =>
        Number(num || 0).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });

    const formatVariant = (variant = {}) =>
        [variant?.size, variant?.grade, variant?.thickness ? `T-${variant.thickness}` : ""]
            .filter(Boolean)
            .join(" • ");

    const customerAddress = [
        customer?.billingAddress?.addressLine,
        customer?.billingAddress?.city,
        customer?.billingAddress?.state,
        customer?.billingAddress?.pincode,
        customer?.billingAddress?.country,
    ]
        .filter(Boolean)
        .join(", ");

    const primaryContact = customer?.contacts?.[0] || {};

    const rows = items
        .map(
            (item, i) => `
        <tr>
            <td>${i + 1}</td>
            <td class="left strong capitalize">${item.product?.name || "-"}</td>
            <td class="left">${formatVariant(item.variant) || "-"}</td>
            <td>${item.quantity || 0}</td>
            <td>${item.unit || "-"}</td>
            <td class="right">₹ ${formatCurrency(item.sellingPrice)}</td>
            <td class="right">₹ ${formatCurrency(item.finalAmount)}</td>
        </tr>
    `
        )
        .join("");

    return `
    <html>
    <head>
        <style>
            * {
                box-sizing: border-box;
            }

            body {
                font-family: "Segoe UI", Arial, sans-serif;
                padding: 28px;
                font-size: 12px;
                color: #222;
                margin: 0;
                background: #fff;
            }

            .document {
                width: 100%;
            }

            .header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                border-bottom: 2px solid #1f2937;
                padding-bottom: 14px;
                margin-bottom: 20px;
            }

            .company-name {
                font-size: 22px;
                font-weight: 700;
                color: #111827;
                margin-bottom: 4px;
            }

            .company-meta {
                color: #4b5563;
                line-height: 1.6;
                font-size: 11px;
            }

            .doc-meta {
                text-align: right;
                min-width: 220px;
            }

            .doc-title {
                font-size: 18px;
                font-weight: 700;
                margin-bottom: 8px;
                color: #111827;
                letter-spacing: 0.4px;
            }

            .meta-line {
                margin-bottom: 4px;
                color: #374151;
            }

            .status-badge {
                display: inline-block;
                margin-top: 8px;
                padding: 5px 10px;
                border-radius: 999px;
                font-size: 11px;
                font-weight: 600;
                text-transform: capitalize;
                background: #eef2ff;
                color: #4338ca;
                border: 1px solid #c7d2fe;
            }

            .grid {
                display: flex;
                gap: 14px;
                margin-bottom: 18px;
            }

            .card {
                flex: 1;
                border: 1px solid #d1d5db;
                border-radius: 8px;
                padding: 12px;
                background: #f9fafb;
                min-height: 120px;
            }

            .card-title {
                font-size: 11px;
                font-weight: 700;
                color: #6b7280;
                text-transform: uppercase;
                letter-spacing: 0.4px;
                margin-bottom: 8px;
            }

            .card p {
                margin: 4px 0;
                line-height: 1.55;
                color: #1f2937;
            }

            .muted {
                color: #6b7280;
            }

            table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 4px;
                font-size: 11px;
            }

            thead {
                background: #f3f4f6;
            }

            th, td {
                border: 1px solid #d1d5db;
                padding: 9px 8px;
                vertical-align: top;
                text-align: center;
            }

            th {
                font-weight: 700;
                color: #374151;
            }

            .left {
                text-align: left;
            }

            .right {
                text-align: right;
            }

            .strong {
                font-weight: 600;
            }

            .totals-wrap {
                width: 360px;
                margin-left: auto;
                margin-top: 18px;
            }

            .totals-wrap table {
                margin-top: 0;
            }

            .totals-wrap td {
                padding: 8px 10px;
            }

            .totals-wrap td:first-child {
                text-align: left;
                color: #4b5563;
            }

            .totals-wrap td:last-child {
                text-align: right;
                font-weight: 600;
                color: #111827;
            }

            .grand td {
                background: #111827;
                color: #fff !important;
                font-weight: 700 !important;
            }

            .footer {
                margin-top: 36px;
                display: flex;
                justify-content: space-between;
                align-items: flex-end;
                gap: 16px;
            }

            .footer-note {
                max-width: 60%;
                color: #4b5563;
                line-height: 1.6;
                font-size: 11px;
            }

            .signature {
                text-align: center;
                min-width: 220px;
            }

            .signature-line {
                margin-top: 42px;
                border-top: 1px solid #111827;
                padding-top: 6px;
                font-size: 11px;
                color: #374151;
            }
        </style>
    </head>

    <body>
        <div class="document">
            <div class="header">
                <div>
                    <div class="company-name">${company.name || "Company Name"}</div>
                    <div class="company-meta">
                        ${company.address || ""}<br/>
                        ${company.phone || ""}<br/>
                        ${company.gstNumber ? `GST: ${company.gstNumber}` : ""}
                    </div>
                </div>

                <div class="doc-meta">
                    <div class="doc-title">SALES ORDER</div>
                    <div class="meta-line"><strong>Order #:</strong> ${orderNumber}</div>
                    <div class="meta-line"><strong>Date:</strong> ${date}</div>
                    <div class="status-badge">${String(status || "confirmed").replace(/_/g, " ")}</div>
                </div>
            </div>

            <div class="grid">
                <div class="card">
                    <div class="card-title">Customer Details</div>
                    <p><strong>${customer.name || "-"}</strong></p>
                    <p>${primaryContact?.name ? `Contact: ${primaryContact.name}` : ""}</p>
                    <p>${primaryContact?.phone ? `Phone: ${primaryContact.phone}` : ""}</p>
                    <p>${primaryContact?.email ? `Email: ${primaryContact.email}` : ""}</p>
                    <p>${customer.gstNumber ? `GST: ${customer.gstNumber}` : ""}</p>
                </div>

                <div class="card">
                    <div class="card-title">Billing Address</div>
                    <p>${customerAddress || "-"}</p>
                    ${customer.customerType
            ? `<p><span class="muted">Customer Type:</span> ${customer.customerType}</p>`
            : ""
        }
                    ${customer.creditLimit
            ? `<p><span class="muted">Credit Limit:</span> ₹ ${formatCurrency(customer.creditLimit)}</p>`
            : ""
        }
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th style="width: 40px;">#</th>
                        <th>Product</th>
                        <th>Variant</th>
                        <th style="width: 70px;">Qty</th>
                        <th style="width: 70px;">Unit</th>
                        <th style="width: 110px;">Rate</th>
                        <th style="width: 120px;">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows || `
                        <tr>
                            <td colspan="7" style="padding: 14px; color: #6b7280;">
                                No items available
                            </td>
                        </tr>
                    `}
                </tbody>
            </table>

            <div class="totals-wrap">
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
                        <td>GST</td>
                        <td>₹ ${formatCurrency(totals.gstAmount)}</td>
                    </tr>
                    <tr class="grand">
                        <td>Final Total</td>
                        <td>₹ ${formatCurrency(totals.finalTotal || totals.totalAmount)}</td>
                    </tr>
                </table>
            </div>

            <div class="footer">
                <div class="footer-note">
                    This sales order confirms the items, quantities, and agreed rates for supply.
                    Goods are subject to dispatch, stock availability, and order status confirmation.
                </div>

                <div class="signature">
                    <div class="signature-line">Authorized Signatory</div>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
};