import { useState, useMemo, useCallback, useEffect } from "react";
import { useApp, useHRData, useCurrency, getGeneration } from "../context/AppContext";
import { GaugeChart } from "../components/Charts";

// ── CUSTOM HOOK: AI Copilot via Vercel ──
function useCopilot() {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState("");

  const askAI = async (prompt) => {
    setLoading(true); setResponse("");
    try {
      const res = await fetch("https://gemini-api-amber-iota.vercel.app/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ content: prompt }] })
      });
      const data = await res.json();
      setResponse(data.content?.[0]?.text || "No insights generated.");
    } catch (e) {
      setResponse("⚠️ AI Error: Check your Vercel connection.");
    }
    setLoading(false);
  };
  return { loading, response, askAI, setResponse };
}

// ── RISK ENGINE ──
function computeRisk(emp, cliff = 5000) {
  let score = 0; const factors = [];
  
  if (emp.overtime === "Yes") {
    score += 38; factors.push({ label: "Overtime", impact: 38, direction: "bad", note: "Strongest resignation predictor" });
  } else {
    factors.push({ label: "Overtime", impact: 0, direction: "good", note: "Balanced workload" });
  }

  const sal = Number(emp.salary) || 0;
  if (sal > 0 && sal < cliff) {
    const gap = cliff - sal; const salScore = Math.min(30, Math.round((gap / cliff) * 55));
    score += salScore; factors.push({ label: "Salary", impact: salScore, direction: "bad", note: `Below cliff by ${gap.toLocaleString()}` });
  } else {
    factors.push({ label: "Salary", impact: 0, direction: "good", note: "Above safety cliff" });
  }

  const sat = Number(emp.satisfaction) || 5;
  if (sat <= 3) {
    const satScore = Math.round((4 - sat) * 7); score += satScore;
    factors.push({ label: "Job Satisfaction", impact: satScore, direction: "bad", note: "Critically low" });
  } else if (sat >= 7) {
    factors.push({ label: "Job Satisfaction", impact: 0, direction: "good", note: "Thriving" });
  }

  const tenure = Number(emp.tenure) || 1;
  if (tenure < 1) { score += 10; factors.push({ label: "Tenure", impact: 10, direction: "bad", note: "< 1 year (Early Exit Risk)" }); }

  const final = Math.min(99, Math.max(1, score));
  return { score: final, factors };
}

function getRiskLevel(score) {
  if (score >= 75) return { label: "CRITICAL", color: "#ef4444", bg: "#fef2f2" };
  if (score >= 50) return { label: "HIGH RISK", color: "#f59e0b", bg: "#fffbeb" };
  if (score >= 25) return { label: "MODERATE", color: "#3b82f6", bg: "#eff6ff" };
  return { label: "LOW RISK", color: "#22c55e", bg: "#f0fdf4" };
}

// ── UI COMPONENTS ──
const Card = ({ children, style }) => <div style={{ background: "#fff", borderRadius: 16, padding: 24, border: "1.5px solid #e2e8f0", ...style }}>{children}</div>;
const Title = ({ children }) => <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", marginBottom: 6, letterSpacing: "-0.01em" }}>{children}</div>;

