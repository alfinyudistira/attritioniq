import { useState, useMemo, useCallback } from "react";
import { useApp, useCurrency, getGeneration, getStatusColor, SAMPLE_DATA } from "../context/AppContext";
import { GaugeChart } from "../components/Charts";

// ── Risk scoring engine (mirrors logistic regression from PDF) ──
function computeRisk(emp, cliff = 5000, currSymbol = "$") {
  let score = 0;
  const factors = [];

  // Overtime — strongest predictor (r=0.876)
  if (emp.overtime === "Yes") {
    score += 38;
    factors.push({ label: "Overtime", impact: 38, direction: "bad", note: "Single strongest predictor (r=0.876)" });
  } else {
    factors.push({ label: "Overtime", impact: 0, direction: "good", note: "No overtime — major retention factor" });
  }

  // Salary cliff
  const sal = Number(emp.salary) || 0;
  if (sal > 0 && sal < cliff) {
    const gap = cliff - sal;
    const salScore = Math.min(30, Math.round((gap / cliff) * 55));
    score += salScore;
    factors.push({ label: "Salary", impact: salScore, direction: "bad", note: `${currSymbol}${gap.toLocaleString()} below safety cliff (${currSymbol}${cliff.toLocaleString()}/mo)` });
  } else if (sal >= cliff) {
    factors.push({ label: "Salary", impact: 0, direction: "good", note: `Above cliff ${currSymbol}${cliff.toLocaleString()} — retention stabilizer` });
  } else {
    factors.push({ label: "Salary", impact: 0, direction: "neutral", note: "No salary data" });
  }

  // Job satisfaction (r=-0.901)
  const sat = Number(emp.satisfaction) || 5;
  if (sat <= 3) {
    const satScore = Math.round((4 - sat) * 7);
    score += satScore;
    factors.push({ label: "Job Satisfaction", impact: satScore, direction: "bad", note: `Score ${sat}/10 — critically low (threshold: ≤3)` });
  } else if (sat >= 7) {
    factors.push({ label: "Job Satisfaction", impact: 0, direction: "good", note: `Score ${sat}/10 — safe zone` });
  } else {
    factors.push({ label: "Job Satisfaction", impact: 4, direction: "warn", note: `Score ${sat}/10 — moderate risk` });
    score += 4;
  }

  // Tenure (r=-0.816)
  const tenure = Number(emp.tenure) || 1;
  if (tenure < 1) {
    score += 10;
    factors.push({ label: "Tenure", impact: 10, direction: "bad", note: "< 1 year — high early-exit risk" });
  } else if (tenure < 2) {
    score += 5;
    factors.push({ label: "Tenure", impact: 5, direction: "warn", note: "1–2 years — moderate risk window" });
  } else {
    factors.push({ label: "Tenure", impact: 0, direction: "good", note: `${tenure}y tenure — stability indicator` });
  }

  // Age / Generation
  const age = Number(emp.age) || 28;
  const gen = getGeneration(age);
  if (age < 26) {
    score += 12;
    factors.push({ label: "Generation (Gen Z)", impact: 12, direction: "bad", note: "100% attrition in dataset — mentorship gap risk" });
  } else if (age <= 35) {
    score += 3;
    factors.push({ label: "Generation (Millennial)", impact: 3, direction: "warn", note: "66.7% attrition in dataset" });
  } else {
    factors.push({ label: "Generation (Senior)", impact: 0, direction: "good", note: "0% attrition in dataset — high stability" });
  }

  const final = Math.min(99, Math.max(1, score));
  return { score: final, factors, gen };
}

