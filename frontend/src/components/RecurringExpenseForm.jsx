import { useState, useEffect } from "react";
import API from "../api/axios";
import useToast from "../hooks/useToast";

const FREQUENCIES = ["daily", "weekly", "biweekly", "monthly", "quarterly", "yearly"];
const CATEGORIES = ["Food","Travel","Shopping","Entertainment","Health","Utilities","Education","Personal Care","Miscellaneous"];

const RecurringExpenseForm = ({ onCreated, editingRecurring, onCancelEdit }) => {
  const isEditing = !!editingRecurring;
  const toast = useToast();

  const [form, setForm] = useState({
    amount: "",
    category: "Food",
    description: "",
    frequency: "monthly",
    startDate: new Date().toISOString().split("T")[0],
    endDate: ""
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (editingRecurring) {
      setForm({
        amount: editingRecurring.amount,
        category: editingRecurring.category,
        description: editingRecurring.description || "",
        frequency: editingRecurring.frequency,
        startDate: new Date(editingRecurring.startDate).toISOString().split("T")[0],
        endDate: editingRecurring.endDate ? new Date(editingRecurring.endDate).toISOString().split("T")[0] : ""
      });
    }
  }, [editingRecurring]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.amount || Number(form.amount) <= 0) {
      setError("Enter a valid amount");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        amount: Number(form.amount)
      };

      if (isEditing) {
        await API.put(`/recurring/${editingRecurring._id}`, payload);
        toast.showSuccess("Recurring expense updated!");
      } else {
        await API.post("/recurring", payload);
        toast.showSuccess(`Recurring expense created: ₹${form.amount} every ${form.frequency}`);
      }

      setForm({
        amount: "",
        category: "Food",
        description: "",
        frequency: "monthly",
        startDate: new Date().toISOString().split("T")[0],
        endDate: ""
      });
      onCreated();
      if (onCancelEdit) onCancelEdit();
    } catch (err) {
      const errMsg = err.response?.data?.message || "Failed to save recurring expense";
      setError(errMsg);
      toast.showError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.card}>
      <h3 style={styles.title}>{isEditing ? "Edit Recurring Expense" : "Create Recurring Expense"}</h3>

      {error && <div style={styles.error}>{error}</div>}

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.grid}>
          <div>
            <label style={styles.label}>Amount</label>
            <input
              type="number"
              name="amount"
              placeholder="0.00"
              step="0.01"
              min="0"
              value={form.amount}
              onChange={handleChange}
              style={styles.input}
            />
          </div>

          <div>
            <label style={styles.label}>Category</label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              style={styles.select}
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={styles.label}>Frequency</label>
            <select
              name="frequency"
              value={form.frequency}
              onChange={handleChange}
              style={styles.select}
            >
              {FREQUENCIES.map(freq => (
                <option key={freq} value={freq}>{freq}</option>
              ))}
            </select>
          </div>

          <div style={{ gridColumn: "span 2" }}>
            <label style={styles.label}>Description</label>
            <input
              type="text"
              name="description"
              placeholder="Optional details..."
              value={form.description}
              onChange={handleChange}
              style={styles.input}
            />
          </div>

          <div>
            <label style={styles.label}>Start Date</label>
            <input
              type="date"
              name="startDate"
              value={form.startDate}
              onChange={handleChange}
              style={styles.input}
            />
          </div>

          <div>
            <label style={styles.label}>End Date (optional)</label>
            <input
              type="date"
              name="endDate"
              value={form.endDate}
              onChange={handleChange}
              style={styles.input}
            />
          </div>
        </div>

        <div style={styles.actions}>
          <button type="submit" style={styles.btn} disabled={loading}>
            {loading ? "Saving..." : (isEditing ? "Update" : "Create")}
          </button>
          {isEditing && (
            <button type="button" style={styles.cancelBtn} onClick={onCancelEdit}>
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

const styles = {
  card: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "12px",
    padding: "1.5rem",
    marginBottom: "1.5rem"
  },
  title: {
    fontSize: "1.1rem",
    fontWeight: 600,
    color: "var(--text)",
    margin: "0 0 1rem 0"
  },
  error: {
    background: "rgba(220, 38, 38, 0.1)",
    border: "1px solid rgba(220, 38, 38, 0.3)",
    color: "var(--danger)",
    padding: "0.75rem",
    borderRadius: "8px",
    marginBottom: "1rem",
    fontSize: "0.9rem"
  },
  form: {
    display: "flex",
    flexDirection: "column"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "1rem",
    marginBottom: "1rem"
  },
  label: {
    fontSize: "0.8rem",
    fontWeight: 600,
    color: "var(--muted)",
    marginBottom: "0.4rem",
    display: "block",
    textTransform: "uppercase",
    letterSpacing: "0.5px"
  },
  input: {
    width: "100%",
    padding: "0.6rem",
    background: "var(--surface-2)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    color: "var(--text)",
    fontFamily: "inherit",
    fontSize: "0.9rem",
    boxSizing: "border-box"
  },
  select: {
    width: "100%",
    padding: "0.6rem",
    background: "var(--surface-2)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    color: "var(--text)",
    fontFamily: "inherit",
    fontSize: "0.9rem",
    cursor: "pointer",
    boxSizing: "border-box"
  },
  actions: {
    display: "flex",
    gap: "0.75rem"
  },
  btn: {
    flex: 1,
    padding: "0.75rem",
    background: "var(--accent)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: "0.95rem"
  },
  cancelBtn: {
    padding: "0.75rem 1.5rem",
    background: "transparent",
    color: "var(--muted)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: "0.95rem"
  }
};

export default RecurringExpenseForm;
