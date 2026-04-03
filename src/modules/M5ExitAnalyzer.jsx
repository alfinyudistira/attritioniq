import { useState, useMemo, useCallback } from "react";
import { useApp, useHRData, useCurrency } from "../context/AppContext";
import { useModuleData } from "../context/ModuleDataContext";

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
  const summaries = interviews.map(i => {
    const preview = i.text.length > 200 ? i.text.slice(0, 200) + "..." : i.text;
    return `[${i.dept}] "${preview}"`;
  }).join("\n\n");
  
  const prompt = `You are an HR analyst at ${company?.name || "a company"}. Analyze these ${interviews.length} exit interviews and provide: ${summaries}

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
      const fontSize = Math.max(12, Math.min(32, (count / max) * 32));
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
  }, [words]);

  return (
    <svg width="100%" viewBox="0 0 400 180" className="overflow-visible">
      {positions.map((p, i) => (
        <text 
          key={i} x={p.x} y={p.y} 
          fontSize={p.fontSize} fill={p.color}
          className={`font-body transition-all duration-300 hover:opacity-100 hover:scale-110 cursor-default ${p.count > 2 ? 'font-bold' : 'font-medium'}`}
          opacity={0.85}
          style={{ transformOrigin: `${p.x}px ${p.y}px` }}
        >
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
  const W = 400, H = 140, pad = { l: 28, r: 8, t: 20, b: 28 };
  const bW = Math.min(40, Math.floor((W - pad.l - pad.r) / months.length) - 8);

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="overflow-visible block">
      <defs>
        <filter id="timeline-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#0f172a" floodOpacity="0.08" />
        </filter>
      </defs>
      
      {months.map(([month, data], i) => {
        const x = pad.l + i * ((W - pad.l - pad.r) / months.length) + 4;
        const bh = Math.max(4, (data.total / max) * (H - pad.t - pad.b));
        const topCat = Object.entries(data.cats).sort((a, b) => b[1] - a[1])[0]?.[0] || "Culture";
        const color = CATEGORIES[topCat]?.color || "#94a3b8";
        
        return (
          <g key={month} className="group">
            <rect 
              x={x} y={H - pad.b - bh} width={bW} height={bh} rx={4} 
              fill={color} opacity={0.9} filter="url(#timeline-shadow)"
              className="transition-all duration-300 group-hover:opacity-100 cursor-crosshair"
            />
            {/* Highlight tipis */}
            <rect x={x} y={H - pad.b - bh} width={bW} height={bh * 0.3} rx={4} fill="white" opacity={0.15} className="pointer-events-none" />
            
            <text x={x + bW / 2} y={H - pad.b - bh - 6} textAnchor="middle" fontSize={10} fill="#1e293b" fontWeight="800">{data.total}</text>
            <text x={x + bW / 2} y={H - 10} textAnchor="middle" fontSize={9} fill="#64748b" fontWeight="600">{month.slice(5)}</text>
          </g>
        );
      })}
      <line x1={pad.l} y1={H - pad.b} x2={W - pad.r} y2={H - pad.b} stroke="#e2e8f0" strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  );
}

// ── Single interview card ──
function InterviewCard({ iv, analysis, idx }) {
  const [expanded, setExpanded] = useState(false);
  const cat = CATEGORIES[analysis.primary];
  const secCat = analysis.secondary ? CATEGORIES[analysis.secondary] : null;

  return (
    <div className="bg-white rounded-[14px] p-[16px_18px] mb-3 shadow-sm" style={{ border: `1.5px solid ${cat.border}` }}>
      <div className="flex justify-between items-start mb-3 gap-2 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0" style={{ background: cat.bg }}>
            {cat.icon}
          </div>
          <div>
            <div className="font-bold text-[13px] text-brand-dark leading-tight">{iv.name || `Anonymous #${idx + 1}`}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">{iv.dept} · {iv.date} · {iv.tenure}y tenure</div>
          </div>
        </div>
        <div className="flex gap-1.5 items-center flex-wrap justify-end">
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold border" style={{ background: cat.bg, color: cat.color, borderColor: cat.border }}>
            {cat.icon} {analysis.primary}
          </span>
          {secCat && (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold border" style={{ background: secCat.bg, color: secCat.color, borderColor: secCat.border }}>
              {secCat.icon} {analysis.secondary}
            </span>
          )}
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold" style={{ background: analysis.sentiment.score >= 60 ? "#f0fdf4" : analysis.sentiment.score >= 35 ? "#fffbeb" : "#fef2f2", color: analysis.sentiment.color }}>
            {analysis.sentiment.label}
          </span>
        </div>
      </div>

      {/* Dual bars: Sentiment + Retention Probability */}
      <div className="flex flex-col gap-1.5 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400 w-20 shrink-0 font-semibold">Sentiment</span>
          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${analysis.sentiment.score}%`, background: analysis.sentiment.color }} />
          </div>
          <span className="text-[10px] font-bold w-7 text-right" style={{ color: analysis.sentiment.color }}>{analysis.sentiment.score}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400 w-20 shrink-0 font-semibold">Retainable</span>
          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${analysis.retentionProbability}%`, background: analysis.retentionProbability >= 60 ? "#22c55e" : analysis.retentionProbability >= 35 ? "#f59e0b" : "#ef4444" }} />
          </div>
          <span className="text-[10px] font-bold w-7 text-right" style={{ color: analysis.retentionProbability >= 60 ? "#22c55e" : analysis.retentionProbability >= 35 ? "#f59e0b" : "#ef4444" }}>{analysis.retentionProbability}%</span>
        </div>
      </div>

      {/* Text preview */}
      <div className="text-[13px] text-slate-600 leading-relaxed italic border-l-2 pl-3 border-slate-200">
        "{expanded ? iv.text : iv.text.slice(0, 120) + (iv.text.length > 120 ? "..." : "")}"
      </div>
      {iv.text.length > 120 && (
        <button onClick={() => setExpanded(e => !e)}
          className="bg-transparent border-none text-brand-amber text-[11px] font-bold cursor-pointer mt-1.5 p-0 hover:text-amber-600 transition-colors">
          {expanded ? "Show less ↑" : "Read full interview ↓"}
        </button>
      )}

      {/* Category keyword hits */}
      <div className="mt-3 flex gap-1.5 flex-wrap">
        {Object.entries(CATEGORIES).map(([catName, cfg]) => {
          const hits = cfg.keywords.filter(kw => iv.text.toLowerCase().includes(kw));
          if (hits.length === 0) return null;
          return hits.slice(0, 2).map(kw => (
            <span key={kw} className="px-2 py-0.5 rounded-[10px] text-[9px] font-bold tracking-wide" style={{ background: cfg.bg, color: cfg.color }}>
              #{kw}
            </span>
          ));
        })}
      </div>
    </div>
  );
}

