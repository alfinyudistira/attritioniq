import { useContext, useState, useEffect, useMemo, useCallback, useRef } from "react";
import { AppProvider, AppContext, useCurrency, useDataSession } from "./context/AppContext";
import { GlobalProvider, useGlobal, useWindowSize } from "./context/GlobalContext";
import { ModuleDataProvider } from "./context/ModuleDataContext";
import CompanySetup from "./components/CompanySetup";
import DataUpload from "./components/DataUpload";
import M1Dashboard from "./modules/M1Dashboard";
import M2RiskScorer from "./modules/M2RiskScorer";
import M3Salary from "./modules/M3Salary";
import M4DeptHealth from "./modules/M4DeptHealth";
import M5ExitAnalyzer from "./modules/M5ExitAnalyzer";
import M6ROI from "./modules/M6ROI";
import M7FatigueRadar from "./modules/M7FatigueRadar";
import M8TalentMatch from "./modules/M8TalentMatch";
import M9PulseSurvey from "./modules/M9PulseSurvey";
import { QUESTION_BANK, surveyEngine, createUserContext } from "./utils/questionBank";
import ErrorBoundary from "./components/ErrorBoundary";

const MODULES = [
  { id: "m1", label: "Attrition Dashboard",   icon: "📊", short: "M1", live: true },
  { id: "m2", label: "Predictive Risk Scorer", icon: "🎯", short: "M2", live: true },
  { id: "m3", label: "Salary Benchmarking",    icon: "💰", short: "M3", live: true },
  { id: "m4", label: "Dept Health Monitor",    icon: "🏥", short: "M4", live: true },
  { id: "m5", label: "Exit Interview Analyzer",icon: "🚪", short: "M5", live: true },
  { id: "m6", label: "Retention ROI Calc",     icon: "📈", short: "M6", live: true },
  { id: "m7", label: "Shift & Fatigue Radar",  icon: "😴", short: "M7", live: true },
  { id: "m8", label: "Talent Matchmaker",      icon: "🔗", short: "M8", live: true },
  { id: "m9", label: "Micro-Pulse Survey",     icon: "💬", short: "M9", live: true },
];

function AppShell() {
  const {
    company, setCompany, data, computed,
    resetWorkspace, appConfig, updateConfig,
    notifications, isSampleData,
  } = useContext(AppContext);
  const { fmt } = useCurrency();
  const { dataSessionId } = useDataSession();
  const { syncCurrency, updateSettings, settings, isDark, toggleTheme } = useGlobal();

  const [active, setActive]           = useState("m1");
  const [sidebarOpen, setSidebarOpen] = useState(() => settings.sidebarOpen ?? true);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);


  const { isMobile } = useWindowSize();
useEffect(() => {
  if (isMobile) setSidebarOpen(false);
}, [isMobile]);

  useEffect(() => {
  if (company?.currency) syncCurrency(company.currency, company.name);
}, [company?.currency, company?.name, syncCurrency]);

  useEffect(() => {
    updateSettings({ sidebarOpen });
  }, [sidebarOpen, updateSettings]);

  const insight = useMemo(() => {
    if (!computed || computed.length === 0) return null;
    const total    = computed.length;
    const highRisk = computed.filter(d => d.RiskLevel === "High").length;
    const riskRate = (highRisk / total) * 100;
    const thr = appConfig?.thresholds || { high: 30, medium: 15 };
    const clr = appConfig?.colors    || { high: "#ef4444", medium: "#eab308", low: "#22c55e" };
    let status = "Stable";
    let color  = clr.low;
    if (riskRate >= thr.high)        { status = "Critical Risk"; color = clr.high;   }
    else if (riskRate >= thr.medium) { status = "Medium Risk";   color = clr.medium; }
    return { total, highRisk, riskRate, status, color };
  }, [computed, appConfig]);

  const prevDataLengthRef = useRef(0);
