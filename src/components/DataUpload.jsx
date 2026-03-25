import { useRef, useState, useCallback } from "react";
import { useApp, parseCSV, SAMPLE_DATA } from "../context/AppContext";

const CSV_TEMPLATE = `EmployeeID,FirstName,LastName,Department,MonthlySalary,OvertimeStatus,JobSatisfaction,AttritionStatus,YearsAtCompany,Age
E001,John,Doe,Sales,4500,Yes,3,Resigned,2.0,28
E002,Jane,Smith,HR,5200,No,8,Active,4.0,35`;

if (typeof document !== "undefined" && !document.head.querySelector("[data-upload-style]")) {
  const s = document.createElement("style");
  s.setAttribute("data-upload-style", "1");
  s.textContent = `
    @keyframes shimmer {
      0%   { transform: translateX(-100%); }
      100% { transform: translateX(250%); }
    }
    @keyframes uploadPulse {
      0%, 100% { opacity: 1; }
      50%       { opacity: 0.4; }
    }
  `;
  document.head.appendChild(s);
}

export default function DataUpload() {
  const { data, setData, pushNotification } = useApp();
  const [dragging, setDragging] = useState(false);
  const [msg, setMsg] = useState("");
  const [mappingInfo, setMappingInfo] = useState(null);
  const [fileInfo, setFileInfo] = useState(null);
  const [parsing, setParsing] = useState(false);
  const fileRef = useRef();

  const handleFile = useCallback((file) => {
    if (!file) return;

    // Guard: only accept CSV/plain text
    const isCSV = file.type === "text/csv"
      || file.type === "text/plain"
      || file.name.toLowerCase().endsWith(".csv")
      || file.name.toLowerCase().endsWith(".txt");

    if (!isCSV) {
      setMsg("❌ Only CSV files are supported. Please export your data as .csv first.");
      pushNotification("Unsupported file type — use CSV", "error");
      return;
    }

    // Guard: warn if file is suspiciously large (> 5MB = likely wrong file)
    if (file.size > 5 * 1024 * 1024) {
      setMsg("❌ File too large (max 5MB). For best performance, keep CSV under 5,000 rows.");
      pushNotification("File too large — max 5MB", "error");
      return;
    }

    setParsing(true);
    setMsg("");
    setMappingInfo(null);
    setFileInfo({
      name: file.name,
      size: (file.size / 1024).toFixed(1) + " KB",
    });

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const parsed = parseCSV(text);

        if (parsed.length === 0) {
          setMsg("❌ No valid rows found. Check that your CSV has an EmployeeID column (or similar).");
          setMappingInfo(null);
          setParsing(false);
          return;
        }

        const requiredCols = ["EmployeeID","FirstName","LastName","Department","MonthlySalary","OvertimeStatus","JobSatisfaction","AttritionStatus","YearsAtCompany","Age"];
        const foundCols = requiredCols.filter(c => parsed[0][c] !== undefined);
        const missingCols = requiredCols.filter(c => parsed[0][c] === undefined);

        // Smart suggestions for missing cols
        const suggestions = {
          EmployeeID: "Try: 'ID', 'NIK', 'NIP', 'EmpCode'",
          MonthlySalary: "Try: 'Salary', 'Gaji', 'Pay', 'Income'",
          OvertimeStatus: "Try: 'Overtime', 'OT', 'Lembur'",
          JobSatisfaction: "Try: 'Satisfaction', 'Score', 'Rating'",
          AttritionStatus: "Try: 'Status', 'Attrition', 'Employment Status'",
          YearsAtCompany: "Try: 'Tenure', 'Years', 'Masa Kerja'",
        };

        setData(parsed);
        setMsg(`✅ ${parsed.length} employees loaded — synced across all modules`);
        pushNotification(`${parsed.length} employees synced across all modules`, "success");
        setMappingInfo({
          found: foundCols.length,
          foundCols,
          missing: missingCols,
          total: requiredCols.length,
          suggestions,
        });
        setParsing(false);
      } catch (err) {
        const errMsg = err?.message ? `❌ Parse error: ${err.message}` : "❌ Parse error — check CSV encoding and format (UTF-8 recommended).";
        setMsg(errMsg);
        pushNotification("CSV parse failed — check file format", "error");
        setMappingInfo(null);
        setParsing(false);
      }
    };
    reader.readAsText(file);
  }, [setData, pushNotification]);

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "attritioniq_template.csv";
    a.click();
  };

  return (
    <div style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", border: "1.5px solid #f1f5f9", boxShadow: "0 2px 12px rgba(15,23,42,0.05)", marginBottom: 20 }}>
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
          <button onClick={downloadTemplate}
            style={{ padding: "7px 13px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#f8fafc", fontSize: 12, color: "#475569", cursor: "pointer", fontWeight: 600 }}>
            ⬇ Template
          </button>
          <button
            onClick={() => {
              setData(SAMPLE_DATA);
              setMsg(`✅ Sample data loaded — 50 employees from Pulse Digital`);
              setMappingInfo(null);
              pushNotification("Sample data loaded — 50 employees synced", "success");
            }}
            style={{ padding: "7px 13px", borderRadius: 8, border: "1.5px solid #f59e0b", background: "#fffbeb", fontSize: 12, color: "#b45309", cursor: "pointer", fontWeight: 700 }}>
            Use Sample Data
          </button>
          {data.length > 0 && (
            <button
              onClick={() => {
                setData([]);
                setMsg("");
                setMappingInfo(null);
                setFileInfo(null);
                pushNotification("Data cleared — workspace reset", "info");
              }}
              style={{ padding: "7px 13px", borderRadius: 8, border: "1.5px solid #fecaca", background: "#fef2f2", fontSize: 12, color: "#dc2626", cursor: "pointer", fontWeight: 600 }}>
              ✕ Clear
            </button>
          )}
        </div>
      </div>

      <div
        onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
        onDragOver={(e) => { e.preventDefault(); }}
        onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setDragging(false); }}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
        onClick={() => fileRef.current.click()}
        style={{
          border: `2px dashed ${dragging ? "#f59e0b" : data.length > 0 ? "#bbf7d0" : "#e2e8f0"}`,
          borderRadius: 10, padding: "18px 16px", textAlign: "center", cursor: "pointer",
          background: dragging ? "#fffbeb" : data.length > 0 ? "#f0fdf4" : "#f8fafc",
          transition: "all 0.2s",
          transform: dragging ? "scale(1.01)" : "scale(1)",
        }}
      >
        <div style={{ fontSize: 24, marginBottom: 4 }}>
          {dragging ? "📥" : data.length > 0 ? "✅" : "📊"}
        </div>
        <div style={{ fontSize: 13, color: dragging ? "#b45309" : "#64748b", fontWeight: dragging ? 700 : 400 }}>
          {dragging
            ? "Release to upload"
            : data.length > 0
              ? `${data.length} employees loaded — drop new CSV to replace`
              : <>Drop CSV here or <span style={{ color: "#f59e0b", fontWeight: 700 }}>click to browse</span></>
          }
        </div>
        <div style={{ fontSize: 10, color: "#cbd5e1", marginTop: 3 }}>
          Flexible column mapping · bilingual (EN/ID) · extra columns ignored
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.txt"
          style={{ display: "none" }}
          onChange={(e) => {
            handleFile(e.target.files[0]);
            e.target.value = ""; 
          }}
        />
      </div>

      {/* Parsing indicator */}
      {parsing && (
        <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ flex: 1, height: 5, background: "#f1f5f9", borderRadius: 3, overflow: "hidden", position: "relative" }}>
            {/* Shimmer bar */}
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(90deg, #f1f5f9 0%, #f59e0b 40%, #ef4444 60%, #f1f5f9 100%)",
              animation: "shimmer 1.2s infinite linear",
              borderRadius: 3,
            }} />
          </div>
          <span style={{ fontSize: 11, color: "#94a3b8", animation: "uploadPulse 1.2s infinite" }}>
            Parsing...
          </span>
        </div>
      )}

      {/* File info */}
      {fileInfo && !parsing && (
        <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8, background: "#f8fafc", borderRadius: 8, padding: "6px 12px", border: "1px solid #e2e8f0" }}>
          <span style={{ fontSize: 14 }}>📄</span>
          <span style={{ fontSize: 11, color: "#475569", fontWeight: 600 }}>{fileInfo.name}</span>
          <span style={{ fontSize: 10, color: "#94a3b8", marginLeft: "auto" }}>{fileInfo.size}</span>
        </div>
      )}

      {/* Status message */}
      {msg && (
        <div style={{ marginTop: 6, fontSize: 12, color: msg.startsWith("✅") ? "#16a34a" : "#dc2626", fontWeight: 600 }}>
          {msg}
        </div>
      )}

      {/* Column mapping preview */}
      {mappingInfo && (
        <div style={{ marginTop: 10 }}>
          {/* Found columns */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 6 }}>
            {mappingInfo.foundCols.map(col => (
              <span key={col} style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a", borderRadius: 6, padding: "2px 8px", fontSize: 10, fontWeight: 700 }}>
                ✓ {col}
              </span>
            ))}
            {mappingInfo.missing.map(col => (
              <span key={col} style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", borderRadius: 6, padding: "2px 8px", fontSize: 10, fontWeight: 700 }}>
                ✗ {col}
              </span>
            ))}
          </div>

          {/* Missing col suggestions */}
          {mappingInfo.missing.length > 0 && (
            <div style={{ background: "#fffbeb", borderRadius: 8, padding: "10px 12px", border: "1px solid #fde68a" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#92400e", marginBottom: 6 }}>
                ⚠️ {mappingInfo.found}/{mappingInfo.total} columns matched — missing fields default to empty/zero
              </div>
              {mappingInfo.missing.map(col => mappingInfo.suggestions[col] && (
                <div key={col} style={{ fontSize: 10, color: "#78350f", marginBottom: 2 }}>
                  <strong>{col}:</strong> {mappingInfo.suggestions[col]}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
