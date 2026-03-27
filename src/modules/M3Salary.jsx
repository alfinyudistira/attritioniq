import { useState, useMemo, useCallback } from "react";
import { useApp, useHRData, useCurrency, getGeneration, getStatusColor, SAMPLE_DATA } from "../context/AppContext";

// ── Detect salary cliff from data ──
function detectCliff(data, manualCliff) {
  if (!data || data.length === 0) return manualCliff || 5000;
  // Find salary point where attrition rate jumps dramatically 
  const sorted = [...data].sort((a, b) => (a.MonthlySalary || 0) - (b.MonthlySalary || 0));
  const brackets = {};
  sorted.forEach(e => {
    const bracket = Math.floor((e.MonthlySalary || 0) / 500) * 500;
    if (!brackets[bracket]) brackets[bracket] = { total: 0, atRisk: 0 };
    brackets[bracket].total++;
    if (e.AttritionStatus !== "Active") brackets[bracket].atRisk++;
  });
  let cliffPoint = manualCliff || 5000;
  let maxDrop = 0;
  const entries = Object.entries(brackets).sort((a, b) => Number(a[0]) - Number(b[0]));
  for (let i = 1; i < entries.length; i++) {
    const prev = entries[i - 1][1];
    const curr = entries[i][1];
    const prevRate = prev.total > 0 ? prev.atRisk / prev.total : 0;
    const currRate = curr.total > 0 ? curr.atRisk / curr.total : 0;
    const drop = prevRate - currRate;
    if (drop > maxDrop) {
      maxDrop = drop;
      cliffPoint = Number(entries[i][0]);
    }
  }
  return cliffPoint;
}

// ── Mini scatter plot ──
function SalaryScatter({ data, cliff, highlightBelow = true, currSymbol = "$" }) {
  if (!data || data.length === 0) return null;
  const salaries = data.map(d => d.MonthlySalary).filter(Boolean);
  const maxS = Math.max(...salaries, cliff + 1000);
  const minS = Math.min(...salaries, cliff - 1500);
  const pad = { l: 38, r: 16, t: 16, b: 32 };
  const W = 320 - pad.l - pad.r;
  const H = 170 - pad.t - pad.b;
  const toX = s => {
    if (maxS === minS) return pad.l + W / 2;
    return pad.l + ((s - minS) / (maxS - minS)) * W;
  };
  const toY = sat => pad.t + H - ((Math.max(1, Math.min(10, sat)) - 1) / 9) * H;
  const cliffX = toX(cliff);
  const statusColor = s => s === "Resigned" ? "#ef4444" : s === "High Risk" ? "#f59e0b" : "#22c55e";

  return (
    <svg width="100%" viewBox="0 0 320 170">
      {/* Danger zone shading */}
      <rect x={pad.l} y={pad.t} width={Math.max(0, cliffX - pad.l)} height={H} fill="#fef2f2" opacity={0.5} />
      {/* Safe zone shading */}
      <rect x={cliffX} y={pad.t} width={Math.max(0, pad.l + W - cliffX)} height={H} fill="#f0fdf4" opacity={0.4} />
      {/* Axes */}
      <line x1={pad.l} y1={pad.t} x2={pad.l} y2={pad.t + H} stroke="#e2e8f0" strokeWidth={1} />
      <line x1={pad.l} y1={pad.t + H} x2={pad.l + W} y2={pad.t + H} stroke="#e2e8f0" strokeWidth={1} />
      {/* Cliff line */}
      <line x1={cliffX} y1={pad.t} x2={cliffX} y2={pad.t + H} stroke="#f59e0b" strokeWidth={2} strokeDasharray="5,3" />
      <text x={cliffX + 3} y={pad.t + 10} fontSize={8} fill="#b45309" fontWeight="700">{currSymbol}{(cliff / 1000).toFixed(1)}k cliff</text>
      {/* Zone labels */}
      <text x={pad.l + 4} y={pad.t + H - 4} fontSize={7} fill="#ef4444" fontWeight="700">⚠ DANGER ZONE</text>
      <text x={cliffX + 4} y={pad.t + H - 4} fontSize={7} fill="#16a34a" fontWeight="700">✓ SAFE ZONE</text>
      {/* Dots */}
      {data.map((d, i) => (
        <circle key={d.EmployeeID || i}
          cx={toX(d.MonthlySalary || minS)}
          cy={toY(d.JobSatisfaction || 1)}
          r={highlightBelow && d.MonthlySalary < cliff ? 5 : 3.5}
          fill={statusColor(d.AttritionStatus)}
          opacity={0.8}
          stroke={d.MonthlySalary < cliff ? "#fff" : "none"}
          strokeWidth={1}
        >
          <title>{d.FirstName} {d.LastName} · {currSymbol}{Number(d.MonthlySalary || 0).toLocaleString()} · Sat: {d.JobSatisfaction}/10 · {d.AttritionStatus}</title>
        </circle>
      ))}
      {/* Axis labels */}
      <text x={pad.l - 5} y={pad.t + 4} fontSize={7} fill="#94a3b8" textAnchor="end">10</text>
      <text x={pad.l - 5} y={pad.t + H} fontSize={7} fill="#94a3b8" textAnchor="end">1</text>
      <text x={pad.l} y={170 - 4} fontSize={7} fill="#94a3b8">Salary →</text>
      <text x={pad.l - 10} y={pad.t + H / 2} fontSize={7} fill="#94a3b8" textAnchor="middle"
        transform={`rotate(-90, ${pad.l - 10}, ${pad.t + H / 2})`}>Satisfaction</text>
    </svg>
  );
}

