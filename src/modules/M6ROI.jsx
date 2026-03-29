import { useState, useMemo, useCallback } from "react";
import { useApp, useHRData, useCurrency } from "../context/AppContext";
import { SAMPLE_DATA } from "../utils/sampleData";
import { useModuleData } from "../context/ModuleDataContext";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const GHOST_COSTS = {
  opportunityCost: 0.15,  
  rampUpDrag: 0.10,
  employerBrand: 0.05,   
};

function computeROI({ data, cliff, multiplier, interventions, ghostEnabled }) {
  const src = data;
  const atRisk = src.filter(e => e.AttritionStatus !== "Active");
  const resigned = src.filter(e => e.AttritionStatus === "Resigned");
  const active = src.filter(e => e.AttritionStatus === "Active");
  const total = src.length;

  const avgSalary = src.length > 0 ? Math.round(src.reduce((s, e) => s + (e.MonthlySalary || 0), 0) / src.length) : 4500;
  const avgResigned = resigned.length > 0 ? Math.round(resigned.reduce((s, e) => s + (e.MonthlySalary || 0), 0) / resigned.length) : 4200;

  // Base turnover cost
  const baseTurnoverCost = resigned.length * avgResigned * 12 * multiplier;

  // Ghost costs
  const ghostOpportunity = ghostEnabled ? resigned.length * avgResigned * 12 * GHOST_COSTS.opportunityCost : 0;
  const ghostRampUp = ghostEnabled ? resigned.length * avgResigned * 12 * GHOST_COSTS.rampUpDrag : 0;
  const ghostBrand = ghostEnabled ? resigned.length * avgResigned * 12 * GHOST_COSTS.employerBrand : 0;
  const totalGhost = ghostOpportunity + ghostRampUp + ghostBrand;
  const totalTurnoverCost = baseTurnoverCost + totalGhost;

  // Intervention 1: Salary Adjustment
  const belowCliff = src.filter(e => (e.MonthlySalary || 0) < cliff);
  const salaryFixCost = belowCliff.reduce((s, e) => s + Math.max(0, cliff - (e.MonthlySalary || 0)) * 12, 0) * (interventions.salary / 100);
  const salaryRetained = Math.round(resigned.length * (interventions.salary / 100) * 0.45);
  const salarySavings = salaryRetained * avgResigned * 12 * multiplier;

  // Intervention 2: Overtime Cap (hiring buffer staff)
  const withOT = src.filter(e => e.OvertimeStatus === "Yes").length;
  const newHireCount = Math.ceil(withOT * (interventions.overtime / 100) * 0.2);
  const overtimeCost = newHireCount * cliff * 12;
  const overtimeRetained = Math.round(resigned.length * (interventions.overtime / 100) * 0.35);
  const overtimeSavings = overtimeRetained * avgResigned * 12 * multiplier;

  // Intervention 3: Mentorship Program
  const genZCount = src.filter(e => Number(e.Age) < 26).length;
  const mentorshipCost = Math.round(genZCount * 500 * (interventions.mentorship / 100));
  const mentorshipRetained = Math.round(genZCount * (interventions.mentorship / 100) * 0.6);
  const mentorshipSavings = mentorshipRetained * avgResigned * 12 * multiplier;

  const totalInvestment = salaryFixCost + overtimeCost + mentorshipCost;
  const totalSavings = salarySavings + overtimeSavings + mentorshipSavings;
  const netROI = totalSavings - totalInvestment;
  const roiPct = totalInvestment > 0 ? ((netROI / totalInvestment) * 100).toFixed(0) : 0;
  const breakEvenMonth = totalInvestment > 0 && totalSavings > 0
    ? Math.ceil((totalInvestment / (totalSavings / 12)))
    : 0;
  const totalRetained = salaryRetained + overtimeRetained + mentorshipRetained;
  const newAttritionRate = total > 0
    ? Math.max(0, (((atRisk.length - totalRetained) / total) * 100)).toFixed(1)
    : 0;

  return {
    avgSalary, avgResigned, total, atRisk: atRisk.length, resigned: resigned.length,
    baseTurnoverCost, ghostOpportunity, ghostRampUp, ghostBrand, totalGhost, totalTurnoverCost,
    salaryFixCost, salaryRetained, salarySavings,
    overtimeCost, newHireCount, overtimeRetained, overtimeSavings,
    mentorshipCost, mentorshipRetained, mentorshipSavings, genZCount,
    totalInvestment, totalSavings, netROI, roiPct, breakEvenMonth,
    totalRetained, newAttritionRate, cliff, multiplier,
    belowCliff: belowCliff.length, withOT,
  };
}

