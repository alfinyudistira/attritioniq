import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useApp, useHRData, SAMPLE_DATA } from "../context/AppContext";

// ── Question bank ──
const QUESTION_BANK = [
  { id: "q1", text: "How manageable was your workload this week?", type: "scale", category: "Workload", icon: "⚡" },
  { id: "q2", text: "Do you feel recognized for your contributions?", type: "scale", category: "Recognition", icon: "🏆" },
  { id: "q3", text: "How supported do you feel by your manager?", type: "scale", category: "Management", icon: "👤" },
  { id: "q4", text: "How likely are you to recommend this company as a workplace?", type: "scale", category: "eNPS", icon: "📣" },
  { id: "q5", text: "Do you have clear visibility into your career growth path?", type: "scale", category: "Career", icon: "📈" },
  { id: "q6", text: "How balanced is your work-life this week?", type: "scale", category: "Wellbeing", icon: "⚖️" },
  { id: "q7", text: "Do you feel psychologically safe to speak up?", type: "scale", category: "Safety", icon: "🛡️" },
  { id: "q8", text: "How connected do you feel to your team?", type: "scale", category: "Culture", icon: "🤝" },
  { id: "q9", text: "Were there any blockers preventing you from doing great work?", type: "text", category: "Blockers", icon: "🚧" },
  { id: "q10", text: "What's one thing leadership could do better this week?", type: "text", category: "Feedback", icon: "💬" },
  { id: "q11", text: "How energized do you feel coming to work?", type: "scale", category: "Energy", icon: "🔋" },
  { id: "q12", text: "How fair do you feel your compensation is?", type: "scale", category: "Compensation", icon: "💰" },
];

// ── Simulated pulse data — 8 weeks ──
// ── Seeded PRNG untuk deterministik — posisi/nilai stabil walau di-render ulang ──
function seededRand(seed) {
  let s = seed | 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) | 0;
    return (s >>> 0) / 0x100000000;
  };
}

function generatePulseHistory(data) {
  const src = data.length > 0 ? data : SAMPLE_DATA;
  const depts = [...new Set(src.map(e => e.Department))];
  const weeks = ["Week 1","Week 2","Week 3","Week 4","Week 5","Week 6","Week 7","Week 8 (Current)"];

  // Seed dari total karyawan + avg satisfaction = stabil selama data tidak berubah drastis
  const dataSeed = src.reduce((acc, e) => acc + (e.JobSatisfaction || 5), 0);

  return weeks.map((week, wi) => {
    const deptData = {};
    depts.forEach(dept => {
      const emps = src.filter(e => e.Department === dept);
      const hasOT = emps.filter(e => e.OvertimeStatus === "Yes").length / Math.max(emps.length, 1);
      const avgSat = emps.length > 0 ? emps.reduce((s, e) => s + (e.JobSatisfaction || 5), 0) / emps.length : 5;

      // Seed unik per dept per week — deterministik
      const rand = seededRand(dataSeed * 31 + dept.charCodeAt(0) * 17 + wi * 7);

      const degradation = dept === "HR" ? 0 : wi * (hasOT * 2.5);
      const responses = Math.floor(emps.length * (0.6 + rand() * 0.35));

      deptData[dept] = {
        workload:    Math.max(1, Math.min(10, (avgSat * 0.9)  - degradation * 0.3  + (rand() - 0.5))).toFixed(1),
        recognition: Math.max(1, Math.min(10, (avgSat * 0.85) - degradation * 0.2  + (rand() - 0.5))).toFixed(1),
        management:  Math.max(1, Math.min(10, (avgSat * 0.95) - degradation * 0.15 + (rand() - 0.5))).toFixed(1),
        enps:        Math.max(-100, Math.min(100, (avgSat - 5) * 20 - degradation * 8 + (rand() * 10 - 5))).toFixed(0),
        wellbeing:   Math.max(1, Math.min(10, (avgSat * 0.88) - degradation * 0.35 + (rand() - 0.5))).toFixed(1),
        energy:      Math.max(1, Math.min(10, (avgSat * 0.9)  - degradation * 0.4  + (rand() - 0.5))).toFixed(1),
        responses,
        totalEmps: emps.length,
        responseRate: Math.round((responses / Math.max(emps.length, 1)) * 100),
      };

      // Pulse Score Index (composite)
      const ps = deptData[dept];
      deptData[dept].pulseScore = Math.round(
        (Number(ps.workload) + Number(ps.recognition) + Number(ps.management) + Number(ps.wellbeing) + Number(ps.energy)) / 5 * 10
      );
    });

    // Org-level
    const allScores = Object.values(deptData).map(d => d.pulseScore);
    const orgPulse = allScores.length > 0 ? Math.round(allScores.reduce((s, v) => s + v, 0) / allScores.length) : 50;

    // Simulated text responses
    const textResponses = wi >= 5 ? [
      { dept: "Sales", text: "The workload keeps increasing but the team size stays the same", sentiment: "negative" },
      { dept: "Technical Support", text: "Management doesn't seem to notice how burnt out we are", sentiment: "negative" },
      { dept: "IT", text: "I spent most of this week doing tasks outside my job description", sentiment: "negative" },
      { dept: "HR", text: "Good week overall, team is collaborative and supportive", sentiment: "positive" },
    ] : wi >= 3 ? [
      { dept: "Sales", text: "Workload was heavy but manageable this week", sentiment: "mixed" },
      { dept: "Technical Support", text: "Could use more resources to handle ticket volume", sentiment: "mixed" },
    ] : [
      { dept: "Sales", text: "Good week, hit targets and felt supported", sentiment: "positive" },
      { dept: "HR", text: "Smooth operations, no major blockers", sentiment: "positive" },
    ];

    return { week, wi, deptData, orgPulse, textResponses };
  });
}

