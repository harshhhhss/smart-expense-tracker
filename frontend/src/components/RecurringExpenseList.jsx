import { useState, useEffect } from "react";
import API from "../api/axios";
import useToast from "../hooks/useToast";

const RecurringExpenseList = ({ refreshTrigger, onEdit }) => {
  const [recurring, setRecurring] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    loadRecurring();
  }, [refreshTrigger]);

  const loadRecurring = async () => {
    try {
      const res = await API.get("/recurring");
      setRecurring(res.data.recurring || []);
    } catch (err) {
      console.error(err);
      toast.showError("Couldn't load your recurring expenses");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this recurring expense?")) return;

    try {
      await API.delete(`/recurring/${id}`);
      setRecurring(recurring.filter(r => r._id !== id));
      toast.showSuccess("Recurring expense deleted");
    } catch (err) {
      toast.showError(err.response?.data?.message || "Couldn't delete that");
    }
  };

  const handleToggle = async (id, active) => {
    try {
      await API.put(`/recurring/${id}`, { active: !active });
      setRecurring(recurring.map(r => r._id === id ? { ...r, active: !active } : r));
      toast.showSuccess(`Recurring expense ${!active ? "enabled" : "disabled"}`);
    } catch (err) {
      toast.showError("Couldn't update that");
    }
  };

  if (loading) return <div style={styles.loading}>Loading...</div>;

  if (recurring.length === 0) {
    return <div style={styles.empty}>No recurring expenses yet</div>;
  }

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Your Recurring Expenses ({recurring.length})</h3>
      <div style={styles.list}>
        {recurring.map(rec => (
          <div key={rec._id} style={{ ...styles.item, opacity: rec.active ? 1 : 0.6 }}>
            <div style={styles.itemContent}>
              <div style={styles.itemHeader}>
                <span style={styles.category}>{rec.category}</span>
                <span style={styles.frequency}>{rec.frequency}</span>
              </div>
              <div style={styles.description}>{rec.description || "No description"}</div>
              <div style={styles.dateRange}>
                {new Date(rec.startDate).toLocaleDateString()} → {rec.endDate ? new Date(rec.endDate).toLocaleDateString() : "Ongoing"}
              </div>
            </div>

            <div style={styles.amount}>₹{rec.amount.toFixed(2)}</div>

            <div style={styles.actions}>
              <button
                onClick={() => handleToggle(rec._id, rec.active)}
                style={{ ...styles.btn, ...styles.toggleBtn }}
                title={rec.active ? "Disable" : "Enable"}
              >
                {rec.active ? "✓" : "○"}
              </button>
              <button
                onClick={() => onEdit(rec)}
                style={{ ...styles.btn, ...styles.editBtn }}
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(rec._id)}
                style={{ ...styles.btn, ...styles.deleteBtn }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  container: {
    marginTop: "2rem"
  },
  title: {
    fontSize: "1rem",
    fontWeight: 600,
    color: "var(--text)",
    marginBottom: "1rem"
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem"
  },
  item: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    background: "var(--surface-2)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius)",
    padding: "1rem",
    transition: "all 0.2s"
  },
  itemContent: {
    flex: 1
  },
  itemHeader: {
    display: "flex",
    gap: "0.75rem",
    marginBottom: "0.3rem",
    alignItems: "center"
  },
  category: {
    fontSize: "0.85rem",
    fontWeight: 600,
    color: "var(--accent)",
    background: "var(--accent-soft)",
    padding: "0.2rem 0.6rem",
    borderRadius: "4px"
  },
  frequency: {
    fontSize: "0.75rem",
    color: "var(--muted)",
    textTransform: "capitalize",
    fontWeight: 400
  },
  description: {
    fontSize: "0.9rem",
    color: "var(--text)"
  },
  dateRange: {
    fontSize: "0.75rem",
    color: "var(--muted)",
    marginTop: "0.25rem"
  },
  amount: {
    fontSize: "1.1rem",
    fontWeight: 600,
    color: "var(--accent)",
    minWidth: "80px",
    textAlign: "right",
    fontVariantNumeric: "tabular-nums"
  },
  actions: {
    display: "flex",
    gap: "0.5rem"
  },
  btn: {
    padding: "0.5rem 0.75rem",
    border: "1px solid var(--border)",
    borderRadius: "6px",
    background: "var(--surface)",
    color: "var(--text)",
    cursor: "pointer",
    fontSize: "0.8rem",
    fontWeight: 400,
    fontFamily: "inherit",
    transition: "all 0.2s"
  },
  toggleBtn: {
    color: "var(--success)",
    borderColor: "color-mix(in srgb, var(--success) 30%, transparent)"
  },
  editBtn: {
    color: "var(--accent)",
    borderColor: "color-mix(in srgb, var(--accent) 30%, transparent)"
  },
  deleteBtn: {
    color: "var(--danger)",
    borderColor: "color-mix(in srgb, var(--danger) 30%, transparent)"
  },
  loading: {
    textAlign: "center",
    color: "var(--muted)",
    padding: "2rem"
  },
  empty: {
    textAlign: "center",
    color: "var(--muted)",
    padding: "2rem",
    fontSize: "0.95rem"
  }
};

export default RecurringExpenseList;