// ── AI Executive Summary ──
async function fetchExecutiveSummary(roi, interventions, company) {
  const prompt = `You are writing an executive summary for ${company?.name || "the company"}'s leadership team.

Retention Investment Analysis:
- Current annual turnover cost: ${roi.totalTurnoverCost.toLocaleString()} (including ghost costs: ${roi.totalGhost.toLocaleString()})
- Total proposed investment: ${roi.totalInvestment.toLocaleString()}/year
- Projected savings: ${roi.totalSavings.toLocaleString()}/year
- Net ROI: ${roi.roiPct}% | Break-even: Month ${roi.breakEvenMonth}
- Employees retained: ${roi.totalRetained} of ${roi.resigned} at-risk
- New projected attrition rate: ${roi.newAttritionRate}% (down from ${roi.total > 0 ? ((roi.atRisk / roi.total) * 100).toFixed(1) : 0}%)

Interventions selected:
1. Salary Adjustment (${interventions.salary}% implementation): Fix ${roi.belowCliff} employees below cliff — costs ${roi.salaryFixCost.toLocaleString()}/yr, saves ${roi.salarySavings.toLocaleString()}/yr
2. Overtime Cap / Hiring Buffer (${interventions.overtime}% implementation): Hire ${roi.newHireCount} buffer staff — costs ${roi.overtimeCost.toLocaleString()}/yr, saves ${roi.overtimeSavings.toLocaleString()}/yr
3. Mentorship Program (${interventions.mentorship}% implementation): For ${roi.genZCount} Gen Z employees — costs ${roi.mentorshipCost.toLocaleString()}/yr, saves ${roi.mentorshipSavings.toLocaleString()}/yr

Write a crisp, boardroom-ready executive summary in 3 paragraphs:
1. The business case: what inaction costs vs what investment costs
2. The proposed interventions and their expected impact
3. The recommendation: what leadership must approve and by when

Tone: confident, data-driven, C-suite level. No bullet points. Under 200 words.`;

  const response = await fetch("https://gemini-api-amber-iota.vercel.app/api/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: [{ content: prompt }] }),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  return data.content?.[0]?.text || data.text || data.response || "Unable to generate summary.";
}

// ── Gantt Chart SVG ──
function GanttChart({ interventions, breakEvenMonth }) {
  const tasks = [
    // Month 1 — Diagnose
    { task: "Audit Workload Distribution", phase: "Diagnose", start: 0, end: 1, color: "#1e293b", active: interventions.overtime > 0 },
    { task: "Salary Market Benchmarking", phase: "Diagnose", start: 0, end: 1, color: "#1e293b", active: interventions.salary > 0 },
    { task: "Design Exit Interview Template", phase: "Diagnose", start: 0, end: 1, color: "#1e293b", active: true },
    { task: "Identify Gen Z Mentorship Gaps", phase: "Diagnose", start: 0, end: 1, color: "#1e293b", active: interventions.mentorship > 0 },
    // Month 2 — Design
    { task: "Open Headcount Requisitions", phase: "Design", start: 1, end: 2, color: "#10b981", active: interventions.overtime > 0 },
    { task: "Present Adjusted Salary Bands", phase: "Design", start: 1, end: 2, color: "#10b981", active: interventions.salary > 0 },
    { task: "Begin Structured Exit Interviews", phase: "Design", start: 1, end: 2, color: "#10b981", active: true },
    { task: "Launch Mentorship Pilot", phase: "Design", start: 1, end: 2, color: "#10b981", active: interventions.mentorship > 0 },
    // Month 3 — Execute
    { task: "Enforce Overtime Caps", phase: "Execute", start: 2, end: 3, color: "#ef4444", active: interventions.overtime > 0 },
    { task: "Implement Salary Adjustments", phase: "Execute", start: 2, end: 3, color: "#ef4444", active: interventions.salary > 0 },
    { task: "Publish First Attrition Report", phase: "Execute", start: 2, end: 3, color: "#ef4444", active: true },
    { task: "Expand Mentorship Org-wide", phase: "Execute", start: 2, end: 3, color: "#ef4444", active: interventions.mentorship > 0 },
  ].filter(t => t.active);

  const W = 520, rowH = 22, pad = { l: 180, r: 20, t: 30, b: 40 };
  const months = 3;
  const colW = (W - pad.l - pad.r) / months;
  const H = pad.t + tasks.length * rowH + pad.b;

  const phaseColors = { Diagnose: "#1e293b", Design: "#10b981", Execute: "#ef4444" };

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
      {/* Month headers */}
      {["Month 1\nDiagnose", "Month 2\nDesign", "Month 3\nExecute"].map((m, i) => {
        const phase = ["Diagnose", "Design", "Execute"][i];
        return (
          <g key={i}>
            <rect x={pad.l + i * colW} y={0} width={colW} height={pad.t - 4} rx={4}
              fill={phaseColors[phase]} opacity={0.9} />
            <text x={pad.l + i * colW + colW / 2} y={12} textAnchor="middle" fontSize={9} fill="#fff" fontWeight="700">Month {i + 1}</text>
            <text x={pad.l + i * colW + colW / 2} y={23} textAnchor="middle" fontSize={8} fill="#fff" opacity={0.85}>{phase}</text>
          </g>
        );
      })}

      {/* Grid */}
      {[0, 1, 2, 3].map(i => (
        <line key={i} x1={pad.l + i * colW} y1={pad.t} x2={pad.l + i * colW} y2={H - pad.b}
          stroke="#f1f5f9" strokeWidth={1} />
      ))}

      {/* Tasks */}
      {tasks.map((t, i) => {
        const y = pad.t + i * rowH;
        const x = pad.l + t.start * colW + 2;
        const w = (t.end - t.start) * colW - 4;
        return (
          <g key={t.task}>
            <text x={pad.l - 6} y={y + rowH * 0.65} textAnchor="end" fontSize={8.5} fill="#475569"
              style={{ fontFamily: "'DM Sans', sans-serif" }}>
              {t.task.length > 26 ? t.task.slice(0, 25) + "…" : t.task}
            </text>
            <rect x={x} y={y + 3} width={w} height={rowH - 7} rx={4}
              fill={t.color} opacity={0.85} />
            <text x={x + w / 2} y={y + rowH * 0.65} textAnchor="middle" fontSize={7.5} fill="#fff" fontWeight="600">
              {t.phase}
            </text>
          </g>
        );
      })}

      {/* Break-even marker */}
      {breakEvenMonth > 0 && breakEvenMonth <= 3 && (
        <g>
          <line
            x1={pad.l + (breakEvenMonth / 3) * (W - pad.l - pad.r)}
            y1={pad.t}
            x2={pad.l + (breakEvenMonth / 3) * (W - pad.l - pad.r)}
            y2={H - pad.b}
            stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4,3" />
          <text
            x={pad.l + (breakEvenMonth / 3) * (W - pad.l - pad.r) + 3}
            y={pad.t + 10}
            fontSize={8} fill="#b45309" fontWeight="700">Break-even</text>
        </g>
      )}

            {/* Bottom month axis */}
      <line x1={pad.l} y1={H - pad.b + 4} x2={W - pad.r} y2={H - pad.b + 4} stroke="#e2e8f0" strokeWidth={1} />
      {([0.5, 1.5, 2.5]).map((m, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() + i);
        const label = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
        return (
          <text key={i} x={pad.l + m * colW} y={H - pad.b + 16} textAnchor="middle" fontSize={8} fill="#94a3b8">
            {label}
          </text>
        );
      })}
    </svg>
  );
}

