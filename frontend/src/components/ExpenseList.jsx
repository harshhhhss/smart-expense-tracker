// src/components/ExpenseList.jsx
import { useState } from "react";
import API from "../api/axios";

const CATEGORY_COLORS = {
  Food: "#b86b00", Travel: "#256f9c", Shopping: "#7a869a",
  Entertainment: "#6d5bd0", Health: "#0f8f69", Utilities: "#2357c6",
  Education: "#64748b", "Personal Care": "#7a869a", Miscellaneous: "var(--muted)",
};

const CATEGORY_GLYPHS = {
  Food: "M7 8h10M8 4v16M16 4v16M6 12h12",
  Travel: "M4 14l16-6-6 12-3-5-5-1Z",
  Shopping: "M6 8h12l-1 12H7L6 8ZM9 8a3 3 0 0 1 6 0",
  Entertainment: "M6 8h12v10H6V8ZM8 5l2 3M14 5l-2 3",
  Health: "M12 5v14M5 12h14",
  Utilities: "M13 3 6 13h5l-1 8 8-12h-5l0-6Z",
  Education: "M4 8l8-4 8 4-8 4-8-4ZM7 11v4c3 2 7 2 10 0v-4",
  "Personal Care": "M12 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8ZM5 20a7 7 0 0 1 14 0",
  Miscellaneous: "M5 12h14M12 5v14",
};

const CategoryIcon = ({ category, color }) => (
  <span style={{ ...styles.categoryIcon, color, background: `${color}14`, borderColor: `${color}35` }}>
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={CATEGORY_GLYPHS[category] || CATEGORY_GLYPHS.Miscellaneous} />
    </svg>
  </span>
);

