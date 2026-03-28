import { useContext, useState, useEffect, useMemo, useCallback } from "react";
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
import ComingSoon from "./modules/ComingSoon";
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

const MODULE_DETAILS = {
  m2: { title: "Predictive Risk Scorer",     icon: "🎯", desc: "Input any employee's details and get an AI-powered flight risk score from 0–100% with factor breakdown.", features: ["Risk Gauge 0-100%","Factor Breakdown","Gen Z Warning","Bulk CSV Score","AI Explanation"] },
  m3: { title: "Salary Benchmarking Studio", icon: "💰", desc: "Detect your company's salary cliff threshold, visualize danger zones, and simulate salary adjustments.", features: ["Cliff Detector","Danger Zone Map","Adjustment Simulator","Budget Impact","Market Compare"] },
  m4: { title: "Department Health Monitor",  icon: "🏥", desc: "Traffic-light scorecards per department with Survivor Burnout Alert and Human Buffer Metric.", features: ["Traffic Light System","🚨 Survivor Burnout Alert","Human Buffer Metric","Dept Comparison","Trend Tracking"] },
  m5: { title: "Exit Interview Analyzer",    icon: "🚪", desc: "Paste exit interview notes — AI categorizes reasons, detects patterns, generates word cloud.", features: ["AI Categorization","Pattern Detector","Keyword Cloud","Sentiment Score","Export Summary"] },
  m6: { title: "Retention ROI Calculator",   icon: "📈", desc: "Simulate interventions with sliders, get ROI timeline, ghost cost toggle, and auto Gantt Action Plan.", features: ["3 Intervention Sliders","ROI Timeline","Ghost Cost Toggle","AI Executive Summary","90-Day Gantt Chart"] },
  m7: { title: "Shift & Fatigue Radar",      icon: "😴", desc: "Analyze shift patterns, calculate Fatigue Index, simulate schedule changes to predict burnout.", features: ["Fatigue Index Score","Schedule Optimizer","Burnout Predictor","AI Insight","Team Radar"] },
  m8: { title: "Internal Talent Matchmaker", icon: "🔗", desc: "Build skill matrices for at-risk employees — AI scans other departments for match opportunities.", features: ["Skill Matrix","AI Matchmaker","Mobility Radar Chart","Match % Score","Transfer Recommendation"] },
  m9: { title: "Micro-Pulse Survey Engine",  icon: "💬", desc: "Generate weekly survey links — real-time sentiment stream updates satisfaction scores live.", features: ["Survey Generator","Real-time Stream","Word Cloud D3","Sentiment Scoring","Auto Update M1"] },
};

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

    // ── Auto-Collapse Sidebar di Layar HP/Mobile
  const { isMobile, isTablet } = useWindowSize();

useEffect(() => {
  if (isMobile) setSidebarOpen(false);
}, [isMobile]);

  // ── Keep GlobalContext currency in sync with company currency ──
  useEffect(() => {
    if (company?.currency) syncCurrency(company.currency);
  }, [company?.currency, syncCurrency]);

  // ── Persist sidebar state to GlobalContext settings ──
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

  // ── Switch to M1 only when data first appears from empty state ──
  // Does NOT interrupt user if they're already navigating other modules
  const prevDataLengthRef = useRef(0);
useEffect(() => {
  if (data.length > 0 && prevDataLengthRef.current === 0) {
    setActive("m1");
  }
  prevDataLengthRef.current = data.length;
}, [data.length]);

  // ── Keyboard shortcuts ──
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

  if (!company) return <CompanySetup onSave={setCompany} />;

  // Derived — safe to compute after early return
  const mod = MODULES.find(m => m.id === active);
  const det = MODULE_DETAILS[active];
  const companyInitial = company.name?.charAt(0)?.toUpperCase() || "?";
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8fafc", fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>

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
                : det ? <ComingSoon icon={det.icon} title={det.title} desc={det.desc} features={det.features} />
                : null}
            </div>
          </ErrorBoundary>          
        </div>
      </main>
    </div>
  );
}

// ── AppBridge — reads AppContext values that child Providers need as props ──
// Must sit INSIDE AppProvider but OUTSIDE the Providers that need the values.
function AppBridge({ children }) {
  const { dataSessionId } = useDataSession();

  // Guard: pastikan dataSessionId selalu string valid
  // Kalau undefined/null sampai ke ModuleDataProvider,
  // semua session check di ModuleDataContext akan skip
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
