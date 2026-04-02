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
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

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
    <div className={`flex min-h-screen font-body ${isDark ? "dark bg-brand-dark" : "bg-slate-50"}`}>
      
      {/* ── Notification Toasts ── */}
      <div className="toast-container fixed bottom-6 right-6 flex flex-col gap-2 pointer-events-none z-toast">
        {notifications.map(n => {
          const typeClasses = {
            error: "bg-red-50 border-red-200 text-red-600",
            success: "bg-green-50 border-green-200 text-green-600",
            warning: "bg-amber-50 border-amber-200 text-amber-700",
            default: "bg-slate-50 border-slate-200 text-slate-600"
          };
          const activeClass = typeClasses[n.type] || typeClasses.default;
          
          return (
            <div key={n.id} className={`flex items-start gap-2 p-[10px_16px] rounded-xl text-[13px] font-semibold shadow-[0_4px_20px_rgba(15,23,42,0.12)] animate-[slideIn_0.25s_ease] max-w-[320px] border-[1.5px] ${activeClass}`}>
              <span className="shrink-0 text-[15px]">
                {n.type === "success" ? "✅" : n.type === "error" ? "❌" : n.type === "warning" ? "⚠️" : "ℹ️"}
              </span>
              <span className="leading-relaxed">{n.msg}</span>
            </div>
          );
        })}
      </div>
      
      {/* ── Reset Confirm Modal ── */}
      {showResetConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Confirm workspace reset"
          onClick={() => setShowResetConfirm(false)}
          className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm flex items-center justify-center z-modal p-4"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="modal-sheet bg-white rounded-[18px] p-[28px_24px] max-w-[380px] w-full shadow-[0_24px_60px_rgba(15,23,42,0.2)]"
          >
            <div className="text-[32px] text-center mb-3">⚠️</div>
            <div className="font-display text-lg font-bold text-brand-dark text-center mb-2">
              Change Workspace?
            </div>
            <div className="text-[13px] text-slate-500 text-center leading-relaxed mb-6">
              This will clear your current company settings and all loaded data. You'll return to the setup screen.
            </div>
            <div className="flex gap-2.5">
              <button onClick={() => setShowResetConfirm(false)} className="flex-1 p-[11px] rounded-[10px] border-[1.5px] border-slate-200 bg-slate-50 text-slate-600 font-bold cursor-pointer text-[13px]">
                Cancel
              </button>
              <button onClick={handleReset} className="flex-1 p-[11px] rounded-[10px] border-none bg-gradient-to-br from-brand-red to-red-600 text-white font-bold cursor-pointer text-[13px]">
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
          className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm flex items-center justify-center z-modal p-4"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-[18px] p-[28px_32px] max-w-[420px] w-full shadow-[0_24px_60px_rgba(15,23,42,0.2)]"
          >
            <div className="flex justify-between items-center mb-4">
              <div className="font-display text-lg font-bold text-brand-dark">⚙️ Risk Configuration</div>
              <button onClick={() => setShowConfigModal(false)} className="bg-transparent border-none text-xl cursor-pointer leading-none text-brand-dark hover:text-brand-red">✕</button>
            </div>

            <div className="mb-5">
              <label className="text-xs font-semibold text-slate-700">
                High Risk Threshold (%) — currently {appConfig.thresholds.high}%
              </label>
              <div className="text-[10px] text-slate-400 mb-1.5 mt-0.5">
                Employees with risk score at or above this % are flagged High Risk.
              </div>
              <input
                type="number"
                min={1} max={99}
                value={appConfig.thresholds.high}
                onChange={e => updateConfig({ thresholds: { high: Number(e.target.value) } })}
                className="w-full p-[8px_12px] rounded-[10px] border border-slate-200 text-[13px] outline-none focus:border-brand-amber focus:ring-1 focus:ring-brand-amber"
              />
            </div>

            <div className="mb-5">
              <label className="text-xs font-semibold text-slate-700">
                Medium Risk Threshold (%) — currently {appConfig.thresholds.medium}%
              </label>
              <div className="text-[10px] text-slate-400 mb-1.5 mt-0.5">
                Employees between this and the High threshold are flagged Medium Risk.
              </div>
              <input
                type="number"
                min={1} max={99}
                value={appConfig.thresholds.medium}
                onChange={e => updateConfig({ thresholds: { medium: Number(e.target.value) } })}
                className="w-full p-[8px_12px] rounded-[10px] border border-slate-200 text-[13px] outline-none focus:border-brand-amber focus:ring-1 focus:ring-brand-amber"
              />
            </div>

            <div className="mb-5">
              <label className="text-xs font-semibold text-slate-700">Risk Level Colors</label>
              <div className="text-[10px] text-slate-400 mb-1.5 mt-0.5">
                Applied to all charts, badges, and indicators across every module.
              </div>
              <div className="flex gap-4 mt-1.5">
                {["high", "medium", "low"].map(level => (
                  <div key={level} className="flex flex-col items-center gap-1">
                    <div className="text-[10px] font-bold capitalize text-slate-600">{level}</div>
                    <input
                      type="color"
                      value={appConfig.colors[level]}
                      onChange={e => updateConfig({ colors: { [level]: e.target.value } })}
                      className="w-11 h-11 rounded-[10px] border-[1.5px] border-slate-200 cursor-pointer p-0.5"
                    />
                    <div className="text-[9px] text-slate-400">{appConfig.colors[level]}</div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => updateConfig({
                thresholds: { high: 30, medium: 15 },
                colors: { high: "#ef4444", medium: "#eab308", low: "#22c55e" },
              })}
              className="w-full p-2.5 bg-slate-100 border-none rounded-[10px] text-xs font-semibold cursor-pointer mt-1 text-slate-700 hover:bg-slate-200"
            >
              ↺ Reset to Defaults
            </button>
          </div>
        </div>
      )}

      {/* ── Mobile Sidebar Overlay ── */}
      {mobileSidebarOpen && (
        <div className="sidebar-overlay block" onClick={() => setMobileSidebarOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`sidebar-drawer flex flex-col bg-brand-dark overflow-y-auto overflow-x-hidden flex-shrink-0 transition-all duration-300 ease-in-out ${mobileSidebarOpen ? " open" : ""}`}
        style={{
          width: sidebarOpen ? 232 : 56,
          minWidth: sidebarOpen ? 232 : 56,
        }}
      >
        {/* Logo */}
        <div className={`border-b border-brand-navy ${sidebarOpen ? "p-[22px_18px_18px]" : "p-[22px_10px_18px]"}`}>
          <div className="flex items-center gap-2.5">
            <div className="w-[34px] h-[34px] bg-gradient-to-br from-brand-amber to-brand-red rounded-[9px] flex items-center justify-center shrink-0 text-[17px]">⚡</div>
            {sidebarOpen && (
              <div>
                <div className="font-display text-[15px] font-bold text-white leading-tight">AttritionIQ</div>
                <div className="text-[9px] text-slate-500">by Pulse Digital</div>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <div className="mt-3 bg-brand-navy rounded-[9px] p-[7px_11px]">
              <div className="text-[9px] text-slate-500 uppercase tracking-widest">Workspace</div>
              <div className="text-xs text-slate-100 font-semibold mt-px">{company.name}</div>
              <div className="text-[10px] text-slate-400">{company.industry} · {company.currency}</div>
              <button 
                onClick={() => setShowResetConfirm(true)}
                className="mt-2 w-full p-[5px_8px] rounded-md border border-slate-700 bg-transparent text-slate-500 text-[10px] cursor-pointer text-left transition-all hover:text-brand-amber hover:border-brand-amber/30"
              >
                ↩ Change Company
              </button>
            </div>
          )}
        </div>

        {/* Data status */}
        {sidebarOpen && (
          <div className="p-[10px_16px] border-b border-brand-navy">
            <div className="flex items-center gap-[7px]">
              <div className="w-[7px] h-[7px] rounded-full shrink-0" style={{ background: insight?.color || "#475569" }} />
              <span className={`text-[11px] ${data.length > 0 ? "text-green-500" : "text-slate-500"}`}>
                {insight ? `${insight.total} employees synced · ${insight.status}` : "No data loaded"}
              </span>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 p-[10px_8px]">
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
                className={`w-full flex items-center gap-[9px] p-[9px_10px] rounded-[9px] border-none mb-px text-left transition-all duration-150
                  ${isActive ? "bg-brand-amber/10 text-brand-amber border-l-[3px] border-brand-amber" : "bg-transparent border-l-[3px] border-transparent"}
                  ${isDisabled ? "text-slate-700 cursor-not-allowed opacity-35 pointer-events-none" : "cursor-pointer hover:bg-white/5"}
                  ${!isActive && !isDisabled ? "text-slate-400" : ""}
                `}
              >
                <span className="text-[15px] shrink-0">{m.icon}</span>
                {sidebarOpen && (
                  <div className="min-w-0">
                    <div className={`text-[11px] leading-tight truncate ${isActive ? "font-bold" : "font-medium"}`}>{m.label}</div>
                    <div className="text-[9px] opacity-40 mt-px flex items-center gap-1">
                      {m.short}
                      {m.live && <span className="bg-green-500 text-white rounded-[4px] px-1 text-[8px] font-bold">LIVE</span>}
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Theme toggle + Collapse */}
        <div className="p-[10px_8px] border-t border-brand-navy flex flex-col gap-1.5">
          <button
            onClick={toggleTheme}
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            className={`w-full p-[7px] rounded-lg border border-brand-navy bg-transparent text-slate-500 cursor-pointer text-[13px] flex items-center gap-2 hover:bg-white/5 ${sidebarOpen ? "justify-start" : "justify-center"}`}
          >
            <span className="text-[15px]">{isDark ? "☀️" : "🌙"}</span>
            {sidebarOpen && <span className="text-[11px] text-slate-400">{isDark ? "Light Mode" : "Dark Mode"}</span>}
          </button>

          <button
            onClick={() => setSidebarOpen(p => !p)}
            className="w-full p-[7px] rounded-lg border border-brand-navy bg-transparent text-slate-500 cursor-pointer text-[13px] hover:bg-white/5"
          >
            {sidebarOpen ? "◀ Collapse" : "▶"}
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="main-content flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Topbar */}
        <div className={`flex items-center justify-between sticky top-0 px-4 py-3 border-b z-topbar ${isDark ? "bg-brand-navy border-slate-700" : "bg-white border-slate-100"}`}>
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <button
              onClick={() => setMobileSidebarOpen(p => !p)}
              className="mobile-menu-btn items-center justify-center bg-transparent border-none cursor-pointer text-xl shrink-0 px-1 dark:text-slate-100 text-brand-dark"
              aria-label="Open menu"
            >
              ☰
            </button>
            <div className="min-w-0 flex-1 overflow-hidden">
              <div className="topbar-title text-safe font-display text-lg font-bold truncate dark:text-slate-100 text-brand-dark">
                {mod?.icon} {mod?.label}
              </div>
              <div className="text-safe text-[11px] mt-px truncate max-w-full" style={{ color: insight?.color || "#94a3b8" }}>
                {data.length > 0 && insight
                  ? `${insight.total} emp · ${company.name} · ${insight.highRisk} high`
                  : "Upload CSV or use sample data"}
              </div>
            </div>
          </div>
          <div className="flex gap-2 items-center shrink-0 min-w-0">
            {data.length > 0 && insight && (
              <div className="topbar-badge-hide-xs rounded-full px-[11px] py-1 text-[10px] font-bold whitespace-nowrap border" style={{
                background: insight.color + "22",
                border: `1px solid ${insight.color}55`,
                color: insight.color,
              }}>
                {insight.status} · {insight.highRisk} High Risk
              </div>
            )}
            
            {isSampleData && (
              <div className="bg-amber-50 border border-amber-200 rounded-full px-2.5 py-[3px] text-[10px] text-amber-800 font-bold whitespace-nowrap">
                📋 Sample Data
              </div>
            )}

            <button 
              onClick={() => setShowConfigModal(true)}
              className="bg-slate-100 hover:bg-slate-200 border-none rounded-full w-[34px] h-[34px] flex items-center justify-center cursor-pointer text-lg shrink-0 transition-colors"
              title="Settings"
            >
              ⚙️
            </button>

            <div
              title={`${company.name} · ${company.industry || ""} · ${company.currency || "USD"}`}
              className="w-[34px] h-[34px] bg-gradient-to-br from-brand-amber to-brand-red rounded-[9px] flex items-center justify-center text-white font-bold text-sm cursor-default shrink-0"
            >
              {companyInitial}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="content-area flex-1 overflow-y-auto p-[22px_24px]">
          <ErrorBoundary>
            <DataUpload />
          </ErrorBoundary>

          <ErrorBoundary key={active}>
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

function StandaloneSurvey({ dept, questions, anonymous, companyName, onClose }) {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
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

    await surveyEngine.submit(formattedAnswers, context, true);
    
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 800);
  };

  if (submitted) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-5 font-body">
      <div className="text-center p-[50px_40px] bg-white rounded-[24px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.1)] max-w-[440px] w-full animate-[slideIn_0.5s_ease]">
        <div className="text-[64px] mb-5">🎉</div>
        <div className="font-display text-[28px] font-extrabold text-brand-dark mb-3">You're all set!</div>
        <div className="text-[15px] text-slate-500 mb-8 leading-relaxed">
          Thank you for sharing your voice. Your feedback goes directly into our Hiring Intelligence engine to build a better workplace.
        </div>
        <button onClick={onClose} className="w-full p-4 rounded-[14px] border-none bg-brand-dark text-white text-[15px] font-bold cursor-pointer transition-transform hover:scale-[1.02]">
          Close Page
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-[60px] font-body">
      
      {/* Top Navigation & Progress Bar */}
      <div className="bg-white sticky top-0 z-topbar border-b border-slate-100 p-[16px_24px] flex items-center justify-between">
        <div className="font-extrabold text-base text-brand-dark flex items-center gap-2">
          <span className="bg-gradient-to-br from-brand-amber to-brand-red bg-clip-text text-transparent">⚡</span>
          Pulse Check
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs font-bold text-slate-500">{progressPct}%</div>
          <div className="w-[100px] h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-400 ease-in-out ${progressPct === 100 ? "bg-green-500" : "bg-brand-amber"}`} 
              style={{ width: `${progressPct}%` }} 
            />
          </div>
        </div>
      </div>

      <div className="max-w-[600px] mx-auto p-[40px_20px]">
        
        {/* Header Section */}
        <div className="mb-10 text-center">
          <div className="font-display text-[32px] font-extrabold text-brand-dark mb-2.5">
            {companyName}
          </div>
          <div className="text-[15px] text-slate-500 font-medium">
            {dept} Department • Takes ~2 mins
          </div>
          {anonymous && (
            <div className="inline-flex items-center gap-1.5 bg-green-50 text-green-600 p-[6px_12px] rounded-full text-xs font-bold mt-4 border border-green-200">
              🔒 100% Anonymous Mode
            </div>
          )}
        </div>

        {!anonymous && (
          <div className="bg-white rounded-[16px] p-6 mb-6 shadow-sm border border-slate-100">
            <label className="block text-xs font-extrabold text-slate-400 uppercase tracking-wider mb-3">Your Name</label>
            <input 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="Type your full name here..." 
              className="w-full p-4 rounded-xl border-[1.5px] border-slate-200 text-[15px] outline-none transition-colors focus:border-brand-amber" 
            />
          </div>
        )}

        {questions.map((q, idx) => {
          const isAnswered = answers[q.id] !== undefined;
          return (
            <div key={q.id} className={`bg-white rounded-[20px] p-[32px_28px] mb-6 transition-all duration-300 ${isAnswered ? "border border-slate-200 opacity-70" : "border-[1.5px] border-brand-amber shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05)]"}`}>
              <div className="flex gap-4 mb-6">
                <div className="w-11 h-11 rounded-xl bg-slate-50 flex items-center justify-center text-xl shrink-0 border border-slate-100">
                  {q.icon}
                </div>
                <div>
                  <div className="text-[11px] font-extrabold text-brand-amber uppercase tracking-wider mb-1.5">
                    Q{idx + 1} • {q.category}
                  </div>
                  <div className="text-lg text-brand-dark font-bold leading-relaxed">
                    {q.text}
                  </div>
                </div>
              </div>

              {q.type === "scale" ? (
                <div>
                  <div className="flex gap-1.5 flex-wrap justify-between">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => {
                      const selected = answers[q.id] === num;
                      let colorClasses = "text-slate-500 border-slate-200 bg-white";
                      if (selected) {
                        if (num <= 3) colorClasses = "text-brand-red border-brand-red bg-red-50";
                        else if (num >= 8) colorClasses = "text-green-500 border-green-500 bg-green-50";
                        else colorClasses = "text-brand-dark border-brand-dark bg-slate-100";
                      }

                      return (
                        <button
                          key={num}
                          onClick={() => setAnswers(p => ({ ...p, [q.id]: num }))}
                          className={`flex-1 min-w-[30px] py-3 rounded-[10px] border-[1.5px] text-[15px] font-extrabold cursor-pointer transition-all duration-200 ${colorClasses} ${selected ? "scale-105" : "hover:bg-slate-50"}`}
                        >
                          {num}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 mt-3 font-semibold">
                    <span>Not at all</span>
                    <span>Absolutely</span>
                  </div>
                </div>
              ) : (
                <textarea 
                  rows={4} 
                  placeholder="Type your thoughts here..." 
                  value={answers[q.id] || ""} 
                  onChange={e => setAnswers(p => ({ ...p, [q.id]: e.target.value }))} 
                  className="w-full p-4 rounded-xl border-[1.5px] border-slate-200 text-[15px] resize-y outline-none font-inherit transition-colors focus:border-brand-amber" 
                />
              )}
            </div>
          );
        })}

        {/* Action Button */}
        <div className="mt-8">
          <button 
            onClick={handleSubmit} 
            disabled={isSubmitting || !isComplete} 
            className={`w-full p-5 border-none rounded-[16px] text-base font-extrabold transition-all duration-300 ${isComplete ? "bg-gradient-to-br from-brand-amber to-brand-red text-white cursor-pointer shadow-[0_10px_25px_-5px_rgba(245,158,11,0.4)] hover:scale-[1.01]" : "bg-slate-200 text-slate-400 cursor-not-allowed"}`}
          >
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