// ── MAIN MODULE ──
export default function M2RiskScorer() {
  const { company } = useApp();
  const { computed, applyIntervention } = useHRData();
  const { cfg } = useCurrency();
  const ai = useCopilot();
  
  const cliff = company?.salaryCliff || 5000;
  const [activeTab, setActiveTab] = useState("target");
  const [selectedId, setSelectedId] = useState("");

  // Auto-select first at-risk employee
  useEffect(() => {
    if (!selectedId && computed.length > 0) {
      const atRisk = computed.find(c => c.RiskPct >= 75) || computed[0];
      setSelectedId(atRisk.EmployeeID);
    }
  }, [computed, selectedId]);

  const activeEmp = useMemo(() => computed.find(c => c.EmployeeID === selectedId) || computed[0], [computed, selectedId]);

  // Tab 1: What-If States
  const [simSalary, setSimSalary] = useState(0);
  const [simOt, setSimOt] = useState("No");
  const [simSat, setSimSat] = useState(5);

  // Sync simulator when user changes
  useEffect(() => {
    if (activeEmp) {
      setSimSalary(Number(activeEmp.MonthlySalary) || 0);
      setSimOt(activeEmp.OvertimeStatus || "No");
      setSimSat(Number(activeEmp.JobSatisfaction) || 5);
    }
  }, [activeEmp]);

  const { score: simScore } = useMemo(() => computeRisk({ salary: simSalary, overtime: simOt, satisfaction: simSat, tenure: activeEmp?.YearsAtCompany }, cliff), [simSalary, simOt, simSat, activeEmp, cliff]);
  const baseLevel = getRiskLevel(activeEmp?.RiskPct || 0);
  const simLevel = getRiskLevel(simScore);
  const delta = simScore - (activeEmp?.RiskPct || 0);

  // AI Generator
  const handleGenerateScript = () => {
    const prompt = `Act as an HR Expert. The employee ${activeEmp.FirstName} (${activeEmp.Department}) is at ${activeEmp.RiskPct}% flight risk. I want to intervene by setting salary to ${simSalary}, overtime to ${simOt}, and boosting satisfaction to ${simSat} to drop risk to ${simScore}%. Write a 3-paragraph exact script for the manager to say in a 1-on-1 meeting to offer this intervention naturally. No intro/outro, just the script.`;
    ai.askAI(prompt);
  };

  // Contagion Radar Engine (Fuzzy matching close peers)
  const peers = useMemo(() => {
    if (!activeEmp) return [];
    return computed
      .filter(c => c.EmployeeID !== activeEmp.EmployeeID && c.Department === activeEmp.Department)
      .sort((a, b) => b.RiskPct - a.RiskPct)
      .slice(0, 5); // Top 5 closest peers
  }, [computed, activeEmp]);

  // Interventions Sandbox Cards
  const applyStrategy = (type) => {
    let updates = {};
    if (type === "salary") updates = { MonthlySalary: Math.round(Number(activeEmp.MonthlySalary) * 1.15) };
    if (type === "ot") updates = { OvertimeStatus: "No" };
    if (type === "mentor") updates = { JobSatisfaction: Math.min(10, Number(activeEmp.JobSatisfaction) + 3) };
    applyIntervention(activeEmp.EmployeeID, updates);
  };

  if (!activeEmp) return <div style={{ padding: 40, textAlign: "center" }}>Loading Masterpiece...</div>;

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* ── HEADER & SMART SEARCH ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", fontFamily: "Georgia, serif" }}>Predictive Lab</div>
          <div style={{ fontSize: 12, color: "#64748b" }}>Simulate, strategize, and execute retention interventions globally.</div>
        </div>
        <select value={selectedId} onChange={e => setSelectedId(e.target.value)}
          style={{ padding: "12px 16px", borderRadius: 12, border: "2px solid #e2e8f0", fontSize: 14, fontWeight: 700, width: 300, outline: "none", cursor: "pointer", background: "#fff" }}>
          {computed.map(c => (
            <option key={c.EmployeeID} value={c.EmployeeID}>
              {c.FirstName} {c.LastName} — {c.RiskPct}% Risk ({c.Department})
            </option>
          ))}
        </select>
      </div>

      {/* ── MODERN TABS ── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, background: "#fff", padding: 6, borderRadius: 12, width: "fit-content", border: "1px solid #e2e8f0" }}>
        {[
          { id: "target", icon: "🎯", label: "Target & Copilot" },
          { id: "sandbox", icon: "🃏", label: "Intervention Sandbox" },
          { id: "radar", icon: "🕸️", label: "Contagion Radar" },
          { id: "bulk", icon: "📋", label: "Bulk Ranking" },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            style={{
              padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
              background: activeTab === t.id ? "#0f172a" : "transparent",
              color: activeTab === t.id ? "#fff" : "#64748b",
              fontWeight: activeTab === t.id ? 700 : 600, fontSize: 12, transition: "all 0.2s"
            }}>
            <span style={{ fontSize: 14 }}>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB 1: TARGET & COPILOT ── */}
      {activeTab === "target" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {/* Left: What-If */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <Card style={{ background: baseLevel.bg, borderColor: baseLevel.color }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: baseLevel.color, letterSpacing: "0.1em", textTransform: "uppercase" }}>Current Baseline</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginTop: 4 }}>{activeEmp.FirstName} {activeEmp.LastName}</div>
                  <div style={{ fontSize: 13, color: "#475569" }}>{activeEmp.Department} · {activeEmp.YearsAtCompany}y Tenure · Gen {activeEmp.Generation}</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 36, fontWeight: 800, color: baseLevel.color, fontFamily: "Georgia, serif" }}>{activeEmp.RiskPct}%</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: baseLevel.color }}>{baseLevel.label}</div>
                </div>
              </div>
            </Card>

            <Card>
              <Title>🧪 What-If Simulator</Title>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 20 }}>Adjust the sliders to simulate retention strategies.</div>
              
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
                  <span>Monthly Salary</span>
                  <span style={{ color: simSalary >= cliff ? "#22c55e" : "#ef4444" }}>{cfg?.symbol || "$"}{simSalary.toLocaleString()}</span>
                </div>
                <input type="range" min={1000} max={15000} step={100} value={simSalary} onChange={e => setSimSalary(Number(e.target.value))} style={{ width: "100%", accentColor: "#0f172a" }} />
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
                  <span>Job Satisfaction</span>
                  <span style={{ color: simSat >= 7 ? "#22c55e" : "#ef4444" }}>{simSat}/10</span>
                </div>
                <input type="range" min={1} max={10} step={1} value={simSat} onChange={e => setSimSat(Number(e.target.value))} style={{ width: "100%", accentColor: "#0f172a" }} />
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                {["Yes", "No"].map(v => (
                  <button key={v} onClick={() => setSimOt(v)} style={{ flex: 1, padding: "10px", borderRadius: 8, border: `1.5px solid ${simOt === v ? "#0f172a" : "#e2e8f0"}`, background: simOt === v ? "#0f172a" : "#fff", color: simOt === v ? "#fff" : "#64748b", fontWeight: 700, cursor: "pointer" }}>
                    Overtime: {v}
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Right: AI Copilot */}
          <Card style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <Title>🤖 AI 1-on-1 Copilot</Title>
                <div style={{ fontSize: 12, color: "#64748b" }}>Generate an intervention script based on your simulation.</div>
              </div>
              <div style={{ textAlign: "right", background: simLevel.bg, padding: "8px 12px", borderRadius: 8, border: `1px solid ${simLevel.color}` }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: simLevel.color, textTransform: "uppercase" }}>Simulated Risk</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: simLevel.color }}>{simScore}% <span style={{ fontSize: 12 }}>({delta > 0 ? "+" : ""}{delta})</span></div>
              </div>
            </div>

            <button onClick={handleGenerateScript} disabled={ai.loading}
              style={{ padding: "14px", width: "100%", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#8b5cf6,#6366f1)", color: "#fff", fontWeight: 700, cursor: ai.loading ? "not-allowed" : "pointer", fontSize: 14, marginBottom: 16 }}>
              {ai.loading ? "⏳ Generating Script..." : "✨ Generate Manager's Talk Track"}
            </button>

            {ai.response && (
              <div style={{ flex: 1, background: "#f8fafc", borderRadius: 10, padding: 16, border: "1.5px solid #e2e8f0", fontSize: 13, lineHeight: 1.6, color: "#1e293b", whiteSpace: "pre-wrap", overflowY: "auto" }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: "#8b5cf6", letterSpacing: "0.1em", marginBottom: 8 }}>AI GENERATED SCRIPT</div>
                {ai.response}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ── TAB 2: INTERVENTION SANDBOX ── */}
      {activeTab === "sandbox" && (
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <div>
              <Title>🃏 Global Intervention Sandbox</Title>
              <div style={{ fontSize: 12, color: "#64748b" }}>Click a card to instantly apply the strategy to {activeEmp.FirstName}'s raw data globally.</div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {[
              { id: "salary", icon: "💰", title: "+15% Salary Bump", desc: `Raises salary to ${cfg?.symbol || "$"}${Math.round(Number(activeEmp.MonthlySalary)*1.15).toLocaleString()}`, color: "#22c55e", bg: "#f0fdf4" },
              { id: "ot", icon: "⚖️", title: "Mandatory Zero Overtime", desc: "Forces Overtime status to 'No' permanently.", color: "#3b82f6", bg: "#eff6ff" },
              { id: "mentor", icon: "🤝", title: "Assign Executive Mentor", desc: "Boosts Job Satisfaction score by +3 points.", color: "#8b5cf6", bg: "#f5f3ff" }
            ].map(card => (
              <div key={card.id} style={{ border: `1.5px solid ${card.color}44`, background: card.bg, borderRadius: 12, padding: 20, cursor: "pointer", transition: "all 0.2s" }}
                   onClick={() => applyStrategy(card.id)}
                   onMouseEnter={e => e.currentTarget.style.transform = "translateY(-4px)"}
                   onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>{card.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: card.color, marginBottom: 6 }}>{card.title}</div>
                <div style={{ fontSize: 11, color: "#475569", marginBottom: 16 }}>{card.desc}</div>
                <button style={{ width: "100%", padding: "8px", borderRadius: 6, border: "none", background: card.color, color: "#fff", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>
                  Apply Globally ⚡
                </button>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 20, fontSize: 11, color: "#94a3b8", textAlign: "center" }}>
            *Applying interventions here will permanently update the global state. Check M1 Dashboard afterward to see the changes!
          </div>
        </Card>
      )}

      {/* ── TAB 3: CONTAGION RADAR (SVG MASTERPIECE) ── */}
      {activeTab === "radar" && (
        <Card style={{ textAlign: "center" }}>
          <Title>🕸️ Turnover Contagion Radar (Blast Radius)</Title>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 30 }}>Visualizing the domino effect if {activeEmp.FirstName} resigns today. Proximity based on Dept & Generation.</div>
          
          <svg width="100%" height="400" viewBox="0 0 600 400" style={{ background: "#f8fafc", borderRadius: 16, border: "1px solid #e2e8f0" }}>
            {/* Center Node (Active Emp) */}
            <circle cx="300" cy="200" r="40" fill={baseLevel.color} opacity="0.2" className="pulse-anim" />
            <circle cx="300" cy="200" r="20" fill={baseLevel.color} />
            <text x="300" y="240" textAnchor="middle" fontSize="12" fontWeight="800" fill="#0f172a">{activeEmp.FirstName}</text>
            <text x="300" y="255" textAnchor="middle" fontSize="10" fill="#ef4444">Epicenter ({activeEmp.RiskPct}%)</text>

            {/* Peer Nodes */}
            {peers.map((p, i) => {
              const angle = (i / peers.length) * (2 * Math.PI) - (Math.PI / 2);
              const radius = 120 + (Math.random() * 40); // Random distance for organic look
              const x = 300 + radius * Math.cos(angle);
              const y = 200 + radius * Math.sin(angle);
              const pLevel = getRiskLevel(p.RiskPct);

              return (
                <g key={p.EmployeeID}>
                  {/* Contagion Line */}
                  <line x1="300" y1="200" x2={x} y2={y} stroke={pLevel.color} strokeWidth="2" strokeDasharray="4 4" opacity="0.5" />
                  {/* Peer Dot */}
                  <circle cx={x} cy={y} r="12" fill={pLevel.color} />
                  <text x={x} y={y - 20} textAnchor="middle" fontSize="11" fontWeight="700" fill="#1e293b">{p.FirstName}</text>
                  <text x={x} y={y + 25} textAnchor="middle" fontSize="9" fill={pLevel.color}>{p.RiskPct}% Risk</text>
                </g>
              );
            })}
          </svg>
          <style>{`@keyframes pulse { 0% { r: 30; opacity: 0.4; } 100% { r: 60; opacity: 0; } } .pulse-anim { animation: pulse 2s infinite; }`}</style>
        </Card>
      )}

      {/* ── TAB 4: BULK RANKING ── */}
      {activeTab === "bulk" && (
        <Card>
          <Title>📋 Organizational Risk Ranking</Title>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 20 }}>Top 20 employees at highest flight risk.</div>
          
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                  {["Rank", "Employee", "Dept", "Risk Score", "Salary", "Overtime", "Satisfaction"].map(h => (
                    <th key={h} style={{ padding: "12px", textAlign: "left", color: "#64748b", fontWeight: 700, fontSize: 10, textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {computed.sort((a,b) => b.RiskPct - a.RiskPct).slice(0, 20).map((emp, i) => (
                  <tr key={emp.EmployeeID} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px", fontWeight: 800, color: i < 3 ? "#ef4444" : "#94a3b8" }}>#{i + 1}</td>
                    <td style={{ padding: "12px", fontWeight: 700 }}>{emp.FirstName} {emp.LastName}</td>
                    <td style={{ padding: "12px", color: "#475569" }}>{emp.Department}</td>
                    <td style={{ padding: "12px" }}>
                      <div style={{ display: "inline-block", background: getRiskLevel(emp.RiskPct).bg, color: getRiskLevel(emp.RiskPct).color, padding: "4px 10px", borderRadius: 20, fontWeight: 800, fontSize: 11 }}>
                        {emp.RiskPct}%
                      </div>
                    </td>
                    <td style={{ padding: "12px", fontWeight: 600 }}>{cfg?.symbol || "$"}{Number(emp.MonthlySalary).toLocaleString()}</td>
                    <td style={{ padding: "12px", color: emp.OvertimeStatus === "Yes" ? "#ef4444" : "#22c55e", fontWeight: 700 }}>{emp.OvertimeStatus}</td>
                    <td style={{ padding: "12px", color: "#475569" }}>{emp.JobSatisfaction}/10</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

    </div>
  );
}
