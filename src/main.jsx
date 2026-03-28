import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// ── Production-safe global error logger ────────────────────────────────────────
// Replaces the old alert()-based mobile debug trick.
// In development: logs to console with clear formatting.
// In production: silent (errors are caught by ErrorBoundary inside App).
// Never blocks the UI. Never shows alert().

const isDev = import.meta.env?.DEV ?? process.env.NODE_ENV === 'development';

window.addEventListener('error', (e) => {
  if (isDev) {
    console.error(
      `%c[AttritionIQ] Uncaught Error\n%c${e.message}\n%cLocation: ${e.filename}:${e.lineno}:${e.colno}`,
      'color:#ef4444;font-weight:700;font-size:13px',
      'color:#1e293b;font-size:12px',
      'color:#94a3b8;font-size:11px',
    );
  }
});

window.addEventListener('unhandledrejection', (e) => {
  if (isDev) {
    console.error(
      `%c[AttritionIQ] Unhandled Promise Rejection\n%c${String(e.reason)}`,
      'color:#ef4444;font-weight:700;font-size:13px',
      'color:#1e293b;font-size:12px',
    );
  }
  // Prevent the default browser behaviour of logging the error to console twice
  e.preventDefault();
});

// ── Root-level crash fallback ───────────────────────────────────────────────
// If <App /> itself fails to mount (before internal ErrorBoundary can catch),
// show a minimal recovery UI instead of a blank white screen.

function RootErrorFallback() {
  return React.createElement('div', {
    style: {
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#f8fafc',
      fontFamily: "'DM Sans','Segoe UI',sans-serif", padding: 24,
    }
  },
    React.createElement('div', {
      style: {
        background: '#fff', borderRadius: 18, padding: '40px 36px',
        maxWidth: 420, width: '100%', textAlign: 'center',
        boxShadow: '0 24px 60px rgba(15,23,42,0.12)',
        border: '1.5px solid #fecaca',
      }
    },
      React.createElement('div', { style: { fontSize: 40, marginBottom: 16 } }, '⚡'),
      React.createElement('div', {
        style: { fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 8 }
      }, 'AttritionIQ failed to load'),
      React.createElement('div', {
        style: { fontSize: 13, color: '#64748b', lineHeight: 1.6, marginBottom: 24 }
      }, 'Something went wrong at startup. This is usually caused by corrupted local storage data.'),
      React.createElement('button', {
        onClick: () => {
          try { localStorage.clear(); } catch {}
          window.location.reload();
        },
        style: {
          padding: '12px 24px', background: 'linear-gradient(135deg,#f59e0b,#ef4444)',
          color: '#fff', border: 'none', borderRadius: 12, fontSize: 14,
          fontWeight: 700, cursor: 'pointer',
        }
      }, 'Clear Storage & Reload'),
    )
  );
}

class RootErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { crashed: false, errorMsg: "", errorInfo: null };
  }
  static getDerivedStateFromError(error) {
    return { crashed: true, errorMsg: error.toString() };
  }
  componentDidCatch(error, info) {
    if (isDev) {
      console.error('[AttritionIQ] Root crash:', error, info);
    }
    this.setState({ errorInfo: info });
  }
  render() {
    if (this.state.crashed) {
      return React.createElement('div', {
        style: { minHeight: '100vh', padding: 20, background: '#fff' }
      },
        React.createElement('pre', {
          style: { whiteSpace: 'pre-wrap', fontSize: 12, color: 'red' }
        }, this.state.errorMsg + '\n\n' + (this.state.errorInfo?.componentStack || ''))
      );
    }
    return this.props.children;
  }
}

// ── Mount ───────────────────────────────────────────────────────────────────

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RootErrorBoundary>
      <App />
    </RootErrorBoundary>
  </React.StrictMode>,
);
