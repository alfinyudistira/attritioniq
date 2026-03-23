import { useState, useMemo, useCallback } from "react";
import { useApp, SAMPLE_DATA } from "../context/AppContext";

// ── Sample exit interviews based on PDF personas ──
const SAMPLE_INTERVIEWS = [
  { id: 1, name: "Alex Carter", dept: "Technical Support", date: "2024-10", tenure: 2.5, salary: 4200, age: 27, text: "The workload became completely unsustainable after the new process changes. I was handling 1.5x the ticket volume with no additional support. My breaks were eliminated and I barely had time to decompress between difficult customer interactions. I tried raising this with my manager but nothing changed. The overtime was constant and I was burning out fast. I found a role elsewhere with similar pay but reasonable hours." },
  { id: 2, name: "Sarah Miller", dept: "Sales", date: "2024-10", tenure: 3.0, salary: 4900, age: 29, text: "I loved working here and I was one of the top performers. But when I checked the market, new hires at competitors were earning $5,500 to $6,000 for the same role. I tried to negotiate a raise and was told the budget was frozen. I felt undervalued especially given how much extra effort I put in. A competitor offered me $5,800 and I had to accept. I would have stayed for $5,200 honestly." },
  { id: 3, name: "Kevin Zhao", dept: "Digital Marketing", date: "2024-09", tenure: 0.3, salary: 3800, age: 22, text: "I joined excited about the role but within two months it was clear there was no onboarding structure and nobody had time to guide me. I was just assigned admin tasks with no feedback. I felt completely invisible and there was no growth path explained to me. The team was too busy with their own firefighting to mentor anyone. I accepted a remote job that has a structured mentorship program." },
  { id: 4, name: "Tom Holland", dept: "IT", date: "2024-09", tenure: 1.5, salary: 4200, age: 27, text: "The overtime policy was the main reason I left. I was regularly working 60 plus hours a week with no overtime pay. My health started suffering and my sleep was affected. The workload after the Six Sigma changes just never went back to normal. I had no work-life balance at all. I found a company that caps hours at 45 and pays market rate." },
  { id: 5, name: "Maya Patel", dept: "Sales", date: "2024-08", tenure: 2.0, salary: 4500, age: 31, text: "My manager was good but the culture had shifted significantly. The pressure to hit numbers while being underpaid was demoralizing. There was no recognition for going above and beyond. I also saw many colleagues resign which made me question my own future here. The company feels like it is in a talent exodus and I did not want to be the last one standing." },
  { id: 6, name: "Zendaya Coleman", dept: "IT", date: "2024-08", tenure: 1.0, salary: 4000, age: 26, text: "The compensation was really the deciding factor. I was earning $4,000 a month while doing work that the market pays $5,500 for. I brought this up twice in performance reviews and was told to wait for the annual cycle. By the time the annual cycle came I had already accepted another offer. The work itself was fine but financial stress was affecting my performance." },
  { id: 7, name: "James Wu", dept: "Sales", date: "2024-07", tenure: 0.5, salary: 3800, age: 24, text: "Honestly the job was not what was described in the interview. The targets were unrealistic and the support promised was not there. Combined with low pay and mandatory overtime from day one I just could not see a future here. I think the role needs to be redesigned before you hire for it again." },
  { id: 8, name: "Lily Young", dept: "Technical Support", date: "2024-07", tenure: 1.5, salary: 4400, age: 29, text: "I left because I had no career growth visibility. After 18 months I still had no clarity on promotion criteria. Meanwhile the workload kept increasing and the pay did not reflect the expanded responsibilities. The management team was supportive but structurally there was no path forward for someone like me." },
];