// ── ROI Timeline Chart ──
function ROITimeline({ roi, currSymbol = "$" }) {
  const months = 12;
  const monthlyInvestment = roi.totalInvestment / 12;
  const monthlySavings = roi.totalSavings / 12;
  const W = 400, H = 130, pad = { l: 48, r: 16, t: 16, b: 28 };

  let cumInvest = 0, cumSave = 0;
  const points = Array.from({ length: months + 1 }, (_, i) => {
    cumInvest += monthlyInvestment;
    cumSave += monthlySavings;
    return { m: i, invest: cumInvest, save: cumSave, net: cumSave - cumInvest };
  });

  const maxVal = Math.max(...points.map(p => Math.max(Math.abs(p.invest), Math.abs(p.save))), 1);
  const toX = m => pad.l + (m / months) * (W - pad.l - pad.r);
  const toY = v => pad.t + (H - pad.t - pad.b) * (1 - (v + maxVal) / (2 * maxVal));

  const investPath = points.map((p, i) => `${i === 0 ? "M" : "L"}${toX(p.m)},${toY(p.invest)}`).join(" ");
  const savePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${toX(p.m)},${toY(p.save)}`).join(" ");

  // Break-even x
  const bex = roi.breakEvenMonth > 0 ? toX(Math.min(roi.breakEvenMonth, months)) : null;

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
      {/* Zero line */}
      <line x1={pad.l} y1={toY(0)} x2={W - pad.r} y2={toY(0)} stroke="#e2e8f0" strokeWidth={1} strokeDasharray="3,2" />
      {/* Paths */}
      <path d={investPath} fill="none" stroke="#ef4444" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <path d={savePath} fill="none" stroke="#22c55e" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {/* Break-even */}
      {bex && (
        <g>
          <line x1={bex} y1={pad.t} x2={bex} y2={H - pad.b} stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4,3" />
          <text x={bex + 3} y={pad.t + 10} fontSize={8} fill="#b45309" fontWeight="700">M{roi.breakEvenMonth}</text>
        </g>
      )}
      {/* Axis */}
      <line x1={pad.l} y1={pad.t} x2={pad.l} y2={H - pad.b} stroke="#e2e8f0" strokeWidth={1} />
      <line x1={pad.l} y1={H - pad.b} x2={W - pad.r} y2={H - pad.b} stroke="#e2e8f0" strokeWidth={1} />
      {/* Labels */}
      <text x={pad.l - 4} y={toY(maxVal) + 4} textAnchor="end" fontSize={7} fill="#94a3b8">{currSymbol}{(maxVal / 1000).toFixed(0)}K</text>
      <text x={pad.l - 4} y={toY(0) + 4} textAnchor="end" fontSize={7} fill="#94a3b8">{currSymbol}0</text>
      {[0, 3, 6, 9, 12].map(m => (
        <text key={m} x={toX(m)} y={H - 6} textAnchor="middle" fontSize={7} fill="#94a3b8">M{m}</text>
      ))}
    </svg>
  );
}

// ── Intervention Slider ──
function InterventionSlider({ icon, title, desc, value, onChange, cost, savings, retained, color, bg, border, currSymbol = "$" }) {
  const net = savings - cost;
  return (
    <div style={{ background: bg, borderRadius: 14, padding: "18px 20px", border: `1.5px solid ${border}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div style={{ fontSize: 22 }}>{icon}</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}>{title}</div>
          <div style={{ fontSize: 11, color: "#94a3b8" }}>{desc}</div>
        </div>
        <div style={{ marginLeft: "auto", fontSize: 20, fontWeight: 800, color, fontFamily: "'Playfair Display',Georgia,serif" }}>
          {value}%
        </div>
      </div>

      <input type="range" min={0} max={100} step={10} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: color, marginBottom: 12 }} />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        {[
          { label: "Annual Cost", value: `${currSymbol}${(cost / 1000).toFixed(0)}K`, color: "#ef4444" },
          { label: "Annual Savings", value: `${currSymbol}${(savings / 1000).toFixed(0)}K`, color: "#22c55e" },
          { label: "Net", value: net >= 0 ? `+${currSymbol}${(net / 1000).toFixed(0)}K` : `-${currSymbol}${(Math.abs(net) / 1000).toFixed(0)}K`, color: net >= 0 ? "#22c55e" : "#ef4444" },
        ].map((m) => (
          <div key={m.label} style={{ background: "#fff", borderRadius: 8, padding: "7px 10px", textAlign: "center" }}>
            <div style={{ fontSize: 9, color: "#94a3b8", marginBottom: 2 }}>{m.label}</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: m.color }}>{m.value}</div>
          </div>
        ))}
      </div>

      {retained > 0 && (
        <div style={{ marginTop: 8, fontSize: 11, color, fontWeight: 700 }}>
          ✓ Est. {retained} employee(s) retained
        </div>
      )}
    </div>
  );
}

