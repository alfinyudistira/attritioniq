import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorInfo: null, errorMsg: "" };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMsg: error.toString() };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo: errorInfo });
    console.error("🚨 Tertangkap Error Boundary:", error, errorInfo);
  }

  render() {
  if (this.state.hasError) {
    // Kalau parent pass custom fallback, pakai itu
    if (this.props.fallback) {
      return typeof this.props.fallback === "function"
        ? this.props.fallback(this.state.errorMsg, this.state.errorInfo)
        : this.props.fallback;
    }

    const {
      title   = "Something went wrong",
      message = "This section failed to load. The rest of the app is still running.",
      showDetails = true,
    } = this.props;

    return (
      <div style={{
        padding: "20px", background: "#fef2f2", color: "#dc2626",
        borderRadius: "12px", border: "1.5px solid #fecaca", margin: "10px 0"
      }}>
        <h3 style={{ fontSize: "16px", fontWeight: "bold", margin: "0 0 8px 0" }}>
          🚨 {title}
        </h3>
        <p style={{ fontSize: "13px", margin: "0 0 12px 0", color: "#991b1b" }}>
          {message}
        </p>
        {showDetails && (
          <details style={{
            background: "#fff", padding: "10px",
            borderRadius: "8px", border: "1px solid #fca5a5"
          }}>
            <summary style={{ cursor: "pointer", fontSize: "12px", fontWeight: "bold" }}>
              View Error Details
            </summary>
            <div style={{
              marginTop: "10px", fontSize: "11px", fontFamily: "monospace",
              whiteSpace: "pre-wrap", color: "#7f1d1d",
              maxHeight: "200px", overflow: "auto"
            }}>
              <strong>Error:</strong> {this.state.errorMsg}
              {"\n\n"}
              <strong>Stack:</strong>
              {this.state.errorInfo?.componentStack}
            </div>
          </details>
        )}
        {this.props.onReset && (
          <button
            onClick={() => {
              this.setState({ hasError: false, errorMsg: "", errorInfo: null });
              this.props.onReset?.();
            }}
            style={{
              marginTop: "12px", padding: "8px 16px", background: "#ef4444",
              color: "#fff", border: "none", borderRadius: "8px",
              fontSize: "12px", fontWeight: 700, cursor: "pointer",
            }}
          >
            Try Again
          </button>
        )}
      </div>
    );
  }
  return this.props.children;
}
  }
}

export default ErrorBoundary;