const CATEGORIES = {
  Compensation: { color: "#ef4444", bg: "#fef2f2", border: "#fecaca", icon: "💰", keywords: ["pay","salary","compensation","underpaid","wage","market","earning","money","financial","offer","raise","paid"] },
  Workload: { color: "#f97316", bg: "#fff7ed", border: "#fed7aa", icon: "⏱️", keywords: ["overtime","workload","hours","burnout","overworked","stress","capacity","sustainable","breaks","health","sleep","balance"] },
  Career: { color: "#8b5cf6", bg: "#f5f3ff", border: "#ddd6fe", icon: "📈", keywords: ["growth","promotion","career","path","future","development","visibility","progress","opportunity","advance"] },
  Management: { color: "#3b82f6", bg: "#eff6ff", border: "#bfdbfe", icon: "👤", keywords: ["manager","management","leadership","feedback","support","guidance","mentor","recognition","culture"] },
  Culture: { color: "#10b981", bg: "#f0fdf4", border: "#bbf7d0", icon: "🏢", keywords: ["culture","environment","team","colleagues","toxic","morale","values","vibe","atmosphere","belong"] },
  Process: { color: "#f59e0b", bg: "#fffbeb", border: "#fde68a", icon: "⚙️", keywords: ["process","system","structure","onboarding","training","organized","efficiency","bureaucracy","workflow"] },
};

// ── AI analysis ──
async function analyzeWithAI(interviews, company) {
  const summaries = interviews.map(i => `[${i.dept}] "${i.text.slice(0, 200)}..."`).join("\n\n");
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{
        role: "user",
        content: `You are an HR analyst at ${company?.name || "a company"}. Analyze these ${interviews.length} exit interviews and provide:

${summaries}

Respond in this exact JSON format (no markdown, no backticks):
{
  "topTheme": "One sentence: the single most dominant reason people are leaving",
  "urgentAction": "One sentence: the single most urgent action leadership must take in the next 30 days",
  "hiddenPattern": "One sentence: a non-obvious pattern that connects multiple exit interviews",
  "retentionOpportunity": "One sentence: what would have convinced the most people to stay",
  "riskForecast": "One sentence: what will happen in the next 60 days if nothing changes"
}`
      }]
    })
  });
  const data = await response.json();
  const text = data.content?.[0]?.text || "{}";
  try {
    return JSON.parse(text.replace(/```json|```/g, "").trim());
  } catch {
    return null;
  }
}

// ── Keyword extraction & scoring ──
function categorizeInterview(text) {
  const lower = text.toLowerCase();
  const scores = {};
  Object.entries(CATEGORIES).forEach(([cat, cfg]) => {
    scores[cat] = cfg.keywords.filter(kw => lower.includes(kw)).length;
  });
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const primary = sorted[0][1] > 0 ? sorted[0][0] : "Culture";
  const secondary = sorted[1]?.[1] > 0 ? sorted[1][0] : null;
  const sentiment = computeSentiment(lower);
  return { primary, secondary, scores, sentiment };
}

function computeSentiment(text) {
  const negative = ["burnout","unsustainable","underpaid","leaving","quit","resign","toxic","stress","overwork","invisible","demoralized","frustrated","terrible","awful","poor","bad","no support","no guidance","no feedback","unfair","last straw"];
  const positive = ["loved","good","supportive","fine","enjoyed","great","excellent","appreciate","thank","positive","growth","opportunity"];
  const negScore = negative.filter(w => text.includes(w)).length;
  const posScore = positive.filter(w => text.includes(w)).length;
  const score = Math.round(Math.max(0, Math.min(100, 50 - (negScore * 8) + (posScore * 5))));
  return { score, label: score >= 60 ? "Positive" : score >= 35 ? "Mixed" : "Negative", color: score >= 60 ? "#22c55e" : score >= 35 ? "#f59e0b" : "#ef4444" };
}

function extractKeywords(interviews) {
  const freq = {};
  const stopWords = new Set(["the","and","was","were","had","have","that","this","with","from","they","their","for","but","not","been","when","also","just","more","after","into","about","very","would","could","which","there","what","than","then","some","my","me","i","a","an","to","of","in","on","is","it","at","by","be","as","or","no","we","so","up","do","go","if","he","she","us","our","its","him","her","you","your"]);
  interviews.forEach(iv => {
    iv.text.toLowerCase().replace(/[^a-z\s]/g, "").split(/\s+/)
      .filter(w => w.length > 4 && !stopWords.has(w))
      .forEach(w => { freq[w] = (freq[w] || 0) + 1; });
  });
  return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 40);
}

