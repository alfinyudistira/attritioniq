import { useMemo, useState, useCallback, useEffect } from "react";
import { useApp, useHRData, useCurrency, getGeneration, getStatusColor } from "../context/AppContext";
import { useModuleData } from "../context/ModuleDataContext"; 
import { BarChart, DonutChart } from "../components/Charts";

function FilterBtn({ val, cur, onSet }) {
  const isActive = cur === val;
  return (
    <button 
      onClick={() => onSet(val)} 
      className={`px-[11px] py-1 rounded-full border-none text-[11px] cursor-pointer transition-all duration-150 whitespace-nowrap ${isActive ? "bg-brand-amber text-white font-bold" : "bg-slate-100 text-slate-500 font-medium hover:bg-slate-200"}`}
    >
      {val}
    </button>
  );
}

function KPICard({ label, value, sub, color, icon, bg, title }) {
  return (
    <div title={title} className="relative overflow-hidden rounded-[14px] p-[16px_18px]" style={{ background: bg, border: `1.5px solid ${color}22` }}>
      <div className="absolute right-3 top-2.5 text-xl opacity-20">{icon}</div>
      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{label}</div>
      <div className="text-[26px] font-extrabold leading-tight font-display" style={{ color }}>{value}</div>
      <div className="text-[11px] text-slate-500 mt-1">{sub}</div>
    </div>
  );
}

// ── Inline Employee Edit Modal ──
function EditModal({ employee, onSave, onClose }) {
  const [form, setForm] = useState({ ...employee });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 bg-brand-dark/55 backdrop-blur-sm flex items-center justify-center z-modal p-4"
    >
      <div
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-[18px] p-[28px_30px] w-full max-w-[480px] shadow-[0_24px_60px_rgba(15,23,42,0.2)]"
      >
        <div className="flex justify-between items-center mb-5">
          <div className="font-display text-base font-bold text-brand-dark">
            ✏️ Edit Employee
          </div>
          <button onClick={onClose} className="bg-transparent border-none text-xl cursor-pointer text-slate-400 leading-none hover:text-brand-red transition-colors">×</button>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "First Name",      key: "FirstName",       type: "text" },
            { label: "Last Name",       key: "LastName",        type: "text" },
            { label: "Department",      key: "Department",      type: "text" },
            { label: "Monthly Salary",  key: "MonthlySalary",   type: "number" },
            { label: "Years at Company",key: "YearsAtCompany",  type: "number" },
            { label: "Age",             key: "Age",             type: "number" },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{f.label}</label>
              <input 
                type={f.type} 
                value={form[f.key] || ""}
                onChange={e => set(f.key, f.type === "number" ? Number(e.target.value) : e.target.value)}
                className="w-full p-[8px_10px] rounded-lg border-[1.5px] border-slate-200 text-[13px] text-brand-navy bg-slate-50 box-border outline-none focus:border-brand-amber" 
              />
            </div>
          ))}
          
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Overtime</label>
            <select 
              value={form.OvertimeStatus} 
              onChange={e => set("OvertimeStatus", e.target.value)}
              className="w-full p-[8px_10px] rounded-lg border-[1.5px] border-slate-200 text-[13px] text-brand-navy bg-slate-50 outline-none focus:border-brand-amber"
            >
              <option>Yes</option><option>No</option>
            </select>
          </div>
          
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Attrition Status</label>
            <select 
              value={form.AttritionStatus} 
              onChange={e => set("AttritionStatus", e.target.value)}
              className="w-full p-[8px_10px] rounded-lg border-[1.5px] border-slate-200 text-[13px] text-brand-navy bg-slate-50 outline-none focus:border-brand-amber"
            >
              <option>Active</option><option>High Risk</option><option>Resigned</option>
            </select>
          </div>
          
          <div className="col-span-2">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Job Satisfaction (1–10)</label>
            <input 
              type="number" min={1} max={10} 
              value={form.JobSatisfaction ?? ''}
              onChange={e => {
                const val = e.target.value;
                set("JobSatisfaction", val === '' ? null : Number(val));
              }}
              className="w-full p-[8px_10px] rounded-lg border-[1.5px] border-slate-200 text-[13px] text-brand-navy bg-slate-50 box-border outline-none focus:border-brand-amber" 
            />
          </div>
        </div>
        
        <div className="flex gap-2.5 mt-5">
          <button 
            onClick={onClose} 
            className="flex-1 p-[11px] rounded-[10px] border-[1.5px] border-slate-200 bg-slate-50 text-slate-600 font-bold cursor-pointer text-[13px] hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              const cleaned = { ...form };
              if (cleaned.JobSatisfaction === null || cleaned.JobSatisfaction === undefined || cleaned.JobSatisfaction === '') {
                cleaned.JobSatisfaction = 5;
              }
              onSave(cleaned);
              onClose();
            }}
            className="flex-1 p-[11px] rounded-[10px] border-none bg-gradient-to-br from-brand-amber to-brand-red text-white font-bold cursor-pointer text-[13px] hover:opacity-90 transition-opacity"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

