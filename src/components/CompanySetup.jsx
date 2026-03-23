import { useState } from "react";

export default function CompanySetup({ onSave }) {
  const [form, setForm] = useState({
    name: "",
    industry: "Manufacturing",
    currency: "USD",
    salaryCliff: 5000,
    replacementMultiplier: 1.5,
    employeeCount: "",
    avgWorkHoursPerWeek: 40,
  });
  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));
  const valid = form.name.trim().length > 0;

  const CURRENCY_SYMBOLS = { USD: "$", IDR: "Rp", EUR: "€", GBP: "£", SGD: "S$" };
  const currSymbol = CURRENCY_SYMBOLS[form.currency] || "$";

  const fields = [
    { label: "Company Name", key: "name", type: "text", placeholder: "e.g. Pulse Digital" },
    { label: "Industry", key: "industry", type: "select", opts: ["Manufacturing","Retail","Technology","Healthcare","Finance","Services","Other"] },
    { label: "Currency", key: "currency", type: "select", opts: ["USD","IDR","EUR","GBP","SGD"] },
    { label: `Salary Safety Cliff (${currSymbol}/month)`, key: "salaryCliff", type: "number", placeholder: form.currency === "IDR" ? "5000000" : "5000", tooltip: "The minimum monthly salary threshold. Employees below this are statistically at higher attrition risk." },
    { label: "Replacement Cost Multiplier (×annual salary)", key: "replacementMultiplier", type: "number", placeholder: "1.5", tooltip: "Cost to replace 1 employee = annual salary × this multiplier. Industry standard: 1.5× (conservative) to 3× (specialist roles). Covers recruiting, onboarding, lost productivity." },
    { label: "Total Employees (optional)", key: "employeeCount", type: "number", placeholder: "e.g. 250", tooltip: "Used to calculate org-wide cost projections in M6 ROI Calculator." },
    { label: "Avg Work Hours / Week", key: "avgWorkHoursPerWeek", type: "number", placeholder: "40", tooltip: "Standard work hours per week at your company. Used by M7 Fatigue Radar to detect burnout risk." },
  ];

  return (
    <div style={{
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
              <input
                type={f.type}
                value={form[f.key]}
                placeholder={f.placeholder}
                onChange={e => set(f.key, f.type === "number" ? Number(e.target.value) : e.target.value)}
                style={{
                  width: "100%", padding: "10px 13px", borderRadius: 10,
                  border: "1.5px solid #e2e8f0", fontSize: 14, color: "#1e293b",
                  background: "#f8fafc", outline: "none", boxSizing: "border-box",
                }}
              />
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
                {currSymbol}{Number(form.salaryCliff || 0).toLocaleString()}
              </strong>
              {" "}across all modules
            </div>
          </div>
        </div>
        
        <button
          onClick={() => valid && onSave(form)}
          style={{
            width: "100%", padding: "14px",
            background: valid ? "linear-gradient(135deg,#f59e0b,#ef4444)" : "#e2e8f0",
            color: valid ? "#fff" : "#94a3b8",
            border: "none", borderRadius: 12, fontSize: 15, fontWeight: 700,
            cursor: valid ? "pointer" : "not-allowed", marginTop: 6,
            letterSpacing: "0.02em", transition: "all 0.2s",
          }}
        >
          {valid ? "Launch AttritionIQ →" : "Enter company name to continue"}
        </button>

        <p style={{ textAlign: "center", fontSize: 10, color: "#cbd5e1", marginTop: 10 }}>
          by Alfin Maulana Yudistira · Pulse Digital · Project 3 of 14
        </p>
      </div>
    </div>
  );
}
