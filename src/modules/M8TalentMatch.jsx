import { useState, useMemo, useCallback } from "react";
import { useApp, useHRData, getGeneration, SAMPLE_DATA } from "../context/AppContext";
// ── Skill taxonomy ──
const SKILL_CATEGORIES = {
  "Customer & Sales": ["Customer Communication","Negotiation","CRM Tools","Lead Generation","Account Management","Sales Analytics","Objection Handling","Relationship Building"],
  "Technical & IT": ["SQL","Python","Data Analysis","System Administration","Network Security","Troubleshooting","API Integration","Cloud Platforms"],
  "Operations & Process": ["Process Improvement","Six Sigma","Lean Methods","Inventory Management","Quality Control","Workflow Design","Root Cause Analysis","SOP Development"],
  "HR & People": ["Talent Acquisition","Employee Relations","Performance Management","L&D Facilitation","HRIS Systems","Compensation Analysis","Conflict Resolution","Onboarding"],
  "Marketing & Content": ["Content Creation","SEO/SEM","Social Media","Campaign Management","Copywriting","Analytics","Brand Strategy","Email Marketing"],
  "Leadership & Soft Skills": ["Project Management","Team Leadership","Stakeholder Communication","Problem Solving","Adaptability","Critical Thinking","Mentoring","Public Speaking"],
};

const ALL_SKILLS = Object.values(SKILL_CATEGORIES).flat();

// ── Dept skill requirements ──
const DEPT_REQUIREMENTS = {
  "Sales": { required: ["Customer Communication","Negotiation","CRM Tools","Lead Generation","Sales Analytics"], preferred: ["Relationship Building","Account Management","Objection Handling","Project Management"] },
  "Technical Support": { required: ["Troubleshooting","Customer Communication","System Administration","API Integration"], preferred: ["SQL","Network Security","CRM Tools","Process Improvement"] },
  "IT": { required: ["SQL","Python","System Administration","Network Security","API Integration"], preferred: ["Cloud Platforms","Troubleshooting","Data Analysis","Process Improvement"] },
  "HR": { required: ["Talent Acquisition","Employee Relations","HRIS Systems","Onboarding"], preferred: ["Performance Management","L&D Facilitation","Compensation Analysis","Conflict Resolution"] },
  "Digital Marketing": { required: ["Content Creation","SEO/SEM","Social Media","Campaign Management"], preferred: ["Analytics","Copywriting","Email Marketing","Brand Strategy"] },
  "Operations": { required: ["Process Improvement","Lean Methods","Workflow Design","SOP Development"], preferred: ["Six Sigma","Root Cause Analysis","Quality Control","Inventory Management"] },
};

// ── Compute match score ──
function computeMatchScore(candidateSkills, targetDept) {
  const req = DEPT_REQUIREMENTS[targetDept];
  if (!req) return { score: 0, matched: [], missing: [], preferred: [] };

  const matched = req.required.filter(s => candidateSkills.includes(s));
  const missing = req.required.filter(s => !candidateSkills.includes(s));
  const preferredMatched = req.preferred.filter(s => candidateSkills.includes(s));

  const reqScore = req.required.length > 0 ? (matched.length / req.required.length) * 70 : 0;
  const prefScore = req.preferred.length > 0 ? (preferredMatched.length / req.preferred.length) * 30 : 0;
  const score = Math.round(reqScore + prefScore);

  return { score, matched, missing, preferredMatched };
}

