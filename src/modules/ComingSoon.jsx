export default function ComingSoon({ icon, title, desc, features = [] }) {
  return (
    <div style={{ background: "#fff", borderRadius: 20, padding: "52px 40px", textAlign: "center", border: "2px dashed #f1f5f9" }}>
      <div style={{ fontSize: 48, marginBottom: 14 }}>{icon}</div>
      <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 22, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 14, color: "#94a3b8", maxWidth: 380, margin: "0 auto", lineHeight: 1.7 }}>{desc}</div>
      {features.length > 0 && (
        <div style={{ marginTop: 24, display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
          {features.map((f, i) => (
            <span key={i} style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 20, padding: "5px 14px", fontSize: 12, color: "#92400e", fontWeight: 600 }}>
              {f}
            </span>
          ))}
        </div>
      )}
      <div style={{ marginTop: 24, display: "inline-block", background: "linear-gradient(135deg,#f59e0b22,#ef444422)", borderRadius: 12, padding: "8px 20px", fontSize: 12, color: "#92400e", fontWeight: 700 }}>
        🔧 In Development
      </div>
    </div>
  );
}
