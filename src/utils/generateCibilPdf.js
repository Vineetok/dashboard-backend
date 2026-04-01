import puppeteer from "puppeteer";

export const generateCibilPdf = async (reportData) => {
  const browser = await puppeteer.launch({
    headless: "new",
    executablePath: "/usr/bin/chromium-browser", // or /usr/bin/chromium
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--no-zygote",
      "--single-process"
    ],
  });

  const page = await browser.newPage();

  // ✅ Extract Data Properly
  const report =
    reportData?.data?.GetCustomerAssetsResponse?.GetCustomerAssetsSuccess?.Asset
      ?.TrueLinkCreditReport;

  const borrower = report?.Borrower || {};
  const tradelines = report?.TradeLinePartition || [];
  const inquiries = report?.InquiryPartition || [];
  const score = borrower?.CreditScore?.riskScore || "-";

  const activeLoans = tradelines.filter((t) => !t?.Tradeline?.dateClosed);

  const closedLoans = tradelines.filter((t) => t?.Tradeline?.dateClosed);

  const totalOutstanding = activeLoans.reduce(
    (sum, t) => sum + Number(t?.Tradeline?.currentBalance || 0),
    0,
  );

  const totalOverdue = activeLoans.reduce(
    (sum, t) => sum + Number(t?.Tradeline?.GrantedTrade?.amountPastDue || 0),
    0,
  );

  const logoUrl =
    "https://infinity-client-documents.s3.ap-south-1.amazonaws.com/Infinity-Arthvishva-logo.png";

  // ✅ Professional HTML
  const html = `
<html>
<head>
<style>
  body { font-family: Arial, sans-serif; padding: 35px; color: #222; }

  body::before {
    content: "";
    position: fixed;
    top: 50%;
    left: 50%;
    width: 600px;
    height: 600px;
    background: url('${logoUrl}') no-repeat center;
    background-size: contain;
    opacity: 0.05;
    transform: translate(-50%, -50%);
    z-index: -1;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    /* Updated to Blue #2076C7 */
    border-bottom: 3px solid #2076C7; 
    padding-bottom: 12px;
  }

  .brand {
    font-size: 20px;
    font-weight: bold;
    /* Updated to Blue #2076C7 */
    color: #2076C7;
  }

  .score {
    /* Updated to Peacock Green #1CADA3 */
    background: #1CADA3;
    color: white;
    padding: 10px 25px;
    border-radius: 6px;
    font-size: 20px;
    font-weight: bold;
  }

  h3 { 
    margin-top: 30px; 
    /* Updated to Peacock Green #1CADA3 */
    color: #1CADA3; 
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 10px;
  }

  th, td {
    border: 1px solid #ddd;
    padding: 7px;
    font-size: 12px;
  }

  th {
    /* Updated to Blue #2076C7 */
    background: #2076C7;
    color: white;
  }

  .summary {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-top: 15px;
  }

  .card {
    border: 1px solid #ddd;
    padding: 12px;
    border-radius: 6px;
    background: #f7f7f7;
  }

  .card h4 {
    margin: 0;
    font-size: 12px;
    color: #666;
  }

  .card p {
    margin: 5px 0 0;
    font-size: 16px;
    font-weight: bold;
  }

  .payment-grid {
    display: flex;
    gap: 2px;
    flex-wrap: wrap;
  }

  .box {
    width: 16px;
    height: 16px;
    font-size: 8px;
    text-align: center;
    line-height: 16px;
    border-radius: 2px;
    color: white;
  }

  /* Semantic colors for payment status remain standard for clarity */
  .paid { background: #2e7d32; }
  .late { background: #f9a825; }
  .severe { background: #c62828; }
  .unknown { background: #9e9e9e; }

  .footer {
    margin-top: 40px;
    text-align: center;
    font-size: 10px;
    color: #777;
  }
</style>
</head>

<body>

<div class="header">
  <div>
    <div class="brand">Infinity Arthvishva</div>
    <div style="font-size:11px;">Credit Risk & Intelligence Division</div>
  </div>
  <div class="score">CIBIL Score: ${score}</div>
</div>

<h3>Borrower Information</h3>
<p><b>Name:</b> ${borrower?.BorrowerName?.Name?.Forename || ""} 
${borrower?.BorrowerName?.Name?.Surname || ""}</p>
<p><b>Gender:</b> ${borrower?.Gender || "-"}</p>
<p><b>DOB:</b> ${borrower?.Birth?.BirthDate?.day || ""}-
${borrower?.Birth?.BirthDate?.month || ""}-
${borrower?.Birth?.BirthDate?.year || ""}</p>

<h3>Executive Summary</h3>
<div class="summary">
  <div class="card">
    <h4>Active Loans</h4>
    <p>${activeLoans.length}</p>
  </div>
  <div class="card">
    <h4>Closed Loans</h4>
    <p>${closedLoans.length}</p>
  </div>
  <div class="card">
    <h4>Total Outstanding</h4>
    <p>₹ ${totalOutstanding.toLocaleString()}</p>
  </div>
  <div class="card">
    <h4>Total Overdue</h4>
    <p>₹ ${totalOverdue.toLocaleString()}</p>
  </div>
</div>

<h3>Loan Accounts</h3>
<table>
<tr>
  <th>Lender</th>
  <th>Account</th>
  <th>Status</th>
  <th>Balance</th>
  <th>Overdue</th>
</tr>
${tradelines
      .map(
        (t) => `