// ── AI Matchmaker ──
async function fetchAIMatch(candidate, matches, company) {
  const topMatches = matches.slice(0, 3);
  const prompt = `You are an internal mobility specialist at ${company?.name || "a company"}.

Candidate Profile:
- Name: ${candidate.name || "Anonymous"}
- Current Department: ${candidate.currentDept}
- At-Risk Status: ${candidate.atRiskReason}
- Skills: ${candidate.skills.join(", ")}
- Years at Company: ${candidate.tenure}

Top 3 Internal Transfer Matches:
${topMatches.map((m, i) => `${i + 1}. ${m.dept} — ${m.score}% match | Missing skills: ${m.missing.join(", ") || "none"}`).join("\n")}

Write 3 short paragraphs:
1. Why this employee is worth retaining through internal transfer (personalized to their profile)
2. Your top recommended transfer with specific reasoning
3. A 30-day transition plan: what skills they need to develop before transfer

Under 150 words. Be specific and actionable. No bullet points.`;

  const response = await fetch("https://gemini-api-amber-iota.vercel.app/api/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: [{ content: prompt }] }),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  return data.content?.[0]?.text || data.text || data.response || "AI recommendation unavailable.";
}

// ── Radar Chart for skill overlap ──
function SkillRadar({ candidateSkills, deptRequired, size = 200 }) {
  const skills = deptRequired.slice(0, 6);
  const n = skills.length;
  if (n === 0) return null;
  const cx = size / 2, cy = size / 2, r = size * 0.36;
  const innerR = r * 0.15;

  const points = skills.map((skill, i) => {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
    const has = candidateSkills.includes(skill) ? 1 : 0.1;
    const pr = innerR + has * (r - innerR);
    return { x: cx + pr * Math.cos(angle), y: cy + pr * Math.sin(angle), angle, skill, has: has === 1 };
  });

  const gridPoints = skills.map((_, i) => {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  });

  const polygonStr = points.map(p => `${p.x},${p.y}`).join(" ");

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {[0.25, 0.5, 0.75, 1].map(s => (
        <polygon key={s}
          points={skills.map((_, i) => {
            const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
            const pr = innerR + s * (r - innerR);
            return `${cx + pr * Math.cos(angle)},${cy + pr * Math.sin(angle)}`;
          }).join(" ")}
          fill="none" stroke="#f1f5f9" strokeWidth={1}
        />
      ))}
      {gridPoints.map((p, i) => (
        <line key={`axis-${i}`} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#e2e8f0" strokeWidth={1} />
      ))}
      <polygon points={polygonStr} fill="#f59e0b" fillOpacity={0.25} stroke="#f59e0b" strokeWidth={2} />
      {points.map((p, i) => (
        <circle key={`pt-${i}`} cx={p.x} cy={p.y} r={4}
          fill={p.has ? "#22c55e" : "#ef4444"}
          stroke="#fff" strokeWidth={1.5}
        />
      ))}
      {skills.map((skill, i) => {
        const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
        const lx = cx + (r + 18) * Math.cos(angle);
        const ly = cy + (r + 18) * Math.sin(angle);
        return (
          <text key={skill} x={lx} y={ly} textAnchor="middle" fontSize={7.5} fill="#475569" dominantBaseline="middle">
            {skill.length > 12 ? skill.slice(0, 11) + "…" : skill}
          </text>
        );
      })}
    </svg>
  );
}

