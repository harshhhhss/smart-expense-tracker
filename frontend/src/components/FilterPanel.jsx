import { useState } from "react";

const CATEGORIES = [
  "All",
  "Food",
  "Transport",
  "Shopping",
  "Entertainment",
  "Bills",
  "Health",
  "Education",
  "Travel",
  "Utilities",
  "Personal Care",
  "Miscellaneous"
];

const FilterPanel = ({ onFiltersChange, isOpen, onToggle }) => {
  const [filters, setFilters] = useState({
    search: "",
    category: "All",
    startDate: "",
    endDate: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleReset = () => {
    const resetFilters = {
      search: "",
      category: "All",
      startDate: "",
      endDate: ""
    };
    setFilters(resetFilters);
    onFiltersChange(resetFilters);
  };

  return (
    <div style={styles.container}>
      <button style={styles.toggleBtn} onClick={onToggle}>
        {isOpen ? "Hide Filters" : "Show Filters"}
      </button>

      {isOpen && (
        <div style={styles.panel}>
          <div style={styles.grid}>
            {/* Search */}
            <div style={styles.field}>
              <label style={styles.label}>Search</label>
              <input
                type="text"
                name="search"
                placeholder="Description or amount..."
                value={filters.search}
                onChange={handleChange}
                style={styles.input}
              />
            </div>

            {/* Category */}
            <div style={styles.field}>
              <label style={styles.label}>Category</label>
              <select
                name="category"
                value={filters.category}
                onChange={handleChange}
                style={styles.select}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Start Date */}
            <div style={styles.field}>
              <label style={styles.label}>From</label>
              <input
                type="date"
                name="startDate"
                value={filters.startDate}
                onChange={handleChange}
                style={styles.input}
              />
            </div>

            {/* End Date */}
            <div style={styles.field}>
              <label style={styles.label}>To</label>
              <input
                type="date"
                name="endDate"
                value={filters.endDate}
                onChange={handleChange}
                style={styles.input}
              />
            </div>
          </div>

          <button style={styles.resetBtn} onClick={handleReset}>
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    marginBottom: "1.5rem",
    padding: "0.5rem"
  },
  toggleBtn: {
    width: "100%",
    padding: "0.75rem",
    background: "transparent",
    border: "none",
    color: "var(--accent)",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: "0.9rem",
    textAlign: "left",
    fontFamily: "inherit"
  },
  panel: {
    padding: "1rem",
    borderTop: "1px solid var(--border)"
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "1rem",
    marginBottom: "1rem"
  },
  field: {
    display: "flex",
    flexDirection: "column"
  },
  label: {
    fontSize: "0.8rem",
    fontWeight: 600,
    color: "var(--muted)",
    marginBottom: "0.4rem",
    textTransform: "uppercase",
    letterSpacing: "0.5px"
  },
  input: {
    padding: "0.6rem",
    background: "var(--surface-2)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    color: "var(--text)",
    fontFamily: "inherit",
    fontSize: "0.9rem"
  },
  select: {
    padding: "0.6rem",
    background: "var(--surface-2)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    color: "var(--text)",
    fontFamily: "inherit",
    fontSize: "0.9rem",
    cursor: "pointer"
  },
  resetBtn: {
    padding: "0.5rem 1rem",
    background: "transparent",
    border: "1px solid var(--border)",
    color: "var(--muted)",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "0.85rem",
    fontWeight: 500,
    fontFamily: "inherit",
    transition: "all 0.2s"
  }
};

export default FilterPanel;