// ── Salary distribution bar chart ──
function SalaryDistribution({ data, cliff, currSymbol = "$" }) {
  const buckets = {};
  const step = 500;
  data.forEach(e => {
    const b = Math.floor((e.MonthlySalary || 0) / step) * step;
    if (!buckets[b]) buckets[b] = { count: 0, atRisk: 0 };
    buckets[b].count++;
    if (e.AttritionStatus !== "Active") buckets[b].atRisk++;
  });
  const entries = Object.entries(buckets).sort((a, b) => Number(a[0]) - Number(b[0]));
  const maxCount = Math.max(...entries.map(e => e[1].count), 1);
  const W = 320, H = 120, pad = { l: 28, r: 8, t: 16, b: 28 };
  const bW = Math.max(12, Math.floor((W - pad.l - pad.r) / entries.length) - 3);

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
      {entries.map(([sal, val], i) => {
        const x = pad.l + i * ((W - pad.l - pad.r) / entries.length) + 1;
        const totalH = (val.count / maxCount) * (H - pad.t - pad.b);
        const riskH = (val.atRisk / maxCount) * (H - pad.t - pad.b);
        const isBelow = Number(sal) < cliff;
        return (
          <g key={sal}>
            <rect x={x} y={H - pad.b - totalH} width={bW} height={totalH}
              fill={isBelow ? "#fecaca" : "#bbf7d0"} rx={2} />
            <rect x={x} y={H - pad.b - riskH} width={bW} height={riskH}
              fill={isBelow ? "#ef4444" : "#22c55e"} rx={2} opacity={0.9} />
            <text x={x + bW / 2} y={H - 6} textAnchor="middle" fontSize={7} fill="#94a3b8">
  {currSymbol}{(Number(sal) / 1000).toFixed(1)}k
</text>
          </g>
        );
      })}
      <line x1={pad.l} y1={H - pad.b} x2={W - pad.r} y2={H - pad.b} stroke="#e2e8f0" strokeWidth={1} />
    </svg>
  );
}

// ── Salary Health Bar per employee ──
function SalaryHealthBar({ salary, cliff, currSymbol }) {
  const pct = Math.min(100, Math.round((salary / cliff) * 100));
  const color = pct >= 100 ? "#22c55e" : pct >= 80 ? "#f59e0b" : "#ef4444";
  const label = pct >= 100 ? "Safe" : pct >= 80 ? "Near Cliff" : "Danger";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ width: 50, height: 5, background: "#f1f5f9", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 10, fontWeight: 700, color }}>{label}</span>
    </div>
  );
}

// ── Dept Salary Radar (SVG) ──
function DeptSalaryRadar({ depts, cliff, currSymbol }) {
  if (!depts || depts.length === 0) return null;
  const n = Math.min(depts.length, 6);
  const sliced = depts.slice(0, n);
  const size = 200;
  const cx = size / 2, cy = size / 2, r = size * 0.35;
  const points = sliced.map((_, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    return { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r };
  });
  const dataPoints = sliced.map((d, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const ratio = Math.min(1, (d.avgSal || 0) / cliff);
    return { x: cx + Math.cos(angle) * r * ratio, y: cy + Math.sin(angle) * r * ratio };
  });
  const polygon = dataPoints.map(p => `${p.x},${p.y}`).join(" ");
  const grid = points.map(p => `${p.x},${p.y}`).join(" ");

  return (
    <svg width="100%" viewBox={`0 0 ${size} ${size}`}>
      <polygon points={grid} fill="none" stroke="#e2e8f0" strokeWidth={1} />
      <polygon points={polygon} fill="#f59e0b22" stroke="#f59e0b" strokeWidth={2} />
      {sliced.map((d, i) => (
        <g key={i}>
          <line x1={cx} y1={cy} x2={points[i].x} y2={points[i].y} stroke="#f1f5f9" strokeWidth={1} />
          <text x={points[i].x} y={points[i].y + (points[i].y > cy ? 12 : -4)}
            textAnchor="middle" fontSize={8} fill="#475569" fontWeight="700">
            {d.dept.split(" ")[0]}
          </text>
          <text x={dataPoints[i].x} y={dataPoints[i].y - 4}
            textAnchor="middle" fontSize={7} fill="#f59e0b" fontWeight="700">
            {currSymbol}{Math.round((d.avgSal || 0) / 1000)}k
          </text>
        </g>
      ))}
      <circle cx={cx} cy={cy} r={3} fill="#f59e0b" />
      <text x={cx} y={cy - 8} textAnchor="middle" fontSize={7} fill="#94a3b8">cliff: {currSymbol}{Math.round(cliff / 1000)}k</text>
    </svg>
  );
}


