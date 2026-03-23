import { useState, useCallback, useMemo, createContext, useContext, useRef, useEffect } from "react";

// ============================================================
// GLOBAL DATA CONTEXT — single source of truth for all modules
// ============================================================
const AppContext = createContext(null);

const SAMPLE_DATA = [
  { EmployeeID:"E001", FirstName:"Alex", LastName:"Carter", Department:"Sales", MonthlySalary:4200, OvertimeStatus:"Yes", JobSatisfaction:2, AttritionStatus:"Resigned", YearsAtCompany:1.5, Age:27 },
  { EmployeeID:"E002", FirstName:"Sarah", LastName:"Miller", Department:"Sales", MonthlySalary:4900, OvertimeStatus:"Yes", JobSatisfaction:3, AttritionStatus:"Resigned", YearsAtCompany:3.0, Age:29 },
  { EmployeeID:"E003", FirstName:"James", LastName:"Wu", Department:"Sales", MonthlySalary:3800, OvertimeStatus:"Yes", JobSatisfaction:1, AttritionStatus:"Resigned", YearsAtCompany:0.5, Age:24 },
  { EmployeeID:"E004", FirstName:"Maya", LastName:"Patel", Department:"Sales", MonthlySalary:4500, OvertimeStatus:"Yes", JobSatisfaction:2, AttritionStatus:"Resigned", YearsAtCompany:2.0, Age:31 },
  { EmployeeID:"E005", FirstName:"Tom", LastName:"Reed", Department:"Sales", MonthlySalary:4100, OvertimeStatus:"Yes", JobSatisfaction:2, AttritionStatus:"Resigned", YearsAtCompany:1.0, Age:26 },
  { EmployeeID:"E006", FirstName:"Nina", LastName:"Brooks", Department:"Sales", MonthlySalary:4700, OvertimeStatus:"Yes", JobSatisfaction:3, AttritionStatus:"High Risk", YearsAtCompany:2.5, Age:33 },
  { EmployeeID:"E007", FirstName:"Chris", LastName:"Park", Department:"Sales", MonthlySalary:3900, OvertimeStatus:"Yes", JobSatisfaction:1, AttritionStatus:"Resigned", YearsAtCompany:0.8, Age:25 },
  { EmployeeID:"E008", FirstName:"Laura", LastName:"Singh", Department:"Sales", MonthlySalary:4300, OvertimeStatus:"Yes", JobSatisfaction:2, AttritionStatus:"Resigned", YearsAtCompany:1.5, Age:28 },
  { EmployeeID:"E009", FirstName:"Kevin", LastName:"Zhao", Department:"Sales", MonthlySalary:3800, OvertimeStatus:"Yes", JobSatisfaction:1, AttritionStatus:"Resigned", YearsAtCompany:0.3, Age:23 },
  { EmployeeID:"E010", FirstName:"Ella", LastName:"Turner", Department:"Sales", MonthlySalary:4600, OvertimeStatus:"Yes", JobSatisfaction:2, AttritionStatus:"Resigned", YearsAtCompany:2.0, Age:30 },
  { EmployeeID:"E011", FirstName:"Ben", LastName:"Adams", Department:"Sales", MonthlySalary:4200, OvertimeStatus:"Yes", JobSatisfaction:2, AttritionStatus:"Resigned", YearsAtCompany:1.2, Age:27 },
  { EmployeeID:"E012", FirstName:"Zara", LastName:"King", Department:"Sales", MonthlySalary:4800, OvertimeStatus:"Yes", JobSatisfaction:3, AttritionStatus:"Resigned", YearsAtCompany:3.0, Age:35 },
  { EmployeeID:"E013", FirstName:"Leo", LastName:"Chen", Department:"Technical Support", MonthlySalary:4000, OvertimeStatus:"Yes", JobSatisfaction:2, AttritionStatus:"Resigned", YearsAtCompany:1.0, Age:26 },
  { EmployeeID:"E014", FirstName:"Mia", LastName:"Evans", Department:"Technical Support", MonthlySalary:4600, OvertimeStatus:"Yes", JobSatisfaction:3, AttritionStatus:"Resigned", YearsAtCompany:2.0, Age:30 },
  { EmployeeID:"E015", FirstName:"Ryan", LastName:"Scott", Department:"Technical Support", MonthlySalary:3800, OvertimeStatus:"Yes", JobSatisfaction:1, AttritionStatus:"Resigned", YearsAtCompany:0.5, Age:24 },
  { EmployeeID:"E016", FirstName:"Ava", LastName:"Morris", Department:"Technical Support", MonthlySalary:4300, OvertimeStatus:"Yes", JobSatisfaction:2, AttritionStatus:"Resigned", YearsAtCompany:1.5, Age:28 },
  { EmployeeID:"E017", FirstName:"Jake", LastName:"Lewis", Department:"Technical Support", MonthlySalary:4100, OvertimeStatus:"Yes", JobSatisfaction:2, AttritionStatus:"Resigned", YearsAtCompany:1.0, Age:27 },
  { EmployeeID:"E018", FirstName:"Sofia", LastName:"Walker", Department:"Technical Support", MonthlySalary:4700, OvertimeStatus:"Yes", JobSatisfaction:3, AttritionStatus:"High Risk", YearsAtCompany:2.5, Age:32 },
  { EmployeeID:"E019", FirstName:"Ethan", LastName:"Hall", Department:"Technical Support", MonthlySalary:3900, OvertimeStatus:"Yes", JobSatisfaction:1, AttritionStatus:"Resigned", YearsAtCompany:0.8, Age:25 },
  { EmployeeID:"E020", FirstName:"Lily", LastName:"Young", Department:"Technical Support", MonthlySalary:4400, OvertimeStatus:"Yes", JobSatisfaction:2, AttritionStatus:"Resigned", YearsAtCompany:1.5, Age:29 },
  { EmployeeID:"E021", FirstName:"Tom", LastName:"Holland", Department:"IT", MonthlySalary:4200, OvertimeStatus:"Yes", JobSatisfaction:2, AttritionStatus:"Resigned", YearsAtCompany:1.5, Age:27 },
  { EmployeeID:"E022", FirstName:"Zendaya", LastName:"Coleman", Department:"IT", MonthlySalary:4000, OvertimeStatus:"Yes", JobSatisfaction:2, AttritionStatus:"Resigned", YearsAtCompany:1.0, Age:26 },
  { EmployeeID:"E023", FirstName:"Chris", LastName:"Evans", Department:"IT", MonthlySalary:4600, OvertimeStatus:"Yes", JobSatisfaction:3, AttritionStatus:"Resigned", YearsAtCompany:2.0, Age:30 },
  { EmployeeID:"E024", FirstName:"Robert", LastName:"Downey", Department:"IT", MonthlySalary:3800, OvertimeStatus:"Yes", JobSatisfaction:1, AttritionStatus:"Resigned", YearsAtCompany:1.0, Age:24 },
  { EmployeeID:"E025", FirstName:"Scarlett", LastName:"Jo", Department:"IT", MonthlySalary:4300, OvertimeStatus:"Yes", JobSatisfaction:2, AttritionStatus:"Resigned", YearsAtCompany:2.0, Age:29 },
  { EmployeeID:"E026", FirstName:"Chris", LastName:"Hemsworth", Department:"IT", MonthlySalary:4100, OvertimeStatus:"Yes", JobSatisfaction:2, AttritionStatus:"Resigned", YearsAtCompany:1.5, Age:28 },
  { EmployeeID:"E027", FirstName:"Mark", LastName:"Ruffalo", Department:"IT", MonthlySalary:4500, OvertimeStatus:"Yes", JobSatisfaction:3, AttritionStatus:"Resigned", YearsAtCompany:2.5, Age:31 },
  { EmployeeID:"E028", FirstName:"Risk", LastName:"User3", Department:"IT", MonthlySalary:4900, OvertimeStatus:"Yes", JobSatisfaction:4, AttritionStatus:"High Risk", YearsAtCompany:3.0, Age:33 },
  { EmployeeID:"E029", FirstName:"HR", LastName:"Admin1", Department:"HR", MonthlySalary:5100, OvertimeStatus:"No", JobSatisfaction:7, AttritionStatus:"Active", YearsAtCompany:3.0, Age:32 },
  { EmployeeID:"E030", FirstName:"HR", LastName:"Admin2", Department:"HR", MonthlySalary:5200, OvertimeStatus:"No", JobSatisfaction:8, AttritionStatus:"Active", YearsAtCompany:4.0, Age:36 },
  { EmployeeID:"E031", FirstName:"HR", LastName:"Admin3", Department:"HR", MonthlySalary:5000, OvertimeStatus:"No", JobSatisfaction:7, AttritionStatus:"Active", YearsAtCompany:3.0, Age:33 },
  { EmployeeID:"E032", FirstName:"HR", LastName:"Admin4", Department:"HR", MonthlySalary:5300, OvertimeStatus:"No", JobSatisfaction:8, AttritionStatus:"Active", YearsAtCompany:5.0, Age:38 },
  { EmployeeID:"E033", FirstName:"HR", LastName:"Admin5", Department:"HR", MonthlySalary:5100, OvertimeStatus:"No", JobSatisfaction:7, AttritionStatus:"Active", YearsAtCompany:3.0, Age:32 },
  { EmployeeID:"E034", FirstName:"Sales", LastName:"Active1", Department:"Sales", MonthlySalary:5200, OvertimeStatus:"No", JobSatisfaction:8, AttritionStatus:"Active", YearsAtCompany:4.0, Age:36 },
  { EmployeeID:"E035", FirstName:"Tech", LastName:"Active1", Department:"Technical Support", MonthlySalary:5100, OvertimeStatus:"No", JobSatisfaction:7, AttritionStatus:"Active", YearsAtCompany:3.5, Age:34 },
  { EmployeeID:"E036", FirstName:"Tech", LastName:"Active2", Department:"Technical Support", MonthlySalary:5300, OvertimeStatus:"No", JobSatisfaction:8, AttritionStatus:"Active", YearsAtCompany:4.0, Age:37 },
  { EmployeeID:"E037", FirstName:"IT", LastName:"Active1", Department:"IT", MonthlySalary:5000, OvertimeStatus:"No", JobSatisfaction:7, AttritionStatus:"Active", YearsAtCompany:3.0, Age:33 },
  { EmployeeID:"E038", FirstName:"IT", LastName:"Active2", Department:"IT", MonthlySalary:5200, OvertimeStatus:"No", JobSatisfaction:8, AttritionStatus:"Active", YearsAtCompany:4.0, Age:35 },
  { EmployeeID:"E039", FirstName:"HR", LastName:"Staff3", Department:"HR", MonthlySalary:5100, OvertimeStatus:"No", JobSatisfaction:7, AttritionStatus:"Active", YearsAtCompany:3.0, Age:32 },
  { EmployeeID:"E040", FirstName:"Sales", LastName:"Active2", Department:"Sales", MonthlySalary:5400, OvertimeStatus:"No", JobSatisfaction:8, AttritionStatus:"Active", YearsAtCompany:5.0, Age:38 },
  { EmployeeID:"E041", FirstName:"DM", LastName:"Kevin1", Department:"Digital Marketing", MonthlySalary:3800, OvertimeStatus:"Yes", JobSatisfaction:2, AttritionStatus:"Resigned", YearsAtCompany:0.3, Age:22 },
  { EmployeeID:"E042", FirstName:"DM", LastName:"Kevin2", Department:"Digital Marketing", MonthlySalary:3900, OvertimeStatus:"Yes", JobSatisfaction:1, AttritionStatus:"Resigned", YearsAtCompany:0.3, Age:23 },
  { EmployeeID:"E043", FirstName:"Risk", LastName:"User1", Department:"IT", MonthlySalary:4800, OvertimeStatus:"Yes", JobSatisfaction:4, AttritionStatus:"High Risk", YearsAtCompany:2.5, Age:30 },
  { EmployeeID:"E044", FirstName:"Sales", LastName:"Active3", Department:"Sales", MonthlySalary:5600, OvertimeStatus:"No", JobSatisfaction:9, AttritionStatus:"Active", YearsAtCompany:6.0, Age:38 },
  { EmployeeID:"E045", FirstName:"Tech", LastName:"Active3", Department:"Technical Support", MonthlySalary:5200, OvertimeStatus:"No", JobSatisfaction:8, AttritionStatus:"Active", YearsAtCompany:4.5, Age:36 },
  { EmployeeID:"E046", FirstName:"IT", LastName:"Active3", Department:"IT", MonthlySalary:5300, OvertimeStatus:"No", JobSatisfaction:7, AttritionStatus:"Active", YearsAtCompany:3.5, Age:34 },
  { EmployeeID:"E047", FirstName:"Sales", LastName:"Active4", Department:"Sales", MonthlySalary:5100, OvertimeStatus:"No", JobSatisfaction:7, AttritionStatus:"Active", YearsAtCompany:3.0, Age:33 },
  { EmployeeID:"E048", FirstName:"Tech", LastName:"Senior1", Department:"Technical Support", MonthlySalary:5400, OvertimeStatus:"No", JobSatisfaction:8, AttritionStatus:"Active", YearsAtCompany:5.0, Age:37 },
  { EmployeeID:"E049", FirstName:"DM", LastName:"Senior1", Department:"Digital Marketing", MonthlySalary:5100, OvertimeStatus:"No", JobSatisfaction:7, AttritionStatus:"Active", YearsAtCompany:3.0, Age:34 },
  { EmployeeID:"E050", FirstName:"IT", LastName:"Senior1", Department:"IT", MonthlySalary:5500, OvertimeStatus:"No", JobSatisfaction:9, AttritionStatus:"Active", YearsAtCompany:5.5, Age:38 },
];

