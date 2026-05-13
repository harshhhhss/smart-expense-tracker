import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useState } from "react";
import "./Navbar.css";

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
            className="navbar-theme-toggle" 
            onClick={toggleTheme}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === "dark" ? "Light" : "Dark"}
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
              className="navbar-theme-toggle-mobile" 
              onClick={toggleTheme}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
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
