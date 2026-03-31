import { useState, useMemo, useCallback, useEffect } from "react";
import { useApp, useHRData } from "../context/AppContext";
import { useModuleData } from "../context/ModuleDataContext";
import { GaugeChart } from "../components/Charts";

function computeFatigueScore(shift) {
  let score = 0;
  const factors = [];

  const dur = Number(shift.duration) || 8;
  if (dur >= 12) { score += 30; factors.push({ label: "12h+ Shift", impact: 30, direction: "bad", note: "Exceeds safe cognitive limit" }); }
  else if (dur >= 10) { score += 18; factors.push({ label: "10–11h Shift", impact: 18, direction: "warn", note: "Above recommended threshold" }); }
  else if (dur <= 7) { score += 0; factors.push({ label: "Shift Duration", impact: 0, direction: "good", note: `${dur}h — within safe range` }); }
  else { score += 6; factors.push({ label: "Shift Duration", impact: 6, direction: "warn", note: `${dur}h — borderline` }); }

  const rest = Number(shift.restHours) || 12;
  if (rest < 8) { score += 28; factors.push({ label: "Rest Gap", impact: 28, direction: "bad", note: `Only ${rest}h rest — dangerous` }); }
  else if (rest < 11) { score += 14; factors.push({ label: "Rest Gap", impact: 14, direction: "warn", note: `${rest}h rest — below recommended 11h` }); }
  else { factors.push({ label: "Rest Gap", impact: 0, direction: "good", note: `${rest}h rest — adequate recovery` }); }

  if (shift.shiftType === "Night") { score += 18; factors.push({ label: "Night Shift", impact: 18, direction: "bad", note: "Circadian disruption adds 18pts" }); }
  else if (shift.shiftType === "Evening") { score += 8; factors.push({ label: "Evening Shift", impact: 8, direction: "warn", note: "Moderate circadian impact" }); }
  else { factors.push({ label: "Day Shift", impact: 0, direction: "good", note: "Optimal circadian alignment" }); }

  const consecutive = Number(shift.consecutiveDays) || 5;
  if (consecutive >= 7) { score += 20; factors.push({ label: "Consecutive Days", impact: 20, direction: "bad", note: `${consecutive} days without rest — extreme fatigue` }); }
  else if (consecutive >= 5) { score += 10; factors.push({ label: "Consecutive Days", impact: 10, direction: "warn", note: `${consecutive} consecutive days` }); }
  else { factors.push({ label: "Consecutive Days", impact: 0, direction: "good", note: `${consecutive} days — safe rotation` }); }

  if (shift.weekendWork === "Both") { score += 10; factors.push({ label: "Weekend Work", impact: 10, direction: "bad", note: "Both days — no social recovery" }); }
  else if (shift.weekendWork === "One") { score += 4; factors.push({ label: "Weekend Work", impact: 4, direction: "warn", note: "One day — limited recovery" }); }
  else { factors.push({ label: "Weekend Work", impact: 0, direction: "good", note: "Weekend off — full recovery" }); }

  const weeklyOT = Number(shift.weeklyOTHours) || 0;
  if (weeklyOT >= 15) { score += 16; factors.push({ label: "Weekly Overtime", impact: 16, direction: "bad", note: `${weeklyOT}h OT — severe fatigue accumulation` }); }
  else if (weeklyOT >= 8) { score += 8; factors.push({ label: "Weekly Overtime", impact: 8, direction: "warn", note: `${weeklyOT}h OT — moderate impact` }); }
  else { factors.push({ label: "Weekly Overtime", impact: weeklyOT > 0 ? 2 : 0, direction: weeklyOT > 0 ? "warn" : "good", note: weeklyOT > 0 ? `${weeklyOT}h OT — minimal impact` : "No overtime" }); }

  const final = Math.min(100, Math.max(1, score));
  const level = final >= 75 ? { label: "CRITICAL", color: "#ef4444", bg: "#fef2f2", border: "#fecaca" }
    : final >= 50 ? { label: "HIGH", color: "#f97316", bg: "#fff7ed", border: "#fed7aa" }
    : final >= 25 ? { label: "MODERATE", color: "#f59e0b", bg: "#fffbeb", border: "#fde68a" }
    : { label: "LOW", color: "#22c55e", bg: "#f0fdf4", border: "#bbf7d0" };

  return { score: final, factors, level };
}

function buildTeamFatigue(data, stdHours = 40) {
  const otBaseHours = stdHours > 40 ? stdHours - 40 : 0;
  return data.map(e => {
    const hasOT = e.OvertimeStatus === "Yes";
    const dept = e.Department || "Unknown";
    const shiftType = hasOT
      ? (e.JobSatisfaction <= 2 ? "Night" : "Evening")
      : "Day";
    const duration = hasOT
      ? (e.JobSatisfaction <= 2 ? Math.min(14, stdHours > 40 ? 13 : 12) : 10)
      : Math.min(10, Math.round(stdHours / 5));
    const restHours = hasOT ? (e.JobSatisfaction <= 2 ? 7 : 9) : 14;
    const consecutiveDays = hasOT ? 6 : 5;
    const weekendWork = hasOT ? (e.JobSatisfaction <= 2 ? "Both" : "One") : "None";
    const weeklyOTHours = hasOT
  ? (e.JobSatisfaction <= 2 ? Math.max(15, otBaseHours + 8) : Math.max(8, otBaseHours + 4))
  : 0;

    const shift = { shiftType, duration, restHours, consecutiveDays, weekendWork, weeklyOTHours };
    const { score, factors, level } = computeFatigueScore(shift);

    return {
      ...e, shift, fatigueScore: score, fatigueLevel: level,
      fatigueFactor: factors.filter(f => f.direction === "bad").map(f => f.label).join(", ") || "None",
    };
  });
}