useEffect(() => {
  if (data.length > 0 && prevDataLengthRef.current === 0) {
    setActive("m1");
  }
  prevDataLengthRef.current = data.length;
}, [data.length]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") {
        setShowConfigModal(false);
        setShowResetConfirm(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleReset = useCallback(() => {
    resetWorkspace();
    setShowResetConfirm(false);
    setActive("m1");
  }, [resetWorkspace]);

  const [surveyHash, setSurveyHash] = useState(() => {
    const hash = window.location.hash;
    return hash.startsWith("#survey") ? hash : null;
  });

  if (surveyHash) {
    const params = new URLSearchParams(surveyHash.replace("#survey?", ""));
    const dept = params.get("dept") || "General";
    const questionIds = (params.get("q") || "").split(",").filter(Boolean);
    const isAnon = params.get("anon") === "1";
    const coName = params.get("co") || "Company";

    const questions = QUESTION_BANK.filter(q => questionIds.includes(q.id));
    
    return (
      <StandaloneSurvey 
        dept={dept} 
        questions={questions} 
        anonymous={isAnon} 
        companyName={coName}
        onClose={() => {
          window.location.hash = "";
          setSurveyHash(null);
        }}
      />
    );
  }

  if (!company) return <CompanySetup onSave={setCompany} />;

  const mod = MODULES.find(m => m.id === active);
  const companyInitial = company.name?.charAt(0)?.toUpperCase() || "?";
  return (
<div style={{ 
  display: "flex", minHeight: "100vh", 
  background: isDark ? "#0f172a" : "#f8fafc", 
  fontFamily: "'DM Sans','Segoe UI',sans-serif" 
}}>
      
{/* ── Notification Toasts ── */}
      <div style={{
        position: "fixed", bottom: 24, right: 24,
        zIndex: 9999, display: "flex", flexDirection: "column", gap: 8,
        pointerEvents: "none",
      }}>
        {notifications.map(n => (
  <div key={n.id} style={{
    background:
      n.type === "error"   ? "#fef2f2" :
      n.type === "success" ? "#f0fdf4" :
      n.type === "warning" ? "#fffbeb" : "#f8fafc",
    border: `1.5px solid ${
      n.type === "error"   ? "#fecaca" :
      n.type === "success" ? "#bbf7d0" :
      n.type === "warning" ? "#fde68a" : "#e2e8f0"
    }`,
    color:
      n.type === "error"   ? "#dc2626" :
      n.type === "success" ? "#16a34a" :
      n.type === "warning" ? "#b45309" : "#475569",
    borderRadius: 12, padding: "10px 16px",
    fontSize: 13, fontWeight: 600,
    boxShadow: "0 4px 20px rgba(15,23,42,0.12)",
    animation: "slideIn 0.25s ease",
    maxWidth: 320,
    display: "flex", alignItems: "flex-start", gap: 8,
  }}>
    <span style={{ flexShrink: 0, fontSize: 15 }}>
      {n.type === "success" ? "✅" :
       n.type === "error"   ? "❌" :
       n.type === "warning" ? "⚠️" : "ℹ️"}
    </span>
    <span style={{ lineHeight: 1.5 }}>{n.msg}</span>
  </div>
))}
      </div>
      
      {/* ── Reset Confirm Modal ── */}
      {showResetConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Confirm workspace reset"
          onClick={() => setShowResetConfirm(false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)",
            backdropFilter: "blur(6px)", display: "flex", alignItems: "center",
            justifyContent: "center", zIndex: 2000, padding: 16,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: 18, padding: "32px 36px", maxWidth: 380, width: "100%", boxShadow: "0 24px 60px rgba(15,23,42,0.2)" }}
          >
            <div style={{ fontSize: 32, textAlign: "center", marginBottom: 12 }}>⚠️</div>
            <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 18, fontWeight: 700, color: "#0f172a", textAlign: "center", marginBottom: 8 }}>
              Change Workspace?
            </div>
            <div style={{ fontSize: 13, color: "#64748b", textAlign: "center", lineHeight: 1.6, marginBottom: 24 }}>
              This will clear your current company settings and all loaded data. You'll return to the setup screen.
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowResetConfirm(false)}
                style={{ flex: 1, padding: "11px", borderRadius: 10, border: "1.5px solid #e2e8f0", background: "#f8fafc", color: "#475569", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>
                Cancel
              </button>
              <button onClick={handleReset}
                style={{ flex: 1, padding: "11px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#ef4444,#dc2626)", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>
                Yes, Reset
              </button>
            </div>
          </div>
        </div>
      )}

{/* ── Config Modal ── */}
      {showConfigModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Risk Configuration"
          onClick={() => setShowConfigModal(false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(15,23,42,0.6)",
            backdropFilter: "blur(6px)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, padding: 16,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: 18, padding: "28px 32px", maxWidth: 420, width: "100%", boxShadow: "0 24px 60px rgba(15,23,42,0.2)" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 18, fontWeight: 700 }}>⚙️ Risk Configuration</div>
              <button
                onClick={() => setShowConfigModal(false)}
                aria-label="Close configuration"
                style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", lineHeight: 1 }}
              >✕</button>
            </div>

            {/* High Risk Threshold */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>
                High Risk Threshold (%) — currently {appConfig.thresholds.high}%
              </label>
              <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 6, marginTop: 2 }}>
                Employees with risk score at or above this % are flagged High Risk across all modules.
              </div>
              <input
                type="number"
                min={1} max={99}
                value={appConfig.thresholds.high}
                onChange={e => updateConfig({ thresholds: { high: Number(e.target.value) } })}
                style={{ width: "100%", padding: "8px 12px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 13, boxSizing: "border-box" }}
              />
            </div>

            {/* Medium Risk Threshold */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>
                Medium Risk Threshold (%) — currently {appConfig.thresholds.medium}%
              </label>
              <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 6, marginTop: 2 }}>
                Employees between this and the High threshold are flagged Medium Risk.
              </div>
              <input
                type="number"
                min={1} max={99}
                value={appConfig.thresholds.medium}
                onChange={e => updateConfig({ thresholds: { medium: Number(e.target.value) } })}
                style={{ width: "100%", padding: "8px 12px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 13, boxSizing: "border-box" }}
              />
            </div>

            {/* Risk Colors */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>Risk Level Colors</label>
              <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 6, marginTop: 2 }}>
                Applied to all charts, badges, and indicators across every module.
              </div>
              <div style={{ display: "flex", gap: 16, marginTop: 6 }}>
                {["high", "medium", "low"].map(level => (
                  <div key={level} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: "capitalize", color: "#475569" }}>{level}</div>
                    <input
                      type="color"
                      value={appConfig.colors[level]}
                      onChange={e => updateConfig({ colors: { [level]: e.target.value } })}
                      style={{ width: 44, height: 44, borderRadius: 10, border: "1.5px solid #e2e8f0", cursor: "pointer", padding: 2 }}
                    />
                    <div style={{ fontSize: 9, color: "#94a3b8" }}>{appConfig.colors[level]}</div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => updateConfig({
                thresholds: { high: 30, medium: 15 },
                colors: { high: "#ef4444", medium: "#eab308", low: "#22c55e" },
              })}
              style={{ width: "100%", padding: "10px", background: "#f1f5f9", border: "none", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer", marginTop: 4 }}
            >
              ↺ Reset to Defaults
            </button>
          </div>
        </div>
      )}

      {/* ── Sidebar ── */}
      <aside style={{
        width: sidebarOpen ? 232 : 56, minWidth: sidebarOpen ? 232 : 56,
        background: "#0f172a", transition: "width 0.22s",
        display: "flex", flexDirection: "column",
        position: "sticky", top: 0, height: "100vh",
        overflowY: "auto", overflowX: "hidden", zIndex: 100,
        flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{ padding: sidebarOpen ? "22px 18px 18px" : "22px 10px 18px", borderBottom: "1px solid #1e293b" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, background: "linear-gradient(135deg,#f59e0b,#ef4444)", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 17 }}>⚡</div>
            {sidebarOpen && (
              <div>
                <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 15, fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>AttritionIQ</div>
                <div style={{ fontSize: 9, color: "#475569" }}>by Pulse Digital</div>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <div style={{ marginTop: 12, background: "#1e293b", borderRadius: 9, padding: "7px 11px" }}>
              <div style={{ fontSize: 9, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em" }}>Workspace</div>
              <div style={{ fontSize: 12, color: "#f1f5f9", fontWeight: 600, marginTop: 1 }}>{company.name}</div>
              <div style={{ fontSize: 10, color: "#64748b" }}>{company.industry} · {company.currency}</div>
              {/* ── Change Company Button ── */}
              <button onClick={() => setShowResetConfirm(true)}
                style={{ marginTop: 8, width: "100%", padding: "5px 8px", borderRadius: 6, border: "1px solid #334155", background: "transparent", color: "#64748b", fontSize: 10, cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}
                onMouseEnter={e => { e.target.style.color = "#f59e0b"; e.target.style.borderColor = "#f59e0b44"; }}
                onMouseLeave={e => { e.target.style.color = "#64748b"; e.target.style.borderColor = "#334155"; }}
              >
                ↩ Change Company
              </button>
            </div>
          )}
        </div>

        {/* Data status */}
        {sidebarOpen && (
          <div style={{ padding: "10px 16px", borderBottom: "1px solid #1e293b" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: insight?.color || "#475569", flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: data.length > 0 ? "#22c55e" : "#475569" }}>
                {insight
  ? `${insight.total} employees synced · ${insight.status}`
  : "No data loaded"}
              </span>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav style={{ flex: 1, padding: "10px 8px" }}>
                    {MODULES.map(m => {
            const isActive   = active === m.id;
            const isDisabled = !data.length && m.id !== "m1";
            return (
              <button
                key={m.id}
                onClick={() => !isDisabled && setActive(m.id)}
                disabled={isDisabled}
                aria-current={isActive ? "page" : undefined}
                title={isDisabled ? `${m.label} — Upload data first` : m.label}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 9,
                  padding: "9px 10px", borderRadius: 9, border: "none",
                  cursor: isDisabled ? "not-allowed" : "pointer", marginBottom: 1,
                  background: isActive ? "rgba(245,158,11,0.12)" : "transparent",
                  color: isActive ? "#f59e0b" : isDisabled ? "#334155" : "#64748b",
                  textAlign: "left", transition: "all 0.15s ease",
                  borderLeft: isActive ? "3px solid #f59e0b" : "3px solid transparent",
                  opacity: isDisabled ? 0.35 : 1,
                  pointerEvents: isDisabled ? "none" : "auto",
                }}
              >
                <span style={{ fontSize: 15, flexShrink: 0 }}>{m.icon}</span>
                {sidebarOpen && (
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: isActive ? 700 : 500, lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.label}</div>
                    <div style={{ fontSize: 9, opacity: 0.4, marginTop: 1, display: "flex", alignItems: "center", gap: 4 }}>
                      {m.short}
                      {m.live && <span style={{ background: "#22c55e", color: "#fff", borderRadius: 4, padding: "0px 4px", fontSize: 8, fontWeight: 700 }}>LIVE</span>}
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Theme toggle + Collapse */}
<div style={{ padding: "10px 8px", borderTop: "1px solid #1e293b", display: "flex", flexDirection: "column", gap: 6 }}>
  <button
    onClick={toggleTheme}
    title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
    style={{
      width: "100%", padding: "7px", borderRadius: 8,
      border: "1px solid #1e293b", background: "transparent",
      color: "#475569", cursor: "pointer", fontSize: 13,
      display: "flex", alignItems: "center",
      justifyContent: sidebarOpen ? "flex-start" : "center",
      gap: 8,
    }}
  >
    <span style={{ fontSize: 15 }}>{isDark ? "☀️" : "🌙"}</span>
    {sidebarOpen && (
      <span style={{ fontSize: 11, color: "#64748b" }}>
        {isDark ? "Light Mode" : "Dark Mode"}
      </span>
    )}
  </button>

  <button
    onClick={() => setSidebarOpen(p => !p)}
    style={{
      width: "100%", padding: "7px", borderRadius: 8,
      border: "1px solid #1e293b", background: "transparent",
      color: "#475569", cursor: "pointer", fontSize: 13,
    }}
  >
    {sidebarOpen ? "◀ Collapse" : "▶"}
  </button>
</div>
      </aside>

      {/* ── Main ── */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Topbar */}
        <div style={{ background: "#fff", borderBottom: "1.5px solid #f1f5f9", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
          <div>
            <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 18, fontWeight: 700, color: "#0f172a" }}>
              {mod?.icon} {mod?.label}
            </div>
            <div style={{ fontSize: 11, marginTop: 1, color: insight?.color || "#94a3b8" }}>
              {data.length > 0 && insight
                ? `${insight.total} employees · ${company.name} · ${insight.highRisk} high risk (${insight.riskRate.toFixed(0)}%)${company.salaryCliff ? ` · cliff ${fmt(company.salaryCliff, true)}` : ""}`
                : "No data — upload CSV or use sample data"}
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            {data.length > 0 && insight && (
              <div style={{
                background: insight.color + "22",
                border: `1px solid ${insight.color}55`,
                borderRadius: 20,
                padding: "4px 11px",
                fontSize: 10,
                color: insight.color,
                fontWeight: 700,
                whiteSpace: "nowrap"
              }}>
                {insight.status} · {insight.highRisk} High Risk
              </div>
            )}
            
            {isSampleData && (
              <div style={{
                background: "#fffbeb", border: "1px solid #fde68a",
                borderRadius: 20, padding: "3px 10px",
                fontSize: 10, color: "#92400e", fontWeight: 700,
                whiteSpace: "nowrap",
              }}>
                📋 Sample Data
              </div>
            )}

            <button 
              onClick={() => setShowConfigModal(true)}
              style={{ background: "#f1f5f9", border: "none", borderRadius: 20, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 18, flexShrink: 0 }}
              title="Settings"
            >
              ⚙️
            </button>

            <div
              title={`${company.name} · ${company.industry || ""} · ${company.currency || "USD"}`}
              style={{ width: 34, height: 34, background: "linear-gradient(135deg,#f59e0b,#ef4444)", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "default", flexShrink: 0 }}
            >
              {companyInitial}
            </div>
          </div>
        </div>


                {/* Content */}
        <div style={{ flex: 1, padding: "22px 24px", overflowY: "auto" }}>
          
          <ErrorBoundary>
            <DataUpload />
          </ErrorBoundary>

                    <ErrorBoundary key={active}>
            {/* Animasi Transisi Modul SaaS */}
            <div key={active} className="module-fade-in">
              {active === "m1" ? <M1Dashboard />
                : active === "m2" ? <M2RiskScorer />
                : active === "m3" ? <M3Salary />
                : active === "m4" ? <M4DeptHealth />
                : active === "m5" ? <M5ExitAnalyzer />
                : active === "m6" ? <M6ROI />
                : active === "m7" ? <M7FatigueRadar />
                : active === "m8" ? <M8TalentMatch />
                : active === "m9" ? <M9PulseSurvey />
                : null}
            </div>
          </ErrorBoundary>          
        </div>
      </main>
    </div>
  );
}

// ── 2. UI STANDALONE SURVEY (PREMIUM SAAS GRADE) ──
function StandaloneSurvey({ dept, questions, anonymous, companyName, onClose }) {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Menghitung progress pengisian survei
  const answeredCount = Object.keys(answers).length;
  const progressPct = Math.round((answeredCount / questions.length) * 100);
  const isComplete = answeredCount === questions.length;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const formattedAnswers = questions.map(q => ({
      questionId: q.id,
      type: q.type,
      category: q.category,
      value: q.type === "scale" ? (answers[q.id] || 5) : undefined,
      text: q.type === "text" ? (answers[q.id] || "") : undefined,
    }));

    const context = createUserContext({ 
      userId: anonymous ? null : (name || "Employee"), 
      team: dept, 
      anonymous 
    });

    // Submit ke Mesin Analitik
    await surveyEngine.submit(formattedAnswers, context, true);
    
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 800);
  };

  // TAMPILAN SUCCESS (SETELAH SUBMIT)
  if (submitted) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", padding: 20 }}>
      <div style={{ textAlign: "center", padding: "50px 40px", background: "#fff", borderRadius: 24, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.1)", maxWidth: 440, width: "100%", animation: "slideIn 0.5s ease" }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>🎉</div>
        <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 28, fontWeight: 800, color: "#0f172a", marginBottom: 12 }}>You're all set!</div>
        <div style={{ fontSize: 15, color: "#64748b", marginBottom: 32, lineHeight: 1.6 }}>
          Thank you for sharing your voice. Your feedback goes directly into our Hiring Intelligence engine to build a better workplace.
        </div>
        <button onClick={onClose} style={{ width: "100%", padding: "16px", borderRadius: 14, border: "none", background: "#0f172a", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", transition: "transform 0.2s" }}>
          Close Page
        </button>
      </div>
    </div>
  );

  // TAMPILAN FORM SURVEI
  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", padding: "0 0 60px 0", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      
      {/* Top Navigation & Progress Bar */}
      <div style={{ background: "#fff", position: "sticky", top: 0, zIndex: 50, borderBottom: "1px solid #f1f5f9", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontWeight: 800, fontSize: 16, color: "#0f172a", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ background: "linear-gradient(135deg, #f59e0b, #ef4444)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>⚡</span>
          Pulse Check
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>{progressPct}%</div>
          <div style={{ width: 100, height: 6, background: "#f1f5f9", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ width: `${progressPct}%`, height: "100%", background: progressPct === 100 ? "#22c55e" : "#f59e0b", transition: "width 0.4s ease" }} />
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: "0 auto", padding: "40px 20px" }}>
        
        {/* Header Section */}
        <div style={{ marginBottom: 40, textAlign: "center" }}>
          <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 32, fontWeight: 800, color: "#0f172a", marginBottom: 10 }}>
            {companyName}
          </div>
          <div style={{ fontSize: 15, color: "#64748b", fontWeight: 500 }}>
            {dept} Department • Takes ~2 mins
          </div>
          {anonymous && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#f0fdf4", color: "#16a34a", padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 700, marginTop: 16, border: "1px solid #bbf7d0" }}>
              🔒 100% Anonymous Mode
            </div>
          )}
        </div>

        {/* Input Nama (Jika tidak anonim) */}
        {!anonymous && (
          <div style={{ background: "#fff", borderRadius: 16, padding: "24px", marginBottom: 24, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9" }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>Your Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Type your full name here..." style={{ width: "100%", padding: "16px", borderRadius: 12, border: "1.5px solid #e2e8f0", fontSize: 15, boxSizing: "border-box", outline: "none", transition: "border 0.2s" }} onFocus={e => e.target.style.borderColor = "#f59e0b"} onBlur={e => e.target.style.borderColor = "#e2e8f0"} />
          </div>
        )}

        {/* List Pertanyaan (SaaS Grade) */}
        {questions.map((q, idx) => {
          const isAnswered = answers[q.id] !== undefined;
          return (
            <div key={q.id} style={{ background: "#fff", borderRadius: 20, padding: "32px 28px", marginBottom: 24, boxShadow: isAnswered ? "none" : "0 10px 25px -5px rgba(0,0,0,0.05)", border: isAnswered ? "1px solid #e2e8f0" : "1.5px solid #f59e0b", transition: "all 0.3s ease", opacity: isAnswered ? 0.7 : 1 }}>
              <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0, border: "1px solid #f1f5f9" }}>
                  {q.icon}
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#f59e0b", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
                    Q{idx + 1} • {q.category}
                  </div>
                  <div style={{ fontSize: 18, color: "#0f172a", fontWeight: 700, lineHeight: 1.4 }}>
                    {q.text}
                  </div>
                </div>
              </div>

              {/* Segmented Control 1-10 (Pengganti Slider) */}
              {q.type === "scale" ? (
                <div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "space-between" }}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => {
                      const selected = answers[q.id] === num;
                      // Gradasi warna: Merah (1-3), Kuning (4-7), Hijau (8-10)
                      let activeBg = "#0f172a";
                      if (num <= 3) activeBg = "#ef4444";
                      else if (num >= 8) activeBg = "#22c55e";

                      return (
                        <button
                          key={num}
                          onClick={() => setAnswers(p => ({ ...p, [q.id]: num }))}
                          style={{
                            flex: 1, minWidth: "30px", padding: "12px 0", borderRadius: 10,
                            border: selected ? `2px solid ${activeBg}` : "1.5px solid #e2e8f0",
                            background: selected ? `${activeBg}11` : "#fff",
                            color: selected ? activeBg : "#64748b",
                            fontSize: 15, fontWeight: 800, cursor: "pointer",
                            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                            transform: selected ? "scale(1.05)" : "scale(1)"
                          }}
                        >
                          {num}
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#94a3b8", marginTop: 12, fontWeight: 600 }}>
                    <span>Not at all</span>
                    <span>Absolutely</span>
                  </div>
                </div>
              ) : (
                <textarea rows={4} placeholder="Type your thoughts here..." value={answers[q.id] || ""} onChange={e => setAnswers(p => ({ ...p, [q.id]: e.target.value }))} style={{ width: "100%", padding: "16px", borderRadius: 12, border: "1.5px solid #e2e8f0", fontSize: 15, resize: "vertical", boxSizing: "border-box", fontFamily: "inherit", outline: "none" }} onFocus={e => e.target.style.borderColor = "#f59e0b"} onBlur={e => e.target.style.borderColor = "#e2e8f0"} />
              )}
            </div>
          );
        })}

        {/* Action Button */}
        <div style={{ marginTop: 32 }}>
          <button onClick={handleSubmit} disabled={isSubmitting || !isComplete} style={{ width: "100%", padding: "20px", background: isComplete ? "linear-gradient(135deg, #f59e0b, #ef4444)" : "#e2e8f0", color: isComplete ? "#fff" : "#94a3b8", border: "none", borderRadius: 16, fontSize: 16, fontWeight: 800, cursor: isComplete ? "pointer" : "not-allowed", transition: "all 0.3s ease", boxShadow: isComplete ? "0 10px 25px -5px rgba(245,158,11,0.4)" : "none" }}>
            {isSubmitting ? "Processing Data..." : isComplete ? "Submit Pulse Survey" : "Please answer all questions"}
          </button>
        </div>

      </div>
    </div>
  );
}

function AppBridge({ children }) {
  const { dataSessionId } = useDataSession();
  const safeSessionId = dataSessionId || "default_session";

  return (
    <ModuleDataProvider dataSessionId={safeSessionId}>
      {children}
    </ModuleDataProvider>
  );
}

export default function App() {
  return (
    <GlobalProvider>
      <AppProvider>
        <AppBridge>
          <AppShell />
        </AppBridge>
      </AppProvider>
    </GlobalProvider>
  );
}
