const formatCurrency = (value = 0) =>
    `₹${Number(value || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

const escapeHtml = (value = "") =>
    String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

export const salarySlipTemplate = ({
    employee,
    period,
    data,
    company = {},
}) => {
    const payableDays =
        typeof data.payableDays === "number"
            ? data.payableDays
            : Number(data.present || 0) + Number(data.halfDay || 0) * 0.5;

    return `
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Salary Slip - ${escapeHtml(employee?.userId || "Employee")}</title>
      <style>
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          padding: 32px;
          background: #f6f3ef;
          font-family: Arial, Helvetica, sans-serif;
          color: #1f2937;
        }

        .sheet {
          max-width: 860px;
          margin: 0 auto;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
        }

        .header {
          padding: 28px 32px 22px;
          background: linear-gradient(135deg, #4b2733 0%, #6c3b4b 100%);
          color: #ffffff;
        }

        .header-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
        }

        .brand h1 {
          margin: 0;
          font-size: 28px;
          line-height: 1.1;
          letter-spacing: 0.02em;
        }

        .brand p {
          margin: 8px 0 0;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.82);
        }

        .doc-badge {
          display: inline-flex;
          align-items: center;
          padding: 8px 14px;
          border-radius: 999px;
          background: #ffde5e;
          color: #4b2733;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .subheader {
          margin-top: 18px;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
        }

        .subcard {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 14px;
          padding: 12px 14px;
        }

        .subcard-label {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 6px;
        }

        .subcard-value {
          font-size: 14px;
          font-weight: 700;
          color: #ffffff;
        }

        .content {
          padding: 28px 32px 32px;
        }

        .section + .section {
          margin-top: 22px;
        }

        .section-title {
          margin: 0 0 12px;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #6b7280;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .info-card {
          border: 1px solid #e5e7eb;
          background: #fafafa;
          border-radius: 16px;
          padding: 16px;
        }

        .info-row + .info-row {
          margin-top: 12px;
        }

        .label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #6b7280;
          margin-bottom: 5px;
        }

        .value {
          font-size: 15px;
          font-weight: 600;
          color: #111827;
          word-break: break-word;
        }

        .stats {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }

        .stat {
          border-radius: 16px;
          border: 1px solid #ece7df;
          background: #fcfbf8;
          padding: 14px;
        }

        .stat-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #78716c;
          margin-bottom: 8px;
        }

        .stat-value {
          font-size: 22px;
          font-weight: 700;
          color: #1f2937;
        }

        .table-wrap {
          overflow: hidden;
          border: 1px solid #e5e7eb;
          border-radius: 18px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        thead th {
          background: #f8fafc;
          color: #6b7280;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          text-align: left;
          padding: 14px 16px;
          border-bottom: 1px solid #e5e7eb;
        }

        tbody td {
          padding: 14px 16px;
          border-bottom: 1px solid #eef2f7;
          font-size: 14px;
          color: #111827;
        }

        tbody tr:last-child td {
          border-bottom: none;
        }

        .amount {
          text-align: right;
          font-variant-numeric: tabular-nums;
        }

        .muted {
          color: #6b7280;
        }

        .summary-box {
          margin-top: 18px;
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 16px;
        }

        .summary-note {
          border: 1px solid #e5e7eb;
          background: #fafafa;
          border-radius: 18px;
          padding: 18px;
        }

        .summary-note p {
          margin: 0;
          font-size: 13px;
          line-height: 1.7;
          color: #4b5563;
        }

        .net-card {
          border-radius: 18px;
          background: #4b2733;
          color: #ffffff;
          padding: 20px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .net-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.72);
          margin-bottom: 8px;
        }

        .net-value {
          font-size: 30px;
          line-height: 1.1;
          font-weight: 800;
          color: #ffde5e;
          font-variant-numeric: tabular-nums;
        }

        .footer {
          margin-top: 22px;
          padding-top: 16px;
          border-top: 1px dashed #d1d5db;
          display: flex;
          justify-content: space-between;
          gap: 12px;
          font-size: 12px;
          color: #6b7280;
        }

        @media print {
          body {
            background: #ffffff;
            padding: 0;
          }

          .sheet {
            max-width: 100%;
            border: none;
            border-radius: 0;
            box-shadow: none;
          }
        }

        @media (max-width: 720px) {
          body {
            padding: 12px;
          }

          .header,
          .content {
            padding: 20px;
          }

          .header-top,
          .footer,
          .summary-box,
          .info-grid,
          .stats,
          .subheader {
            grid-template-columns: 1fr;
            display: grid;
          }

          .net-value {
            font-size: 24px;
          }
        }
      </style>
    </head>
    <body>
      <div class="sheet">
        <div class="header">
          <div class="header-top">
            <div class="brand">
              <h1>${escapeHtml(company.name || "The Karan Pole Industries")}</h1>
              <p>${escapeHtml(company.address || "Payroll statement generated for internal employee records")}</p>
            </div>
            <div class="doc-badge">Salary Slip</div>
          </div>

          <div class="subheader">
            <div class="subcard">
              <div class="subcard-label">Employee ID</div>
              <div class="subcard-value">${escapeHtml(employee?.userId || "-")}</div>
            </div>
            <div class="subcard">
              <div class="subcard-label">Salary type</div>
              <div class="subcard-value">${escapeHtml(employee?.salaryType || "-")}</div>
            </div>
            <div class="subcard">
              <div class="subcard-label">Period</div>
              <div class="subcard-value">${escapeHtml(period?.start || "-")} - ${escapeHtml(period?.end || "-")}</div>
            </div>
          </div>
        </div>

        <div class="content">
          <div class="section">
            <h2 class="section-title">Employee information</h2>
            <div class="info-grid">
              <div class="info-card">
                <div class="info-row">
                  <div class="label">Employee name</div>
                  <div class="value">${escapeHtml(employee?.name || employee?.userId || "-")}</div>
                </div>
                <div class="info-row">
                  <div class="label">Role</div>
                  <div class="value">${escapeHtml(employee?.role || "-")}</div>
                </div>
              </div>

              <div class="info-card">
                <div class="info-row">
                  <div class="label">Phone</div>
                  <div class="value">${escapeHtml(employee?.phone || "-")}</div>
                </div>
                <div class="info-row">
                  <div class="label">Base salary</div>
                  <div class="value">${formatCurrency(employee?.salaryAmount || 0)}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="section">
            <h2 class="section-title">Attendance summary</h2>
            <div class="stats">
              <div class="stat">
                <div class="stat-label">Present</div>
                <div class="stat-value">${Number(data?.present || 0)}</div>
              </div>
              <div class="stat">
                <div class="stat-label">Half day</div>
                <div class="stat-value">${Number(data?.halfDay || 0)}</div>
              </div>
              <div class="stat">
                <div class="stat-label">Absent</div>
                <div class="stat-value">${Number(data?.absent || 0)}</div>
              </div>
              <div class="stat">
                <div class="stat-label">Payable days</div>
                <div class="stat-value">${Number(payableDays || 0)}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <h2 class="section-title">Payroll breakdown</h2>
            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Particular</th>
                    <th class="amount">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Per day salary</td>
                    <td class="amount">${formatCurrency(data?.perDay || 0)}</td>
                  </tr>
                  <tr>
                    <td>Earned salary</td>
                    <td class="amount">${formatCurrency(data?.earned || 0)}</td>
                  </tr>
                  <tr>
                    <td>Advance deduction</td>
                    <td class="amount">${formatCurrency(data?.totalAdvance || 0)}</td>
                  </tr>
                  <tr>
                    <td><strong>Net salary payable</strong></td>
                    <td class="amount"><strong>${formatCurrency(data?.netSalary || 0)}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="summary-box">
              <div class="summary-note">
                <p>
                  This salary slip is generated for the payroll period from
                  <strong>${escapeHtml(period?.start || "-")}</strong> to
                  <strong>${escapeHtml(period?.end || "-")}</strong>.
                  Any advance amount has been adjusted against earned salary for this cycle.
                </p>
              </div>

              <div class="net-card">
                <div class="net-label">Net salary</div>
                <div class="net-value">${formatCurrency(data?.netSalary || 0)}</div>
              </div>
            </div>
          </div>

          <div class="footer">
            <span>This is a computer-generated salary slip.</span>
            <span>${escapeHtml(company.name || "Payroll Department")}</span>
          </div>
        </div>
      </div>
    </body>
  </html>
  `;
};