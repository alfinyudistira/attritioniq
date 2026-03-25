import { useState, useMemo, useCallback } from "react";
import { useApp, useHRData, useCurrency } from "../context/AppContext";

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
  const prompt = `You are an HR analyst at ${company?.name || "a company"}. Analyze these ${interviews.length} exit interviews and provide:

${summaries}

Respond in this exact JSON format (no markdown, no backticks):
{
  "topTheme": "One sentence: the single most dominant reason people are leaving",
  "urgentAction": "One sentence: the single most urgent action leadership must take in the next 30 days",
  "hiddenPattern": "One sentence: a non-obvious pattern that connects multiple exit interviews",
  "retentionOpportunity": "One sentence: what would have convinced the most people to stay",
  "riskForecast": "One sentence: what will happen in the next 60 days if nothing changes"
}`;

  const response = await fetch("https://gemini-api-amber-iota.vercel.app/api/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: [{ content: prompt }] }),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  const text = data.content?.[0]?.text || data.text || data.response || "{}";
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

  // Retention probability — could they have been saved?
  // High if: mainly salary/workload (fixable), positive mentions, no "already accepted"
  let retentionProbability = 50;
  if (primary === "Compensation" || primary === "Workload") retentionProbability += 20;
  if (primary === "Career" || primary === "Management") retentionProbability += 10;
  if (lower.includes("would have stayed") || lower.includes("could have stayed")) retentionProbability += 15;
  if (lower.includes("already accepted") || lower.includes("toxic") || lower.includes("hostile")) retentionProbability -= 25;
  if (sentiment.score >= 50) retentionProbability += 10;
  if (lower.includes("no future") || lower.includes("last straw")) retentionProbability -= 20;
  retentionProbability = Math.min(90, Math.max(5, retentionProbability));

  return { primary, secondary, scores, sentiment, retentionProbability };
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
function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function WordCloud({ words }) {
  if (!words || words.length === 0) return null;
  const max = words[0]?.[1] || 1;

  const positions = useMemo(() => {
    const rand = seededRandom(
      words.slice(0, 10).reduce((acc, [w]) => acc + w.charCodeAt(0), 42)
    );
    const placed = [];
    const result = [];
    words.slice(0, 30).forEach(([word, count]) => {
      const fontSize = Math.max(10, Math.min(28, (count / max) * 28));
      const color = Object.values(CATEGORIES).find(c => c.keywords.includes(word))?.color || "#94a3b8";
      let x, y, attempts = 0;
      do {
        x = 20 + rand() * 360;
        y = 20 + rand() * 150;
        attempts++;
      } while (attempts < 30 && placed.some(p => Math.abs(p.x - x) < word.length * fontSize * 0.5 && Math.abs(p.y - y) < fontSize * 1.5));
      placed.push({ x, y });
      result.push({ word, count, fontSize, color, x, y });
    });
    return result;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [words]);

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

      {/* Dual bars: Sentiment + Retention Probability */}
      <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 9, color: "#94a3b8", width: 80, flexShrink: 0 }}>Sentiment</span>
          <div style={{ flex: 1, height: 4, background: "#f1f5f9", borderRadius: 2, overflow: "hidden" }}>
            <div style={{ width: `${analysis.sentiment.score}%`, height: "100%", background: analysis.sentiment.color, borderRadius: 2 }} />
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, color: analysis.sentiment.color, width: 28 }}>{analysis.sentiment.score}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 9, color: "#94a3b8", width: 80, flexShrink: 0 }}>Retainable</span>
          <div style={{ flex: 1, height: 4, background: "#f1f5f9", borderRadius: 2, overflow: "hidden" }}>
            <div style={{ width: `${analysis.retentionProbability}%`, height: "100%", background: analysis.retentionProbability >= 60 ? "#22c55e" : analysis.retentionProbability >= 35 ? "#f59e0b" : "#ef4444", borderRadius: 2 }} />
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, color: analysis.retentionProbability >= 60 ? "#22c55e" : analysis.retentionProbability >= 35 ? "#f59e0b" : "#ef4444", width: 28 }}>{analysis.retentionProbability}%</span>
        </div>
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
function AddInterviewForm({ onAdd, deptOptions = [], currSymbol = "$" }) {
  const [form, setForm] = useState({ name: "", dept: deptOptions[0] || "Sales", date: new Date().toISOString().slice(0,7), tenure: 1, salary: 0, age: 27, text: "" });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const depts = deptOptions.length > 0 ? deptOptions : ["Sales", "Technical Support", "IT", "HR", "Digital Marketing", "Operations", "Finance", "Other"];

  return (
    <div style={{ background: "#f8fafc", borderRadius: 13, padding: "16px 18px", border: "1.5px solid #e2e8f0", marginBottom: 16 }}>
      <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", marginBottom: 12 }}>➕ Add Exit Interview</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
        {[
          { label: "Name", key: "name", type: "text", placeholder: "Anonymous" },
          { label: "Dept", key: "dept", type: "select" },
          { label: "Date (YYYY-MM)", key: "date", type: "text", placeholder: "2024-10" },
          { label: "Tenure (yrs)", key: "tenure", type: "number" },
          { label: `Monthly Salary (${currSymbol})`, key: "salary", type: "number" },
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
  const { company } = useApp();
  const { data } = useHRData();
  const { fmt, config: cfg } = useCurrency();
  const currSymbol = cfg?.symbol || "$";
  const [interviews, setInterviews]     = useState(SAMPLE_INTERVIEWS);
  const [activeTab, setActiveTab]       = useState("dashboard");
  const [aiInsights, setAiInsights]     = useState(null);
  const [aiLoading, setAiLoading]       = useState(false);
  const [filterCat, setFilterCat]       = useState("All");
  const [filterDept, setFilterDept]     = useState("All");
  const [search, setSearch]             = useState("");
  const [compareA, setCompareA]         = useState(null);
  const [compareB, setCompareB]         = useState(null);
  const [showCompare, setShowCompare]   = useState(false);

  // Auto dept list from HR data
  const deptOptions = useMemo(() => {
    const fromData = [...new Set(data.map(d => d.Department).filter(Boolean))];
    return fromData.length > 0 ? fromData : ["Sales","Technical Support","IT","HR","Digital Marketing","Operations","Finance","Other"];
  }, [data]);
  const analyzed = useMemo(() => interviews.map(iv => ({
    ...iv, analysis: categorizeInterview(iv.text)
  })), [interviews]);

  const filtered = useMemo(() => analyzed.filter(iv => {
    if (filterCat !== "All" && iv.analysis.primary !== filterCat) return false;
    if (filterDept !== "All" && iv.dept !== filterDept) return false;
    if (search && !`${iv.name} ${iv.dept} ${iv.text}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [analyzed, filterCat, filterDept, search]);

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
    if (analyzed.length === 0) return [];
    const results = [];

    // Pattern 1: Compound issues
    const compCount = analyzed.filter(iv => iv.analysis.primary === "Compensation" || iv.analysis.secondary === "Compensation").length;
    const workCount = analyzed.filter(iv => iv.analysis.primary === "Workload" || iv.analysis.secondary === "Workload").length;
    const bothCount = analyzed.filter(iv =>
      (iv.analysis.primary === "Compensation" || iv.analysis.secondary === "Compensation") &&
      (iv.analysis.primary === "Workload" || iv.analysis.secondary === "Workload")
    ).length;
    if (bothCount > 1) results.push({ icon: "🔗", text: `${bothCount} interviews mention BOTH compensation AND workload — compounding effect. Fixing one alone won't stop the exodus.`, severity: "critical" });

    // Pattern 2: Early exits
    const earlyExit = analyzed.filter(iv => (iv.tenure || 0) < 1).length;
    if (earlyExit > 0) results.push({ icon: "🚪", text: `${earlyExit} employee(s) left within first year — onboarding failure or role mismatch. Cost: ${earlyExit}× full replacement fee with zero productivity return.`, severity: "high" });

    // Pattern 3: Gen Z silent drift
    const genZCount = analyzed.filter(iv => Number(iv.age) < 26).length;
    if (genZCount > 0) results.push({ icon: "🔕", text: `${genZCount} Gen Z departure(s) — mentorship/guidance deficiency confirmed. Silent Drift pattern: they disengaged months before resigning.`, severity: "high" });

    // Pattern 4: Peak departure month
    const monthMap = analyzed.reduce((acc, iv) => { acc[iv.date] = (acc[iv.date] || 0) + 1; return acc; }, {});
    const topMonth = Object.entries(monthMap).sort((a, b) => b[1] - a[1])[0];
    if (topMonth && topMonth[1] > 1) results.push({ icon: "📅", text: `Peak departure: ${topMonth[0]} with ${topMonth[1]} exits — investigate trigger event (policy change? performance review cycle? manager change?).`, severity: "medium" });

    // Pattern 5: Systemic compensation
    if (compCount >= analyzed.length * 0.5) results.push({ icon: "💸", text: `${((compCount / analyzed.length) * 100).toFixed(0)}% of exits cite compensation — this is organizational failure, not individual negotiation failure.`, severity: "critical" });

    // Pattern 6: High retainable exits
    const retainable = analyzed.filter(iv => iv.analysis.retentionProbability >= 60).length;
    if (retainable > 0) results.push({ icon: "💔", text: `${retainable} exit(s) had ≥60% retention probability — meaning they were preventable. Estimated cost: ${retainable} × replacement fees lost unnecessarily.`, severity: "high" });

    // Pattern 7: Single dept overrepresented
    const deptCounts = analyzed.reduce((acc, iv) => { acc[iv.dept] = (acc[iv.dept] || 0) + 1; return acc; }, {});
    const topDept = Object.entries(deptCounts).sort((a, b) => b[1] - a[1])[0];
    if (topDept && topDept[1] >= Math.ceil(analyzed.length * 0.4) && analyzed.length >= 3) {
      results.push({ icon: "🏢", text: `${topDept[0]} accounts for ${topDept[1]} of ${analyzed.length} exits (${((topDept[1]/analyzed.length)*100).toFixed(0)}%) — dept-specific crisis, not company-wide.`, severity: topDept[1] >= analyzed.length * 0.6 ? "critical" : "high" });
    }

    // Pattern 8: Manager/leadership theme
    const mgmtCount = analyzed.filter(iv => iv.analysis.primary === "Management" || iv.analysis.secondary === "Management").length;
    if (mgmtCount >= 2) results.push({ icon: "👤", text: `${mgmtCount} exits cite management issues — check if this clusters around specific managers. One bad manager can trigger cascade resignations.`, severity: mgmtCount >= 3 ? "critical" : "high" });

    // Pattern 9: Career stagnation
    const careerCount = analyzed.filter(iv => iv.analysis.primary === "Career").length;
    if (careerCount >= 2) results.push({ icon: "📈", text: `${careerCount} exits cite lack of career growth — these are your highest-potential employees leaving. Create visible promotion paths immediately.`, severity: "medium" });

    // Pattern 10: Overtime cluster
    if (workCount >= analyzed.length * 0.4) results.push({ icon: "⏱️", text: `${workCount} exits mention unsustainable workload — ${((workCount/analyzed.length)*100).toFixed(0)}% of your departures are burnout-driven. Headcount addition is now a retention strategy.`, severity: workCount >= analyzed.length * 0.6 ? "critical" : "high" });

    return results.sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2 };
      return order[a.severity] - order[b.severity];
    });
  }, [analyzed]);

  const keywords = useMemo(() => extractKeywords(interviews), [interviews]);
// Persona clustering
  const personaClusters = useMemo(() => {
    const clusters = {
      "💸 The Underpaid Performer": analyzed.filter(iv => iv.analysis.primary === "Compensation" && iv.analysis.sentiment.score >= 35),
      "🔥 The Burned-Out Worker": analyzed.filter(iv => iv.analysis.primary === "Workload" || (iv.analysis.secondary === "Workload" && iv.analysis.scores["Workload"] >= 2)),
      "🔕 The Silent Drifter": analyzed.filter(iv => Number(iv.age) < 26 && iv.analysis.sentiment.score < 40),
      "📈 The Blocked Climber": analyzed.filter(iv => iv.analysis.primary === "Career"),
      "👤 The Manager Victim": analyzed.filter(iv => iv.analysis.primary === "Management" || iv.analysis.secondary === "Management"),
      "🚪 The Early Quitter": analyzed.filter(iv => (iv.tenure || 0) < 1),
    };
    return Object.entries(clusters).filter(([, members]) => members.length > 0);
  }, [analyzed]);

  // Avg retention probability
  const avgRetentionProbability = useMemo(() => {
    if (analyzed.length === 0) return 0;
    return Math.round(analyzed.reduce((s, iv) => s + iv.analysis.retentionProbability, 0) / analyzed.length);
  }, [analyzed]);

  // Export interviews as CSV
  const exportCSV = useCallback(() => {
    const headers = ["Name","Department","Date","Tenure","Salary","Age","Primary Reason","Secondary Reason","Sentiment Score","Sentiment Label","Retention Probability","Text Preview"];
    const rows = analyzed.map(iv => [
      iv.name || "Anonymous", iv.dept, iv.date, iv.tenure, iv.salary, iv.age,
      iv.analysis.primary, iv.analysis.secondary || "",
      iv.analysis.sentiment.score, iv.analysis.sentiment.label,
      iv.analysis.retentionProbability,
      `"${(iv.text || "").slice(0, 100).replace(/"/g, "'")}"`
    ].join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `exit_interviews_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }, [analyzed]);
  
  const handleAI = useCallback(async () => {
    setAiLoading(true);
    setAiInsights(null);
    try {
      const result = await analyzeWithAI(interviews, company);
      if (!result) throw new Error("AI returned empty response");
      setAiInsights(result);
    } catch (err) {
      setAiInsights({
        topTheme: `AI unavailable: ${err?.message || "Check connection"}`,
        urgentAction: "Please retry — if issue persists, check Vercel proxy status.",
        hiddenPattern: "", retentionOpportunity: "", riskForecast: "",
      });
    } finally {
      setAiLoading(false);
    }
  }, [interviews, company]);

  const TABS = [
    { id: "dashboard",  label: "📊 Dashboard" },
    { id: "interviews", label: "📋 All Interviews" },
    { id: "patterns",   label: "🔍 Patterns" },
    { id: "personas",   label: "🎭 Personas" },
    { id: "compare",    label: "⚖️ Compare" },
    { id: "wordcloud",  label: "☁️ Keywords" },
    { id: "export",     label: "📤 Export" },
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
            { label: "Avg Retainable", value: `${avgRetentionProbability}%`, sub: "Could have been prevented", color: avgRetentionProbability >= 60 ? "#22c55e" : avgRetentionProbability >= 35 ? "#f59e0b" : "#ef4444", icon: "💔", bg: avgRetentionProbability >= 60 ? "#f0fdf4" : "#fef2f2" },
            ].map((k) => (
              <div key={k.label} style={{ background: k.bg, borderRadius: 13, padding: "14px 16px", border: `1.5px solid ${k.color}22`, position: "relative", overflow: "hidden" }}>
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
          <AddInterviewForm onAdd={iv => setInterviews(p => [...p, iv])} deptOptions={deptOptions} currSymbol={currSymbol} />

          {/* Search */}
          <div style={{ marginBottom: 10 }}>
            <input
              type="text"
              placeholder="🔍 Search by name, department, or keyword in interview text..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: "100%", padding: "9px 14px", borderRadius: 9, border: "1.5px solid #e2e8f0", fontSize: 12, color: "#1e293b", background: "#f8fafc", outline: "none", boxSizing: "border-box" }}
            />
          </div>                 

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
              <div key={`${p.severity}-${i}`} style={{ background: severityBg(p.severity), borderRadius: 10,
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
            {analyzed.map((iv) => (
              <div key={iv.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
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

          {/* ── TAB: PERSONAS ── */}
      {activeTab === "personas" && (
        <div>
          <div style={{ background: "#fff", borderRadius: 14, padding: "20px 22px", border: "1.5px solid #f1f5f9", marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", marginBottom: 4 }}>🎭 Exit Persona Clusters</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 20 }}>
              Auto-grouped by behavioral patterns — each persona needs a different intervention strategy
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 14 }}>
              {personaClusters.map(([persona, members]) => {
                const topCat = members[0]?.analysis?.primary || "Culture";
                const cfg = CATEGORIES[topCat] || CATEGORIES["Culture"];
                const avgRetain = Math.round(members.reduce((s, iv) => s + iv.analysis.retentionProbability, 0) / members.length);
                return (
                  <div key={persona} style={{ background: cfg.bg, borderRadius: 13, padding: "16px 18px", border: `1.5px solid ${cfg.border}` }}>
                    <div style={{ fontWeight: 800, fontSize: 14, color: cfg.color, marginBottom: 6 }}>{persona}</div>
                    <div style={{ fontSize: 11, color: "#64748b", marginBottom: 12 }}>{members.length} employee(s) match this profile</div>

                    {/* Members */}
                    <div style={{ marginBottom: 12 }}>
                      {members.map((iv, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: i < members.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                          <span style={{ fontSize: 12, color: "#1e293b", fontWeight: 500 }}>{iv.name || "Anonymous"}</span>
                          <div style={{ display: "flex", gap: 6 }}>
                            <span style={{ fontSize: 10, color: "#94a3b8" }}>{iv.dept}</span>
                            <span style={{ fontSize: 10, fontWeight: 700, color: iv.analysis.retentionProbability >= 60 ? "#22c55e" : iv.analysis.retentionProbability >= 35 ? "#f59e0b" : "#ef4444" }}>
                              {iv.analysis.retentionProbability}% retainable
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Retention avg */}
                    <div style={{ background: "#fff", borderRadius: 8, padding: "8px 12px" }}>
                      <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 4 }}>Avg Retention Probability</div>
                      <div style={{ height: 5, background: "#f1f5f9", borderRadius: 3, overflow: "hidden", marginBottom: 3 }}>
                        <div style={{ width: `${avgRetain}%`, height: "100%", background: avgRetain >= 60 ? "#22c55e" : avgRetain >= 35 ? "#f59e0b" : "#ef4444", borderRadius: 3 }} />
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: avgRetain >= 60 ? "#22c55e" : avgRetain >= 35 ? "#f59e0b" : "#ef4444" }}>
                        {avgRetain}% — {avgRetain >= 60 ? "Most were preventable" : avgRetain >= 35 ? "Some were preventable" : "Hard to retain"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: COMPARE ── */}
      {activeTab === "compare" && (
        <div>
          <div style={{ background: "#fff", borderRadius: 14, padding: "20px 22px", border: "1.5px solid #f1f5f9", marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", marginBottom: 4 }}>⚖️ Interview Comparison</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 16 }}>Select two interviews to compare side-by-side</div>

            {/* Selectors */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              {[{ label: "Interview A", val: compareA, setter: setCompareA }, { label: "Interview B", val: compareB, setter: setCompareB }].map(({ label, val, setter }) => (
                <div key={label}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
                  <select value={val || ""} onChange={e => setter(Number(e.target.value) || null)}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 9, border: "1.5px solid #e2e8f0", fontSize: 12, color: "#1e293b", background: "#f8fafc" }}>
                    <option value="">— Select interview —</option>
                    {analyzed.map((iv, i) => (
                      <option key={i} value={i}>{iv.name || `Anonymous #${i+1}`} · {iv.dept}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {/* Comparison output */}
            {compareA !== null && compareB !== null && analyzed[compareA] && analyzed[compareB] && (() => {
              const a = analyzed[compareA], b = analyzed[compareB];
              const rows = [
                { label: "Name", va: a.name || "Anonymous", vb: b.name || "Anonymous" },
                { label: "Department", va: a.dept, vb: b.dept },
                { label: "Tenure", va: `${a.tenure}y`, vb: `${b.tenure}y` },
                { label: "Age", va: a.age, vb: b.age },
                { label: "Primary Reason", va: a.analysis.primary, vb: b.analysis.primary },
                { label: "Secondary Reason", va: a.analysis.secondary || "—", vb: b.analysis.secondary || "—" },
                { label: "Sentiment Score", va: a.analysis.sentiment.score, vb: b.analysis.sentiment.score },
                { label: "Retention Probability", va: `${a.analysis.retentionProbability}%`, vb: `${b.analysis.retentionProbability}%` },
              ];
              return (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: "#f8fafc" }}>
                        {["Metric", a.name || "Interview A", b.name || "Interview B"].map(h => (
                          <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: "#64748b", fontWeight: 700, fontSize: 10, textTransform: "uppercase", borderBottom: "2px solid #f1f5f9" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, i) => (
                        <tr key={row.label} style={{ borderBottom: "1px solid #f8fafc", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                          <td style={{ padding: "8px 12px", fontWeight: 600, color: "#475569" }}>{row.label}</td>
                          <td style={{ padding: "8px 12px", color: "#1e293b" }}>{row.va}</td>
                          <td style={{ padding: "8px 12px", color: "#1e293b" }}>{row.vb}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Text comparison */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
                    {[a, b].map((iv, i) => (
                      <div key={i} style={{ background: "#f8fafc", borderRadius: 10, padding: "14px 16px", border: "1px solid #e2e8f0" }}>
                        <div style={{ fontWeight: 700, fontSize: 12, color: "#0f172a", marginBottom: 8 }}>{iv.name || `Interview ${i === 0 ? "A" : "B"}`}</div>
                        <div style={{ fontSize: 11, color: "#475569", lineHeight: 1.6, fontStyle: "italic" }}>"{iv.text.slice(0, 200)}..."</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ── TAB: EXPORT ── */}
      {activeTab === "export" && (
        <div>
          <div style={{ background: "#fff", borderRadius: 14, padding: "20px 22px", border: "1.5px solid #f1f5f9", marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", marginBottom: 4 }}>📤 Export Exit Interview Data</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 20 }}>
              Full dataset with AI categorization, sentiment scores, and retention probability
            </div>

            {/* Preview */}
            <div style={{ overflowX: "auto", marginBottom: 20 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {["Name","Dept","Date","Tenure","Primary Reason","Sentiment","Retainable"].map(h => (
                      <th key={h} style={{ padding: "7px 10px", textAlign: "left", color: "#64748b", fontWeight: 700, fontSize: 10, textTransform: "uppercase", borderBottom: "2px solid #f1f5f9", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {analyzed.map((iv) => (
                    <tr key={iv.id} style={{ borderBottom: "1px solid #f8fafc" }}>
                      <td style={{ padding: "7px 10px", fontWeight: 600, color: "#1e293b" }}>{iv.name || "Anonymous"}</td>
                      <td style={{ padding: "7px 10px", color: "#475569" }}>{iv.dept}</td>
                      <td style={{ padding: "7px 10px", color: "#94a3b8" }}>{iv.date}</td>
                      <td style={{ padding: "7px 10px", color: "#64748b" }}>{iv.tenure}y</td>
                      <td style={{ padding: "7px 10px" }}>
                        <span style={{ background: CATEGORIES[iv.analysis.primary]?.bg, color: CATEGORIES[iv.analysis.primary]?.color, padding: "2px 7px", borderRadius: 10, fontSize: 10, fontWeight: 700 }}>
                          {CATEGORIES[iv.analysis.primary]?.icon} {iv.analysis.primary}
                        </span>
                      </td>
                      <td style={{ padding: "7px 10px" }}>
                        <span style={{ fontWeight: 700, color: iv.analysis.sentiment.color }}>{iv.analysis.sentiment.score}</span>
                      </td>
                      <td style={{ padding: "7px 10px" }}>
                        <span style={{ fontWeight: 700, color: iv.analysis.retentionProbability >= 60 ? "#22c55e" : iv.analysis.retentionProbability >= 35 ? "#f59e0b" : "#ef4444" }}>
                          {iv.analysis.retentionProbability}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button onClick={exportCSV}
                style={{ padding: "12px 24px", borderRadius: 11, border: "none", background: "linear-gradient(135deg,#f59e0b,#ef4444)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                ⬇ Export Full CSV ({analyzed.length} interviews)
              </button>
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f0fdf4", borderRadius: 10, padding: "10px 16px", border: "1px solid #bbf7d0" }}>
                <span style={{ fontSize: 16 }}>💔</span>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#166534" }}>Preventable Exits</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#15803d" }}>
                    {analyzed.filter(iv => iv.analysis.retentionProbability >= 60).length} of {analyzed.length} were retainable
                    </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
);
}
