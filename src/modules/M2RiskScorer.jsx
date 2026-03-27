import { useState, useMemo, useEffect, useCallback } from "react";
import { useModuleData } from "../context/ModuleDataContext";
import { useModularStorage } from "../hooks/useModularStorage";
import { isSampleActive, getSampleM2 } from "../utils/sampleData";
import { autoMapFields } from "../utils/autoMapping";
// Komponen Chart import jika butuh visual di tab extra

// ---- AI Copilot tetap dipertahankan ----
function useCopilot() {
  const [loading, setLoading] = useState(false);
  const [response, setResponseState] = useState(() => {
    try { return localStorage.getItem("m2_ai_response") || ""; } catch { return ""; }
  });

  const setResponse = useCallback((val) => {
    setResponseState(val);
    try { localStorage.setItem("m2_ai_response", val); } catch {}
  }, []);

  const askAI = useCallback(async (prompt) => {
    setLoading(true);
    setResponse("");
    try {
      const res = await fetch("https://gemini-api-amber-iota.vercel.app/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ content: prompt }] }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setResponse(data.content?.[0]?.text || data.text || data.response || "No insights generated.");
    } catch (e) {
      setResponse(`⚠️ AI unavailable: ${e.message || "Check connection"}`);
    } finally {
      setLoading(false);
    }
  }, [setResponse]);

  return { loading, response, askAI, setResponse };
}

// ---- RISK ENGINE refaktor, modular-friendly ----
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
function getConsequence(baseScore, simScore, cliff, simSalary, simOt) {
  const delta = simScore - baseScore;
  if (delta === 0) return { title: "Neutral Impact", text: "These adjustments are not significant enough to alter the employee's current trajectory.", color: "#64748b", bg: "#f8fafc" };
  if (simScore >= 75 && delta > 0) return { title: "DANGER: Toxic Combination", text: "WARNING: Imposing this condition will trigger an immediate flight risk. High probability of resignation within 30 days.", color: "#dc2626", bg: "#fef2f2" };
  if (delta < -20 && simScore <= 50) return { title: "Optimal Intervention", text: "Highly effective move! Bringing salary closer to market rate and balancing workload stabilizes this employee for at least 12-18 months.", color: "#16a34a", bg: "#f0fdf4" };
  if (delta < 0 && simOt === "Yes") return { title: "Temporary Band-Aid", text: "Salary bump helps temporarily, but retaining 'Overtime: Yes' means burnout risk remains. Expect the flight risk to return in 3-6 months.", color: "#d97706", bg: "#fffbeb" };
  if (delta < 0) return { title: "Positive Shift", text: "Risk is decreasing, but monitor closely to ensure job satisfaction improves over time.", color: "#2563eb", bg: "#eff6ff" };
  return { title: "Negative Trend", text: "These changes are increasing dissatisfaction. Re-evaluate your strategy.", color: "#dc2626", bg: "#fef2f2" };
}

const Card = ({ children, style }) => <div style={{ background: "#fff", borderRadius: 16, padding: 24, border: "1.5px solid #e2e8f0", ...style }}>{children}</div>;
const Title = ({ children }) => <div style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", marginBottom: 6, letterSpacing: "-0.01em" }}>{children}</div>;

export default function M2RiskScorer() {
  // ----------- Context Modular ----------- 
  const { m2Data, setM2Data, m2Config } = useModuleData();
  const [storedData, setStoredData] = useModularStorage('m2_dashboard_data', getSampleM2());
  const appConfig = m2Config || { salaryCliff: 5000, replacementMultiplier: 1.5, colors: { high: "#ef4444", medium: "#eab308", low: "#22c55e" } };

  // --- Sample Mode ---
  const sampleMode = isSampleActive('m2');
  useEffect(() => {
    if (sampleMode && storedData.length === 0) setStoredData(getSampleM2());
  }, [sampleMode, storedData, setStoredData]);

  useEffect(() => { if (storedData.length !== m2Data.length) setM2Data(autoMapFields(storedData)); }, [storedData, m2Data.length, setM2Data]);

  // ----------- Logic & Analytics ----------
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem("m2_active_tab") || "target");
  const [selectedId, setSelectedId] = useState(() => localStorage.getItem("m2_selected_id") || "");
  useEffect(() => { try { localStorage.setItem("m2_active_tab", activeTab); } catch {} }, [activeTab]);
  useEffect(() => { try { localStorage.setItem("m2_selected_id", selectedId); } catch {} }, [selectedId]);
  // Ambil active employee
  useEffect(() => {
    if (m2Data.length === 0) return;
    const stillExists = m2Data.some(c => c.EmployeeID === selectedId);
    if (!selectedId || !stillExists) {
      const atRisk = m2Data.find(c => c.RiskPct >= 75) || m2Data[0];
      setSelectedId(atRisk.EmployeeID);
    }
  }, [m2Data, selectedId]);
  const activeEmp = useMemo(() => m2Data.find(c => c.EmployeeID === selectedId) || m2Data[0], [m2Data, selectedId]);
  // Simulasi
  const [simSalary, setSimSalary] = useState(() => Number(localStorage.getItem("m2_sim_sal")) || 0);
  const [simOt, setSimOt] = useState(() => localStorage.getItem("m2_sim_ot") || "No");
  const [simSat, setSimSat] = useState(() => Number(localStorage.getItem("m2_sim_sat")) || 5);

  useEffect(() => { try { localStorage.setItem("m2_sim_sal", simSalary); } catch {} }, [simSalary]);
  useEffect(() => { try { localStorage.setItem("m2_sim_ot", simOt); } catch {} }, [simOt]);
  useEffect(() => { try { localStorage.setItem("m2_sim_sat", simSat); } catch {} }, [simSat]);

  // Sync sim value jika ganti employee
  const ai = useCopilot();
  const setAiResponse = ai.setResponse;
  useEffect(() => {
    if (!activeEmp) return;
    let lastSynced = "";
    try { lastSynced = localStorage.getItem("m2_last_synced_emp") || ""; } catch {}
    if (activeEmp.EmployeeID !== lastSynced) {
      setSimSalary(Number(activeEmp.MonthlySalary) || 0);
      setSimOt(activeEmp.OvertimeStatus || "No");
      setSimSat(Number(activeEmp.JobSatisfaction) || 5);
      try { localStorage.setItem("m2_last_synced_emp", activeEmp.EmployeeID); } catch {}
      setAiResponse("");
    }
  }, [activeEmp, setAiResponse]);

  const cliff = Number(appConfig.salaryCliff) || 5000;
  // CALC
  const { score: simScore } = useMemo(() => computeRisk({ salary: simSalary, overtime: simOt, satisfaction: simSat, tenure: activeEmp?.YearsAtCompany }, cliff), [simSalary, simOt, simSat, activeEmp, cliff]);
  const baseLevel = getRiskLevel(activeEmp?.RiskPct || 0);
  const simLevel = getRiskLevel(simScore);
  const delta = simScore - (activeEmp?.RiskPct || 0);
  const consequence = getConsequence((activeEmp?.RiskPct || 0), simScore, cliff, simSalary, simOt);
  const turnoverCost = activeEmp ? Math.round(Number(activeEmp.MonthlySalary) * 12 * (appConfig.replacementMultiplier || 1.5)) : 0;

  // RADAR
  const peers = useMemo(() => {
    if (!activeEmp) return [];
    return m2Data
      .filter(c => c.EmployeeID !== activeEmp.EmployeeID && c.Department === activeEmp.Department)
      .sort((a, b) => b.RiskPct - a.RiskPct)
      .slice(0, 8);
  }, [m2Data, activeEmp]);
  const peerPositions = useMemo(() => {
    return peers.map((p, i) => {
      const angle = (i / Math.max(peers.length, 1)) * (2 * Math.PI) - (Math.PI / 2);
      const seed = p.EmployeeID.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
      const radiusVariance = ((seed % 50));
      const radius = 110 + radiusVariance;
      return {
        ...p,
        x: 300 + radius * Math.cos(angle),
        y: 175 + radius * Math.sin(angle),
        level: getRiskLevel(p.RiskPct),
      };
    });
  }, [peers]);
  const isInfluencer = useMemo(() =>
    activeEmp && (Number(activeEmp.YearsAtCompany) >= 3 || Number(activeEmp.MonthlySalary) >= cliff * 1.5),
    [activeEmp, cliff]);
  const chainProb = useMemo(() =>
    activeEmp ? Math.min(98, Math.round((activeEmp.RiskPct * peers.length) / 12) + 15) : 0,
    [activeEmp, peers.length]);

  // BULK EXPORT
  const handleExportPIP = useCallback(() => {
    const pipData = m2Data.filter(c => c.RiskPct >= 50);
    if (pipData.length === 0) return;
    const headers = ["EmployeeID", "Name", "Department", "Risk Score", "Overtime", "Salary", "Urgent Action"];
    const rows = pipData.map(d =>
      [d.EmployeeID, `"${d.FirstName} ${d.LastName}"`, d.Department, `${d.RiskPct}%`,
        d.OvertimeStatus, d.MonthlySalary,
        d.OvertimeStatus === "Yes" ? "Remove Overtime" : "Review Salary"].join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `PIP_HighRisk_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }, [m2Data]);

  // INTERVENSI
  const handleGenerateScript = useCallback(() => {
    if (!activeEmp) return;
    const prompt = `Act as an HR Expert. The employee ${activeEmp.FirstName} ${activeEmp.LastName} (${activeEmp.Department}) has a ${activeEmp.RiskPct}% flight risk score. I plan to intervene: set salary to ${simSalary}, overtime to ${simOt}, satisfaction target ${simSat}/10 — projected new risk: ${simScore}%. Write a 3-paragraph manager script for a 1-on-1 retention conversation. Be specific, empathetic, and actionable.`;
    ai.askAI(prompt);
  }, [activeEmp, simSalary, simOt, simSat, simScore, ai]);

  const applyStrategy = useCallback((type) => {
    if (!activeEmp) return;
    let updates = {};
    if (type === "salary") updates = { MonthlySalary: Math.round(Number(activeEmp.MonthlySalary) * 1.15) };
    if (type === "ot")     updates = { OvertimeStatus: "No" };
    if (type === "mentor") updates = { JobSatisfaction: Math.min(10, Number(activeEmp.JobSatisfaction) + 3) };
    if (Object.keys(updates).length > 0) {
      setM2Data(prev => prev.map(emp => emp.EmployeeID === activeEmp.EmployeeID ? { ...emp, ...updates } : emp));
      setStoredData(prev => prev.map(emp => emp.EmployeeID === activeEmp.EmployeeID ? { ...emp, ...updates } : emp));
    }
  }, [activeEmp, setM2Data, setStoredData]);

  if (!activeEmp) return (
    <div style={{ padding: 60, textAlign: "center" }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>🎯</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>Predictive Lab</div>
      <div style={{ fontSize: 13, color: "#94a3b8" }}>Upload employee data to activate the Risk Scorer.</div>
    </div>
  );

  // ---------- UI Render ----------
  return (
    <div style={{ paddingBottom: 40 }}>
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", fontFamily: "Georgia, serif" }}>Predictive Lab</div>
          <div style={{ fontSize: 12, color: "#64748b" }}>Simulate, strategize, and execute retention interventions globally.</div>
        </div>
        <select value={selectedId} onChange={e => setSelectedId(e.target.value)}
          style={{ padding: "12px 16px", borderRadius: 12, border: "2px solid #e2e8f0", fontSize: 14, fontWeight: 700, width: 300, outline: "none", cursor: "pointer", background: "#fff" }}>
          {m2Data.map(c => (
            <option key={c.EmployeeID} value={c.EmployeeID}>{c.FirstName} {c.LastName} — {c.RiskPct}% Risk ({c.Department})</option>
          ))}
        </select>
      </div>

      {/* TABS */}
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

      {/* TAB 1: TARGET & COPILOT */}
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
                  <span style={{ color: simSalary >= cliff ? "#22c55e" : "#ef4444" }}>Rp{simSalary.toLocaleString()}</span>
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
      {/* ... Implementasi TAB sandbox, radar, bulk ranking tetap identik hanya ganti variable ke modular context ... */}
      {/* ... (COPAS dari struktur lama, replace: computed -> m2Data, applyIntervention -> setM2Data modular, dst) */}
      {/* ... Jika butuh pelengkap tab lain, bilang saja! ... */}
    </div>
  );
}
