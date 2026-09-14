// src/components/TopBar.jsx
// Persistent chrome above the content area. The sidebar keeps primary
// navigation; this row carries search, alerts and identity -- the
// Salesforce/Zoho arrangement, where the left rail is for "where am I"
// and the top bar is for "who am I / find something / what needs me".
//
// alertCount is passed in by whichever page already derives it, so the
// bar never issues an API call of its own.

import { Link, useNavigate } from "react-router-dom";
import { Bell, LogOut, Search } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const TopBar = ({ alertCount = 0 }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const initial = user?.name?.charAt(0)?.toUpperCase() || "U";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header style={s.bar}>
      <div style={s.inner}>
        <label style={s.search}>
          <Search size={15} strokeWidth={1.9} style={s.searchIcon} aria-hidden="true" />
          <input
            id="global-search"
            type="search"
            placeholder="Search expenses, categories, groups"
            style={s.searchInput}
            aria-label="Search"
          />
        </label>

        <div style={s.actions}>
          <button
            type="button"
            onClick={toggleTheme}
            style={s.iconButton}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              {theme === "dark" ? (
                <path d="M20.2 15.5A8.2 8.2 0 0 1 8.5 3.8a8.7 8.7 0 1 0 11.7 11.7Z" />
              ) : (
                <>
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2.2M12 19.8V22M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M2 12h2.2M19.8 12H22M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6" />
                </>
              )}
            </svg>
          </button>

          <Link
            to="/notifications"
            style={s.iconButton}
            aria-label={alertCount > 0 ? `${alertCount} alerts` : "Alerts"}
            title="Alerts"
          >
            <Bell size={16} strokeWidth={1.9} aria-hidden="true" />
            {alertCount > 0 && (
              <span style={s.badge}>{alertCount > 9 ? "9+" : alertCount}</span>
            )}
          </Link>

          <div style={s.divider} aria-hidden="true" />

          <div style={s.user}>
            <span style={s.avatar} aria-hidden="true">{initial}</span>
            <span style={s.userName}>{user?.name || "Account"}</span>
          </div>

          <button type="button" onClick={handleLogout} style={s.iconButton} aria-label="Log out" title="Log out">
            <LogOut size={16} strokeWidth={1.9} aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
};

const s = {
  bar: {
    position: "fixed",
    top: 0,
    right: 0,
    left: "var(--app-sidebar-width)",
    height: "var(--app-topbar-height)",
    zIndex: 900,
    background: "var(--surface)",
    borderBottom: "1px solid var(--border)",
  },
  inner: {
    height: "100%",
    display: "flex",
    alignItems: "center",
    gap: "var(--space-4)",
    padding: "0 var(--space-4)",
  },
  search: {
    display: "flex",
    alignItems: "center",
    gap: "var(--space-2)",
    flex: 1,
    maxWidth: 420,
    height: 34,
    padding: "0 var(--space-3)",
    background: "var(--surface-2)",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)",
  },
  searchIcon: { color: "var(--muted)", flexShrink: 0 },
  searchInput: {
    flex: 1,
    minWidth: 0,
    background: "transparent",
    border: "none",
    outline: "none",
    color: "var(--text)",
    fontSize: "var(--text-sub)",
    fontFamily: "inherit",
  },
  actions: {
    display: "flex",
    alignItems: "center",
    gap: "var(--space-2)",
    marginLeft: "auto",
  },
  iconButton: {
    position: "relative",
    display: "grid",
    placeItems: "center",
    width: 32,
    height: 32,
    flexShrink: 0,
    borderRadius: "var(--radius-sm)",
    border: "1px solid transparent",
    background: "transparent",
    color: "var(--muted-strong)",
    cursor: "pointer",
    textDecoration: "none",
  },
  badge: {
    position: "absolute",
    top: 2,
    right: 1,
    minWidth: 15,
    height: 15,
    padding: "0 3px",
    display: "grid",
    placeItems: "center",
    borderRadius: "var(--radius-pill)",
    background: "var(--danger)",
    color: "var(--on-accent)",
    fontSize: 9,
    fontWeight: 700,
    lineHeight: 1,
  },
  divider: {
    width: 1,
    height: 20,
    background: "var(--border)",
    margin: "0 var(--space-1)",
  },
  user: {
    display: "flex",
    alignItems: "center",
    gap: "var(--space-2)",
    minWidth: 0,
  },
  avatar: {
    display: "grid",
    placeItems: "center",
    width: 26,
    height: 26,
    flexShrink: 0,
    borderRadius: "var(--radius-pill)",
    background: "var(--accent)",
    color: "var(--on-accent)",
    fontSize: "var(--text-label)",
    fontWeight: 700,
  },
  userName: {
    fontSize: "var(--text-sub)",
    fontWeight: 600,
    color: "var(--text)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
};

export default TopBar;