const CSV_TEMPLATE = `EmployeeID,FirstName,LastName,Department,MonthlySalary,OvertimeStatus,JobSatisfaction,AttritionStatus,YearsAtCompany,Age
E001,John,Doe,Sales,4500,Yes,3,Resigned,2.0,28
E002,Jane,Smith,HR,5200,No,8,Active,4.0,35`;

function parseCSV(text) {
  const lines = text.trim().split("\n");
  const headers = lines[0].split(",").map(h => h.trim());
  return lines.slice(1).map(line => {
    const vals = line.split(",").map(v => v.trim());
    const obj = {};
    headers.forEach((h, i) => {
      const v = vals[i] ?? "";
      obj[h] = isNaN(v) || v === "" ? v : Number(v);
    });
    return obj;
  }).filter(r => r.EmployeeID);
}

function getGeneration(age) {
  if (age < 26) return "Gen Z";
  if (age <= 35) return "Millennial";
  return "Senior";
}

function getAttritionColor(status) {
  if (status === "Resigned") return "#ef4444";
  if (status === "High Risk") return "#f59e0b";
  return "#22c55e";
}

// ============================================================
// MINI SVG CHARTS (no external lib needed for crisp renders)
// ============================================================
function BarChart({ data, valueKey, labelKey, colorFn, height = 180 }) {
  const max = Math.max(...data.map(d => d[valueKey]), 1);
  const barW = Math.floor(280 / data.length) - 8;
  return (
    <svg width="100%" viewBox={`0 0 300 ${height}`} style={{ overflow: "visible" }}>
      {data.map((d, i) => {
        const bh = Math.max(4, (d[valueKey] / max) * (height - 40));
        const x = i * (300 / data.length) + 4;
        const y = height - 30 - bh;
        const color = colorFn ? colorFn(d) : "#f59e0b";
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={bh} rx={4} fill={color} opacity={0.9} />
            <text x={x + barW / 2} y={height - 14} textAnchor="middle" fontSize={9} fill="#94a3b8">
              {String(d[labelKey]).length > 8 ? String(d[labelKey]).slice(0, 7) + "…" : d[labelKey]}
            </text>
            <text x={x + barW / 2} y={y - 4} textAnchor="middle" fontSize={9} fill="#1e293b" fontWeight="600">
              {typeof d[valueKey] === "number" && d[valueKey] < 1 ? (d[valueKey] * 100).toFixed(0) + "%" : d[valueKey]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function DonutChart({ data, size = 140 }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  let cumAngle = -Math.PI / 2;
  const cx = size / 2, cy = size / 2, r = size * 0.38, innerR = size * 0.22;
  const slices = data.map(d => {
    const angle = (d.value / total) * 2 * Math.PI;
    const x1 = cx + r * Math.cos(cumAngle);
    const y1 = cy + r * Math.sin(cumAngle);
    cumAngle += angle;
    const x2 = cx + r * Math.cos(cumAngle);
    const y2 = cy + r * Math.sin(cumAngle);
    const ix1 = cx + innerR * Math.cos(cumAngle);
    const iy1 = cy + innerR * Math.sin(cumAngle);
    const ix2 = cx + innerR * Math.cos(cumAngle - angle);
    const iy2 = cy + innerR * Math.sin(cumAngle - angle);
    const lg = angle > Math.PI ? 1 : 0;
    return { path: `M${x1},${y1} A${r},${r} 0 ${lg} 1 ${x2},${y2} L${ix1},${iy1} A${innerR},${innerR} 0 ${lg} 0 ${ix2},${iy2} Z`, color: d.color, label: d.label, value: d.value, pct: ((d.value / total) * 100).toFixed(0) };
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {slices.map((s, i) => <path key={i} d={s.path} fill={s.color} opacity={0.9} />)}
      <text x={cx} y={cy + 1} textAnchor="middle" fontSize={size * 0.13} fontWeight="700" fill="#1e293b">{total}</text>
      <text x={cx} y={cy + size * 0.11} textAnchor="middle" fontSize={size * 0.08} fill="#64748b">total</text>
    </svg>
  );
}

function ScatterPlot({ data, width = 300, height = 160 }) {
  const maxS = Math.max(...data.map(d => d.MonthlySalary), 1);
  const minS = Math.min(...data.map(d => d.MonthlySalary));
  const pad = { l: 32, r: 16, t: 12, b: 28 };
  const W = width - pad.l - pad.r;
  const H = height - pad.t - pad.b;
  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`}>
      {/* axes */}
      <line x1={pad.l} y1={pad.t} x2={pad.l} y2={pad.t + H} stroke="#e2e8f0" strokeWidth={1} />
      <line x1={pad.l} y1={pad.t + H} x2={pad.l + W} y2={pad.t + H} stroke="#e2e8f0" strokeWidth={1} />
      {/* $5k cliff line */}
      {(() => {
        const cx = pad.l + ((5000 - minS) / (maxS - minS)) * W;
        return <line x1={cx} y1={pad.t} x2={cx} y2={pad.t + H} stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4,3" />;
      })()}
      <text x={pad.l + ((5000 - minS) / (maxS - minS)) * W + 3} y={pad.t + 10} fontSize={8} fill="#f59e0b">$5k cliff</text>
      {data.map((d, i) => {
        const x = pad.l + ((d.MonthlySalary - minS) / (maxS - minS)) * W;
        const y = pad.t + H - ((d.JobSatisfaction - 1) / 9) * H;
        return <circle key={i} cx={x} cy={y} r={4} fill={getAttritionColor(d.AttritionStatus)} opacity={0.75} />;
      })}
      <text x={pad.l - 8} y={pad.t + 4} fontSize={8} fill="#94a3b8" textAnchor="middle">10</text>
      <text x={pad.l - 8} y={pad.t + H} fontSize={8} fill="#94a3b8" textAnchor="middle">1</text>
      <text x={pad.l} y={pad.t + H + 16} fontSize={7} fill="#94a3b8">Salary →</text>
    </svg>
  );
}

// ============================================================
// COMPANY SETUP MODAL
// ============================================================
function CompanySetupModal({ onSave }) {
  const [form, setForm] = useState({ name: "", industry: "Manufacturing", currency: "USD", salaryCliff: 5000, replacementMultiplier: 1.5 });
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: "#fff", borderRadius: 20, padding: "40px 44px", width: 480, maxWidth: "95vw", boxShadow: "0 24px 80px rgba(15,23,42,0.18)", border: "1px solid #f1f5f9" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ width: 40, height: 40, background: "linear-gradient(135deg,#f59e0b,#ef4444)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 20 }}>🏢</span>
          </div>
          <div>
            <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 22, fontWeight: 700, color: "#0f172a" }}>Welcome to AttritionIQ</div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>Set up your workspace to get started</div>
          </div>
        </div>
        <div style={{ height: 1, background: "linear-gradient(90deg,#f59e0b33,transparent)", margin: "20px 0" }} />
        {[
          { label: "Company Name", key: "name", type: "text", placeholder: "e.g. Pulse Digital" },
          { label: "Industry", key: "industry", type: "select", opts: ["Manufacturing","Retail","Technology","Healthcare","Finance","Services","Other"] },
          { label: "Currency", key: "currency", type: "select", opts: ["USD","IDR","EUR","GBP","SGD"] },
          { label: "Salary Safety Cliff ($)", key: "salaryCliff", type: "number", placeholder: "5000" },
          { label: "Replacement Cost Multiplier (×salary)", key: "replacementMultiplier", type: "number", placeholder: "1.5" },
        ].map(f => (
          <div key={f.key} style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>{f.label}</label>
            {f.type === "select" ? (
              <select value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 14, color: "#1e293b", background: "#f8fafc", outline: "none" }}>
                {f.opts.map(o => <option key={o}>{o}</option>)}
              </select>
            ) : (
              <input type={f.type} value={form[f.key]} placeholder={f.placeholder}
                onChange={e => setForm(p => ({ ...p, [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value }))}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #e2e8f0", fontSize: 14, color: "#1e293b", background: "#f8fafc", outline: "none", boxSizing: "border-box" }} />
            )}
          </div>
        ))}
        <button onClick={() => form.name.trim() && onSave(form)}
          style={{ width: "100%", padding: "14px", background: "linear-gradient(135deg,#f59e0b,#ef4444)", color: "#fff", border: "none", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: "pointer", marginTop: 8, letterSpacing: "0.02em" }}>
          Launch AttritionIQ →
        </button>
        <p style={{ textAlign: "center", fontSize: 11, color: "#cbd5e1", marginTop: 12 }}>Your data never leaves your browser • 100% private</p>
      </div>
    </div>
  );
}

// ============================================================
// DATA UPLOAD PANEL
// ============================================================
function DataUploadPanel({ onData, currentCount }) {
  const [dragging, setDragging] = useState(false);
  const [msg, setMsg] = useState("");
  const fileRef = useRef();

  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const parsed = parseCSV(e.target.result);
        if (parsed.length === 0) { setMsg("❌ No valid rows found. Check your CSV format."); return; }
        onData(parsed);
        setMsg(`✅ ${parsed.length} employees loaded successfully!`);
      } catch { setMsg("❌ Parse error. Please use the template format."); }
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "attritioniq_template.csv"; a.click();
  };

  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: 24, border: "1.5px solid #f1f5f9", boxShadow: "0 2px 16px rgba(15,23,42,0.06)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>📂 Data Source</div>
          <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
            {currentCount > 0 ? `${currentCount} employees loaded • synced across all modules` : "Upload CSV or use sample data"}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={downloadTemplate} style={{ padding: "7px 14px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#f8fafc", fontSize: 12, color: "#475569", cursor: "pointer", fontWeight: 600 }}>⬇ Template</button>
          <button onClick={() => { onData(SAMPLE_DATA); setMsg(`✅ Sample data loaded — 50 employees`); }}
            style={{ padding: "7px 14px", borderRadius: 8, border: "1.5px solid #f59e0b", background: "#fffbeb", fontSize: 12, color: "#b45309", cursor: "pointer", fontWeight: 600 }}>Use Sample Data</button>
        </div>
      </div>
      <div onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
        onClick={() => fileRef.current.click()}
        style={{ border: `2px dashed ${dragging ? "#f59e0b" : "#e2e8f0"}`, borderRadius: 12, padding: "24px 16px", textAlign: "center", cursor: "pointer", background: dragging ? "#fffbeb" : "#f8fafc", transition: "all 0.2s" }}>
        <div style={{ fontSize: 28, marginBottom: 6 }}>📊</div>
        <div style={{ fontSize: 13, color: "#64748b" }}>Drop CSV here or <span style={{ color: "#f59e0b", fontWeight: 700 }}>click to browse</span></div>
        <div style={{ fontSize: 11, color: "#cbd5e1", marginTop: 4 }}>Columns: EmployeeID, Department, MonthlySalary, OvertimeStatus, JobSatisfaction, AttritionStatus, YearsAtCompany, Age</div>
        <input ref={fileRef} type="file" accept=".csv" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
      </div>
      {msg && <div style={{ marginTop: 10, fontSize: 12, color: msg.startsWith("✅") ? "#16a34a" : "#dc2626", fontWeight: 600 }}>{msg}</div>}
    </div>
  );
}

// ============================================================
// M1: ATTRITION DASHBOARD
// ============================================================
function M1Dashboard() {
  const { data, company } = useContext(AppContext);
  const [deptFilter, setDeptFilter] = useState("All");
  const [genFilter, setGenFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [otFilter, setOtFilter] = useState("All");

  const depts = useMemo(() => ["All", ...new Set(data.map(d => d.Department))], [data]);
  const gens = ["All", "Gen Z", "Millennial", "Senior"];
  const statuses = ["All", "Resigned", "Active", "High Risk"];

  const filtered = useMemo(() => data.filter(d => {
    if (deptFilter !== "All" && d.Department !== deptFilter) return false;
    if (genFilter !== "All" && getGeneration(d.Age) !== genFilter) return false;
    if (statusFilter !== "All" && d.AttritionStatus !== statusFilter) return false;
    if (otFilter !== "All" && d.OvertimeStatus !== otFilter) return false;
    return true;
  }), [data, deptFilter, genFilter, statusFilter, otFilter]);

  const total = filtered.length;
  const resigned = filtered.filter(d => d.AttritionStatus === "Resigned").length;
  const active = filtered.filter(d => d.AttritionStatus === "Active").length;
  const highRisk = filtered.filter(d => d.AttritionStatus === "High Risk").length;
  const flightRisk = total > 0 ? (((resigned + highRisk) / total) * 100).toFixed(1) : 0;
  const withOT = filtered.filter(d => d.OvertimeStatus === "Yes");
  const otAttrition = withOT.length > 0 ? ((withOT.filter(d => d.AttritionStatus === "Resigned").length / withOT.length) * 100).toFixed(1) : 0;
  const avgSalary = total > 0 ? Math.round(filtered.reduce((s, d) => s + (d.MonthlySalary || 0), 0) / total) : 0;
  const belowCliff = filtered.filter(d => d.MonthlySalary < (company.salaryCliff || 5000)).length;
  const turnoverCost = resigned * avgSalary * 12 * (company.replacementMultiplier || 1.5);

  // dept breakdown
  const deptStats = useMemo(() => {
    const map = {};
    filtered.forEach(d => {
      if (!map[d.Department]) map[d.Department] = { dept: d.Department, total: 0, resigned: 0, highRisk: 0 };
      map[d.Department].total++;
      if (d.AttritionStatus === "Resigned") map[d.Department].resigned++;
      if (d.AttritionStatus === "High Risk") map[d.Department].highRisk++;
    });
    return Object.values(map).map(d => ({ ...d, rate: d.total > 0 ? ((d.resigned + d.highRisk) / d.total) : 0 }));
  }, [filtered]);

  // overtime grouped
  const otData = [
    { label: "Overtime: Yes", attrition: withOT.length > 0 ? ((withOT.filter(d => d.AttritionStatus !== "Active").length / withOT.length) * 100).toFixed(0) : 0 },
    { label: "Overtime: No", attrition: (() => { const no = filtered.filter(d => d.OvertimeStatus === "No"); return no.length > 0 ? ((no.filter(d => d.AttritionStatus !== "Active").length / no.length) * 100).toFixed(0) : 0; })() },
  ];

  // gen breakdown
  const genData = ["Gen Z", "Millennial", "Senior"].map(g => {
    const group = filtered.filter(d => getGeneration(d.Age) === g);
    const attrCount = group.filter(d => d.AttritionStatus !== "Active").length;
    return { label: g, rate: group.length > 0 ? ((attrCount / group.length) * 100).toFixed(0) : 0, count: group.length };
  });

  const kpis = [
    { label: "Flight Risk", value: `${flightRisk}%`, sub: `${resigned + highRisk} of ${total} employees`, color: "#ef4444", icon: "🚨", bg: "#fef2f2" },
    { label: "Total Employees", value: total, sub: `${active} active · ${highRisk} high risk`, color: "#3b82f6", icon: "👥", bg: "#eff6ff" },
    { label: "Turnover Cost (Est.)", value: `$${(turnoverCost / 1000).toFixed(0)}K`, sub: `Based on ${(company.replacementMultiplier||1.5)}× annual salary`, color: "#f59e0b", icon: "💸", bg: "#fffbeb" },
    { label: "Below Salary Cliff", value: belowCliff, sub: `Under $${(company.salaryCliff||5000).toLocaleString()}/mo · ${total > 0 ? ((belowCliff/total)*100).toFixed(0) : 0}% of workforce`, color: "#8b5cf6", icon: "⚠️", bg: "#f5f3ff" },
    { label: "OT Attrition Rate", value: `${otAttrition}%`, sub: "Among overtime workers", color: "#ef4444", icon: "⏱️", bg: "#fef2f2" },
    { label: "Avg Monthly Salary", value: `$${avgSalary.toLocaleString()}`, sub: "Across filtered employees", color: "#10b981", icon: "💰", bg: "#f0fdf4" },
  ];

  const FilterBtn = ({ val, cur, onSet, label }) => (
    <button onClick={() => onSet(val)} style={{ padding: "5px 12px", borderRadius: 20, border: "none", background: cur === val ? "#f59e0b" : "#f1f5f9", color: cur === val ? "#fff" : "#64748b", fontSize: 12, fontWeight: cur === val ? 700 : 500, cursor: "pointer", transition: "all 0.15s" }}>{label || val}</button>
  );

  return (
    <div>
      {/* Filters */}
      <div style={{ background: "#fff", borderRadius: 14, padding: "16px 20px", marginBottom: 20, border: "1.5px solid #f1f5f9", display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Department</div>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>{depts.map(d => <FilterBtn key={d} val={d} cur={deptFilter} onSet={setDeptFilter} />)}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Generation</div>
          <div style={{ display: "flex", gap: 5 }}>{gens.map(g => <FilterBtn key={g} val={g} cur={genFilter} onSet={setGenFilter} />)}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Status</div>
          <div style={{ display: "flex", gap: 5 }}>{statuses.map(s => <FilterBtn key={s} val={s} cur={statusFilter} onSet={setStatusFilter} />)}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Overtime</div>
          <div style={{ display: "flex", gap: 5 }}>{["All","Yes","No"].map(o => <FilterBtn key={o} val={o} cur={otFilter} onSet={setOtFilter} />)}</div>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 14, marginBottom: 20 }}>
        {kpis.map((k, i) => (
          <div key={i} style={{ background: k.bg, borderRadius: 14, padding: "18px 20px", border: `1.5px solid ${k.color}22`, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", right: 12, top: 12, fontSize: 22, opacity: 0.25 }}>{k.icon}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: k.color, lineHeight: 1.1, fontFamily: "'Playfair Display',Georgia,serif" }}>{k.value}</div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 20 }}>
        {/* Dept Attrition Bar */}
        <div style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", border: "1.5px solid #f1f5f9", gridColumn: "1" }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", marginBottom: 4 }}>Attrition Rate by Department</div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 12 }}>% resigned + high risk</div>
          <BarChart data={deptStats} valueKey="rate" labelKey="dept"
            colorFn={d => d.rate > 0.7 ? "#ef4444" : d.rate > 0.4 ? "#f59e0b" : "#22c55e"} />
        </div>

        {/* Donut Status */}
        <div style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", border: "1.5px solid #f1f5f9", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", marginBottom: 4, alignSelf: "flex-start" }}>Workforce Status</div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 12, alignSelf: "flex-start" }}>Breakdown of {total} employees</div>
          <DonutChart data={[
            { label: "Resigned", value: resigned || 0, color: "#ef4444" },
            { label: "High Risk", value: highRisk || 0, color: "#f59e0b" },
            { label: "Active", value: active || 0, color: "#22c55e" },
          ]} size={130} />
          <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap", justifyContent: "center" }}>
            {[{ label: "Resigned", color: "#ef4444", val: resigned }, { label: "High Risk", color: "#f59e0b", val: highRisk }, { label: "Active", color: "#22c55e", val: active }].map(l => (
              <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: l.color }} />
                <span style={{ fontSize: 11, color: "#64748b" }}>{l.label} ({l.val})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Generation Bar */}
        <div style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", border: "1.5px solid #f1f5f9" }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", marginBottom: 4 }}>Attrition by Generation</div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 12 }}>Gen Z / Millennial / Senior</div>
          <BarChart data={genData} valueKey="rate" labelKey="label"
            colorFn={d => Number(d.rate) > 70 ? "#ef4444" : Number(d.rate) > 40 ? "#f59e0b" : "#22c55e"} />
          {genData.find(g => g.label === "Gen Z" && Number(g.rate) >= 80) && (
            <div style={{ marginTop: 10, background: "#fef2f2", borderRadius: 8, padding: "8px 12px", border: "1px solid #fecaca" }}>
              <span style={{ fontSize: 11, color: "#dc2626", fontWeight: 700 }}>⚠️ Gen Z Crisis: {genData.find(g => g.label === "Gen Z")?.rate}% attrition — check mentorship gaps</span>
            </div>
          )}
        </div>
      </div>

      {/* Overtime + Scatter Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        {/* Overtime Death Spiral */}
        <div style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", border: "1.5px solid #f1f5f9" }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", marginBottom: 4 }}>Overtime Death Spiral</div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 12 }}>Attrition rate: overtime vs no overtime</div>
          <div style={{ display: "flex", gap: 16, alignItems: "flex-end" }}>
            {[
              { label: "With Overtime", val: otAttrition, color: "#ef4444" },
              { label: "No Overtime", val: otData[1].attrition, color: "#22c55e" },
            ].map(b => (
              <div key={b.label} style={{ flex: 1, textAlign: "center" }}>
                <div style={{ fontSize: 32, fontWeight: 800, color: b.color, fontFamily: "'Playfair Display',Georgia,serif" }}>{b.val}%</div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>{b.label}</div>
                <div style={{ height: 6, background: b.color, borderRadius: 3, marginTop: 6, width: "100%", opacity: 0.85 }} />
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14, background: "#fef2f2", borderRadius: 8, padding: "8px 12px", border: "1px solid #fecaca" }}>
            <span style={{ fontSize: 11, color: "#dc2626" }}>💀 <strong>Overtime is the #1 predictor</strong> of resignation. Correlation r=0.876.</span>
          </div>
        </div>

        {/* Salary Cliff Scatter */}
        <div style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", border: "1.5px solid #f1f5f9" }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", marginBottom: 4 }}>Salary Cliff vs Satisfaction</div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 8 }}>Each dot = 1 employee · amber line = $5k cliff</div>
          <ScatterPlot data={filtered} />
          <div style={{ display: "flex", gap: 12, marginTop: 10, flexWrap: "wrap" }}>
            {[{ label: "Resigned", color: "#ef4444" }, { label: "High Risk", color: "#f59e0b" }, { label: "Active", color: "#22c55e" }].map(l => (
              <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: l.color }} />
                <span style={{ fontSize: 10, color: "#64748b" }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Employee Table */}
      <div style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", border: "1.5px solid #f1f5f9" }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", marginBottom: 14 }}>Employee Data Table <span style={{ fontSize: 11, fontWeight: 500, color: "#94a3b8" }}>({filtered.length} records)</span></div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["ID","Name","Department","Generation","Salary","Overtime","Satisfaction","Status","Tenure"].map(h => (
                  <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: "#64748b", fontWeight: 700, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "2px solid #f1f5f9" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 20).map((d, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f8fafc", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                  <td style={{ padding: "8px 12px", color: "#94a3b8" }}>{d.EmployeeID}</td>
                  <td style={{ padding: "8px 12px", color: "#1e293b", fontWeight: 500 }}>{d.FirstName} {d.LastName}</td>
                  <td style={{ padding: "8px 12px", color: "#475569" }}>{d.Department}</td>
                  <td style={{ padding: "8px 12px" }}>
                    <span style={{ background: getGeneration(d.Age) === "Gen Z" ? "#fef3c7" : getGeneration(d.Age) === "Millennial" ? "#eff6ff" : "#f0fdf4", color: getGeneration(d.Age) === "Gen Z" ? "#92400e" : getGeneration(d.Age) === "Millennial" ? "#1d4ed8" : "#166534", padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700 }}>
                      {getGeneration(d.Age)}
                    </span>
                  </td>
                  <td style={{ padding: "8px 12px", color: d.MonthlySalary < (company.salaryCliff||5000) ? "#ef4444" : "#16a34a", fontWeight: 600 }}>${(d.MonthlySalary||0).toLocaleString()}</td>
                  <td style={{ padding: "8px 12px" }}>
                    <span style={{ color: d.OvertimeStatus === "Yes" ? "#ef4444" : "#16a34a", fontWeight: 700 }}>{d.OvertimeStatus}</span>
                  </td>
                  <td style={{ padding: "8px 12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 40, height: 6, borderRadius: 3, background: "#f1f5f9", overflow: "hidden" }}>
                        <div style={{ width: `${(d.JobSatisfaction / 10) * 100}%`, height: "100%", background: d.JobSatisfaction <= 3 ? "#ef4444" : d.JobSatisfaction <= 6 ? "#f59e0b" : "#22c55e", borderRadius: 3 }} />
                      </div>
                      <span style={{ color: "#475569" }}>{d.JobSatisfaction}/10</span>
                    </div>
                  </td>
                  <td style={{ padding: "8px 12px" }}>
                    <span style={{ background: d.AttritionStatus === "Resigned" ? "#fef2f2" : d.AttritionStatus === "High Risk" ? "#fffbeb" : "#f0fdf4", color: getAttritionColor(d.AttritionStatus), padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                      {d.AttritionStatus}
                    </span>
                  </td>
                  <td style={{ padding: "8px 12px", color: "#64748b" }}>{d.YearsAtCompany}y</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length > 20 && <div style={{ textAlign: "center", padding: "12px", fontSize: 12, color: "#94a3b8" }}>Showing 20 of {filtered.length} · More rows in full app</div>}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// COMING SOON PLACEHOLDER
// ============================================================
function ComingSoon({ module, icon, desc }) {
  return (
    <div style={{ background: "#fff", borderRadius: 20, padding: "60px 40px", textAlign: "center", border: "2px dashed #f1f5f9" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>{icon}</div>
      <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 22, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>{module}</div>
      <div style={{ fontSize: 14, color: "#94a3b8", maxWidth: 360, margin: "0 auto", lineHeight: 1.6 }}>{desc}</div>
      <div style={{ marginTop: 20, display: "inline-block", background: "linear-gradient(135deg,#f59e0b22,#ef444422)", borderRadius: 12, padding: "8px 20px", fontSize: 12, color: "#92400e", fontWeight: 700 }}>Coming in next build</div>
    </div>
  );
}

// ============================================================
// SIDEBAR NAV
// ============================================================
const MODULES = [
  { id: "m1", label: "Attrition Dashboard", icon: "📊", short: "M1" },
  { id: "m2", label: "Predictive Risk Scorer", icon: "🎯", short: "M2" },
  { id: "m3", label: "Salary Benchmarking", icon: "💰", short: "M3" },
  { id: "m4", label: "Dept Health Monitor", icon: "🏥", short: "M4" },
  { id: "m5", label: "Exit Interview Analyzer", icon: "🚪", short: "M5" },
  { id: "m6", label: "Retention ROI Calc", icon: "📈", short: "M6" },
  { id: "m7", label: "Shift & Fatigue Radar", icon: "😴", short: "M7" },
  { id: "m8", label: "Talent Matchmaker", icon: "🔗", short: "M8" },
  { id: "m9", label: "Micro-Pulse Survey", icon: "💬", short: "M9" },
];

// ============================================================
// MAIN APP
// ============================================================
export default function AttritionIQ() {
  const [company, setCompany] = useState(null);
  const [data, setData] = useState([]);
  const [activeModule, setActiveModule] = useState("m1");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleData = useCallback((rows) => setData(rows), []);

  if (!company) return <CompanySetupModal onSave={setCompany} />;

  const activeInfo = MODULES.find(m => m.id === activeModule);

  return (
    <AppContext.Provider value={{ data, company, setData }}>
      <div style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif", background: "#f8fafc", minHeight: "100vh", display: "flex" }}>

        {/* Sidebar */}
        <div style={{
          width: sidebarOpen ? 240 : 60, minWidth: sidebarOpen ? 240 : 60,
          background: "#0f172a", transition: "width 0.25s", display: "flex", flexDirection: "column",
          position: "sticky", top: 0, height: "100vh", overflowY: "auto", overflowX: "hidden", zIndex: 100
        }}>
          {/* Logo */}
          <div style={{ padding: sidebarOpen ? "24px 20px 20px" : "24px 10px 20px", borderBottom: "1px solid #1e293b" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, background: "linear-gradient(135deg,#f59e0b,#ef4444)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 18 }}>⚡</div>
              {sidebarOpen && (
                <div>
                  <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 16, fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>AttritionIQ</div>
                  <div style={{ fontSize: 10, color: "#475569", marginTop: 1 }}>by Pulse Digital</div>
                </div>
              )}
            </div>
            {sidebarOpen && (
              <div style={{ marginTop: 14, background: "#1e293b", borderRadius: 10, padding: "8px 12px" }}>
                <div style={{ fontSize: 10, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em" }}>Workspace</div>
                <div style={{ fontSize: 13, color: "#f1f5f9", fontWeight: 600, marginTop: 2 }}>{company.name}</div>
                <div style={{ fontSize: 11, color: "#64748b" }}>{company.industry} · {company.currency}</div>
              </div>
            )}
          </div>

          {/* Data status */}
          {sidebarOpen && (
            <div style={{ padding: "12px 16px", borderBottom: "1px solid #1e293b" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: data.length > 0 ? "#22c55e" : "#64748b", flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: data.length > 0 ? "#22c55e" : "#64748b" }}>
                  {data.length > 0 ? `${data.length} employees synced` : "No data loaded"}
                </span>
              </div>
            </div>
          )}

          {/* Nav */}
          <nav style={{ flex: 1, padding: "12px 10px" }}>
            {MODULES.map(m => (
              <button key={m.id} onClick={() => setActiveModule(m.id)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10,
                  padding: sidebarOpen ? "10px 12px" : "10px 12px",
                  borderRadius: 10, border: "none", cursor: "pointer", marginBottom: 2,
                  background: activeModule === m.id ? "linear-gradient(135deg,#f59e0b22,#ef444422)" : "transparent",
                  color: activeModule === m.id ? "#f59e0b" : "#64748b",
                  textAlign: "left", transition: "all 0.15s",
                  borderLeft: activeModule === m.id ? "3px solid #f59e0b" : "3px solid transparent",
                }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{m.icon}</span>
                {sidebarOpen && (
                  <div>
                    <div style={{ fontSize: 11, fontWeight: activeModule === m.id ? 700 : 500, lineHeight: 1.3 }}>{m.label}</div>
                    <div style={{ fontSize: 9, opacity: 0.5, marginTop: 1 }}>{m.short}</div>
                  </div>
                )}
              </button>
            ))}
          </nav>

          {/* Collapse btn */}
          <div style={{ padding: "12px 10px", borderTop: "1px solid #1e293b" }}>
            <button onClick={() => setSidebarOpen(p => !p)}
              style={{ width: "100%", padding: "8px", borderRadius: 8, border: "1px solid #1e293b", background: "transparent", color: "#475569", cursor: "pointer", fontSize: 14 }}>
              {sidebarOpen ? "◀ Collapse" : "▶"}
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Top bar */}
          <div style={{ background: "#fff", borderBottom: "1.5px solid #f1f5f9", padding: "16px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
            <div>
              <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 20, fontWeight: 700, color: "#0f172a" }}>
                {activeInfo?.icon} {activeInfo?.label}
              </div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
                {company.name} · {data.length > 0 ? `${data.length} employees loaded` : "Load data to get started"}
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              {data.length > 0 && (
                <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 20, padding: "4px 12px", fontSize: 11, color: "#16a34a", fontWeight: 700 }}>
                  ✓ Data synced across all modules
                </div>
              )}
              <div style={{ width: 36, height: 36, background: "linear-gradient(135deg,#f59e0b,#ef4444)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 14 }}>
                {company.name.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>

          {/* Content */}
          <div style={{ flex: 1, padding: "24px 28px", overflowY: "auto" }}>
            {/* Data upload always visible at top */}
            <div style={{ marginBottom: 20 }}>
              <DataUploadPanel onData={handleData} currentCount={data.length} />
            </div>

            {data.length === 0 && activeModule === "m1" ? (
              <div style={{ background: "#fff", borderRadius: 20, padding: "60px 40px", textAlign: "center", border: "2px dashed #f1f5f9" }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
                <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 22, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>Ready to analyze</div>
                <div style={{ fontSize: 14, color: "#94a3b8", maxWidth: 360, margin: "0 auto" }}>Upload your employee CSV or click "Use Sample Data" to see the full dashboard in action.</div>
              </div>
            ) : activeModule === "m1" ? <M1Dashboard /> :
              activeModule === "m2" ? <ComingSoon module="Predictive Risk Scorer" icon="🎯" desc="Input any employee's details and get an AI-powered flight risk score from 0–100% with factor breakdown and Gen Z quiet-quitting detection." /> :
              activeModule === "m3" ? <ComingSoon module="Salary Benchmarking Studio" icon="💰" desc="Auto-detect your company's salary cliff threshold, visualize danger zones, and simulate salary adjustments with instant budget impact." /> :
              activeModule === "m4" ? <ComingSoon module="Department Health Monitor" icon="🏥" desc="Traffic-light scorecards per department with Survivor Burnout Alert (🚨 flashing red when attrition >40%) and Human Buffer Metric." /> :
              activeModule === "m5" ? <ComingSoon module="Exit Interview Analyzer" icon="🚪" desc="Paste exit interview notes → AI auto-categorizes reasons, detects patterns, and generates word cloud of top complaints." /> :
              activeModule === "m6" ? <ComingSoon module="Retention ROI Calculator" icon="📈" desc="Simulate 3 interventions with sliders → get ROI timeline, ghost cost toggle, AI executive summary, and 90-Day Gantt Action Plan." /> :
              activeModule === "m7" ? <ComingSoon module="Shift & Fatigue Radar" icon="😴" desc="Analyze shift patterns, calculate Fatigue Index Score, and simulate schedule changes to predict burnout before it happens." /> :
              activeModule === "m8" ? <ComingSoon module="Internal Talent Matchmaker" icon="🔗" desc="Build skill matrices for at-risk employees → AI scans other departments for open roles and outputs match percentage scores." /> :
              <ComingSoon module="Micro-Pulse Survey Engine" icon="💬" desc="Generate weekly 1-2 question survey links → real-time sentiment stream updates M1 satisfaction scores → live word cloud." />
            }
          </div>
        </div>
      </div>
    </AppContext.Provider>
  );
}
