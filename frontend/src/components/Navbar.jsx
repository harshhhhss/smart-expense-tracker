import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav style={styles.nav}>
      <Link to="/" style={styles.brand}>ExpenseIQ</Link>
      <div style={styles.right}>
        <Link to="/" style={styles.link}>Dashboard</Link>
        <Link to="/groups" style={styles.link}>Groups</Link>
        <span style={styles.user}>{user?.name}</span>
        <button style={styles.logoutBtn} onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
};

const styles = {
  nav: {
    background: "#1a1d27",
    borderBottom: "1px solid #2a2d3e",
    padding: "1rem 2rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    position: "sticky",
    top: 0,
    zIndex: 100,
    gap: "1rem",
    flexWrap: "wrap"
  },
  brand: {
    fontSize: "1.15rem",
    fontWeight: 700,
    background: "linear-gradient(135deg, #6c63ff, #ff6584)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    textDecoration: "none"
  },
  right: { display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" },
  link: { color: "#8888aa", fontSize: "0.88rem", textDecoration: "none" },
  user: { color: "#8888aa", fontSize: "0.88rem" },
  logoutBtn: {
    background: "transparent",
    border: "1px solid #2a2d3e",
    color: "#8888aa",
    padding: "0.35rem 0.9rem",
    borderRadius: "8px",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: "0.82rem"
  }
};

export default Navbar;