// ── AI Fatigue Insight ──
async function fetchFatigueAI(teamStats, company) {
  const prompt = `You are a workplace fatigue specialist at ${company?.name || "a company"}.

Team Fatigue Report:
- Total employees analyzed: ${teamStats.total}
- Critical fatigue (75+): ${teamStats.critical} employees
- High fatigue (50–74): ${teamStats.high} employees
- Avg fatigue index: ${teamStats.avgScore}
- Departments most affected: ${teamStats.worstDepts.join(", ")}
- Most common fatigue driver: ${teamStats.topDriver}

Write 3 short paragraphs:
1. Assessment of current fatigue levels and primary drivers
2. Which departments need immediate schedule intervention
3. Specific schedule optimization recommendation (e.g., rotation pattern, rest gap policy)

Under 160 words. Direct, actionable. No bullet points.`;

  const response = await fetch("https://gemini-api-amber-iota.vercel.app/api/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: [{ content: prompt }] }),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  return data.content?.[0]?.text || data.text || data.response || "AI insight unavailable.";
}

// ── Factor Bar ──
function FatigueFactorBar({ factor }) {
  const colors = { bad: "#ef4444", warn: "#f59e0b", good: "#22c55e" };
  const color = colors[factor.direction];
  const pct = Math.min(100, (factor.impact / 30) * 100);
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: "#1e293b" }}>{factor.label}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color }}>{factor.impact > 0 ? `+${factor.impact}` : factor.direction === "good" ? "✓" : "—"}</span>
      </div>
      <div style={{ height: 5, background: "#f1f5f9", borderRadius: 3, overflow: "hidden", marginBottom: 2 }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 3, transition: "width 0.4s" }} />
      </div>
      <div style={{ fontSize: 9, color: "#94a3b8" }}>{factor.note}</div>
    </div>
  );
}