const ExpenseList = ({ expenses, onRefresh, onEdit }) => {
  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this expense?")) return;
    setDeletingId(id);
    try {
      await API.delete(`/expenses/${id}`);
      onRefresh();
    } catch {
      alert("Failed to delete expense");
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric"
  });

  return (
    <div className="product-card" style={styles.card}>
      <div style={styles.cardHeader}>
        <div>
          <h3 style={styles.cardTitle}>Transactions</h3>
          <p style={styles.cardSubtitle}>Latest {expenses.length} transactions</p>
        </div>
      </div>

      {expenses.length === 0 ? (
        <div style={styles.empty}>
          <div className="empty-illustration" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z" />
              <path d="M9 8h6M9 12h6M9 16h3" />
            </svg>
          </div>
          <h4 style={styles.emptyTitle}>No transactions yet</h4>
          <p style={styles.emptyText}>Add an expense to start building your spending history.</p>
        </div>
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={{ ...styles.th, textAlign: "left" }}>Transaction</th>
                <th style={styles.th}>Category</th>
                <th style={styles.th}>Date</th>
                <th style={{ ...styles.th, textAlign: "right" }}>Amount</th>
                <th style={{ ...styles.th, textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => {
                const color = CATEGORY_COLORS[expense.category] || "var(--muted)";
                return (
                  <tr key={expense._id} className="transaction-row" style={styles.tr}>
                    <td style={styles.td}>
                      <div style={styles.transactionCell}>
                        <CategoryIcon category={expense.category} color={color} />
                        <div style={styles.itemInfo}>
                          <div style={styles.desc}>{expense.description || "Untitled expense"}</div>
                          {expense.autoTagged && <span style={styles.autoTag}>Auto-tagged</span>}
                        </div>
                      </div>
                    </td>
                    <td style={styles.td} data-label="Category">
                      <span style={{ ...styles.catBadge, color, borderColor: color + "40", background: color + "14" }}>
                        {expense.category}
                      </span>
                    </td>
                    <td style={{ ...styles.td, color: "var(--muted)", fontSize: "0.8rem" }} data-label="Date">
                      {formatDate(expense.date)}
                    </td>
                    <td style={{ ...styles.td, ...styles.amount }} data-label="Amount">
                      Rs {Number(expense.amount).toFixed(2)}
                    </td>
                    <td style={styles.td} data-label="Actions">
                      <div style={styles.actions}>
                        <button className="ghost-button" style={styles.editBtn} onClick={() => onEdit(expense)}>Edit</button>
                        <button
                          className="ghost-button"
                          style={styles.delBtn}
                          onClick={() => handleDelete(expense._id)}
                          disabled={deletingId === expense._id}
                        >
                          {deletingId === expense._id ? "..." : "Del"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const styles = {
  card: {
    background: "var(--surface)", border: "1px solid color-mix(in srgb, var(--border) 70%, transparent)",
    borderRadius: "var(--radius)", padding: "0.95rem",
    overflow: "hidden",
  },
  cardHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "1rem",
    paddingBottom: "0.75rem",
    borderBottom: "1px solid color-mix(in srgb, var(--border) 72%, transparent)",
  },
  cardTitle: { fontSize: "0.98rem", fontWeight: 800, color: "var(--text)", marginBottom: "0.15rem", marginTop: 0 },
  cardSubtitle: { fontSize: "0.78rem", color: "var(--muted)", margin: 0 },
  tableWrap: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", minWidth: 720 },
  th: {
    color: "var(--muted)",
    fontSize: "0.7rem",
    fontWeight: 800,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    padding: "0.62rem 0.55rem",
    borderBottom: "1px solid color-mix(in srgb, var(--border) 70%, transparent)",
  },
  tr: { transition: "background-color 0.18s ease, transform 0.18s ease" },
  td: {
    padding: "0.58rem 0.55rem",
    borderBottom: "1px solid color-mix(in srgb, var(--border) 55%, transparent)",
    verticalAlign: "middle",
    textAlign: "right",
    whiteSpace: "nowrap",
  },
  transactionCell: { display: "flex", alignItems: "center", gap: "0.68rem", minWidth: 0, textAlign: "left" },
  itemInfo: { minWidth: 0, flex: 1 },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: "10px",
    border: "1px solid",
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
  },
  catBadge: {
    fontSize: "0.68rem", fontWeight: 700,
    padding: "3px 8px", borderRadius: "999px", border: "1px solid",
  },
  autoTag: {
    display: "inline-block",
    marginTop: "0.18rem",
    fontSize: "0.66rem", color: "var(--success)",
    background: "rgba(49,196,141,0.08)", padding: "1px 6px",
    borderRadius: "999px", border: "1px solid rgba(49,196,141,0.22)",
  },
  desc: { fontSize: "0.88rem", color: "var(--text)", fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 360 },
  amount: { fontFamily: '"DM Mono", monospace', fontWeight: 900, color: "var(--expense-amount)", fontSize: "0.94rem", textAlign: "right" },
  actions: { display: "flex", gap: "0.42rem", justifyContent: "flex-end" },
  editBtn: {
    padding: "0.4rem 0.72rem", borderRadius: "6px", border: "1px solid color-mix(in srgb, var(--accent) 28%, transparent)",
    background: "var(--accent-soft)", color: "var(--accent)",
    fontSize: "0.76rem", cursor: "pointer", fontFamily: "inherit", fontWeight: 600,
  },
  delBtn: {
    padding: "0.4rem 0.72rem", borderRadius: "6px", border: "1px solid color-mix(in srgb, var(--danger) 28%, transparent)",
    background: "var(--danger-soft)", color: "var(--danger)",
    fontSize: "0.76rem", cursor: "pointer", fontFamily: "inherit", fontWeight: 600,
  },
  empty: { textAlign: "center", color: "var(--muted)", padding: "3rem 1rem", fontSize: "0.9rem" },
  emptyTitle: { color: "var(--text)", fontSize: "0.98rem", fontWeight: 800, margin: "0 0 0.25rem" },
  emptyText: { color: "var(--muted)", fontSize: "0.84rem", margin: 0 },
};

export default ExpenseList;
