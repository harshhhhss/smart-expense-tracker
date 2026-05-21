import { useState } from "react";
import { exportToCSV, exportToPDF, exportSummaryToCSV } from "../utils/exportUtils";
import useToast from "../hooks/useToast";

const ExportPanel = ({ expenses, summary }) => {
  const [isOpen, setIsOpen] = useState(false);
  const toast = useToast();

  const handleExportExpensesCSV = () => {
    try {
      exportToCSV(expenses, `expenses-${new Date().toISOString().split("T")[0]}.csv`);
      toast.showSuccess("Expenses exported as CSV");
    } catch (err) {
      toast.showError("Failed to export CSV");
    }
  };

  const handleExportExpensesPDF = () => {
    try {
      exportToPDF(expenses);
      toast.showSuccess("Opening PDF export...");
    } catch (err) {
      toast.showError("Failed to export PDF");
    }
  };

  const handleExportSummaryCSV = () => {
    try {
      exportSummaryToCSV(summary, expenses, `expense-summary-${new Date().toISOString().split("T")[0]}.csv`);
      toast.showSuccess("Summary exported as CSV");
    } catch (err) {
      toast.showError("Failed to export summary");
    }
  };

  return (
    <div className="control-surface" style={styles.container}>
      <button className="ghost-button" style={styles.toggleBtn} onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? "Hide Export Options" : "Export Data"}
      </button>

      {isOpen && (
        <div style={styles.panel}>
          <div style={styles.grid}>
            <button className="ghost-button" style={styles.btn} onClick={handleExportExpensesCSV}>
              Expenses (CSV)
            </button>
            <button className="ghost-button" style={styles.btn} onClick={handleExportExpensesPDF}>
              Expenses (PDF)
            </button>
            <button className="ghost-button" style={styles.btn} onClick={handleExportSummaryCSV}>
              Summary (CSV)
            </button>
          </div>
          <div style={styles.info}>
            Export your expense data for backup or analysis.
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    background: "color-mix(in srgb, var(--surface) 96%, transparent)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    marginBottom: 0,
    padding: "0.38rem"
  },
  toggleBtn: {
    width: "100%",
    padding: "0.56rem 0.62rem",
    background: "transparent",
    border: "none",
    color: "var(--accent)",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: "0.8rem",
    textAlign: "left",
    fontFamily: "inherit"
  },
  panel: {
    padding: "0.75rem",
    borderTop: "1px solid var(--border)"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "0.62rem",
    marginBottom: "0.75rem"
  },
  btn: {
    padding: "0.58rem",
    background: "var(--surface-2)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    color: "var(--text)",
    cursor: "pointer",
    fontWeight: 500,
    fontFamily: "inherit",
    fontSize: "0.8rem",
    transition: "all 0.2s"
  },
  info: {
    fontSize: "0.76rem",
    color: "var(--muted)",
    padding: "0.5rem 0",
    textAlign: "center"
  }
};

export default ExportPanel;
