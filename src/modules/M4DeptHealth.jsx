import { useState, useMemo, useEffect } from "react";
import { useApp, getGeneration, SAMPLE_DATA } from "../context/AppContext";

// ── Compute dept health scores ──
function computeDeptHealth(employees, cliff) {
  const deptMap = {};
  employees.forEach(e => {
    const d = e.Department;
    if (!deptMap[d]) deptMap[d] = [];
    deptMap[d].push(e);
  });

  return Object.entries(deptMap).map(([dept, emps]) => {
    const total = emps.length;
    const resigned = emps.filter(e => e.AttritionStatus === "Resigned").length;
    const highRisk = emps.filter(e => e.AttritionStatus === "High Risk").length;
    const active = emps.filter(e => e.AttritionStatus === "Active").length;
    const attritionRate = total > 0 ? ((resigned + highRisk) / total) * 100 : 0;
    const withOT = emps.filter(e => e.OvertimeStatus === "Yes").length;
    const overtimePct = total > 0 ? (withOT / total) * 100 : 0;
    const avgSat = emps.length > 0 ? emps.reduce((s, e) => s + (e.JobSatisfaction || 0), 0) / emps.length : 0;
    const avgSal = total > 0 ? emps.reduce((s, e) => s + (e.MonthlySalary || 0), 0) / total : 0;
    const avgTenure = total > 0 ? emps.reduce((s, e) => s + (e.YearsAtCompany || 0), 0) / total : 0;
    const belowCliff = emps.filter(e => (e.MonthlySalary || 0) < cliff).length;
    const belowCliffPct = total > 0 ? (belowCliff / total) * 100 : 0;

    // Human Buffer Metric — measures how much "slack" exists before human capacity breaks
    // Formula: (100 - overtimePct) * (avgSat/10) * (active/total) — higher = more buffer
    const humanBuffer = total > 0
      ? Math.round(((100 - overtimePct) / 100) * (avgSat / 10) * (active / total) * 100)
      : 50;

    // Burnout Index — inverse of human buffer + overtime pressure
    const burnoutIndex = Math.min(100, Math.round(
      (overtimePct * 0.4) + ((10 - avgSat) * 5) + (attritionRate * 0.3)
    ));

    // Survivor Burnout Risk — if attrition >40%, survivors absorb workload
    const survivorRisk = attritionRate > 40;
    const survivorLoad = survivorRisk && active > 0
      ? Math.round(((resigned + highRisk) / active) * 100)
      : 0;

    // Traffic light per metric
    const trafficLight = (val, thresholds, invert = false) => {
      const [red, yellow] = thresholds;
      if (!invert) {
        if (val >= red) return "red";
        if (val >= yellow) return "yellow";
        return "green";
      } else {
        if (val <= red) return "red";
        if (val <= yellow) return "yellow";
        return "green";
      }
    };

    const metrics = {
      attrition: { value: attritionRate.toFixed(1), unit: "%", light: trafficLight(attritionRate, [40, 20]), label: "Attrition Rate" },
      overtime: { value: overtimePct.toFixed(1), unit: "%", light: trafficLight(overtimePct, [70, 40]), label: "Overtime Exposure" },
      satisfaction: { value: avgSat.toFixed(1), unit: "/10", light: trafficLight(avgSat, [7, 5], true), label: "Avg Satisfaction" },
      salary: { value: Math.round(avgSal).toLocaleString(), unit: "$", light: trafficLight(avgSal, [cliff, cliff * 0.9], true), label: "Avg Salary" },
      belowCliff: { value: belowCliffPct.toFixed(1), unit: "%", light: trafficLight(belowCliffPct, [60, 30]), label: "Below Cliff" },
      humanBuffer: { value: humanBuffer, unit: "%", light: trafficLight(humanBuffer, [40, 60], true), label: "Human Buffer" },
    };

    // Overall health score (weighted)
    const healthScore = Math.round(
      (100 - attritionRate) * 0.3 +
      (100 - overtimePct) * 0.2 +
      (avgSat / 10 * 100) * 0.2 +
      Math.min(100, (avgSal / cliff) * 100) * 0.15 +
      humanBuffer * 0.15
    );

    return {
      dept, total, resigned, highRisk, active,
      attritionRate, overtimePct, avgSat, avgSal,
      avgTenure, belowCliff, belowCliffPct,
      humanBuffer, burnoutIndex, survivorRisk, survivorLoad,
      metrics, healthScore,
      genBreakdown: {
        genZ: emps.filter(e => getGeneration(e.Age) === "Gen Z").length,
        millennial: emps.filter(e => getGeneration(e.Age) === "Millennial").length,
        senior: emps.filter(e => getGeneration(e.Age) === "Senior").length,
      }
    };
  }).sort((a, b) => a.healthScore - b.healthScore);
}

