import { useRef, useState, useCallback } from "react";
import { useApp, parseCSV, SAMPLE_DATA } from "../context/AppContext";
import { getMappingReport, validateMappedData } from "../utils/autoMapping";
import { SAMPLE_DATA_METADATA } from "../utils/sampleData";

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
  const { data, setData, pushNotification, setSampleDataFlag, isSampleData } = useApp();
  const [dragging, setDragging]     = useState(false);
  const [status, setStatus]         = useState(null); 
  const [mappingReport, setMappingReport]         = useState(null);
const [validation, setValidation]               = useState(null);
const [ambiguousQueue, setAmbiguousQueue]        = useState([]);
const [confirmedMappings, setConfirmedMappings] = useState({}); 
const [showAmbiguousModal, setShowAmbiguousModal] = useState(false);
const [pendingRows, setPendingRows]              = useState(null); 
  const [fileInfo, setFileInfo]     = useState(null);
  const [parsing, setParsing]       = useState(false);
  const [showConfirmSample, setShowConfirmSample] = useState(false);
  const fileRef = useRef();

  const handleFile = useCallback((file) => {
    if (!file) return;

    const isCSV = file.type === "text/csv"
      || file.type === "text/plain"
      || file.name.toLowerCase().endsWith(".csv")
      || file.name.toLowerCase().endsWith(".txt");

    if (!isCSV) {
      setStatus({ text: "Only CSV files are supported. Please export your data as .csv first.", type: "error" });
      pushNotification("Unsupported file type — use CSV", "error");
      return;
    }

    const MAX_SIZE_MB = 15;
if (file.size > MAX_SIZE_MB * 1024 * 1024) {
  setStatus({
    text: `File too large (max ${MAX_SIZE_MB}MB). For best performance, keep CSV under 50,000 rows.`,
    type: "error",
  });
  pushNotification(`File too large — max ${MAX_SIZE_MB}MB`, "error");
  return;
}
if (file.size > 5 * 1024 * 1024) {
  pushNotification("Large file detected — parsing may take a moment", "warning");
}

    setParsing(true);
    setStatus(null);
    setMappingReport(null);
    setValidation(null);
    setFileInfo({ name: file.name, size: (file.size / 1024).toFixed(1) + " KB" });

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text   = e.target.result;
        const parsed = parseCSV(text);
        if (parsed.length === 0) {
          setStatus({ text: "No valid rows found. Check that your CSV has an EmployeeID column (or similar).", type: "error" });
          setParsing(false);
          return;
        }

        const rawHeaders = Object.keys(parsed[0] || {});
        const report     = getMappingReport(rawHeaders);
        const validation = validateMappedData(parsed);

const FUZZY_CONFIDENCE_THRESHOLD = 0.80;
const columnsNeedingConfirmation = report.fuzzyMappings.filter(
  m => m.confidence < FUZZY_CONFIDENCE_THRESHOLD
);
if (columnsNeedingConfirmation.length > 0) {
  setPendingRows(parsed);
  setAmbiguousQueue(columnsNeedingConfirmation);
  setConfirmedMappings({});
  setShowAmbiguousModal(true);
  setMappingReport(report);
  setValidation(validateMappedData(parsed));
  setParsing(false);
  return;
}
setData(parsed, { isSample: false });
setSampleDataFlag(false);

        // ── Build status message ──
        const warnCount = validation.warnings.length;
        const errCount  = validation.errors.length;
        let statusText  = `${parsed.length} employees loaded — synced across all 9 modules`;
        let statusType  = "success";
        if (!report.isViable) {
          statusText = `Loaded with issues — missing required columns: ${report.missingRequired.join(", ")}`;
          statusType = "warning";
        } else if (errCount > 0) {
          statusText = `${parsed.length} employees loaded — ${errCount} data error(s) found`;
          statusType = "warning";
        } else if (warnCount > 0) {
          statusText = `${parsed.length} employees loaded — ${warnCount} data warning(s)`;
          statusType = "success";
        }

        setStatus({ text: statusText, type: statusType });
        setMappingReport(report);
        setValidation(validation);
        setParsing(false);

        pushNotification(
          `${parsed.length} employees synced · coverage ${report.coverageScore}%`,
          report.isViable ? "success" : "info"
        );

      } catch (err) {
        const msg = err?.message
          ? `Parse error: ${err.message}`
          : "Parse error — check CSV encoding and format (UTF-8 recommended).";
        setStatus({ text: msg, type: "error" });
        pushNotification("CSV parse failed — check file format", "error");
        setMappingReport(null);
        setValidation(null);
        setParsing(false);
      }
    };
    reader.onerror = () => {
      setStatus({ text: "Could not read file — check file permissions.", type: "error" });
      setParsing(false);
    };
    reader.readAsText(file, "UTF-8");
  }, [setData, setSampleDataFlag, pushNotification]);

  const downloadTemplate = useCallback(() => {
    const BOM  = "\uFEFF"; // UTF-8 BOM for Excel compatibility
    const blob = new Blob([BOM + CSV_TEMPLATE], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = "attritioniq_template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url); // prevent memory leak
  }, []);

  // ── Load sample data — asks for confirmation if data already exists ──
  const handleLoadSample = useCallback(() => {
    if (data.length > 0) {
      setShowConfirmSample(true);
    } else {
      _doLoadSample();
    }
  }, [data.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const _doLoadSample = useCallback(() => {
    setData(SAMPLE_DATA);
    setSampleDataFlag(true);
    setStatus({ text: `Sample data loaded — ${SAMPLE_DATA_METADATA.totalRows} employees from "${SAMPLE_DATA_METADATA.name}"`, type: "success" });
    setMappingReport(null);
    setValidation(null);
    setFileInfo(null);
    setShowConfirmSample(false);
    pushNotification(`Sample data loaded — ${SAMPLE_DATA_METADATA.totalRows} employees synced`, "success");
  }, [setData, setSampleDataFlag, pushNotification]);

  // ── Clear all data ──
  const handleClear = useCallback(() => {
    setData([]);
    setSampleDataFlag(false);
    setStatus(null);
    setMappingReport(null);
    setValidation(null);
    setFileInfo(null);
    pushNotification("Data cleared — workspace reset", "info");
  }, [setData, setSampleDataFlag, pushNotification]);

  // ── Derived colors for status display ──
  const statusColor = status?.type === "success" ? "#16a34a"
    : status?.type === "error"   ? "#dc2626"
    : status?.type === "warning" ? "#b45309"
    : "#475569";
  const statusBg = status?.type === "success" ? "#f0fdf4"
    : status?.type === "error"   ? "#fef2f2"
    : status?.type === "warning" ? "#fffbeb"
    : "#f8fafc";
  const statusBorder = status?.type === "success" ? "#bbf7d0"
    : status?.type === "error"   ? "#fecaca"
    : status?.type === "warning" ? "#fde68a"
    : "#e2e8f0";

  return (
    <div style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", border: "1.5px solid #f1f5f9", boxShadow: "0 2px 12px rgba(15,23,42,0.05)", marginBottom: 20 }}>

      {/* ── Confirm Sample Override Modal ── */}
      {showConfirmSample && (
        <div
          role="dialog" aria-modal="true" aria-label="Confirm load sample data"
          onClick={() => setShowConfirmSample(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", backdropFilter: "blur(5px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3000, padding: 16 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: 16, padding: "28px 30px", maxWidth: 360, width: "100%", boxShadow: "0 20px 50px rgba(15,23,42,0.18)" }}
          >
            <div style={{ fontSize: 28, textAlign: "center", marginBottom: 10 }}>⚠️</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", textAlign: "center", marginBottom: 6 }}>Replace existing data?</div>
            <div style={{ fontSize: 12, color: "#64748b", textAlign: "center", lineHeight: 1.6, marginBottom: 20 }}>
              You have {data.length} employees loaded. Loading sample data will replace them. This cannot be undone.
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => setShowConfirmSample(false)}
                style={{ flex: 1, padding: "10px", borderRadius: 9, border: "1.5px solid #e2e8f0", background: "#f8fafc", color: "#475569", fontWeight: 700, cursor: "pointer", fontSize: 13 }}
              >Cancel</button>
              <button
                onClick={_doLoadSample}
                style={{ flex: 1, padding: "10px", borderRadius: 9, border: "none", background: "linear-gradient(135deg,#f59e0b,#ef4444)", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 13 }}
              >Yes, Load Sample</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Ambiguous Column Confirmation Modal ── */}
{showAmbiguousModal && ambiguousQueue.length > 0 && (
  <div
    role="dialog"
    aria-modal="true"
    aria-label="Confirm ambiguous column mappings"
    onClick={() => setShowAmbiguousModal(false)}
    style={{
      position: "fixed", inset: 0,
      background: "rgba(15,23,42,0.55)",
      backdropFilter: "blur(5px)",
      display: "flex", alignItems: "center",
      justifyContent: "center", zIndex: 3000, padding: 16,
    }}
  >
    <div
      onClick={e => e.stopPropagation()}
      style={{
        background: "#fff", borderRadius: 18,
        padding: "28px 30px", maxWidth: 480,
        width: "100%",
        boxShadow: "0 24px 60px rgba(15,23,42,0.2)",
      }}
    >
      <div style={{ fontSize: 24, marginBottom: 10 }}>🔍</div>
      <div style={{
        fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 6,
      }}>
        Confirm Column Mappings
      </div>
      <div style={{
        fontSize: 12, color: "#64748b", lineHeight: 1.6, marginBottom: 20,
      }}>
        These columns were auto-detected but need your confirmation.
        Select the correct field for each one.
      </div>

      {ambiguousQueue.map(m => (
        <div key={m.rawHeader} style={{ marginBottom: 14 }}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: "#475569",
            textTransform: "uppercase", letterSpacing: "0.06em",
            marginBottom: 6,
          }}>
            Your column: <span style={{ color: "#0f172a" }}>"{m.rawHeader}"</span>
            <span style={{
              marginLeft: 8, background: "#fffbeb",
              border: "1px solid #fde68a",
              borderRadius: 4, padding: "1px 6px",
              fontSize: 9, color: "#92400e",
            }}>
              {Math.round(m.confidence * 100)}% match
            </span>
          </div>
          <select
            value={confirmedMappings[m.rawHeader] ?? m.canonical}
            onChange={e => setConfirmedMappings(p => ({
              ...p, [m.rawHeader]: e.target.value,
            }))}
            style={{
              width: "100%", padding: "9px 12px", borderRadius: 9,
              border: "1.5px solid #e2e8f0", fontSize: 13,
              color: "#1e293b", background: "#f8fafc", cursor: "pointer",
            }}
          >
            <option value="">— Skip this column —</option>
            {["EmployeeID","FirstName","LastName","Department",
              "MonthlySalary","OvertimeStatus","JobSatisfaction",
              "AttritionStatus","YearsAtCompany","Age",
              "PerformanceScore","WorkModel","CommuteDistance",
              "Gender","JoinDate","EducationLevel",
            ].map(f => (
              <option key={f} value={f}>
                {f} {f === m.canonical ? "(auto-detected)" : ""}
              </option>
            ))}
          </select>
        </div>
      ))}

      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        <button
          onClick={() => {
            // User batalkan — commit tanpa re-mapping
            setShowAmbiguousModal(false);
            setData(pendingRows, { isSample: false });
            setSampleDataFlag(false);
            setPendingRows(null);
          }}
          style={{
            flex: 1, padding: "11px", borderRadius: 10,
            border: "1.5px solid #e2e8f0", background: "#f8fafc",
            color: "#475569", fontWeight: 700,
            cursor: "pointer", fontSize: 13,
          }}
        >
          Use Auto-Detection
        </button>
        <button
          onClick={() => {
            // Apply confirmed mappings ke pendingRows
            const remapped = (pendingRows || []).map(row => {
              const newRow = { ...row };
              ambiguousQueue.forEach(m => {
                const chosen = confirmedMappings[m.rawHeader];
                if (chosen && chosen !== m.canonical && row[m.canonical] !== undefined) {
                  newRow[chosen] = row[m.canonical];
                  if (chosen !== m.canonical) delete newRow[m.canonical];
                }
              });
              return newRow;
            });
            setData(remapped, { isSample: false });
            setSampleDataFlag(false);
            setShowAmbiguousModal(false);
            setPendingRows(null);
            pushNotification("Column mappings confirmed — data synced", "success");
          }}
          style={{
            flex: 1, padding: "11px", borderRadius: 10,
            border: "none",
            background: "linear-gradient(135deg,#f59e0b,#ef4444)",
            color: "#fff", fontWeight: 700,
            cursor: "pointer", fontSize: 13,
          }}
        >
          Confirm & Import
        </button>
      </div>
    </div>
  </div>
)}

      {/* ── Header row ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", display: "flex", alignItems: "center", gap: 7 }}>
            📂 Data Source
            {isSampleData && (
              <span style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 20, padding: "1px 8px", fontSize: 9, color: "#92400e", fontWeight: 700 }}>
                SAMPLE
              </span>
            )}
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
            {data.length > 0
              ? `${data.length} employees loaded · auto-synced across all 9 modules`
              : "Upload your HR CSV or use sample data to explore"}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            onClick={downloadTemplate}
            style={{ padding: "7px 13px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#f8fafc", fontSize: 12, color: "#475569", cursor: "pointer", fontWeight: 600 }}
          >⬇ Template</button>
          <button
            onClick={handleLoadSample}
            style={{ padding: "7px 13px", borderRadius: 8, border: "1.5px solid #f59e0b", background: "#fffbeb", fontSize: 12, color: "#b45309", cursor: "pointer", fontWeight: 700 }}
          >Use Sample Data</button>
          {data.length > 0 && (
  <button
    onClick={handleClear}
    title="Clear all data and reset workspace"
    style={{
      padding: "7px 13px", borderRadius: 8,
      border: "1.5px solid #fecaca", background: "#fef2f2",
      fontSize: 12, color: "#dc2626", cursor: "pointer", fontWeight: 600,
      display: "flex", alignItems: "center", gap: 5,
    }}
  >
    <span>✕</span>
    <span>
      {isSampleData ? "Clear Sample" : "Clear Data"}
    </span>
  </button>
)}
        </div>
      </div>

      {/* ── Drop zone ── */}
      <div
        role="button"
        aria-label="Upload CSV file — click or drag and drop"
        tabIndex={0}
        onKeyDown={e => { if (e.key === "Enter" || e.key === " ") fileRef.current?.click(); }}
        onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
        onDragOver={(e) => { e.preventDefault(); }}
        onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setDragging(false); }}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
        onClick={() => fileRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? "#f59e0b" : data.length > 0 ? "#bbf7d0" : "#e2e8f0"}`,
          borderRadius: 10, padding: "18px 16px", textAlign: "center", cursor: "pointer",
          background: dragging ? "#fffbeb" : data.length > 0 ? "#f0fdf4" : "#f8fafc",
          transition: "all 0.2s", transform: dragging ? "scale(1.01)" : "scale(1)",
          outline: "none",
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
              : <><span>Drop CSV here or </span><span style={{ color: "#f59e0b", fontWeight: 700 }}>click to browse</span></>
          }
        </div>
        <div style={{ fontSize: 10, color: "#cbd5e1", marginTop: 3 }}>
          Flexible column mapping · bilingual (EN/ID) · auto typo correction
        </div>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.txt"
          aria-hidden="true"
          style={{ display: "none" }}
          onChange={(e) => { handleFile(e.target.files[0]); e.target.value = ""; }}
        />
      </div>

      {/* ── Parsing shimmer ── */}
      {parsing && (
        <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ flex: 1, height: 5, background: "#f1f5f9", borderRadius: 3, overflow: "hidden", position: "relative" }}>
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,#f1f5f9 0%,#f59e0b 40%,#ef4444 60%,#f1f5f9 100%)", animation: "shimmer 1.2s infinite linear", borderRadius: 3 }} />
          </div>
          <span style={{ fontSize: 11, color: "#94a3b8", animation: "uploadPulse 1.2s infinite" }}>Parsing…</span>
        </div>
      )}

      {/* ── File info chip ── */}
      {fileInfo && !parsing && (
        <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8, background: "#f8fafc", borderRadius: 8, padding: "6px 12px", border: "1px solid #e2e8f0" }}>
          <span style={{ fontSize: 14 }}>📄</span>
          <span style={{ fontSize: 11, color: "#475569", fontWeight: 600 }}>{fileInfo.name}</span>
          <span style={{ fontSize: 10, color: "#94a3b8", marginLeft: "auto" }}>{fileInfo.size}</span>
        </div>
      )}

      {/* ── Status message ── */}
      {status && (
        <div style={{ marginTop: 8, background: statusBg, border: `1px solid ${statusBorder}`, borderRadius: 8, padding: "8px 12px", display: "flex", alignItems: "flex-start", gap: 8 }}>
          <span style={{ fontSize: 14, flexShrink: 0 }}>
            {status.type === "success" ? "✅" : status.type === "error" ? "❌" : "⚠️"}
          </span>
          <span style={{ fontSize: 12, color: statusColor, fontWeight: 600, lineHeight: 1.5 }}>{status.text}</span>
        </div>
      )}

      {/* ── Mapping report ── */}
      {mappingReport && !parsing && (
        <div style={{ marginTop: 10 }}>

          {/* Coverage score bar */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 10, color: "#64748b", fontWeight: 700, whiteSpace: "nowrap" }}>
              Schema Coverage
            </span>
            <div style={{ flex: 1, height: 6, background: "#f1f5f9", borderRadius: 3, overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 3,
                width: `${mappingReport.coverageScore}%`,
                background: mappingReport.coverageScore >= 80 ? "#22c55e" : mappingReport.coverageScore >= 50 ? "#f59e0b" : "#ef4444",
                transition: "width 0.4s ease",
              }} />
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, color: mappingReport.coverageScore >= 80 ? "#16a34a" : mappingReport.coverageScore >= 50 ? "#b45309" : "#dc2626", whiteSpace: "nowrap" }}>
              {mappingReport.coverageScore}%
            </span>
          </div>

          {/* Mapped columns chips */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 6 }}>
            {mappingReport.mapped.map(m => {
              const isFuzzy = m.method === "fuzzy";
              return (
                <span
                  key={m.canonical}
                  title={isFuzzy ? `"${m.rawHeader}" → ${m.canonical} (fuzzy match, ${Math.round(m.confidence * 100)}% confidence)` : `"${m.rawHeader}" → ${m.canonical}`}
                  style={{
                    background: isFuzzy ? "#fffbeb" : "#f0fdf4",
                    border: `1px solid ${isFuzzy ? "#fde68a" : "#bbf7d0"}`,
                    color: isFuzzy ? "#92400e" : "#16a34a",
                    borderRadius: 6, padding: "2px 8px", fontSize: 10, fontWeight: 700, cursor: "default",
                  }}
                >
                  {isFuzzy ? "~" : "✓"} {m.canonical}
                </span>
              );
            })}
            {mappingReport.missingRequired.map(col => (
              <span key={col} style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", borderRadius: 6, padding: "2px 8px", fontSize: 10, fontWeight: 700 }}>
                ✗ {col}
              </span>
            ))}
            {mappingReport.missingImportant.map(col => (
              <span key={col} style={{ background: "#fff7ed", border: "1px solid #fed7aa", color: "#c2410c", borderRadius: 6, padding: "2px 8px", fontSize: 10, fontWeight: 600 }}>
                △ {col}
              </span>
            ))}
          </div>

          {/* Legend */}
          <div style={{ display: "flex", gap: 12, marginBottom: 6, flexWrap: "wrap" }}>
            {[
              { symbol: "✓", color: "#16a34a", label: "exact match" },
              { symbol: "~", color: "#92400e", label: "fuzzy match" },
              { symbol: "△", color: "#c2410c", label: "important, missing" },
              { symbol: "✗", color: "#dc2626", label: "required, missing" },
            ].map(l => (
              <span key={l.label} style={{ fontSize: 9, color: l.color, display: "flex", alignItems: "center", gap: 3 }}>
                <strong>{l.symbol}</strong> {l.label}
              </span>
            ))}
          </div>

          {/* Fuzzy mapping explanation */}
          {mappingReport.fuzzyMappings.length > 0 && (
            <div style={{ background: "#fffbeb", borderRadius: 8, padding: "8px 12px", border: "1px solid #fde68a", marginBottom: 6 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#92400e", marginBottom: 4 }}>
                🔍 Fuzzy column matches — please verify:
              </div>
              {mappingReport.fuzzyMappings.map(m => (
                <div key={m.canonical} style={{ fontSize: 10, color: "#78350f", marginBottom: 2 }}>
                  "{m.rawHeader}" was interpreted as <strong>{m.canonical}</strong> ({Math.round(m.confidence * 100)}% confidence)
                </div>
              ))}
            </div>
          )}

          {/* Missing required cols with suggestions */}
          {mappingReport.missingRequired.length > 0 && (
            <div style={{ background: "#fef2f2", borderRadius: 8, padding: "8px 12px", border: "1px solid #fecaca", marginBottom: 6 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#dc2626", marginBottom: 4 }}>
                ❌ Required columns missing — analytics may not work:
              </div>
              {mappingReport.missingRequired.map(col => (
                <div key={col} style={{ fontSize: 10, color: "#991b1b", marginBottom: 2 }}>
                  <strong>{col}</strong> — not found in your CSV
                </div>
              ))}
            </div>
          )}

          {/* Data quality warnings */}
          {validation && validation.warnings.length > 0 && (
            <div style={{ background: "#fff7ed", borderRadius: 8, padding: "8px 12px", border: "1px solid #fed7aa" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#c2410c", marginBottom: 4 }}>
                ⚠️ Data quality warnings ({validation.warnings.length}):
              </div>
              {validation.warnings.map((w, i) => (
                <div key={i} style={{ fontSize: 10, color: "#9a3412", marginBottom: 2 }}>• {w}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
