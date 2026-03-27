import { useState, useEffect, useMemo, useCallback } from "react";
import { BarChart, DonutChart } from "../components/Charts";
import { useModuleData } from "../context/ModuleDataContext";
import { useModularStorage } from "../hooks/useModularStorage";
import { isSampleActive, getSampleM1 } from "../utils/sampleData";
import { autoMapFields } from "../utils/autoMapping";

function FilterBtn({ val, cur, onSet }) {
  return (
    <button onClick={() => onSet(val)} style={{
      padding: "4px 11px", borderRadius: 20, border: "none",
      background: cur === val ? "#f59e0b" : "#f1f5f9",
      color: cur === val ? "#fff" : "#64748b",
      fontSize: 11, fontWeight: cur === val ? 700 : 500,
      cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap",
    }}>{val}</button>
  );
}

function KPICard({ label, value, sub, color, icon, bg, title }) {
  return (
    <div title={title} style={{ background: bg, borderRadius: 14, padding: "16px 18px", border: `1.5px solid ${color}22`, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", right: 12, top: 10, fontSize: 20, opacity: 0.2 }}>{icon}</div>
      <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1.1, fontFamily: "'Playfair Display',Georgia,serif" }}>{value}</div>
      <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>{sub}</div>
    </div>
  );
}