// ── AI Intervention Trigger ──
async function fetchAIIntervention(alert, company) {
  const prompt = `You are an HR intervention specialist at ${company?.name || "a company"}.

CRITICAL ALERT: ${alert.dept} department pulse score dropped from ${alert.prevScore} to ${alert.currScore} (${alert.drop} point drop in one week).

Affected metrics: ${alert.affectedMetrics.join(", ")}
Department size: ${alert.deptSize} employees
Response rate: ${alert.responseRate}%
Text feedback themes: ${alert.textThemes}

Write an urgent intervention plan in 3 paragraphs:
1. What this data signal means (be direct — this is a pre-resignation warning)
2. What must happen in the next 72 hours (specific actions, who does what)
3. What to monitor over the next 2 weeks to confirm recovery

Under 180 words. Urgent, specific, no jargon. No bullet points.`;

  const response = await fetch("https://gemini-api-amber-iota.vercel.app/api/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: [{ content: prompt }] }),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  return data.content?.[0]?.text || data.text || data.response || "AI intervention unavailable.";
}

// ── Components ──

// Pulse Score Gauge
function PulseGauge({ score, size = 100, label = "Pulse" }) {
  const color = score >= 70 ? "#22c55e" : score >= 50 ? "#f59e0b" : score >= 30 ? "#f97316" : "#ef4444";
  const cx = size / 2, cy = size * 0.65, r = size * 0.36;
  const strokeW = Math.max(7, size * 0.09);
  const vAngle = Math.PI - (score / 100) * Math.PI;
  const vx = cx + r * Math.cos(vAngle), vy = cy - r * Math.sin(vAngle);
  const lg = score > 50 ? 1 : 0;
  return (
    <svg width={size} height={size * 0.72} viewBox={`0 0 ${size} ${size * 0.72}`}>
      <path d={`M${cx - r},${cy} A${r},${r} 0 0 1 ${cx + r},${cy}`} fill="none" stroke="#f1f5f9" strokeWidth={strokeW} strokeLinecap="round" />
      {score > 0 && <path d={`M${cx - r},${cy} A${r},${r} 0 ${lg} 1 ${vx},${vy}`} fill="none" stroke={color} strokeWidth={strokeW} strokeLinecap="round" />}
      <circle cx={vx} cy={vy} r={strokeW * 0.5} fill={color} />
      <text x={cx} y={cy - r * 0.08} textAnchor="middle" fontSize={size * 0.2} fontWeight="800" fill={color}>{score}</text>
      <text x={cx} y={cy + r * 0.22} textAnchor="middle" fontSize={size * 0.09} fill="#64748b">{label}</text>
    </svg>
  );
}

// Trend Sparkline
function Sparkline({ values, color = "#f59e0b", width = 80, height = 28 }) {
  if (!values || values.length < 2) return null;
  const min = Math.min(...values), max = Math.max(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(" ");
  const lastVal = values[values.length - 1];
  const prevVal = values[values.length - 2];
  const trend = lastVal > prevVal ? "↑" : lastVal < prevVal ? "↓" : "→";
  const tColor = lastVal > prevVal ? "#22c55e" : lastVal < prevVal ? "#ef4444" : "#94a3b8";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={(values.length - 1) / (values.length - 1) * width} cy={height - ((lastVal - min) / range) * height} r={2.5} fill={color} />
      </svg>
      <span style={{ fontSize: 11, fontWeight: 800, color: tColor }}>{trend}</span>
    </div>
  );
}

// Word Cloud
// Helper deterministik di luar component
function getWordColor(w) {
  const positioned = buildWordPositions(words, maxF);
  const negative = ["burnout","overload","underpaid","leaving","quit","stressed","exhausted","unmotivated","ignored","frustrated","blocker","heavy"];
  const positive = ["great","good","supported","excellent","motivated","growth","clear","happy","collaborative","appreciated"];
  if (negative.includes(w)) return "#ef4444";
  if (positive.includes(w)) return "#22c55e";
  const palette = ["#3b82f6","#8b5cf6","#f59e0b","#10b981","#06b6d4"];
  return palette[w.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % palette.length];
}

function buildWordPositions(words, maxF) {
  const rand = seededRand(words.reduce((acc, [w]) => acc + w.charCodeAt(0), 0));
  const placed = [];
  return words.map(([word, count]) => {
    const fs = Math.max(9, Math.min(26, (count / maxF) * 26));
    let x, y, att = 0;
    do { x = 15 + rand() * 370; y = 15 + rand() * 140; att++; }
    while (att < 40 && placed.some(p => Math.abs(p.x - x) < word.length * fs * 0.45 && Math.abs(p.y - y) < fs * 1.4));
    placed.push({ x, y });
    return { word, count, fs, color: getWordColor(word), x, y };
  });
}

function WordCloud({ responses }) {
  const freq = {};
  const stop = new Set(["the","and","was","were","had","that","this","with","from","they","for","but","not","been","when","also","just","more","after","into","about","very","would","could","which","there","what","than","then","some","my","me","i","a","an","to","of","in","on","is","it","at","by","be","as","or","no","we","so","up","do","go","if","week","this","feel"]);
  responses.forEach(r => {
    r.text.toLowerCase().replace(/[^a-z\s]/g, "").split(/\s+/)
      .filter(w => w.length > 3 && !stop.has(w))
      .forEach(w => { freq[w] = (freq[w] || 0) + 1; });
  });
  const words = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 25);
  if (words.length === 0) return <div style={{ color: "#94a3b8", fontSize: 12, textAlign: "center", padding: 20 }}>No text responses yet</div>;

  const maxF = words[0]?.[1] || 1;
  const sentimentWords = {
    negative: ["burnout","overload","underpaid","leaving","quit","stressed","exhausted","unmotivated","ignored","frustrated","blocker","heavy"],
    positive: ["great","good","supported","excellent","motivated","growth","clear","happy","collaborative","appreciated"],
  };
  const getColor = useCallback((w) => {
    if (sentimentWords.negative.includes(w)) return "#ef4444";
    if (sentimentWords.positive.includes(w)) return "#22c55e";
    // Warna deterministik dari string kata — tidak random tiap render
    const palette = ["#3b82f6","#8b5cf6","#f59e0b","#10b981","#06b6d4"];
    const idx = w.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % palette.length;
    return palette[idx];
  }, []);

  // Posisi dihitung SEKALI — seed dari kata agar stabil
  const positioned = useMemo(() => {
    const rand = seededRand(words.reduce((acc, [w]) => acc + w.charCodeAt(0), 0));
    const placed = [];
    return words.map(([word, count]) => {
      const fs = Math.max(9, Math.min(26, (count / maxF) * 26));
      let x, y, att = 0;
      do { x = 15 + rand() * 370; y = 15 + rand() * 140; att++; }
      while (att < 40 && placed.some(p => Math.abs(p.x - x) < word.length * fs * 0.45 && Math.abs(p.y - y) < fs * 1.4));
      placed.push({ x, y });
      return { word, count, fs, color: getColor(word), x, y };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [words]);

  return (
    <svg width="100%" viewBox="0 0 400 170">
      {positioned.map((p) => (
        <text key={p.word} x={p.x} y={p.y} fontSize={p.fs} fill={p.color} fontWeight={p.count > 2 ? "700" : "500"} opacity={0.85}>
          {p.word}
        </text>
      ))}
    </svg>
  );
}

// Heatmap — response time simulation
function ResponseHeatmap({ responses }) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // Seed dari jumlah & sentimen responses — stabil selama responses tidak berubah
  const hasHighStress = responses.filter(r => r.sentiment === "negative").length > responses.length * 0.5;
  const heatSeed = responses.length * 13 + (hasHighStress ? 7 : 3);

  const heatData = (() => {
    const rand = seededRand(heatSeed);
    return days.map((day, di) => hours.map(h => {
      const isWeekend = di >= 5;
      const isAfterHours = h < 7 || h > 19;
      const isWorkHours = h >= 9 && h <= 17;

      if (isWeekend && isAfterHours) return hasHighStress ? Math.floor(rand() * 4) : 0;
      if (isAfterHours) return hasHighStress ? Math.floor(rand() * 6) : Math.floor(rand() * 2);
      if (isWorkHours) return Math.floor(rand() * 12) + 2;
      return Math.floor(rand() * 5);
    }));
  })();

  const maxVal = Math.max(...heatData.flat(), 1);
  const cellColor = (v) => {
    if (v === 0) return "#f8fafc";
    const intensity = v / maxVal;
    if (intensity > 0.7) return "#ef4444";
    if (intensity > 0.4) return "#f59e0b";
    if (intensity > 0.2) return "#22c55e";
    return "#bbf7d0";
  };

  // After-hours activity score
  const afterHoursCount = heatData.flat().reduce((s, v, i) => {
    const h = i % 24;
    return (h < 7 || h > 19) ? s + v : s;
  }, 0);
  const totalCount = heatData.flat().reduce((s, v) => s + v, 0);
  const afterHoursPct = totalCount > 0 ? Math.round((afterHoursCount / totalCount) * 100) : 0;

  return (
    <div>
      <div style={{ overflowX: "auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: `40px repeat(24,1fr)`, gap: 2, minWidth: 600 }}>
          <div />
          {hours.map(h => (
            <div key={h} style={{ textAlign: "center", fontSize: 7, color: "#94a3b8", padding: "2px 0" }}>
              {h % 4 === 0 ? `${h}h` : ""}
            </div>
          ))}
          {days.map((day, di) => (
            <React.Fragment key={day}>
              <div style={{ fontSize: 9, color: "#94a3b8", display: "flex", alignItems: "center", fontWeight: 600 }}>{day}</div>
              {hours.map(h => (
                <div key={`${day}-${h}`} style={{ height: 14, borderRadius: 2, background: cellColor(heatData[di][h]), transition: "background 0.3s" }} />
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>
      {afterHoursPct > 20 && (
        <div style={{ marginTop: 12, background: "#fef2f2", borderRadius: 8, padding: "8px 12px", border: "1px solid #fecaca" }}>
          <span style={{ fontSize: 11, color: "#dc2626", fontWeight: 700 }}>
            ⚠️ {afterHoursPct}% of responses submitted outside work hours — potential stress/overwork signal
          </span>
        </div>
      )}
    </div>
  );
}

// Survey Preview
function SurveyPreview({ questions, anonymous }) {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  if (submitted) return (
    <div style={{ textAlign: "center", padding: "40px 20px" }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
      <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>Thank you!</div>
      <div style={{ fontSize: 13, color: "#94a3b8" }}>Your response has been recorded {anonymous ? "anonymously" : ""}. It helps leadership make better decisions.</div>
    </div>
  );

  return (
    <div>
      {anonymous && (
        <div style={{ background: "#f0fdf4", borderRadius: 9, padding: "8px 14px", border: "1px solid #bbf7d0", marginBottom: 16, fontSize: 11, color: "#16a34a", fontWeight: 600 }}>
          🔒 Anonymous Mode — your identity is protected
        </div>
      )}
      {questions.map((q, i) => (
        <div key={q.id} style={{ background: "#f8fafc", borderRadius: 12, padding: "14px 16px", border: "1.5px solid #f1f5f9", marginBottom: 10 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 10 }}>
            <span style={{ fontSize: 16 }}>{q.icon}</span>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3 }}>{q.category}</div>
              <div style={{ fontSize: 13, color: "#1e293b", fontWeight: 500 }}>{q.text}</div>
            </div>
          </div>
          {q.type === "scale" ? (
            <div>
              <input type="range" min={1} max={10} step={1} value={answers[q.id] || 5}
                onChange={e => setAnswers(p => ({ ...p, [q.id]: Number(e.target.value) }))}
                style={{ width: "100%", accentColor: "#f59e0b" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#94a3b8", marginTop: 2 }}>
                <span>1 — Not at all</span>
                <span style={{ fontWeight: 700, color: "#f59e0b" }}>{answers[q.id] || 5}/10</span>
                <span>10 — Absolutely</span>
              </div>
            </div>
          ) : (
            <textarea rows={2} placeholder="Your response..."
              value={answers[q.id] || ""}
              onChange={e => setAnswers(p => ({ ...p, [q.id]: e.target.value }))}
              style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 12, resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" }} />
          )}
        </div>
      ))}
      <button onClick={() => setSubmitted(true)}
        style={{ width: "100%", padding: "12px", background: "linear-gradient(135deg,#f59e0b,#ef4444)", color: "#fff", border: "none", borderRadius: 11, fontSize: 14, fontWeight: 700, cursor: "pointer", marginTop: 8 }}>
        Submit Response →
      </button>
    </div>
  );
}

// Benchmark comparison
function BenchmarkChart({ history, metric }) {
  if (!history || history.length < 2) return null;
  const depts = Object.keys(history[0]?.deptData || {});
  const W = 400, H = 130, pad = { l: 36, r: 16, t: 16, b: 28 };

  const allValues = history.flatMap(w => depts.map(d => Number(w.deptData[d]?.[metric]) || 0));
  const maxV = Math.max(...allValues, 10);
  const minV = Math.min(...allValues, 0);
  const range = maxV - minV || 1;

  const colors = ["#ef4444","#f59e0b","#22c55e","#3b82f6","#8b5cf6"];
  const toX = i => pad.l + (i / (history.length - 1)) * (W - pad.l - pad.r);
  const toY = v => pad.t + (H - pad.t - pad.b) * (1 - (v - minV) / range);

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`}>
      <line x1={pad.l} y1={pad.t} x2={pad.l} y2={H - pad.b} stroke="#e2e8f0" strokeWidth={1} />
      <line x1={pad.l} y1={H - pad.b} x2={W - pad.r} y2={H - pad.b} stroke="#e2e8f0" strokeWidth={1} />
      {depts.map((dept, di) => {
        const pts = history.map((w, wi) => {
          const v = Number(w.deptData[dept]?.[metric]) || 0;
          return `${toX(wi)},${toY(v)}`;
        }).join(" ");
        return <polyline key={dept} points={pts} fill="none" stroke={colors[di % colors.length]} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" opacity={0.85} />;
      })}
      {[0, 2, 4, 6, 7].map(wi => (
        <text key={wi} x={toX(wi)} y={H - 6} textAnchor="middle" fontSize={7} fill="#94a3b8">W{wi + 1}</text>
      ))}
      <text x={pad.l - 4} y={pad.t + 4} fontSize={7} fill="#94a3b8" textAnchor="end">{maxV.toFixed(0)}</text>
      <text x={pad.l - 4} y={H - pad.b} fontSize={7} fill="#94a3b8" textAnchor="end">{minV.toFixed(0)}</text>
    </svg>
  );
}

// ── MAIN M9 ──
export default function M9PulseSurvey() {
  const { company, setPulseOverride, pushNotification } = useApp();
  const { data } = useHRData();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [anonymous, setAnonymous] = useState(true);
  const [selectedQuestions, setSelectedQuestions] = useState(QUESTION_BANK.slice(0, 4).map(q => q.id));
  const [selectedDept, setSelectedDept] = useState("All");
  const [benchmarkMetric, setBenchmarkMetric] = useState("pulseScore");
  const [alertDept, setAlertDept] = useState(null);
  const [aiIntervention, setAiIntervention] = useState({});
  const [aiLoading, setAiLoading] = useState({});
  const [liveStream, setLiveStream] = useState([]);
  const [streamActive, setStreamActive] = useState(false);
  const streamRef = useRef(null);

  const history = useMemo(() => generatePulseHistory(data), [data]);
  const current = history[history.length - 1];
  const prev = history[history.length - 2];

    // ── Auto-push latest pulse score to context (M1 can read this) ──
  useEffect(() => {
    if (!history || history.length === 0) return;
    const latest = history[history.length - 1];
    if (!latest) return;
    
    setPulseOverride({
      orgPulse: latest.orgPulse,
      deptScores: latest.deptData,
      week: latest.week,
      updatedAt: Date.now(),
    });
  }, [history, setPulseOverride]);

  const src = data.length > 0 ? data : SAMPLE_DATA;
  const depts = useMemo(() => [...new Set(src.map(e => e.Department))], [src]);

  // All text responses from history
  const allResponses = useMemo(() => history.flatMap(w => w.textResponses), [history]);

  // Current week dept scores
  const deptScores = useMemo(() => {
    return depts.map(dept => {
      const curr = current.deptData[dept];
      const prevD = prev?.deptData[dept];
      const drop = prevD ? Number(prevD.pulseScore) - Number(curr?.pulseScore || 0) : 0;
      return { dept, ...curr, prevScore: Number(prevD?.pulseScore || 0), drop };
    }).sort((a, b) => (a.pulseScore || 0) - (b.pulseScore || 0));
  }, [current, prev, depts]);

  // Burnout early warning — detect declining 3-week trend
  const earlyWarnings = useMemo(() => {
    return depts.map(dept => {
      const scores = history.slice(-4).map(w => Number(w.deptData[dept]?.pulseScore || 0));
      const declining = scores.every((v, i) => i === 0 || v <= scores[i - 1]);
      const drop3w = scores[0] - scores[scores.length - 1];
      return { dept, scores, declining, drop3w, currentScore: scores[scores.length - 1] };
    }).filter(w => w.declining && w.drop3w > 5);
  }, [history, depts]);

  // Live stream simulator
  const startStream = useCallback(() => {
    setStreamActive(true);
    setLiveStream([]);
    let count = 0;
    const responses = [
      { dept: "Sales", answer: 3, question: "How manageable was your workload?" },
      { dept: "Technical Support", answer: 2, question: "How energized do you feel?" },
      { dept: "IT", answer: 4, question: "Do you feel recognized?" },
      { dept: "HR", answer: 8, question: "How supported by your manager?" },
      { dept: "Digital Marketing", answer: 5, question: "Work-life balance this week?" },
      { dept: "Sales", answer: 2, question: "Visibility into career growth?" },
      { dept: "Technical Support", answer: 3, question: "Psychological safety to speak up?" },
      { dept: "IT", answer: 6, question: "How connected to your team?" },
    ];
    streamRef.current = setInterval(() => {
      if (count < responses.length) {
        setLiveStream(p => [...p, { ...responses[count], id: Date.now(), time: new Date().toLocaleTimeString() }]);
        count++;
      } else {
        clearInterval(streamRef.current);
        setStreamActive(false);
      }
    }, 900);
  }, []);

  useEffect(() => () => clearInterval(streamRef.current), []);

  const handleAIIntervention = useCallback(async (dept) => {
    const deptData = current.deptData[dept];
    const prevData = prev?.deptData[dept];
    const deptEmps = src.filter(e => e.Department === dept);
    const textThemes = allResponses.filter(r => r.dept === dept).map(r => r.text).join("; ");

    setAiLoading(p => ({ ...p, [dept]: true }));
    try {
      const text = await fetchAIIntervention({
        dept, prevScore: Number(prevData?.pulseScore || 50), currScore: Number(deptData?.pulseScore || 40),
        drop: Number(prevData?.pulseScore || 50) - Number(deptData?.pulseScore || 40),
        affectedMetrics: ["workload","wellbeing","energy"].filter(m => Number(deptData?.[m]) < 4),
        deptSize: deptEmps.length, responseRate: deptData?.responseRate || 0,
        textThemes: textThemes || "No text responses available",
      }, company);
      setAiIntervention(p => ({ ...p, [dept]: text }));
    } catch (err) {
      setAiIntervention(p => ({ ...p, [dept]: `⚠️ AI unavailable: ${err?.message || "Check connection."}` }));
    } finally {
      setAiLoading(p => ({ ...p, [dept]: false }));
    }
  }, [current, prev, src, allResponses, company]);

  const toggleQuestion = useCallback((id) => {
    setSelectedQuestions(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  }, []);
  const selectedQObjs = QUESTION_BANK.filter(q => selectedQuestions.includes(q.id));

  const TABS = [
    { id: "dashboard", label: "📊 Live Dashboard" },
    { id: "stream", label: "⚡ Live Stream" },
    { id: "trends", label: "📈 Trend Analysis" },
    { id: "heatmap", label: "🌡️ Response Heatmap" },
    { id: "wordcloud", label: "☁️ Word Cloud" },
    { id: "builder", label: "🛠️ Survey Builder" },
    { id: "preview", label: "👁️ Survey Preview" },
  ];

  const metricLabel = { pulseScore: "Pulse Score", workload: "Workload", wellbeing: "Wellbeing", energy: "Energy", recognition: "Recognition" };

  return (
    <div>
      {/* Burnout Early Warning Banner */}
      {earlyWarnings.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          {earlyWarnings.map(w => (
            <div key={w.dept} style={{ background: "#fef2f2", borderRadius: 12, padding: "12px 18px", border: "2px solid #ef4444", marginBottom: 8, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ fontSize: 22, flexShrink: 0 }}>🔥</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: 13, color: "#dc2626" }}>
                  BURNOUT EARLY WARNING — {w.dept}
                </div>
                <div style={{ fontSize: 11, color: "#7f1d1d", marginTop: 2 }}>
                  Pulse score has declined for {w.scores.length} consecutive weeks. Drop of {w.drop3w} points.
                  Current score: {w.currentScore}. Intervene before this becomes a resignation wave.
                </div>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                {w.scores.map((s, i) => (
                  <div key={`${w.dept}-score-${i}`} style={{ width: 6, height: Math.max(4, (s / 100) * 30), background: s < 40 ? "#ef4444" : s < 60 ? "#f59e0b" : "#22c55e", borderRadius: 2, alignSelf: "flex-end" }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 7, marginBottom: 20, flexWrap: "wrap" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            style={{
              padding: "8px 15px", borderRadius: 10, cursor: "pointer",
              background: activeTab === t.id ? "linear-gradient(135deg,#f59e0b,#ef4444)" : "#fff",
              color: activeTab === t.id ? "#fff" : "#64748b",
              fontWeight: activeTab === t.id ? 700 : 500, fontSize: 12,
              border: `1.5px solid ${activeTab === t.id ? "transparent" : "#e2e8f0"}`,
              transition: "all 0.15s",
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: LIVE DASHBOARD ── */}
      {activeTab === "dashboard" && (
        <div>
          {/* Org KPIs */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 12, marginBottom: 18 }}>
            {[
              { label: "Org Pulse Score", value: current.orgPulse, sub: `${current.orgPulse > (prev?.orgPulse || 50) ? "↑" : "↓"} vs last week`, color: current.orgPulse >= 70 ? "#22c55e" : current.orgPulse >= 50 ? "#f59e0b" : "#ef4444", icon: "💓", bg: current.orgPulse >= 70 ? "#f0fdf4" : current.orgPulse >= 50 ? "#fffbeb" : "#fef2f2" },
              { label: "Early Warnings", value: earlyWarnings.length, sub: "Depts with declining trend", color: earlyWarnings.length > 0 ? "#ef4444" : "#22c55e", icon: "🔥", bg: earlyWarnings.length > 0 ? "#fef2f2" : "#f0fdf4" },
              { label: "Avg Response Rate", value: `${Math.round(Object.values(current.deptData).reduce((s, d) => s + d.responseRate, 0) / Math.max(Object.keys(current.deptData).length, 1))}%`, sub: "This week's participation", color: "#3b82f6", icon: "📊", bg: "#eff6ff" },
              { label: "Total Responses", value: Object.values(current.deptData).reduce((s, d) => s + d.responses, 0), sub: "Across all departments", color: "#8b5cf6", icon: "✅", bg: "#f5f3ff" },
              { label: "Week-on-Week", value: `${current.orgPulse > (prev?.orgPulse || 50) ? "+" : ""}${current.orgPulse - (prev?.orgPulse || 50)} pts`, sub: "Pulse score change", color: current.orgPulse >= (prev?.orgPulse || 50) ? "#22c55e" : "#ef4444", icon: "📈", bg: current.orgPulse >= (prev?.orgPulse || 50) ? "#f0fdf4" : "#fef2f2" },
              { label: "Lowest Dept", value: deptScores[0]?.dept || "—", sub: `Score: ${deptScores[0]?.pulseScore || 0}`, color: "#ef4444", icon: "⚠️", bg: "#fef2f2" },
            ].map((k) => (
              <div key={k.label} style={{ background: k.bg, borderRadius: 13, padding: "13px 15px", border: `1.5px solid ${k.color}22`, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", right: 8, top: 8, fontSize: 16, opacity: 0.2 }}>{k.icon}</div>
                <div style={{ fontSize: 9, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>{k.label}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: k.color, fontFamily: "'Playfair Display',Georgia,serif", lineHeight: 1.1 }}>{k.value}</div>
                <div style={{ fontSize: 10, color: "#64748b", marginTop: 3 }}>{k.sub}</div>
              </div>
            ))}
          </div>

          {/* Dept Pulse Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 14, marginBottom: 18 }}>
            {deptScores.map(d => {
              const color = d.pulseScore >= 70 ? "#22c55e" : d.pulseScore >= 50 ? "#f59e0b" : d.pulseScore >= 30 ? "#f97316" : "#ef4444";
              const bg = d.pulseScore >= 70 ? "#f0fdf4" : d.pulseScore >= 50 ? "#fffbeb" : d.pulseScore >= 30 ? "#fff7ed" : "#fef2f2";
              const border = d.pulseScore >= 70 ? "#bbf7d0" : d.pulseScore >= 50 ? "#fde68a" : d.pulseScore >= 30 ? "#fed7aa" : "#fecaca";
              const weekScores = history.map(w => Number(w.deptData[d.dept]?.pulseScore || 0));
              const isWarning = earlyWarnings.find(w => w.dept === d.dept);

              return (
                <div key={d.dept} style={{ background: bg, borderRadius: 14, padding: "16px 18px", border: `2px solid ${isWarning ? "#ef4444" : border}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}>{d.dept}</div>
                      <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 1 }}>{d.responses}/{d.totalEmps} responded ({d.responseRate}%)</div>
                    </div>
                    <PulseGauge score={d.pulseScore || 0} size={60} label="pulse" />
                  </div>

                  {/* Metric mini bars */}
                  {[
                    { label: "Workload", val: d.workload },
                    { label: "Wellbeing", val: d.wellbeing },
                    { label: "Energy", val: d.energy },
                    { label: "Recognition", val: d.recognition },
                  ].map(m => {
                    const pct = (Number(m.val) / 10) * 100;
                    const mc = Number(m.val) >= 7 ? "#22c55e" : Number(m.val) >= 4 ? "#f59e0b" : "#ef4444";
                    return (
                      <div key={m.label} style={{ marginBottom: 5 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "#94a3b8", marginBottom: 2 }}>
                          <span>{m.label}</span><span style={{ fontWeight: 700, color: mc }}>{m.val}/10</span>
                        </div>
                        <div style={{ height: 4, background: "#f1f5f9", borderRadius: 2, overflow: "hidden" }}>
                          <div style={{ width: `${pct}%`, height: "100%", background: mc, borderRadius: 2, transition: "width 0.4s" }} />
                        </div>
                      </div>
                    );
                  })}

                  {/* Sparkline trend */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                    <div style={{ fontSize: 9, color: "#94a3b8" }}>8-week trend</div>
                    <Sparkline values={weekScores} color={color} width={70} height={22} />
                  </div>

                  {/* Drop alert */}
                  {d.drop > 5 && (
                    <div style={{ marginTop: 8, background: "#fef2f2", borderRadius: 8, padding: "6px 10px", border: "1px solid #fecaca" }}>
                      <div style={{ fontSize: 10, color: "#dc2626", fontWeight: 700 }}>⚠️ {d.drop} pt drop from last week</div>
                    </div>
                  )}

                  {/* AI Intervention button */}
                  {d.pulseScore < 50 && (
                    <div style={{ marginTop: 10 }}>
                      <button onClick={() => handleAIIntervention(d.dept)} disabled={aiLoading[d.dept]}
                        style={{ width: "100%", padding: "8px", background: aiLoading[d.dept] ? "#f1f5f9" : "#0f172a", color: aiLoading[d.dept] ? "#94a3b8" : "#fff", border: "none", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: aiLoading[d.dept] ? "not-allowed" : "pointer" }}>
                        {aiLoading[d.dept] ? "⏳ Generating..." : "🤖 AI Intervention Plan"}
                      </button>
                      {aiIntervention[d.dept] && (
                        <div style={{ marginTop: 8, background: "#f8fafc", borderRadius: 8, padding: "10px 12px", border: "1px solid #e2e8f0", fontSize: 11, color: "#1e293b", lineHeight: 1.6 }}>
                          {aiIntervention[d.dept]}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Anonymous toggle */}
          <div style={{ background: "#fff", borderRadius: 12, padding: "12px 18px", border: "1.5px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}>🔒 Anonymous Mode</div>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>When on, responses are collected without names — increases honesty</div>
            </div>
            <button onClick={() => setAnonymous(p => !p)}
              style={{ padding: "8px 18px", borderRadius: 9, border: "none", cursor: "pointer", background: anonymous ? "#22c55e" : "#f1f5f9", color: anonymous ? "#fff" : "#64748b", fontWeight: 700, fontSize: 12, transition: "all 0.2s" }}>
              {anonymous ? "🔒 Anonymous ON" : "Anonymous OFF"}
            </button>
          </div>
        </div>
      )}

      {/* ── TAB: LIVE STREAM ── */}
      {activeTab === "stream" && (
        <div>
          <div style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", border: "1.5px solid #f1f5f9", marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>⚡ Real-Time Response Stream</div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>Live responses as they come in — updates M1 satisfaction scores</div>
              </div>
              <button onClick={startStream} disabled={streamActive}
                style={{ padding: "9px 18px", background: streamActive ? "#f1f5f9" : "linear-gradient(135deg,#f59e0b,#ef4444)", color: streamActive ? "#94a3b8" : "#fff", border: "none", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: streamActive ? "not-allowed" : "pointer" }}>
                {streamActive ? "⏳ Streaming..." : "▶ Simulate Live Stream"}
              </button>
            </div>

            {liveStream.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
                <div style={{ fontSize: 32, marginBottom: 10 }}>📡</div>
                <div style={{ fontSize: 13 }}>Press "Simulate Live Stream" to see real-time responses</div>
              </div>
            ) : (
              <div>
                {liveStream.map((r, i) => {
                  const color = r.answer >= 7 ? "#22c55e" : r.answer >= 4 ? "#f59e0b" : "#ef4444";
                  return (
                    <div key={r.id} style={{
                      background: "#f8fafc", borderRadius: 10, padding: "10px 14px", marginBottom: 8,
                      border: `1.5px solid ${color}33`,
                      animation: i === liveStream.length - 1 ? "none" : undefined,
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, boxShadow: `0 0 6px ${color}` }} />
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: "#1e293b" }}>{r.question}</div>
                            <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 1 }}>{anonymous ? "Anonymous" : r.dept} · {r.time}</div>
                          </div>
                        </div>
                        <div style={{ fontSize: 18, fontWeight: 800, color, fontFamily: "'Playfair Display',Georgia,serif" }}>{r.answer}/10</div>
                      </div>
                      <div style={{ marginTop: 6, height: 4, background: "#e2e8f0", borderRadius: 2, overflow: "hidden" }}>
                        <div style={{ width: `${r.answer * 10}%`, height: "100%", background: color, borderRadius: 2 }} />
                      </div>
                    </div>
                  );
                })}
                {!streamActive && liveStream.length > 0 && (
                  <div style={{ background: "#f0fdf4", borderRadius: 10, padding: "10px 14px", border: "1px solid #bbf7d0", marginTop: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#16a34a" }}>
                      ✅ Stream complete — {liveStream.length} responses received
                    </div>
                    <div style={{ fontSize: 10, color: "#64748b", marginTop: 3 }}>
                      Avg score: {(liveStream.reduce((s, r) => s + r.answer, 0) / liveStream.length).toFixed(1)}/10 —
                      {liveStream.filter(r => r.answer < 4).length} low scores flagged
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: TRENDS ── */}
      {activeTab === "trends" && (
        <div>
          <div style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", border: "1.5px solid #f1f5f9", marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>📈 8-Week Trend Analysis</div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>Track how pulse scores evolve over time — catch declining trends early</div>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {Object.entries(metricLabel).map(([k, v]) => (
                  <button key={k} onClick={() => setBenchmarkMetric(k)}
                    style={{ padding: "5px 12px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 11, background: benchmarkMetric === k ? "#f59e0b" : "#f1f5f9", color: benchmarkMetric === k ? "#fff" : "#64748b", fontWeight: benchmarkMetric === k ? 700 : 500 }}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
            <BenchmarkChart history={history} metric={benchmarkMetric} />
            <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
              {depts.map((d, i) => {
                const colors = ["#ef4444","#f59e0b","#22c55e","#3b82f6","#8b5cf6"];
                return (
                  <div key={d} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <div style={{ width: 14, height: 3, borderRadius: 2, background: colors[i % colors.length] }} />
                    <span style={{ fontSize: 10, color: "#64748b" }}>{d}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Week-by-week table */}
          <div style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", border: "1.5px solid #f1f5f9" }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", marginBottom: 14 }}>Dept Pulse Score — All 8 Weeks</div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    <th style={{ padding: "7px 10px", textAlign: "left", color: "#64748b", fontWeight: 700, fontSize: 10, textTransform: "uppercase", borderBottom: "2px solid #f1f5f9" }}>Department</th>
                    {history.map((w, i) => (
                      <th key={w.week} style={{ padding: "7px 8px", textAlign: "center", color: "#64748b", fontWeight: 700, fontSize: 10, borderBottom: "2px solid #f1f5f9", whiteSpace: "nowrap" }}>
                        W{i + 1}
                      </th>
                    ))}
                    <th style={{ padding: "7px 8px", textAlign: "center", color: "#64748b", fontWeight: 700, fontSize: 10, borderBottom: "2px solid #f1f5f9" }}>Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {depts.map((dept, di) => {
                    const scores = history.map(w => Number(w.deptData[dept]?.pulseScore || 0));
                    return (
                      <tr key={dept} style={{ borderBottom: "1px solid #f8fafc", background: di % 2 === 0 ? "#fff" : "#fafafa" }}>
                        <td style={{ padding: "7px 10px", fontWeight: 600, color: "#1e293b" }}>{dept}</td>
                        {scores.map((s, i) => {
                          const color = s >= 70 ? "#22c55e" : s >= 50 ? "#f59e0b" : s >= 30 ? "#f97316" : "#ef4444";
                          const isLast = i === scores.length - 1;
                          return (
                            <td key={`w${i+1}`} style={{ padding: "5px 4px", textAlign: "center" }}>
                              <div style={{ background: isLast ? color : `${color}22`, borderRadius: 5, padding: "3px 5px", fontSize: 11, fontWeight: isLast ? 800 : 600, color: isLast ? "#fff" : color }}>
                                {s}
                              </div>
                            </td>
                          );
                        })}
                        <td style={{ padding: "7px 8px" }}>
                          <Sparkline values={scores} color={scores[scores.length - 1] >= 60 ? "#22c55e" : "#ef4444"} width={60} height={20} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: HEATMAP ── */}
      {activeTab === "heatmap" && (
        <div>
          <div style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", border: "1.5px solid #f1f5f9", marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", marginBottom: 4 }}>🌡️ Response Time Heatmap</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 16 }}>
              When employees submit responses — after-hours activity signals overwork or stress
            </div>
            <ResponseHeatmap responses={allResponses} />
          </div>

          {/* Cross-module */}
          <div style={{ background: "#fff8f0", borderRadius: 14, padding: "16px 18px", border: "1.5px solid #fed7aa" }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#9a3412", marginBottom: 10 }}>🔗 What This Signals Cross-Platform</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                { icon: "😴", text: "→ M7: High after-hours response rate corroborates fatigue index data" },
                { icon: "🏥", text: "→ M4: Weekend responses from dept = burnout index needs recalculation" },
                { icon: "🎯", text: "→ M2: Employees responding at 11PM have elevated flight risk — run score" },
                { icon: "📈", text: "→ M6: After-hours patterns justify overtime cap investment in ROI calc" },
              ].map((item) => (
                <div key={item.icon} style={{ background: "#fff", borderRadius: 8, padding: "8px 12px", border: "1px solid #fed7aa", fontSize: 11, color: "#64748b" }}>
                  <span style={{ marginRight: 6 }}>{item.icon}</span>{item.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: WORD CLOUD ── */}
      {activeTab === "wordcloud" && (
        <div>
          <div style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", border: "1.5px solid #f1f5f9", marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4, flexWrap: "wrap", gap: 10 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>☁️ Voice of Employee Word Cloud</div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                  Extracted from {allResponses.length} text responses · Red = negative · Green = positive
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {["All", ...depts].map(d => (
                  <button key={d} onClick={() => setSelectedDept(d)}
                    style={{ padding: "4px 10px", borderRadius: 16, border: "none", cursor: "pointer", fontSize: 11, background: selectedDept === d ? "#f59e0b" : "#f1f5f9", color: selectedDept === d ? "#fff" : "#64748b", fontWeight: selectedDept === d ? 700 : 500 }}>
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ background: "#f8fafc", borderRadius: 12, padding: "20px", border: "1.5px solid #f1f5f9" }}>
              <WordCloud responses={selectedDept === "All" ? allResponses : allResponses.filter(r => r.dept === selectedDept)} />
            </div>
          </div>

          {/* Text responses list */}
          <div style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", border: "1.5px solid #f1f5f9" }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", marginBottom: 14 }}>Raw Text Responses</div>
            {(selectedDept === "All" ? allResponses : allResponses.filter(r => r.dept === selectedDept)).map((r, i) => {
              const color = r.sentiment === "positive" ? "#22c55e" : r.sentiment === "negative" ? "#ef4444" : "#f59e0b";
              const bg = r.sentiment === "positive" ? "#f0fdf4" : r.sentiment === "negative" ? "#fef2f2" : "#fffbeb";
              return (
                <div key={`${r.dept}-${i}`} style={{ background: bg, borderRadius: 9, padding: "10px 14px", border: `1px solid ${color}33`, marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8" }}>{r.dept}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color, textTransform: "capitalize" }}>{r.sentiment}</span>
                  </div>
                  <div style={{ fontSize: 12, color: "#1e293b", lineHeight: 1.5, fontStyle: "italic" }}>"{r.text}"</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── TAB: SURVEY BUILDER ── */}
      {activeTab === "builder" && (
        <div>
          <div style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", border: "1.5px solid #f1f5f9", marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", marginBottom: 4 }}>🛠️ Survey Builder</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 16 }}>Select 2–5 questions for this week's survey · Mix scale + open-ended</div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {QUESTION_BANK.map(q => {
                const selected = selectedQuestions.includes(q.id);
                return (
                  <div key={q.id} onClick={() => toggleQuestion(q.id)}
                    style={{
                      background: selected ? "#fffbeb" : "#f8fafc", borderRadius: 11, padding: "12px 14px",
                      border: `2px solid ${selected ? "#f59e0b" : "#f1f5f9"}`,
                      cursor: "pointer", transition: "all 0.15s",
                    }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 16 }}>{q.icon}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: selected ? "#b45309" : "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>{q.category}</span>
                      {selected && <span style={{ marginLeft: "auto", background: "#f59e0b", color: "#fff", fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 8 }}>SELECTED</span>}
                    </div>
                    <div style={{ fontSize: 12, color: "#1e293b", lineHeight: 1.4 }}>{q.text}</div>
                    <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 4 }}>{q.type === "scale" ? "1–10 Scale" : "Open text"}</div>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: 16, background: "#fffbeb", borderRadius: 10, padding: "12px 16px", border: "1px solid #fde68a", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 12, color: "#92400e" }}>{selectedQuestions.length} questions selected</div>
                <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>Recommended: 2–4 questions for highest response rate</div>
              </div>
              <button onClick={() => setActiveTab("preview")}
                style={{ padding: "9px 18px", background: "linear-gradient(135deg,#f59e0b,#ef4444)", color: "#fff", border: "none", borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                Preview Survey →
              </button>
            </div>
          </div>

          {/* Shareable link simulator */}
          <div style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", border: "1.5px solid #f1f5f9" }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", marginBottom: 14 }}>🔗 Survey Link Generator</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {depts.map(dept => {
                const link = `attritioniq.app/survey/${dept.toLowerCase().replace(/\s/g, "-")}/${(dept.charCodeAt(0) * 31 + selectedQuestions.length).toString(36)}`;
                return (
                  <div key={dept} style={{ background: "#f8fafc", borderRadius: 10, padding: "12px 14px", border: "1.5px solid #f1f5f9" }}>
                    <div style={{ fontWeight: 600, fontSize: 12, color: "#1e293b", marginBottom: 6 }}>{dept}</div>
                    <div style={{ fontSize: 10, color: "#94a3b8", background: "#fff", borderRadius: 7, padding: "6px 10px", border: "1px solid #e2e8f0", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {link}
                    </div>
                    <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                      <div style={{ background: anonymous ? "#f0fdf4" : "#fef2f2", border: `1px solid ${anonymous ? "#bbf7d0" : "#fecaca"}`, borderRadius: 6, padding: "3px 8px", fontSize: 9, color: anonymous ? "#16a34a" : "#dc2626", fontWeight: 700 }}>
                        {anonymous ? "🔒 Anonymous" : "Named"}
                      </div>
                      <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 6, padding: "3px 8px", fontSize: 9, color: "#1d4ed8", fontWeight: 700 }}>
                        {selectedQuestions.length}Q
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: PREVIEW ── */}
      {activeTab === "preview" && (
        <div>
          <div style={{ background: "#fff", borderRadius: 14, padding: "20px 22px", border: "1.5px solid #f1f5f9", maxWidth: 520, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>⚡</div>
              <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 20, fontWeight: 700, color: "#0f172a" }}>Weekly Pulse Check</div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
                {company?.name || "Pulse Digital"} · Takes ~2 minutes · {selectedQuestions.length} questions
              </div>
            </div>
            <SurveyPreview questions={selectedQObjs} anonymous={anonymous} />
          </div>
        </div>
      )}
    </div>
  );
}
