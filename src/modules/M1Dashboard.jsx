import { useMemo, useState, useCallback } from "react";
import { useApp, useHRData, useCurrency, getGeneration, getStatusColor } from "../context/AppContext";
import { BarChart, DonutChart, ScatterPlot } from "../components/Charts";

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

function KPICard({ label, value, sub, color, icon, bg }) {
  return (
    <div style={{ background: bg, borderRadius: 14, padding: "16px 18px", border: `1.5px solid ${color}22`, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", right: 12, top: 10, fontSize: 20, opacity: 0.2 }}>{icon}</div>
      <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1.1, fontFamily: "'Playfair Display',Georgia,serif" }}>{value}</div>
      <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>{sub}</div>
    </div>
  );
}

// ── Inline Employee Edit Modal ──
function EditModal({ employee, onSave, onClose }) {
  const [form, setForm] = useState({ ...employee });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 18, padding: "28px 30px", width: "100%", maxWidth: 480, boxShadow: "0 24px 60px rgba(15,23,42,0.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
            ✏️ Edit Employee
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8", lineHeight: 1 }}>×</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[
            { label: "First Name",      key: "FirstName",       type: "text" },
            { label: "Last Name",       key: "LastName",        type: "text" },
            { label: "Department",      key: "Department",      type: "text" },
            { label: "Monthly Salary",  key: "MonthlySalary",   type: "number" },
            { label: "Years at Company",key: "YearsAtCompany",  type: "number" },
            { label: "Age",             key: "Age",             type: "number" },
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
    const { company, pulseOverride } = useApp();
  const { data, setData, computed } = useHRData();
  const { fmt, config: cfg } = useCurrency();
  const cliff      = company?.salaryCliff || 5000;
  const multiplier = company?.replacementMultiplier || 1.5;
  const [deptF,   setDeptF]   = useState("All");
  const [genF,    setGenF]    = useState("All");
  const [statusF, setStatusF] = useState("All");
  const [otF,     setOtF]     = useState("All");
  const [search,  setSearch]  = useState("");
  const [page,    setPage]    = useState(1);
  const PAGE_SIZE = 25;

  // Alert dismiss state
  const [dismissedAlerts, setDismissedAlerts] = useState(new Set());
  const dismissAlert = (key) => setDismissedAlerts(p => new Set([...p, key]));

  // Inline edit state
  const [editingEmp, setEditingEmp] = useState(null);

  const depts = useMemo(() => ["All", ...new Set(computed.map(d => d.Department))], [computed]);

  const filtered = useMemo(() => computed.filter(d => {
    if (deptF !== "All" && d.Department !== deptF) return false;
    if (genF !== "All" && d.Generation !== genF) return false;
    if (statusF !== "All" && d.AttritionStatus !== statusF) return false;
    if (otF !== "All" && d.OvertimeStatus !== otF) return false;
    if (search && !`${d.FirstName} ${d.LastName} ${d.Department} ${d.EmployeeID}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
    }), [data, deptF, genF, statusF, otF, search]);

  const total     = filtered.length;
  const resigned  = filtered.filter(d => d.AttritionStatus === "Resigned").length;
  const active    = filtered.filter(d => d.AttritionStatus === "Active").length;
  const highRisk  = filtered.filter(d => d.AttritionStatus === "High Risk").length;
  const flightRisk = total > 0 ? (((resigned + highRisk) / total) * 100).toFixed(1) : 0;

  const withOT    = filtered.filter(d => d.OvertimeStatus === "Yes");
  const noOT      = filtered.filter(d => d.OvertimeStatus === "No");
  // Fixed: both use same definition of "at risk" (Resigned only for apples-to-apples)
  const otRate    = withOT.length > 0 ? ((withOT.filter(d => d.AttritionStatus === "Resigned").length / withOT.length) * 100).toFixed(1) : 0;
  const noOtRate  = noOT.length  > 0 ? ((noOT.filter(d => d.AttritionStatus === "Resigned").length  / noOT.length)  * 100).toFixed(1) : 0;

  const avgSalary    = total > 0 ? Math.round(filtered.reduce((s, d) => s + (d.MonthlySalary || 0), 0) / total) : 0;
  const belowCliff   = filtered.filter(d => d.MonthlySalary < cliff).length;
  const turnoverCost = resigned * avgSalary * 12 * multiplier;

  const deptStats = useMemo(() => {
    const map = {};
    filtered.forEach(d => {
      if (!map[d.Department]) map[d.Department] = { dept: d.Department, total: 0, bad: 0 };
      map[d.Department].total++;
      if (d.AttritionStatus !== "Active") map[d.Department].bad++;
    });
    return Object.values(map).map(d => ({ ...d, rate: d.total > 0 ? d.bad / d.total : 0 }));
  }, [filtered]);

  const genData = ["Gen Z", "Millennial", "Senior"].map(g => {
    const grp = filtered.filter(d => getGeneration(d.Age) === g);
    const bad = grp.filter(d => d.AttritionStatus !== "Active").length;
    return { label: g, rate: grp.length > 0 ? bad / grp.length : 0, count: grp.length };
  });

  const genZCrisis = genData.find(g => g.label === "Gen Z" && g.rate >= 0.8);

  const kpis = [
    { label: "Flight Risk",       value: `${flightRisk}%`,          sub: `${resigned + highRisk} of ${total} at risk`,          color: "#ef4444", icon: "🚨", bg: "#fef2f2" },
    { label: "Resigned",          value: resigned,                   sub: `${total > 0 ? ((resigned/total)*100).toFixed(0) : 0}% of workforce`, color: "#dc2626", icon: "🚪", bg: "#fff1f2" },
    { label: "High Risk",         value: highRisk,                   sub: "Likely to resign soon",                               color: "#f59e0b", icon: "⚠️", bg: "#fffbeb" },
    { label: "Active & Safe",     value: active,                     sub: `${total > 0 ? ((active/total)*100).toFixed(0) : 0}% retained`,      color: "#22c55e", icon: "✅", bg: "#f0fdf4" },
    { label: "Est. Turnover Cost",value: fmt(turnoverCost, true),    sub: `${multiplier}× annual salary formula`,                color: "#8b5cf6", icon: "💸", bg: "#f5f3ff" },
    { label: "Below Salary Cliff",value: belowCliff,                 sub: `Under ${fmt(cliff)}/mo`,                              color: "#f97316", icon: "📉", bg: "#fff7ed" },
  ];

  // Pagination
  const totalPages  = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Inline save handler
  const handleSaveEdit = (updated) => {
    setData(data.map(d => d.EmployeeID === updated.EmployeeID ? { ...d, ...updated } : d));
  };

  if (data.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
        <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>Ready to Analyze</div>
        <div style={{ fontSize: 14, color: "#94a3b8" }}>Upload your CSV or click "Use Sample Data" above to see the full dashboard.</div>
      </div>
    );
  }

  return (
    <div>
      {/* Edit Modal */}
      {editingEmp && (
        <EditModal
          employee={editingEmp}
          onSave={handleSaveEdit}
          onClose={() => setEditingEmp(null)}
        />
      )}

      {/* Filters */}
      <div style={{ background: "#fff", borderRadius: 14, padding: "14px 18px", marginBottom: 18, border: "1.5px solid #f1f5f9", display: "flex", flexWrap: "wrap", gap: 14 }}>
        {[
          { label: "Department", values: depts,         cur: deptF,   set: setDeptF },
          { label: "Generation", values: ["All","Gen Z","Millennial","Senior"], cur: genF, set: setGenF },
          { label: "Status",     values: ["All","Resigned","Active","High Risk"], cur: statusF, set: setStatusF },
          { label: "Overtime",   values: ["All","Yes","No"], cur: otF, set: setOtF },
        ].map(f => (
          <div key={f.label}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#cbd5e1", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>{f.label}</div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {f.values.map(v => <FilterBtn key={v} val={v} cur={f.cur} onSet={(val) => { f.set(val); setPage(1); }} />)}
            </div>
          </div>
        ))}
      </div>

            {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 12, marginBottom: 18 }}>
        {kpis.map((k, i) => <KPICard key={i} {...k} />)}
        {pulseOverride && (
          <KPICard
            label="Org Pulse Score"
            value={`${pulseOverride.orgPulse}/100`}
            sub={`${pulseOverride.week} · from M9 Survey`}
            color={pulseOverride.orgPulse >= 70 ? "#22c55e" : pulseOverride.orgPulse >= 50 ? "#f59e0b" : "#ef4444"}
            icon="💬"
            bg={pulseOverride.orgPulse >= 70 ? "#f0fdf4" : pulseOverride.orgPulse >= 50 ? "#fffbeb" : "#fef2f2"}
          />
        )}
      </div>

      {/* Charts Row 1 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
        <div style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", border: "1.5px solid #f1f5f9" }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", marginBottom: 2 }}>Attrition by Department</div>
          <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 12 }}>% at-risk per dept</div>
          <BarChart
            data={deptStats} valueKey="rate" labelKey="dept"
            colorFn={d => Number(d.rate) > 0.7 ? "#ef4444" : Number(d.rate) > 0.4 ? "#f59e0b" : "#22c55e"}
          />
        </div>

        <div style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", border: "1.5px solid #f1f5f9", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", marginBottom: 2, alignSelf: "flex-start" }}>Workforce Status</div>
          <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 10, alignSelf: "flex-start" }}>{total} employees</div>
          <DonutChart data={[
            { label: "Resigned",  value: resigned,  color: "#ef4444" },
            { label: "High Risk", value: highRisk,  color: "#f59e0b" },
            { label: "Active",    value: active,    color: "#22c55e" },
          ]} size={120} />
          <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap", justifyContent: "center" }}>
            {[{ l: "Resigned", c: "#ef4444", v: resigned }, { l: "High Risk", c: "#f59e0b", v: highRisk }, { l: "Active", c: "#22c55e", v: active }].map(x => (
              <div key={x.l} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: x.c }} />
                <span style={{ fontSize: 10, color: "#64748b" }}>{x.l} ({x.v})</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", border: "1.5px solid #f1f5f9" }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", marginBottom: 2 }}>By Generation</div>
          <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 12 }}>Gen Z · Millennial · Senior</div>
          <BarChart
            data={genData} valueKey="rate" labelKey="label"
            colorFn={d => Number(d.rate) > 0.7 ? "#ef4444" : Number(d.rate) > 0.4 ? "#f59e0b" : "#22c55e"}
          />
          {genZCrisis && !dismissedAlerts.has("genZ") && (
            <div style={{ marginTop: 8, background: "#fef2f2", borderRadius: 8, padding: "7px 10px", border: "1px solid #fecaca", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6 }}>
              <span style={{ fontSize: 10, color: "#dc2626", fontWeight: 700 }}>⚠️ Gen Z Crisis: {(genZCrisis.rate * 100).toFixed(0)}% attrition — mentorship gap detected</span>
              <button onClick={() => dismissAlert("genZ")} style={{ background: "none", border: "none", color: "#fca5a5", cursor: "pointer", fontSize: 14, lineHeight: 1, flexShrink: 0 }}>×</button>
            </div>
          )}
        </div>
      </div>

            {/* Charts Row 2 - Executive Summary */}
      <div style={{ background: "#fff", borderRadius: 14, padding: "20px 24px", border: "1.5px solid #f1f5f9", marginBottom: 18, display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
        
        <div style={{ flex: "1 1 300px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
             <div style={{ background: "#fef2f2", color: "#ef4444", padding: "4px 8px", borderRadius: 6, fontSize: 11, fontWeight: 800, letterSpacing: "0.05em" }}>AI INSIGHT</div>
             <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>Top Attrition Drivers</div>
          </div>
          <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6 }}>
            Based on the analysis of <strong>{total}</strong> employee records, our algorithm detected 3 main patterns driving the highest retention risk in your company:
          </div>
        </div>

        <div style={{ flex: "2 1 400px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
          <div style={{ background: "#f8fafc", padding: "12px 16px", borderRadius: 10, borderLeft: "3px solid #ef4444" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>1. Compensation Gap</div>
            <div style={{ fontSize: 10, color: "#64748b" }}><strong>{belowCliff}</strong> employees are below the salary safety cliff.</div>
          </div>
          <div style={{ background: "#f8fafc", padding: "12px 16px", borderRadius: 10, borderLeft: "3px solid #f59e0b" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>2. Overtime Burnout</div>
            <div style={{ fontSize: 10, color: "#64748b" }}><strong>{withOT.length}</strong> employees are working excessive overtime.</div>
          </div>
          <div style={{ background: "#f8fafc", padding: "12px 16px", borderRadius: 10, borderLeft: "3px solid #3b82f6" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>3. Gen Z Flight Risk</div>
            <div style={{ fontSize: 10, color: "#64748b" }}><strong>{genData.find(g => g.label === "Gen Z")?.count || 0}</strong> Gen Z employees require intervention.</div>
          </div>
        </div>

      </div>


      {/* Employee Table */}
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
              onClick={() => {
                const headers = ["EmployeeID","FirstName","LastName","Department","MonthlySalary","OvertimeStatus","JobSatisfaction","AttritionStatus","YearsAtCompany","Age","RiskLevel","RiskPct"];
                const rows = filtered.map(d => headers.map(h => d[h] ?? "").join(","));
                const csv = [headers.join(","), ...rows].join("\n");
                const blob = new Blob([csv], { type: "text/csv" });
                const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
                a.download = `attritioniq_export_${Date.now()}.csv`; a.click();
              }}
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
                {["ID","Name","Dept","Gen","Salary","OT","Satisfaction","Status","Tenure","Risk %","Edit"].map(h => (
                  <th key={h} style={{ padding: "8px 10px", textAlign: "left", color: "#64748b", fontWeight: 700, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "2px solid #f1f5f9", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map((d, i) => {
                const gen = getGeneration(d.Age);
                return (
                  <tr key={d.EmployeeID || i} style={{ borderBottom: "1px solid #f8fafc", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                    <td style={{ padding: "7px 10px", color: "#94a3b8", fontSize: 11 }}>{d.EmployeeID}</td>
                    <td style={{ padding: "7px 10px", color: "#1e293b", fontWeight: 500 }}>{d.FirstName} {d.LastName}</td>
                    <td style={{ padding: "7px 10px", color: "#475569" }}>{d.Department}</td>
                    <td style={{ padding: "7px 10px" }}>
                      <span style={{ background: gen === "Gen Z" ? "#fef3c7" : gen === "Millennial" ? "#eff6ff" : "#f0fdf4", color: gen === "Gen Z" ? "#92400e" : gen === "Millennial" ? "#1d4ed8" : "#166534", padding: "2px 7px", borderRadius: 20, fontSize: 10, fontWeight: 700 }}>{gen}</span>
                    </td>
                    <td style={{ padding: "7px 10px", color: d.MonthlySalary < cliff ? "#ef4444" : "#16a34a", fontWeight: 600 }}>
                      {fmt(d.MonthlySalary || 0)}
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
                      <span style={{ background: d.AttritionStatus === "Resigned" ? "#fef2f2" : d.AttritionStatus === "High Risk" ? "#fffbeb" : "#f0fdf4", color: getStatusColor(d.AttritionStatus), padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700 }}>
                        {d.AttritionStatus}
                      </span>
                    </td>
                    <td style={{ padding: "7px 10px", color: "#64748b" }}>{d.YearsAtCompany}y</td>
                    <td style={{ padding: "7px 10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <div style={{ width: 36, height: 5, borderRadius: 3, background: "#f1f5f9", overflow: "hidden" }}>
                          <div style={{ width: `${d.RiskPct || 0}%`, height: "100%", background: d.RiskColor || "#22c55e", borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: d.RiskColor || "#22c55e" }}>{d.RiskPct || 0}%</span>
                      </div>
                    </td>
                    <td style={{ padding: "7px 10px", textAlign: "center" }}> 
                      <button onClick={() => setEditingEmp(d)}
                        style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 6, padding: "3px 8px", cursor: "pointer", fontSize: 12, color: "#64748b", transition: "all 0.15s" }}
                        onMouseEnter={e => { e.target.style.background = "#fffbeb"; e.target.style.borderColor = "#f59e0b"; }}
                        onMouseLeave={e => { e.target.style.background = "#f8fafc"; e.target.style.borderColor = "#e2e8f0"; }}>
                        ✏️
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12, flexWrap: "wrap", gap: 8 }}>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} records
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                style={{ padding: "5px 12px", borderRadius: 7, border: "1.5px solid #e2e8f0", background: page === 1 ? "#f8fafc" : "#fff", color: page === 1 ? "#cbd5e1" : "#475569", cursor: page === 1 ? "not-allowed" : "pointer", fontSize: 12, fontWeight: 600 }}>
                ← Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)}
                  style={{ padding: "5px 10px", borderRadius: 7, border: "none", background: p === page ? "#f59e0b" : "#f1f5f9", color: p === page ? "#fff" : "#64748b", cursor: "pointer", fontSize: 12, fontWeight: p === page ? 700 : 500 }}>
                  {p}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                style={{ padding: "5px 12px", borderRadius: 7, border: "1.5px solid #e2e8f0", background: page === totalPages ? "#f8fafc" : "#fff", color: page === totalPages ? "#cbd5e1" : "#475569", cursor: page === totalPages ? "not-allowed" : "pointer", fontSize: 12, fontWeight: 600 }}>
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
