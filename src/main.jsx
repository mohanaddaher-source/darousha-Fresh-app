import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

function showFatalError(message) {
  const root = document.getElementById("root");
  if (root) {
    root.innerHTML =
      '<div style="padding:24px;font-family:sans-serif;min-height:100vh;background:#fff;">' +
      '<h2 style="color:#123822;">Darousha Fresh hit an error before it could load</h2>' +
      '<p style="color:#333;">Please read or screenshot everything below and send it back:</p>' +
      '<pre style="white-space:pre-wrap;font-size:13px;background:#f7f1e4;padding:14px;border-radius:8px;border:1px solid #ebe1c9;color:#a83b32;">' +
      String(message).replace(/</g, "&lt;") +
      "</pre></div>";
  }
}
function describeError(e) {
  const parts = [];
  if (e && e.error) {
    parts.push(String(e.error.name || "") + ": " + String(e.error.message || ""));
    if (e.error.stack) parts.push(e.error.stack);
  } else if (e && e.reason) {
    parts.push("Unhandled promise rejection: " + (e.reason.stack || e.reason.message || String(e.reason)));
  } else if (e && e.message) {
    parts.push("message: " + e.message);
  }
  if (e && e.filename) parts.push(`at ${e.filename}:${e.lineno}:${e.colno}`);
  if (parts.length === 0) parts.push("(browser gave no further detail for this event, type: " + (e && e.type) + ")");
  return parts.join("\n");
}
window.addEventListener("error", (e) => showFatalError(describeError(e)));
window.addEventListener("unhandledrejection", (e) => showFatalError(describeError(e)));

try {
  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (err) {
  showFatalError(err && err.stack ? err.stack : String(err));
}
