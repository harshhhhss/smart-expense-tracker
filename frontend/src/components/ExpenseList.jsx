// src/components/ExpenseList.jsx
import { useState } from "react";
import API from "../api/axios";

const CATEGORY_COLORS = {
  Food: "#f7971e", Travel: "#38bdf8", Shopping: "#ff6584",
  Entertainment: "#a78bfa", Health: "#43e97b", Utilities: "#6c63ff",
  Education: "#fbbf24", "Personal Care": "#fb7185", Other: "#8888aa",
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
    <div style={styles.card}>
      <h3 style={styles.cardTitle}>📋 Expenses</h3>

      {expenses.length === 0 ? (
        <div style={styles.empty}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>💸</div>
          <p>No expenses yet. Add your first one!</p>
        </div>
      ) : (
        <div style={styles.list}>
          {expenses.map((expense) => {
            const color = CATEGORY_COLORS[expense.category] || "#8888aa";
            return (
              <div key={expense._id} style={styles.item}>
                {/* Left: category badge + info */}
                <div style={styles.itemLeft}>
                  <div style={{ ...styles.catDot, background: color }} />
                  <div>
                    <div style={styles.itemTop}>
                      <span style={{ ...styles.catBadge, color, borderColor: color + "40", background: color + "15" }}>
                        {expense.category}
                      </span>
                      {expense.autoTagged && (
                        <span style={styles.autoTag}>✨ auto</span>
                      )}
                    </div>
                    {expense.description && (
                      <div style={styles.desc}>{expense.description}</div>
                    )}
                    <div style={styles.date}>{formatDate(expense.date)}</div>
                  </div>
                </div>

                {/* Right: amount + actions */}
                <div style={styles.itemRight}>
                  <span style={styles.amount}>₹{Number(expense.amount).toFixed(2)}</span>
                  <div style={styles.actions}>
                    <button style={styles.editBtn} onClick={() => onEdit(expense)}>Edit</button>
                    <button
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
    background: "#1a1d27", border: "1px solid #2a2d3e",
    borderRadius: "14px", padding: "1.5rem",
  },
  cardTitle: { fontSize: "1rem", fontWeight: 600, color: "#e8e8f0", marginBottom: "1rem", marginTop: 0 },
  list: { display: "flex", flexDirection: "column", gap: 0 },
  item: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "0.85rem 0", borderBottom: "1px solid #2a2d3e",
  },
  itemLeft: { display: "flex", alignItems: "center", gap: "0.75rem", flex: 1, minWidth: 0 },
  catDot: { width: 8, height: 8, borderRadius: "50%", flexShrink: 0 },
  itemTop: { display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.2rem" },
  catBadge: {
    fontSize: "0.72rem", fontWeight: 700,
    padding: "2px 8px", borderRadius: "6px", border: "1px solid",
  },
  autoTag: {
    fontSize: "0.68rem", color: "#43e97b",
    background: "rgba(67,233,123,0.1)", padding: "1px 6px",
    borderRadius: "10px", border: "1px solid rgba(67,233,123,0.2)",
  },
  desc: { fontSize: "0.82rem", color: "#8888aa", marginBottom: "0.15rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 200 },
  date: { fontSize: "0.72rem", color: "#555577" },
  itemRight: { display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 },
  amount: { fontFamily: "monospace", fontWeight: 700, color: "#ff6584", fontSize: "0.95rem" },
  actions: { display: "flex", gap: "0.4rem" },
  editBtn: {
    padding: "0.3rem 0.7rem", borderRadius: "6px", border: "1px solid rgba(108,99,255,0.3)",
    background: "rgba(108,99,255,0.1)", color: "#6c63ff",
    fontSize: "0.75rem", cursor: "pointer", fontFamily: "inherit",
  },
  delBtn: {
    padding: "0.3rem 0.7rem", borderRadius: "6px", border: "1px solid rgba(255,101,132,0.3)",
    background: "rgba(255,101,132,0.1)", color: "#ff6584",
    fontSize: "0.75rem", cursor: "pointer", fontFamily: "inherit",
  },
  empty: { textAlign: "center", color: "#555577", padding: "2.5rem 1rem", fontSize: "0.9rem" },
};

export default ExpenseList;