export default function M1Dashboard() {
  const { company, pulseOverride, appConfig } = useApp();
  const { data, setData, computed, applyIntervention } = useHRData();
  const { fmt, config: cfg } = useCurrency();
  const cliff      = company?.salaryCliff || 5000;
  const multiplier = company?.replacementMultiplier || 1.5;
  
  const { state: m1State, update: updateM1 } = useModuleData("m1");
  
  const deptF   = m1State.deptF || "All";
  const genF    = m1State.genF || "All";
  const statusF = m1State.statusF || "All";
  const otF     = m1State.otF || "All";
  const search  = m1State.search || "";
  const page    = m1State.page || 1;
  const setDeptF   = useCallback((v) => { updateM1({ deptF: v, page: 1 }); }, [updateM1]);
  const setGenF    = useCallback((v) => { updateM1({ genF: v, page: 1 }); }, [updateM1]);
  const setStatusF = useCallback((v) => { updateM1({ statusF: v, page: 1 }); }, [updateM1]);
  const setOtF     = useCallback((v) => { updateM1({ otF: v, page: 1 }); }, [updateM1]);
  const setSearch  = useCallback((v) => { updateM1({ search: v, page: 1 }); }, [updateM1]);
  const setPage = useCallback((valOrFn) => {
    updateM1({ page: typeof valOrFn === 'function' ? valOrFn(page) : valOrFn });
  }, [page, updateM1]);
  
  const PAGE_SIZE = 25;
  const dismissedAlerts = useMemo(() => new Set(m1State.dismissedAlerts || []), [m1State.dismissedAlerts]);
  const dismissAlert = useCallback((key) => {
    updateM1({ dismissedAlerts: [...dismissedAlerts, key] });
  }, [dismissedAlerts, updateM1]);
  
  const [editingEmp, setEditingEmp] = useState(null);
  const depts = useMemo(() => ["All", ...new Set(computed.map(d => d.Department))], [computed]);
  
  const filtered = useMemo(() => computed.filter(d => {
    if (deptF !== "All" && d.Department !== deptF) return false;
    if (genF !== "All") {
      if (genF === "Senior") {
        if (d.Generation !== "Gen X" && d.Generation !== "Baby Boomer") return false;
      } else {
        if (d.Generation !== genF) return false;
      }
    }
    if (statusF !== "All" && d.AttritionStatus !== statusF) return false;
    if (otF !== "All" && d.OvertimeStatus !== otF) return false;
    if (search) {
      const q = search.toLowerCase();
      const haystack = `${d.FirstName || ""} ${d.LastName || ""} ${d.Department || ""} ${d.EmployeeID || ""}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  }), [computed, deptF, genF, statusF, otF, search]);
  
  const stats = useMemo(() => {
    const total      = filtered.length;
    const resigned   = filtered.filter(d => d.AttritionStatus === "Resigned").length;
    const active     = filtered.filter(d => d.AttritionStatus === "Active").length;
    const highRisk   = filtered.filter(d => d.AttritionStatus === "High Risk").length;
    const flightRisk = total > 0 ? (((resigned + highRisk) / total) * 100).toFixed(1) : 0;
    const withOT     = filtered.filter(d => d.OvertimeStatus === "Yes");
    const noOT       = filtered.filter(d => d.OvertimeStatus === "No");
    const otRate     = withOT.length > 0 ? ((withOT.filter(d => d.AttritionStatus === "Resigned").length / withOT.length) * 100).toFixed(1) : 0;
    const noOtRate   = noOT.length  > 0  ? ((noOT.filter(d => d.AttritionStatus === "Resigned").length  / noOT.length)  * 100).toFixed(1) : 0;
    const avgSalary  = total > 0 ? Math.round(filtered.reduce((s, d) => s + (d.MonthlySalary || 0), 0) / total) : 0;
    const belowCliff = filtered.filter(d => (d.MonthlySalary || 0) < cliff).length;
    const turnoverCost = resigned * avgSalary * 12 * multiplier;
    return { total, resigned, active, highRisk, flightRisk, withOT, noOT, otRate, noOtRate, avgSalary, belowCliff, turnoverCost };
  }, [filtered, cliff, multiplier]);

  const { total, resigned, active, highRisk, flightRisk, withOT, noOT, otRate, noOtRate, avgSalary, belowCliff, turnoverCost } = stats;
  
  const deptStats = useMemo(() => {
    const map = {};
    filtered.forEach(d => {
      if (!map[d.Department]) map[d.Department] = { dept: d.Department, total: 0, bad: 0 };
      map[d.Department].total++;
      if (d.AttritionStatus !== "Active") map[d.Department].bad++;
    });
    return Object.values(map).map(d => ({ ...d, rate: d.total > 0 ? d.bad / d.total : 0 }));
  }, [filtered]);

  const genData = useMemo(() => [
    { label: "Gen Z",      match: (d) => d.Generation === "Gen Z" },
    { label: "Millennial", match: (d) => d.Generation === "Millennial" },
    { label: "Senior",     match: (d) => d.Generation === "Gen X" || d.Generation === "Baby Boomer" },
  ].map(g => {
    const grp = filtered.filter(g.match);
    const bad = grp.filter(d => d.AttritionStatus !== "Active").length;
    return { label: g.label, rate: grp.length > 0 ? bad / grp.length : 0, count: grp.length };
  }), [filtered]);

  const genZCrisis = genData.find(g => g.label === "Gen Z" && g.rate >= 0.8);
  
  const kpis = [
    { label: "Flight Risk", value: `${flightRisk}%`, sub: `${resigned + highRisk} of ${total} at risk`, color: appConfig.colors.high, icon: "🚨", bg: `${appConfig.colors.high}22`, title: "Risk threshold can be changed in the menu  ⚙️" },
    { label: "Resigned",          value: resigned,                   sub: `${total > 0 ? ((resigned/total)*100).toFixed(0) : 0}% of workforce`, color: appConfig.colors.high, icon: "🚪", bg: `${appConfig.colors.high}22` },
    { label: "High Risk",         value: highRisk,                   sub: "Likely to resign soon",                               color: appConfig.colors.medium, icon: "⚠️", bg: `${appConfig.colors.medium}22` },
    { label: "Active & Safe",     value: active,                     sub: `${total > 0 ? ((active/total)*100).toFixed(0) : 0}% retained`,      color: appConfig.colors.low, icon: "✅", bg: `${appConfig.colors.low}22` },
    { label: "Est. Turnover Cost",value: fmt(turnoverCost, true),    sub: `${multiplier}× annual salary formula`,                color: "#8b5cf6", icon: "💸", bg: "#f5f3ff" },
    { label: "Below Salary Cliff",value: belowCliff,                 sub: `Under ${fmt(cliff)}/mo`,                              color: "#f97316", icon: "📉", bg: "#fff7ed" },
  ];

  const totalPages  = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  
  const handleSaveEdit = useCallback((updated) => {
    const { EmployeeID, ...updates } = updated;
    applyIntervention(EmployeeID, updates);
  }, [applyIntervention]);

  const drivers = useMemo(() => {
    const list = [];
    if (belowCliff > 0) {
      list.push({ title: "1. Compensation Gap", detail: `${belowCliff} employees are below the safety cliff.`, icon: "💸", border: "#ef4444", bg: "#fef2f2" });
    }
    if (withOT.length > 0) {
      list.push({ title: "2. Overtime Burnout", detail: `${withOT.length} employees with excessive overtime.`, icon: "⌛", border: "#f59e0b", bg: "#fffbeb" });
    }
    const genZCount = genData.find(g => g.label === "Gen Z")?.count || 0;
    if (genZCount > 0) {
      list.push({ title: "3. Gen Z Flight Risk", detail: `${genZCount} Gen Z employees need intervention.`, icon: "🚀", border: "#3b82f6", bg: "#eff6ff" });
    }
    if (list.length === 0) {
      list.push({ title: "Stable Condition", detail: "No major risk indicators detected at this time.", icon: "🛡️", border: "#22c55e", bg: "#f0fdf4" });
    }
    return list.slice(0, 3);
  }, [belowCliff, withOT.length, genData]);

  if (data.length === 0) {
    return (
      <div className="text-center py-[60px] px-5">
        <div className="text-5xl mb-4">📊</div>
        <div className="font-display text-xl font-bold text-brand-dark mb-2">Ready to Analyze</div>
        <div className="text-sm text-slate-400">Upload your CSV or click "Use Sample Data" above to see the full dashboard.</div>
      </div>
    );
  }

  return (
    <div>
      {/* Edit Modal */}
      {editingEmp && (
        <EditModal employee={editingEmp} onSave={handleSaveEdit} onClose={() => setEditingEmp(null)} />
      )}

      {/* Filters */}
      <div className="bg-white rounded-[14px] p-[14px_18px] mb-[18px] border-[1.5px] border-slate-100 flex flex-wrap gap-3">
        {[
          { label: "Department", values: depts,         cur: deptF,   set: setDeptF },
          { label: "Generation", values: ["All","Gen Z","Millennial","Senior"], cur: genF, set: setGenF },
          { label: "Status",     values: ["All","Resigned","Active","High Risk"], cur: statusF, set: setStatusF },
          { label: "Overtime",   values: ["All","Yes","No"], cur: otF, set: setOtF },
        ].map(f => (
          <div key={f.label}>
            <div className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mb-1.5">{f.label}</div>
            <div className="flex gap-1 flex-wrap">
              {f.values.map(v => <FilterBtn key={v} val={v} cur={f.cur} onSet={f.set} />)}
            </div>
          </div>
        ))}
      </div>

            {/* KPIs */}
      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-[18px]">
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
      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-[14px] mb-[14px]">
        
        {/* 1. Attrition by Dept */}
        <div className="bg-white rounded-[14px] p-[16px_18px] border-[1.5px] border-slate-100">
          <div className="font-bold text-[13px] text-brand-dark mb-0.5">Attrition by Department</div>
          <div className="text-[10px] text-slate-400 mb-3">% at-risk per dept</div>
          <BarChart
            data={deptStats} valueKey="rate" labelKey="dept"
            colorFn={d => Number(d.rate) > 0.7 ? appConfig.colors.high : Number(d.rate) > 0.4 ? appConfig.colors.medium : appConfig.colors.low}
          />
        </div>

        {/* 2. Workforce Status (Donut) */}
        <div className="bg-white rounded-[14px] p-[16px_18px] border-[1.5px] border-slate-100 flex flex-col items-center">
          <div className="font-bold text-[13px] text-brand-dark mb-0.5 self-start">Workforce Status</div>
          <div className="text-[10px] text-slate-400 mb-3 self-start">{total} employees</div>
          
          <DonutChart data={[
            { label: "Resigned",  value: resigned,  color: appConfig.colors.high },
            { label: "High Risk", value: highRisk,  color: appConfig.colors.medium },
            { label: "Active",    value: active,    color: appConfig.colors.low },
          ]} size={160} /> 
          
          <div className="flex gap-2.5 mt-4 flex-wrap justify-center">
            {[
              { l: "Resigned", c: appConfig.colors.high, v: resigned },
              { l: "High Risk", c: appConfig.colors.medium, v: highRisk },
              { l: "Active", c: appConfig.colors.low, v: active }
            ].map(x => (
              <div key={x.l} className="flex items-center gap-1">
                <div className="w-[7px] h-[7px] rounded-full" style={{ background: x.c }} />
                <span className="text-[10px] text-slate-500">{x.l} ({x.v})</span>
              </div>
            ))}
          </div>
        </div>

        {/* 3. By Generation */}
        <div className="bg-white rounded-[14px] p-[16px_18px] border-[1.5px] border-slate-100">
          <div className="font-bold text-[13px] text-brand-dark mb-0.5">By Generation</div>
          <div className="text-[10px] text-slate-400 mb-3">Gen Z · Millennial · Senior</div>
          <BarChart
            data={genData} valueKey="rate" labelKey="label"
            colorFn={d => Number(d.rate) > 0.7 ? appConfig.colors.high : Number(d.rate) > 0.4 ? appConfig.colors.medium : appConfig.colors.low}
          />
          {genZCrisis && !dismissedAlerts.has("genZ") && (
            <div className="mt-2 rounded-lg p-[7px_10px] border flex justify-between items-start gap-1.5" style={{ background: `${appConfig.colors.high}22`, borderColor: appConfig.colors.high }}>
              <span className="text-[10px] font-bold" style={{ color: appConfig.colors.high }}>
                ⚠️ Gen Z Crisis: {(genZCrisis.rate * 100).toFixed(0)}% attrition — mentorship gap detected
              </span>
              <button onClick={() => dismissAlert("genZ")} className="bg-transparent border-none cursor-pointer text-sm leading-none shrink-0" style={{ color: appConfig.colors.high }}>×</button>
            </div>
          )}
        </div>
      </div>

      {/* Charts Row 2 - Executive Summary */}
      <div className="bg-white rounded-[14px] p-[20px_24px] border-[1.5px] border-slate-100 mb-[18px] flex gap-6 items-center flex-wrap">
        <div className="flex-1 min-w-[300px]">
          <div className="flex items-center gap-2 mb-1.5">
             <div className="px-2 py-1 rounded-md text-[11px] font-extrabold tracking-widest" style={{ background: `${appConfig.colors.high}22`, color: appConfig.colors.high }}>AI INSIGHT</div>
             <div className="font-bold text-sm text-brand-dark">Top Attrition Drivers</div>
          </div>
          <div className="text-xs text-slate-500 leading-relaxed">
            Based on the analysis of <strong>{total}</strong> employee records, our algorithm detected 3 main patterns driving the highest retention risk in your company:
          </div>
          {flightRisk > 50 && (
            <div className="mt-2 text-[10px]" style={{ color: appConfig.colors.high }}>
              💡 Tip: You can adjust the risk threshold in the settings menu (⚙️) to see the impact on risk color. 
            </div>
          )}
        </div>

        <div className="flex-[2_1_400px] grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
          {drivers.map((item, index) => (
            <div key={index} className="p-4 rounded-[16px] flex flex-col gap-1 shadow-[0_4px_12px_rgba(15,23,42,0.03)] border" style={{ background: item.bg, borderColor: `${item.border}33`, borderLeftWidth: '5px', borderLeftColor: item.border }}>
              <div className="flex justify-between items-center">
                <div className="text-xs font-extrabold text-brand-navy tracking-tight">
                  {item.title}
                </div>
                <span className="text-base">{item.icon}</span>
              </div>
              <div className="text-[11px] text-slate-500 leading-snug font-medium">
                {item.detail}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Employee Table */}
      <div className="bg-white rounded-[14px] p-[16px_18px] border-[1.5px] border-slate-100">
        
        {/* Header Table (Search & Export) */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3.5 gap-3">
          <div className="font-bold text-[13px] text-brand-dark">
            Employee Records <span className="text-[11px] font-medium text-slate-400">({filtered.length} records)</span>
          </div>
          <div className="flex gap-2 items-center w-full sm:w-auto">
            <input
              type="text"
              placeholder="🔍 Search name, dept, ID..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="p-[6px_12px] rounded-lg border-[1.5px] border-slate-200 text-xs text-brand-navy bg-slate-50 outline-none flex-1 min-w-0 sm:w-[200px] focus:border-brand-amber transition-colors"
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
              className="p-[6px_13px] rounded-lg border-[1.5px] border-slate-200 bg-slate-50 text-xs text-slate-600 font-semibold cursor-pointer whitespace-nowrap hover:bg-slate-100 shrink-0 transition-colors"
            >
              ⬇ Export CSV
            </button>
          </div>
        </div>
        
        <div className="w-full overflow-x-auto rounded-xl">
          <table className="w-full min-w-[800px] border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50">
                {["ID","Name","Dept","Gen","Salary","OT","Satisfaction","Status","Tenure","Risk %","Edit"].map(h => (
                  <th key={h} className="p-[8px_10px] text-left text-slate-500 font-bold text-[10px] uppercase tracking-wider border-b-2 border-slate-100 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map((d, i) => {
                const gen = d.Generation || "Unknown";
                const genClass = gen === "Gen Z" ? "bg-amber-100 text-amber-800" : gen === "Millennial" ? "bg-blue-50 text-blue-700" : "bg-green-50 text-green-800";
                const statusBg = d.AttritionStatus === "Resigned" ? "bg-red-50" : d.AttritionStatus === "High Risk" ? "bg-amber-50" : "bg-green-50";
                
                return (
                  <tr key={d.EmployeeID || i} className={`border-b border-slate-50 transition-colors ${i % 2 === 0 ? "bg-white" : "bg-[#fafafa]"}`}>
                    <td className="p-[7px_10px] text-slate-400 text-[11px]">{d.EmployeeID}</td>
                    <td className="p-[7px_10px] text-brand-navy font-medium">{d.FirstName} {d.LastName}</td>
                    <td className="p-[7px_10px] text-slate-600">{d.Department}</td>
                    <td className="p-[7px_10px]">
                      <span className={`px-[7px] py-[2px] rounded-full text-[10px] font-bold ${genClass}`}>{gen}</span>
                    </td>
                    <td className={`p-[7px_10px] font-semibold ${d.MonthlySalary < cliff ? "text-brand-red" : "text-green-600"}`}>
                      {fmt(d.MonthlySalary || 0)}
                    </td>
                    <td className={`p-[7px_10px] font-bold ${d.OvertimeStatus === "Yes" ? "text-brand-red" : "text-green-600"}`}>{d.OvertimeStatus}</td>
                    <td className="p-[7px_10px]">
                      <div className="flex items-center gap-1.5">
                        <div className="w-[36px] h-[5px] rounded-[3px] bg-slate-100 overflow-hidden">
                          <div className="h-full rounded-[3px]" style={{ width: `${((d.JobSatisfaction || 0) / 10) * 100}%`, background: (d.JobSatisfaction || 0) <= 3 ? "#ef4444" : (d.JobSatisfaction || 0) <= 6 ? "#f59e0b" : "#22c55e" }} />
                        </div>
                        <span className="text-slate-600 text-[11px]">{d.JobSatisfaction}/10</span>
                      </div>
                    </td>
                    <td className="p-[7px_10px]">
                      <span className={`px-[8px] py-[2px] rounded-full text-[10px] font-bold ${statusBg}`} style={{ color: getStatusColor(d.AttritionStatus) }}>
                        {d.AttritionStatus}
                      </span>
                    </td>
                    <td className="p-[7px_10px] text-slate-500">{d.YearsAtCompany}y</td>
                    <td className="p-[7px_10px]">
                      <div className="flex items-center gap-1.5">
                        <div className="w-[36px] h-[5px] rounded-[3px] bg-slate-100 overflow-hidden">
                          <div className="h-full rounded-[3px]" style={{ width: `${d.RiskPct || 0}%`, background: d.RiskColor || (d.RiskLevel === "High" ? "#ef4444" : d.RiskLevel === "Medium" ? "#eab308" : "#22c55e") }} />
                        </div>
                        <span className="text-[11px] font-bold" style={{ color: d.RiskColor || (d.RiskLevel === "High" ? "#ef4444" : d.RiskLevel === "Medium" ? "#eab308" : "#22c55e") }}>{d.RiskPct || 0}%</span>
                      </div>
                    </td>
                    <td className="p-[7px_10px] text-center"> 
                      <button 
                        onClick={() => setEditingEmp(d)}
                        className="bg-slate-50 border border-slate-200 rounded-md py-[3px] px-2 cursor-pointer text-xs text-slate-500 transition-colors hover:bg-amber-50 hover:border-brand-amber hover:shadow-sm"
                      >
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
          <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
            <div className="text-[11px] text-slate-400">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} records
            </div>
            <div className="flex gap-1">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))} 
                disabled={page === 1}
                className={`p-[5px_12px] rounded-[7px] border-[1.5px] border-slate-200 text-xs font-semibold ${page === 1 ? "bg-slate-50 text-slate-300 cursor-not-allowed" : "bg-white text-slate-600 cursor-pointer hover:bg-slate-50"}`}
              >
                ← Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                .reduce((acc, p, idx, arr) => {
                  if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, idx) =>
                  p === "..." ? (
                    <span key={`ellipsis-${idx}`} className="p-[5px_4px] text-slate-400 text-xs">…</span>
                  ) : (
                    <button 
                      key={p} 
                      onClick={() => setPage(p)}
                      className={`p-[5px_10px] rounded-[7px] border-none text-xs cursor-pointer transition-colors ${p === page ? "bg-brand-amber text-white font-bold shadow-sm" : "bg-slate-100 text-slate-500 font-medium hover:bg-slate-200"}`}
                    >
                      {p}
                    </button>
                  )
                )}
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                disabled={page === totalPages}
                className={`p-[5px_12px] rounded-[7px] border-[1.5px] border-slate-200 text-xs font-semibold ${page === totalPages ? "bg-slate-50 text-slate-300 cursor-not-allowed" : "bg-white text-slate-600 cursor-pointer hover:bg-slate-50"}`}
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