// ── Match Score Bar ──
function MatchBar({ dept, score, matched, missing, preferredMatched, onSelect, selected }) {
  const color = score >= 75 ? "#22c55e" : score >= 50 ? "#f59e0b" : score >= 30 ? "#3b82f6" : "#94a3b8";
  const bg = score >= 75 ? "#f0fdf4" : score >= 50 ? "#fffbeb" : score >= 30 ? "#eff6ff" : "#f8fafc";
  const border = score >= 75 ? "#bbf7d0" : score >= 50 ? "#fde68a" : score >= 30 ? "#bfdbfe" : "#e2e8f0";

  return (
    <div onClick={() => onSelect(dept)}
      style={{
        background: selected ? "#fffbeb" : bg, borderRadius: 12, padding: "14px 16px",
        border: `2px solid ${selected ? "#f59e0b" : border}`,
        cursor: "pointer", transition: "all 0.2s",
        boxShadow: selected ? "0 0 0 3px #f59e0b22" : "none",
        marginBottom: 10,
      }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}>{dept}</div>
        <div style={{ fontSize: 22, fontWeight: 800, color, fontFamily: "'Playfair Display',Georgia,serif" }}>{score}%</div>
      </div>
      <div style={{ height: 8, background: "#f1f5f9", borderRadius: 4, overflow: "hidden", marginBottom: 8 }}>
        <div style={{ width: `${score}%`, height: "100%", background: color, borderRadius: 4, transition: "width 0.5s" }} />
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {matched.slice(0, 3).map(s => (
          <span key={s} style={{ background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", padding: "2px 7px", borderRadius: 10, fontSize: 9, fontWeight: 700 }}>✓ {s}</span>
        ))}
        {missing.slice(0, 2).map(s => (
          <span key={s} style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", padding: "2px 7px", borderRadius: 10, fontSize: 9, fontWeight: 600 }}>✗ {s}</span>
        ))}
        {(matched.length + missing.length > 5) && (
          <span style={{ fontSize: 9, color: "#94a3b8" }}>+{matched.length + missing.length - 5} more</span>
        )}
      </div>
    </div>
  );
}

// ── Skill Matrix Builder ──
function SkillMatrixBuilder({ selectedSkills, onChange }) {
  const [search, setSearch] = useState("");
  const filtered = search
    ? ALL_SKILLS.filter(s => s.toLowerCase().includes(search.toLowerCase()))
    : null;

  return (
    <div>
      <input
        type="text" value={search} placeholder="Search skills..."
        onChange={e => setSearch(e.target.value)}
        style={{ width: "100%", padding: "8px 12px", borderRadius: 9, border: "1.5px solid #e2e8f0", fontSize: 12, color: "#1e293b", background: "#f8fafc", marginBottom: 12, boxSizing: "border-box" }}
      />

      {search ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
          {filtered?.map(s => (
            <button key={s} onClick={() => onChange(selectedSkills.includes(s) ? selectedSkills.filter(x => x !== s) : [...selectedSkills, s])}
              style={{
                padding: "4px 10px", borderRadius: 16, border: "none", cursor: "pointer", fontSize: 11,
                background: selectedSkills.includes(s) ? "#22c55e" : "#f1f5f9",
                color: selectedSkills.includes(s) ? "#fff" : "#64748b",
                fontWeight: selectedSkills.includes(s) ? 700 : 500,
              }}>
              {selectedSkills.includes(s) ? "✓ " : ""}{s}
            </button>
          ))}
        </div>
      ) : (
        Object.entries(SKILL_CATEGORIES).map(([cat, skills]) => (
          <div key={cat} style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>{cat}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {skills.map(s => (
                <button key={s}
                  onClick={() => onChange(selectedSkills.includes(s) ? selectedSkills.filter(x => x !== s) : [...selectedSkills, s])}
                  style={{
                    padding: "4px 10px", borderRadius: 16, border: "none", cursor: "pointer", fontSize: 11,
                    background: selectedSkills.includes(s) ? "#f59e0b" : "#f1f5f9",
                    color: selectedSkills.includes(s) ? "#fff" : "#64748b",
                    fontWeight: selectedSkills.includes(s) ? 700 : 500,
                    transition: "all 0.12s",
                  }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        ))
      )}

      <div style={{ marginTop: 8, fontSize: 11, color: "#94a3b8" }}>
        {selectedSkills.length} skills selected
        {selectedSkills.length > 0 && (
          <button onClick={() => onChange([])}
            style={{ marginLeft: 10, fontSize: 10, color: "#ef4444", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>
            Clear all
          </button>
        )}
      </div>
    </div>
  );
}

// ── At-Risk Employee Picker ──
function AtRiskPicker({ data, onSelect }) {
  const src = data.length > 0 ? data : SAMPLE_DATA;
  const atRisk = src.filter(e => e.AttritionStatus !== "Active").slice(0, 15);

  return (
    <div>
      <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 10 }}>Click an at-risk employee to auto-load their profile</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {atRisk.map((e) => (
          <button key={e.EmployeeID} onClick={() => onSelect(e)}
            style={{
              padding: "5px 12px", borderRadius: 20, cursor: "pointer", fontSize: 11,
              background: e.AttritionStatus === "Resigned" ? "#fef2f2" : "#fffbeb",
              color: e.AttritionStatus === "Resigned" ? "#dc2626" : "#b45309",
              fontWeight: 600,
              border: `1px solid ${e.AttritionStatus === "Resigned" ? "#fecaca" : "#fde68a"}`,
            }}>
            {e.FirstName} {e.LastName} · {e.Department}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Org Mobility Map ──
function OrgMobilityMap({ data }) {
  const src = data.length > 0 ? data : SAMPLE_DATA;
  const depts = [...new Set(src.map(e => e.Department))];

  // Build transfer opportunity matrix
  const matrix = {};
  depts.forEach(from => {
    matrix[from] = {};
    depts.forEach(to => {
      if (from === to) { matrix[from][to] = null; return; }
      const fromEmps = src.filter(e => e.Department === from && e.AttritionStatus !== "Active");
      const toReqs = DEPT_REQUIREMENTS[to];
      if (!toReqs || fromEmps.length === 0) { matrix[from][to] = 0; return; }
      // Infer skills from dept
      const fromSkills = DEPT_REQUIREMENTS[from]?.required || [];
      const avgMatch = Math.round(
        fromSkills.filter(s => toReqs.required.includes(s)).length / Math.max(toReqs.required.length, 1) * 100
      );
      matrix[from][to] = avgMatch;
    });
  });

  const cellColor = v => {
    if (v === null) return "#f1f5f9";
    if (v >= 60) return "#22c55e";
    if (v >= 35) return "#f59e0b";
    if (v >= 15) return "#3b82f6";
    return "#e2e8f0";
  };
  const cellText = v => {
    if (v === null) return "—";
    return `${v}%`;
  };

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ borderCollapse: "separate", borderSpacing: 3, fontSize: 11 }}>
        <thead>
          <tr>
            <th style={{ padding: "6px 10px", textAlign: "left", color: "#64748b", fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>From ↓ To →</th>
            {depts.map(d => (
              <th key={d} style={{ padding: "6px 8px", textAlign: "center", color: "#64748b", fontSize: 9, fontWeight: 700, maxWidth: 80 }}>
                {d.length > 8 ? d.slice(0, 7) + "…" : d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {depts.map(from => (
            <tr key={from}>
              <td style={{ padding: "5px 10px", fontWeight: 600, color: "#1e293b", fontSize: 11, whiteSpace: "nowrap" }}>{from}</td>
              {depts.map(to => {
                const val = matrix[from]?.[to];
                return (
                  <td key={to} style={{ padding: "2px" }}>
                    <div style={{
                      background: cellColor(val), borderRadius: 5, padding: "5px 6px",
                      textAlign: "center", fontSize: 10, fontWeight: 700,
                      color: val !== null && val >= 15 ? "#fff" : "#94a3b8",
                      minWidth: 36, opacity: 0.9,
                    }}>
                      {cellText(val)}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
        {[{ label: "Strong match (60%+)", color: "#22c55e" }, { label: "Possible (35–59%)", color: "#f59e0b" }, { label: "Stretch (15–34%)", color: "#3b82f6" }, { label: "Poor fit (<15%)", color: "#e2e8f0" }].map(l => (
          <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: l.color }} />
            <span style={{ fontSize: 9, color: "#64748b" }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── MAIN M8 ──
export default function M8TalentMatch() {
  const { company } = useApp();
  const { data } = useHRData();
  const src = data.length > 0 ? data : SAMPLE_DATA;

  const [activeTab, setActiveTab] = useState("matcher");
  const [candidate, setCandidate] = useState({
    name: "", currentDept: "Sales", skills: [],
    tenure: 2.0, age: 28, salary: 4500,
    atRiskReason: "Compensation below cliff + overtime",
  });
  const [selectedDept, setSelectedDept] = useState(null);
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const setC = useCallback((k, v) => setCandidate(p => ({ ...p, [k]: v })), []);

  // Compute matches for all depts
  const matches = useMemo(() => {
    return Object.keys(DEPT_REQUIREMENTS)
      .filter(d => d !== candidate.currentDept)
      .map(dept => ({ dept, ...computeMatchScore(candidate.skills, dept) }))
      .sort((a, b) => b.score - a.score);
  }, [candidate.skills, candidate.currentDept]);

  const selectedMatch = useMemo(() =>
    matches.find(m => m.dept === selectedDept) || matches[0],
  [matches, selectedDept]);

  // Auto-fill from at-risk employee
  const handleAtRiskSelect = (emp) => {
    const inferredSkills = (DEPT_REQUIREMENTS[emp.Department]?.required || []).slice(0, 4);
    const prefSkills = (DEPT_REQUIREMENTS[emp.Department]?.preferred || []).slice(0, 2);
    setCandidate({
      name: `${emp.FirstName} ${emp.LastName}`,
      currentDept: emp.Department,
      skills: [...inferredSkills, ...prefSkills],
      tenure: emp.YearsAtCompany || 1,
      age: emp.Age || 27,
      salary: emp.MonthlySalary || 4000,
      atRiskReason: emp.AttritionStatus === "Resigned"
        ? "Already resigned — retention critical"
        : emp.OvertimeStatus === "Yes"
        ? "Overtime burnout risk"
        : "High flight risk",
    });
    setSelectedDept(null);
    setAiText("");
  };

  const handleAI = useCallback(async () => {
    setAiLoading(true);
    setAiText("");
    try {
      const text = await fetchAIMatch(candidate, matches, company);
      setAiText(text);
    } catch (err) {
      setAiText(`⚠️ AI unavailable: ${err?.message || "Check connection and retry."}`);
    } finally {
      setAiLoading(false);
    }
  }, [candidate, matches, company]);

  // Org-wide at-risk with best match
  const orgMatches = useMemo(() => {
    return src
      .filter(e => e.AttritionStatus !== "Active")
      .map(e => {
        const skills = (DEPT_REQUIREMENTS[e.Department]?.required || []).slice(0, 4);
        const allMatches = Object.keys(DEPT_REQUIREMENTS)
          .filter(d => d !== e.Department)
          .map(dept => ({ dept, ...computeMatchScore(skills, dept) }))
          .sort((a, b) => b.score - a.score);
        const best = allMatches[0];
        return { ...e, bestMatch: best, inferredSkills: skills };
      })
      .filter(e => e.bestMatch && e.bestMatch.score > 0)
      .sort((a, b) => b.bestMatch.score - a.bestMatch.score);
  }, [src]);

  const TABS = [
    { id: "matcher", label: "🔗 Individual Matcher" },
    { id: "orgview", label: "🏢 Org-Wide View" },
    { id: "mobility", label: "🗺️ Mobility Map" },
    { id: "matrix", label: "📊 Skill Gap Matrix" },
  ];

  const inputStyle = { width: "100%", padding: "8px 11px", borderRadius: 9, border: "1.5px solid #e2e8f0", fontSize: 13, color: "#1e293b", background: "#f8fafc", outline: "none", boxSizing: "border-box" };

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            style={{
              padding: "9px 18px", borderRadius: 10, cursor: "pointer",
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

      {/* ── TAB: INDIVIDUAL MATCHER ── */}
      {activeTab === "matcher" && (
        <div>
          {/* At-risk picker */}
          <div style={{ background: "#fffbeb", borderRadius: 13, padding: "14px 18px", border: "1.5px solid #fde68a", marginBottom: 18 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#92400e", marginBottom: 8 }}>⚡ Quick Load — At-Risk Employees</div>
            <AtRiskPicker data={data} onSelect={handleAtRiskSelect} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
            {/* Left — Candidate Profile */}
            <div>
              <div style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", border: "1.5px solid #f1f5f9", marginBottom: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", marginBottom: 16 }}>👤 Candidate Profile</div>

                {[
                  { label: "Full Name", key: "name", type: "text", placeholder: "e.g. Sarah Miller" },
                ].map(f => (
                  <div key={f.key} style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>{f.label}</div>
                    <input type="text" value={candidate[f.key]} placeholder={f.placeholder}
                      onChange={e => setC(f.key, e.target.value)} style={inputStyle} />
                  </div>
                ))}

                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>Current Department</div>
                  <select value={candidate.currentDept} onChange={e => setC("currentDept", e.target.value)} style={inputStyle}>
                    {Object.keys(DEPT_REQUIREMENTS).map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
                  {[
                    { label: "Tenure (yrs)", key: "tenure", step: 0.5 },
                    { label: "Age", key: "age", step: 1 },
                    { label: `Salary (${company?.currency || "USD"})`, key: "salary", step: 100 },
                  ].map(f => (
                    <div key={f.key}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{f.label}</div>
                      <input type="number" value={candidate[f.key]} step={f.step}
                        onChange={e => setC(f.key, Number(e.target.value))} style={inputStyle} />
                    </div>
                  ))}
                </div>

                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>At-Risk Reason</div>
                  <input type="text" value={candidate.atRiskReason} placeholder="e.g. Underpaid + burnout"
                    onChange={e => setC("atRiskReason", e.target.value)} style={inputStyle} />
                </div>
              </div>

              {/* Skill Builder */}
              <div style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", border: "1.5px solid #f1f5f9" }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", marginBottom: 14 }}>🛠️ Skill Matrix Builder</div>
                <SkillMatrixBuilder selectedSkills={candidate.skills} onChange={skills => setC("skills", skills)} />
              </div>
            </div>

            {/* Right — Match Results */}
            <div>
              <div style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", border: "1.5px solid #f1f5f9", marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>Transfer Match Results</div>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>Click a department to see detail</div>
                  </div>
                  {candidate.skills.length === 0 && (
                    <div style={{ fontSize: 11, color: "#f59e0b", fontWeight: 600 }}>← Add skills first</div>
                  )}
                </div>

                {candidate.skills.length > 0 ? (
                  matches.map(m => (
                    <MatchBar key={m.dept} dept={m.dept} score={m.score}
                      matched={m.matched} missing={m.missing} preferredMatched={m.preferredMatched}
                      onSelect={setSelectedDept} selected={selectedDept === m.dept}
                    />
                  ))
                ) : (
                  <div style={{ textAlign: "center", padding: "30px", color: "#94a3b8", fontSize: 13 }}>
                    Select skills on the left to see transfer match scores
                  </div>
                )}
              </div>

              {/* Selected dept detail */}
              {selectedMatch && candidate.skills.length > 0 && (
                <div style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", border: "1.5px solid #f1f5f9", marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", marginBottom: 14 }}>
                    {selectedDept || matches[0]?.dept} — Skill Overlap Radar
                  </div>
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
                    <SkillRadar
                      candidateSkills={candidate.skills}
                      deptRequired={DEPT_REQUIREMENTS[selectedDept || matches[0]?.dept]?.required || []}
                      size={200}
                    />
                  </div>
                  <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e" }} />
                      <span style={{ fontSize: 10, color: "#64748b" }}>Has skill</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444" }} />
                      <span style={{ fontSize: 10, color: "#64748b" }}>Missing skill</span>
                    </div>
                  </div>

                  {/* Gap details */}
                  {selectedMatch?.missing.length > 0 && (
                    <div style={{ marginTop: 14, background: "#fef2f2", borderRadius: 9, padding: "10px 12px", border: "1px solid #fecaca" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#dc2626", marginBottom: 5 }}>Skills to Develop Before Transfer:</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                        {selectedMatch.missing.map(s => (
                          <span key={s} style={{ background: "#fff", color: "#dc2626", border: "1px solid #fecaca", padding: "2px 9px", borderRadius: 10, fontSize: 10, fontWeight: 600 }}>
                            📚 {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* AI Recommendation */}
              {candidate.skills.length > 0 && (
                <div style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", border: "1.5px solid #f1f5f9" }}>
                  <button onClick={handleAI} disabled={aiLoading}
                    style={{ width: "100%", padding: "12px", background: aiLoading ? "#f1f5f9" : "#0f172a", color: aiLoading ? "#94a3b8" : "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: aiLoading ? "not-allowed" : "pointer", marginBottom: aiText ? 14 : 0 }}>
                    {aiLoading ? "⏳ Generating AI Transfer Plan..." : "🤖 Get AI Transfer Recommendation"}
                  </button>
                  {aiText && (
                    <div style={{ background: "#f8fafc", borderRadius: 10, padding: "14px 16px", border: "1.5px solid #e2e8f0" }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>AI Transfer Plan</div>
                      <div style={{ fontSize: 12, color: "#1e293b", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{aiText}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: ORG-WIDE VIEW ── */}
      {activeTab === "orgview" && (
        <div>
          {/* Summary */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(165px,1fr))", gap: 12, marginBottom: 18 }}>
            {[
              { label: "At-Risk Employees", value: orgMatches.length, sub: "With transfer potential", color: "#f59e0b", icon: "⚡", bg: "#fffbeb" },
              { label: "Strong Matches (75%+)", value: orgMatches.filter(e => e.bestMatch.score >= 75).length, sub: "Ready for transfer now", color: "#22c55e", icon: "✅", bg: "#f0fdf4" },
              { label: "Possible Matches", value: orgMatches.filter(e => e.bestMatch.score >= 50 && e.bestMatch.score < 75).length, sub: "Need some upskilling", color: "#3b82f6", icon: "📚", bg: "#eff6ff" },
              { label: "Dept Most Needed", value: (() => { const freq = {}; orgMatches.forEach(e => { freq[e.bestMatch.dept] = (freq[e.bestMatch.dept] || 0) + 1; }); return Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] || "—"; })(), sub: "Most transfer requests", color: "#8b5cf6", icon: "🏢", bg: "#f5f3ff" },
            ].map((k) => (
              <div key={k.label} style={{ background: k.bg, borderRadius: 13, padding: "13px 15px", border: `1.5px solid ${k.color}22`, position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", right: 8, top: 8, fontSize: 16, opacity: 0.2 }}>{k.icon}</div>
                <div style={{ fontSize: 9, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>{k.label}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: k.color, fontFamily: "'Playfair Display',Georgia,serif" }}>{k.value}</div>
                <div style={{ fontSize: 10, color: "#64748b", marginTop: 3 }}>{k.sub}</div>
              </div>
            ))}
          </div>

          {/* Org-wide match table */}
          <div style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", border: "1.5px solid #f1f5f9" }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", marginBottom: 4 }}>All At-Risk Employees — Best Transfer Match</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 14 }}>Ranked by match score — shows best internal mobility opportunity per person</div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {["Employee", "Current Dept", "Status", "Best Transfer To", "Match %", "Missing Skills", "Generation", "Tenure"].map(h => (
                      <th key={h} style={{ padding: "7px 10px", textAlign: "left", color: "#64748b", fontWeight: 700, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "2px solid #f1f5f9", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orgMatches.slice(0, 20).map((e, i) => {
                    const score = e.bestMatch.score;
                    const color = score >= 75 ? "#22c55e" : score >= 50 ? "#f59e0b" : score >= 30 ? "#3b82f6" : "#94a3b8";
                    const gen = getGeneration(e.Age);
                    return (
                      <tr key={e.EmployeeID} style={{ borderBottom: "1px solid #f8fafc", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                        <td style={{ padding: "7px 10px", color: "#1e293b", fontWeight: 500, whiteSpace: "nowrap" }}>
                          {e.FirstName} {e.LastName}
                          {gen === "Gen Z" && <span style={{ marginLeft: 4, background: "#fef3c7", color: "#92400e", fontSize: 8, fontWeight: 700, padding: "1px 4px", borderRadius: 4 }}>Gen Z</span>}
                        </td>
                        <td style={{ padding: "7px 10px", color: "#475569", fontSize: 11 }}>{e.Department}</td>
                        <td style={{ padding: "7px 10px" }}>
                          <span style={{ background: e.AttritionStatus === "Resigned" ? "#fef2f2" : "#fffbeb", color: e.AttritionStatus === "Resigned" ? "#ef4444" : "#f59e0b", padding: "2px 7px", borderRadius: 20, fontSize: 10, fontWeight: 700 }}>
                            {e.AttritionStatus}
                          </span>
                        </td>
                        <td style={{ padding: "7px 10px", fontWeight: 700, color: "#1e293b" }}>→ {e.bestMatch.dept}</td>
                        <td style={{ padding: "7px 10px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            <div style={{ width: 40, height: 5, background: "#f1f5f9", borderRadius: 3, overflow: "hidden" }}>
                              <div style={{ width: `${score}%`, height: "100%", background: color, borderRadius: 3 }} />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 700, color }}>{score}%</span>
                          </div>
                        </td>
                        <td style={{ padding: "7px 10px", fontSize: 10, color: "#94a3b8", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {e.bestMatch.missing.slice(0, 2).join(", ") || "✓ Ready"}
                        </td>
                        <td style={{ padding: "7px 10px" }}>
                          <span style={{ background: gen === "Gen Z" ? "#fef3c7" : gen === "Millennial" ? "#eff6ff" : "#f0fdf4", color: gen === "Gen Z" ? "#92400e" : gen === "Millennial" ? "#1d4ed8" : "#166534", padding: "2px 7px", borderRadius: 20, fontSize: 10, fontWeight: 700 }}>
                            {gen}
                          </span>
                        </td>
                        <td style={{ padding: "7px 10px", color: "#64748b" }}>{e.YearsAtCompany}y</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: MOBILITY MAP ── */}
      {activeTab === "mobility" && (
        <div>
          <div style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", border: "1.5px solid #f1f5f9", marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", marginBottom: 4 }}>🗺️ Cross-Department Mobility Map</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 16 }}>
              Shows skill compatibility between departments — how easy is it for employees to transfer?
            </div>
            <OrgMobilityMap data={data} />
          </div>

          {/* Transfer opportunity summary */}
          <div style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", border: "1.5px solid #f1f5f9" }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", marginBottom: 14 }}>💡 Transfer Opportunity Highlights</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { from: "Sales", to: "Digital Marketing", score: 45, insight: "Sales communication skills transfer well to content & campaign work" },
                { from: "Technical Support", to: "IT", score: 60, insight: "Troubleshooting + system knowledge is directly transferable" },
                { from: "IT", to: "Technical Support", score: 55, insight: "Technical depth helps, customer skills need development" },
                { from: "Sales", to: "HR", score: 35, insight: "Relationship building + communication are strong crossover skills" },
              ].map((t) => {
                const color = t.score >= 60 ? "#22c55e" : t.score >= 40 ? "#f59e0b" : "#3b82f6";
                return (
                  <div key={`${t.from}-${t.to}`} style={{ background: "#f8fafc", borderRadius: 10, padding: "12px 14px", border: "1.5px solid #f1f5f9" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#1e293b" }}>{t.from}</span>
                      <span style={{ color: "#94a3b8" }}>→</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#1e293b" }}>{t.to}</span>
                      <span style={{ marginLeft: "auto", fontSize: 14, fontWeight: 800, color, fontFamily: "'Playfair Display',Georgia,serif" }}>{t.score}%</span>
                    </div>
                    <div style={{ fontSize: 10, color: "#64748b", lineHeight: 1.5 }}>{t.insight}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: SKILL GAP MATRIX ── */}
      {activeTab === "matrix" && (
        <div>
          <div style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", border: "1.5px solid #f1f5f9", marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", marginBottom: 4 }}>📊 Department Skill Gap Matrix</div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 16 }}>Required skills per department — shows what training is needed org-wide</div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 2, fontSize: 11 }}>
                <thead>
                  <tr>
                    <th style={{ padding: "6px 10px", textAlign: "left", color: "#64748b", fontSize: 10, fontWeight: 700, textTransform: "uppercase", minWidth: 140 }}>Skill</th>
                    {Object.keys(DEPT_REQUIREMENTS).map(d => (
                      <th key={d} style={{ padding: "6px 8px", textAlign: "center", color: "#64748b", fontSize: 9, fontWeight: 700, maxWidth: 80 }}>
                        {d.length > 8 ? d.slice(0, 7) + "…" : d}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ALL_SKILLS.slice(0, 24).map((skill, i) => (
                    <tr key={skill} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                      <td style={{ padding: "5px 10px", color: "#1e293b", fontSize: 11, fontWeight: 500 }}>{skill}</td>
                      {Object.entries(DEPT_REQUIREMENTS).map(([dept, reqs]) => {
                        const isRequired = reqs.required.includes(skill);
                        const isPreferred = reqs.preferred.includes(skill);
                        return (
                          <td key={dept} style={{ padding: "2px 3px", textAlign: "center" }}>
                            {isRequired ? (
                              <div style={{ background: "#22c55e", borderRadius: 4, padding: "3px 4px", fontSize: 9, color: "#fff", fontWeight: 700 }}>REQ</div>
                            ) : isPreferred ? (
                              <div style={{ background: "#f59e0b", borderRadius: 4, padding: "3px 4px", fontSize: 9, color: "#fff", fontWeight: 600 }}>PREF</div>
                            ) : (
                              <div style={{ color: "#e2e8f0", fontSize: 12 }}>—</div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
              {[{ label: "Required", color: "#22c55e" }, { label: "Preferred", color: "#f59e0b" }].map(l => (
                <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: l.color }} />
                  <span style={{ fontSize: 10, color: "#64748b" }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Cross-module */}
          <div style={{ background: "#fff8f0", borderRadius: 14, padding: "16px 18px", border: "1.5px solid #fed7aa" }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#9a3412", marginBottom: 10 }}>🔗 Cross-Module Actions</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {[
                { icon: "🎯", text: "→ M2: High-match transfer candidates still have risk factors — check their flight risk score first" },
                { icon: "🏥", text: "→ M4: Use dept health scores to identify which dept has capacity to absorb transfer" },
                { icon: "🚪", text: "→ M5: Cross-reference exit interviews — did leavers mention growth/career as reason?" },
                { icon: "📈", text: "→ M6: Internal transfer costs ~20% of replacement cost — factor into ROI calculator" },
                { icon: "😴", text: "→ M7: Verify target dept isn't already at fatigue capacity before approving transfer" },
                { icon: "💬", text: "→ M9: Use pulse surveys to check transfer candidate's satisfaction after 30 days" },
              ].map((item) => (
                <div key={item.icon} style={{ background: "#fff", borderRadius: 8, padding: "8px 12px", border: "1px solid #fed7aa", fontSize: 11, color: "#64748b" }}>
                  <span style={{ marginRight: 6 }}>{item.icon}</span>{item.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