// ── Input form for new interview ──
function AddInterviewForm({ onAdd, deptOptions = [], currSymbol = "$" }) {
  const [form, setForm] = useState(() => {
    const d = new Date();
    const localDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return { name: "", dept: deptOptions[0] || "Sales", date: localDate, tenure: 1, salary: 0, age: 27, text: "" };
  });
  
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const depts = deptOptions.length > 0 ? deptOptions : ["Sales", "Technical Support", "IT", "HR", "Digital Marketing", "Operations", "Finance", "Other"];

  return (
    <div className="bg-slate-50 rounded-[14px] p-[18px_20px] border-[1.5px] border-slate-200 mb-4">
      <div className="font-bold text-[13px] text-brand-dark mb-3">➕ Add Exit Interview</div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
        {[
          { label: "Name", key: "name", type: "text", placeholder: "Anonymous" },
          { label: "Dept", key: "dept", type: "select" },
          { label: "Date (YYYY-MM)", key: "date", type: "text", placeholder: "2024-10" },
          { label: "Tenure (yrs)", key: "tenure", type: "number" },
          { label: `Monthly Salary (${currSymbol})`, key: "salary", type: "number" },
          { label: "Age", key: "age", type: "number" },
        ].map(f => (
          <div key={f.key}>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{f.label}</div>
            {f.type === "select" ? (
              <select value={form[f.key]} onChange={e => set(f.key, e.target.value)}
                className="w-full p-[8px_12px] rounded-[10px] border-[1.5px] border-slate-200 text-[13px] bg-white text-brand-navy outline-none focus:border-brand-amber transition-colors">
                {depts.map(d => <option key={d}>{d}</option>)}
              </select>
            ) : (
              <input type={f.type} value={form[f.key]} placeholder={f.placeholder}
                onChange={e => set(f.key, f.type === "number" ? Number(e.target.value) : e.target.value)}
                className="w-full p-[8px_12px] rounded-[10px] border-[1.5px] border-slate-200 text-[13px] bg-white text-brand-navy outline-none box-border focus:border-brand-amber transition-colors" />
            )}
          </div>
        ))}
      </div>
      <div className="mb-3">
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Exit Interview Text</div>
        <textarea value={form.text} onChange={e => set("text", e.target.value)}
          placeholder="Paste or type the exit interview response here..."
          rows={4}
          className="w-full p-[12px_14px] rounded-[10px] border-[1.5px] border-slate-200 text-[13px] text-brand-navy bg-white resize-y box-border outline-none font-inherit focus:border-brand-amber transition-colors leading-relaxed" />
      </div>
      <button onClick={() => { if (form.text.trim()) { onAdd({ ...form, id: Date.now() }); setForm(p => ({ ...p, name: "", text: "" })); }}}
        disabled={!form.text.trim()}
        className={`px-5 py-2.5 rounded-[10px] text-[13px] font-bold transition-all duration-300 border-none ${form.text.trim() ? "bg-gradient-to-br from-brand-amber to-brand-red text-white cursor-pointer hover:shadow-md hover:-translate-y-px" : "bg-slate-200 text-slate-400 cursor-not-allowed"}`}>
        Analyze Interview →
      </button>
    </div>
  );
}

