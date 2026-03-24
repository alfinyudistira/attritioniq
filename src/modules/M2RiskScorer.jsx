import { useState, useMemo, useEffect } from "react";
import { useApp, useHRData, useCurrency } from "../context/AppContext";

// ── CUSTOM HOOK: AI Copilot via Vercel ──
function useCopilot() {
  const [loading, setLoading] = useState(false);
  const [response, setResponseState] = useState(() => localStorage.getItem("m2_ai_response") || "");

  const setResponse = (val) => {
    setResponseState(val);
    localStorage.setItem("m2_ai_response", val);
  };

  const askAI = async (prompt) => {
    setLoading(true); setResponse("");
    try {
      const res = await fetch("https://gemini-api-amber-iota.vercel.app/api/gemini", {
        method: "POST", headers: { "Content-Type": "application/json" },
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
  if (emp.overtime === "Yes") { score += 38; factors.push({ label: "Overtime", impact: 38, direction: "bad", note: "Strongest resignation predictor" }); } 
  else { factors.push({ label: "Overtime", impact: 0, direction: "good", note: "Balanced workload" }); }

  const sal = Number(emp.salary) || 0;
  if (sal > 0 && sal < cliff) {
    const gap = cliff - sal; const salScore = Math.min(30, Math.round((gap / cliff) * 55));
    score += salScore; factors.push({ label: "Salary", impact: salScore, direction: "bad", note: `Below cliff by ${gap.toLocaleString()}` });
  } else { factors.push({ label: "Salary", impact: 0, direction: "good", note: "Above safety cliff" }); }

  const sat = Number(emp.satisfaction) || 5;
  if (sat <= 3) {
    const satScore = Math.round((4 - sat) * 7); score += satScore;
    factors.push({ label: "Job Satisfaction", impact: satScore, direction: "bad", note: "Critically low" });
  } else if (sat >= 7) { factors.push({ label: "Job Satisfaction", impact: 0, direction: "good", note: "Thriving" }); }

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

// ── DYNAMIC CONSEQUENCE ENGINE ──
function getConsequence(baseScore, simScore, cliff, simSalary, simOt) {
  const delta = simScore - baseScore;
  if (delta === 0) return { title: "Neutral Impact", text: "These adjustments are not significant enough to alter the employee's current trajectory.", color: "#64748b", bg: "#f8fafc" };
  if (simScore >= 75 && delta > 0) return { title: "DANGER: Toxic Combination", text: `WARNING: Imposing this condition will trigger an immediate flight risk. High probability of resignation within 30 days.`, color: "#dc2626", bg: "#fef2f2" };
  if (delta < -20 && simScore <= 50) return { title: "Optimal Intervention", text: `Highly effective move! Bringing salary closer to market rate and balancing workload stabilizes this employee for at least 12-18 months.`, color: "#16a34a", bg: "#f0fdf4" };
  if (delta < 0 && simOt === "Yes") return { title: "Temporary Band-Aid", text: `Salary bump helps temporarily, but retaining 'Overtime: Yes' means burnout risk remains. Expect the flight risk to return in 3-6 months.`, color: "#d97706", bg: "#fffbeb" };
  if (delta < 0) return { title: "Positive Shift", text: "Risk is decreasing, but monitor closely to ensure job satisfaction improves over time.", color: "#2563eb", bg: "#eff6ff" };
  return { title: "Negative Trend", text: "These changes are increasing dissatisfaction. Re-evaluate your strategy.", color: "#dc2626", bg: "#fef2f2" };
}

// ── UI COMPONENTS ──
const Card = ({ children, style }) => <div style={{ background: "#fff", borderRadius: 16, padding: 24, border: "1.5px solid #e2e8f0", ...style }}>{children}</div>;
const Title = ({ children }) => <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", marginBottom: 6, letterSpacing: "-0.01em" }}>{children}</div>;

export default function M2RiskScorer() {
  const { company } = useApp();
  const { computed, applyIntervention } = useHRData();
  const { cfg } = useCurrency();
  const ai = useCopilot();
  
  const cliff = company?.salaryCliff || 5000;
  
  // ── PERSISTENT STATE ──
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem("m2_active_tab") || "target");
  const [selectedId, setSelectedId] = useState(() => localStorage.getItem("m2_selected_id") || "");

  useEffect(() => { localStorage.setItem("m2_active_tab", activeTab); }, [activeTab]);
  useEffect(() => { localStorage.setItem("m2_selected_id", selectedId); }, [selectedId]);

  useEffect(() => {
    if (!selectedId && computed.length > 0) {
      const atRisk = computed.find(c => c.RiskPct >= 75) || computed[0];
      setSelectedId(atRisk.EmployeeID);
    }
  }, [computed, selectedId]);

  const activeEmp = useMemo(() => computed.find(c => c.EmployeeID === selectedId) || computed[0], [computed, selectedId]);

  const [simSalary, setSimSalary] = useState(() => Number(localStorage.getItem("m2_sim_sal")) || 0);
  const [simOt, setSimOt] = useState(() => localStorage.getItem("m2_sim_ot") || "No");
  const [simSat, setSimSat] = useState(() => Number(localStorage.getItem("m2_sim_sat")) || 5);

  useEffect(() => { localStorage.setItem("m2_sim_sal", simSalary); }, [simSalary]);
  useEffect(() => { localStorage.setItem("m2_sim_ot", simOt); }, [simOt]);
  useEffect(() => { localStorage.setItem("m2_sim_sat", simSat); }, [simSat]);

  useEffect(() => {
    if (activeEmp && activeEmp.EmployeeID !== localStorage.getItem("m2_last_synced_emp")) {
      setSimSalary(Number(activeEmp.MonthlySalary) || 0);
      setSimOt(activeEmp.OvertimeStatus || "No");
      setSimSat(Number(activeEmp.JobSatisfaction) || 5);
      localStorage.setItem("m2_last_synced_emp", activeEmp.EmployeeID);
      ai.setResponse(""); 
    }
  }, [activeEmp, ai]);

  // ── ENGINE CALCULATIONS ──
  const { score: simScore } = useMemo(() => computeRisk({ salary: simSalary, overtime: simOt, satisfaction: simSat, tenure: activeEmp?.YearsAtCompany }, cliff), [simSalary, simOt, simSat, activeEmp, cliff]);
  const baseLevel = getRiskLevel(activeEmp?.RiskPct || 0);
  const simLevel = getRiskLevel(simScore);
  const delta = simScore - (activeEmp?.RiskPct || 0);
  const consequence = getConsequence((activeEmp?.RiskPct || 0), simScore, cliff, simSalary, simOt);
  const turnoverCost = activeEmp ? Math.round(Number(activeEmp.MonthlySalary) * 12 * (company?.replacementMultiplier || 1.5)) : 0;

  // ── CONTAGION RADAR LOGIC (TAB 3) ──
  const peers = useMemo(() => {
    if (!activeEmp) return [];
    return computed
      .filter(c => c.EmployeeID !== activeEmp.EmployeeID && c.Department === activeEmp.Department)
      .sort((a, b) => b.RiskPct - a.RiskPct).slice(0, 8); // Top 8 peers in same dept
  }, [computed, activeEmp]);
  
  const isInfluencer = activeEmp && (Number(activeEmp.YearsAtCompany) >= 3 || Number(activeEmp.MonthlySalary) >= cliff * 1.5);
  const chainProb = activeEmp ? Math.min(98, Math.round((activeEmp.RiskPct * peers.length) / 12) + 15) : 0;

  // ── BATCH EXPORT PIP (TAB 4) ──
  const handleExportPIP = () => {
    const pipData = computed.filter(c => c.RiskPct >= 50);
    const headers = ["EmployeeID", "Name", "Department", "Risk Score", "Urgent Action Required"];
    const rows = pipData.map(d => `${d.EmployeeID},"${d.FirstName} ${d.LastName}",${d.Department},${d.RiskPct}%,${d.OvertimeStatus === "Yes" ? "Remove Overtime" : "Review Salary"}`);
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `PIP_Candidates_${Date.now()}.csv`; a.click();
  };

  // ── ACTION HANDLERS ──
  const handleGenerateScript = () => {
    const prompt = `Act as an HR Expert. The employee ${activeEmp.FirstName} (${activeEmp.Department}) is at ${activeEmp.RiskPct}% flight risk. I want to intervene by setting salary to ${simSalary}, overtime to ${simOt}, and boosting satisfaction to ${simSat} to drop risk to ${simScore}%. Write a 3-paragraph exact script for the manager to say in a 1-on-1 meeting to offer this intervention naturally in English. No intro/outro, just the script.`;
    ai.askAI(prompt);
  };

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
      {/* ── HEADER ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", fontFamily: "Georgia, serif" }}>Predictive Lab</div>
          <div style={{ fontSize: 12, color: "#64748b" }}>Simulate, strategize, and execute retention interventions globally.</div>
        </div>
        <select value={selectedId} onChange={e => setSelectedId(e.target.value)}
          style={{ padding: "12px 16px", borderRadius: 12, border: "2px solid #e2e8f0", fontSize: 14, fontWeight: 700, width: 300, outline: "none", cursor: "pointer", background: "#fff" }}>
          {computed.map(c => (
            <option key={c.EmployeeID} value={c.EmployeeID}>{c.FirstName} {c.LastName} — {c.RiskPct}% Risk ({c.Department})</option>
          ))}
        </select>
      </div>

      {/* ── TABS ── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, background: "#fff", padding: 6, borderRadius: 12, width: "fit-content", border: "1px solid #e2e8f0", flexWrap: "wrap" }}>
        {[
          { id: "target", icon: "🎯", label: "Target & Copilot" },
          { id: "sandbox", icon: "🃏", label: "Intervention Sandbox" },
          { id: "radar", icon: "🕸️", label: "Contagion Radar" },
          { id: "bulk", icon: "📋", label: "Bulk Ranking" },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            style={{ padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, background: activeTab === t.id ? "#0f172a" : "transparent", color: activeTab === t.id ? "#fff" : "#64748b", fontWeight: activeTab === t.id ? 700 : 600, fontSize: 12, transition: "all 0.2s" }}>
            <span style={{ fontSize: 14 }}>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB 1: TARGET & COPILOT ── */}
      {activeTab === "target" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: 20 }}>
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

              <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
                {["Yes", "No"].map(v => (
                  <button key={v} onClick={() => setSimOt(v)} style={{ flex: 1, padding: "10px", borderRadius: 8, border: `1.5px solid ${simOt === v ? "#0f172a" : "#e2e8f0"}`, background: simOt === v ? "#0f172a" : "#fff", color: simOt === v ? "#fff" : "#64748b", fontWeight: 700, cursor: "pointer" }}>
                    Overtime: {v}
                  </button>
                ))}
              </div>

              <div style={{ background: consequence.bg, borderLeft: `4px solid ${consequence.color}`, padding: "12px 16px", borderRadius: "0 8px 8px 0" }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: consequence.color, textTransform: "uppercase", marginBottom: 4 }}>{consequence.title}</div>
                <div style={{ fontSize: 12, color: "#1e293b", lineHeight: 1.5 }}>{consequence.text}</div>
              </div>
            </Card>
          </div>

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
              <div style={{ flex: 1, background: "#f8fafc", borderRadius: 10, padding: 16, border: "1.5px solid #e2e8f0", fontSize: 13, lineHeight: 1.6, color: "#1e293b", whiteSpace: "pre-wrap", overflowY: "auto", maxHeight: 400 }}>
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
              <div style={{ fontSize: 12, color: "#64748b" }}>Evaluate strategies before permanently updating the global dataset.</div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
            {[
              { id: "salary", icon: "💰", title: "+15% Salary Bump", cost: Math.round(Number(activeEmp.MonthlySalary)*0.15)*12, prob: "85%", color: "#22c55e", bg: "#f0fdf4" },
              { id: "ot", icon: "⚖️", title: "Zero Overtime Policy", cost: 0, prob: "62%", color: "#3b82f6", bg: "#eff6ff" },
              { id: "mentor", icon: "🤝", title: "Assign Executive Mentor", cost: 1200, prob: "74%", color: "#8b5cf6", bg: "#f5f3ff" }
            ].map(card => {
              const netImpact = turnoverCost - card.cost;
              return (
                <div key={card.id} style={{ border: `1.5px solid ${card.color}44`, background: card.bg, borderRadius: 12, padding: 20, display: "flex", flexDirection: "column" }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>{card.icon}</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: card.color, marginBottom: 16 }}>{card.title}</div>
                  
                  <div style={{ background: "#fff", borderRadius: 8, padding: 10, border: "1px solid #e2e8f0", marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
                      <span style={{ color: "#64748b" }}>Intervention Cost:</span><span style={{ fontWeight: 700, color: "#ef4444" }}>{cfg?.symbol}{card.cost.toLocaleString()}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4 }}>
                      <span style={{ color: "#64748b" }}>Turnover Savings:</span><span style={{ fontWeight: 700, color: "#22c55e" }}>{cfg?.symbol}{turnoverCost.toLocaleString()}</span>
                    </div>
                    <div style={{ borderTop: "1px dashed #cbd5e1", margin: "6px 0" }} />
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                      <span style={{ color: "#0f172a", fontWeight: 700 }}>Net ROI Impact:</span>
                      <span style={{ fontWeight: 800, color: netImpact > 0 ? "#16a34a" : "#dc2626" }}>+{cfg?.symbol}{netImpact.toLocaleString()}</span>
                    </div>
                  </div>

                  <div style={{ fontSize: 11, color: "#64748b", marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>
                    <span>📊 Historical Success Rate:</span><span style={{ fontWeight: 700, color: "#0f172a", background: "#e2e8f0", padding: "2px 6px", borderRadius: 4 }}>{card.prob}</span>
                  </div>

                  <button onClick={() => applyStrategy(card.id)} style={{ marginTop: "auto", width: "100%", padding: "10px", borderRadius: 8, border: "none", background: card.color, color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                    Apply to {activeEmp.FirstName} ⚡
                  </button>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ── TAB 3: CONTAGION RADAR ── */}
      {activeTab === "radar" && (
        <Card style={{ textAlign: "center", position: "relative", overflow: "hidden" }}>
          <Title>🕸️ Turnover Contagion Radar (Blast Radius)</Title>
          <div style={{ fontSize: 12, color: "#64748b", marginBottom: 20 }}>Visualizing the domino effect. If {activeEmp.FirstName} resigns, who else in {activeEmp.Department} is at risk?</div>
          
          <div style={{ display: "flex", justifyContent: "center", gap: 30, marginBottom: 20 }}>
            <div style={{ background: isInfluencer ? "#fef2f2" : "#f8fafc", padding: "10px 20px", borderRadius: 10, border: `1px solid ${isInfluencer ? "#fecaca" : "#e2e8f0"}` }}>
              <div style={{ fontSize: 10, color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Network Status</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: isInfluencer ? "#ef4444" : "#0f172a" }}>{isInfluencer ? "🚨 CRITICAL HUB NODE" : "Isolated Contributor"}</div>
            </div>
            <div style={{ background: chainProb > 60 ? "#fffbeb" : "#f0fdf4", padding: "10px 20px", borderRadius: 10, border: `1px solid ${chainProb > 60 ? "#fde68a" : "#bbf7d0"}` }}>
              <div style={{ fontSize: 10, color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Chain Reaction Probability</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: chainProb > 60 ? "#d97706" : "#16a34a" }}>{chainProb}% Chance</div>
            </div>
          </div>

          <svg width="100%" height="350" viewBox="0 0 600 350" style={{ background: "#f8fafc", borderRadius: 16, border: "1px solid #e2e8f0" }}>
            <circle cx="300" cy="175" r={isInfluencer ? "60" : "40"} fill={baseLevel.color} opacity="0.15" className="pulse-anim" />
            <circle cx="300" cy="175" r="25" fill={baseLevel.color} />
            <text x="300" y="215" textAnchor="middle" fontSize="13" fontWeight="800" fill="#0f172a">{activeEmp.FirstName}</text>
            <text x="300" y="230" textAnchor="middle" fontSize="10" fill="#ef4444">Epicenter ({activeEmp.RiskPct}%)</text>

            {peers.map((p, i) => {
              const angle = (i / peers.length) * (2 * Math.PI) - (Math.PI / 2);
              const radius = 100 + (Math.random() * 50); 
              const x = 300 + radius * Math.cos(angle);
              const y = 175 + radius * Math.sin(angle);
              const pLevel = getRiskLevel(p.RiskPct);
              return (
                <g key={p.EmployeeID}>
                  <line x1="300" y1="175" x2={x} y2={y} stroke={pLevel.color} strokeWidth="2" strokeDasharray="4 4" opacity="0.6" />
                  <circle cx={x} cy={y} r="14" fill={pLevel.color} />
                  <text x={x} y={y - 20} textAnchor="middle" fontSize="11" fontWeight="700" fill="#1e293b">{p.FirstName}</text>
                  <text x={x} y={y + 25} textAnchor="middle" fontSize="9" fill={pLevel.color}>{p.RiskPct}% Risk</text>
                </g>
              );
            })}
          </svg>
          <style>{`@keyframes pulse { 0% { r: 30; opacity: 0.4; } 100% { r: 80; opacity: 0; } } .pulse-anim { animation: pulse 2s infinite; }`}</style>
        </Card>
      )}

      {/* ── TAB 4: BULK RANKING & HEATMAP ── */}
      {activeTab === "bulk" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          
          {/* Risk Heatmap Matrix */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", padding: 20, borderRadius: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#dc2626", textTransform: "uppercase", marginBottom: 4 }}>High Flight Risk (Let Go)</div>
              <div style={{ fontSize: 12, color: "#7f1d1d", marginBottom: 12 }}>Critical risk + Low Satisfaction. Prepare replacements.</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#ef4444" }}>{computed.filter(c => c.RiskPct >= 75 && c.JobSatisfaction <= 3).length} <span style={{ fontSize: 12, fontWeight: 600 }}>Employees</span></div>
            </div>
            <div style={{ background: "#fffbeb", border: "1px solid #fde68a", padding: 20, borderRadius: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#d97706", textTransform: "uppercase", marginBottom: 4 }}>Saveable (Intervene Now)</div>
              <div style={{ fontSize: 12, color: "#92400e", marginBottom: 12 }}>High risk but Satisfaction > 3. Fix salary/overtime immediately.</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#f59e0b" }}>{computed.filter(c => c.RiskPct >= 50 && c.JobSatisfaction > 3).length} <span style={{ fontSize: 12, fontWeight: 600 }}>Employees</span></div>
            </div>
            <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", padding: 20, borderRadius: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#2563eb", textTransform: "uppercase", marginBottom: 4 }}>Stable (Monitor)</div>
              <div style={{ fontSize: 12, color: "#1e3a8a", marginBottom: 12 }}>Low to moderate risk. Keep them engaged.</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#3b82f6" }}>{computed.filter(c => c.RiskPct < 50).length} <span style={{ fontSize: 12, fontWeight: 600 }}>Employees</span></div>
            </div>
          </div>

          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <Title>📋 Organizational Risk Ranking</Title>
                <div style={{ fontSize: 12, color: "#64748b" }}>Top employees at highest flight risk across the organization.</div>
              </div>
              <button onClick={handleExportPIP} style={{ padding: "10px 16px", background: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 12, fontWeight: 700, color: "#0f172a", cursor: "pointer" }}>
                ⬇️ Export High-Risk PIP List (CSV)
              </button>
            </div>
            
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
                  {computed.sort((a,b) => b.RiskPct - a.RiskPct).slice(0, 15).map((emp, i) => (
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
        </div>
      )}

    </div>
  );
}
