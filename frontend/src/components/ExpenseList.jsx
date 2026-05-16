// src/components/ExpenseList.jsx
import { useState } from "react";
import API from "../api/axios";

const CATEGORY_COLORS = {
  Food: "#d89a2b", Travel: "#60a5fa", Shopping: "#94a3b8",
  Entertainment: "#aeb8ff", Health: "#31c48d", Utilities: "#7c8cff",
  Education: "#cbd5e1", "Personal Care": "#94a3b8", Miscellaneous: "var(--muted)",
};

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
          <h3 style={styles.cardTitle}>Recent Expenses</h3>
          <p style={styles.cardSubtitle}>Latest {expenses.length} transactions</p>
        </div>
      </div>

      {expenses.length === 0 ? (
        <div style={styles.empty}>
          <p>No expenses yet. Add your first one.</p>
        </div>
      ) : (
        <div style={styles.list}>
          {expenses.map((expense) => {
            const color = CATEGORY_COLORS[expense.category] || "var(--muted)";
            return (
              <div key={expense._id} className="expense-row" style={styles.item}>
                <div style={styles.itemLeft}>
                  <div style={{ ...styles.catDot, background: color }} />
                  <div style={styles.itemInfo}>
                    <div style={styles.desc}>
                      {expense.description || "Untitled expense"}
                    </div>
                    <div style={styles.itemMeta}>
                      <span style={{ ...styles.catBadge, color, borderColor: color + "40", background: color + "15" }}>
                        {expense.category}
                      </span>
                      {expense.autoTagged && (
                        <span style={styles.autoTag}>Auto</span>
                      )}
                      <span style={styles.date}>{formatDate(expense.date)}</span>
                    </div>
                  </div>
                </div>

                <div style={styles.itemRight}>
                  <span style={styles.amount}>Rs {Number(expense.amount).toFixed(2)}</span>
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
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const styles = {
  card: {
    background: "var(--surface)", border: "1px solid var(--border)",
    borderRadius: "var(--radius)", padding: "1.1rem",
    overflow: "hidden",
  },
  cardHeader: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "1rem",
    paddingBottom: "0.9rem",
    borderBottom: "1px solid var(--border)",
  },
  cardTitle: { fontSize: "0.98rem", fontWeight: 700, color: "var(--text)", marginBottom: "0.2rem", marginTop: 0 },
  cardSubtitle: { fontSize: "0.78rem", color: "var(--muted)", margin: 0 },
  list: { display: "flex", flexDirection: "column", gap: 0 },
  item: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    flexWrap: "wrap",
    gap: "1rem",
    padding: "0.85rem 0", borderBottom: "1px solid var(--border)",
    transition: "background-color 0.18s ease",
  },
  itemLeft: { display: "flex", alignItems: "center", gap: "0.8rem", flex: 1, minWidth: 0 },
  itemInfo: { minWidth: 0, flex: 1 },
  catDot: { width: 8, height: 32, borderRadius: "999px", flexShrink: 0 },
  itemMeta: { display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.35rem" },
  catBadge: {
    fontSize: "0.68rem", fontWeight: 700,
    padding: "2px 8px", borderRadius: "6px", border: "1px solid",
  },
  autoTag: {
    fontSize: "0.68rem", color: "var(--success)",
    background: "rgba(49,196,141,0.08)", padding: "1px 6px",
    borderRadius: "999px", border: "1px solid rgba(49,196,141,0.22)",
  },
  desc: { fontSize: "0.9rem", color: "var(--text)", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },
  date: { fontSize: "0.72rem", color: "var(--muted)" },
  itemRight: { display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "1rem", flexShrink: 0, minWidth: "240px", marginLeft: "auto" },
  amount: { fontFamily: '"DM Mono", monospace', fontWeight: 700, color: "var(--text)", fontSize: "0.92rem", minWidth: "112px", textAlign: "right" },
  actions: { display: "flex", gap: "0.45rem" },
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
  empty: { textAlign: "center", color: "var(--muted)", padding: "2.5rem 1rem", fontSize: "0.9rem" },
};

export default ExpenseList;
