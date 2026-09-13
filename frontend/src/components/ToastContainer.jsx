import { useContext } from "react";
import { ToastContext } from "../context/ToastContext";

const Toast = ({ id, message, type }) => {
  const { removeToast } = useContext(ToastContext);

  const typeConfig = {
    success: {
      bg: "var(--success-soft)",
      border: "color-mix(in srgb, var(--success) 30%, transparent)",
      icon: "",
      color: "var(--success)"
    },
    error: {
      bg: "var(--danger-soft)",
      border: "color-mix(in srgb, var(--danger) 30%, transparent)",
      icon: "",
      color: "var(--danger)"
    },
    warning: {
      bg: "var(--warning-soft)",
      border: "color-mix(in srgb, var(--warning) 30%, transparent)",
      icon: "",
      color: "var(--warning)"
    },
    info: {
      bg: "var(--accent-soft)",
      border: "color-mix(in srgb, var(--accent) 24%, transparent)",
      icon: "",
      color: "var(--accent)"
    }
  };

  const config = typeConfig[type] || typeConfig.info;

  return (
    <div
      style={{
        ...styles.toast,
        background: config.bg,
        border: `1px solid ${config.border}`,
        color: "var(--text)"
      }}
    >
      {config.icon && <span style={{ ...styles.icon, color: config.color }}>{config.icon}</span>}
      <span style={styles.message}>{message}</span>
      <button
        onClick={() => removeToast(id)}
        style={styles.closeBtn}
      >
        x
      </button>
    </div>
  );
};

const ToastContainer = () => {
  const { toasts } = useContext(ToastContext);

  return (
    <div style={styles.container}>
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          id={toast.id}
          message={toast.message}
          type={toast.type}
        />
      ))}
    </div>
  );
};

const styles = {
  container: {
    position: "fixed",
    top: "1rem",
    right: "1rem",
    zIndex: 9999,
    maxWidth: "400px",
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    pointerEvents: "none"
  },
  toast: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    padding: "0.875rem 1rem",
    borderRadius: "var(--radius)",
    fontSize: "0.9rem",
    fontWeight: 400,
    boxShadow: "var(--card-shadow)",
    animation: "slideIn 0.3s ease",
    pointerEvents: "all"
  },
  icon: {
    fontWeight: 600,
    fontSize: "1.1rem",
    flexShrink: 0
  },
  message: {
    flex: 1
  },
  closeBtn: {
    background: "transparent",
    border: "none",
    color: "var(--muted)",
    cursor: "pointer",
    fontSize: "1rem",
    padding: "0.25rem",
    flexShrink: 0
  }
};

// Add animation to global styles
if (typeof document !== "undefined" && !document.getElementById("toast-animation")) {
  const style = document.createElement("style");
  style.id = "toast-animation";
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);
}

export default ToastContainer;
