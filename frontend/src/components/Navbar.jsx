// src/components/Navbar.jsx
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav style={styles.nav}>
      <div style={styles.brand}>💰 ExpenseIQ</div>
      <div style={styles.right}>
        <span style={styles.user}>👋 {user?.name}</span>
        <button style={styles.logoutBtn} onClick={() => { logout(); navigate("/login"); }}>
          Logout
        </button>
      </div>
    </nav>
  );
};

const styles = {
  nav: {
    background: "#1a1d27", borderBottom: "1px solid #2a2d3e",
    padding: "1rem 2rem", display: "flex",
    alignItems: "center", justifyContent: "space-between",
    position: "sticky", top: 0, zIndex: 100,
  },
  brand: {
    fontSize: "1.15rem", fontWeight: 700,
    background: "linear-gradient(135deg, #6c63ff, #ff6584)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
  },
  right: { display: "flex", alignItems: "center", gap: "1rem" },
  user: { color: "#8888aa", fontSize: "0.88rem" },
  logoutBtn: {
    background: "transparent", border: "1px solid #2a2d3e",
    color: "#8888aa", padding: "0.35rem 0.9rem", borderRadius: "8px",
    cursor: "pointer", fontFamily: "inherit", fontSize: "0.82rem",
    transition: "all 0.2s",
  },
};

export default Navbar;