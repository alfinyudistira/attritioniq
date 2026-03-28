import { useState, useEffect } from "react";

// ── Constants outside component — not recreated on every render ──
const DEFAULT_CLIFF_BY_CURRENCY = {
  USD: 3000,
  IDR: 5000000,
  EUR: 2200,
  GBP: 2300,
  SGD: 2500,
};

const CURRENCY_SYMBOLS = { USD: "$", IDR: "Rp", EUR: "€", GBP: "£", SGD: "S$" };

const NUMBER_FIELDS = ["salaryCliff", "replacementMultiplier", "avgWorkHoursPerWeek", "targetTurnover"];

const LS_DRAFT_KEY = "attritioniq_setup_draft";

function saveDraft(form) {
  try { localStorage.setItem(LS_DRAFT_KEY, JSON.stringify(form)); } catch {}
}

function loadDraft() {
  try {
    const raw = localStorage.getItem(LS_DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function clearDraft() {
  try { localStorage.removeItem(LS_DRAFT_KEY); } catch {}
}

const FIELD_LIMITS = {
  salaryCliff:            { min: 1,    max: 999_999_999 },
  replacementMultiplier:  { min: 0.1,  max: 10 },
  targetTurnover:         { min: 0,    max: 100 },
  avgWorkHoursPerWeek:    { min: 1,    max: 168 },
};

export default function CompanySetup({ onSave }) {
  const [form, setForm] = useState(() => {
  const draft = loadDraft();
  return {
    name: "",
    industry: "Manufacturing",
    currency: "USD",
    salaryCliff: 3000,
    replacementMultiplier: 1.5,
    targetTurnover: 10,
    avgWorkHoursPerWeek: 40,
    ...draft,
  };
});

const [hasEditedSalaryCliff, setHasEditedSalaryCliff] = useState(
  () => !!loadDraft()?.salaryCliff
);
  useEffect(() => {
  if (!hasEditedSalaryCliff) {
    const defaultCliff = DEFAULT_CLIFF_BY_CURRENCY[form.currency] ?? 5000;
    setForm(p => ({ ...p, salaryCliff: defaultCliff }));
  }
}, [form.currency, hasEditedSalaryCliff]);
  const set = (key, val) => {
  if (key === "salaryCliff") setHasEditedSalaryCliff(true);
  let finalVal = val;
  if (NUMBER_FIELDS.includes(key)) {
    if (val === "" || val === "-") {
      finalVal = "";
    } else {
      const n = Number(val);
      const lim = FIELD_LIMITS[key];
      finalVal = isNaN(n) ? "" : n;
      if (lim && n > lim.max) finalVal = lim.max;
    }
  }
  setForm(p => {
    const next = { ...p, [key]: finalVal };
    // Auto-save setiap perubahan — debounce tidak perlu
    // karena localStorage.setItem sangat cepat (sync, <1ms)
    saveDraft(next);
    return next;
  });
};
  const numErrors = {
    salaryCliff:           (!form.salaryCliff || Number(form.salaryCliff) < 1),
    replacementMultiplier: (!form.replacementMultiplier || Number(form.replacementMultiplier) < 0.1),
    avgWorkHoursPerWeek:   (!form.avgWorkHoursPerWeek || Number(form.avgWorkHoursPerWeek) < 1 || Number(form.avgWorkHoursPerWeek) > 168),
    targetTurnover:        (Number(form.targetTurnover) < 0 || Number(form.targetTurnover) > 100),
  };
  const hasNumError = Object.values(numErrors).some(Boolean);
  const valid = form.name.trim().length > 0 && !hasNumError;

  const currSymbol = CURRENCY_SYMBOLS[form.currency] || "$";
  const fields = [
    { label: "Company Name",   key: "name",   type: "text",   placeholder: "e.g. Pulse Digital" },
    { label: "Industry", key: "industry", type: "select",
  opts: [
    "Technology","Finance","Healthcare","Manufacturing",
    "Retail","Education","Logistics","Energy",
    "Hospitality","Media & Entertainment","Real Estate",
    "Telecommunications","Government","Non-Profit",
    "Construction","Agriculture","Services","Other"
  ]
},
    { label: "Currency",       key: "currency", type: "select", opts: ["USD","IDR","EUR","GBP","SGD"] },
    {
      label: `Salary Safety Cliff (${currSymbol}/month)`,
      key: "salaryCliff", type: "number",
      placeholder: String(DEFAULT_CLIFF_BY_CURRENCY[form.currency] || 3000),
      tooltip: "Employees below this monthly salary threshold are statistically at higher attrition risk. Auto-set by currency.",
      error: numErrors.salaryCliff ? "Must be greater than 0" : null,
    },
    {
      label: "Replacement Cost Multiplier (×annual salary)",
      key: "replacementMultiplier", type: "number", placeholder: "1.5",
      tooltip: "Cost to replace 1 employee = annual salary × multiplier. Standard: 1.5× conservative · 3× specialist. Covers recruiting, onboarding & lost productivity.",
      error: numErrors.replacementMultiplier ? "Must be between 0.1 and 10" : null,
    },
    {
      label: "Target Turnover Rate (%)",
      key: "targetTurnover", type: "number", placeholder: "10",
      tooltip: "Your company's acceptable annual turnover target (e.g. 10%). Used as benchmark in M6 ROI calculations.",
      error: numErrors.targetTurnover ? "Must be 0–100" : null,
    },
    {
      label: "Avg Work Hours / Week",
      key: "avgWorkHoursPerWeek", type: "number", placeholder: "40",
      tooltip: "Standard hours per week. Used by M7 Fatigue Radar to detect burnout. Max: 168 (24×7).",
      error: numErrors.avgWorkHoursPerWeek ? "Must be 1–168" : null,
    },
  ];

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && valid) onSave(form);
  };

  return (
    <div
      onKeyDown={handleKeyDown}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(15,23,42,0.6)",
        backdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000, padding: 16,
      }}>
      <div style={{
        background: "#fff", borderRadius: 22, padding: "36px 40px",
        width: "100%", maxWidth: 460,
        boxShadow: "0 32px 80px rgba(15,23,42,0.2)",
        border: "1px solid #f1f5f9",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
          <div style={{
            width: 44, height: 44,
            background: "linear-gradient(135deg,#f59e0b,#ef4444)",
            borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 22, flexShrink: 0,
          }}>⚡</div>
          <div>
            <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 22, fontWeight: 700, color: "#0f172a" }}>AttritionIQ</div>
            <div style={{ fontSize: 12, color: "#94a3b8" }}>Employee Attrition Intelligence Platform</div>
          </div>
        </div>

        <div style={{ height: 1, background: "linear-gradient(90deg,#f59e0b44,transparent)", margin: "18px 0" }} />

        <div style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>
          Set up your workspace. All data stays in your browser — 100% private.
        </div>

        {fields.map(f => (
  <div key={f.key} style={{ marginBottom: 14 }}>
    <label style={{
      display: "block", fontSize: 11, fontWeight: 700, color: "#475569",
      marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em",
    }}>
      {f.label}
    </label>
    {f.tooltip && (
      <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 5, lineHeight: 1.5 }}>
        💡 {f.tooltip}
      </div>
    )}
            {f.type === "select" ? (
              <select
                value={form[f.key]}
                onChange={e => set(f.key, e.target.value)}
                style={{
                  width: "100%", padding: "10px 13px", borderRadius: 10,
                  border: "1.5px solid #e2e8f0", fontSize: 14, color: "#1e293b",
                  background: "#f8fafc", outline: "none", cursor: "pointer",
                }}
              >
                {f.opts.map(o => <option key={o}>{o}</option>)}
              </select>
            ) : (
              <>
                <input
                  type={f.type}
                  value={form[f.key] === "" ? "" : form[f.key]}
                  placeholder={f.placeholder}
                  min={FIELD_LIMITS[f.key]?.min}
                  max={FIELD_LIMITS[f.key]?.max}
                  onChange={e => set(f.key, e.target.value)}
                  style={{
                    width: "100%", padding: "10px 13px", borderRadius: 10,
                    border: `1.5px solid ${f.error ? "#fca5a5" : "#e2e8f0"}`,
                    fontSize: 14, color: "#1e293b",
                    background: f.error ? "#fef2f2" : "#f8fafc",
                    outline: "none", boxSizing: "border-box",
                    transition: "border-color 0.15s, background 0.15s",
                  }}
                />
                {f.error && (
                  <div style={{ fontSize: 10, color: "#ef4444", marginTop: 3, fontWeight: 600 }}>
                    ⚠ {f.error}
                  </div>
                )}
              </>
            )}
          </div>
        ))}