<tr>
  <td>${t?.Tradeline?.creditorName || "-"}</td>
  <td>${t?.Tradeline?.accountNumber || "-"}</td>
  <td>${t?.Tradeline?.dateClosed ? "Closed" : "Active"}</td>
  <td>₹ ${Number(t?.Tradeline?.currentBalance || 0).toLocaleString()}</td>
  <td>₹ ${Number(t?.Tradeline?.GrantedTrade?.amountPastDue || 0).toLocaleString()}</td>
</tr>
`,
      )
      .join("")}
</table>

<h3>Payment History</h3>
${tradelines
      .map((t) => {

        const history =
          t?.Tradeline?.GrantedTrade?.PayStatusHistory?.MonthlyPayStatus || [];

        const sorted = [...history].sort(
          (a, b) => new Date(a.date) - new Date(b.date)
        );

        const grid = sorted
          .map((m) => {

            const status = (m?.status || "").trim();

            let cls = "unknown";

            if (status === "0" || status === "STD") cls = "paid";
            else if (!isNaN(status) && Number(status) > 0 && Number(status) <= 30)
              cls = "late";
            else if (!isNaN(status) && Number(status) > 30)
              cls = "severe";

            const label =
              status === "0" ? "0" :
                status === "STD" ? "STD" :
                  status || "-";

            return `<div class="box ${cls}" title="${m.date}">
                  ${label}
                </div>`;
          })
          .join("");

        return `
      <p><b>${t?.Tradeline?.creditorName || "-"}</b></p>
      <div class="payment-grid">${grid}</div><br/>
    `;
      })
      .join("")}

<h3>Recent Inquiries</h3>
<table>
<tr>
  <th>Lender</th>
  <th>Date</th>
  <th>Amount</th>
</tr>
${inquiries
      .map(
        (i) => `
<tr>
  <td>${i?.Inquiry?.subscriberName || "-"}</td>
  <td>${i?.Inquiry?.inquiryDate || "-"}</td>
  <td>₹ ${Number(i?.Inquiry?.amount || 0).toLocaleString()}</td>
</tr>
`,
      )
      .join("")}
</table>

<div class="footer">
Confidential Report • Generated by Infinity Arthvishva
</div>

</body>
</html>
`;

  await page.setContent(html, { waitUntil: "networkidle0" });

  const pdf = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: { top: "20px", bottom: "20px", left: "20px", right: "20px" },
  });

  await browser.close();
  return pdf;
};