// ── Traffic Light Component ──
function TrafficLight({ light }) {
  const colors = {
    red: { on: "#ef4444", off: "#fecaca" },
    yellow: { on: "#f59e0b", off: "#fde68a" },
    green: { on: "#22c55e", off: "#bbf7d0" },
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3, alignItems: "center" }}>
      {["red", "yellow", "green"].map(c => (
        <div key={c} style={{
          width: 10, height: 10, borderRadius: "50%",
          background: light === c ? colors[c].on : colors[c].off,
          boxShadow: light === c ? `0 0 6px ${colors[c].on}` : "none",
          transition: "all 0.3s",
        }} />
      ))}
    </div>
  );
}

// ── Blinking CRITICAL Alert ──
function CriticalAlert({ dept, attritionRate, survivorLoad }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const interval = setInterval(() => setVisible(v => !v), 700);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      background: visible ? "#fef2f2" : "#fff5f5",
      border: `2px solid ${visible ? "#ef4444" : "#fca5a5"}`,
      borderRadius: 10, padding: "10px 14px", marginTop: 10,
      transition: "all 0.3s",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{
          width: 10, height: 10, borderRadius: "50%",
          background: visible ? "#ef4444" : "#fca5a5",
          boxShadow: visible ? "0 0 10px #ef4444" : "none",
          transition: "all 0.3s", flexShrink: 0,
        }} />
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: "#dc2626" }}>
            🚨 CRITICAL: High Risk of Survivor Burnout
          </div>
          <div style={{ fontSize: 10, color: "#7f1d1d", marginTop: 2, lineHeight: 1.4 }}>
            {dept} has {attritionRate.toFixed(0)}% attrition. Each remaining active employee now carries
            ~{survivorLoad}% extra workload. <strong>Secondary burnout wave imminent.</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Radar Chart (SVG) ──