// ── MAIN M6 ──
export default function M6ROI() {
  const { company } = useApp();
  const { data } = useHRData();
  const { config: currCfg } = useCurrency();
const cliff = company?.salaryCliff || 5000;
const currSymbol = currCfg?.symbol || "$";
  const multiplier = company?.replacementMultiplier || 1.5;
  const { state: m6State, update: updateM6 } = useModuleData("m6");

const interventions = m6State.interventions || { salary: 70, overtime: 60, mentorship: 80 };
const ghostEnabled  = m6State.ghostEnabled  ?? false;
const activeTab     = m6State.activeTab     || "calculator";

const setI = useCallback((key, val) => {
  updateM6({ interventions: { ...interventions, [key]: val } });
}, [interventions, updateM6]);
const setGhostEnabled = useCallback((v) => {
  updateM6({ ghostEnabled: typeof v === "function" ? v(ghostEnabled) : v });
}, [ghostEnabled, updateM6]);
const setActiveTab = useCallback((v) => updateM6({ activeTab: v }), [updateM6]);
const [aiSummary, setAiSummary] = useState("");
const [aiLoading, setAiLoading] = useState(false);
 const setI = useCallback((key, val) => setInterventions(p => ({ ...p, [key]: val })), []);
  const roi = useMemo(() => computeROI({
    data, cliff, multiplier, interventions, ghostEnabled
  }), [data, cliff, multiplier, interventions, ghostEnabled]);

  const handleAI = useCallback(async () => {
    setAiLoading(true);
    setAiSummary("");
    try {
      const text = await fetchExecutiveSummary(roi, interventions, company);
      setAiSummary(text);
    } catch (err) {
      setAiSummary(`⚠️ AI unavailable: ${err?.message || "Check connection and retry."}`);
    } finally {
      setAiLoading(false);
    }
  }, [roi, interventions, company]);
  const TABS = [
    { id: "calculator", label: "🧮 ROI Calculator" },
    { id: "gantt", label: "📅 90-Day Action Plan" },
    { id: "summary", label: "📄 Executive Summary" },
  ];

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            style={{
              padding: "9px 18px", borderRadius: 10, cursor: "pointer",
              background: activeTab === t.id ? "linear-gradient(135deg,#f59e0b,#ef4444)" : "#fff",
              color: activeTab === t.id ? "#fff" : "#64748b",
              fontWeight: activeTab === t.id ? 700 : 500, fontSize: 13,
              border: `1.5px solid ${activeTab === t.id ? "transparent" : "#e2e8f0"}`,
              transition: "all 0.15s",
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: CALCULATOR ── */}
      {activeTab === "calculator" && (
        <div>
          {/* Ghost Cost Toggle */}
          <div style={{ background: "#fff", borderRadius: 13, padding: "14px 18px", border: "1.5px solid #f1f5f9", marginBottom: 18, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}>👻 Ghost Cost Mode</div>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>Include hidden costs: opportunity cost, ramp-up drag, employer brand erosion</div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {ghostEnabled && (
                <span style={{ fontSize: 11, color: "#8b5cf6", fontWeight: 700 }}>
                  +${(roi.totalGhost / 1000).toFixed(0)}K hidden costs revealed
                </span>
              )}
              <button onClick={() => setGhostEnabled(p => !p)}
                style={{
                  padding: "8px 18px", borderRadius: 9, border: "none", cursor: "pointer",
                  background: ghostEnabled ? "#8b5cf6" : "#f1f5f9",
                  color: ghostEnabled ? "#fff" : "#64748b",
                  fontWeight: 700, fontSize: 12, transition: "all 0.2s",
                }}>
                {ghostEnabled ? "👻 Ghost Costs ON" : "Show Ghost Costs"}
              </button>
            </div>
          </div>

          {/* Current State KPIs */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(175px,1fr))", gap: 12, marginBottom: 18 }}>
            {[
              { label: "Current Turnover Cost", value: `$${(roi.baseTurnoverCost / 1000).toFixed(0)}K`, sub: "Direct replacement costs", color: "#ef4444", bg: "#fef2f2" },
              ghostEnabled && { label: "Ghost Costs", value: `+$${(roi.totalGhost / 1000).toFixed(0)}K`, sub: "Hidden costs (opp + ramp + brand)", color: "#8b5cf6", bg: "#f5f3ff" },
              { label: "Total Cost of Inaction", value: `$${(roi.totalTurnoverCost / 1000).toFixed(0)}K`, sub: "If nothing changes", color: "#dc2626", bg: "#fef2f2" },
              { label: "Projected Savings", value: `$${(roi.totalSavings / 1000).toFixed(0)}K`, sub: "With selected interventions", color: "#22c55e", bg: "#f0fdf4" },
              { label: "Total Investment", value: `$${(roi.totalInvestment / 1000).toFixed(0)}K`, sub: "Annual cost of interventions", color: "#f59e0b", bg: "#fffbeb" },
              { label: "Net ROI", value: `${roi.roiPct}%`, sub: `Break-even: Month ${roi.breakEvenMonth || "N/A"}`, color: Number(roi.roiPct) > 0 ? "#22c55e" : "#ef4444", bg: Number(roi.roiPct) > 0 ? "#f0fdf4" : "#fef2f2" },
            ].filter(Boolean).map((k) => (
              <div key={k.label} style={{ background: k.bg, borderRadius: 13, padding: "14px 16px", border: `1.5px solid ${k.color}22`, position: "relative", overflow: "hidden" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>{k.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: k.color, fontFamily: "'Playfair Display',Georgia,serif", lineHeight: 1.1 }}>{k.value}</div>
                <div style={{ fontSize: 10, color: "#64748b", marginTop: 3 }}>{k.sub}</div>
              </div>
            ))}
          </div>

          {/* Ghost Cost Breakdown */}
          {ghostEnabled && (
            <div style={{ background: "#f5f3ff", borderRadius: 14, padding: "16px 18px", border: "1.5px solid #ddd6fe", marginBottom: 18 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#7c3aed", marginBottom: 12 }}>👻 Ghost Cost Breakdown</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                {[
                  { label: "Opportunity Cost (Empty Chair)", value: roi.ghostOpportunity, desc: "Revenue lost while seats are vacant" },
                  { label: "Ramp-Up Efficiency Drag", value: roi.ghostRampUp, desc: "3–5 months below-capacity productivity" },
                  { label: "Employer Brand Erosion", value: roi.ghostBrand, desc: "Premium paid to attract talent after exits" },
                ].map((g) => (
                  <div key={g.label} style={{ background: "#fff", borderRadius: 10, padding: "12px 14px" }}>
                    <div style={{ fontSize: 10, color: "#7c3aed", fontWeight: 700, marginBottom: 4 }}>{g.label}</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#8b5cf6", fontFamily: "'Playfair Display',Georgia,serif" }}>${(g.value / 1000).toFixed(0)}K</div>
                    <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 3 }}>{g.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Intervention Sliders */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14, marginBottom: 18 }}>
            <InterventionSlider
              icon="💰" title="Salary Adjustment" value={interventions.salary}
              desc={`${roi.belowCliff} employees below ${currSymbol}${roi.cliff.toLocaleString()} cliff`}
              onChange={v => setI("salary", v)}
              cost={roi.salaryFixCost} savings={roi.salarySavings} retained={roi.salaryRetained}
              color="#ef4444" bg="#fef2f2" border="#fecaca" currSymbol={currSymbol}
            />
            <InterventionSlider
              icon="⏱️" title="Overtime Cap + Buffer Hiring" value={interventions.overtime}
              desc={`${roi.withOT} employees on overtime · ${roi.newHireCount} buffer hires needed`}
              onChange={v => setI("overtime", v)}
              cost={roi.overtimeCost} savings={roi.overtimeSavings} retained={roi.overtimeRetained}
              color="#f97316" bg="#fff7ed" border="#fed7aa" currSymbol={currSymbol}
            />
            <InterventionSlider
              icon="🎓" title="Mentorship Program" value={interventions.mentorship}
              desc={`${roi.genZCount} Gen Z employees · structured onboarding`}
              onChange={v => setI("mentorship", v)}
              cost={roi.mentorshipCost} savings={roi.mentorshipSavings} retained={roi.mentorshipRetained}
              color="#8b5cf6" bg="#f5f3ff" border="#ddd6fe" currSymbol={currSymbol}
            />
          </div>

          {/* ROI Timeline Chart */}
          <div style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", border: "1.5px solid #f1f5f9", marginBottom: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}>📈 12-Month ROI Timeline</div>
                <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>Cumulative investment vs savings over 12 months</div>
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                {[{ label: "Investment", color: "#ef4444" }, { label: "Savings", color: "#22c55e" }].map(l => (
                  <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <div style={{ width: 16, height: 3, background: l.color, borderRadius: 2 }} />
                    <span style={{ fontSize: 10, color: "#64748b" }}>{l.label}</span>
                  </div>
                ))}
              </div>
            </div>
            <ROITimeline roi={roi} currSymbol={currSymbol} />
            {roi.breakEvenMonth > 0 && (
              <div style={{ marginTop: 12, background: roi.breakEvenMonth <= 6 ? "#f0fdf4" : "#fffbeb", borderRadius: 8, padding: "8px 12px", border: `1px solid ${roi.breakEvenMonth <= 6 ? "#bbf7d0" : "#fde68a"}` }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: roi.breakEvenMonth <= 6 ? "#16a34a" : "#b45309" }}>
                  {roi.breakEvenMonth <= 6 ? "✅" : "⚠️"} Break-even at Month {roi.breakEvenMonth} — {roi.breakEvenMonth <= 3 ? "excellent" : roi.breakEvenMonth <= 6 ? "good" : "acceptable"} ROI timeline
                </span>
              </div>
            )}
          </div>

          {/* Before vs After */}
          <div style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", border: "1.5px solid #f1f5f9" }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", marginBottom: 14 }}>Before vs After Comparison</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 14, alignItems: "center" }}>
              <div style={{ background: "#fef2f2", borderRadius: 12, padding: "16px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#dc2626", marginBottom: 10, textTransform: "uppercase" }}>❌ Current State</div>
                {[
                  { label: "Attrition Rate", value: `${roi.total > 0 ? ((roi.atRisk / roi.total) * 100).toFixed(1) : 0}%` },
                  { label: "Annual Turnover Cost", value: `$${(roi.totalTurnoverCost / 1000).toFixed(0)}K` },
                  { label: "At-Risk Employees", value: roi.atRisk },
                  { label: "Avg Satisfaction", value: roi.total > 0 ? `${(data.reduce((s,e) => s + (e.JobSatisfaction||0), 0) / roi.total).toFixed(1)}/10` : "—" },
                ].map((r, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: "#64748b" }}>{r.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#dc2626" }}>{r.value}</span>
                  </div>
                ))}
              </div>
              <div style={{ textAlign: "center", fontSize: 24 }}>→</div>
              <div style={{ background: "#f0fdf4", borderRadius: 12, padding: "16px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#16a34a", marginBottom: 10, textTransform: "uppercase" }}>✅ After Intervention</div>
                {[
                  { label: "Attrition Rate", value: `${roi.newAttritionRate}%` },
                  { label: "Annual Savings", value: `$${(roi.totalSavings / 1000).toFixed(0)}K` },
                  { label: "Employees Retained", value: `+${roi.totalRetained}` },
                  { label: "Est. Satisfaction", value: roi.total > 0 ? `${Math.min(10, (data.reduce((s,e) => s + (e.JobSatisfaction||0), 0) / roi.total + 1.5)).toFixed(1)}/10` : "—" },
                ].map((r, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: "#64748b" }}>{r.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#16a34a" }}>{r.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: GANTT ── */}
      {activeTab === "gantt" && (
        <div>
          <div style={{ background: "#fff", borderRadius: 14, padding: "20px 22px", border: "1.5px solid #f1f5f9", marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", marginBottom: 4 }}>📅 90-Day Action Plan</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6 }}>
              Auto-generated based on your selected interventions. Tasks adapt to what you've enabled.
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
              {[
                { label: `Salary: ${interventions.salary}%`, color: "#ef4444", active: interventions.salary > 0 },
                { label: `Overtime: ${interventions.overtime}%`, color: "#f97316", active: interventions.overtime > 0 },
                { label: `Mentorship: ${interventions.mentorship}%`, color: "#8b5cf6", active: interventions.mentorship > 0 },
              ].map(b => (
                <span key={b.label} style={{ background: b.active ? b.color : "#f1f5f9", color: b.active ? "#fff" : "#94a3b8", padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                  {b.active ? "✓" : "○"} {b.label}
                </span>
              ))}
            </div>
            <div style={{ overflowX: "auto" }}>
              <GanttChart interventions={interventions} breakEvenMonth={roi.breakEvenMonth} />
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 14, flexWrap: "wrap" }}>
              {[{ label: "Diagnose", color: "#1e293b" }, { label: "Design", color: "#10b981" }, { label: "Execute", color: "#ef4444" }].map(p => (
                <div key={p.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 12, height: 8, borderRadius: 2, background: p.color }} />
                  <span style={{ fontSize: 10, color: "#64748b" }}>{p.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed task breakdown */}
          <div style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", border: "1.5px solid #f1f5f9" }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", marginBottom: 14 }}>Detailed Task Breakdown</div>
            {[
              { phase: "Month 1 — Diagnose", color: "#1e293b", bg: "#f8fafc", tasks: [
                { task: "Audit workload distribution by department", owner: "HR + Operations", active: interventions.overtime > 0 },
                { task: "Conduct salary market benchmarking", owner: "HR + Finance", active: interventions.salary > 0 },
                { task: "Design exit interview template", owner: "HR", active: true },
                { task: "Identify Gen Z employees needing mentorship", owner: "HR + Managers", active: interventions.mentorship > 0 },
              ]},
              { phase: "Month 2 — Design", color: "#10b981", bg: "#f0fdf4", tasks: [
                { task: `Open ${roi.newHireCount} buffer headcount requisitions`, owner: "HR + Dept Heads", active: interventions.overtime > 0 },
                { task: "Present adjusted salary bands to leadership", owner: "HR + Finance", active: interventions.salary > 0 },
                { task: "Begin structured exit interviews", owner: "HR", active: true },
                { task: "Launch mentorship pilot program", owner: "L&D + Managers", active: interventions.mentorship > 0 },
              ]},
              { phase: "Month 3 — Execute", color: "#ef4444", bg: "#fef2f2", tasks: [
                { task: "Enforce overtime caps with dept head approval", owner: "Operations + HR", active: interventions.overtime > 0 },
                { task: `Implement salary raises for ${roi.belowCliff} at-risk employees`, owner: "Finance + HR", active: interventions.salary > 0 },
                { task: "Publish first quarterly attrition report", owner: "HR Analytics", active: true },
                { task: "Expand mentorship org-wide with formal tracking", owner: "L&D", active: interventions.mentorship > 0 },
              ]},
            ].map(phase => (
              <div key={phase.phase} style={{ marginBottom: 14 }}>
                <div style={{ background: phase.color, color: "#fff", borderRadius: 9, padding: "7px 14px", fontSize: 12, fontWeight: 700, marginBottom: 8, display: "inline-block" }}>
                  {phase.phase}
                </div>
                {phase.tasks.filter(t => t.active).map((t, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, background: phase.bg, borderRadius: 8, padding: "8px 12px", marginBottom: 5, border: `1px solid ${phase.color}22` }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: phase.color, flexShrink: 0 }} />
                    <div style={{ flex: 1, fontSize: 12, color: "#1e293b" }}>{t.task}</div>
                    <div style={{ fontSize: 10, color: "#94a3b8", whiteSpace: "nowrap" }}>Owner: {t.owner}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB: EXECUTIVE SUMMARY ── */}
      {activeTab === "summary" && (
        <div>
          {/* Stats bar */}
          <div style={{ background: "#0f172a", borderRadius: 14, padding: "18px 22px", marginBottom: 18, display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 14 }}>
            {[
              { label: "Cost of Inaction", value: `$${(roi.totalTurnoverCost / 1000).toFixed(0)}K/yr`, color: "#ef4444" },
              { label: "Investment", value: `$${(roi.totalInvestment / 1000).toFixed(0)}K/yr`, color: "#f59e0b" },
              { label: "ROI", value: `${roi.roiPct}%`, color: "#22c55e" },
              { label: "Break-even", value: `Month ${roi.breakEvenMonth || "N/A"}`, color: "#3b82f6" },
            ].map((k) => (
              <div key={k.label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 9, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{k.label}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: k.color, fontFamily: "'Playfair Display',Georgia,serif" }}>{k.value}</div>
              </div>
            ))}
          </div>

          <div style={{ background: "#fff", borderRadius: 14, padding: "20px 22px", border: "1.5px solid #f1f5f9", marginBottom: 16 }}>
            <button onClick={handleAI} disabled={aiLoading}
              style={{ width: "100%", padding: "13px", background: aiLoading ? "#f1f5f9" : "linear-gradient(135deg,#0f172a,#1e293b)", color: aiLoading ? "#94a3b8" : "#fff", border: "none", borderRadius: 11, fontSize: 14, fontWeight: 700, cursor: aiLoading ? "not-allowed" : "pointer", marginBottom: aiSummary ? 20 : 0 }}>
              {aiLoading ? "⏳ Writing Executive Summary..." : "✍️ Generate AI Executive Summary for Leadership"}
            </button>

            {aiSummary && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}>Executive Summary</div>
                  <div style={{ fontSize: 10, color: "#94a3b8" }}>Ready for boardroom presentation</div>
                </div>
                <div style={{ background: "#f8fafc", borderRadius: 11, padding: "18px 20px", border: "1.5px solid #e2e8f0", fontSize: 13, color: "#1e293b", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
                  {aiSummary}
                </div>
                <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>
                    Generated by AttritionIQ · {company?.name || "Pulse Digital"} · {new Date().toLocaleDateString()}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Cross-module reminder */}
          <div style={{ background: "#fff8f0", borderRadius: 14, padding: "16px 18px", border: "1.5px solid #fed7aa" }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#9a3412", marginBottom: 10 }}>🔗 Complete the Picture — Cross-Module Data</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                { icon: "📊", text: "M1: Confirm current flight risk % before presenting to leadership" },
                { icon: "🎯", text: "M2: Show bulk risk scores to identify exactly who to prioritize" },
                { icon: "💰", text: "M3: Pull exact salary gap numbers per department for the proposal" },
                { icon: "🏥", text: "M4: Include dept health scores to show which teams are most fragile" },
                { icon: "🚪", text: "M5: Attach exit interview patterns as qualitative evidence" },
                { icon: "😴", text: "M7: Add fatigue index data if shift work is a factor" },
              ].map((item, i) => (
                <div key={i} style={{ background: "#fff", borderRadius: 8, padding: "8px 12px", border: "1px solid #fed7aa", fontSize: 11, color: "#64748b" }}>
                  <span style={{ marginRight: 6 }}>{item.icon}</span>{item.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