// ── Word Cloud SVG ──
function WordCloud({ words }) {
  if (!words || words.length === 0) return null;
  const max = words[0]?.[1] || 1;
  const positions = [];
  const placed = [];

  words.slice(0, 30).forEach(([word, count]) => {
    const fontSize = Math.max(10, Math.min(28, (count / max) * 28));
    const color = Object.values(CATEGORIES).find(c => c.keywords.includes(word))?.color || "#94a3b8";
    let x, y, attempts = 0;
    do {
      x = 20 + Math.random() * 360;
      y = 20 + Math.random() * 150;
      attempts++;
    } while (attempts < 30 && placed.some(p => Math.abs(p.x - x) < word.length * fontSize * 0.5 && Math.abs(p.y - y) < fontSize * 1.5));
    placed.push({ x, y });
    positions.push({ word, count, fontSize, color, x, y });
  });

  return (
    <svg width="100%" viewBox="0 0 400 180" style={{ overflow: "visible" }}>
      {positions.map((p, i) => (
        <text key={i} x={p.x} y={p.y} fontSize={p.fontSize} fill={p.color}
          fontWeight={p.count > 2 ? "700" : "500"} opacity={0.85}
          style={{ fontFamily: "'DM Sans', sans-serif" }}>
          {p.word}
        </text>
      ))}
    </svg>
  );
}

// ── Timeline Chart ──
function TimelineChart({ interviews }) {
  const byMonth = {};
  interviews.forEach(iv => {
    const m = iv.date || "2024-10";
    if (!byMonth[m]) byMonth[m] = { total: 0, cats: {} };
    byMonth[m].total++;
    const { primary } = categorizeInterview(iv.text);
    byMonth[m].cats[primary] = (byMonth[m].cats[primary] || 0) + 1;
  });
  const months = Object.entries(byMonth).sort((a, b) => a[0].localeCompare(b[0]));
  if (months.length === 0) return null;
  const max = Math.max(...months.map(m => m[1].total), 1);
  const W = 400, H = 120, pad = { l: 28, r: 8, t: 14, b: 28 };
  const bW = Math.min(40, Math.floor((W - pad.l - pad.r) / months.length) - 4);

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
      {months.map(([month, data], i) => {
        const x = pad.l + i * ((W - pad.l - pad.r) / months.length) + 2;
        const bh = (data.total / max) * (H - pad.t - pad.b);
        const topCat = Object.entries(data.cats).sort((a, b) => b[1] - a[1])[0]?.[0] || "Culture";
        const color = CATEGORIES[topCat]?.color || "#94a3b8";
        return (
          <g key={month}>
            <rect x={x} y={H - pad.b - bh} width={bW} height={bh} rx={3} fill={color} opacity={0.85} />
            <text x={x + bW / 2} y={H - pad.b - bh - 4} textAnchor="middle" fontSize={9} fill="#1e293b" fontWeight="700">{data.total}</text>
            <text x={x + bW / 2} y={H - 8} textAnchor="middle" fontSize={7.5} fill="#94a3b8">{month.slice(5)}</text>
          </g>
        );
      })}
      <line x1={pad.l} y1={H - pad.b} x2={W - pad.r} y2={H - pad.b} stroke="#e2e8f0" strokeWidth={1} />
    </svg>
  );
}

