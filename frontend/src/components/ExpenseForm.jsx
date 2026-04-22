// src/components/ExpenseForm.jsx
// Feature 3: Auto-detects category from description as you type

import { useState, useEffect, useRef } from "react";
import API from "../api/axios";

const CATEGORIES = ["Food","Travel","Shopping","Entertainment","Health","Utilities","Education","Personal Care","Other"];

const ExpenseForm = ({ onExpenseAdded, editingExpense, onCancelEdit }) => {
  const isEditing = !!editingExpense;

  const [form, setForm] = useState({
    amount: "",
    category: "Food",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });

  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const [autoTagged,   setAutoTagged]   = useState(false);   // was category auto-detected?
  const [detecting,    setDetecting]    = useState(false);   // debounce indicator
  const detectTimer = useRef(null);

  // Populate form when editing
  useEffect(() => {
    if (editingExpense) {
      setForm({
        amount:      editingExpense.amount,
        category:    editingExpense.category,
        description: editingExpense.description || "",
        date:        new Date(editingExpense.date).toISOString().split("T")[0],
      });
      setAutoTagged(false);
    }
  }, [editingExpense]);

  // FEATURE 3: Debounced auto-category detection as user types description
  const handleDescriptionChange = (e) => {
    const desc = e.target.value;
    setForm(prev => ({ ...prev, description: desc }));
    setAutoTagged(false);

    // Clear previous timer
    if (detectTimer.current) clearTimeout(detectTimer.current);

    if (desc.length < 3) return; // don't detect on very short input

    // Wait 600ms after user stops typing
    setDetecting(true);
    detectTimer.current = setTimeout(async () => {
      try {
        const { data } = await API.post("/expenses/detect-category", { description: desc });
        if (data.category && data.category !== "Other") {
          setForm(prev => ({ ...prev, category: data.category }));
          setAutoTagged(true);
        }
      } catch (_) {
        // silently fail — user can still pick manually
      } finally {
        setDetecting(false);
      }
    }, 600);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (name === "category") setAutoTagged(false); // user overrode auto-detect
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.amount || Number(form.amount) <= 0) return setError("Enter a valid amount");

    setLoading(true);
    try {
      if (isEditing) {
        await API.put(`/expenses/${editingExpense._id}`, { ...form, amount: Number(form.amount) });
      } else {
        await API.post("/expenses", { ...form, amount: Number(form.amount) });
      }
      // Reset form
      setForm({ amount: "", category: "Food", description: "", date: new Date().toISOString().split("T")[0] });
      setAutoTagged(false);
      onExpenseAdded();
      if (onCancelEdit) onCancelEdit();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save expense");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.card}>
      <h3 style={styles.cardTitle}>{isEditing ? "✏️ Edit Expense" : "➕ Add Expense"}</h3>

      {error && <div style={styles.error}>{error}</div>}

      <form onSubmit={handleSubmit}>
        {/* Amount */}
        <div style={styles.group}>
          <label style={styles.label}>Amount (₹)</label>
          <input
            style={styles.input}
            type="number"
            name="amount"
            placeholder="0.00"
            value={form.amount}
            onChange={handleChange}
            min="0.01"
            step="0.01"
            required
          />
        </div>

        {/* Description — triggers auto-detect */}
        <div style={styles.group}>
          <label style={styles.label}>
            Description
            {detecting && <span style={styles.detectingBadge}>detecting...</span>}
          </label>
          <input
            style={styles.input}
            type="text"
            name="description"
            placeholder="e.g. pizza with friends, uber to airport"
            value={form.description}
            onChange={handleDescriptionChange}
          />
          {autoTagged && (
            <div style={styles.autoTagHint}>
              ✨ Category auto-detected as <strong>{form.category}</strong>
            </div>
          )}
        </div>

        {/* Category — pre-filled by auto-detect */}
        <div style={styles.group}>
          <label style={styles.label}>Category</label>
          <select
            style={styles.input}
            name="category"
            value={form.category}
            onChange={handleChange}
          >
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Date */}
        <div style={styles.group}>
          <label style={styles.label}>Date</label>
          <input
            style={styles.input}
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            required
          />
        </div>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? "Saving..." : isEditing ? "Save Changes" : "Add Expense"}
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
    background: "#1a1d27",
    border: "1px solid #2a2d3e",
    borderRadius: "14px",
    padding: "1.5rem",
  },
  cardTitle: { fontSize: "1rem", fontWeight: 600, color: "#e8e8f0", marginBottom: "1.2rem", marginTop: 0 },
  group: { marginBottom: "1rem" },
  label: {
    display: "flex", alignItems: "center", gap: "0.5rem",
    fontSize: "0.82rem", color: "#8888aa", fontWeight: 500, marginBottom: "0.4rem"
  },
  input: {
    width: "100%", padding: "0.7rem 0.9rem",
    background: "#222536", border: "1px solid #2a2d3e",
    borderRadius: "10px", color: "#e8e8f0",
    fontFamily: "inherit", fontSize: "0.92rem", outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  },
  autoTagHint: {
    marginTop: "0.4rem", fontSize: "0.78rem",
    color: "#43e97b", background: "rgba(67,233,123,0.08)",
    border: "1px solid rgba(67,233,123,0.2)",
    borderRadius: "6px", padding: "0.3rem 0.6rem",
  },
  detectingBadge: {
    fontSize: "0.7rem", color: "#6c63ff",
    background: "rgba(108,99,255,0.1)", padding: "1px 6px",
    borderRadius: "10px", fontWeight: 500,
  },
  error: {
    background: "rgba(255,101,132,0.1)", border: "1px solid rgba(255,101,132,0.3)",
    color: "#ff6584", padding: "0.6rem 0.9rem", borderRadius: "8px",
    marginBottom: "1rem", fontSize: "0.85rem",
  },
  btn: {
    flex: 1, padding: "0.8rem", border: "none", borderRadius: "10px",
    background: "linear-gradient(135deg, #6c63ff, #8b5cf6)",
    color: "white", fontFamily: "inherit", fontSize: "0.95rem",
    fontWeight: 600, cursor: "pointer", transition: "opacity 0.2s",
  },
  cancelBtn: {
    padding: "0.8rem 1.2rem", border: "1px solid #2a2d3e",
    borderRadius: "10px", background: "transparent",
    color: "#8888aa", fontFamily: "inherit", fontSize: "0.9rem",
    cursor: "pointer",
  },
};

export default ExpenseForm;