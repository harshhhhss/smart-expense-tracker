import { Link, useNavigate } from "react-router-dom";
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
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          ExpenseIQ
        </Link>
        
        {/* Mobile menu button */}
        <button className="navbar-menu-button" onClick={toggleMenu}>
          <span className="navbar-menu-icon">Menu</span>
        </button>

        {/* Desktop navigation */}
        <div className="navbar-nav-links">
          <Link to="/" className="navbar-link">
            Dashboard
          </Link>
          <Link to="/groups" className="navbar-link">
            Groups
          </Link>
          <Link to="/analytics" className="navbar-link">
            Analytics
          </Link>
        </div>

        <div className="navbar-user-section">
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
          <span className="navbar-user">Welcome, {user?.name}</span>
          <button className="navbar-logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="navbar-mobile-menu">
          <Link to="/" className="navbar-mobile-link" onClick={() => setIsMenuOpen(false)}>
            Dashboard
          </Link>
          <Link to="/groups" className="navbar-mobile-link" onClick={() => setIsMenuOpen(false)}>
            Groups
          </Link>
          <Link to="/analytics" className="navbar-mobile-link" onClick={() => setIsMenuOpen(false)}>
            Analytics
          </Link>
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
            <span className="navbar-user">Welcome, {user?.name}</span>
            <button className="navbar-mobile-logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
