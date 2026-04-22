// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// Global reset styles
const globalStyle = document.createElement("style");
globalStyle.textContent = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
    background: #0f1117;
    color: #e8e8f0;
    min-height: 100vh;
  }
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
  input, select, textarea, button { font-family: inherit; }
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: #1a1d27; }
  ::-webkit-scrollbar-thumb { background: #2a2d3e; border-radius: 3px; }
  @media (max-width: 768px) {
    .charts-row { grid-template-columns: 1fr !important; }
    .bottom-row { grid-template-columns: 1fr !important; }
  }
`;
document.head.appendChild(globalStyle);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);