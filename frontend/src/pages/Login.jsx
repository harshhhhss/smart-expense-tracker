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
          <div style={styles.logoIcon}>ET</div>
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
    background: "radial-gradient(circle at 60% 20%, rgba(108,99,255,0.12), transparent 35%), var(--bg)",
  },
  box: {
    background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "20px",
    padding: "2.5rem", width: "100%", maxWidth: "420px",
    boxShadow: "var(--card-shadow)",
  },
  logo: { textAlign: "center", marginBottom: "2rem" },
  logoIcon: {
    fontSize: "2.5rem",
    fontWeight: 700,
    color: "var(--accent)",
    background: "var(--surface)",
    border: "2px solid var(--accent)",
    borderRadius: "50%",
    width: "4rem",
    height: "4rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "0.5rem",
    boxShadow: "0 4px 12px rgba(108, 99, 255, 0.3)"
  },
  logoTitle: {
    fontSize: "1.6rem", fontWeight: 700, margin: 0,
    background: "linear-gradient(135deg, #6c63ff, #ff6584)",
    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
  },
  logoSub: { color: "var(--muted)", fontSize: "0.88rem", marginTop: "0.3rem" },
  error: {
    background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
    color: "var(--danger)", padding: "0.7rem 1rem", borderRadius: "8px",
    marginBottom: "1rem", fontSize: "0.88rem",
  },
  group: { marginBottom: "1.1rem" },
  label: { display: "block", fontSize: "0.82rem", color: "var(--muted)", fontWeight: 500, marginBottom: "0.4rem" },
  input: {
    width: "100%", padding: "0.75rem 1rem",
    background: "var(--surface-2)", border: "1px solid var(--border)",
    borderRadius: "10px", color: "var(--text)",
    fontFamily: "inherit", fontSize: "0.95rem", outline: "none", boxSizing: "border-box",
  },
  btn: {
    width: "100%", padding: "0.85rem", border: "none", borderRadius: "10px",
    background: "linear-gradient(135deg, #6c63ff, #8b5cf6)",
    color: "white", fontFamily: "inherit", fontSize: "1rem",
    fontWeight: 600, cursor: "pointer", marginTop: "0.5rem",
  },
  switch: { textAlign: "center", marginTop: "1.5rem", color: "var(--muted)", fontSize: "0.88rem" },
  link: { color: "var(--accent)", textDecoration: "none", fontWeight: 500 },
};

export default Login;