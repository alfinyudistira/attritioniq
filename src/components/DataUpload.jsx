import { useRef, useState } from "react";
import { useApp, parseCSV, SAMPLE_DATA } from "../context/AppContext";

const CSV_TEMPLATE = `EmployeeID,FirstName,LastName,Department,MonthlySalary,OvertimeStatus,JobSatisfaction,AttritionStatus,YearsAtCompany,Age
E001,John,Doe,Sales,4500,Yes,3,Resigned,2.0,28
E002,Jane,Smith,HR,5200,No,8,Active,4.0,35`;

export default function DataUpload() {
  const { data, setData, company } = useApp();
  const [dragging, setDragging] = useState(false);
  const [msg, setMsg] = useState("");
  const fileRef = useRef();

  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = parseCSV(e.target.result);
        if (parsed.length === 0) {
          setMsg("❌ No valid rows found. Check your CSV format.");
          return;
        }
        setData(parsed);
        setMsg(`✅ ${parsed.length} employees loaded — synced across all modules`);
      } catch {
        setMsg("❌ Parse error. Please use the template format.");
      }
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "attritioniq_template.csv";
    a.click();
  };

  return (
    <div style={{
      background: "#fff", borderRadius: 14, padding: "18px 20px",
      border: "1.5px solid #f1f5f9", boxShadow: "0 2px 12px rgba(15,23,42,0.05)",
      marginBottom: 20,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>📂 Data Source</div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
            {data.length > 0
              ? `${data.length} employees loaded · auto-synced across all 9 modules`
              : "Upload your HR CSV or use sample data to explore"}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={downloadTemplate}
            style={{ padding: "7px 13px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#f8fafc", fontSize: 12, color: "#475569", cursor: "pointer", fontWeight: 600 }}
          >
            ⬇ Template
          </button>
          <button
            onClick={() => { setData(SAMPLE_DATA); setMsg("✅ Sample data loaded — 50 employees from Pulse Digital"); }}
            style={{ padding: "7px 13px", borderRadius: 8, border: "1.5px solid #f59e0b", background: "#fffbeb", fontSize: 12, color: "#b45309", cursor: "pointer", fontWeight: 700 }}
          >
            Use Sample Data
          </button>
        </div>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
        onClick={() => fileRef.current.click()}
        style={{
          border: `2px dashed ${dragging ? "#f59e0b" : "#e2e8f0"}`,
          borderRadius: 10, padding: "18px 16px", textAlign: "center",
          cursor: "pointer", background: dragging ? "#fffbeb" : "#f8fafc",
          transition: "all 0.2s",
        }}
      >
        <div style={{ fontSize: 24, marginBottom: 4 }}>📊</div>
        <div style={{ fontSize: 13, color: "#64748b" }}>
          Drop CSV here or <span style={{ color: "#f59e0b", fontWeight: 700 }}>click to browse</span>
        </div>
        <div style={{ fontSize: 10, color: "#cbd5e1", marginTop: 3 }}>
          Required columns: EmployeeID · Department · MonthlySalary · OvertimeStatus · JobSatisfaction · AttritionStatus · YearsAtCompany · Age
        </div>
        <input ref={fileRef} type="file" accept=".csv" style={{ display: "none" }} onChange={(e) => handleFile(e.target.files[0])} />
      </div>

      {msg && (
        <div style={{ marginTop: 8, fontSize: 12, color: msg.startsWith("✅") ? "#16a34a" : "#dc2626", fontWeight: 600 }}>
          {msg}
        </div>
      )}
    </div>
  );
}