function EditModal({ employee, onSave, onClose }) {
  const [form, setForm] = useState({ ...employee });
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: "#fff", borderRadius: 18, padding: "28px 30px", width: "100%", maxWidth: 480, boxShadow: "0 24px 60px rgba(15,23,42,0.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
            ✏️ Edit Employee
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8", lineHeight: 1 }}>×</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            { label: "First Name", key: "FirstName", type: "text" },
            { label: "Last Name", key: "LastName", type: "text" },
            { label: "Department", key: "Department", type: "text" },
            { label: "Monthly Salary", key: "MonthlySalary", type: "number" },
            { label: "Years at Company", key: "YearsAtCompany", type: "number" },
            { label: "Age", key: "Age", type: "number" },
          ].map(f => (
            <div key={f.key}>
              <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{f.label}</label>
              <input type={f.type} value={form[f.key] || ""}
                onChange={e => set(f.key, f.type === "number" ? Number(e.target.value) : e.target.value)}
                style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 13, color: "#1e293b", background: "#f8fafc", boxSizing: "border-box" }} />
            </div>
          ))}
          <div>
            <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Overtime</label>
            <select value={form.OvertimeStatus} onChange={e => set("OvertimeStatus", e.target.value)}
              style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 13, color: "#1e293b", background: "#f8fafc" }}>
              <option>Yes</option><option>No</option>
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Attrition Status</label>
            <select value={form.AttritionStatus} onChange={e => set("AttritionStatus", e.target.value)}
              style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 13, color: "#1e293b", background: "#f8fafc" }}>
              <option>Active</option><option>High Risk</option><option>Resigned</option>
            </select>
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Job Satisfaction (1–10)</label>
            <input type="number" min={1} max={10} value={form.JobSatisfaction ?? ''}
              onChange={e => {
                const val = e.target.value;
                set("JobSatisfaction", val === '' ? null : Number(val));
              }}
              style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 13, color: "#1e293b", background: "#f8fafc", boxSizing: "border-box" }} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button onClick={onClose} style={{ flex: 1, padding: "11px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#f8fafc", color: "#475569", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>Cancel</button>
          <button
            onClick={() => {
              const cleaned = { ...form };
              if (cleaned.JobSatisfaction === null || cleaned.JobSatisfaction === undefined || cleaned.JobSatisfaction === '') {
                cleaned.JobSatisfaction = 5;
              }
              onSave(cleaned);
              onClose();
            }}
            style={{ flex: 1, padding: "11px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#f59e0b,#ef4444)", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 13 }}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

export default function M1Dashboard() {
  // --- MODULAR CONTEXT: storage & config per modul! ---
  const { m1Data, setM1Data, m1Config, setM1Config } = useModuleData();
  const [storedData, setStoredData] = useModularStorage('m1_dashboard_data', getSampleM1());
  const appConfig = m1Config || {
    colors: { high: "#ef4444", medium: "#eab308", low: "#22c55e" },
    thresholds: { high: 30, medium: 15 }
  };

  // --- Sampel Mode Dynamic : auto load sample di mode sample atau kosong ---
  const sampleMode = isSampleActive('m1');
  useEffect(() => {
    if (sampleMode && storedData.length === 0) setStoredData(getSampleM1());
  }, [sampleMode, storedData, setStoredData]);

  // --- Mapping anti typo otomatis, selalu pas begitu open/error csv ---
  useEffect(() => {
    if (storedData.length !== m1Data.length) {
      setM1Data(autoMapFields(storedData));
    }
  }, [storedData, m1Data.length, setM1Data]);

  // UI STATE + FILTERS
  const [deptF, setDeptF] = useState("All");
  const [genF, setGenF] = useState("All");
  const [statusF, setStatusF] = useState("All");
  const [otF, setOtF] = useState("All");
  const [tenureF, setTenureF] = useState("All"); // FITUR BARU: filter pegawai > 5 tahun

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 25;
  const [editingEmp, setEditingEmp] = useState(null);

  // DATA DERIVED
  const depts = useMemo(() => ["All", ...new Set(m1Data.map(d => d.Department))], [m1Data]);
  const filtered = useMemo(() => m1Data.filter(d => {
    if (deptF !== "All" && d.Department !== deptF) return false;
    if (genF !== "All" && d.Generation !== genF) return false;
    if (statusF !== "All" && d.AttritionStatus !== statusF) return false;
    if (otF !== "All" && d.OvertimeStatus !== otF) return false;
    if (tenureF === ">5th" && (d.YearsAtCompany || 0) <= 5) return false;
    if (search) {
      const q = search.toLowerCase();
      const haystack = `${d.FirstName || ""} ${d.LastName || ""} ${d.Department || ""} ${d.EmployeeID || ""}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  }), [m1Data, deptF, genF, statusF, otF, tenureF, search]);

  const stats = useMemo(() => {
    const total      = filtered.length;
    const resigned   = filtered.filter(d => d.AttritionStatus === "Resigned").length;
    const active     = filtered.filter(d => d.AttritionStatus === "Active").length;
    const highRisk   = filtered.filter(d => d.AttritionStatus === "High Risk").length;
    const flightRisk = total ? (((resigned + highRisk) / total) * 100).toFixed(1) : 0;
    const withOT     = filtered.filter(d => d.OvertimeStatus === "Yes");
    const avgSalary  = total ? Math.round(filtered.reduce((s, d) => s + (d.MonthlySalary || 0), 0) / total) : 0;
    const belowCliff = filtered.filter(d => (d.MonthlySalary || 0) < (m1Config?.salaryCliff || 5000)).length;
    const turnoverCost = resigned * avgSalary * 12 * (m1Config?.replacementMultiplier || 1.5);
    return { total, resigned, active, highRisk, flightRisk, withOT, avgSalary, belowCliff, turnoverCost };
  }, [filtered, m1Config]);

  // Save/Update Employee
  const handleSaveEdit = useCallback((updated) => {
    setM1Data(prev => prev.map(d => d.EmployeeID === updated.EmployeeID ? { ...d, ...updated } : d));
    setStoredData(prev => prev.map(d => d.EmployeeID === updated.EmployeeID ? { ...d, ...updated } : d));
  }, [setM1Data, setStoredData]);

  // Export Feature
  const handleExport = () => {
    const headers = ["EmployeeID","FirstName","LastName","Department","MonthlySalary","OvertimeStatus","JobSatisfaction","AttritionStatus","YearsAtCompany","Age","RiskLevel","RiskPct"];
    const rows = filtered.map(d => headers.map(h => d[h] ?? "").join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `attritioniq_m1_export_${Date.now()}.csv`; a.click();
  };

  if (m1Data.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
        <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>Ready to Analyze</div>
        <div style={{ fontSize: 14, color: "#94a3b8" }}>Upload your CSV atau klik "Use Sample Data" untuk contoh dashboard.</div>
      </div>
    );
  }

  // KPI, Chart, Table, UI below...
  return (
    <div>
      {editingEmp && (
        <EditModal
          employee={editingEmp}
          onSave={handleSaveEdit}
          onClose={() => setEditingEmp(null)}
        />
      )}

      {/* FILTERS SECTION */}
      <div style={{ background: "#fff", borderRadius: 14, padding: "14px 18px", marginBottom: 18, border: "1.5px solid #f1f5f9", display: "flex", flexWrap: "wrap", gap: 14 }}>
        {[
          { label: "Department", values: depts, cur: deptF, set: setDeptF },
          { label: "Generation", values: ["All", "Gen Z", "Millennial", "Gen X", "Baby Boomer"], cur: genF, set: setGenF },
          { label: "Status", values: ["All", "Resigned", "Active", "High Risk"], cur: statusF, set: setStatusF },
          { label: "Overtime", values: ["All", "Yes", "No"], cur: otF, set: setOtF },
          { label: "Tenure", values: ["All", ">5th"], cur: tenureF, set: setTenureF }, // FITUR BARU
        ].map(f => (
          <div key={f.label}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#cbd5e1", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>{f.label}</div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {f.values.map(v => <FilterBtn key={v} val={v} cur={f.cur} onSet={f.set} />)}
            </div>
          </div>
        ))}
      </div>

      {/* KPI CARDS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 12, marginBottom: 18 }}>
        {[{
          label: "Flight Risk", value: `${stats.flightRisk}%`, sub: `${stats.highRisk + stats.resigned} of ${stats.total} at risk`, color: appConfig.colors.high, icon: "🚨", bg: `${appConfig.colors.high}22`, title: "Customize risk threshold via settings"
        }, {
          label: "Resigned", value: stats.resigned, sub: stats.total ? `${((stats.resigned / stats.total)*100).toFixed(0)}% workforce` : "", color: appConfig.colors.high, icon: "🚪", bg: `${appConfig.colors.high}22`
        }, {
          label: "High Risk", value: stats.highRisk, sub: "Likely resign soon", color: appConfig.colors.medium, icon: "⚠️", bg: `${appConfig.colors.medium}22`
        }, {
          label: "Active & Safe", value: stats.active, sub: `${((stats.active/stats.total)*100).toFixed(0)}% retained`, color: appConfig.colors.low, icon: "✅", bg: `${appConfig.colors.low}22`
        }, {
          label: "Est. Turnover Cost", value: stats.turnoverCost.toLocaleString(), sub: "Annual est.", color: "#8b5cf6", icon: "💸", bg: "#f5f3ff"
        }, {
          label: "Below Salary Cliff", value: stats.belowCliff, sub: `Under ${(m1Config?.salaryCliff || 5000).toLocaleString()}/mo`, color: "#f97316", icon: "📉", bg: "#fff7ed"
        }].map((k, i) => <KPICard key={i} {...k} />)}
      </div>

      {/* CHARTS */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
        <div style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", border: "1.5px solid #f1f5f9" }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", marginBottom: 2 }}>Attrition by Department</div>
          <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 12 }}>% at-risk per dept</div>
          <BarChart
            data={Object.entries(depts.slice(1)).map(([_, dept]) => {
              const total = m1Data.filter(d => d.Department === dept).length;
              const bad = m1Data.filter(d => d.Department === dept && d.AttritionStatus !== "Active").length;
              return { dept, rate: total ? bad / total : 0 };
            })}
            valueKey="rate" labelKey="dept"
            colorFn={d => Number(d.rate) > 0.7 ? appConfig.colors.high : Number(d.rate) > 0.4 ? appConfig.colors.medium : appConfig.colors.low}
          />
        </div>
        <div style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", border: "1.5px solid #f1f5f9", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", marginBottom: 2, alignSelf: "flex-start" }}>Workforce Status</div>
          <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 10, alignSelf: "flex-start" }}>{stats.total} employees</div>
          <DonutChart data={[
              { label: "Resigned",  value: stats.resigned,  color: appConfig.colors.high },
              { label: "High Risk", value: stats.highRisk,  color: appConfig.colors.medium },
              { label: "Active",    value: stats.active,    color: appConfig.colors.low },
            ]} size={120} />
        </div>
        <div style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", border: "1.5px solid #f1f5f9" }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", marginBottom: 2 }}>By Tenure</div>
          <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 12 }}>Employees over 5 years</div>
          <BarChart
            data={[
              { label: "<=5 years", value: m1Data.filter(d => (d.YearsAtCompany || 0) <= 5).length },
              { label: ">5 years", value: m1Data.filter(d => (d.YearsAtCompany || 0) > 5).length }
            ]}
            valueKey="value" labelKey="label"
            colorFn={d => d.label === ">5 years" ? "#3b82f6" : "#eab308"}
          />
        </div>
      </div>

      {/* TABLE */}
      <div style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", border: "1.5px solid #f1f5f9" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}>
            Employee Records <span style={{ fontSize: 11, fontWeight: 500, color: "#94a3b8" }}>({filtered.length} records)</span>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <input
              type="text"
              placeholder="🔍 Search name, dept, ID..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              style={{ padding: "6px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 12, color: "#1e293b", background: "#f8fafc", outline: "none", width: 200 }}
            />
            <button
              onClick={handleExport}
              style={{ padding: "6px 13px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#f8fafc", fontSize: 12, color: "#475569", cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap" }}
            >
              ⬇ Export CSV
            </button>
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["ID", "Name", "Dept", "Gen", "Salary", "OT", "Satisfaction", "Status", "Tenure", "Edit"].map(h => (
                  <th key={h} style={{ padding: "8px 10px", textAlign: "left", color: "#64748b", fontWeight: 700, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "2px solid #f1f5f9", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.slice((page-1) * PAGE_SIZE, page*PAGE_SIZE).map((d, i) => (
                <tr key={d.EmployeeID || i} style={{ borderBottom: "1px solid #f8fafc", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                  <td style={{ padding: "7px 10px", color: "#94a3b8", fontSize: 11 }}>{d.EmployeeID}</td>
                  <td style={{ padding: "7px 10px", color: "#1e293b", fontWeight: 500 }}>{d.FirstName} {d.LastName}</td>
                  <td style={{ padding: "7px 10px", color: "#475569" }}>{d.Department}</td>
                  <td style={{ padding: "7px 10px" }}>{d.Generation || "–"}</td>
                  <td style={{ padding: "7px 10px", color: (d.MonthlySalary||0) < (m1Config?.salaryCliff||5000) ? "#ef4444" : "#16a34a", fontWeight: 600 }}>
                    {(d.MonthlySalary || 0).toLocaleString()}
                  </td>
                  <td style={{ padding: "7px 10px", color: d.OvertimeStatus === "Yes" ? "#ef4444" : "#16a34a", fontWeight: 700 }}>{d.OvertimeStatus}</td>
                  <td style={{ padding: "7px 10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <div style={{ width: 36, height: 5, borderRadius: 3, background: "#f1f5f9", overflow: "hidden" }}>
                        <div style={{ width: `${((d.JobSatisfaction || 0) / 10) * 100}%`, height: "100%", background: (d.JobSatisfaction || 0) <= 3 ? "#ef4444" : (d.JobSatisfaction || 0) <= 6 ? "#f59e0b" : "#22c55e", borderRadius: 3 }} />
                      </div>
                      <span style={{ color: "#475569", fontSize: 11 }}>{d.JobSatisfaction}/10</span>
                    </div>
                  </td>
                  <td style={{ padding: "7px 10px" }}>
                    <span style={{ background: d.AttritionStatus === "Resigned" ? "#fef2f2" : d.AttritionStatus === "High Risk" ? "#fffbeb" : "#f0fdf4", color: d.AttritionStatus === "Resigned" ? "#dc2626" : d.AttritionStatus === "High Risk" ? "#eab308" : "#22c55e", padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700 }}>
                      {d.AttritionStatus}
                    </span>
                  </td>
                  <td style={{ padding: "7px 10px", color: "#64748b" }}>{d.YearsAtCompany}y</td>
                  <td style={{ padding: "7px 10px", textAlign: "center" }}>
                    <button onClick={() => setEditingEmp(d)}
                      style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 6, padding: "3px 8px", cursor: "pointer", fontSize: 12, color: "#64748b", transition: "all 0.15s" }}
                      onMouseEnter={e => { e.target.style.background = "#fffbeb"; e.target.style.borderColor = "#f59e0b"; }}
                      onMouseLeave={e => { e.target.style.background = "#f8fafc"; e.target.style.borderColor = "#e2e8f0"; }}>
                      ✏️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {filtered.length > PAGE_SIZE && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12, flexWrap: "wrap", gap: 8 }}>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>
              Showing {(page-1)*PAGE_SIZE + 1}–{Math.min(page*PAGE_SIZE, filtered.length)} of {filtered.length} records
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
                style={{ padding: "5px 12px", borderRadius: 7, border: "1.5px solid #e2e8f0", background: page === 1 ? "#f8fafc" : "#fff", color: page === 1 ? "#cbd5e1" : "#475569", cursor: page === 1 ? "not-allowed" : "pointer", fontSize: 12, fontWeight: 600 }}>
                ← Prev
              </button>
              {Array.from({ length: Math.ceil(filtered.length / PAGE_SIZE) }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  style={{ padding: "5px 10px", borderRadius: 7, border: "none", background: p === page ? "#f59e0b" : "#f1f5f9", color: p === page ? "#fff" : "#64748b", cursor: "pointer", fontSize: 12, fontWeight: p === page ? 700 : 500 }}>
                  {p}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(Math.ceil(filtered.length / PAGE_SIZE), p+1))} disabled={page === Math.ceil(filtered.length / PAGE_SIZE)}
                style={{ padding: "5px 12px", borderRadius: 7, border: "1.5px solid #e2e8f0", background: page === Math.ceil(filtered.length / PAGE_SIZE) ? "#f8fafc" : "#fff", color: page === Math.ceil(filtered.length / PAGE_SIZE) ? "#cbd5e1" : "#475569", cursor: page === Math.ceil(filtered.length / PAGE_SIZE) ? "not-allowed" : "pointer", fontSize: 12, fontWeight: 600 }}>
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
