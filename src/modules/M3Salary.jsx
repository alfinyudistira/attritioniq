import { useState, useMemo, useCallback } from "react";
import { useApp, useHRData, useCurrency, getGeneration, getStatusColor } from "../context/AppContext";
import { useModuleData } from "../context/ModuleDataContext";
import { useChartTooltip, ChartTooltip } from "../components/Charts";

function detectCliff(data, manualCliff) {
  if (!data || data.length === 0) return manualCliff || 5000;
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

// ── Mini scatter plot (UPGRADED V2 - FIX OVERLAP & HEIGHT) ──
function SalaryScatter({ data, cliff, highlightBelow = true, currSymbol = "$" }) {
  const { tooltip, show, hide, move } = useChartTooltip();
  
  if (!data || data.length === 0) return null;
  const salaries = data.map(d => d.MonthlySalary).filter(Boolean);
  const maxS = Math.max(...salaries, cliff + 1000);
  const minS = Math.min(...salaries, cliff - 1500);
  
  const W_SVG = 340, H_SVG = 240;
  const pad = { l: 30, r: 15, t: 30, b: 20 }; 
  const W = W_SVG - pad.l - pad.r;
  const H = H_SVG - pad.t - pad.b;
  
  const toX = s => {
    if (maxS === minS) return pad.l + W / 2;
    return pad.l + ((s - minS) / (maxS - minS)) * W;
  };
  const toY = sat => pad.t + H - ((Math.max(1, Math.min(10, sat)) - 1) / 9) * H;
  const cliffX = toX(cliff);
  const statusColor = s => s === "Resigned" ? "#ef4444" : s === "High Risk" ? "#f59e0b" : "#22c55e";

  const formatShort = (val) => {
    const num = Number(val);
    if (num >= 1000000) return `${currSymbol}${(num / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
    if (num >= 1000) return `${currSymbol}${(num / 1000).toFixed(1).replace(/\.0$/, '')}k`;
    return `${currSymbol}${num}`;
  };

  return (
    <>
      <ChartTooltip tooltip={tooltip} />
      <svg width="100%" viewBox={`0 0 ${W_SVG} ${H_SVG}`} style={{ overflow: "visible" }}>
        <defs>
          <filter id="scatter-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#0f172a" floodOpacity="0.15" />
          </filter>
        </defs>

        {/* Danger & Safe Zone Shading */}
        <rect x={pad.l} y={pad.t} width={Math.max(0, cliffX - pad.l)} height={H} fill="#fef2f2" opacity={0.6} rx={4} />
        <rect x={cliffX} y={pad.t} width={Math.max(0, pad.l + W - cliffX)} height={H} fill="#f0fdf4" opacity={0.5} rx={4} />
        
        {/* Axes */}
        <line x1={pad.l} y1={pad.t} x2={pad.l} y2={pad.t + H} stroke="#e2e8f0" strokeWidth={1} />
        <line x1={pad.l} y1={pad.t + H} x2={pad.l + W} y2={pad.t + H} stroke="#e2e8f0" strokeWidth={1} />
        
        {/* DANGER & SAFE ZONE LABELS (STAGGERED: Danger di atas, Safe di bawah) */}
        <text x={pad.l + 6} y={pad.t + 12} fontSize={9} fill="#ef4444" fontWeight="800" letterSpacing="0.05em">⚠ DANGER ZONE</text>
        <text x={cliffX + 6} y={pad.t + 24} fontSize={9} fill="#16a34a" fontWeight="800" letterSpacing="0.05em">✓ SAFE ZONE</text>

        {/* Cliff Line & Indikator Nilai Cliff */}
        <line x1={cliffX} y1={pad.t} x2={cliffX} y2={pad.t + H} stroke="#f59e0b" strokeWidth={2} strokeDasharray="4,4" />
        <rect x={cliffX - 25} y={pad.t - 18} width={50} height={14} fill="#fffbeb" rx={4} stroke="#fde68a" />
        <text x={cliffX} y={pad.t - 8} fontSize={8} fill="#b45309" textAnchor="middle" fontWeight="800">CLIFF: {formatShort(cliff)}</text>
        
        {/* Dots Interaktif */}
        {data.map((d, i) => {
          const cx = toX(d.MonthlySalary || minS);
          const cy = toY(d.JobSatisfaction || 1);
          const isDanger = highlightBelow && d.MonthlySalary < cliff;
          
          return (
            <circle 
              key={d.EmployeeID || i}
              cx={cx} cy={cy} r={isDanger ? 5.5 : 4}
              fill={statusColor(d.AttritionStatus)} opacity={0.85}
              stroke={isDanger ? "#fff" : "none"} strokeWidth={1.5}
              filter={isDanger ? "url(#scatter-glow)" : "none"}
              onMouseEnter={(e) => show(e, <div><strong>{d.FirstName} {d.LastName}</strong><br/>Salary: {currSymbol}{Number(d.MonthlySalary || 0).toLocaleString()}<br/>Sat: {d.JobSatisfaction}/10 · <span style={{color: statusColor(d.AttritionStatus)}}>{d.AttritionStatus}</span></div>)}
              onMouseMove={move} onMouseLeave={hide}
              style={{ cursor: "pointer", transition: "all 0.2s" }}
            />
          );
        })}
        
        {/* Axis Labels */}
        <text x={pad.l - 6} y={pad.t + 4} fontSize={8} fill="#94a3b8" textAnchor="end" fontWeight="600">10</text>
        <text x={pad.l - 6} y={pad.t + H} fontSize={8} fill="#94a3b8" textAnchor="end" fontWeight="600">1</text>
        <text x={pad.l + W / 2} y={pad.t + H + 12} fontSize={8} fill="#94a3b8" textAnchor="middle" fontWeight="600">Monthly Salary →</text>
        <text x={pad.l - 18} y={pad.t + H / 2} fontSize={8} fill="#94a3b8" textAnchor="middle" fontWeight="600" transform={`rotate(-90, ${pad.l - 18}, ${pad.t + H / 2})`}>Satisfaction</text>
      </svg>
    </>
  );
}

// ── Salary distribution bar chart (UPGRADED) ──
function SalaryDistribution({ data, cliff, currSymbol = "$" }) {
  const { tooltip, show, hide, move } = useChartTooltip();
  
  const buckets = {};
  const step = 500; 
  data.forEach(e => {
    const b = Math.floor((e.MonthlySalary || 0) / step) * step;
    if (!buckets[b]) buckets[b] = { count: 0, atRisk: 0, users: [] };
    buckets[b].count++;
    if (e.AttritionStatus !== "Active") buckets[b].atRisk++;
  });
  
  const entries = Object.entries(buckets).sort((a, b) => Number(a[0]) - Number(b[0]));
  const maxCount = Math.max(...entries.map(e => e[1].count), 1);
  
  // Ukuran SVG diperbesar (Tinggi jadi 220)
  const W = 340, H = 220, pad = { l: 28, r: 8, t: 16, b: 45 }; 
  const bW = Math.max(12, Math.floor((W - pad.l - pad.r) / entries.length) - 4);

  // Smart Formatter (Fixed biar angka gak kembar)
  const formatShort = (val) => {
    const num = Number(val);
    if (num >= 1000000) return `${currSymbol}${(num / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
    if (num >= 1000) return `${currSymbol}${(num / 1000).toFixed(1).replace(/\.0$/, '')}k`;
    return `${currSymbol}${num}`;
  };

  return (
    <>
      <ChartTooltip tooltip={tooltip} />
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
        <defs>
          <filter id="dist-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#0f172a" floodOpacity="0.1" />
          </filter>
        </defs>

        {entries.map(([sal, val], i) => {
          const x = pad.l + i * ((W - pad.l - pad.r) / entries.length) + 2;
          const totalH = (val.count / maxCount) * (H - pad.t - pad.b);
          const riskH = (val.atRisk / maxCount) * (H - pad.t - pad.b);
          const isBelow = Number(sal) < cliff;
          
          return (
            <g key={sal} className="group">
              <rect x={x - 2} y={pad.t} width={bW + 4} height={H - pad.b} fill="transparent"
                onMouseEnter={(e) => show(e, <div><strong>{formatShort(sal)} Range</strong><br/>Total: {val.count} employees<br/><span style={{color: isBelow ? '#ef4444' : '#f59e0b'}}>{val.atRisk} at risk</span></div>)}
                onMouseMove={move} onMouseLeave={hide}
                style={{ cursor: "pointer" }}
              />
              
              <rect x={x} y={H - pad.b - totalH} width={bW} height={totalH} fill={isBelow ? "#fecaca" : "#bbf7d0"} rx={4} />
              <rect x={x} y={H - pad.b - riskH} width={bW} height={riskH} fill={isBelow ? "#ef4444" : "#22c55e"} rx={4} filter="url(#dist-shadow)" opacity={0.9} style={{ pointerEvents: "none" }} />
              
              <text x={x + bW / 2 + 4} y={H - pad.b + 14} textAnchor="end" fontSize={8} fill="#64748b" fontWeight="600" transform={`rotate(-35, ${x + bW / 2 + 4}, ${H - pad.b + 14})`}>
                {formatShort(sal)}
              </text>
            </g>
          );
        })}
        <line x1={pad.l} y1={H - pad.b} x2={W - pad.r} y2={H - pad.b} stroke="#e2e8f0" strokeWidth={1.5} strokeLinecap="round" />
      </svg>
    </>
  );
}

// ── Salary Health Bar per employee ──
function SalaryHealthBar({ salary, cliff, currSymbol }) {
  const pct = Math.min(100, Math.round((salary / cliff) * 100));
  const color = pct >= 100 ? "#22c55e" : pct >= 80 ? "#f59e0b" : "#ef4444";
  const label = pct >= 100 ? "Safe" : pct >= 80 ? "Near Cliff" : "Danger";
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-[50px] h-[5px] bg-slate-100 rounded-[3px] overflow-hidden">
        <div className="h-full rounded-[3px]" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[10px] font-bold" style={{ color }}>{label}</span>
    </div>
  );
}

// ── Dept Salary Radar (MODERN & RESPONSIVE) ──
function DeptSalaryRadar({ depts, cliff, currSymbol }) {
  const { tooltip, show, hide, move } = useChartTooltip();
  
  if (!depts || depts.length === 0) return null;
  const n = Math.min(depts.length, 6);
  const sliced = depts.slice(0, n);
  
  const size = 220; 
  const cx = size / 2, cy = size / 2;
  const r = size * 0.32; 

  const getAngle = (i) => (Math.PI * 2 * i) / n - Math.PI / 2;

  const points = sliced.map((_, i) => {
    const angle = getAngle(i);
    return { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r };
  });

  const dataPoints = sliced.map((d, i) => {
    const angle = getAngle(i);
    const ratio = Math.min(1.2, (d.avgSal || 0) / cliff); 
    return { x: cx + Math.cos(angle) * r * ratio, y: cy + Math.sin(angle) * r * ratio, val: d.avgSal };
  });

  const polygon = dataPoints.map(p => `${p.x},${p.y}`).join(" ");
  const grid = points.map(p => `${p.x},${p.y}`).join(" ");

  const formatShort = (val) => {
    const num = Number(val);
    if (num >= 1000000) return `${currSymbol}${(num / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
    if (num >= 1000) return `${currSymbol}${(num / 1000).toFixed(1).replace(/\.0$/, '')}k`;
    return `${currSymbol}${num}`;
  };

  return (
    <>
      <ChartTooltip tooltip={tooltip} />
      {/* Wrapper biar gak melar jadi raksasa di desktop */}
      <div className="w-full flex justify-center py-2">
        <div className="w-full max-w-[360px] aspect-square"> 
          <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`} style={{ overflow: "visible" }}>
            <defs>
              <filter id="radar-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#f59e0b" floodOpacity="0.3" />
              </filter>
            </defs>

            {/* Grid Belakang */}
            <polygon points={grid} fill="#f8fafc" stroke="#e2e8f0" strokeWidth={1.5} strokeDasharray="4,4" />
            
            {/* Area Radar Utama */}
            <polygon points={polygon} fill="#f59e0b" fillOpacity={0.15} stroke="#f59e0b" strokeWidth={2.5} strokeLinejoin="round" filter="url(#radar-glow)" style={{ transition: "all 0.5s ease" }} />
            
            {sliced.map((d, i) => {
              const angle = getAngle(i);
              const lblR = r * 1.35; 
              const lx = cx + Math.cos(angle) * lblR;
              const ly = cy + Math.sin(angle) * lblR;
              const anchor = Math.abs(Math.cos(angle)) < 0.1 ? "middle" : Math.cos(angle) > 0 ? "start" : "end";

              return (
                <g key={i}>
                  <line x1={cx} y1={cy} x2={points[i].x} y2={points[i].y} stroke="#f1f5f9" strokeWidth={1.5} />
                  
                  <text x={lx} y={ly + (Math.sin(angle) > 0 ? 4 : -2)} textAnchor={anchor} fontSize={10} fill="#475569" fontWeight="800">
                    {d.dept.split(" ")[0]}
                  </text>
                  
                  {/* Angka Gaji */}
                  <text x={dataPoints[i].x} y={dataPoints[i].y - 8} textAnchor="middle" fontSize={9} fill="#d97706" fontWeight="800" pointerEvents="none">
                    {formatShort(d.avgSal)}
                  </text>
                  
                  {/* Titik Interaktif Tooltip */}
                  <circle cx={dataPoints[i].x} cy={dataPoints[i].y} r={8} fill="transparent" 
                    onMouseEnter={(e) => show(e, <div><strong>{d.dept}</strong><br/>Avg: {currSymbol}{Number(d.avgSal || 0).toLocaleString()}</div>)}
                    onMouseMove={move} onMouseLeave={hide}
                    style={{ cursor: "pointer" }}
                  />
                  <circle cx={dataPoints[i].x} cy={dataPoints[i].y} r={3.5} fill="#f59e0b" pointerEvents="none" />
                </g>
              );
            })}
            
            {/* Titik Tengah */}
            <circle cx={cx} cy={cy} r={4} fill="#f59e0b" />
            <text x={cx} y={cy - 12} textAnchor="middle" fontSize={8} fill="#94a3b8" fontWeight="700">cliff: {formatShort(cliff)}</text>
          </svg>
        </div>
      </div>
    </>
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
  const manualCliff = company?.salaryCliff || 5000;
  const currency = company?.currency || "USD";

  const { state: m3State, update: updateM3 } = useModuleData("m3");
  const activeTab    = m3State.activeTab    || "overview";
  const useAutoCliff = m3State.useAutoCliff ?? true;
  const customCliff  = m3State.customCliff  ?? manualCliff;
  const simTarget    = m3State.simTarget    ?? (manualCliff + 200);
  const src = data;

  const marketRate = m3State.marketRate || (() => {
    const depts = [...new Set(src.map(e => e.Department).filter(Boolean))];
    const result = {};
    depts.forEach(d => { result[d] = Math.round(manualCliff * 1.15); });
    return result;
  })();

  const [aiText, setAiText]     = useState("");
  const [aiLoading, setAiLoading] = useState(false);

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
      {/* ── HEADER INFO ── */}
      <div className="bg-white rounded-[14px] p-[14px_20px] border-[1.5px] border-slate-100 mb-4">
        <div className="font-bold text-[13px] text-brand-dark">💰 Salary Benchmarking</div>
        <div className="text-[11px] text-slate-400 mt-0.5">
          {data.length} employees from your CSV · salary analysis active
        </div>
      </div>
      
      {/* Tab switcher */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {TABS.map(t => {
          const isActive = activeTab === t.id;
          return (
            <button 
              key={t.id} 
              onClick={() => updateM3({ activeTab: t.id })}
              className={`px-[18px] py-[9px] rounded-[10px] cursor-pointer text-[13px] font-medium transition-all duration-150 border-[1.5px] ${isActive ? "bg-gradient-to-br from-brand-amber to-brand-red text-white border-transparent font-bold shadow-sm" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"}`}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Cliff Selector — BUG FIXED: Changed !isEmpty to data.length > 0 */}
      {data.length > 0 && (
        <div className="bg-white rounded-[14px] p-[16px_20px] border-[1.5px] border-slate-100 mb-[18px] flex flex-wrap gap-4 items-center">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
              Salary Cliff Mode
            </div>
            <div className="flex gap-2">
              {[{ id: true, label: `Auto-detected: ${fmt(autoCliff)}` }, { id: false, label: "Manual" }].map(opt => (
                <button 
                  key={String(opt.id)} 
                  onClick={() => updateM3({ useAutoCliff: opt.id })}
                  className={`px-[14px] py-[6px] rounded-lg border-none cursor-pointer text-xs font-medium transition-colors ${useAutoCliff === opt.id ? "bg-brand-amber text-white font-bold" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          
          {!useAutoCliff && (
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Custom Cliff</div>
              <input 
                type="number" 
                value={customCliff} 
                onChange={e => updateM3({ customCliff: Number(e.target.value) })}
                className="p-[7px_12px] rounded-lg border-[1.5px] border-slate-200 text-[13px] text-brand-navy bg-slate-50 w-[120px] outline-none focus:border-brand-amber" 
              />
            </div>
          )}
          
          <div className="ml-auto bg-amber-50 border border-amber-200 rounded-[10px] p-[8px_16px]">
            <div className="text-[10px] text-amber-800 font-bold uppercase tracking-wide">Active Cliff</div>
            <div className="text-[22px] font-extrabold text-amber-700 font-display leading-tight">
              {fmt(cliff)}<span className="text-[11px] text-amber-800 font-body">/mo</span>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: OVERVIEW ── */}
      {activeTab === "overview" && (
        <div>
          {/* KPI Row */}
          <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3 mb-[18px]">
            {[
              { label: "In Danger Zone", value: stats.belowCliff, sub: `${stats.belowCliffPct}% of workforce`, color: "#ef4444", bg: "#fef2f2", icon: "🚨" },
              { label: "In Safe Zone", value: stats.above, sub: `${100 - Number(stats.belowCliffPct)}% retained`, color: "#22c55e", bg: "#f0fdf4", icon: "✅" },
              { label: "Avg Salary Gap", value: fmt(stats.avgGap), sub: "Per danger-zone employee/mo", color: "#f59e0b", bg: "#fffbeb", icon: "📉" },
              { label: "Annual Fix Budget", value: fmt(stats.totalBudgetNeeded, true), sub: "To bring all to cliff", color: "#8b5cf6", bg: "#f5f3ff", icon: "💰" },
              { label: "Resigned Avg Salary", value: fmt(stats.avgResigned), sub: `vs Active: ${fmt(stats.avgActive)}`, color: "#dc2626", bg: "#fff1f2", icon: "🚪" },
              { label: "Salary Gap Impact", value: fmt(stats.salaryDiff), sub: "Active earns more than resigned", color: "#3b82f6", bg: "#eff6ff", icon: "📊" },
            ].map((k, i) => (
              <div key={i} className="relative overflow-hidden rounded-[13px] p-[14px_16px]" style={{ background: k.bg, border: `1.5px solid ${k.color}22` }}>
                <div className="absolute right-2.5 top-2 text-lg opacity-20">{k.icon}</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{k.label}</div>
                <div className="text-[22px] font-extrabold leading-tight font-display" style={{ color: k.color }}>{k.value}</div>
                <div className="text-[10px] text-slate-500 mt-1">{k.sub}</div>
              </div>
            ))}
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-white rounded-[14px] p-[16px_18px] border-[1.5px] border-slate-100">
              <div className="font-bold text-[13px] text-brand-dark mb-0.5">Salary vs Satisfaction Map</div>
              <div className="text-[10px] text-slate-400 mb-2.5">Red zone = danger · Green zone = safe · Size = at-risk</div>
              <SalaryScatter data={src} cliff={cliff} currSymbol={currSymbol} />
              <div className="flex gap-2.5 mt-2 flex-wrap">
                {[{ l: "Resigned", c: "#ef4444" }, { l: "High Risk", c: "#f59e0b" }, { l: "Active", c: "#22c55e" }].map(x => (
                  <div key={x.l} className="flex items-center gap-1">
                    <div className="w-[7px] h-[7px] rounded-full" style={{ background: x.c }} />
                    <span className="text-[10px] text-slate-500">{x.l}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-[14px] p-[16px_18px] border-[1.5px] border-slate-100">
              <div className="font-bold text-[13px] text-brand-dark mb-0.5">Salary Distribution</div>
              <div className="text-[10px] text-slate-400 mb-2.5">Red bars = danger zone · Green bars = safe zone</div>
              <SalaryDistribution data={src} cliff={cliff} currSymbol={currSymbol} />
              <div className="mt-2.5 bg-red-50 rounded-lg p-[8px_12px] border border-red-200">
                <span className="text-[11px] text-brand-red font-bold">
                  💡 {fmt(stats.avgGap)}/mo avg gap · Fix costs {fmt(Math.round(stats.totalBudgetNeeded / 12))}/mo total
                </span>
              </div>
            </div>
          </div>

          {/* Dept breakdown */}
          <div className="bg-white rounded-[14px] p-[16px_18px] border-[1.5px] border-slate-100 mb-4">
            <div className="font-bold text-[13px] text-brand-dark mb-3.5">Department Danger Zone Breakdown</div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3">
              {stats.depts.map((d, i) => {
                const pct = Number(d.belowPct);
                const color = pct > 70 ? "#ef4444" : pct > 40 ? "#f59e0b" : "#22c55e";
                return (
                  <div key={i} className="bg-slate-50 rounded-[11px] p-[12px_14px]" style={{ border: `1.5px solid ${color}22` }}>
                    <div className="flex justify-between mb-1.5">
                      <span className="font-bold text-[13px] text-brand-dark">{d.dept}</span>
                      <span className="font-extrabold text-[14px]" style={{ color }}>{d.belowPct}%</span>
                    </div>
                    <div className="h-[6px] bg-slate-200 rounded-[3px] overflow-hidden mb-1.5">
                      <div className="h-full rounded-[3px] transition-all duration-500" style={{ width: `${d.belowPct}%`, background: color }} />
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {d.below}/{d.total} below cliff · Avg {fmt(d.avgSal)}/mo
                    </div>
                    {d.gap > 0 && (
                      <div className="text-[11px] text-brand-red font-semibold mt-1">
                        Gap: {fmt(d.gap)}/mo avg
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Insight */}
          <div className="bg-white rounded-[14px] p-[16px_18px] border-[1.5px] border-slate-100">
            <button 
              onClick={handleAI} 
              disabled={aiLoading}
              className={`w-full p-3 border-none rounded-[10px] text-[13px] font-bold transition-colors ${aiLoading ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-brand-dark text-white cursor-pointer hover:bg-slate-800"}`}
            >
              {aiLoading ? "⏳ Generating Salary Analysis..." : "🤖 Get AI Compensation Insight"}
            </button>
            {aiText && (
              <div className="mt-3.5 bg-slate-50 rounded-[10px] p-[14px_16px] border-[1.5px] border-slate-200">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">AI Compensation Analysis</div>
                <div className="text-xs text-brand-navy leading-relaxed whitespace-pre-wrap">{aiText}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: EMPLOYEE GAP TABLE ── */}
      {activeTab === "employee" && (
        <div className="bg-white rounded-[14px] p-[16px_18px] border-[1.5px] border-slate-100">
          <div className="flex justify-between items-center mb-3.5 flex-wrap gap-2.5">
            <div>
              <div className="font-bold text-sm text-brand-dark">Per-Employee Gap Analysis</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Sorted by salary gap — highest risk first</div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-[6px_14px] text-xs text-brand-red font-bold">
              {stats.belowCliff} employees need attention
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50">
                  {["Employee", "Dept", "Gen", "Current Salary", "Gap to Cliff", "Target Salary", "Annual Fix Cost", "Status", "Risk"].map(h => (
                    <th key={h} className="p-[8px_10px] text-left text-slate-500 font-bold text-[10px] uppercase tracking-wider border-b-2 border-slate-100 whitespace-nowrap">{h}</th>
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
                      <tr key={e.EmployeeID || i} className={`border-b border-slate-50 ${isRisk ? (i % 2 === 0 ? "bg-[#fffbf0]" : "bg-[#fff8ee]") : (i % 2 === 0 ? "bg-white" : "bg-[#fafafa]")}`}>
                        <td className="p-[7px_10px] text-brand-navy font-medium whitespace-nowrap">{e.FirstName} {e.LastName}</td>
                        <td className="p-[7px_10px] text-slate-600 text-[11px]">{e.Department}</td>
                        <td className="p-[7px_10px]">
                          <span className={`px-1.5 py-px rounded-full text-[9px] font-bold ${getGeneration(e.Age) === "Gen Z" ? "bg-amber-100 text-amber-800" : getGeneration(e.Age) === "Millennial" ? "bg-blue-50 text-blue-700" : "bg-green-50 text-green-800"}`}>
                            {getGeneration(e.Age)}
                          </span>
                        </td>
                        <td className={`p-[7px_10px] font-bold ${isRisk ? "text-brand-red" : "text-green-600"}`}>
                          {fmt(e.MonthlySalary || 0)}
                        </td>
                        <td className={`p-[7px_10px] font-bold ${gap > 500 ? "text-brand-red" : gap > 0 ? "text-brand-amber" : "text-green-500"}`}>
                          {gap > 0 ? `−${fmt(gap)}` : "✓ Safe"}
                        </td>
                        <td className={`p-[7px_10px] text-brand-navy ${gap > 0 ? "font-semibold" : "font-normal"}`}>
                          {gap > 0 ? fmt(cliff) : "—"}
                        </td>
                        <td className={`p-[7px_10px] ${gap > 0 ? "text-violet-500 font-semibold" : "text-slate-400 font-normal"}`}>
                          {gap > 0 ? fmt(gap * 12) : "—"}
                        </td>
                        <td className="p-[7px_10px]">
                          <span className={`px-[7px] py-[2px] rounded-full text-[10px] font-bold ${e.AttritionStatus === "Resigned" ? "bg-red-50" : e.AttritionStatus === "High Risk" ? "bg-amber-50" : "bg-green-50"}`} style={{ color: getStatusColor(e.AttritionStatus) }}>
                            {e.AttritionStatus}
                          </span>
                        </td>
                        <td className="p-[7px_10px]">
                          <div className="w-[40px] h-[5px] bg-slate-100 rounded-[3px] overflow-hidden">
                            <div className="h-full rounded-[3px]" style={{ width: `${Math.min(100, (gap / cliff) * 200)}%`, background: gap > 500 ? "#ef4444" : gap > 0 ? "#f59e0b" : "#22c55e" }} />
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
          <div className="bg-white rounded-[14px] p-[20px_22px] border-[1.5px] border-slate-100 mb-4">
            <div className="font-bold text-sm text-brand-dark mb-1">🎯 Cliff Scenario Builder</div>
            <div className="text-[11px] text-slate-400 mb-4">
              Drag the target salary slider to see how many employees move from danger to safe zone — and what it costs
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-600">Target Minimum Salary</span>
                <span className="text-lg font-extrabold text-brand-amber font-display">{fmt(simTarget)}/mo</span>
              </div>
              <input type="range"
                min={Math.round(manualCliff * 0.3)}
                max={Math.round(manualCliff * 2.5)}
                step={Math.round(manualCliff * 0.02) || 100}
                value={simTarget}
                onChange={e => updateM3({ simTarget: Number(e.target.value) })}
                className="w-full accent-brand-amber" 
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                <span>{fmt(Math.round(manualCliff * 0.3))}</span>
                <span>{fmt(Math.round(manualCliff * 2.5))}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { label: "Employees Below Target", value: simStats.count, sub: `${simStats.pct}% of workforce`, color: simStats.count > stats.belowCliff ? "#ef4444" : "#22c55e" },
                { label: "Monthly Budget Needed", value: fmt(Math.round(simStats.totalCost / 12)), sub: "Total salary adjustments", color: "#f59e0b" },
                { label: "Annual Investment", value: fmt(simStats.totalCost, true), sub: "vs turnover cost savings", color: "#8b5cf6" },
              ].map((k, i) => (
                <div key={i} className="bg-slate-50 rounded-[11px] p-[14px_16px] border-[1.5px] border-slate-100 text-center">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{k.label}</div>
                  <div className="text-[22px] font-extrabold font-display" style={{ color: k.color }}>{k.value}</div>
                  <div className="text-[10px] text-slate-500 mt-1">{k.sub}</div>
                </div>
              ))}
            </div>

            {/* ROI comparison */}
            <div className="mt-4 bg-green-50 rounded-[11px] p-[14px_16px] border border-green-200">
              <div className="font-bold text-xs text-green-800 mb-1.5">💡 ROI Snapshot</div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <div className="text-[10px] text-slate-400">Annual salary fix cost</div>
                  <div className="text-base font-bold text-brand-red">{fmt(simStats.totalCost)}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400">Estimated turnover savings (50% reduction)</div>
                  <div className="text-base font-bold text-green-600">
                    {fmt(Math.round(stats.belowCliff * stats.avgResigned * 12 * (company?.replacementMultiplier || 1.5) * 0.5))}
                  </div>
                </div>
              </div>
              {simStats.totalCost < stats.belowCliff * stats.avgResigned * 12 * (company?.replacementMultiplier || 1.5) * 0.5 && (
                <div className="mt-2 text-[11px] text-green-600 font-bold">
                  ✅ Salary fix costs LESS than projected turnover savings — positive ROI!
                </div>
              )}
            </div>
          </div>

          {/* Dept-level adjustment plan */}
          <div className="bg-white rounded-[14px] p-[20px_22px] border-[1.5px] border-slate-100">
            <div className="font-bold text-sm text-brand-dark mb-3.5">📋 Department Adjustment Plan</div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50">
                    {["Department", "Employees Below", "% at Risk", "Avg Current", "Target", "Avg Gap", "Monthly Budget", "Annual Budget", "Priority"].map(h => (
                      <th key={h} className="p-[8px_10px] text-left text-slate-500 font-bold text-[10px] uppercase tracking-wider border-b-2 border-slate-100 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats.depts.map((d, i) => {
                    const priority = Number(d.belowPct) > 70 ? "🔴 Urgent" : Number(d.belowPct) > 40 ? "🟡 High" : "🟢 Monitor";
                    const monthlyBudget = d.below * d.gap;
                    return (
                      <tr key={i} className={`border-b border-slate-50 ${i % 2 === 0 ? "bg-white" : "bg-[#fafafa]"}`}>
                        <td className="p-[8px_10px] font-semibold text-brand-navy">{d.dept}</td>
                        <td className="p-[8px_10px] text-brand-red font-bold">{d.below}</td>
                        <td className="p-[8px_10px]">
                          <div className="flex items-center gap-1.5">
                            <div className="w-[36px] h-[5px] bg-slate-100 rounded-[3px] overflow-hidden">
                              <div className="h-full rounded-[3px]" style={{ width: `${d.belowPct}%`, background: Number(d.belowPct) > 70 ? "#ef4444" : Number(d.belowPct) > 40 ? "#f59e0b" : "#22c55e" }} />
                            </div>
                            <span className="font-bold" style={{ color: Number(d.belowPct) > 70 ? "#ef4444" : "#64748b" }}>{d.belowPct}%</span>
                          </div>
                        </td>
                        <td className="p-[8px_10px] text-brand-red font-semibold">{fmt(d.avgSal)}</td>
                        <td className="p-[8px_10px] text-green-600 font-semibold">{fmt(cliff)}</td>
                        <td className="p-[8px_10px] text-brand-amber font-semibold">{d.gap > 0 ? `+${fmt(d.gap)}` : "✓"}</td>
                        <td className="p-[8px_10px] text-violet-500 font-semibold">{monthlyBudget > 0 ? fmt(monthlyBudget) : "—"}</td>
                        <td className="p-[8px_10px] text-violet-500 font-bold">{monthlyBudget > 0 ? fmt(monthlyBudget * 12) : "—"}</td>
                        <td className="p-[8px_10px] text-[11px] font-bold">{priority}</td>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-[14px] p-[20px_22px] border-[1.5px] border-slate-100">
            <div className="font-bold text-sm text-brand-dark mb-1">🕸 Dept Salary Radar</div>
            <div className="text-[11px] text-slate-400 mb-4">
              Each axis = department · Distance from center = avg salary vs cliff
            </div>
            <DeptSalaryRadar depts={stats.depts} cliff={cliff} currSymbol={currSymbol} />
          </div>

          <div className="bg-white rounded-[14px] p-[20px_22px] border-[1.5px] border-slate-100">
            <div className="font-bold text-sm text-brand-dark mb-3.5">📊 Dept Risk Ranking</div>
            {[...stats.depts].sort((a, b) => a.avgSal - b.avgSal).map((d, i) => {
              const pct = Math.min(100, Math.round((d.avgSal / cliff) * 100));
              const color = pct >= 100 ? "#22c55e" : pct >= 80 ? "#f59e0b" : "#ef4444";
              return (
                <div key={i} className="mb-3.5">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs font-semibold text-brand-navy">{d.dept}</span>
                    <span className="text-xs font-bold" style={{ color }}>{fmt(Math.round(d.avgSal), true)}/mo</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded overflow-hidden">
                    <div className="h-full rounded transition-all duration-500 ease-in-out" style={{ width: `${pct}%`, background: color }} />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-slate-400">{d.below} below cliff</span>
                    <span className="text-[10px] font-bold" style={{ color }}>{pct}% of cliff</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Export dept plan */}
          <div className="col-span-1 lg:col-span-2 bg-white rounded-[14px] p-[16px_20px] border-[1.5px] border-slate-100 flex flex-wrap justify-between items-center gap-4">
            <div>
              <div className="font-bold text-[13px] text-brand-dark">📋 Export Department Adjustment Plan</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Download full salary adjustment plan as CSV</div>
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
              className="p-[10px_20px] rounded-[10px] border-none bg-gradient-to-br from-brand-amber to-brand-red text-white font-bold text-[13px] cursor-pointer whitespace-nowrap hover:opacity-90 transition-opacity"
            >
              ⬇ Export Plan CSV
            </button>
          </div>
        </div>
      )}
        
      {/* ── TAB: MARKET COMPARISON ── */}
      {activeTab === "market" && (
        <div>
          <div className="bg-white rounded-[14px] p-[20px_22px] border-[1.5px] border-slate-100 mb-4">
            <div className="font-bold text-sm text-brand-dark mb-1">📈 Market Rate Comparison</div>
            <div className="text-[11px] text-slate-400 mb-4">
              Enter industry market rates per department to see your compensation gap vs competitors
            </div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3">
              {stats.depts.map((d, i) => {
                const mRate = marketRate[d.dept] || 5000;
                const gap = mRate - d.avgSal;
                const gapColor = gap > 500 ? "#ef4444" : gap > 0 ? "#f59e0b" : "#22c55e";
                return (
                  <div key={i} className="bg-slate-50 rounded-[11px] p-[14px_16px] border-[1.5px] border-slate-100">
                    <div className="font-bold text-[13px] text-brand-dark mb-2">{d.dept}</div>
                    <div className="mb-2.5">
                      <div className="text-[10px] text-slate-400 mb-1">Your avg salary</div>
                      <div className="text-lg font-extrabold text-brand-navy">{fmt(d.avgSal)}</div>
                    </div>
                    <div className="mb-2.5">
                      <div className="text-[10px] text-slate-400 mb-1">Market rate (edit · {currSymbol})</div>
                      <input 
                        type="number" 
                        value={mRate}
                        onChange={e => updateM3({ marketRate: { ...marketRate, [d.dept]: Number(e.target.value) } })}
                        className="w-full p-[6px_10px] rounded-lg border-[1.5px] border-slate-200 text-[13px] font-bold text-brand-navy bg-white box-border outline-none focus:border-brand-amber" 
                      />
                    </div>
                    <div className={`rounded-lg p-[8px_10px] border ${gap > 0 ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}`}>
                      <div className="text-[10px] text-slate-400">Competitor gap</div>
                      <div className="text-base font-extrabold" style={{ color: gapColor }}>
                        {gap > 0 ? `−${fmt(gap)}/mo` : `+${fmt(Math.abs(gap))}/mo`}
                      </div>
                      <div className="text-[10px] font-bold mt-0.5" style={{ color: gapColor }}>
                        {gap > 500 ? "⚠ Competitors paying significantly more" : gap > 0 ? "Slightly below market" : "✓ Above market rate"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Competitor Subsidy Warning */}
          <div className="bg-red-50 rounded-[14px] p-[18px_20px] border-2 border-red-200">
            <div className="font-extrabold text-sm text-brand-red mb-2">
              🏴 The Competitor Subsidy Paradox
            </div>
            <div className="text-[13px] text-red-900 leading-relaxed">
              You are effectively training high-value employees — then handing them to competitors at a premium.
              Every resigned employee who was "Six Sigma-optimized" by your processes is now adding value at a rival company,
              without them paying any of the training or development cost. <strong>You paid to train talent for others.</strong>
            </div>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="bg-white rounded-[9px] p-[10px_14px]">
                <div className="text-[10px] text-slate-400">Total resigned employees</div>
                <div className="text-xl font-extrabold text-brand-red">{src.filter(e => e.AttritionStatus === "Resigned").length}</div>
              </div>
              <div className="bg-white rounded-[9px] p-[10px_14px]">
                <div className="text-[10px] text-slate-400">Avg salary they left for (est.)</div>
                <div className="text-xl font-extrabold text-brand-red">
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
          <div className="bg-white rounded-[14px] p-[20px_22px] border-[1.5px] border-slate-100 mb-4">
            <div className="font-bold text-sm text-brand-dark mb-1">🩺 Individual Salary Health</div>
            <div className="text-[11px] text-slate-400 mb-4">
              Each employee scored against the {currSymbol}{cliff.toLocaleString()} salary cliff · Red = immediate risk
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50">
                    {["Employee","Department","Monthly Salary","vs Cliff","Health","Status"].map(h => (
                      <th key={h} className="p-[8px_10px] text-left text-slate-500 font-bold text-[10px] uppercase tracking-wider border-b-2 border-slate-100 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...src].sort((a, b) => (a.MonthlySalary || 0) - (b.MonthlySalary || 0)).map((e, i) => {
                    const gap = cliff - (e.MonthlySalary || 0);
                    const isBelow = gap > 0;
                    return (
                      <tr key={e.EmployeeID || i} className={`border-b border-slate-50 ${isBelow ? "bg-red-50/50" : "bg-white"}`}>
                        <td className="p-[7px_10px] font-semibold text-brand-navy whitespace-nowrap">{e.FirstName} {e.LastName}</td>
                        <td className="p-[7px_10px] text-slate-600">{e.Department}</td>
                        <td className={`p-[7px_10px] font-bold ${isBelow ? "text-brand-red" : "text-green-600"}`}>{fmt(e.MonthlySalary || 0)}</td>
                        <td className="p-[7px_10px] text-[11px]">
                          {isBelow
                            ? <span className="text-brand-red font-bold">−{fmt(gap)}</span>
                            : <span className="text-green-600 font-bold">+{fmt(Math.abs(gap))}</span>}
                        </td>
                        <td className="p-[7px_10px]">
                          <SalaryHealthBar salary={e.MonthlySalary || 0} cliff={cliff} currSymbol={currSymbol} />
                        </td>
                        <td className="p-[7px_10px]">
                          <span className={`px-[8px] py-[2px] rounded-full text-[10px] font-bold ${e.AttritionStatus === "Resigned" ? "bg-red-50" : e.AttritionStatus === "High Risk" ? "bg-amber-50" : "bg-green-50"}`} style={{ color: e.AttritionStatus === "Resigned" ? "#ef4444" : e.AttritionStatus === "High Risk" ? "#f59e0b" : "#22c55e" }}>
                            {e.AttritionStatus}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3">
            {[
              { label: "Below Cliff", value: src.filter(e => (e.MonthlySalary || 0) < cliff).length, color: "#ef4444", icon: "⚠️", sub: "employees at risk" },
              { label: "Above Cliff", value: src.filter(e => (e.MonthlySalary || 0) >= cliff).length, color: "#22c55e", icon: "✅", sub: "employees stable" },
              { label: "Avg Gap (below)", value: fmt(Math.round(src.filter(e => (e.MonthlySalary||0) < cliff).reduce((s,e) => s + (cliff - (e.MonthlySalary||0)), 0) / Math.max(1, src.filter(e => (e.MonthlySalary||0) < cliff).length)), true), color: "#f59e0b", icon: "📉", sub: "avg monthly gap" },
              { label: "Total Fix Budget", value: fmt(src.filter(e => (e.MonthlySalary||0) < cliff).reduce((s,e) => s + (cliff - (e.MonthlySalary||0)), 0) * 12, true), color: "#8b5cf6", icon: "💰", sub: "annual cost to fix all" },
            ].map((k, i) => (
              <div key={i} className="bg-white rounded-[13px] p-[14px_16px]" style={{ border: `1.5px solid ${k.color}22` }}>
                <div className="text-lg mb-1">{k.icon}</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{k.label}</div>
                <div className="text-[22px] font-extrabold font-display" style={{ color: k.color }}>{k.value}</div>
                <div className="text-[10px] text-slate-500 mt-1">{k.sub}</div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
