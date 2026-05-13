import { useContext } from "react";
import { ToastContext } from "../context/ToastContext";

const Toast = ({ id, message, type }) => {
  const { removeToast } = useContext(ToastContext);

  const typeConfig = {
    success: {
      bg: "rgba(5, 150, 105, 0.1)",
      border: "rgba(5, 150, 105, 0.3)",
      icon: "",
      color: "var(--success)"
    },
    error: {
      bg: "rgba(220, 38, 38, 0.1)",
      border: "rgba(220, 38, 38, 0.3)",
      icon: "",
      color: "var(--danger)"
    },
    warning: {
      bg: "rgba(217, 119, 6, 0.1)",
      border: "rgba(217, 119, 6, 0.3)",
      icon: "",
      color: "var(--warning)"
    },
    info: {
      bg: "rgba(124, 140, 255, 0.08)",
      border: "rgba(124, 140, 255, 0.24)",
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
    borderRadius: "8px",
    fontSize: "0.95rem",
    fontWeight: 500,
    boxShadow: "var(--card-shadow)",
    animation: "slideIn 0.3s ease",
    pointerEvents: "all"
  },
  icon: {
    fontWeight: 700,
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