// ── AI Insight ──
async function fetchSalaryAI(stats, company) {
  const prompt = `You are an expert compensation analyst for ${company?.name || "a company"} in the ${company?.industry || "services"} industry.

Salary Analysis Data:
- Detected Salary Cliff: ${stats.cliff}/month
- Employees below cliff: ${stats.belowCliff} (${stats.belowCliffPct}% of workforce)
- Average salary gap (below cliff employees): ${stats.avgGap}/month
- Total budget needed to bring all to cliff: ${stats.totalBudgetNeeded.toLocaleString()}/year
- Departments most affected: ${stats.worstDepts.join(", ")}
- Avg salary resigned: ${stats.avgResigned} | Avg salary active: ${stats.avgActive}

Write 3 short paragraphs:
1. Assessment of the compensation situation and cliff impact
2. Priority departments to fix first and why
3. Budget recommendation: minimum viable investment to stop the bleeding

Under 160 words. Direct and actionable. No bullet points.`;

  const response = await fetch("https://gemini-api-amber-iota.vercel.app/api/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: [{ content: prompt }] }),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  return data.content?.[0]?.text || data.text || data.response || "AI insight unavailable.";
}

// ── MAIN M3 COMPONENT ──
export default function M3Salary() {
  const { company } = useApp();
  const { data } = useHRData();
  const { fmt, config: cfg } = useCurrency();
  const currSymbol = cfg?.symbol || "$";
  const src = data.length > 0 ? data : SAMPLE_DATA;
  const manualCliff = company?.salaryCliff || 5000;
  const currency = company?.currency || "USD";

  const [useAutoCliff, setUseAutoCliff] = useState(true);
  const [customCliff, setCustomCliff] = useState(manualCliff);
  useMemo(() => { setCustomCliff(manualCliff); }, [manualCliff]);
  const [marketRate, setMarketRate] = useState(() => {
    const src = data.length > 0 ? data : SAMPLE_DATA;
    const depts = [...new Set(src.map(e => e.Department).filter(Boolean))];
    const defaults = { Sales: 5500, "Technical Support": 5200, IT: 5800, HR: 5100, "Digital Marketing": 5300 };
    const result = {};
    depts.forEach(d => { result[d] = defaults[d] || manualCliff; });
    return result;
  });
  const [showMarket, setShowMarket] = useState(false);
  const [simTarget, setSimTarget] = useState(manualCliff + 200);
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const autoCliff = useMemo(() => detectCliff(src, manualCliff), [src, manualCliff]);
  const cliff = useAutoCliff ? autoCliff : customCliff;

  // Core stats
  const stats = useMemo(() => {
    const below = src.filter(e => (e.MonthlySalary || 0) < cliff);
    const above = src.filter(e => (e.MonthlySalary || 0) >= cliff);
    const resigned = src.filter(e => e.AttritionStatus === "Resigned");
    const active = src.filter(e => e.AttritionStatus === "Active");
    const avgResigned = resigned.length > 0 ? Math.round(resigned.reduce((s, e) => s + (e.MonthlySalary || 0), 0) / resigned.length) : 0;
    const avgActive = active.length > 0 ? Math.round(active.reduce((s, e) => s + (e.MonthlySalary || 0), 0) / active.length) : 0;
    const gaps = below.map(e => cliff - (e.MonthlySalary || 0));
    const avgGap = gaps.length > 0 ? Math.round(gaps.reduce((s, g) => s + g, 0) / gaps.length) : 0;
    const totalBudgetNeeded = gaps.reduce((s, g) => s + g * 12, 0);

    // Dept breakdown
    const deptMap = {};
    src.forEach(e => {
      if (!deptMap[e.Department]) deptMap[e.Department] = { total: 0, below: 0, avgSal: 0, salSum: 0 };
      deptMap[e.Department].total++;
      deptMap[e.Department].salSum += e.MonthlySalary || 0;
      if ((e.MonthlySalary || 0) < cliff) deptMap[e.Department].below++;
    });
    const depts = Object.entries(deptMap).map(([dept, v]) => ({
      dept, total: v.total, below: v.below,
      belowPct: v.total > 0 ? ((v.below / v.total) * 100).toFixed(0) : 0,
      avgSal: v.total > 0 ? Math.round(v.salSum / v.total) : 0,
      gap: v.total > 0 ? Math.max(0, cliff - Math.round(v.salSum / v.total)) : 0,
    })).sort((a, b) => b.below - a.below);

    const worstDepts = depts.filter(d => d.below > 0).slice(0, 3).map(d => d.dept);

    return {
      below: below.length, above: above.length, total: src.length,
      belowCliff: below.length,
      belowCliffPct: src.length > 0 ? ((below.length / src.length) * 100).toFixed(0) : 0,
      avgGap, totalBudgetNeeded, depts, worstDepts,
      avgResigned, avgActive, cliff,
      salaryDiff: avgActive - avgResigned,
    };
  }, [src, cliff]);

  // Sim stats
  const simStats = useMemo(() => {
    const belowSim = src.filter(e => (e.MonthlySalary || 0) < simTarget);
    const totalCost = belowSim.reduce((s, e) => s + Math.max(0, simTarget - (e.MonthlySalary || 0)) * 12, 0);
    return { count: belowSim.length, totalCost, pct: src.length > 0 ? ((belowSim.length / src.length) * 100).toFixed(0) : 0 };
  }, [src, simTarget]);

  const handleAI = useCallback(async () => {
    setAiLoading(true);
    setAiText("");
    try {
      const text = await fetchSalaryAI(stats, company);
      setAiText(text);
    } catch (err) {
      setAiText(`⚠️ AI unavailable: ${err?.message || "Check your connection and try again."}`);
    } finally {
      setAiLoading(false);
    }
  }, [stats, company]);

    const TABS = [
    { id: "overview", label: "📊 Overview" },
    { id: "employee", label: "👤 Employee Gap Table" },
    { id: "simulator", label: "🧪 Adjustment Simulator" },
    { id: "market", label: "📈 Market Comparison" },
    { id: "health", label: "🩺 Salary Health" },
    { id: "radar", label: "🕸 Dept Radar" },
  ];

  return (
    <div>
      {/* Tab switcher */}
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

      {/* Cliff Selector — always visible */}
      <div style={{ background: "#fff", borderRadius: 14, padding: "16px 20px", border: "1.5px solid #f1f5f9", marginBottom: 18, display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Salary Cliff Mode</div>
          <div style={{ display: "flex", gap: 8 }}>
            {[{ id: true, label: `Auto-detected: ${fmt(autoCliff)}` }, { id: false, label: "Manual" }].map(opt => (
              <button key={String(opt.id)} onClick={() => setUseAutoCliff(opt.id)}
                style={{
                  padding: "6px 14px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12,
                  background: useAutoCliff === opt.id ? "#f59e0b" : "#f1f5f9",
                  color: useAutoCliff === opt.id ? "#fff" : "#64748b",
                  fontWeight: useAutoCliff === opt.id ? 700 : 500,
                }}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        {!useAutoCliff && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Custom Cliff ($)</div>
            <input type="number" value={customCliff} onChange={e => setCustomCliff(Number(e.target.value))}
              style={{ padding: "7px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 13, color: "#1e293b", background: "#f8fafc", width: 120 }} />
          </div>
        )}
        <div style={{ marginLeft: "auto", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: "8px 16px" }}>
          <div style={{ fontSize: 10, color: "#92400e", fontWeight: 700, textTransform: "uppercase" }}>Active Cliff</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#b45309", fontFamily: "'Playfair Display',Georgia,serif" }}>{fmt(cliff)}<span style={{ fontSize: 11, color: "#92400e" }}>/mo</span></div>
        </div>
      </div>

      {/* ── TAB: OVERVIEW ── */}
      {activeTab === "overview" && (
        <div>
          {/* KPI Row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 12, marginBottom: 18 }}>
            {[
              { label: "In Danger Zone", value: stats.belowCliff, sub: `${stats.belowCliffPct}% of workforce`, color: "#ef4444", bg: "#fef2f2", icon: "🚨" },
              { label: "In Safe Zone", value: stats.above, sub: `${100 - Number(stats.belowCliffPct)}% retained`, color: "#22c55e", bg: "#f0fdf4", icon: "✅" },
              { label: "Avg Salary Gap", value: fmt(stats.avgGap), sub: "Per danger-zone employee/mo", color: "#f59e0b", bg: "#fffbeb", icon: "📉" },
              { label: "Annual Fix Budget", value: fmt(stats.totalBudgetNeeded, true), sub: "To bring all to cliff", color: "#8b5cf6", bg: "#f5f3ff", icon: "💰" },
              { label: "Resigned Avg Salary", value: fmt(stats.avgResigned), sub: `vs Active: ${fmt(stats.avgActive)}`, color: "#dc2626", bg: "#fff1f2", icon: "🚪" },
              { label: "Salary Gap Impact", value: fmt(stats.salaryDiff), sub: "Active earns more than resigned", color: "#3b82f6", bg: "#eff6ff", icon: "📊" },
            ].map((k, i) => (
              <div key={i} style={{ background: k.bg, borderRadius: 13, padding: "14px 16px", border: `1.5px solid ${k.color}22`, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", right: 10, top: 8, fontSize: 18, opacity: 0.2 }}>{k.icon}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>{k.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: k.color, fontFamily: "'Playfair Display',Georgia,serif", lineHeight: 1.1 }}>{k.value}</div>
                <div style={{ fontSize: 10, color: "#64748b", marginTop: 3 }}>{k.sub}</div>
              </div>
            ))}
          </div>

          {/* Charts row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", border: "1.5px solid #f1f5f9" }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", marginBottom: 2 }}>Salary vs Satisfaction Map</div>
              <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 10 }}>Red zone = danger · Green zone = safe · Size = at-risk</div>
              <SalaryScatter data={src} cliff={cliff} currSymbol={currSymbol} />
              <div style={{ display: "flex", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
                {[{ l: "Resigned", c: "#ef4444" }, { l: "High Risk", c: "#f59e0b" }, { l: "Active", c: "#22c55e" }].map(x => (
                  <div key={x.l} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: x.c }} />
                    <span style={{ fontSize: 10, color: "#64748b" }}>{x.l}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", border: "1.5px solid #f1f5f9" }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", marginBottom: 2 }}>Salary Distribution</div>
              <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 10 }}>Red bars = danger zone · Green bars = safe zone</div>
              <SalaryDistribution data={src} cliff={cliff} currSymbol={currSymbol} />
              <div style={{ marginTop: 10, background: "#fef2f2", borderRadius: 8, padding: "8px 12px", border: "1px solid #fecaca" }}>
                <span style={{ fontSize: 11, color: "#dc2626", fontWeight: 700 }}>
                  💡 ${fmt(stats.avgGap)}/mo avg gap · Fix costs ${fmt(Math.round(stats.totalBudgetNeeded / 12))}/mo total
                </span>
              </div>
            </div>
          </div>

          {/* Dept breakdown */}
          <div style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", border: "1.5px solid #f1f5f9", marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", marginBottom: 14 }}>Department Danger Zone Breakdown</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 12 }}>
              {stats.depts.map((d, i) => {
                const pct = Number(d.belowPct);
                const color = pct > 70 ? "#ef4444" : pct > 40 ? "#f59e0b" : "#22c55e";
                return (
                  <div key={i} style={{ background: "#f8fafc", borderRadius: 11, padding: "12px 14px", border: `1.5px solid ${color}22` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}>{d.dept}</span>
                      <span style={{ fontWeight: 800, fontSize: 14, color }}>{d.belowPct}%</span>
                    </div>
                    <div style={{ height: 6, background: "#e2e8f0", borderRadius: 3, overflow: "hidden", marginBottom: 6 }}>
                      <div style={{ width: `${d.belowPct}%`, height: "100%", background: color, borderRadius: 3, transition: "width 0.5s" }} />
                    </div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>
                      {d.below}/{d.total} below cliff · Avg {fmt(d.avgSal)}/mo
                    </div>
                    {d.gap > 0 && (
                      <div style={{ fontSize: 11, color: "#dc2626", fontWeight: 600, marginTop: 3 }}>
                        Gap: {fmt(d.gap)}/mo avg
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Insight */}
          <div style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", border: "1.5px solid #f1f5f9" }}>
            <button onClick={handleAI} disabled={aiLoading}
              style={{ width: "100%", padding: "12px", background: aiLoading ? "#f1f5f9" : "#0f172a", color: aiLoading ? "#94a3b8" : "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: aiLoading ? "not-allowed" : "pointer" }}>
              {aiLoading ? "⏳ Generating Salary Analysis..." : "🤖 Get AI Compensation Insight"}
            </button>
            {aiText && (
              <div style={{ marginTop: 14, background: "#f8fafc", borderRadius: 10, padding: "14px 16px", border: "1.5px solid #e2e8f0" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>AI Compensation Analysis</div>
                <div style={{ fontSize: 12, color: "#1e293b", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{aiText}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: EMPLOYEE GAP TABLE ── */}
      {activeTab === "employee" && (
        <div style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", border: "1.5px solid #f1f5f9" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>Per-Employee Gap Analysis</div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>Sorted by salary gap — highest risk first</div>
            </div>
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "6px 14px", fontSize: 12, color: "#dc2626", fontWeight: 700 }}>
              {stats.belowCliff} employees need attention
            </div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["Employee", "Dept", "Gen", "Current Salary", "Gap to Cliff", "Target Salary", "Annual Fix Cost", "Status", "Risk"].map(h => (
                    <th key={h} style={{ padding: "8px 10px", textAlign: "left", color: "#64748b", fontWeight: 700, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "2px solid #f1f5f9", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...src]
                  .map(e => ({ ...e, gap: Math.max(0, cliff - (e.MonthlySalary || 0)) }))
                  .sort((a, b) => b.gap - a.gap)
                  .slice(0, 30)
                  .map((e, i) => {
                    const gap = e.gap;
                    const isRisk = gap > 0;
                    return (
                      <tr key={e.EmployeeID || i} style={{ borderBottom: "1px solid #f8fafc", background: isRisk ? (i % 2 === 0 ? "#fffbf0" : "#fff8ee") : (i % 2 === 0 ? "#fff" : "#fafafa") }}>
                        <td style={{ padding: "7px 10px", color: "#1e293b", fontWeight: 500, whiteSpace: "nowrap" }}>{e.FirstName} {e.LastName}</td>
                        <td style={{ padding: "7px 10px", color: "#475569", fontSize: 11 }}>{e.Department}</td>
                        <td style={{ padding: "7px 10px" }}>
                          <span style={{
                            background: getGeneration(e.Age) === "Gen Z" ? "#fef3c7" : getGeneration(e.Age) === "Millennial" ? "#eff6ff" : "#f0fdf4",
                            color: getGeneration(e.Age) === "Gen Z" ? "#92400e" : getGeneration(e.Age) === "Millennial" ? "#1d4ed8" : "#166534",
                            padding: "1px 6px", borderRadius: 20, fontSize: 9, fontWeight: 700,
                          }}>{getGeneration(e.Age)}</span>
                        </td>
                        <td style={{ padding: "7px 10px", fontWeight: 700, color: isRisk ? "#ef4444" : "#16a34a" }}>
                          {fmt(e.MonthlySalary || 0)}
                        </td>
                        <td style={{ padding: "7px 10px", fontWeight: 700, color: gap > 500 ? "#ef4444" : gap > 0 ? "#f59e0b" : "#22c55e" }}>
                          {gap > 0 ? `−${fmt(gap)}` : "✓ Safe"}
                        </td>
                        <td style={{ padding: "7px 10px", color: "#1e293b", fontWeight: gap > 0 ? 600 : 400 }}>
                          {gap > 0 ? fmt(cliff) : "—"}
                        </td>
                        <td style={{ padding: "7px 10px", color: gap > 0 ? "#8b5cf6" : "#94a3b8", fontWeight: gap > 0 ? 600 : 400 }}>
                          {gap > 0 ? fmt(gap * 12) : "—"}
                        </td>
                        <td style={{ padding: "7px 10px" }}>
                          <span style={{
                            background: e.AttritionStatus === "Resigned" ? "#fef2f2" : e.AttritionStatus === "High Risk" ? "#fffbeb" : "#f0fdf4",
                            color: getStatusColor(e.AttritionStatus),
                            padding: "2px 7px", borderRadius: 20, fontSize: 10, fontWeight: 700,
                          }}>{e.AttritionStatus}</span>
                        </td>
                        <td style={{ padding: "7px 10px" }}>
                          <div style={{ width: 40, height: 5, background: "#f1f5f9", borderRadius: 3, overflow: "hidden" }}>
                            <div style={{ width: `${Math.min(100, (gap / cliff) * 200)}%`, height: "100%", background: gap > 500 ? "#ef4444" : gap > 0 ? "#f59e0b" : "#22c55e", borderRadius: 3 }} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB: ADJUSTMENT SIMULATOR ── */}
      {activeTab === "simulator" && (
        <div>
          {/* Cliff scenario builder */}
          <div style={{ background: "#fff", borderRadius: 14, padding: "20px 22px", border: "1.5px solid #f1f5f9", marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", marginBottom: 4 }}>🎯 Cliff Scenario Builder</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 18 }}>
              Drag the target salary slider to see how many employees move from danger to safe zone — and what it costs
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>Target Minimum Salary</span>
                <span style={{ fontSize: 18, fontWeight: 800, color: "#f59e0b", fontFamily: "'Playfair Display',Georgia,serif" }}>{fmt(simTarget)}/mo</span>
              </div>
              <input type="range"
                min={Math.round(manualCliff * 0.3)}
                max={Math.round(manualCliff * 2.5)}
                step={Math.round(manualCliff * 0.02) || 100}
                value={simTarget}
                onChange={e => setSimTarget(Number(e.target.value))}
                style={{ width: "100%", accentColor: "#f59e0b" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#94a3b8", marginTop: 2 }}>
                <span>{fmt(Math.round(manualCliff * 0.3))}</span>
                <span>{fmt(Math.round(manualCliff * 2.5))}</span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              {[
                { label: "Employees Below Target", value: simStats.count, sub: `${simStats.pct}% of workforce`, color: simStats.count > stats.belowCliff ? "#ef4444" : "#22c55e" },
                { label: "Monthly Budget Needed", value: fmt(Math.round(simStats.totalCost / 12)), sub: "Total salary adjustments", color: "#f59e0b" },
                { label: "Annual Investment", value: fmt(simStats.totalCost, true), sub: "vs turnover cost savings", color: "#8b5cf6" },
              ].map((k, i) => (
                <div key={i} style={{ background: "#f8fafc", borderRadius: 11, padding: "14px 16px", border: "1.5px solid #f1f5f9", textAlign: "center" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{k.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: k.color, fontFamily: "'Playfair Display',Georgia,serif" }}>{k.value}</div>
                  <div style={{ fontSize: 10, color: "#64748b", marginTop: 3 }}>{k.sub}</div>
                </div>
              ))}
            </div>

            {/* ROI comparison */}
            <div style={{ marginTop: 16, background: "#f0fdf4", borderRadius: 11, padding: "14px 16px", border: "1px solid #bbf7d0" }}>
              <div style={{ fontWeight: 700, fontSize: 12, color: "#166534", marginBottom: 6 }}>💡 ROI Snapshot</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 10, color: "#94a3b8" }}>Annual salary fix cost</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#dc2626" }}>{fmt(simStats.totalCost)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "#94a3b8" }}>Estimated turnover savings (50% reduction)</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#16a34a" }}>
                    {fmt(Math.round(stats.belowCliff * stats.avgResigned * 12 * (company?.replacementMultiplier || 1.5) * 0.5))}
                  </div>
                </div>
              </div>
              {simStats.totalCost < stats.belowCliff * stats.avgResigned * 12 * (company?.replacementMultiplier || 1.5) * 0.5 && (
                <div style={{ marginTop: 8, fontSize: 11, color: "#16a34a", fontWeight: 700 }}>
                  ✅ Salary fix costs LESS than projected turnover savings — positive ROI!
                </div>
              )}
            </div>
          </div>

          {/* Dept-level adjustment plan */}
          <div style={{ background: "#fff", borderRadius: 14, padding: "20px 22px", border: "1.5px solid #f1f5f9" }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", marginBottom: 14 }}>📋 Department Adjustment Plan</div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {["Department", "Employees Below", "% at Risk", "Avg Current", "Target", "Avg Gap", "Monthly Budget", "Annual Budget", "Priority"].map(h => (
                      <th key={h} style={{ padding: "8px 10px", textAlign: "left", color: "#64748b", fontWeight: 700, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "2px solid #f1f5f9", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats.depts.map((d, i) => {
                    const priority = Number(d.belowPct) > 70 ? "🔴 Urgent" : Number(d.belowPct) > 40 ? "🟡 High" : "🟢 Monitor";
                    const monthlyBudget = d.below * d.gap;
                    return (
                      <tr key={i} style={{ borderBottom: "1px solid #f8fafc", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                        <td style={{ padding: "8px 10px", fontWeight: 600, color: "#1e293b" }}>{d.dept}</td>
                        <td style={{ padding: "8px 10px", color: "#ef4444", fontWeight: 700 }}>{d.below}</td>
                        <td style={{ padding: "8px 10px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <div style={{ width: 36, height: 5, background: "#f1f5f9", borderRadius: 3, overflow: "hidden" }}>
                              <div style={{ width: `${d.belowPct}%`, height: "100%", background: Number(d.belowPct) > 70 ? "#ef4444" : Number(d.belowPct) > 40 ? "#f59e0b" : "#22c55e", borderRadius: 3 }} />
                            </div>
                            <span style={{ fontWeight: 700, color: Number(d.belowPct) > 70 ? "#ef4444" : "#64748b" }}>{d.belowPct}%</span>
                          </div>
                        </td>
                        <td style={{ padding: "8px 10px", color: "#ef4444", fontWeight: 600 }}>{fmt(d.avgSal)}</td>
                        <td style={{ padding: "8px 10px", color: "#16a34a", fontWeight: 600 }}>{fmt(cliff)}</td>
                        <td style={{ padding: "8px 10px", color: "#f59e0b", fontWeight: 600 }}>{d.gap > 0 ? `+${fmt(d.gap)}` : "✓"}</td>
                        <td style={{ padding: "8px 10px", color: "#8b5cf6", fontWeight: 600 }}>{monthlyBudget > 0 ? fmt(monthlyBudget) : "—"}</td>
                        <td style={{ padding: "8px 10px", color: "#8b5cf6", fontWeight: 700 }}>{monthlyBudget > 0 ? fmt(monthlyBudget * 12) : "—"}</td>
                        <td style={{ padding: "8px 10px", fontSize: 11, fontWeight: 700 }}>{priority}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: DEPT RADAR ── */}
      {activeTab === "radar" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div style={{ background: "#fff", borderRadius: 14, padding: "20px 22px", border: "1.5px solid #f1f5f9" }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", marginBottom: 4 }}>🕸 Dept Salary Radar</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 16 }}>
              Each axis = department · Distance from center = avg salary vs cliff
            </div>
            <DeptSalaryRadar depts={stats.depts} cliff={cliff} currSymbol={currSymbol} />
          </div>

          <div style={{ background: "#fff", borderRadius: 14, padding: "20px 22px", border: "1.5px solid #f1f5f9" }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", marginBottom: 14 }}>📊 Dept Risk Ranking</div>
            {[...stats.depts].sort((a, b) => a.avgSal - b.avgSal).map((d, i) => {
              const pct = Math.min(100, Math.round((d.avgSal / cliff) * 100));
              const color = pct >= 100 ? "#22c55e" : pct >= 80 ? "#f59e0b" : "#ef4444";
              return (
                <div key={i} style={{ marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#1e293b" }}>{d.dept}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color }}>{fmt(Math.round(d.avgSal), true)}/mo</span>
                  </div>
                  <div style={{ height: 8, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 4, transition: "width 0.5s ease" }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
                    <span style={{ fontSize: 10, color: "#94a3b8" }}>{d.below} below cliff</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color }}>{pct}% of cliff</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Export dept plan */}
          <div style={{ gridColumn: "1 / -1", background: "#fff", borderRadius: 14, padding: "16px 20px", border: "1.5px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}>📋 Export Department Adjustment Plan</div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>Download full salary adjustment plan as CSV</div>
            </div>
            <button
              onClick={() => {
                const headers = ["Department","Employees Below Cliff","Avg Current Salary","Target (Cliff)","Avg Gap","Monthly Budget","Annual Budget","Priority"];
                const rows = stats.depts.map(d => {
                  const priority = Number(d.belowPct) > 70 ? "Urgent" : Number(d.belowPct) > 40 ? "High" : "Monitor";
                  return [d.dept, d.below, Math.round(d.avgSal), cliff, d.gap > 0 ? d.gap : 0, d.below * (d.gap || 0), d.below * (d.gap || 0) * 12, priority].join(",");
                });
                const csv = [headers.join(","), ...rows].join("\n");
                const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
                const a = document.createElement("a");
                a.href = URL.createObjectURL(blob);
                a.download = `salary_adjustment_plan_${Date.now()}.csv`;
                a.click();
                URL.revokeObjectURL(a.href);
              }}
              style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#f59e0b,#ef4444)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}
            >
              ⬇ Export Plan CSV
            </button>
          </div>
        </div>
      )}
        

      {/* ── TAB: MARKET COMPARISON ── */}
      {activeTab === "market" && (
        <div>
          <div style={{ background: "#fff", borderRadius: 14, padding: "20px 22px", border: "1.5px solid #f1f5f9", marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", marginBottom: 4 }}>📈 Market Rate Comparison</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 18 }}>
              Enter industry market rates per department to see your compensation gap vs competitors
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 12 }}>
              {stats.depts.map((d, i) => {
                const mRate = marketRate[d.dept] || 5000;
                const gap = mRate - d.avgSal;
                const gapColor = gap > 500 ? "#ef4444" : gap > 0 ? "#f59e0b" : "#22c55e";
                return (
                  <div key={i} style={{ background: "#f8fafc", borderRadius: 11, padding: "14px 16px", border: "1.5px solid #f1f5f9" }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", marginBottom: 8 }}>{d.dept}</div>
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 3 }}>Your avg salary</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: "#1e293b" }}>{fmt(d.avgSal)}</div>
                    </div>
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 3 }}>Market rate (edit)</div>
                      <input type="number" value={mRate}
                        onChange={e => setMarketRate(p => ({ ...p, [d.dept]: Number(e.target.value) }))}
                        style={{ width: "100%", padding: "6px 10px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 13, fontWeight: 700, color: "#1e293b", background: "#fff", boxSizing: "border-box" }} />
                    </div>
                    <div style={{ background: gap > 0 ? "#fef2f2" : "#f0fdf4", borderRadius: 8, padding: "8px 10px", border: `1px solid ${gap > 0 ? "#fecaca" : "#bbf7d0"}` }}>
                      <div style={{ fontSize: 10, color: "#94a3b8" }}>Competitor gap</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: gapColor }}>
                        {gap > 0 ? `−${fmt(gap)}/mo` : `+${fmt(Math.abs(gap))}/mo`}
                      </div>
                      <div style={{ fontSize: 10, color: gapColor, fontWeight: 700, marginTop: 2 }}>
                        {gap > 500 ? "⚠ Competitors paying significantly more" : gap > 0 ? "Slightly below market" : "✓ Above market rate"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Competitor Subsidy Warning (Ini posisinya harusnya di dalam tab Market) */}
          <div style={{ background: "#fef2f2", borderRadius: 14, padding: "18px 20px", border: "2px solid #fecaca" }}>
            <div style={{ fontWeight: 800, fontSize: 14, color: "#dc2626", marginBottom: 8 }}>
              🏴 The Competitor Subsidy Paradox
            </div>
            <div style={{ fontSize: 13, color: "#7f1d1d", lineHeight: 1.7 }}>
              You are effectively training high-value employees — then handing them to competitors at a premium.
              Every resigned employee who was "Six Sigma-optimized" by your processes is now adding value at a rival company,
              without them paying any of the training or development cost. <strong>You paid to train talent for others.</strong>
            </div>
            <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div style={{ background: "#fff", borderRadius: 9, padding: "10px 14px" }}>
                <div style={{ fontSize: 10, color: "#94a3b8" }}>Total resigned employees</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#dc2626" }}>{src.filter(e => e.AttritionStatus === "Resigned").length}</div>
              </div>
              <div style={{ background: "#fff", borderRadius: 9, padding: "10px 14px" }}>
                <div style={{ fontSize: 10, color: "#94a3b8" }}>Avg salary they left for (est.)</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#dc2626" }}>
                  {fmt(Math.max(...Object.values(marketRate), manualCliff))}+
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: SALARY HEALTH ── */}
      {activeTab === "health" && (
        <div>
          <div style={{ background: "#fff", borderRadius: 14, padding: "20px 22px", border: "1.5px solid #f1f5f9", marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", marginBottom: 4 }}>🩺 Individual Salary Health</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 16 }}>
              Each employee scored against the {currSymbol}{cliff.toLocaleString()} salary cliff · Red = immediate risk
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {["Employee","Department","Monthly Salary","vs Cliff","Health","Status"].map(h => (
                      <th key={h} style={{ padding: "8px 10px", textAlign: "left", color: "#64748b", fontWeight: 700, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "2px solid #f1f5f9", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...src].sort((a, b) => (a.MonthlySalary || 0) - (b.MonthlySalary || 0)).map((e, i) => {
                    const gap = cliff - (e.MonthlySalary || 0);
                    const isBelow = gap > 0;
                    return (
                      <tr key={e.EmployeeID || i} style={{ borderBottom: "1px solid #f8fafc", background: isBelow ? "#fff5f5" : "#fff" }}>
                        <td style={{ padding: "7px 10px", fontWeight: 600, color: "#1e293b" }}>{e.FirstName} {e.LastName}</td>
                        <td style={{ padding: "7px 10px", color: "#475569" }}>{e.Department}</td>
                        <td style={{ padding: "7px 10px", fontWeight: 700, color: isBelow ? "#ef4444" : "#16a34a" }}>{fmt(e.MonthlySalary || 0)}</td>
                        <td style={{ padding: "7px 10px", fontSize: 11 }}>
                          {isBelow
                            ? <span style={{ color: "#ef4444", fontWeight: 700 }}>−{fmt(gap)}</span>
                            : <span style={{ color: "#16a34a", fontWeight: 700 }}>+{fmt(Math.abs(gap))}</span>}
                        </td>
                        <td style={{ padding: "7px 10px" }}>
                          <SalaryHealthBar salary={e.MonthlySalary || 0} cliff={cliff} currSymbol={currSymbol} />
                        </td>
                        <td style={{ padding: "7px 10px" }}>
                          <span style={{
                            background: e.AttritionStatus === "Resigned" ? "#fef2f2" : e.AttritionStatus === "High Risk" ? "#fffbeb" : "#f0fdf4",
                            color: e.AttritionStatus === "Resigned" ? "#ef4444" : e.AttritionStatus === "High Risk" ? "#f59e0b" : "#22c55e",
                            padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700
                          }}>{e.AttritionStatus}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 12 }}>
            {[
              { label: "Below Cliff", value: src.filter(e => (e.MonthlySalary || 0) < cliff).length, color: "#ef4444", icon: "⚠️", sub: "employees at risk" },
              { label: "Above Cliff", value: src.filter(e => (e.MonthlySalary || 0) >= cliff).length, color: "#22c55e", icon: "✅", sub: "employees stable" },
              { label: "Avg Gap (below)", value: fmt(Math.round(src.filter(e => (e.MonthlySalary||0) < cliff).reduce((s,e) => s + (cliff - (e.MonthlySalary||0)), 0) / Math.max(1, src.filter(e => (e.MonthlySalary||0) < cliff).length)), true), color: "#f59e0b", icon: "📉", sub: "avg monthly gap" },
              { label: "Total Fix Budget", value: fmt(src.filter(e => (e.MonthlySalary||0) < cliff).reduce((s,e) => s + (cliff - (e.MonthlySalary||0)), 0) * 12, true), color: "#8b5cf6", icon: "💰", sub: "annual cost to fix all" },
            ].map((k, i) => (
              <div key={i} style={{ background: "#fff", borderRadius: 13, padding: "14px 16px", border: `1.5px solid ${k.color}22` }}>
                <div style={{ fontSize: 18, marginBottom: 4 }}>{k.icon}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>{k.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: k.color, fontFamily: "'Playfair Display',Georgia,serif" }}>{k.value}</div>
                <div style={{ fontSize: 10, color: "#64748b", marginTop: 3 }}>{k.sub}</div>
              </div>
            ))}
          </div>
        </div>
      )}

</div>
  );
}
      