// ── Schedule Optimizer ──
function ScheduleOptimizer({ baseShift, company }) {
const [simShift, setSimShift] = useState(() => ({ ...baseShift }));
  useEffect(() => {
    setSimShift({ ...baseShift });
  }, [
    baseShift.shiftType, baseShift.duration, baseShift.restHours,
    baseShift.consecutiveDays, baseShift.weekendWork, baseShift.weeklyOTHours,
  ]);
  const base = computeFatigueScore(baseShift);
  const sim = computeFatigueScore(simShift);
  const delta = sim.score - base.score;
  const set = useCallback((k, v) => setSimShift(p => ({ ...p, [k]: v })), []);
  return (
    <div style={{ background: "#fff", borderRadius: 14, padding: "20px 22px", border: "1.5px solid #f1f5f9", marginTop: 20 }}>
      <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", marginBottom: 4 }}>🔧 Schedule Optimizer</div>
      <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 18 }}>Simulate schedule changes — see fatigue impact in real-time</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 18 }}>
        {/* Shift type */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Shift Type</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {["Day", "Evening", "Night"].map(t => (
              <button key={t} onClick={() => set("shiftType", t)}
                style={{
                  padding: "7px 12px", borderRadius: 8, cursor: "pointer",
                  background: simShift.shiftType === t ? (t === "Night" ? "#fef2f2" : t === "Evening" ? "#fffbeb" : "#f0fdf4") : "#f8fafc",
                  color: simShift.shiftType === t ? (t === "Night" ? "#ef4444" : t === "Evening" ? "#f59e0b" : "#16a34a") : "#94a3b8",
                  fontWeight: simShift.shiftType === t ? 700 : 500, fontSize: 12, textAlign: "left",
                  border: `1.5px solid ${simShift.shiftType === t ? (t === "Night" ? "#fecaca" : t === "Evening" ? "#fde68a" : "#bbf7d0") : "#e2e8f0"}`,
                }}>
                {t === "Night" ? "🌙" : t === "Evening" ? "🌆" : "☀️"} {t} Shift
              </button>
            ))}
          </div>
        </div>

        {/* Duration + Rest */}
        <div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>Shift Duration: {simShift.duration}h</div>
            <input type="range" min={4} max={14} step={1} value={simShift.duration}
              onChange={e => set("duration", Number(e.target.value))}
              style={{ width: "100%", accentColor: simShift.duration >= 12 ? "#ef4444" : simShift.duration >= 10 ? "#f59e0b" : "#22c55e" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#94a3b8" }}><span>4h</span><span>14h</span></div>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>Rest Between Shifts: {simShift.restHours}h</div>
            <input type="range" min={4} max={16} step={1} value={simShift.restHours}
              onChange={e => set("restHours", Number(e.target.value))}
              style={{ width: "100%", accentColor: simShift.restHours < 8 ? "#ef4444" : simShift.restHours < 11 ? "#f59e0b" : "#22c55e" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#94a3b8" }}><span>4h</span><span>16h</span></div>
          </div>
        </div>

        {/* Consecutive + Weekend */}
        <div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>Consecutive Days: {simShift.consecutiveDays}</div>
            <input type="range" min={1} max={7} step={1} value={simShift.consecutiveDays}
              onChange={e => set("consecutiveDays", Number(e.target.value))}
              style={{ width: "100%", accentColor: simShift.consecutiveDays >= 7 ? "#ef4444" : simShift.consecutiveDays >= 5 ? "#f59e0b" : "#22c55e" }} />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#94a3b8" }}><span>1</span><span>7</span></div>
          </div>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>Weekend Work</div>
            <div style={{ display: "flex", gap: 5 }}>
              {["None", "One", "Both"].map(w => (
                <button key={w} onClick={() => set("weekendWork", w)}
                  style={{ flex: 1, padding: "6px 4px", borderRadius: 7, cursor: "pointer", fontSize: 10,
                    background: simShift.weekendWork === w ? (w === "Both" ? "#fef2f2" : w === "One" ? "#fffbeb" : "#f0fdf4") : "#f8fafc",
                    color: simShift.weekendWork === w ? (w === "Both" ? "#ef4444" : w === "One" ? "#f59e0b" : "#16a34a") : "#94a3b8",
                    fontWeight: simShift.weekendWork === w ? 700 : 500,
                    border: `1.5px solid ${simShift.weekendWork === w ? "#e2e8f0" : "#e2e8f0"}`,
                  }}>
                  {w}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* OT Hours slider */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>Weekly Overtime Hours: {simShift.weeklyOTHours}h</div>
        <input type="range" min={0} max={25} step={1} value={simShift.weeklyOTHours}
          onChange={e => set("weeklyOTHours", Number(e.target.value))}
          style={{ width: "100%", accentColor: simShift.weeklyOTHours >= 15 ? "#ef4444" : simShift.weeklyOTHours >= 8 ? "#f59e0b" : "#22c55e" }} />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#94a3b8" }}><span>0h</span><span>25h</span></div>
      </div>

      {/* Result */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
        <div style={{ background: "#f8fafc", borderRadius: 11, padding: "14px", textAlign: "center" }}>
          <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 4 }}>Current Score</div>
          <GaugeChart value={base.score} size={80} label="fatigue" />
          <div style={{ fontSize: 11, fontWeight: 700, color: base.level.color, marginTop: 4 }}>{base.level.label}</div>
        </div>
        <div style={{ background: sim.level.bg, borderRadius: 11, padding: "14px", textAlign: "center", border: `1.5px solid ${sim.level.border}` }}>
          <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 4 }}>Simulated Score</div>
          <GaugeChart value={sim.score} size={80} label="fatigue" />
          <div style={{ fontSize: 11, fontWeight: 700, color: sim.level.color, marginTop: 4 }}>{sim.level.label}</div>
        </div>
        <div style={{ background: delta < 0 ? "#f0fdf4" : delta > 0 ? "#fef2f2" : "#f8fafc", borderRadius: 11, padding: "14px", textAlign: "center", border: `1.5px solid ${delta < 0 ? "#bbf7d0" : delta > 0 ? "#fecaca" : "#f1f5f9"}` }}>
          <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 8 }}>Impact</div>
          <div style={{ fontSize: 28, fontWeight: 800, color: delta < 0 ? "#22c55e" : delta > 0 ? "#ef4444" : "#94a3b8", fontFamily: "'Playfair Display',Georgia,serif" }}>
            {delta === 0 ? "=" : delta < 0 ? `▼${Math.abs(delta)}` : `▲${delta}`}
          </div>
          <div style={{ fontSize: 10, color: delta < 0 ? "#16a34a" : delta > 0 ? "#dc2626" : "#94a3b8", fontWeight: 700, marginTop: 4 }}>
            {delta < -10 ? "Significant improvement!" : delta < 0 ? "Some improvement" : delta > 10 ? "Risk increased!" : delta > 0 ? "Slightly worse" : "No change"}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Weekly Heatmap ──
function WeeklyHeatmap({ teamFatigue }) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const deptFatigue = useMemo(() => {
    const depts = [...new Set(teamFatigue.map(e => e.Department))];
    return depts.map(dept => {
    const emps = teamFatigue.filter(e => e.Department === dept);
    const avgFatigue = emps.length > 0 ? Math.round(emps.reduce((s, e) => s + e.fatigueScore, 0) / emps.length) : 0;
    const hasOT = emps.filter(e => e.OvertimeStatus === "Yes").length / emps.length;
    const dailyFatigue = days.map((_, i) => {
      const weekday = i < 5;
      const accumulation = i > 0 ? i * 3 : 0;
      const weekend = !weekday ? (hasOT > 0.5 ? 15 : 5) : 0;
      return Math.min(100, Math.round(avgFatigue * 0.7 + accumulation + weekend));
    });
    return { dept, dailyFatigue, avgFatigue };
    });
  }, [teamFatigue]);

  const cellColor = (val) => {
    if (val >= 75) return "#ef4444";
    if (val >= 60) return "#f97316";
    if (val >= 45) return "#f59e0b";
    if (val >= 25) return "#84cc16";
    return "#22c55e";
  };

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 3, fontSize: 11 }}>
        <thead>
          <tr>
            <th style={{ padding: "6px 10px", textAlign: "left", color: "#64748b", fontWeight: 700, fontSize: 10, textTransform: "uppercase" }}>Department</th>
            {days.map(d => (
              <th key={d} style={{ padding: "6px 10px", textAlign: "center", color: "#64748b", fontWeight: 700, fontSize: 10 }}>{d}</th>
            ))}
            <th style={{ padding: "6px 10px", textAlign: "center", color: "#64748b", fontWeight: 700, fontSize: 10 }}>Avg</th>
          </tr>
        </thead>
        <tbody>
          {deptFatigue.map(d => (
            <tr key={d.dept}>
              <td style={{ padding: "6px 10px", fontWeight: 600, color: "#1e293b", fontSize: 12, whiteSpace: "nowrap" }}>{d.dept}</td>
              {d.dailyFatigue.map((val, i) => (
                <td key={days[i]} style={{ padding: "4px", textAlign: "center" }}>
                  <div style={{
                    background: cellColor(val), borderRadius: 6, padding: "5px 4px",
                    fontSize: 10, fontWeight: 700, color: "#fff",
                    minWidth: 32, opacity: 0.9,
                  }}>
                    {val}
                  </div>
                </td>
              ))}
              <td style={{ padding: "4px", textAlign: "center" }}>
                <div style={{ background: cellColor(d.avgFatigue), borderRadius: 6, padding: "5px 4px", fontSize: 10, fontWeight: 800, color: "#fff", opacity: 1 }}>
                  {d.avgFatigue}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: 10, color: "#94a3b8" }}>Fatigue level:</span>
        {[{ label: "Low (<25)", color: "#22c55e" }, { label: "Moderate (25–44)", color: "#84cc16" }, { label: "Elevated (45–59)", color: "#f59e0b" }, { label: "High (60–74)", color: "#f97316" }, { label: "Critical (75+)", color: "#ef4444" }].map(l => (
          <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: l.color }} />
            <span style={{ fontSize: 9, color: "#64748b" }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Rotation Recommender ──
function RotationRecommender({ teamFatigue }) {
  const critical = teamFatigue.filter(e => e.fatigueScore >= 75);
  const high = teamFatigue.filter(e => e.fatigueScore >= 50 && e.fatigueScore < 75);

  const recommendations = [];
  if (critical.length > 0) {
    recommendations.push({
      icon: "🚨", severity: "critical", color: "#ef4444", bg: "#fef2f2", border: "#fecaca",
      title: `${critical.length} employees need immediate schedule rotation`,
      action: "Move to Day Shift + minimum 11h rest gap + max 5 consecutive days within this week",
      employees: critical.slice(0, 5).map(e => `${e.FirstName} ${e.LastName}`).join(", "),
    });
  }
  if (high.length > 0) {
    recommendations.push({
      icon: "⚠️", severity: "high", color: "#f97316", bg: "#fff7ed", border: "#fed7aa",
      title: `${high.length} employees in high fatigue zone`,
      action: "Reduce consecutive days to 4 max, enforce weekend off rotation, cap OT at 8h/week",
      employees: high.slice(0, 5).map(e => `${e.FirstName} ${e.LastName}`).join(", "),
    });
  }

  // Dept-level recommendations
  const deptFatigue = {};
  teamFatigue.forEach(e => {
    if (!deptFatigue[e.Department]) deptFatigue[e.Department] = [];
    deptFatigue[e.Department].push(e.fatigueScore);
  });
  Object.entries(deptFatigue).forEach(([dept, scores]) => {
    const avg = Math.round(scores.reduce((s, v) => s + v, 0) / scores.length);
    if (avg >= 60) {
      recommendations.push({
        icon: "🏢", severity: "dept", color: "#8b5cf6", bg: "#f5f3ff", border: "#ddd6fe",
        title: `${dept}: avg fatigue ${avg} — dept-wide schedule review needed`,
        action: `Implement 3-2-2 rotation (3 days on, 2 off, 2 on) or staggered shift starts to reduce peak-hour load`,
        employees: null,
      });
    }
  });

  if (recommendations.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "30px", color: "#94a3b8", fontSize: 13 }}>
        ✅ No critical schedule interventions needed based on current data
      </div>
    );
  }

  return (
    <div>
      {recommendations.map((r, i) => (
        <div key={`${r.severity}-${r.title.slice(0, 20)}`} style={{ background: r.bg, borderRadius: 12, padding: "14px 16px", border: `1.5px solid ${r.border}`, marginBottom: 10 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ fontSize: 18, flexShrink: 0 }}>{r.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 12, color: r.color, marginBottom: 4 }}>{r.title}</div>
              <div style={{ fontSize: 11, color: "#475569", lineHeight: 1.5, marginBottom: r.employees ? 6 : 0 }}>
                📋 Action: {r.action}
              </div>
              {r.employees && (
                <div style={{ fontSize: 10, color: "#94a3b8" }}>
                  Employees: {r.employees}{critical.length > 5 ? "..." : ""}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── MAIN M7 ──
export default function M7FatigueRadar() {
  const { company } = useApp();
  const { data } = useHRData();
  const stdHours = company?.avgWorkHoursPerWeek || 40;
  const { state: m7State, update: updateM7 } = useModuleData("m7");

const activeTab   = m7State.activeTab   || "team";
const singleShift = m7State.singleShift || {
  name: "", dept: "Sales", shiftType: "Day",
  duration: 8, restHours: 12, consecutiveDays: 5,
  weekendWork: "None", weeklyOTHours: 0,
};
const setActiveTab = useCallback((v) => updateM7({ activeTab: v }), [updateM7]);
const setS = useCallback((k, v) => {
  updateM7({ singleShift: { ...singleShift, [k]: v } });
}, [singleShift, updateM7]);
const [aiText, setAiText]       = useState("");
const [aiLoading, setAiLoading] = useState(false);
const src = data;
  const teamFatigue = useMemo(() => buildTeamFatigue(src, stdHours), [src, stdHours]);
  const teamStats = useMemo(() => {
    const scores = teamFatigue.map(e => e.fatigueScore);
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length) : 0;
    const critical = teamFatigue.filter(e => e.fatigueScore >= 75).length;
    const high = teamFatigue.filter(e => e.fatigueScore >= 50 && e.fatigueScore < 75).length;
    const moderate = teamFatigue.filter(e => e.fatigueScore >= 25 && e.fatigueScore < 50).length;
    const low = teamFatigue.filter(e => e.fatigueScore < 25).length;

    const deptFatigue = {};
    teamFatigue.forEach(e => {
      if (!deptFatigue[e.Department]) deptFatigue[e.Department] = [];
      deptFatigue[e.Department].push(e.fatigueScore);
    });
    const worstDepts = Object.entries(deptFatigue)
      .map(([dept, scores]) => ({ dept, avg: Math.round(scores.reduce((s, v) => s + v, 0) / scores.length) }))
      .sort((a, b) => b.avg - a.avg).slice(0, 3).map(d => d.dept);

    const driverFreq = {};
    teamFatigue.forEach(e => {
      (e.fatigueFactor || "").split(", ").forEach(f => { if (f) driverFreq[f] = (driverFreq[f] || 0) + 1; });
    });
    const topDriver = Object.entries(driverFreq).sort((a, b) => b[1] - a[1])[0]?.[0] || "Overtime";

    return { total: teamFatigue.length, avgScore, critical, high, moderate, low, worstDepts, topDriver };
  }, [teamFatigue]);

  const singleResult = useMemo(() => computeFatigueScore(singleShift), [singleShift]);
  const handleAI = useCallback(async () => {
    setAiLoading(true);
    setAiText("");
    try {
      const text = await fetchFatigueAI(teamStats, company);
      setAiText(text);
    } catch (err) {
      setAiText(`⚠️ AI unavailable: ${err?.message || "Check connection and retry."}`);
    } finally {
      setAiLoading(false);
    }
  }, [teamStats, company]);

  if (data.length === 0) {
  return (
    <div style={{ textAlign: "center", padding: "60px 20px" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>😴</div>
      <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>Shift & Fatigue Radar</div>
      <div style={{ fontSize: 14, color: "#94a3b8" }}>Upload your HR CSV to analyze team fatigue patterns and get schedule optimization recommendations.</div>
    </div>
  );
}

  const TABS = [
    { id: "team", label: "👥 Team Overview" },
    { id: "heatmap", label: "🌡️ Fatigue Heatmap" },
    { id: "single", label: "🎯 Single Employee" },
    { id: "recommendations", label: "💡 Rotation Plan" },
  ];
  const inputStyle = { width: "100%", padding: "8px 11px", borderRadius: 9, border: "1.5px solid #e2e8f0", fontSize: 13, color: "#1e293b", background: "#f8fafc", outline: "none", boxSizing: "border-box" };
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

{/* ── TAB: TEAM OVERVIEW ── */}
      {activeTab === "team" && (
        <div>
          <div style={{ background: "#fffbeb", border: "1.5px solid #fde68a", borderRadius: 10, padding: "10px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 18 }}>⚠️</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#92400e" }}>Fatigue score ini adalah estimasi — bukan data shift asli</div>
              <div style={{ fontSize: 11, color: "#b45309" }}>Dihitung dari kolom OvertimeStatus & JobSatisfaction di CSV kamu. Untuk analisis akurat, input data shift karyawan satu per satu di tab "Single Employee".</div>
            </div>
          </div>
          {/* KPIs */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 12, marginBottom: 18 }}>
            {[
              { label: "Avg Fatigue Index", value: teamStats.avgScore, sub: "Team-wide score", color: teamStats.avgScore >= 75 ? "#ef4444" : teamStats.avgScore >= 50 ? "#f97316" : "#f59e0b", icon: "😴", bg: "#fffbeb" },
              { label: "Critical Fatigue", value: teamStats.critical, sub: "Score 75+ — urgent", color: "#ef4444", icon: "🚨", bg: "#fef2f2" },
              { label: "High Fatigue", value: teamStats.high, sub: "Score 50–74", color: "#f97316", icon: "⚠️", bg: "#fff7ed" },
              { label: "Low Fatigue", value: teamStats.low, sub: "Score <25 — healthy", color: "#22c55e", icon: "✅", bg: "#f0fdf4" },
              { label: "Top Driver", value: teamStats.topDriver, sub: "Most common cause", color: "#8b5cf6", icon: "🔍", bg: "#f5f3ff" },
              { label: "Worst Dept", value: teamStats.worstDepts[0] || "—", sub: "Highest avg fatigue", color: "#dc2626", icon: "🏢", bg: "#fef2f2" },
            ].map((k) => (
              <div key={k.label} style={{ background: k.bg, borderRadius: 13, padding: "13px 15px", border: `1.5px solid ${k.color}22`, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", right: 8, top: 8, fontSize: 16, opacity: 0.2 }}>{k.icon}</div>
                <div style={{ fontSize: 9, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>{k.label}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: k.color, fontFamily: "'Playfair Display',Georgia,serif", lineHeight: 1.1 }}>{k.value}</div>
                <div style={{ fontSize: 10, color: "#64748b", marginTop: 3 }}>{k.sub}</div>
              </div>
            ))}
          </div>

          {/* Fatigue distribution bars */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", border: "1.5px solid #f1f5f9" }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", marginBottom: 14 }}>Fatigue Distribution</div>
              {[
                { label: "Critical (75+)", count: teamStats.critical, color: "#ef4444", bg: "#fef2f2" },
                { label: "High (50–74)", count: teamStats.high, color: "#f97316", bg: "#fff7ed" },
                { label: "Moderate (25–49)", count: teamStats.moderate, color: "#f59e0b", bg: "#fffbeb" },
                { label: "Low (<25)", count: teamStats.low, color: "#22c55e", bg: "#f0fdf4" },
              ].map(b => {
                const pct = teamStats.total > 0 ? ((b.count / teamStats.total) * 100).toFixed(0) : 0;
                return (
                  <div key={b.label} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontSize: 11, color: "#475569" }}>{b.label}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: b.color }}>{b.count} ({pct}%)</span>
                    </div>
                    <div style={{ height: 8, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: b.color, borderRadius: 4, transition: "width 0.5s" }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Top 10 employees by fatigue */}
            <div style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", border: "1.5px solid #f1f5f9" }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", marginBottom: 14 }}>Top 10 At-Risk Employees</div>
              {[...teamFatigue].sort((a, b) => b.fatigueScore - a.fatigueScore).slice(0, 10).map((e, i) => (
                <div key={e.EmployeeID || i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 10, color: "#94a3b8", width: 18 }}>#{i + 1}</span>
                  <span style={{ fontSize: 11, color: "#1e293b", fontWeight: 500, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {e.FirstName} {e.LastName}
                  </span>
                  <span style={{ fontSize: 10, color: "#94a3b8", width: 80, textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.Department}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <div style={{ width: 36, height: 5, background: "#f1f5f9", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ width: `${e.fatigueScore}%`, height: "100%", background: e.fatigueLevel.color, borderRadius: 3 }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: e.fatigueLevel.color, width: 24 }}>{e.fatigueScore}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Insight */}
          <div style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", border: "1.5px solid #f1f5f9" }}>
            <button onClick={handleAI} disabled={aiLoading}
              style={{ width: "100%", padding: "12px", background: aiLoading ? "#f1f5f9" : "#0f172a", color: aiLoading ? "#94a3b8" : "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: aiLoading ? "not-allowed" : "pointer", marginBottom: aiText ? 14 : 0 }}>
              {aiLoading ? "⏳ Analyzing fatigue patterns..." : "🤖 Get AI Fatigue Analysis"}
            </button>
            {aiText && (
              <div style={{ background: "#f8fafc", borderRadius: 10, padding: "14px 16px", border: "1.5px solid #e2e8f0" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>AI Fatigue Analysis</div>
                <div style={{ fontSize: 12, color: "#1e293b", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{aiText}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: HEATMAP ── */}
      {activeTab === "heatmap" && (
        <div>
          <div style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", border: "1.5px solid #f1f5f9", marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", marginBottom: 4 }}>🌡️ Weekly Fatigue Heatmap</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 16 }}>
              Estimated daily fatigue accumulation per department — darker red = higher fatigue
            </div>
            <WeeklyHeatmap teamFatigue={teamFatigue} />
          </div>

          {/* Full team table */}
          <div style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", border: "1.5px solid #f1f5f9" }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", marginBottom: 14 }}>Full Team Fatigue Scores</div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {["Employee", "Dept", "OT", "Shift Type", "Fatigue Score", "Level", "Top Driver"].map(h => (
                      <th key={h} style={{ padding: "7px 10px", textAlign: "left", color: "#64748b", fontWeight: 700, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "2px solid #f1f5f9", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...teamFatigue].sort((a, b) => b.fatigueScore - a.fatigueScore).slice(0, 25).map((e, i) => (
                    <tr key={e.EmployeeID || i} style={{ borderBottom: "1px solid #f8fafc", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                      <td style={{ padding: "7px 10px", color: "#1e293b", fontWeight: 500, whiteSpace: "nowrap" }}>{e.FirstName} {e.LastName}</td>
                      <td style={{ padding: "7px 10px", color: "#475569", fontSize: 11 }}>{e.Department}</td>
                      <td style={{ padding: "7px 10px", color: e.OvertimeStatus === "Yes" ? "#ef4444" : "#22c55e", fontWeight: 700 }}>{e.OvertimeStatus}</td>
                      <td style={{ padding: "7px 10px", fontSize: 11 }}>
                        <span style={{ color: e.shift.shiftType === "Night" ? "#6366f1" : e.shift.shiftType === "Evening" ? "#f59e0b" : "#22c55e", fontWeight: 600 }}>
                          {e.shift.shiftType === "Night" ? "🌙" : e.shift.shiftType === "Evening" ? "🌆" : "☀️"} {e.shift.shiftType}
                        </span>
                      </td>
                      <td style={{ padding: "7px 10px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <div style={{ width: 44, height: 5, background: "#f1f5f9", borderRadius: 3, overflow: "hidden" }}>
                            <div style={{ width: `${e.fatigueScore}%`, height: "100%", background: e.fatigueLevel.color, borderRadius: 3 }} />
                          </div>
                          <span style={{ fontWeight: 700, color: e.fatigueLevel.color }}>{e.fatigueScore}</span>
                        </div>
                      </td>
                      <td style={{ padding: "7px 10px" }}>
                        <span style={{ background: e.fatigueLevel.bg, color: e.fatigueLevel.color, padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700, border: `1px solid ${e.fatigueLevel.border}` }}>
                          {e.fatigueLevel.label}
                        </span>
                      </td>
                      <td style={{ padding: "7px 10px", fontSize: 11, color: "#64748b" }}>{e.fatigueFactor || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: SINGLE EMPLOYEE ── */}
      {activeTab === "single" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
            {/* Input */}
            <div style={{ background: "#fff", borderRadius: 14, padding: "20px 22px", border: "1.5px solid #f1f5f9" }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", marginBottom: 16 }}>Employee Shift Profile</div>

              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>Name (optional)</div>
                <input type="text" value={singleShift.name} placeholder="e.g. Alex Carter"
                  onChange={e => setS("name", e.target.value)} style={inputStyle} />
              </div>

              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>Department</div>
                <select value={singleShift.dept} onChange={e => setS("dept", e.target.value)} style={inputStyle}>
                  {["Sales","Technical Support","IT","HR","Digital Marketing","Operations","Other"].map(d => <option key={d}>{d}</option>)}
                </select>
              </div>

              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>Shift Type</div>
                <div style={{ display: "flex", gap: 8 }}>
                  {["Day", "Evening", "Night"].map(t => (
                    <button key={t} onClick={() => setS("shiftType", t)}
                      style={{ flex: 1, padding: "8px", borderRadius: 8, cursor: "pointer", fontSize: 12,
                        background: singleShift.shiftType === t ? (t === "Night" ? "#fef2f2" : t === "Evening" ? "#fffbeb" : "#f0fdf4") : "#f8fafc",
                        color: singleShift.shiftType === t ? (t === "Night" ? "#ef4444" : t === "Evening" ? "#f59e0b" : "#16a34a") : "#94a3b8",
                        fontWeight: singleShift.shiftType === t ? 700 : 500,
                        border: `1.5px solid ${singleShift.shiftType === t ? (t === "Night" ? "#fecaca" : t === "Evening" ? "#fde68a" : "#bbf7d0") : "#e2e8f0"}`,
                      }}>
                      {t === "Night" ? "🌙" : t === "Evening" ? "🌆" : "☀️"} {t}
                    </button>
                  ))}
                </div>
              </div>

              {[
                { label: `Shift Duration: ${singleShift.duration}h`, key: "duration", min: 4, max: 14, color: singleShift.duration >= 12 ? "#ef4444" : singleShift.duration >= 10 ? "#f59e0b" : "#22c55e" },
                { label: `Rest Between Shifts: ${singleShift.restHours}h`, key: "restHours", min: 4, max: 16, color: singleShift.restHours < 8 ? "#ef4444" : singleShift.restHours < 11 ? "#f59e0b" : "#22c55e" },
                { label: `Consecutive Days: ${singleShift.consecutiveDays}`, key: "consecutiveDays", min: 1, max: 7, color: singleShift.consecutiveDays >= 7 ? "#ef4444" : singleShift.consecutiveDays >= 5 ? "#f59e0b" : "#22c55e" },
                { label: `Weekly OT Hours: ${singleShift.weeklyOTHours}h`, key: "weeklyOTHours", min: 0, max: 25, color: singleShift.weeklyOTHours >= 15 ? "#ef4444" : singleShift.weeklyOTHours >= 8 ? "#f59e0b" : "#22c55e" },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>{f.label}</div>
                  <input type="range" min={f.min} max={f.max} step={1} value={singleShift[f.key]}
                    onChange={e => setS(f.key, Number(e.target.value))}
                    style={{ width: "100%", accentColor: f.color }} />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#94a3b8" }}><span>{f.min}</span><span>{f.max}</span></div>
                </div>
              ))}

              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>Weekend Work</div>
                <div style={{ display: "flex", gap: 8 }}>
                  {["None", "One", "Both"].map(w => (
                    <button key={w} onClick={() => setS("weekendWork", w)}
                      style={{ flex: 1, padding: "7px", borderRadius: 8, cursor: "pointer", fontSize: 11,
                        background: singleShift.weekendWork === w ? (w === "Both" ? "#fef2f2" : w === "One" ? "#fffbeb" : "#f0fdf4") : "#f8fafc",
                        color: singleShift.weekendWork === w ? (w === "Both" ? "#ef4444" : w === "One" ? "#f59e0b" : "#16a34a") : "#94a3b8",
                        fontWeight: singleShift.weekendWork === w ? 700 : 500,
                        border: `1.5px solid #e2e8f0`,
                      }}>
                      {w}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Output */}
            <div>
              <div style={{ background: singleResult.level.bg, borderRadius: 14, padding: "20px 22px", border: `1.5px solid ${singleResult.level.border}`, marginBottom: 16, textAlign: "center" }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", marginBottom: 8 }}>
                  {singleShift.name ? `${singleShift.name}'s` : "Employee"} Fatigue Index
                </div>
                <GaugeChart value={singleResult.score} size={160} label="fatigue" />
                <div style={{ marginTop: 8 }}>
                  <span style={{ background: singleResult.level.color, color: "#fff", padding: "5px 16px", borderRadius: 20, fontSize: 13, fontWeight: 800 }}>
                    {singleResult.level.label}
                  </span>
                </div>
                <div style={{ marginTop: 10, fontSize: 11, color: "#64748b" }}>
                  {singleResult.score >= 75 ? "⚠️ Immediate schedule intervention required" :
                   singleResult.score >= 50 ? "Schedule review recommended within 1 week" :
                   singleResult.score >= 25 ? "Monitor — approaching risk threshold" :
                   "✅ Safe zone — healthy work-life balance"}
                </div>
              </div>

              <div style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", border: "1.5px solid #f1f5f9" }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", marginBottom: 14 }}>Factor Breakdown</div>
                {singleResult.factors.map((f) => <FatigueFactorBar key={f.label} factor={f} />)}
              </div>
            </div>
          </div>

          {/* Schedule Optimizer */}
          <ScheduleOptimizer baseShift={singleShift} company={company} />

          {/* Cross-module */}
          <div style={{ background: "#fff8f0", borderRadius: 12, padding: "14px 16px", border: "1.5px solid #fed7aa", marginTop: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 12, color: "#9a3412", marginBottom: 6 }}>🔗 Cross-Module Connection</div>
            <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.6 }}>
              High fatigue score feeds directly into M2 (flight risk increases when fatigue is critical),
              M4 (Human Buffer drops when fatigue is high), and M6 (overtime cap intervention cost is calculated
              based on how many employees need schedule rotation).
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: ROTATION PLAN ── */}
      {activeTab === "recommendations" && (
        <div>
          <div style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", border: "1.5px solid #f1f5f9", marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", marginBottom: 4 }}>💡 Smart Rotation Recommendations</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 16 }}>Auto-generated based on fatigue scores — prioritized by severity</div>
            <RotationRecommender teamFatigue={teamFatigue} />
          </div>

          {/* Best practice guide */}
          <div style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", border: "1.5px solid #f1f5f9", marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", marginBottom: 14 }}>📚 Fatigue Prevention Best Practices</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { icon: "⏰", label: "Shift Duration", rule: "Max 10h per shift. 12h only in emergencies, never more than 3 consecutive 12h shifts.", color: "#3b82f6" },
                { icon: "😴", label: "Rest Gap", rule: "Minimum 11h between shifts. For night shift workers, extend to 12h for circadian recovery.", color: "#8b5cf6" },
                { icon: "🔄", label: "Rotation Pattern", rule: "3-2-2 rotation (3 days on, 2 off, 2 on, 2 off) reduces fatigue accumulation by 35%.", color: "#22c55e" },
                { icon: "🌙", label: "Night Shifts", rule: "Limit night shifts to max 4 consecutive nights. Always follow with 2+ days off.", color: "#6366f1" },
                { icon: "📅", label: "Weekend Policy", rule: "Guarantee at least 1 full weekend per month. Weekend work must be voluntary when possible.", color: "#f59e0b" },
                { icon: "⚡", label: "Overtime Cap", rule: "Hard cap at 8h OT per week. Above 15h/week causes exponential fatigue compounding.", color: "#ef4444" },
              ].map((p) => (
                <div key={p.label} style={{ background: "#f8fafc", borderRadius: 10, padding: "12px 14px", border: `1px solid ${p.color}22` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: 14 }}>{p.icon}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: p.color }}>{p.label}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.5 }}>{p.rule}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Cross-module actions */}
          <div style={{ background: "#fff8f0", borderRadius: 14, padding: "16px 18px", border: "1.5px solid #fed7aa" }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#9a3412", marginBottom: 10 }}>🔗 Cross-Module Actions</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                { icon: "🎯", text: "→ M2: Run risk score for critical fatigue employees — expect 75%+ flight risk" },
                { icon: "🏥", text: "→ M4: Check Human Buffer for departments with avg fatigue >60" },
                { icon: "📈", text: "→ M6: Include buffer staff cost in ROI calculator to cover rotation gaps" },
                { icon: "🚪", text: "→ M5: Cross-reference fatigue data with exit interviews mentioning burnout/workload" },
              ].map((item) => (
                <div key={item.text.slice(0, 20)} style={{ background: "#fff", borderRadius: 8, padding: "8px 12px", border: "1px solid #fed7aa", fontSize: 11, color: "#64748b" }}>
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
