import { useContext } from "react";
import { AppProvider, AppContext } from "./context/AppContext";
import CompanySetup from "./components/CompanySetup";
import DataUpload from "./components/DataUpload";
import M1Dashboard from "./modules/M1Dashboard";
import M2RiskScorer from "./modules/M2RiskScorer";
import M3Salary from "./modules/M3Salary";
import M4DeptHealth from "./modules/M4DeptHealth";
import M5ExitAnalyzer from "./modules/M5ExitAnalyzer";
import M6ROI from "./modules/M6ROI";
import ComingSoon from "./modules/ComingSoon";
import { useState } from "react";

const MODULES = [
  { id: "m1", label: "Attrition Dashboard", icon: "📊", short: "M1", live: true },
  { id: "m2", label: "Predictive Risk Scorer", icon: "🎯", short: "M2", live: true },
  { id: "m3", label: "Salary Benchmarking", icon: "💰", short: "M3", live: true },
  { id: "m4", label: "Dept Health Monitor", icon: "🏥", short: "M4", live: true },
  { id: "m5", label: "Exit Interview Analyzer", icon: "🚪", short: "M5", live: true },
  { id: "m6", label: "Retention ROI Calc", icon: "📈", short: "M6", live: true },
  { id: "m7", label: "Shift & Fatigue Radar", icon: "😴", short: "M7", live: false },
  { id: "m8", label: "Talent Matchmaker", icon: "🔗", short: "M8", live: false },
  { id: "m9", label: "Micro-Pulse Survey", icon: "💬", short: "M9", live: false },
];

const MODULE_DETAILS = {
  m2: { title: "Predictive Risk Scorer", icon: "🎯", desc: "Input any employee's details and get an AI-powered flight risk score from 0–100% with factor breakdown.", features: ["Risk Gauge 0-100%","Factor Breakdown","Gen Z Warning","Bulk CSV Score","AI Explanation"] },
  m3: { title: "Salary Benchmarking Studio", icon: "💰", desc: "Detect your company's salary cliff threshold, visualize danger zones, and simulate salary adjustments.", features: ["Cliff Detector","Danger Zone Map","Adjustment Simulator","Budget Impact","Market Compare"] },
  m4: { title: "Department Health Monitor", icon: "🏥", desc: "Traffic-light scorecards per department with Survivor Burnout Alert and Human Buffer Metric.", features: ["Traffic Light System","🚨 Survivor Burnout Alert","Human Buffer Metric","Dept Comparison","Trend Tracking"] },
  m5: { title: "Exit Interview Analyzer", icon: "🚪", desc: "Paste exit interview notes — AI categorizes reasons, detects patterns, generates word cloud.", features: ["AI Categorization","Pattern Detector","Keyword Cloud","Sentiment Score","Export Summary"] },
  m6: { title: "Retention ROI Calculator", icon: "📈", desc: "Simulate interventions with sliders, get ROI timeline, ghost cost toggle, and auto Gantt Action Plan.", features: ["3 Intervention Sliders","ROI Timeline","Ghost Cost Toggle","AI Executive Summary","90-Day Gantt Chart"] },
  m7: { title: "Shift & Fatigue Radar", icon: "😴", desc: "Analyze shift patterns, calculate Fatigue Index, simulate schedule changes to predict burnout.", features: ["Fatigue Index Score","Schedule Optimizer","Burnout Predictor","AI Insight","Team Radar"] },
  m8: { title: "Internal Talent Matchmaker", icon: "🔗", desc: "Build skill matrices for at-risk employees — AI scans other departments for match opportunities.", features: ["Skill Matrix","AI Matchmaker","Mobility Radar Chart","Match % Score","Transfer Recommendation"] },
  m9: { title: "Micro-Pulse Survey Engine", icon: "💬", desc: "Generate weekly survey links — real-time sentiment stream updates satisfaction scores live.", features: ["Survey Generator","Real-time Stream","Word Cloud D3","Sentiment Scoring","Auto Update M1"] },
};

function AppShell() {
  const { company, setCompany, data } = useContext(AppContext);
  const [active, setActive] = useState("m1");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (!company) return <CompanySetup onSave={setCompany} />;

  const mod = MODULES.find(m => m.id === active);
  const det = MODULE_DETAILS[active];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8fafc", fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>

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
            </div>
          )}
        </div>

        {/* Data status */}
        {sidebarOpen && (
          <div style={{ padding: "10px 16px", borderBottom: "1px solid #1e293b" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: data.length > 0 ? "#22c55e" : "#475569", flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: data.length > 0 ? "#22c55e" : "#475569" }}>
                {data.length > 0 ? `${data.length} employees synced` : "No data loaded"}
              </span>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav style={{ flex: 1, padding: "10px 8px" }}>
          {MODULES.map(m => (
            <button
              key={m.id}
              onClick={() => setActive(m.id)}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 9,
                padding: "9px 10px", borderRadius: 9, border: "none",
                cursor: "pointer", marginBottom: 1,
                background: active === m.id ? "rgba(245,158,11,0.12)" : "transparent",
                color: active === m.id ? "#f59e0b" : "#64748b",
                textAlign: "left", transition: "all 0.12s",
                borderLeft: active === m.id ? "3px solid #f59e0b" : "3px solid transparent",
              }}
            >
              <span style={{ fontSize: 15, flexShrink: 0 }}>{m.icon}</span>
              {sidebarOpen && (
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: active === m.id ? 700 : 500, lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.label}</div>
                  <div style={{ fontSize: 9, opacity: 0.4, marginTop: 1, display: "flex", alignItems: "center", gap: 4 }}>
                    {m.short}
                    {m.live && <span style={{ background: "#22c55e", color: "#fff", borderRadius: 4, padding: "0px 4px", fontSize: 8, fontWeight: 700 }}>LIVE</span>}
                  </div>
                </div>
              )}
            </button>
          ))}
        </nav>

        {/* Collapse */}
        <div style={{ padding: "10px 8px", borderTop: "1px solid #1e293b" }}>
          <button
            onClick={() => setSidebarOpen(p => !p)}
            style={{ width: "100%", padding: "7px", borderRadius: 8, border: "1px solid #1e293b", background: "transparent", color: "#475569", cursor: "pointer", fontSize: 13 }}
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
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 1 }}>
              {company.name} · {data.length > 0 ? `${data.length} employees loaded` : "No data — upload CSV or use sample data"}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {data.length > 0 && (
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 20, padding: "4px 11px", fontSize: 10, color: "#16a34a", fontWeight: 700, whiteSpace: "nowrap" }}>
                ✓ Synced · all modules
              </div>
            )}
            <div style={{ width: 34, height: 34, background: "linear-gradient(135deg,#f59e0b,#ef4444)", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 14 }}>
              {company.name.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: "22px 24px", overflowY: "auto" }}>
          <DataUpload />
          {active === "m1"
            ? <M1Dashboard />
            : active === "m2"
            ? <M2RiskScorer />
            : active === "m3"
            ? <M3Salary />
            : active === "m4"
            ? <M4DeptHealth />
            : active === "m5"
            ? <M5ExitAnalyzer />
            : active === "m6"
            ? <M6ROI />
            : det
            ? <ComingSoon icon={det.icon} title={det.title} desc={det.desc} features={det.features} />
            : null
          }
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
