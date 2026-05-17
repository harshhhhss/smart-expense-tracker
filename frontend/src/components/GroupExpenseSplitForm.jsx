import { useState, useEffect } from "react";
import API from "../api/axios";
import useToast from "../hooks/useToast";

const CATEGORIES = ["Food", "Transport", "Shopping", "Entertainment", "Bills", "Health", "Education", "Travel", "Utilities", "Personal Care", "Miscellaneous"];

const GroupExpenseSplitForm = ({ groupId, groupMembers, onExpenseAdded, onCancel }) => {
  const toast = useToast();

  const [form, setForm] = useState({
    description: "",
    amount: "",
    category: "Food",
    date: new Date().toISOString().split("T")[0],
    splitType: "equal"
  });

  const [customSplits, setCustomSplits] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Initialize custom splits
    const splits = {};
    groupMembers?.forEach(member => {
      splits[member._id] = Number((Number(form.amount) / (groupMembers?.length || 1)).toFixed(2)) || 0;
    });
    setCustomSplits(splits);
  }, [form.amount, groupMembers]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleCustomSplitChange = (memberId, value) => {
    setCustomSplits(prev => ({
      ...prev,
      [memberId]: Number(value) || 0
    }));
  };

  const validateSplits = () => {
    const total = Object.values(customSplits).reduce((a, b) => a + b, 0);
    const roundedTotal = Math.round(total * 100) / 100;
    const roundedAmount = Math.round(Number(form.amount) * 100) / 100;
    return Math.abs(roundedTotal - roundedAmount) < 0.01;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.description.trim()) {
      setError("Description is required");
      return;
    }

    if (!form.amount || Number(form.amount) <= 0) {
      setError("Enter a valid amount");
      return;
    }

    if (form.splitType === "custom" && !validateSplits()) {
      setError("Split amounts don't add up to total");
      return;
    }

    setLoading(true);
    try {
      await API.post(`/advanced/groups/${groupId}/expenses`, {
        description: form.description,
        amount: Number(form.amount),
        category: form.category,
        date: form.date,
        splitType: form.splitType,
        customSplits: form.splitType === "custom" ? customSplits : null
      });

      toast.showSuccess(`Expense added and split between ${groupMembers?.length} members`);
      setForm({
        description: "",
        amount: "",
        category: "Food",
        date: new Date().toISOString().split("T")[0],
        splitType: "equal"
      });
      onExpenseAdded();
    } catch (err) {
      const errMsg = err.response?.data?.message || "Failed to add expense";
      setError(errMsg);
      toast.showError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const totalSplitAmount = Object.values(customSplits).reduce((a, b) => a + b, 0);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>Split Expense</h3>
        <button style={styles.closeBtn} onClick={onCancel}>✕</button>
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.grid}>
          <div style={{ gridColumn: "span 2" }}>
            <label style={styles.label}>Description</label>
            <input
              type="text"
              name="description"
              placeholder="e.g., Dinner at restaurant"
              value={form.description}
              onChange={handleChange}
              style={styles.input}
            />
          </div>

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
            <label style={styles.label}>Date</label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              style={styles.input}
            />
          </div>

          <div>
            <label style={styles.label}>Split Type</label>
            <select
              name="splitType"
              value={form.splitType}
              onChange={handleChange}
              style={styles.select}
            >
              <option value="equal">Equal Split</option>
              <option value="custom">Custom Split</option>
            </select>
          </div>
        </div>

        {form.splitType === "custom" && groupMembers && (
          <div style={styles.splitsSection}>
            <h4 style={styles.splitsTitle}>Split Between Members</h4>
            <div style={styles.splitsList}>
              {groupMembers.map(member => (
                <div key={member._id} style={styles.splitItem}>
                  <span style={styles.memberName}>{member.name || member.email}</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    step="0.01"
                    value={customSplits[member._id] || 0}
                    onChange={(e) => handleCustomSplitChange(member._id, e.target.value)}
                    style={styles.splitInput}
                  />
                </div>
              ))}
            </div>
            <div style={styles.splitTotal}>
              <span>Total:</span>
              <span style={{ color: Math.abs(totalSplitAmount - Number(form.amount)) < 0.01 ? "var(--success)" : "var(--danger)" }}>
                ₹{totalSplitAmount.toFixed(2)} / ₹{form.amount}
              </span>
            </div>
          </div>
        )}

        {form.splitType === "equal" && form.amount && (
          <div style={styles.preview}>
            <span style={styles.previewLabel}>Each person pays:</span>
            <span style={styles.previewAmount}>₹{(Number(form.amount) / (groupMembers?.length || 1)).toFixed(2)}</span>
          </div>
        )}

        <div style={styles.actions}>
          <button type="submit" style={styles.submitBtn} disabled={loading}>
            {loading ? "Adding..." : "Add & Split"}
          </button>
          <button type="button" style={styles.cancelBtn} onClick={onCancel}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

const styles = {
  container: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "12px",
    padding: "1.5rem",
    marginBottom: "1.5rem"
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1rem"
  },
  title: {
    fontSize: "1.1rem",
    fontWeight: 600,
    color: "var(--text)",
    margin: 0
  },
  closeBtn: {
    background: "transparent",
    border: "none",
    color: "var(--muted)",
    cursor: "pointer",
    fontSize: "1.2rem"
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
  splitsSection: {
    background: "var(--surface-2)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    padding: "1rem",
    marginBottom: "1rem"
  },
  splitsTitle: {
    fontSize: "0.9rem",
    fontWeight: 600,
    color: "var(--text)",
    margin: "0 0 0.75rem 0"
  },
  splitsList: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    marginBottom: "0.75rem"
  },
  splitItem: {
    display: "flex",
    gap: "0.75rem",
    alignItems: "center"
  },
  memberName: {
    flex: 1,
    fontSize: "0.9rem",
    color: "var(--text)"
  },
  splitInput: {
    width: "100px",
    padding: "0.4rem",
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "6px",
    color: "var(--text)",
    fontFamily: "inherit",
    fontSize: "0.85rem"
  },
  splitTotal: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: "0.9rem",
    fontWeight: 600,
    color: "var(--text)",
    paddingTop: "0.75rem",
    borderTop: "1px solid var(--border)"
  },
  preview: {
    background: "rgba(108, 99, 255, 0.08)",
    border: "1px solid rgba(108, 99, 255, 0.2)",
    borderRadius: "8px",
    padding: "0.75rem 1rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "1rem"
  },
  previewLabel: {
    fontSize: "0.9rem",
    color: "var(--muted)"
  },
  previewAmount: {
    fontSize: "1rem",
    fontWeight: 700,
    color: "var(--accent)"
  },
  actions: {
    display: "flex",
    gap: "0.75rem"
  },
  submitBtn: {
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

export default GroupExpenseSplitForm;
