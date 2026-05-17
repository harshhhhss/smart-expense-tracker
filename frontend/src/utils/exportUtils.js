// Utility for exporting expenses as CSV
export const exportToCSV = (expenses, filename = "expenses.csv") => {
  if (!expenses || expenses.length === 0) {
    alert("No expenses to export");
    return;
  }

  // CSV header
  const headers = ["Date", "Category", "Amount", "Description"];
  const csvContent = [
    headers.join(","),
    ...expenses.map(exp => {
      const date = new Date(exp.date).toISOString().split("T")[0];
      const category = exp.category;
      const amount = exp.amount;
      const description = (exp.description || "").replace(/,/g, " ");
      return [date, category, amount, description].join(",");
    })
  ].join("\n");

  // Create blob and download
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};

// Utility for exporting expenses as PDF (using a simple HTML-based approach)
export const exportToPDF = (expenses, filename = "expenses.pdf") => {
  if (!expenses || expenses.length === 0) {
    alert("No expenses to export");
    return;
  }

  // Create HTML content
  const now = new Date().toLocaleString();
  const totalAmount = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  let htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Expense Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { color: #333; }
        .meta { color: #666; font-size: 12px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
        th { background-color: #f0f0f0; font-weight: bold; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .total { font-weight: bold; font-size: 14px; margin-top: 20px; }
        .amount { text-align: right; }
      </style>
    </head>
    <body>
      <h1>Expense Report</h1>
      <div class="meta">Generated on: ${now}</div>
      
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Category</th>
            <th>Description</th>
            <th class="amount">Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
  `;

  expenses.forEach(exp => {
    const date = new Date(exp.date).toISOString().split("T")[0];
    htmlContent += `
      <tr>
        <td>${date}</td>
        <td>${exp.category}</td>
        <td>${exp.description || "-"}</td>
        <td class="amount">${exp.amount.toFixed(2)}</td>
      </tr>
    `;
  });

  htmlContent += `
        </tbody>
      </table>
      <div class="total">Total Expenses: ₹${totalAmount.toFixed(2)}</div>
    </body>
    </html>
  `;

  // Open print dialog
  const printWindow = window.open("", "", "width=800,height=600");
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  printWindow.print();
};

// Export summary statistics
export const exportSummaryToCSV = (summary, expenses, filename = "expense-summary.csv") => {
  if (!summary || !expenses) {
    alert("Missing data to export");
    return;
  }

  const categoryTotals = {};
  expenses.forEach(exp => {
    categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
  });

  let csvContent = "EXPENSE SUMMARY\n\n";
  csvContent += `Generated: ${new Date().toLocaleString()}\n\n`;

  csvContent += "OVERALL STATISTICS\n";
  csvContent += "Metric,Value\n";
  csvContent += `Total Expenses,${summary.total || 0}\n`;
  csvContent += `This Month,${summary.thisMonth || 0}\n`;
  csvContent += `Last Month,${summary.lastMonth || 0}\n`;
  csvContent += `Month-over-Month Change,${summary.monthOverMonthChange || 0}%\n`;

  csvContent += "\nCATEGORY BREAKDOWN\n";
  csvContent += "Category,Amount\n";
  Object.entries(categoryTotals).forEach(([category, total]) => {
    csvContent += `${category},${total.toFixed(2)}\n`;
  });

  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};