{/* Currency preview */}
        <div style={{
          background: "#f8fafc", borderRadius: 10, padding: "10px 14px",
          border: "1.5px solid #e2e8f0", marginBottom: 14,
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <span style={{ fontSize: 18 }}>💱</span>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#475569" }}>
              Currency Preview
            </div>
            <div style={{ fontSize: 13, color: "#0f172a", marginTop: 2 }}>
              Salary cliff will display as{" "}
              <strong style={{ color: "#f59e0b" }}>
  {currSymbol}{Number(form.salaryCliff || 0).toLocaleString(form.currency === "IDR" ? "id-ID" : "en-US")}
</strong>
              {" "}across all modules
               </div>
    <div style={{ fontSize: 10, color: "#ef4444", marginTop: 6 }}>
      ⚠️ Please ensure your CSV file uses numbers in the selected currency (without symbols).
    </div>
  </div>
</div>
        
        <button
  onClick={() => {
    if (!valid) return;
    clearDraft();
    onSave(form);
  }}
          style={{
            width: "100%", padding: "14px",
            background: valid ? "linear-gradient(135deg,#f59e0b,#ef4444)" : "#e2e8f0",
            color: valid ? "#fff" : "#94a3b8",
            border: "none", borderRadius: 12, fontSize: 15, fontWeight: 700,
            cursor: valid ? "pointer" : "not-allowed", marginTop: 6,
            letterSpacing: "0.02em", transition: "all 0.2s",
            opacity: valid ? 1 : 0.7,
            boxShadow: valid ? "0 4px 20px rgba(245,158,11,0.35)" : "none",
          }}
        >
          {valid
            ? "Launch AttritionIQ →"
            : !form.name.trim()
              ? "Enter company name to continue"
              : "Fix errors above to continue"}
        </button>
        <p style={{ textAlign: "center", fontSize: 10, color: "#cbd5e1", marginTop: 10 }}>
          by Alfin Maulana Yudistira · AttritionIQ
        </p>
      </div>
    </div>
  );
}
