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
      return (
        <div style={{ padding: "20px", background: "#fef2f2", color: "#dc2626", borderRadius: "12px", border: "1.5px solid #fecaca", margin: "10px 0" }}>
          <h3 style={{ fontSize: "16px", fontWeight: "bold", margin: "0 0 8px 0" }}>🚨 Ups! Ada masalah di bagian ini.</h3>
          <p style={{ fontSize: "13px", margin: "0 0 12px 0", color: "#991b1b" }}>Aplikasi utama tetap berjalan, tapi komponen ini gagal dimuat karena data tidak sesuai.</p>
          
          <details style={{ background: "#fff", padding: "10px", borderRadius: "8px", border: "1px solid #fca5a5" }}>
            <summary style={{ cursor: "pointer", fontSize: "12px", fontWeight: "bold", outline: "none" }}>Lihat Detail Error (Untuk Debugging)</summary>
            <div style={{ marginTop: "10px", fontSize: "11px", fontFamily: "monospace", whiteSpace: "pre-wrap", color: "#7f1d1d", maxHeight: "200px", overflow: "auto" }}>
              <strong>Pesan:</strong> {this.state.errorMsg}
              <br /><br />
              <strong>Lokasi:</strong>
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </div>
          </details>
        </div>
      );
    }
    return this.props.children; 
  }
}

export default ErrorBoundary;