function getRiskLevel(score) {
  if (score >= 75) return { label: "CRITICAL", color: "#ef4444", bg: "#fef2f2", border: "#fecaca" };
  if (score >= 50) return { label: "HIGH RISK", color: "#f59e0b", bg: "#fffbeb", border: "#fde68a" };
  if (score >= 25) return { label: "MODERATE", color: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe" };
  return { label: "LOW RISK", color: "#22c55e", bg: "#f0fdf4", border: "#bbf7d0" };
}

// ── AI Explanation via Anthropic API ──
async function fetchAIExplanation(emp, score, factors, company) {
  const prompt = `You are an expert HR data analyst at ${company?.name || "a company"}. 
Analyze this employee's attrition risk and provide a concise, actionable explanation.

Employee Profile:
- Department: ${emp.department}
- Monthly Salary: $${emp.salary} (Safety cliff: $${company?.salaryCliff || 5000})
- Overtime: ${emp.overtime}
- Job Satisfaction: ${emp.satisfaction}/10
- Tenure: ${emp.tenure} years
- Age: ${emp.age} (${getGeneration(Number(emp.age))} generation)
- Risk Score: ${score}%

Top Risk Factors: ${factors.filter(f => f.direction === "bad").map(f => f.label).join(", ")}

Write 3 short paragraphs:
1. Why this employee is at this risk level (be specific with the numbers)
2. The most urgent intervention needed
3. If this is a Gen Z employee under 26 with low satisfaction, add a specific "Quiet Quitting" warning and mentorship recommendation

Keep it under 180 words. Be direct and actionable. No bullet points.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await response.json();
  return data.content?.[0]?.text || "Unable to generate explanation.";
}

// ── COMPONENTS ──
function FactorBar({ factor }) {
  const colors = { bad: "#ef4444", warn: "#f59e0b", good: "#22c55e", neutral: "#94a3b8" };
  const color = colors[factor.direction];
  const maxImpact = 40;
  const pct = Math.min(100, (factor.impact / maxImpact) * 100);

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#1e293b" }}>{factor.label}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color }}>
          {factor.impact > 0 ? `+${factor.impact} pts` : factor.direction === "good" ? "✓ Safe" : "—"}
        </span>
      </div>
      <div style={{ height: 6, background: "#f1f5f9", borderRadius: 3, overflow: "hidden", marginBottom: 3 }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 3, transition: "width 0.5s ease" }} />
      </div>
      <div style={{ fontSize: 10, color: "#94a3b8" }}>{factor.note}</div>
    </div>
  );
}

function InputField({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#475569", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "9px 12px", borderRadius: 9,
  border: "1.5px solid #e2e8f0", fontSize: 13, color: "#1e293b",
  background: "#f8fafc", outline: "none", boxSizing: "border-box",
};

const selectStyle = { ...inputStyle, cursor: "pointer" };

// ── WHAT-IF SIMULATOR ──
function WhatIfSimulator({ baseEmp, company }) {
  const cliff = company?.salaryCliff || 5000;
  const [simSalary, setSimSalary] = useState(Number(baseEmp.salary) || 4000);
  const [simOvertime, setSimOvertime] = useState(baseEmp.overtime);
  const [simSat, setSimSat] = useState(Number(baseEmp.satisfaction) || 3);

  const simEmp = { ...baseEmp, salary: simSalary, overtime: simOvertime, satisfaction: simSat };
  const { score: simScore, factors: simFactors } = computeRisk(simEmp, cliff);
  const baseResult = computeRisk(baseEmp, cliff);
  const delta = simScore - baseResult.score;
  const level = getRiskLevel(simScore);

  return (
    <div style={{ background: "#fff", borderRadius: 14, padding: "20px 22px", border: "1.5px solid #f1f5f9", marginTop: 20 }}>
      <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", marginBottom: 4 }}>🧪 What-If Simulator</div>
      <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 18 }}>
        Adjust variables to see how interventions change the risk score in real-time
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 18 }}>
        {/* Salary slider */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
            Monthly Salary
          </div>
          <input type="range" min={2000} max={8000} step={100} value={simSalary}
            onChange={e => setSimSalary(Number(e.target.value))}
            style={{ width: "100%", accentColor: "#f59e0b" }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#64748b", marginTop: 3 }}>
            <span>$2,000</span>
            <span style={{ fontWeight: 700, color: simSalary >= cliff ? "#22c55e" : "#ef4444" }}>${simSalary.toLocaleString()}</span>
            <span>$8,000</span>
          </div>
          {simSalary >= cliff && (
            <div style={{ fontSize: 10, color: "#22c55e", fontWeight: 700, marginTop: 2 }}>✓ Above cliff</div>
          )}
        </div>

        {/* Overtime toggle */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
            Overtime
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {["Yes", "No"].map(v => (
              <button key={v} onClick={() => setSimOvertime(v)}
                style={{
                  flex: 1, padding: "8px", borderRadius: 8, border: "none",
                  background: simOvertime === v ? (v === "Yes" ? "#fef2f2" : "#f0fdf4") : "#f8fafc",
                  color: simOvertime === v ? (v === "Yes" ? "#ef4444" : "#16a34a") : "#94a3b8",
                  fontWeight: simOvertime === v ? 700 : 500, cursor: "pointer", fontSize: 12,
                  border: `1.5px solid ${simOvertime === v ? (v === "Yes" ? "#fecaca" : "#bbf7d0") : "#e2e8f0"}`,
                }}>
                {v === "Yes" ? "⏱ Yes" : "✓ No"}
              </button>
            ))}
          </div>
        </div>

        {/* Satisfaction slider */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
            Job Satisfaction
          </div>
          <input type="range" min={1} max={10} step={1} value={simSat}
            onChange={e => setSimSat(Number(e.target.value))}
            style={{ width: "100%", accentColor: simSat >= 7 ? "#22c55e" : simSat >= 4 ? "#f59e0b" : "#ef4444" }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#64748b", marginTop: 3 }}>
            <span>1</span>
            <span style={{ fontWeight: 700, color: simSat >= 7 ? "#22c55e" : simSat >= 4 ? "#f59e0b" : "#ef4444" }}>{simSat}/10</span>
            <span>10</span>
          </div>
        </div>
      </div>

      {/* Result */}
      <div style={{ background: level.bg, borderRadius: 12, padding: "16px 20px", border: `1.5px solid ${level.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Simulated Risk Score</div>
          <div style={{ fontSize: 36, fontWeight: 800, color: level.color, fontFamily: "'Playfair Display',Georgia,serif", lineHeight: 1.1 }}>{simScore}%</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: level.color, marginTop: 2 }}>{level.label}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11, color: "#94a3b8" }}>vs current score</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: delta < 0 ? "#22c55e" : delta > 0 ? "#ef4444" : "#94a3b8", fontFamily: "'Playfair Display',Georgia,serif" }}>
            {delta === 0 ? "No change" : delta < 0 ? `▼ ${Math.abs(delta)} pts` : `▲ ${delta} pts`}
          </div>
          {delta < -15 && <div style={{ fontSize: 11, color: "#16a34a", fontWeight: 700 }}>✓ Significant improvement!</div>}
          {delta > 10 && <div style={{ fontSize: 11, color: "#dc2626", fontWeight: 700 }}>⚠ Risk increased!</div>}
        </div>
      </div>
    </div>
  );
}

