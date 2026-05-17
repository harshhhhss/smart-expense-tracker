import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useState } from "react";
import "./Navbar.css";

const SunIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="theme-icon theme-icon-sun">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2.2M12 19.8V22M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M2 12h2.2M19.8 12H22M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6" />
  </svg>
);

const MoonIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="theme-icon theme-icon-moon">
    <path d="M20.2 15.5A8.2 8.2 0 0 1 8.5 3.8a8.7 8.7 0 1 0 11.7 11.7Z" />
  </svg>
);

const DashboardIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="nav-icon">
    <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h5v6h-6v-4.5ZM13.5 4h5A1.5 1.5 0 0 1 20 5.5v3h-6.5V4ZM4 13h6.5v7h-5A1.5 1.5 0 0 1 4 18.5V13ZM13.5 11.5H20v7a1.5 1.5 0 0 1-1.5 1.5h-5v-8.5Z" />
  </svg>
);

const GroupsIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="nav-icon">
    <path d="M16 11a4 4 0 1 0-8 0M4.5 20a7.5 7.5 0 0 1 15 0M18.5 10.5a3 3 0 0 1 2.6 4.5M5.5 10.5A3 3 0 0 0 2.9 15" />
  </svg>
);

const AnalyticsIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="nav-icon">
    <path d="M4 19V5M4 19h16M8 15v-4M12 15V8M16 15v-7M20 15v-3" />
  </svg>
);

const NotificationsIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="nav-icon">
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
    <path d="M10 19a2 2 0 0 0 4 0" />
  </svg>
);

const LogoutIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="nav-icon">
    <path d="M10 6H6.5A1.5 1.5 0 0 0 5 7.5v9A1.5 1.5 0 0 0 6.5 18H10M14 8l4 4-4 4M18 12H9" />
  </svg>
);

const navItems = [
  { to: "/", label: "Dashboard", icon: <DashboardIcon /> },
  { to: "/groups", label: "Groups", icon: <GroupsIcon /> },
  { to: "/analytics", label: "Analytics", icon: <AnalyticsIcon /> },
  { to: "/notifications", label: "Notifications", icon: <NotificationsIcon /> },
];

const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="navbar" aria-label="Primary">
      <div className="navbar-container">
        <NavLink to="/" className="navbar-brand">
          ExpenseIQ
        </NavLink>
        
        {/* Mobile menu button */}
        <button className="navbar-menu-button" onClick={toggleMenu}>
          <span className="navbar-menu-icon">Menu</span>
        </button>

        {/* Desktop navigation */}
        <div className="navbar-nav-links">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) => `navbar-link ${isActive ? "is-active" : ""}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </div>

        <div className="navbar-user-section">
          <div className="navbar-user-card">
            <span className="navbar-user-avatar">{user?.name?.charAt(0)?.toUpperCase() || "U"}</span>
            <span className="navbar-user">Welcome, {user?.name}</span>
          </div>
          <button
            className={`navbar-theme-toggle ${theme === "light" ? "is-light" : "is-dark"}`}
            onClick={toggleTheme}
            type="button"
            role="switch"
            aria-checked={theme === "dark"}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            <span className="theme-toggle-track">
              <span className="theme-toggle-thumb">
                {theme === "dark" ? <MoonIcon /> : <SunIcon />}
              </span>
            </span>
          </button>
          <button className="navbar-logout-btn" onClick={handleLogout}>
            <LogoutIcon />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="navbar-mobile-menu">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) => `navbar-mobile-link ${isActive ? "is-active" : ""}`}
              onClick={() => setIsMenuOpen(false)}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
          <div className="navbar-mobile-user">
            <button
              className={`navbar-theme-toggle-mobile ${theme === "light" ? "is-light" : "is-dark"}`}
              onClick={toggleTheme}
              type="button"
              role="switch"
              aria-checked={theme === "dark"}
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              <span className="theme-toggle-track">
                <span className="theme-toggle-thumb">
                  {theme === "dark" ? <MoonIcon /> : <SunIcon />}
                </span>
              </span>
            </button>
            <div className="navbar-user-card">
              <span className="navbar-user-avatar">{user?.name?.charAt(0)?.toUpperCase() || "U"}</span>
              <span className="navbar-user">Welcome, {user?.name}</span>
            </div>
            <button className="navbar-mobile-logout-btn" onClick={handleLogout}>
              <LogoutIcon />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