function RadarChart({ metrics, size = 160 }) {
  const keys = Object.keys(metrics);
  const n = keys.length;
  const cx = size / 2, cy = size / 2;
  const r = size * 0.38;
  const innerR = r * 0.25;

  const metricToScore = (key, m) => {
    const val = parseFloat(m.value);
    if (key === "satisfaction" || key === "humanBuffer") return Math.min(1, val / 10);
    if (key === "salary") return 0.7; // normalized
    if (key === "attrition" || key === "overtime" || key === "belowCliff") return Math.max(0, 1 - val / 100);
    return 0.5;
  };

  const points = keys.map((key, i) => {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
    const score = metricToScore(key, metrics[key]);
    const pr = innerR + score * (r - innerR);
    return { x: cx + pr * Math.cos(angle), y: cy + pr * Math.sin(angle), angle, key };
  });

  const polygonPoints = points.map(p => `${p.x},${p.y}`).join(" ");
  const gridPoints = keys.map((_, i) => {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  });

  const lightColor = (light) => light === "red" ? "#ef4444" : light === "yellow" ? "#f59e0b" : "#22c55e";

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Grid rings */}
      {[0.25, 0.5, 0.75, 1].map(scale => (
        <polygon key={scale}
          points={keys.map((_, i) => {
            const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
            const pr = innerR + scale * (r - innerR);
            return `${cx + pr * Math.cos(angle)},${cy + pr * Math.sin(angle)}`;
          }).join(" ")}
          fill="none" stroke="#f1f5f9" strokeWidth={1}
        />
      ))}
      {/* Axis lines */}
      {gridPoints.map((p, i) => (
        <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#e2e8f0" strokeWidth={1} />
      ))}
      {/* Data polygon */}
      <polygon points={polygonPoints} fill="#f59e0b" fillOpacity={0.2} stroke="#f59e0b" strokeWidth={1.5} />
      {/* Data points */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3}
          fill={lightColor(metrics[keys[i]].light)} />
      ))}
      {/* Labels */}
      {keys.map((key, i) => {
        const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
        const labelR = r + 14;
        const lx = cx + labelR * Math.cos(angle);
        const ly = cy + labelR * Math.sin(angle);
        return (
          <text key={key} x={lx} y={ly} textAnchor="middle" fontSize={6.5} fill="#64748b" dominantBaseline="middle">
            {metrics[key].label.split(" ")[0]}
          </text>
        );
      })}
    </svg>
  );
}