// ── BULK SCORER TABLE ──
function BulkScorer({ company }) {
  const { data } = useApp();
  const cliff = company?.salaryCliff || 5000;

  const scored = useMemo(() => {
    const src = data.length > 0 ? data : SAMPLE_DATA;
    return src.map(emp => {
      const e = {
        salary: emp.MonthlySalary,
        overtime: emp.OvertimeStatus,
        satisfaction: emp.JobSatisfaction,
        tenure: emp.YearsAtCompany,
        age: emp.Age,
        department: emp.Department,
      };
      const { score, factors } = computeRisk(e, cliff);
      return { ...emp, riskScore: score, riskLevel: getRiskLevel(score), topFactor: factors.filter(f => f.direction === "bad").sort((a, b) => b.impact - a.impact)[0]?.label || "—" };
    }).sort((a, b) => b.riskScore - a.riskScore);
  }, [data, cliff]);

  const critical = scored.filter(e => e.riskScore >= 75).length;
  const high = scored.filter(e => e.riskScore >= 50 && e.riskScore < 75).length;

  return (
    <div style={{ background: "#fff", borderRadius: 14, padding: "20px 22px", border: "1.5px solid #f1f5f9", marginTop: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", marginBottom: 2 }}>📋 Bulk Risk Ranking</div>
          <div style={{ fontSize: 11, color: "#94a3b8" }}>All {scored.length} employees ranked by predicted flight risk</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "5px 12px", fontSize: 11, color: "#dc2626", fontWeight: 700 }}>
            🚨 {critical} Critical
          </div>
          <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "5px 12px", fontSize: 11, color: "#b45309", fontWeight: 700 }}>
            ⚠️ {high} High
          </div>
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              {["Rank", "Employee", "Dept", "Risk Score", "Level", "Top Risk Factor", "Salary", "OT", "Satisfaction"].map(h => (
                <th key={h} style={{ padding: "8px 10px", textAlign: "left", color: "#64748b", fontWeight: 700, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "2px solid #f1f5f9", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {scored.slice(0, 20).map((emp, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #f8fafc", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                <td style={{ padding: "8px 10px", fontWeight: 700, color: i < 3 ? "#ef4444" : "#94a3b8", fontSize: 13 }}>#{i + 1}</td>
                <td style={{ padding: "8px 10px", color: "#1e293b", fontWeight: 500, whiteSpace: "nowrap" }}>
                  {emp.FirstName} {emp.LastName}
                  {Number(emp.Age) < 26 && <span style={{ marginLeft: 4, background: "#fef3c7", color: "#92400e", fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 4 }}>Gen Z</span>}
                </td>
                <td style={{ padding: "8px 10px", color: "#475569", whiteSpace: "nowrap" }}>{emp.Department}</td>
                <td style={{ padding: "8px 10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 48, height: 6, background: "#f1f5f9", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ width: `${emp.riskScore}%`, height: "100%", background: emp.riskLevel.color, borderRadius: 3 }} />
                    </div>
                    <span style={{ fontWeight: 700, color: emp.riskLevel.color, fontSize: 13 }}>{emp.riskScore}%</span>
                  </div>
                </td>
                <td style={{ padding: "8px 10px" }}>
                  <span style={{ background: emp.riskLevel.bg, color: emp.riskLevel.color, padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700, border: `1px solid ${emp.riskLevel.border}` }}>
                    {emp.riskLevel.label}
                  </span>
                </td>
                <td style={{ padding: "8px 10px", color: "#64748b", fontSize: 11 }}>{emp.topFactor}</td>
                <td style={{ padding: "8px 10px", color: (emp.MonthlySalary || 0) < cliff ? "#ef4444" : "#16a34a", fontWeight: 600 }}>${(emp.MonthlySalary || 0).toLocaleString()}</td>
                <td style={{ padding: "8px 10px", color: emp.OvertimeStatus === "Yes" ? "#ef4444" : "#16a34a", fontWeight: 700 }}>{emp.OvertimeStatus}</td>
                <td style={{ padding: "8px 10px", color: "#475569" }}>{emp.JobSatisfaction}/10</td>
              </tr>
            ))}
          </tbody>
        </table>
        {scored.length > 20 && (
          <div style={{ textAlign: "center", padding: "10px", fontSize: 11, color: "#94a3b8" }}>
            Showing top 20 of {scored.length} employees
          </div>
        )}
      </div>
    </div>
  );
}

// ── MAIN M2 COMPONENT ──
export default function M2RiskScorer() {
  const { data, company } = useApp();
  const { fmt, currency, config: cfg } = useCurrency();
  const cliff = company?.salaryCliff || 5000;
  const deptOptions = useMemo(() => {
    const fromData = [...new Set(data.map(d => d.Department).filter(Boolean))];
    return fromData.length > 0
      ? fromData
      : ["Sales","Technical Support","IT","HR","Digital Marketing","Operations","Finance","Other"];
  }, [data]);

  const [emp, setEmp] = useState({
    name: "", department: "Sales", salary: 4200,
    overtime: "Yes", satisfaction: 2, tenure: 1.5, age: 27,
  });
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [scored, setScored] = useState(false);
  const [activeTab, setActiveTab] = useState("single");

  const set = (k, v) => setEmp(p => ({ ...p, [k]: v }));
  const { score, factors, gen } = useMemo(() => computeRisk(emp, cliff, cfg?.symbol || "$"), [emp, cliff, cfg]);
  const level = getRiskLevel(score);

  const handleScore = () => setScored(true);

  const handleAI = useCallback(async () => {
    setAiLoading(true);
    setAiText("");
    try {
      const text = await fetchAIExplanation(emp, score, factors, company);
      setAiText(text);
    } catch {
      setAiText("AI explanation unavailable. Please check your connection.");
    }
    setAiLoading(false);
  }, [emp, score, factors, company]);

  const isGenZRisk = Number(emp.age) < 26 && Number(emp.satisfaction) <= 4 && emp.overtime === "Yes";

  const TABS = [
    { id: "single", label: "🎯 Single Employee" },
    { id: "bulk", label: "📋 Bulk Ranking" },
  ];

  return (
    <div>
      {/* Tab switcher */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            style={{
              padding: "9px 20px", borderRadius: 10, border: "none", cursor: "pointer",
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

      {activeTab === "single" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
            {/* Left — Input Form */}
            <div style={{ background: "#fff", borderRadius: 14, padding: "20px 22px", border: "1.5px solid #f1f5f9" }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", marginBottom: 4 }}>Employee Profile</div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 18 }}>Enter details to compute flight risk score</div>

              <InputField label="Full Name (optional)">
                <input type="text" value={emp.name} placeholder="e.g. Sarah Miller"
                  onChange={e => set("name", e.target.value)} style={inputStyle} />
              </InputField>

              <InputField label="Department">
  <select value={emp.department} onChange={e => set("department", e.target.value)} style={selectStyle}>
    {deptOptions.map(d => (
      <option key={d}>{d}</option>
    ))}
  </select>
</InputField>


              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <InputField label={`Monthly Salary (${cfg?.symbol || "$"})`}>
                  <input type="number" value={emp.salary} min={0}
                    onChange={e => set("salary", Number(e.target.value))} style={inputStyle} />
                </InputField>
                <InputField label="Overtime">
                  <select value={emp.overtime} onChange={e => set("overtime", e.target.value)} style={selectStyle}>
                    <option>Yes</option>
                    <option>No</option>
                  </select>
                </InputField>
              </div>

              <InputField label={`Job Satisfaction: ${emp.satisfaction}/10`}>
                <input type="range" min={1} max={10} step={1} value={emp.satisfaction}
                  onChange={e => set("satisfaction", Number(e.target.value))}
                  style={{ width: "100%", accentColor: emp.satisfaction >= 7 ? "#22c55e" : emp.satisfaction >= 4 ? "#f59e0b" : "#ef4444" }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#94a3b8" }}>
                  <span>1 — Miserable</span><span>10 — Thriving</span>
                </div>
              </InputField>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <InputField label="Years at Company">
                  <input type="number" value={emp.tenure} min={0} step={0.5}
                    onChange={e => set("tenure", Number(e.target.value))} style={inputStyle} />
                </InputField>
                <InputField label="Age">
                  <input type="number" value={emp.age} min={18} max={65}
                    onChange={e => set("age", Number(e.target.value))} style={inputStyle} />
                </InputField>
              </div>

              <button onClick={handleScore}
                style={{ width: "100%", padding: "13px", background: "linear-gradient(135deg,#f59e0b,#ef4444)", color: "#fff", border: "none", borderRadius: 11, fontSize: 14, fontWeight: 700, cursor: "pointer", marginTop: 4 }}>
                Compute Risk Score →
              </button>
            </div>

            {/* Right — Score Output */}
            <div>
              {/* Gauge */}
              <div style={{ background: level.bg, borderRadius: 14, padding: "20px 22px", border: `1.5px solid ${level.border}`, marginBottom: 14, textAlign: "center" }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", marginBottom: 8 }}>
                  {emp.name ? `${emp.name}'s` : "Employee"} Flight Risk Score
                </div>
                <GaugeChart value={score} size={180} />
                <div style={{ marginTop: 8 }}>
                  <span style={{ background: level.color, color: "#fff", padding: "5px 18px", borderRadius: 20, fontSize: 13, fontWeight: 800, letterSpacing: "0.05em" }}>
                    {level.label}
                  </span>
                </div>
                <div style={{ marginTop: 10, fontSize: 12, color: "#64748b" }}>
                  Generation: <strong>{gen}</strong> · Dept: <strong>{emp.department}</strong>
                </div>
              </div>

              {/* Gen Z Quiet Quitting Warning */}
              {isGenZRisk && (
                <div style={{ background: "#fef3c7", borderRadius: 12, padding: "12px 16px", border: "2px solid #fbbf24", marginBottom: 14 }}>
                  <div style={{ fontWeight: 800, fontSize: 12, color: "#92400e", marginBottom: 4 }}>
                    🔕 QUIET QUITTING ALERT — Gen Z Profile Detected
                  </div>
                  <div style={{ fontSize: 11, color: "#78350f", lineHeight: 1.5 }}>
                    This employee matches the "Silent Drift" failure mode from exit interview data. Age &lt;26 + low satisfaction + overtime = high quiet-quitting probability. Primary intervention: <strong>assign a dedicated mentor immediately</strong> and reduce overtime exposure within 2 weeks.
                  </div>
                </div>
              )}

              {/* Factor Breakdown */}
              <div style={{ background: "#fff", borderRadius: 14, padding: "20px 22px", border: "1.5px solid #f1f5f9" }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", marginBottom: 14 }}>Risk Factor Breakdown</div>
                {factors.map((f, i) => <FactorBar key={i} factor={f} />)}

                {/* AI Button */}
                <button onClick={handleAI} disabled={aiLoading}
                  style={{ width: "100%", padding: "11px", background: aiLoading ? "#f1f5f9" : "#0f172a", color: aiLoading ? "#94a3b8" : "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: aiLoading ? "not-allowed" : "pointer", marginTop: 10 }}>
                  {aiLoading ? "⏳ Generating AI Analysis..." : "🤖 Get AI Explanation"}
                </button>

                {aiText && (
                  <div style={{ marginTop: 14, background: "#f8fafc", borderRadius: 10, padding: "14px 16px", border: "1.5px solid #e2e8f0" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>AI Analysis</div>
                    <div style={{ fontSize: 12, color: "#1e293b", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{aiText}</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* What-If Simulator — only show after scoring */}
          {scored && <WhatIfSimulator baseEmp={emp} company={company} />}
        </div>
      )}

      {activeTab === "bulk" && <BulkScorer company={company} />}
    </div>
  );
}