// ── MAIN M5 ──
export default function M5ExitAnalyzer() {
  const { company } = useApp();
  const { data } = useHRData();
  const { config: cfg } = useCurrency();
  const currSymbol = cfg?.symbol || "$";
  const { state: m5State, update: updateM5 } = useModuleData("m5");

  const userInterviews = m5State.interviews || [];
  const hasUserData    = userInterviews.length > 0;
  const showSample     = m5State.showSample ?? false;
  const interviews     = hasUserData ? userInterviews : (showSample ? SAMPLE_INTERVIEWS : []);
  const isUsingSample  = !hasUserData && showSample;
  const isEmpty        = !hasUserData && !showSample;
  const activeTab    = m5State.activeTab    || "dashboard";
  const filterCat    = m5State.filterCat    || "All";
  const filterDept   = m5State.filterDept   || "All";
  const search       = m5State.search       || "";
  
  const setInterviews  = useCallback((updaterOrArr) => {
    const next = typeof updaterOrArr === "function" ? updaterOrArr(userInterviews) : updaterOrArr;
    updateM5({ interviews: next });
  }, [userInterviews, updateM5]);
  const setActiveTab   = useCallback((v) => updateM5({ activeTab: v }),   [updateM5]);
  const setFilterCat   = useCallback((v) => updateM5({ filterCat: v }),   [updateM5]);
  const setFilterDept  = useCallback((v) => updateM5({ filterDept: v }),  [updateM5]);
  const setSearch      = useCallback((v) => updateM5({ search: v }),      [updateM5]);
  
  const [aiInsights, setAiInsights]   = useState(null);
  const [aiLoading, setAiLoading]     = useState(false);
  const [compareA, setCompareA]       = useState(null);
  const [compareB, setCompareB]       = useState(null);
  
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

  // ── Download interview template CSV ──
  const downloadInterviewTemplate = useCallback(() => {
    const BOM = "\uFEFF";
    const template = [
      `Name,Department,Date (YYYY-MM),Tenure (years),Monthly Salary,Age,Exit Interview Text`,
      `"John Doe","Sales","2025-03","2.5","4500","28","I decided to leave because the workload was unsustainable. I was handling too many clients without additional support. The compensation also did not reflect the extra effort I was putting in. I found a role elsewhere with better pay and more reasonable hours."`,
      `"Anonymous","IT","2025-02","1","3800","25","The main reason was compensation. I was significantly below market rate and my raise requests were denied twice. The team culture was great but financially I could not justify staying."`,
    ].join("\n");
    const blob = new Blob([BOM + template], { type: "text/csv;charset=utf-8;" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = "exit_interview_template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  // ── Import CSV bulk interviews ──
  const handleImportCSV = useCallback((file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text  = e.target.result;
        const lines = text.split(/\r?\n/).filter(l => l.trim());
        const parseRow = (line) => {
          const cols = [];
          let cur = "", inQ = false;
          for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (ch === '"' && !inQ) { inQ = true; }
            else if (ch === '"' && inQ && line[i+1] === '"') { cur += '"'; i++; }
            else if (ch === '"' && inQ) { inQ = false; }
            else if (ch === ',' && !inQ) { cols.push(cur.trim()); cur = ""; }
            else { cur += ch; }
          }
          cols.push(cur.trim());
          return cols;
        };
        const rows = lines.slice(1);
        const imported = rows.map((row, i) => {
          const cols = parseRow(row);
          const name   = (cols[0] || "").replace(/^"|"$/g, "") || "Anonymous";
          const dept   = (cols[1] || "").replace(/^"|"$/g, "") || (deptOptions[0] || "Other");
          const date   = (cols[2] || "").replace(/^"|"$/g, "");
          const tenure = parseFloat(cols[3]) || 0;
          const salary = parseFloat(cols[4]) || 0;
          const age    = parseInt(cols[5])   || 0;
          const text   = (cols[6] || "").replace(/^"|"$/g, "").replace(/""/g, '"');
          if (!text.trim()) return null;
          return { id: Date.now() + i, name, dept, date, tenure, salary, age, text };
        }).filter(Boolean);
        if (imported.length === 0) {
          alert("No valid interviews found. Please ensure the 'Exit Interview Text' (7th column) is filled out.");
          return;
        }
        setInterviews(prev => [...prev, ...imported]);
        updateM5({ showSample: false });
      } catch (err) {
        alert("Failed to read CSV: " + (err?.message || "Unknown error"));
      }
    };
    reader.readAsText(file, "UTF-8");
  }, [deptOptions, setInterviews, updateM5]);

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
      {/* ── IMPORT PANEL: always visible at top ── */}
      <div className="bg-white rounded-[14px] p-[16px_20px] border-[1.5px] border-slate-100 mb-4">
        <div className="flex justify-between items-center flex-wrap gap-3">
          <div>
            <div className="font-bold text-[13px] text-brand-dark flex items-center gap-2">
              🚪 Exit Interview Data
              {isUsingSample && (
                <span className="bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 text-[9px] text-amber-800 font-bold">
                  SAMPLE
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {hasUserData
                ? `${userInterviews.length} interview${userInterviews.length > 1 ? "s" : ""} loaded · analyzed automatically`
                : isUsingSample
                  ? "Displaying 8 sample interviews — demo data"
                  : "No interviews available — add manually below or import via CSV"}
            </div>
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            <button onClick={downloadInterviewTemplate}
              className="p-[7px_13px] rounded-lg border-[1.5px] border-slate-200 bg-slate-50 text-xs text-slate-600 cursor-pointer font-semibold hover:bg-slate-100 transition-colors">
              ⬇ Template CSV
            </button>
            <label className="p-[7px_13px] rounded-lg border-[1.5px] border-brand-amber bg-amber-50 text-xs text-amber-700 cursor-pointer font-bold hover:bg-amber-100 transition-colors">
              📂 Import CSV
              <input type="file" accept=".csv,.txt" className="hidden"
                onChange={e => { handleImportCSV(e.target.files[0]); e.target.value = ""; }} />
            </label>
            {!hasUserData && (
              <button
                onClick={() => updateM5({ showSample: !showSample })}
                className={`p-[7px_13px] rounded-lg border-[1.5px] text-xs cursor-pointer font-semibold transition-colors ${showSample ? "border-red-200 bg-red-50 text-brand-red hover:bg-red-100" : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"}`}>
                {showSample ? "🙈 Hide Samples" : "👁 View Sample Interviews"}
              </button>
            )}
            {hasUserData && (
              <button onClick={() => updateM5({ interviews: [], showSample: false })}
                className="p-[7px_13px] rounded-lg border-[1.5px] border-red-200 bg-red-50 text-xs text-brand-red cursor-pointer font-semibold hover:bg-red-100 transition-colors">
                ✕ Clear Interviews
              </button>
            )}
          </div>
        </div>

        {/* CSV Format Guide */}
        <div className="mt-3 bg-slate-50 rounded-[10px] p-[12px_14px] border border-slate-200">
          <div className="text-[11px] font-bold text-slate-600 mb-1.5">📋 Correct CSV Format:</div>
          <div className="text-[10px] text-slate-500 leading-relaxed font-mono bg-slate-100 rounded-lg p-[8px_10px] mb-2 overflow-x-auto whitespace-nowrap">
            Name, Department, Date (YYYY-MM), Tenure (years), Monthly Salary, Age, Exit Interview Text
          </div>
          <div className="text-[10px] text-slate-400 leading-relaxed">
            💡 <strong>Interview text can be any length </strong> — wrap with quotation marks <code className="bg-slate-200 px-1 py-0.5 rounded-[3px]">"..."</code> in  CSV.<br />
            💡 If there are quotation marks in the text, write them twice.: <code className="bg-slate-200 px-1 py-0.5 rounded-[3px]">""like this ""</code><br />
            💡 Klik <strong>⬇ Template CSV</strong> to download a ready-to-fill example in Excel/Google Sheets. 
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {TABS.map(t => {
          const isActive = activeTab === t.id;
          return (
            <button 
              key={t.id} 
              onClick={() => setActiveTab(t.id)}
              className={`px-[18px] py-[9px] rounded-[10px] cursor-pointer text-[13px] font-medium transition-all duration-150 border-[1.5px] ${isActive ? "bg-gradient-to-br from-brand-amber to-brand-red text-white border-transparent font-bold shadow-sm" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"}`}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      {/* ── TAB: DASHBOARD ── */}
      {activeTab === "dashboard" && (
        <div>
          {/* Empty state */}
          {isEmpty && (
            <div className="text-center py-16 px-5 bg-white rounded-[14px] border-[1.5px] border-slate-100 mb-4">
              <div className="text-[40px] mb-3">🚪</div>
              <div className="font-display text-lg font-bold text-brand-dark mb-2">No Exit Interviews Yet</div>
              <div className="text-[13px] text-slate-400 mb-5 max-w-[400px] mx-auto leading-relaxed">
                Add interviews one by one via tab <strong>All Interviews</strong>, or import them all at once via CSV. Click the button below to see an example of the data format first. 
              </div>
              <div className="flex gap-2.5 justify-center flex-wrap">
                <button onClick={() => updateM5({ showSample: true })}
                  className="p-[10px_20px] rounded-[10px] border-[1.5px] border-slate-200 bg-slate-50 text-[13px] text-slate-600 cursor-pointer font-bold hover:bg-slate-100 transition-colors">
                  👁 View Interview Sample 
                </button>
                <button onClick={() => { updateM5({ activeTab: "interviews" }); }}
                  className="p-[10px_20px] rounded-[10px] border-none bg-gradient-to-br from-brand-amber to-brand-red text-[13px] text-white cursor-pointer font-bold shadow-sm hover:opacity-90 transition-opacity">
                  ➕ Add Interview Now 
                </button>
              </div>
            </div>
          )}
          
          {/* Sample banner */}
          {isUsingSample && (
            <div className="bg-amber-50 border-[1.5px] border-amber-200 rounded-[10px] p-[10px_16px] mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-lg">📋</span>
                <div>
                  <div className="text-xs font-bold text-amber-800">These are 8 examples of interviews — not your data </div>
                  <div className="text-[11px] text-amber-700">The analysis below is based on demo data. Add your own interviews for real-world results.</div>
                </div>
              </div>
              <button onClick={() => updateM5({ showSample: false })}
                className="bg-transparent border border-amber-200 rounded-lg p-[4px_10px] text-[11px] text-amber-800 cursor-pointer font-bold whitespace-nowrap shrink-0 hover:bg-amber-100 transition-colors">
                Hide ✕
              </button>
            </div>
          )}

          {/* KPIs */}
          <div className="grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-3 mb-[18px]">
            {[
              { label: "Total Interviews", value: interviews.length, sub: "Exit interviews analyzed", color: "#3b82f6", icon: "📋", bg: "#eff6ff" },
              { label: "Top Exit Reason", value: catDist[0]?.[0] || "—", sub: `${catDist[0]?.[1] || 0} mentions`, color: CATEGORIES[catDist[0]?.[0]]?.color || "#94a3b8", icon: CATEGORIES[catDist[0]?.[0]]?.icon || "❓", bg: CATEGORIES[catDist[0]?.[0]]?.bg || "#f8fafc" },
              { label: "Avg Sentiment", value: sentimentStats.avg, sub: `${sentimentStats.pct}% highly negative`, color: sentimentStats.avg < 35 ? "#ef4444" : sentimentStats.avg < 60 ? "#f59e0b" : "#22c55e", icon: "😔", bg: sentimentStats.avg < 35 ? "#fef2f2" : "#fffbeb" },
              { label: "Patterns Found", value: patterns.length, sub: "Actionable systemic issues", color: "#8b5cf6", icon: "🔍", bg: "#f5f3ff" },
              { label: "Avg Retainable", value: `${avgRetentionProbability}%`, sub: "Could have been prevented", color: avgRetentionProbability >= 60 ? "#22c55e" : avgRetentionProbability >= 35 ? "#f59e0b" : "#ef4444", icon: "💔", bg: avgRetentionProbability >= 60 ? "#f0fdf4" : "#fef2f2" },
            ].map((k) => (
              <div key={k.label} className="relative overflow-hidden rounded-[13px] p-[14px_16px]" style={{ background: k.bg, border: `1.5px solid ${k.color}22` }}>
                <div className="absolute right-2.5 top-2 text-lg opacity-20">{k.icon}</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{k.label}</div>
                <div className="text-[22px] font-extrabold leading-tight font-display" style={{ color: k.color }}>{k.value}</div>
                <div className="text-[10px] text-slate-500 mt-1">{k.sub}</div>
              </div>
            ))}
          </div>

          {/* Category Distribution + Timeline */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Category bars */}
            <div className="bg-white rounded-[14px] p-[16px_18px] border-[1.5px] border-slate-100">
              <div className="font-bold text-[13px] text-brand-dark mb-3.5">Exit Reasons Distribution</div>
              {catDist.map(([cat, count]) => {
                const cfg = CATEGORIES[cat];
                const pct = interviews.length > 0 ? ((count / interviews.length) * 100).toFixed(0) : 0;
                return (
                  <div key={cat} className="mb-2.5">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{cfg.icon}</span>
                        <span className="text-xs font-semibold text-brand-navy">{cat}</span>
                      </div>
                      <span className="text-xs font-bold" style={{ color: cfg.color }}>{pct}% ({count})</span>
                    </div>
                    <div className="h-[7px] bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: cfg.color }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-[14px] p-[16px_18px] border-[1.5px] border-slate-100">
              <div className="font-bold text-[13px] text-brand-dark mb-1">Exit Timeline</div>
              <div className="text-[10px] text-slate-400 mb-3">Departures by month — color = top exit reason</div>
              <TimelineChart interviews={interviews} />
              <div className="flex gap-2 mt-2 flex-wrap">
                {Object.entries(CATEGORIES).map(([cat, cfg]) => (
                  <div key={cat} className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.color }} />
                    <span className="text-[9px] text-slate-400">{cat}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI Insights */}
          <div className="bg-white rounded-[14px] p-[16px_18px] border-[1.5px] border-slate-100">
            <button onClick={handleAI} disabled={aiLoading}
              className={`w-full p-3 border-none rounded-[10px] text-[13px] font-bold transition-colors ${aiLoading ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-brand-dark text-white cursor-pointer hover:bg-slate-800"} ${aiInsights ? "mb-3.5" : "mb-0"}`}>
              {aiLoading ? "⏳ Analyzing Exit Patterns with AI..." : "🤖 Generate AI Exit Pattern Analysis"}
            </button>
            
            {aiInsights && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {[
                  { key: "topTheme", label: "Top Theme", icon: "🎯", color: "#ef4444", bg: "#fef2f2" },
                  { key: "urgentAction", label: "Urgent Action", icon: "⚡", color: "#f97316", bg: "#fff7ed" },
                  { key: "hiddenPattern", label: "Hidden Pattern", icon: "🔍", color: "#8b5cf6", bg: "#f5f3ff" },
                  { key: "retentionOpportunity", label: "Retention Opportunity", icon: "💡", color: "#22c55e", bg: "#f0fdf4" },
                  { key: "riskForecast", label: "60-Day Risk Forecast", icon: "📅", color: "#3b82f6", bg: "#eff6ff" },
                ].map(item => aiInsights[item.key] && (
                  <div key={item.key} className={`rounded-[10px] p-[12px_14px] border ${item.key === "riskForecast" ? "md:col-span-2" : ""}`} style={{ background: item.bg, borderColor: `${item.color}22` }}>
                    <div className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: item.color }}>{item.icon} {item.label}</div>
                    <div className="text-xs text-brand-navy leading-relaxed">{aiInsights[item.key]}</div>
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
          {isUsingSample && (
            <div className="bg-amber-50 border-[1.5px] border-amber-200 rounded-[10px] p-[10px_16px] mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-lg">📋</span>
                <div>
                  <div className="text-xs font-bold text-amber-800">These are 8 sample interviews — demo data</div>
                  <div className="text-[11px] text-amber-700">Add your interviews using the form below to automatically replace these samples.</div>
                </div>
              </div>
              <button onClick={() => updateM5({ showSample: false })}
                className="bg-transparent border border-amber-200 rounded-lg p-[4px_10px] text-[11px] text-amber-800 cursor-pointer font-bold whitespace-nowrap shrink-0 hover:bg-amber-100 transition-colors">
                Hide ✕
              </button>
            </div>
          )}
          
          <AddInterviewForm onAdd={iv => { setInterviews(p => [...p, iv]); updateM5({ showSample: false }); }} deptOptions={deptOptions} currSymbol={currSymbol} />
          
          {hasUserData && (
            <button onClick={() => updateM5({ interviews: [], showSample: false })}
              className="p-[6px_14px] rounded-lg border-[1.5px] border-red-200 bg-red-50 text-[11px] text-brand-red cursor-pointer font-semibold hover:bg-red-100 transition-colors mb-3">
              🗑️ Clear All My Interviews
            </button>
          )}
          
          {isEmpty && (
            <div className="text-center p-[40px_20px] bg-slate-50 rounded-[13px] border-[1.5px] border-dashed border-slate-200 mb-3">
              <div className="text-3xl mb-2">📝</div>
              <div className="text-sm font-bold text-slate-600 mb-1">No interviews found</div>
              <div className="text-xs text-slate-400">Fill out the form above or import a CSV to begin analysis.</div>
            </div>
          )}

          {/* Search */}
          <div className="mb-2.5">
            <input
              type="text"
              placeholder="🔍 Search by name, department, or keyword in interview text..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full p-[9px_14px] rounded-[9px] border-[1.5px] border-slate-200 text-xs text-brand-navy bg-slate-50 outline-none box-border focus:border-brand-amber transition-colors"
            />
          </div>                 

          {/* Filters */}
          <div className="bg-white rounded-xl p-[12px_16px] border-[1.5px] border-slate-100 mb-3.5 flex gap-3.5 flex-wrap">
            <div>
              <div className="text-[9px] font-bold text-slate-400 uppercase mb-1.5">Category</div>
              <div className="flex gap-1.5 flex-wrap">
                {["All", ...Object.keys(CATEGORIES)].map(c => {
                  const isActive = filterCat === c;
                  return (
                    <button key={c} onClick={() => setFilterCat(c)}
                      className={`p-[4px_10px] rounded-full border-none cursor-pointer text-[11px] transition-colors ${isActive ? "text-white font-bold" : "bg-slate-100 text-slate-500 font-medium hover:bg-slate-200"}`}
                      style={{ background: isActive ? (CATEGORIES[c]?.color || "#f59e0b") : "" }}>
                      {c}
                    </button>
                  )
                })}
              </div>
            </div>
            <div>
              <div className="text-[9px] font-bold text-slate-400 uppercase mb-1.5">Department</div>
              <div className="flex gap-1.5 flex-wrap">
                {depts.map(d => (
                  <button key={d} onClick={() => setFilterDept(d)}
                    className={`p-[4px_10px] rounded-full border-none cursor-pointer text-[11px] transition-colors ${filterDept === d ? "bg-brand-amber text-white font-bold" : "bg-slate-100 text-slate-500 font-medium hover:bg-slate-200"}`}>
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 mb-3">Showing {filtered.length} of {analyzed.length} interviews</div>
          {filtered.map((iv, i) => <InterviewCard key={iv.id} iv={iv} analysis={iv.analysis} idx={i} />)}
        </div>
      )}

      {/* ── TAB: PATTERNS ── */}
      {activeTab === "patterns" && (
        <div>
          {/* Patterns */}
          <div className="bg-white rounded-[14px] p-[16px_18px] border-[1.5px] border-slate-100 mb-4">
            <div className="font-bold text-sm text-brand-dark mb-1">🔍 Detected Patterns</div>
            <div className="text-[11px] text-slate-400 mb-4">Auto-detected systemic issues across all interviews</div>
            
            {patterns.length === 0 ? (
              <div className="text-center p-[30px] text-slate-400">No significant patterns detected yet</div>
            ) : patterns.map((p, i) => (
              <div key={`${p.severity}-${i}`} className="rounded-[10px] p-[10px_14px] mb-2 flex items-start gap-2.5 border" style={{ background: severityBg(p.severity), borderColor: severityBorder(p.severity) }}>
                <span className="text-lg shrink-0">{p.icon}</span>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest mr-2" style={{ color: severityColor(p.severity) }}>
                    {p.severity}
                  </span>
                  <span className="text-xs text-brand-navy leading-relaxed">{p.text}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Sentiment breakdown */}
          <div className="bg-white rounded-[14px] p-[16px_18px] border-[1.5px] border-slate-100 mb-4">
            <div className="font-bold text-[13px] text-brand-dark mb-3.5">😔 Sentiment Analysis</div>
            <div className="grid grid-cols-3 gap-2.5 mb-3.5">
              {[
                { label: "Negative", count: analyzed.filter(iv => iv.analysis.sentiment.score < 35).length, color: "#ef4444", bg: "#fef2f2" },
                { label: "Mixed", count: analyzed.filter(iv => iv.analysis.sentiment.score >= 35 && iv.analysis.sentiment.score < 60).length, color: "#f59e0b", bg: "#fffbeb" },
                { label: "Positive", count: analyzed.filter(iv => iv.analysis.sentiment.score >= 60).length, color: "#22c55e", bg: "#f0fdf4" },
              ].map(s => (
                <div key={s.label} className="rounded-[10px] p-3 text-center" style={{ background: s.bg }}>
                  <div className="text-[22px] font-extrabold" style={{ color: s.color }}>{s.count}</div>
                  <div className="text-[11px] text-slate-500">{s.label}</div>
                </div>
              ))}
            </div>
            
            <div className="flex flex-col gap-1.5">
              {analyzed.map((iv, i) => (
                <div key={iv.id} className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-600 w-[110px] shrink-0 truncate">{iv.name || `#${i + 1}`}</span>
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${iv.analysis.sentiment.score}%`, background: iv.analysis.sentiment.color }} />
                  </div>
                  <span className="text-[10px] font-bold w-6 text-right" style={{ color: iv.analysis.sentiment.color }}>{iv.analysis.sentiment.score}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Cross-module links */}
          <div className="bg-orange-50 rounded-[14px] p-[16px_18px] border-[1.5px] border-orange-200">
            <div className="font-bold text-[13px] text-orange-800 mb-2.5">🔗 Cross-Module Actions</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                { icon: "💰", label: "Compensation issues detected", action: "→ Go to M3: Salary Benchmarking to see exact gap per dept", color: "#ef4444" },
                { icon: "⏱️", label: "Workload/burnout patterns", action: "→ Go to M4: Dept Health to check Human Buffer & Burnout Index", color: "#f97316" },
                { icon: "🔕", label: "Gen Z silent drift signals", action: "→ Go to M2: Risk Scorer, enter age <26 + low satisfaction to see alert", color: "#f59e0b" },
                { icon: "📈", label: "Retention intervention needed", action: "→ Go to M6: ROI Calculator to justify investment to leadership", color: "#8b5cf6" },
              ].map((item, i) => (
                <div key={i} className="bg-white rounded-[9px] p-[10px_12px] border border-orange-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                  <div className="text-xs font-bold mb-1" style={{ color: item.color }}>{item.icon} {item.label}</div>
                  <div className="text-[11px] text-slate-500">{item.action}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: WORD CLOUD ── */}
      {activeTab === "wordcloud" && (
        <div>
          {isEmpty && (
            <div className="text-center py-[60px] px-5 bg-white rounded-[14px] border-[1.5px] border-slate-100 mb-4">
              <div className="text-[40px] mb-3">☁️</div>
              <div className="font-display text-base font-bold text-brand-dark mb-2">Empty Keyword Cloud</div>
              <div className="text-xs text-slate-400 mb-4">Keywords are generated from interview text. Please add an interview first to view results.</div>
              <button onClick={() => updateM5({ showSample: true })}
                className="p-[9px_20px] rounded-[10px] border-[1.5px] border-slate-200 bg-slate-50 text-[13px] text-slate-600 cursor-pointer font-bold hover:bg-slate-100 transition-colors">
                👁 View Sample
              </button>
            </div>
          )}
          
          {isUsingSample && (
            <div className="bg-amber-50 border-[1.5px] border-amber-200 rounded-[10px] p-[8px_14px] mb-3 text-[11px] text-amber-800 font-bold flex justify-between items-center">
              <span>📋 These keywords are from 8 sample interviews — demo data</span>
              <button onClick={() => updateM5({ showSample: false })} className="bg-transparent border-none text-amber-800 cursor-pointer text-[13px] font-extrabold hover:text-amber-900 transition-colors">✕</button>
            </div>
          )}
          
          <div className="bg-white rounded-[14px] p-[20px_22px] border-[1.5px] border-slate-100 mb-4">
            <div className="font-bold text-sm text-brand-dark mb-1">☁️ Keyword Frequency Cloud</div>
            <div className="text-[11px] text-slate-400 mb-4">
              Word size = frequency · Color = category · Generated from {interviews.length} exit interviews{isUsingSample ? " (contoh)" : ""}
            </div>
            
            <div className="bg-slate-50 rounded-xl p-5 border-[1.5px] border-slate-100 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
              <WordCloud words={keywords} />
            </div>
            
            <div className="flex gap-2.5 mt-3.5 flex-wrap">
              {Object.entries(CATEGORIES).map(([cat, cfg]) => (
                <div key={cat} className="flex items-center gap-1.5 rounded-lg p-[4px_10px] border" style={{ background: cfg.bg, borderColor: cfg.border }}>
                  <span className="text-sm">{cfg.icon}</span>
                  <span className="text-[11px] font-bold" style={{ color: cfg.color }}>{cat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top keywords table */}
          <div className="bg-white rounded-[14px] p-[16px_18px] border-[1.5px] border-slate-100">
            <div className="font-bold text-[13px] text-brand-dark mb-3.5">Top 20 Keywords Ranked</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {keywords.slice(0, 20).map(([word, count], i) => {
                const cat = Object.entries(CATEGORIES).find(([, cfg]) => cfg.keywords.includes(word));
                const color = cat ? cat[1].color : "#94a3b8";
                const bg = cat ? cat[1].bg : "#f8fafc";
                return (
                  <div key={word} className="flex items-center gap-2 rounded-lg p-[6px_10px]" style={{ background: bg }}>
                    <span className="text-[11px] text-slate-400 w-5 text-right">#{i + 1}</span>
                    <span className="flex-1 text-xs font-bold text-brand-navy">{word}</span>
                    <div className="flex items-center gap-1">
                      <div className="h-1 rounded-full" style={{ width: Math.max(12, (count / keywords[0][1]) * 40), background: color }} />
                      <span className="text-[11px] font-extrabold" style={{ color }}>{count}x</span>
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
          <div className="bg-white rounded-[14px] p-[20px_22px] border-[1.5px] border-slate-100 mb-4">
            <div className="font-bold text-sm text-brand-dark mb-1">🎭 Exit Persona Clusters</div>
            <div className="text-[11px] text-slate-400 mb-5">
              Auto-grouped by behavioral patterns — each persona needs a different intervention strategy
            </div>
            
            <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-3.5">
              {personaClusters.map(([persona, members]) => {
                const topCat = members[0]?.analysis?.primary || "Culture";
                const cfg = CATEGORIES[topCat] || CATEGORIES["Culture"];
                const avgRetain = Math.round(members.reduce((s, iv) => s + iv.analysis.retentionProbability, 0) / members.length);
                return (
                  <div key={persona} className="rounded-[13px] p-[16px_18px] border-[1.5px] shadow-sm transition-transform hover:-translate-y-1" style={{ background: cfg.bg, borderColor: cfg.border }}>
                    <div className="font-extrabold text-sm mb-1.5" style={{ color: cfg.color }}>{persona}</div>
                    <div className="text-[11px] text-slate-500 mb-3">{members.length} employee(s) match this profile</div>

                    {/* Members */}
                    <div className="mb-3 flex flex-col gap-1.5">
                      {members.map((iv, i) => (
                        <div key={i} className={`flex justify-between items-center py-1 ${i < members.length - 1 ? 'border-b border-white/40' : ''}`}>
                          <span className="text-xs text-brand-navy font-semibold">{iv.name || "Anonymous"}</span>
                          <div className="flex gap-1.5 items-center">
                            <span className="text-[10px] text-slate-500">{iv.dept}</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-white/50 rounded-md" style={{ color: iv.analysis.retentionProbability >= 60 ? "#16a34a" : iv.analysis.retentionProbability >= 35 ? "#d97706" : "#dc2626" }}>
                              {iv.analysis.retentionProbability}% retainable
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Retention avg */}
                    <div className="bg-white/80 rounded-lg p-[8px_12px] backdrop-blur-sm shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
                      <div className="text-[10px] text-slate-500 mb-1 font-semibold">Avg Retention Probability</div>
                      <div className="h-1.5 bg-slate-200/50 rounded-full overflow-hidden mb-1">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${avgRetain}%`, background: avgRetain >= 60 ? "#22c55e" : avgRetain >= 35 ? "#f59e0b" : "#ef4444" }} />
                      </div>
                      <div className="text-xs font-bold" style={{ color: avgRetain >= 60 ? "#16a34a" : avgRetain >= 35 ? "#d97706" : "#dc2626" }}>
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
          <div className="bg-white rounded-[14px] p-[20px_22px] border-[1.5px] border-slate-100 mb-4">
            <div className="font-bold text-sm text-brand-dark mb-1">⚖️ Interview Comparison</div>
            <div className="text-[11px] text-slate-400 mb-4">Select two interviews to compare side-by-side</div>

            {/* Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              {[{ label: "Interview A", val: compareA, setter: setCompareA }, { label: "Interview B", val: compareB, setter: setCompareB }].map(({ label, val, setter }) => (
                <div key={label}>
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">{label}</div>
                  <select value={val || ""} onChange={e => setter(Number(e.target.value) || null)}
                    className="w-full p-[9px_12px] rounded-[9px] border-[1.5px] border-slate-200 text-xs text-brand-navy bg-slate-50 outline-none focus:border-brand-amber transition-colors cursor-pointer">
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
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50">
                        {["Metric", a.name || "Interview A", b.name || "Interview B"].map(h => (
                          <th key={h} className="p-[8px_12px] text-left text-slate-500 font-bold text-[10px] uppercase tracking-wider border-b-2 border-slate-100">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, i) => (
                        <tr key={row.label} className={`border-b border-slate-50 ${i % 2 === 0 ? "bg-white" : "bg-[#fafafa]"}`}>
                          <td className="p-[8px_12px] font-semibold text-slate-600">{row.label}</td>
                          <td className="p-[8px_12px] text-brand-navy font-medium">{row.va}</td>
                          <td className="p-[8px_12px] text-brand-navy font-medium">{row.vb}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Text comparison */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                    {[a, b].map((iv, i) => (
                      <div key={i} className="bg-slate-50 rounded-[10px] p-[14px_16px] border border-slate-200">
                        <div className="font-bold text-xs text-brand-dark mb-2">{iv.name || `Interview ${i === 0 ? "A" : "B"}`}</div>
                        <div className="text-[11px] text-slate-600 leading-relaxed italic border-l-2 border-brand-amber/30 pl-2">"{iv.text.slice(0, 200)}..."</div>
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
          <div className="bg-white rounded-[14px] p-[20px_22px] border-[1.5px] border-slate-100 mb-4">
            <div className="font-bold text-sm text-brand-dark mb-1">📤 Export Exit Interview Data</div>
            <div className="text-[11px] text-slate-400 mb-5">
              Full dataset with AI categorization, sentiment scores, and retention probability
            </div>

            {/* Preview */}
            <div className="overflow-x-auto mb-5 rounded-xl border border-slate-100">
              <table className="w-full border-collapse text-[11px]">
                <thead>
                  <tr className="bg-slate-50">
                    {["Name","Dept","Date","Tenure","Primary Reason","Sentiment","Retainable"].map(h => (
                      <th key={h} className="p-[8px_10px] text-left text-slate-500 font-bold text-[10px] uppercase tracking-wider border-b-2 border-slate-100 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {analyzed.map((iv) => (
                    <tr key={iv.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="p-[7px_10px] font-semibold text-brand-navy whitespace-nowrap">{iv.name || "Anonymous"}</td>
                      <td className="p-[7px_10px] text-slate-600">{iv.dept}</td>
                      <td className="p-[7px_10px] text-slate-400">{iv.date}</td>
                      <td className="p-[7px_10px] text-slate-500">{iv.tenure}y</td>
                      <td className="p-[7px_10px]">
                        <span className="px-2 py-0.5 rounded-[10px] text-[9px] font-bold border" style={{ background: CATEGORIES[iv.analysis.primary]?.bg, color: CATEGORIES[iv.analysis.primary]?.color, borderColor: CATEGORIES[iv.analysis.primary]?.border }}>
                          {CATEGORIES[iv.analysis.primary]?.icon} {iv.analysis.primary}
                        </span>
                      </td>
                      <td className="p-[7px_10px]">
                        <span className="font-bold text-[10px]" style={{ color: iv.analysis.sentiment.color }}>{iv.analysis.sentiment.score}</span>
                      </td>
                      <td className="p-[7px_10px]">
                        <span className="font-bold text-[10px]" style={{ color: iv.analysis.retentionProbability >= 60 ? "#16a34a" : iv.analysis.retentionProbability >= 35 ? "#d97706" : "#dc2626" }}>
                          {iv.analysis.retentionProbability}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-3 flex-wrap items-center">
              <button onClick={exportCSV}
                className="p-[12px_24px] rounded-[11px] border-none bg-gradient-to-br from-brand-amber to-brand-red text-white font-bold text-[13px] cursor-pointer shadow-sm hover:opacity-90 transition-opacity">
                ⬇ Export Full CSV ({analyzed.length} interviews)
              </button>
              <div className="flex items-center gap-2 bg-green-50 rounded-[10px] p-[10px_16px] border border-green-200">
                <span className="text-xl">💔</span>
                <div>
                  <div className="text-[10px] font-bold text-green-800 uppercase tracking-widest mb-0.5">Preventable Exits</div>
                  <div className="text-[13px] font-extrabold text-green-700">
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
