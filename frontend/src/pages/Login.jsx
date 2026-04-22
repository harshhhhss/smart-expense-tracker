// src/pages/Login.jsx
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

const Login = () => {
  const [form,    setForm]    = useState({ email: "", password: "" });
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.box}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>💰</div>
          <h1 style={styles.logoTitle}>ExpenseIQ</h1>
          <p style={styles.logoSub}>Smart expense tracking</p>
        </div>
        {error && <div style={styles.error}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div style={styles.group}>
            <label style={styles.label}>Email</label>
            <input style={styles.input} type="email" placeholder="you@email.com"
              value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
          </div>
          <div style={styles.group}>
            <label style={styles.label}>Password</label>
            <input style={styles.input} type="password" placeholder="••••••••"
              value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
          </div>
          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        <p style={styles.switch}>
          Don't have an account? <Link to="/signup" style={styles.link}>Sign up</Link>
        </p>
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
    background: "radial-gradient(ellipse at 60% 20%, #1a1560 0%, #0f1117 60%)",
  },
  box: {
    background: "#1a1d27", border: "1px solid #2a2d3e", borderRadius: "20px",
    padding: "2.5rem", width: "100%", maxWidth: "420px",
    boxShadow: "0 25px 60px rgba(0,0,0,0.4)",
  },
  logo: { textAlign: "center", marginBottom: "2rem" },
  logoIcon: { fontSize: "2.5rem", marginBottom: "0.5rem" },
  logoTitle: {
    fontSize: "1.6rem", fontWeight: 700, margin: 0,
    background: "linear-gradient(135deg, #6c63ff, #ff6584)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
  },
  logoSub: { color: "#8888aa", fontSize: "0.88rem", marginTop: "0.3rem" },
  error: {
    background: "rgba(255,101,132,0.1)", border: "1px solid rgba(255,101,132,0.3)",
    color: "#ff6584", padding: "0.7rem 1rem", borderRadius: "8px",
    marginBottom: "1rem", fontSize: "0.88rem",
  },
  group: { marginBottom: "1.1rem" },
  label: { display: "block", fontSize: "0.82rem", color: "#8888aa", fontWeight: 500, marginBottom: "0.4rem" },
  input: {
    width: "100%", padding: "0.75rem 1rem",
    background: "#222536", border: "1px solid #2a2d3e",
    borderRadius: "10px", color: "#e8e8f0",
    fontFamily: "inherit", fontSize: "0.95rem", outline: "none", boxSizing: "border-box",
  },
  btn: {
    width: "100%", padding: "0.85rem", border: "none", borderRadius: "10px",
    background: "linear-gradient(135deg, #6c63ff, #8b5cf6)",
    color: "white", fontFamily: "inherit", fontSize: "1rem",
    fontWeight: 600, cursor: "pointer", marginTop: "0.5rem",
  },
  switch: { textAlign: "center", marginTop: "1.5rem", color: "#8888aa", fontSize: "0.88rem" },
  link: { color: "#6c63ff", textDecoration: "none", fontWeight: 500 },
};

export default Login;