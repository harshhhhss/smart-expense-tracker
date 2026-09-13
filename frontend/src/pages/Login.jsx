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
          <p style={styles.logoSub}>Sign in to your account</p>
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
    background: "var(--bg)",
  },
  box: {
    background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)",
    padding: "2.5rem", width: "100%", maxWidth: "420px",
    boxShadow: "var(--card-shadow)",
  },
  logo: { textAlign: "center", marginBottom: "2rem" },
  logoIcon: {
    fontSize: "2.5rem",
    fontWeight: 600,
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
    boxShadow: "0 4px 12px color-mix(in srgb, var(--accent) 30%, transparent)"
  },
  logoTitle: {
    fontSize: "1.6rem", fontWeight: 600, margin: 0,
    color: "var(--text)", letterSpacing: "-0.02em",
  },
  logoSub: { color: "var(--muted)", fontSize: "0.88rem", marginTop: "0.3rem" },
  error: {
    background: "var(--danger-soft)", border: "1px solid color-mix(in srgb, var(--danger) 20%, transparent)",
    color: "var(--danger)", padding: "0.7rem 1rem", borderRadius: "8px",
    marginBottom: "1rem", fontSize: "0.88rem",
  },
  group: { marginBottom: "1.1rem" },
  label: { display: "block", fontSize: "0.82rem", color: "var(--muted)", fontWeight: 400, marginBottom: "0.4rem" },
  input: {
    width: "100%", padding: "0.75rem 1rem",
    background: "var(--surface-2)", border: "1px solid var(--border)",
    borderRadius: "var(--radius-sm)", color: "var(--text)",
    fontFamily: "inherit", fontSize: "0.95rem", outline: "none", boxSizing: "border-box",
  },
  btn: {
    width: "100%", padding: "0.85rem", border: "none", borderRadius: "var(--radius)",
    background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
    color: "var(--on-accent)", fontFamily: "inherit", fontSize: "1rem",
    fontWeight: 600, cursor: "pointer", marginTop: "0.5rem",
  },
  switch: { textAlign: "center", marginTop: "1.5rem", color: "var(--muted)", fontSize: "0.88rem" },
  link: { color: "var(--accent)", textDecoration: "none", fontWeight: 400 },
};

export default Login;