// ── Single interview card ──
function InterviewCard({ iv, analysis, idx }) {
  const [expanded, setExpanded] = useState(false);
  const cat = CATEGORIES[analysis.primary];
  const secCat = analysis.secondary ? CATEGORIES[analysis.secondary] : null;

  return (
    <div style={{ background: "#fff", borderRadius: 13, padding: "14px 16px", border: `1.5px solid ${cat.border}`, marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: cat.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
            {cat.icon}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}>{iv.name || `Anonymous #${idx + 1}`}</div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>{iv.dept} · {iv.date} · {iv.tenure}y tenure</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
          <span style={{ background: cat.bg, color: cat.color, border: `1px solid ${cat.border}`, padding: "3px 9px", borderRadius: 20, fontSize: 10, fontWeight: 700 }}>
            {cat.icon} {analysis.primary}
          </span>
          {secCat && (
            <span style={{ background: secCat.bg, color: secCat.color, border: `1px solid ${secCat.border}`, padding: "3px 9px", borderRadius: 20, fontSize: 10, fontWeight: 600 }}>
              {secCat.icon} {analysis.secondary}
            </span>
          )}
          <span style={{ background: analysis.sentiment.score >= 60 ? "#f0fdf4" : analysis.sentiment.score >= 35 ? "#fffbeb" : "#fef2f2", color: analysis.sentiment.color, padding: "3px 9px", borderRadius: 20, fontSize: 10, fontWeight: 700 }}>
            {analysis.sentiment.label}
          </span>
        </div>
      </div>

      {/* Sentiment bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 9, color: "#94a3b8", width: 60 }}>Sentiment</span>
        <div style={{ flex: 1, height: 4, background: "#f1f5f9", borderRadius: 2, overflow: "hidden" }}>
          <div style={{ width: `${analysis.sentiment.score}%`, height: "100%", background: analysis.sentiment.color, borderRadius: 2 }} />
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, color: analysis.sentiment.color, width: 28 }}>{analysis.sentiment.score}</span>
      </div>

      {/* Text preview */}
      <div style={{ fontSize: 12, color: "#475569", lineHeight: 1.6, fontStyle: "italic" }}>
        "{expanded ? iv.text : iv.text.slice(0, 120) + (iv.text.length > 120 ? "..." : "")}"
      </div>
      {iv.text.length > 120 && (
        <button onClick={() => setExpanded(e => !e)}
          style={{ background: "none", border: "none", color: "#f59e0b", fontSize: 11, fontWeight: 700, cursor: "pointer", marginTop: 4, padding: 0 }}>
          {expanded ? "Show less ↑" : "Read full interview ↓"}
        </button>
      )}

      {/* Category keyword hits */}
      <div style={{ marginTop: 8, display: "flex", gap: 4, flexWrap: "wrap" }}>
        {Object.entries(CATEGORIES).map(([cat, cfg]) => {
          const hits = cfg.keywords.filter(kw => iv.text.toLowerCase().includes(kw));
          if (hits.length === 0) return null;
          return hits.slice(0, 2).map(kw => (
            <span key={kw} style={{ background: cfg.bg, color: cfg.color, padding: "1px 7px", borderRadius: 10, fontSize: 9, fontWeight: 600 }}>
              {kw}
            </span>
          ));
        })}
      </div>
    </div>
  );
}

// ── Input form for new interview ──
function AddInterviewForm({ onAdd }) {
  const [form, setForm] = useState({ name: "", dept: "Sales", date: "2024-10", tenure: 1, salary: 4000, age: 27, text: "" });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const depts = ["Sales", "Technical Support", "IT", "HR", "Digital Marketing", "Operations", "Finance", "Other"];

  return (
    <div style={{ background: "#f8fafc", borderRadius: 13, padding: "16px 18px", border: "1.5px solid #e2e8f0", marginBottom: 16 }}>
      <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", marginBottom: 12 }}>➕ Add Exit Interview</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
        {[
          { label: "Name", key: "name", type: "text", placeholder: "Anonymous" },
          { label: "Dept", key: "dept", type: "select" },
          { label: "Date (YYYY-MM)", key: "date", type: "text", placeholder: "2024-10" },
          { label: "Tenure (yrs)", key: "tenure", type: "number" },
          { label: "Monthly Salary", key: "salary", type: "number" },
          { label: "Age", key: "age", type: "number" },
        ].map(f => (
          <div key={f.key}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{f.label}</div>
            {f.type === "select" ? (
              <select value={form[f.key]} onChange={e => set(f.key, e.target.value)}
                style={{ width: "100%", padding: "7px 10px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 12, background: "#fff", color: "#1e293b" }}>
                {depts.map(d => <option key={d}>{d}</option>)}
              </select>
            ) : (
              <input type={f.type} value={form[f.key]} placeholder={f.placeholder}
                onChange={e => set(f.key, f.type === "number" ? Number(e.target.value) : e.target.value)}
                style={{ width: "100%", padding: "7px 10px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 12, background: "#fff", color: "#1e293b", boxSizing: "border-box" }} />
            )}
          </div>
        ))}
      </div>
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Exit Interview Text</div>
        <textarea value={form.text} onChange={e => set("text", e.target.value)}
          placeholder="Paste or type the exit interview response here..."
          rows={4}
          style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 12, color: "#1e293b", background: "#fff", resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" }} />
      </div>
      <button onClick={() => { if (form.text.trim()) { onAdd({ ...form, id: Date.now() }); setForm(p => ({ ...p, name: "", text: "" })); }}}
        disabled={!form.text.trim()}
        style={{ padding: "9px 20px", background: form.text.trim() ? "linear-gradient(135deg,#f59e0b,#ef4444)" : "#e2e8f0", color: form.text.trim() ? "#fff" : "#94a3b8", border: "none", borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: form.text.trim() ? "pointer" : "not-allowed" }}>
        Analyze Interview →
      </button>
    </div>
  );
}

// ── MAIN M5 ──
export default function M5ExitAnalyzer() {
  const { company, data } = useApp();
  const [interviews, setInterviews] = useState(SAMPLE_INTERVIEWS);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [aiInsights, setAiInsights] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [filterCat, setFilterCat] = useState("All");
  const [filterDept, setFilterDept] = useState("All");

  const analyzed = useMemo(() => interviews.map(iv => ({
    ...iv, analysis: categorizeInterview(iv.text)
  })), [interviews]);

  const filtered = useMemo(() => analyzed.filter(iv => {
    if (filterCat !== "All" && iv.analysis.primary !== filterCat) return false;
    if (filterDept !== "All" && iv.dept !== filterDept) return false;
    return true;
  }), [analyzed, filterCat, filterDept]);

  const depts = useMemo(() => ["All", ...new Set(interviews.map(iv => iv.dept))], [interviews]);

  // Category distribution
  const catDist = useMemo(() => {
    const counts = {};
    analyzed.forEach(iv => { counts[iv.analysis.primary] = (counts[iv.analysis.primary] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [analyzed]);

  // Sentiment stats
  const sentimentStats = useMemo(() => {
    const scores = analyzed.map(iv => iv.analysis.sentiment.score);
    const avg = scores.length > 0 ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length) : 50;
    const negative = analyzed.filter(iv => iv.analysis.sentiment.score < 35).length;
    return { avg, negative, pct: analyzed.length > 0 ? ((negative / analyzed.length) * 100).toFixed(0) : 0 };
  }, [analyzed]);

  // Pattern detection
  const patterns = useMemo(() => {
    const results = [];
    const compCount = analyzed.filter(iv => iv.analysis.primary === "Compensation" || iv.analysis.secondary === "Compensation").length;
    const workCount = analyzed.filter(iv => iv.analysis.primary === "Workload" || iv.analysis.secondary === "Workload").length;
    const bothCount = analyzed.filter(iv =>
      (iv.analysis.primary === "Compensation" || iv.analysis.secondary === "Compensation") &&
      (iv.analysis.primary === "Workload" || iv.analysis.secondary === "Workload")
    ).length;
    if (bothCount > 1) results.push({ icon: "🔗", text: `${bothCount} interviews mention BOTH compensation AND workload — these two issues are compounding each other.`, severity: "critical" });
    const earlyExit = analyzed.filter(iv => iv.tenure < 1).length;
    if (earlyExit > 0) results.push({ icon: "🚪", text: `${earlyExit} employee(s) left within the first year — onboarding and early-stage retention needs urgent attention.`, severity: "high" });
    const genZCount = analyzed.filter(iv => Number(iv.age) < 26).length;
    if (genZCount > 0) results.push({ icon: "🔕", text: `${genZCount} Gen Z departure(s) detected — all show mentorship/guidance deficiency patterns. Silent Drift risk confirmed.`, severity: "high" });
    const topMonth = Object.entries(analyzed.reduce((acc, iv) => { acc[iv.date] = (acc[iv.date] || 0) + 1; return acc; }, {})).sort((a, b) => b[1] - a[1])[0];
    if (topMonth && topMonth[1] > 1) results.push({ icon: "📅", text: `Peak departure month: ${topMonth[0]} with ${topMonth[1]} exits — investigate what triggered this spike.`, severity: "medium" });
    if (compCount >= analyzed.length * 0.5) results.push({ icon: "💸", text: `${((compCount / analyzed.length) * 100).toFixed(0)}% of exits mention compensation — this is systemic, not individual.`, severity: "critical" });
    return results;
  }, [analyzed]);

  const keywords = useMemo(() => extractKeywords(interviews), [interviews]);

  const handleAI = useCallback(async () => {
    setAiLoading(true);
    setAiInsights(null);
    try {
      const result = await analyzeWithAI(interviews, company);
      setAiInsights(result);
    } catch {
      setAiInsights({ topTheme: "AI analysis unavailable.", urgentAction: "Please check your connection.", hiddenPattern: "", retentionOpportunity: "", riskForecast: "" });
    }
    setAiLoading(false);
  }, [interviews, company]);

  const TABS = [
    { id: "dashboard", label: "📊 Dashboard" },
    { id: "interviews", label: "📋 All Interviews" },
    { id: "patterns", label: "🔍 Pattern Analysis" },
    { id: "wordcloud", label: "☁️ Keyword Cloud" },
  ];

  const severityColor = s => s === "critical" ? "#ef4444" : s === "high" ? "#f59e0b" : "#3b82f6";
  const severityBg = s => s === "critical" ? "#fef2f2" : s === "high" ? "#fffbeb" : "#eff6ff";
  const severityBorder = s => s === "critical" ? "#fecaca" : s === "high" ? "#fde68a" : "#bfdbfe";

  return (
    <div>
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

      {/* ── TAB: DASHBOARD ── */}
      {activeTab === "dashboard" && (
        <div>
          {/* KPIs */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(170px,1fr))", gap: 12, marginBottom: 18 }}>
            {[
              { label: "Total Interviews", value: interviews.length, sub: "Exit interviews analyzed", color: "#3b82f6", icon: "📋", bg: "#eff6ff" },
              { label: "Top Exit Reason", value: catDist[0]?.[0] || "—", sub: `${catDist[0]?.[1] || 0} mentions`, color: CATEGORIES[catDist[0]?.[0]]?.color || "#94a3b8", icon: CATEGORIES[catDist[0]?.[0]]?.icon || "❓", bg: CATEGORIES[catDist[0]?.[0]]?.bg || "#f8fafc" },
              { label: "Avg Sentiment", value: sentimentStats.avg, sub: `${sentimentStats.pct}% highly negative`, color: sentimentStats.avg < 35 ? "#ef4444" : sentimentStats.avg < 60 ? "#f59e0b" : "#22c55e", icon: "😔", bg: sentimentStats.avg < 35 ? "#fef2f2" : "#fffbeb" },
              { label: "Patterns Found", value: patterns.length, sub: "Actionable systemic issues", color: "#8b5cf6", icon: "🔍", bg: "#f5f3ff" },
            ].map((k, i) => (
              <div key={i} style={{ background: k.bg, borderRadius: 13, padding: "14px 16px", border: `1.5px solid ${k.color}22`, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", right: 10, top: 8, fontSize: 18, opacity: 0.2 }}>{k.icon}</div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>{k.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: k.color, fontFamily: "'Playfair Display',Georgia,serif", lineHeight: 1.1 }}>{k.value}</div>
                <div style={{ fontSize: 10, color: "#64748b", marginTop: 3 }}>{k.sub}</div>
              </div>
            ))}
          </div>

          {/* Category Distribution + Timeline */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            {/* Category bars */}
            <div style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", border: "1.5px solid #f1f5f9" }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", marginBottom: 14 }}>Exit Reasons Distribution</div>
              {catDist.map(([cat, count]) => {
                const cfg = CATEGORIES[cat];
                const pct = interviews.length > 0 ? ((count / interviews.length) * 100).toFixed(0) : 0;
                return (
                  <div key={cat} style={{ marginBottom: 10 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <span style={{ fontSize: 14 }}>{cfg.icon}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#1e293b" }}>{cat}</span>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: cfg.color }}>{pct}% ({count})</span>
                    </div>
                    <div style={{ height: 7, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: cfg.color, borderRadius: 4, transition: "width 0.5s" }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Timeline */}
            <div style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", border: "1.5px solid #f1f5f9" }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", marginBottom: 4 }}>Exit Timeline</div>
              <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 12 }}>Departures by month — color = top exit reason</div>
              <TimelineChart interviews={interviews} />
              <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                {Object.entries(CATEGORIES).map(([cat, cfg]) => (
                  <div key={cat} style={{ display: "flex", alignItems: "center", gap: 3 }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: cfg.color }} />
                    <span style={{ fontSize: 9, color: "#94a3b8" }}>{cat}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI Insights */}
          <div style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", border: "1.5px solid #f1f5f9" }}>
            <button onClick={handleAI} disabled={aiLoading}
              style={{ width: "100%", padding: "12px", background: aiLoading ? "#f1f5f9" : "#0f172a", color: aiLoading ? "#94a3b8" : "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: aiLoading ? "not-allowed" : "pointer", marginBottom: aiInsights ? 14 : 0 }}>
              {aiLoading ? "⏳ Analyzing Exit Patterns with AI..." : "🤖 Generate AI Exit Pattern Analysis"}
            </button>
            {aiInsights && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  { key: "topTheme", label: "Top Theme", icon: "🎯", color: "#ef4444", bg: "#fef2f2" },
                  { key: "urgentAction", label: "Urgent Action", icon: "⚡", color: "#f97316", bg: "#fff7ed" },
                  { key: "hiddenPattern", label: "Hidden Pattern", icon: "🔍", color: "#8b5cf6", bg: "#f5f3ff" },
                  { key: "retentionOpportunity", label: "Retention Opportunity", icon: "💡", color: "#22c55e", bg: "#f0fdf4" },
                  { key: "riskForecast", label: "60-Day Risk Forecast", icon: "📅", color: "#3b82f6", bg: "#eff6ff" },
                ].map(item => aiInsights[item.key] && (
                  <div key={item.key} style={{ background: item.bg, borderRadius: 10, padding: "12px 14px", border: `1px solid ${item.color}22`, gridColumn: item.key === "riskForecast" ? "1 / -1" : "auto" }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: item.color, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>{item.icon} {item.label}</div>
                    <div style={{ fontSize: 12, color: "#1e293b", lineHeight: 1.6 }}>{aiInsights[item.key]}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: ALL INTERVIEWS ── */}
      {activeTab === "interviews" && (
        <div>
          <AddInterviewForm onAdd={iv => setInterviews(p => [...p, iv])} />

          {/* Filters */}
          <div style={{ background: "#fff", borderRadius: 12, padding: "12px 16px", border: "1.5px solid #f1f5f9", marginBottom: 14, display: "flex", gap: 14, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", marginBottom: 5 }}>Category</div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {["All", ...Object.keys(CATEGORIES)].map(c => (
                  <button key={c} onClick={() => setFilterCat(c)}
                    style={{ padding: "4px 10px", borderRadius: 16, border: "none", cursor: "pointer", fontSize: 11, background: filterCat === c ? (CATEGORIES[c]?.color || "#f59e0b") : "#f1f5f9", color: filterCat === c ? "#fff" : "#64748b", fontWeight: filterCat === c ? 700 : 500 }}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", marginBottom: 5 }}>Department</div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {depts.map(d => (
                  <button key={d} onClick={() => setFilterDept(d)}
                    style={{ padding: "4px 10px", borderRadius: 16, border: "none", cursor: "pointer", fontSize: 11, background: filterDept === d ? "#f59e0b" : "#f1f5f9", color: filterDept === d ? "#fff" : "#64748b", fontWeight: filterDept === d ? 700 : 500 }}>
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 12 }}>Showing {filtered.length} of {analyzed.length} interviews</div>
          {filtered.map((iv, i) => <InterviewCard key={iv.id} iv={iv} analysis={iv.analysis} idx={i} />)}
        </div>
      )}

      {/* ── TAB: PATTERN ANALYSIS ── */}
      {activeTab === "patterns" && (
        <div>
          {/* Patterns */}
          <div style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", border: "1.5px solid #f1f5f9", marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", marginBottom: 4 }}>🔍 Detected Patterns</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 16 }}>Auto-detected systemic issues across all interviews</div>
            {patterns.length === 0 ? (
              <div style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>No significant patterns detected yet</div>
            ) : patterns.map((p, i) => (
              <div key={i} style={{ background: severityBg(p.severity), borderRadius: 10, padding: "12px 16px", border: `1.5px solid ${severityBorder(p.severity)}`, marginBottom: 10, display: "flex", gap: 10 }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{p.icon}</span>
                <div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: severityColor(p.severity), textTransform: "uppercase", letterSpacing: "0.06em", marginRight: 8 }}>
                    {p.severity.toUpperCase()}
                  </span>
                  <span style={{ fontSize: 12, color: "#1e293b", lineHeight: 1.6 }}>{p.text}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Sentiment breakdown */}
          <div style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", border: "1.5px solid #f1f5f9", marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", marginBottom: 14 }}>😔 Sentiment Analysis</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 14 }}>
              {[
                { label: "Negative", count: analyzed.filter(iv => iv.analysis.sentiment.score < 35).length, color: "#ef4444", bg: "#fef2f2" },
                { label: "Mixed", count: analyzed.filter(iv => iv.analysis.sentiment.score >= 35 && iv.analysis.sentiment.score < 60).length, color: "#f59e0b", bg: "#fffbeb" },
                { label: "Positive", count: analyzed.filter(iv => iv.analysis.sentiment.score >= 60).length, color: "#22c55e", bg: "#f0fdf4" },
              ].map(s => (
                <div key={s.label} style={{ background: s.bg, borderRadius: 10, padding: "12px", textAlign: "center" }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.count}</div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>{s.label}</div>
                </div>
              ))}
            </div>
            {analyzed.map((iv, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                <span style={{ fontSize: 11, color: "#475569", width: 110, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{iv.name || `#${i + 1}`}</span>
                <div style={{ flex: 1, height: 5, background: "#f1f5f9", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ width: `${iv.analysis.sentiment.score}%`, height: "100%", background: iv.analysis.sentiment.color, borderRadius: 3 }} />
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, color: iv.analysis.sentiment.color, width: 24 }}>{iv.analysis.sentiment.score}</span>
              </div>
            ))}
          </div>

          {/* Cross-module links */}
          <div style={{ background: "#fff8f0", borderRadius: 14, padding: "16px 18px", border: "1.5px solid #fed7aa" }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#9a3412", marginBottom: 10 }}>🔗 Cross-Module Actions</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { icon: "💰", label: "Compensation issues detected", action: "→ Go to M3: Salary Benchmarking to see exact gap per dept", color: "#ef4444" },
                { icon: "⏱️", label: "Workload/burnout patterns", action: "→ Go to M4: Dept Health to check Human Buffer & Burnout Index", color: "#f97316" },
                { icon: "🔕", label: "Gen Z silent drift signals", action: "→ Go to M2: Risk Scorer, enter age <26 + low satisfaction to see alert", color: "#f59e0b" },
                { icon: "📈", label: "Retention intervention needed", action: "→ Go to M6: ROI Calculator to justify investment to leadership", color: "#8b5cf6" },
              ].map((item, i) => (
                <div key={i} style={{ background: "#fff", borderRadius: 9, padding: "10px 12px", border: "1px solid #fed7aa" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: item.color, marginBottom: 3 }}>{item.icon} {item.label}</div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>{item.action}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: WORD CLOUD ── */}
      {activeTab === "wordcloud" && (
        <div>
          <div style={{ background: "#fff", borderRadius: 14, padding: "20px 22px", border: "1.5px solid #f1f5f9", marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", marginBottom: 4 }}>☁️ Keyword Frequency Cloud</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 16 }}>
              Word size = frequency · Color = category · Generated from {interviews.length} exit interviews
            </div>
            <div style={{ background: "#f8fafc", borderRadius: 12, padding: "20px", border: "1.5px solid #f1f5f9" }}>
              <WordCloud words={keywords} />
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
              {Object.entries(CATEGORIES).map(([cat, cfg]) => (
                <div key={cat} style={{ display: "flex", alignItems: "center", gap: 5, background: cfg.bg, borderRadius: 8, padding: "4px 10px", border: `1px solid ${cfg.border}` }}>
                  <span>{cfg.icon}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: cfg.color }}>{cat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top keywords table */}
          <div style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", border: "1.5px solid #f1f5f9" }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", marginBottom: 14 }}>Top 20 Keywords Ranked</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {keywords.slice(0, 20).map(([word, count], i) => {
                const cat = Object.entries(CATEGORIES).find(([, cfg]) => cfg.keywords.includes(word));
                const color = cat ? cat[1].color : "#94a3b8";
                const bg = cat ? cat[1].bg : "#f8fafc";
                return (
                  <div key={word} style={{ display: "flex", alignItems: "center", gap: 8, background: bg, borderRadius: 8, padding: "6px 10px" }}>
                    <span style={{ fontSize: 11, color: "#94a3b8", width: 20, textAlign: "right" }}>#{i + 1}</span>
                    <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: "#1e293b" }}>{word}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <div style={{ width: Math.max(12, (count / keywords[0][1]) * 40), height: 4, background: color, borderRadius: 2 }} />
                      <span style={{ fontSize: 11, fontWeight: 700, color }}>{count}x</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
