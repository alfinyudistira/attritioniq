import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// --- TRIK DEBUGGING MOBILE ---
window.addEventListener("error", (e) => {
  alert(`BOM! Error: ${e.message} \nLokasi: baris ${e.lineno}`);
});
window.addEventListener("unhandledrejection", (e) => {
  alert(`BOM! Promise Error: ${e.reason}`);
});
// -----------------------------

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