// ── Health Score Ring ──
function HealthRing({ score, size = 80 }) {
  const color = score >= 70 ? "#22c55e" : score >= 45 ? "#f59e0b" : "#ef4444";
  const cx = size / 2, cy = size / 2, r = size * 0.38;
  const strokeW = size * 0.1;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference * (1 - score / 100);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={strokeW} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={strokeW}
        strokeDasharray={circumference} strokeDashoffset={dashOffset}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`} />
      <text x={cx} y={cy + 1} textAnchor="middle" fontSize={size * 0.2} fontWeight="800" fill={color}>{score}</text>
      <text x={cx} y={cy + size * 0.17} textAnchor="middle" fontSize={size * 0.1} fill="#94a3b8">health</text>
    </svg>
  );
}

// ── Dept Card ──
function DeptCard({ dept, onSelect, selected }) {
  const color = dept.healthScore >= 70 ? "#22c55e" : dept.healthScore >= 45 ? "#f59e0b" : "#ef4444";
  const bg = dept.healthScore >= 70 ? "#f0fdf4" : dept.healthScore >= 45 ? "#fffbeb" : "#fef2f2";
  const border = dept.healthScore >= 70 ? "#bbf7d0" : dept.healthScore >= 45 ? "#fde68a" : "#fecaca";

  return (
    <div onClick={() => onSelect(dept.dept)}
      style={{
        background: selected ? "#fffbeb" : bg,
        borderRadius: 14, padding: "16px 18px",
        border: `2px solid ${selected ? "#f59e0b" : border}`,
        cursor: "pointer", transition: "all 0.2s",
        boxShadow: selected ? "0 0 0 3px #f59e0b33" : "none",
      }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>{dept.dept}</div>
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 1 }}>{dept.total} employees</div>
        </div>
        <HealthRing score={dept.healthScore} size={52} />
      </div>

      {/* Metrics grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 8 }}>
        {Object.entries(dept.metrics).map(([key, m]) => (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", borderRadius: 7, padding: "5px 8px" }}>
            <TrafficLight light={m.light} />
            <div>
              <div style={{ fontSize: 9, color: "#94a3b8", lineHeight: 1 }}>{m.label}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#1e293b" }}>{m.unit === "$" ? "$" : ""}{m.value}{m.unit !== "$" ? m.unit : ""}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Human Buffer Bar */}
      <div style={{ marginBottom: 6 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#94a3b8", marginBottom: 3 }}>
          <span>Human Buffer Capacity</span>
          <span style={{ fontWeight: 700, color: dept.humanBuffer < 30 ? "#ef4444" : dept.humanBuffer < 60 ? "#f59e0b" : "#22c55e" }}>{dept.humanBuffer}%</span>
        </div>
        <div style={{ height: 5, background: "#f1f5f9", borderRadius: 3, overflow: "hidden" }}>
          <div style={{
            width: `${dept.humanBuffer}%`, height: "100%", borderRadius: 3,
            background: dept.humanBuffer < 30 ? "#ef4444" : dept.humanBuffer < 60 ? "#f59e0b" : "#22c55e",
            transition: "width 0.5s"
          }} />
        </div>
      </div>

      {/* Burnout Index */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#94a3b8", marginBottom: 3 }}>
          <span>Burnout Index</span>
          <span style={{ fontWeight: 700, color: dept.burnoutIndex > 70 ? "#ef4444" : dept.burnoutIndex > 40 ? "#f59e0b" : "#22c55e" }}>{dept.burnoutIndex}%</span>
        </div>
        <div style={{ height: 5, background: "#f1f5f9", borderRadius: 3, overflow: "hidden" }}>
          <div style={{
            width: `${dept.burnoutIndex}%`, height: "100%", borderRadius: 3,
            background: dept.burnoutIndex > 70 ? "#ef4444" : dept.burnoutIndex > 40 ? "#f59e0b" : "#22c55e",
            transition: "width 0.5s"
          }} />
        </div>
      </div>

      {/* Survivor Burnout Alert */}
      {dept.survivorRisk && (
        <CriticalAlert dept={dept.dept} attritionRate={dept.attritionRate} survivorLoad={dept.survivorLoad} />
      )}
    </div>
  );
}

// ── Dept Detail Panel ──
function DeptDetail({ dept, allDepts, cliff }) {
  const color = dept.healthScore >= 70 ? "#22c55e" : dept.healthScore >= 45 ? "#f59e0b" : "#ef4444";
  const others = allDepts.filter(d => d.dept !== dept.dept);

  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: "22px 24px", border: "1.5px solid #f1f5f9" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 22, fontWeight: 700, color: "#0f172a" }}>{dept.dept}</div>
          <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 3 }}>
            {dept.total} employees · {dept.active} active · {dept.resigned} resigned · {dept.highRisk} high risk
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <HealthRing score={dept.healthScore} size={72} />
          <div style={{ fontSize: 11, fontWeight: 700, color, marginTop: 4 }}>
            {dept.healthScore >= 70 ? "HEALTHY" : dept.healthScore >= 45 ? "AT RISK" : "CRITICAL"}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        {/* Left */}
        <div>
          {/* Radar */}
          <div style={{ background: "#f8fafc", borderRadius: 12, padding: "14px", marginBottom: 14, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 8 }}>Health Radar</div>
            <RadarChart metrics={dept.metrics} size={150} />
          </div>

          {/* Generation breakdown */}
          <div style={{ background: "#f8fafc", borderRadius: 12, padding: "14px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 10 }}>Generation Breakdown</div>
            {[
              { label: "Gen Z (<26)", val: dept.genBreakdown.genZ, color: "#f59e0b", bg: "#fffbeb" },
              { label: "Millennial (26–35)", val: dept.genBreakdown.millennial, color: "#3b82f6", bg: "#eff6ff" },
              { label: "Senior (>35)", val: dept.genBreakdown.senior, color: "#22c55e", bg: "#f0fdf4" },
            ].map(g => (
              <div key={g.label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: g.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: g.color, flexShrink: 0 }}>{g.val}</div>
                <div>
                  <div style={{ fontSize: 11, color: "#475569" }}>{g.label}</div>
                  <div style={{ width: `${dept.total > 0 ? (g.val / dept.total) * 100 : 0}%`, height: 3, background: g.color, borderRadius: 2, marginTop: 2, minWidth: g.val > 0 ? 8 : 0 }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right */}
        <div>
          {/* Metric details */}
          <div style={{ marginBottom: 14 }}>
            {Object.entries(dept.metrics).map(([key, m]) => {
              const lightColors = { red: "#ef4444", yellow: "#f59e0b", green: "#22c55e" };
              const lightBg = { red: "#fef2f2", yellow: "#fffbeb", green: "#f0fdf4" };
              return (
                <div key={key} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, background: lightBg[m.light], borderRadius: 9, padding: "8px 12px", border: `1px solid ${lightColors[m.light]}22` }}>
                  <TrafficLight light={m.light} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: "#64748b" }}>{m.label}</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: lightColors[m.light] }}>
                      {m.unit === "$" ? "$" : ""}{m.value}{m.unit !== "$" ? m.unit : ""}
                    </div>
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: lightColors[m.light], textTransform: "uppercase" }}>
                    {m.light === "red" ? "⚠ Critical" : m.light === "yellow" ? "! Watch" : "✓ Good"}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Human Buffer Explanation */}
          <div style={{ background: "#fffbeb", borderRadius: 10, padding: "12px 14px", border: "1px solid #fde68a", marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#92400e", marginBottom: 4 }}>🧠 Human Buffer Metric</div>
            <div style={{ fontSize: 11, color: "#78350f", lineHeight: 1.5 }}>
              Measures how much "operational slack" exists before human capacity breaks.
              Formula: <em>(No-OT%) × (Satisfaction/10) × (Active/Total)</em>
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: dept.humanBuffer < 30 ? "#ef4444" : "#f59e0b", marginTop: 6 }}>
              Buffer: {dept.humanBuffer}% {dept.humanBuffer < 30 ? "— DANGER: Near capacity collapse" : dept.humanBuffer < 60 ? "— WARNING: Limited slack" : "— OK"}
            </div>
          </div>

          {/* Comparison vs other depts */}
          <div style={{ background: "#f8fafc", borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", marginBottom: 8 }}>vs Other Departments</div>
            {others.map(o => {
              const oColor = o.healthScore >= 70 ? "#22c55e" : o.healthScore >= 45 ? "#f59e0b" : "#ef4444";
              return (
                <div key={o.dept} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                  <span style={{ fontSize: 11, color: "#475569", width: 110, flexShrink: 0 }}>{o.dept}</span>
                  <div style={{ flex: 1, height: 5, background: "#e2e8f0", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ width: `${o.healthScore}%`, height: "100%", background: oColor, borderRadius: 3 }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: oColor, width: 28, textAlign: "right" }}>{o.healthScore}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── MAIN M4 ──
export default function M4DeptHealth() {
  const { data, company } = useApp();
  const src = data.length > 0 ? data : SAMPLE_DATA;
  const cliff = company?.salaryCliff || 5000;
  const [selected, setSelected] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  const depts = useMemo(() => computeDeptHealth(src, cliff), [src, cliff]);
  const criticalDepts = depts.filter(d => d.survivorRisk);
  const avgHealth = depts.length > 0 ? Math.round(depts.reduce((s, d) => s + d.healthScore, 0) / depts.length) : 0;
  const selectedDept = depts.find(d => d.dept === selected) || depts[0];

  const TABS = [
    { id: "overview", label: "🏥 All Departments" },
    { id: "detail", label: "🔍 Dept Deep-Dive" },
    { id: "compare", label: "⚖️ Side-by-Side Compare" },
  ];

  return (
    <div>
      {/* Global Critical Alert Banner */}
      {criticalDepts.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          {criticalDepts.map(d => (
            <div key={d.dept} style={{ background: "#fef2f2", borderRadius: 12, padding: "12px 18px", border: "2px solid #ef4444", marginBottom: 8, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ fontSize: 20, flexShrink: 0 }}>🚨</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 13, color: "#dc2626" }}>
                  CRITICAL ALERT — {d.dept}: Survivor Burnout Imminent
                </div>
                <div style={{ fontSize: 11, color: "#7f1d1d", marginTop: 2 }}>
                  {d.attritionRate.toFixed(0)}% attrition means each remaining active employee carries ~{d.survivorLoad}% extra load.
                  Without intervention, expect a secondary resignation wave within 30–60 days.
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            style={{
              padding: "9px 18px", borderRadius: 10, border: "none", cursor: "pointer",
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

      {/* ── TAB: OVERVIEW ── */}
      {activeTab === "overview" && (
        <div>
          {/* Summary KPIs */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 12, marginBottom: 20 }}>
            {[
              { label: "Org Health Score", value: avgHealth, sub: "Weighted avg all depts", color: avgHealth >= 70 ? "#22c55e" : avgHealth >= 45 ? "#f59e0b" : "#ef4444", icon: "🏥" },
              { label: "Critical Depts", value: depts.filter(d => d.healthScore < 45).length, sub: "Need immediate action", color: "#ef4444", icon: "🚨" },
              { label: "Survivor Risk Depts", value: criticalDepts.length, sub: "Secondary burnout risk", color: "#f97316", icon: "⚠️" },
              { label: "Low Buffer Depts", value: depts.filter(d => d.humanBuffer < 30).length, sub: "Human capacity at limit", color: "#8b5cf6", icon: "🧠" },
            ].map((k, i) => (
              <div key={i} style={{ background: "#fff", borderRadius: 13, padding: "14px 16px", border: `1.5px solid ${k.color}22`, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", right: 10, top: 8, fontSize: 18, opacity: 0.2 }}>{k.icon}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>{k.label}</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: k.color, fontFamily: "'Playfair Display',Georgia,serif" }}>{k.value}</div>
                <div style={{ fontSize: 10, color: "#64748b", marginTop: 3 }}>{k.sub}</div>
              </div>
            ))}
          </div>

          {/* Dept Cards Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 16 }}>
            {depts.map(d => (
              <DeptCard key={d.dept} dept={d} onSelect={dept => { setSelected(dept); setActiveTab("detail"); }} selected={selected === d.dept} />
            ))}
          </div>

          {/* Legend */}
          <div style={{ background: "#fff", borderRadius: 12, padding: "14px 18px", border: "1.5px solid #f1f5f9", marginTop: 16, display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>Traffic Light Legend:</div>
            {[
              { color: "#22c55e", label: "Green = Safe (no action needed)" },
              { color: "#f59e0b", label: "Yellow = Watch (monitor closely)" },
              { color: "#ef4444", label: "Red = Critical (immediate action)" },
            ].map(l => (
              <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: l.color, boxShadow: `0 0 5px ${l.color}` }} />
                <span style={{ fontSize: 11, color: "#64748b" }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB: DEEP DIVE ── */}
      {activeTab === "detail" && (
        <div>
          {/* Dept selector */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            {depts.map(d => {
              const color = d.healthScore >= 70 ? "#22c55e" : d.healthScore >= 45 ? "#f59e0b" : "#ef4444";
              return (
                <button key={d.dept} onClick={() => setSelected(d.dept)}
                  style={{
                    padding: "7px 14px", borderRadius: 9, border: "none", cursor: "pointer",
                    background: selected === d.dept ? color : "#f1f5f9",
                    color: selected === d.dept ? "#fff" : "#64748b",
                    fontWeight: selected === d.dept ? 700 : 500, fontSize: 12,
                    transition: "all 0.15s",
                  }}>
                  {d.dept} <span style={{ opacity: 0.8 }}>({d.healthScore})</span>
                </button>
              );
            })}
          </div>
          {selectedDept && <DeptDetail dept={selectedDept} allDepts={depts} cliff={cliff} />}
        </div>
      )}

      {/* ── TAB: COMPARE ── */}
      {activeTab === "compare" && (
        <div>
          <div style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", border: "1.5px solid #f1f5f9", marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", marginBottom: 14 }}>Side-by-Side Department Comparison</div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {["Metric", ...depts.map(d => d.dept)].map(h => (
                      <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: "#64748b", fontWeight: 700, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "2px solid #f1f5f9", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: "Health Score", key: d => d.healthScore, fmt: v => `${v}/100`, colorFn: v => v >= 70 ? "#22c55e" : v >= 45 ? "#f59e0b" : "#ef4444" },
                    { label: "Attrition Rate", key: d => d.attritionRate.toFixed(1), fmt: v => `${v}%`, colorFn: v => v >= 40 ? "#ef4444" : v >= 20 ? "#f59e0b" : "#22c55e" },
                    { label: "Overtime %", key: d => d.overtimePct.toFixed(1), fmt: v => `${v}%`, colorFn: v => v >= 70 ? "#ef4444" : v >= 40 ? "#f59e0b" : "#22c55e" },
                    { label: "Avg Satisfaction", key: d => d.avgSat.toFixed(1), fmt: v => `${v}/10`, colorFn: v => v >= 7 ? "#22c55e" : v >= 5 ? "#f59e0b" : "#ef4444" },
                    { label: "Avg Salary", key: d => Math.round(d.avgSal), fmt: v => `$${v.toLocaleString()}`, colorFn: () => "#3b82f6" },
                    { label: "Human Buffer", key: d => d.humanBuffer, fmt: v => `${v}%`, colorFn: v => v >= 60 ? "#22c55e" : v >= 30 ? "#f59e0b" : "#ef4444" },
                    { label: "Burnout Index", key: d => d.burnoutIndex, fmt: v => `${v}%`, colorFn: v => v >= 70 ? "#ef4444" : v >= 40 ? "#f59e0b" : "#22c55e" },
                    { label: "Survivor Risk", key: d => d.survivorRisk ? "YES" : "No", fmt: v => v, colorFn: v => v === "YES" ? "#ef4444" : "#22c55e" },
                  ].map((row, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #f8fafc", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                      <td style={{ padding: "8px 12px", fontWeight: 600, color: "#475569", fontSize: 11 }}>{row.label}</td>
                      {depts.map(d => {
                        const val = row.key(d);
                        const color = row.colorFn(val);
                        return (
                          <td key={d.dept} style={{ padding: "8px 12px" }}>
                            <span style={{ fontWeight: 700, color, fontSize: 13 }}>{row.fmt(val)}</span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cross-module insight */}
          <div style={{ background: "#fff8f0", borderRadius: 14, padding: "16px 18px", border: "1.5px solid #fed7aa" }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#9a3412", marginBottom: 8 }}>🔗 Cross-Module Insights</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {depts.filter(d => d.survivorRisk).map(d => (
                <div key={d.dept} style={{ background: "#fff", borderRadius: 9, padding: "10px 12px", border: "1px solid #fed7aa" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#dc2626" }}>⚠ {d.dept}</div>
                  <div style={{ fontSize: 10, color: "#64748b", marginTop: 4, lineHeight: 1.4 }}>
                    → M2: Run bulk risk score for {d.active} active employees<br />
                    → M3: {d.belowCliff} employees below salary cliff<br />
                    → M6: Calculate retention ROI for this dept
                  </div>
                </div>
              ))}
              {depts.filter(d => d.genBreakdown.genZ > 0).map(d => (
                <div key={`${d.dept}-gz`} style={{ background: "#fff", borderRadius: 9, padding: "10px 12px", border: "1px solid #fed7aa" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#92400e" }}>🔕 {d.dept} — Gen Z at Risk</div>
                  <div style={{ fontSize: 10, color: "#64748b", marginTop: 4, lineHeight: 1.4 }}>
                    → M2: Check quiet-quitting score for {d.genBreakdown.genZ} Gen Z employee(s)<br />
                    → M8: Consider internal mobility to reduce burnout
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
