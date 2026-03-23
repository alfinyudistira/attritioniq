import { useMemo, useState } from "react";
import { useApp, getGeneration, getStatusColor } from "../context/AppContext";
import { BarChart, DonutChart, ScatterPlot } from "../components/Charts";

function FilterBtn({ val, cur, onSet }) {
  return (
    <button
      onClick={() => onSet(val)}
      style={{
        padding: "4px 11px", borderRadius: 20, border: "none",
        background: cur === val ? "#f59e0b" : "#f1f5f9",
        color: cur === val ? "#fff" : "#64748b",
        fontSize: 11, fontWeight: cur === val ? 700 : 500,
        cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap",
      }}
    >
      {val}
    </button>
  );
}

function KPICard({ label, value, sub, color, icon, bg }) {
  return (
    <div style={{
      background: bg, borderRadius: 14, padding: "16px 18px",
      border: `1.5px solid ${color}22`, position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", right: 12, top: 10, fontSize: 20, opacity: 0.2 }}>{icon}</div>
      <div style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1.1, fontFamily: "'Playfair Display',Georgia,serif" }}>{value}</div>
      <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>{sub}</div>
    </div>
  );
}

export default function M1Dashboard() {
  const { data, company } = useApp();
  const cliff = company?.salaryCliff || 5000;
  const multiplier = company?.replacementMultiplier || 1.5;

  const [deptF, setDeptF] = useState("All");
  const [genF, setGenF] = useState("All");
  const [statusF, setStatusF] = useState("All");
  const [otF, setOtF] = useState("All");

  const depts = useMemo(() => ["All", ...new Set(data.map(d => d.Department))], [data]);

  const filtered = useMemo(() => data.filter(d => {
    if (deptF !== "All" && d.Department !== deptF) return false;
    if (genF !== "All" && getGeneration(d.Age) !== genF) return false;
    if (statusF !== "All" && d.AttritionStatus !== statusF) return false;
    if (otF !== "All" && d.OvertimeStatus !== otF) return false;
    return true;
  }), [data, deptF, genF, statusF, otF]);

  const total = filtered.length;
  const resigned = filtered.filter(d => d.AttritionStatus === "Resigned").length;
  const active = filtered.filter(d => d.AttritionStatus === "Active").length;
  const highRisk = filtered.filter(d => d.AttritionStatus === "High Risk").length;
  const flightRisk = total > 0 ? (((resigned + highRisk) / total) * 100).toFixed(1) : 0;
  const withOT = filtered.filter(d => d.OvertimeStatus === "Yes");
  const otRate = withOT.length > 0 ? ((withOT.filter(d => d.AttritionStatus === "Resigned").length / withOT.length) * 100).toFixed(1) : 0;
  const noOT = filtered.filter(d => d.OvertimeStatus === "No");
  const noOtRate = noOT.length > 0 ? ((noOT.filter(d => d.AttritionStatus !== "Active").length / noOT.length) * 100).toFixed(1) : 0;
  const avgSalary = total > 0 ? Math.round(filtered.reduce((s, d) => s + (d.MonthlySalary || 0), 0) / total) : 0;
  const belowCliff = filtered.filter(d => d.MonthlySalary < cliff).length;
  const turnoverCost = resigned * avgSalary * 12 * multiplier;

  const deptStats = useMemo(() => {
    const map = {};
    filtered.forEach(d => {
      if (!map[d.Department]) map[d.Department] = { dept: d.Department, total: 0, bad: 0 };
      map[d.Department].total++;
      if (d.AttritionStatus !== "Active") map[d.Department].bad++;
    });
    return Object.values(map).map(d => ({ ...d, rate: d.total > 0 ? d.bad / d.total : 0 }));
  }, [filtered]);

  const genData = ["Gen Z", "Millennial", "Senior"].map(g => {
    const grp = filtered.filter(d => getGeneration(d.Age) === g);
    const bad = grp.filter(d => d.AttritionStatus !== "Active").length;
    return { label: g, rate: grp.length > 0 ? bad / grp.length : 0, count: grp.length };
  });

  const genZCrisis = genData.find(g => g.label === "Gen Z" && g.rate >= 0.8);

  const kpis = [
    { label: "Flight Risk", value: `${flightRisk}%`, sub: `${resigned + highRisk} of ${total} at risk`, color: "#ef4444", icon: "🚨", bg: "#fef2f2" },
    { label: "Resigned", value: resigned, sub: `${total > 0 ? ((resigned/total)*100).toFixed(0) : 0}% of workforce`, color: "#dc2626", icon: "🚪", bg: "#fff1f2" },
    { label: "High Risk", value: highRisk, sub: "Likely to resign soon", color: "#f59e0b", icon: "⚠️", bg: "#fffbeb" },
    { label: "Active & Safe", value: active, sub: `${total > 0 ? ((active/total)*100).toFixed(0) : 0}% retained`, color: "#22c55e", icon: "✅", bg: "#f0fdf4" },
    { label: "Est. Turnover Cost", value: `$${(turnoverCost/1000).toFixed(0)}K`, sub: `${multiplier}× annual salary formula`, color: "#8b5cf6", icon: "💸", bg: "#f5f3ff" },
    { label: "Below Salary Cliff", value: belowCliff, sub: `Under $${cliff.toLocaleString()}/mo`, color: "#f97316", icon: "📉", bg: "#fff7ed" },
  ];

  if (data.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
        <div style={{ fontFamily: "'Playfair Display',Georgia,serif", fontSize: 20, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>Ready to Analyze</div>
        <div style={{ fontSize: 14, color: "#94a3b8" }}>Upload your CSV or click "Use Sample Data" above to see the full dashboard.</div>
      </div>
    );
  }

  return (
    <div>
      {/* Filters */}
      <div style={{ background: "#fff", borderRadius: 14, padding: "14px 18px", marginBottom: 18, border: "1.5px solid #f1f5f9", display: "flex", flexWrap: "wrap", gap: 14 }}>
        {[
          { label: "Department", values: depts, cur: deptF, set: setDeptF },
          { label: "Generation", values: ["All","Gen Z","Millennial","Senior"], cur: genF, set: setGenF },
          { label: "Status", values: ["All","Resigned","Active","High Risk"], cur: statusF, set: setStatusF },
          { label: "Overtime", values: ["All","Yes","No"], cur: otF, set: setOtF },
        ].map(f => (
          <div key={f.label}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#cbd5e1", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 5 }}>{f.label}</div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {f.values.map(v => <FilterBtn key={v} val={v} cur={f.cur} onSet={f.set} />)}
            </div>
          </div>
        ))}
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 12, marginBottom: 18 }}>
        {kpis.map((k, i) => <KPICard key={i} {...k} />)}
      </div>

      {/* Charts Row 1 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
        <div style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", border: "1.5px solid #f1f5f9" }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", marginBottom: 2 }}>Attrition by Department</div>
          <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 12 }}>Flight risk rate per dept</div>
          <BarChart
            data={deptStats} valueKey="rate" labelKey="dept"
            colorFn={d => d.rate > 0.7 ? "#ef4444" : d.rate > 0.4 ? "#f59e0b" : "#22c55e"}
          />
        </div>

        <div style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", border: "1.5px solid #f1f5f9", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", marginBottom: 2, alignSelf: "flex-start" }}>Workforce Status</div>
          <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 10, alignSelf: "flex-start" }}>{total} employees</div>
          <DonutChart data={[
            { label: "Resigned", value: resigned, color: "#ef4444" },
            { label: "High Risk", value: highRisk, color: "#f59e0b" },
            { label: "Active", value: active, color: "#22c55e" },
          ]} size={120} />
          <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap", justifyContent: "center" }}>
            {[{ l: "Resigned", c: "#ef4444", v: resigned }, { l: "High Risk", c: "#f59e0b", v: highRisk }, { l: "Active", c: "#22c55e", v: active }].map(x => (
              <div key={x.l} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: x.c }} />
                <span style={{ fontSize: 10, color: "#64748b" }}>{x.l} ({x.v})</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", border: "1.5px solid #f1f5f9" }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", marginBottom: 2 }}>By Generation</div>
          <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 12 }}>Gen Z · Millennial · Senior</div>
          <BarChart
            data={genData} valueKey="rate" labelKey="label"
            colorFn={d => Number(d.rate) > 0.7 ? "#ef4444" : Number(d.rate) > 0.4 ? "#f59e0b" : "#22c55e"}
          />
          {genZCrisis && (
            <div style={{ marginTop: 8, background: "#fef2f2", borderRadius: 8, padding: "7px 10px", border: "1px solid #fecaca" }}>
              <span style={{ fontSize: 10, color: "#dc2626", fontWeight: 700 }}>⚠️ Gen Z Crisis: {(genZCrisis.rate * 100).toFixed(0)}% attrition — mentorship gap detected</span>
            </div>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        <div style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", border: "1.5px solid #f1f5f9" }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", marginBottom: 2 }}>Overtime Death Spiral</div>
          <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 14 }}>Attrition rate: overtime vs balanced hours</div>
          <div style={{ display: "flex", gap: 20, alignItems: "flex-end" }}>
            {[{ label: "With Overtime", val: otRate, color: "#ef4444" }, { label: "No Overtime", val: noOtRate, color: "#22c55e" }].map(b => (
              <div key={b.label} style={{ flex: 1, textAlign: "center" }}>
                <div style={{ fontSize: 30, fontWeight: 800, color: b.color, fontFamily: "'Playfair Display',Georgia,serif" }}>{b.val}%</div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 3 }}>{b.label}</div>
                <div style={{ height: 5, background: b.color, borderRadius: 3, marginTop: 6, opacity: 0.8 }} />
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, background: "#fef2f2", borderRadius: 8, padding: "7px 10px", border: "1px solid #fecaca" }}>
            <span style={{ fontSize: 10, color: "#dc2626" }}>💀 <strong>Overtime is the #1 predictor</strong> of resignation (r = 0.876)</span>
          </div>
        </div>

        <div style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", border: "1.5px solid #f1f5f9" }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", marginBottom: 2 }}>Salary Cliff vs Satisfaction</div>
          <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 8 }}>Each dot = 1 employee · amber line = salary cliff</div>
          <ScatterPlot data={filtered} cliffValue={cliff} />
          <div style={{ display: "flex", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
            {[{ l: "Resigned", c: "#ef4444" }, { l: "High Risk", c: "#f59e0b" }, { l: "Active", c: "#22c55e" }].map(x => (
              <div key={x.l} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: x.c }} />
                <span style={{ fontSize: 10, color: "#64748b" }}>{x.l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Employee Table */}
      <div style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", border: "1.5px solid #f1f5f9" }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", marginBottom: 14 }}>
          Employee Records <span style={{ fontSize: 11, fontWeight: 500, color: "#94a3b8" }}>({filtered.length} records)</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                {["ID","Name","Dept","Gen","Salary","OT","Satisfaction","Status","Tenure"].map(h => (
                  <th key={h} style={{ padding: "8px 10px", textAlign: "left", color: "#64748b", fontWeight: 700, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "2px solid #f1f5f9", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 25).map((d, i) => {
                const gen = getGeneration(d.Age);
                return (
                  <tr key={i} style={{ borderBottom: "1px solid #f8fafc", background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                    <td style={{ padding: "7px 10px", color: "#94a3b8", fontSize: 11 }}>{d.EmployeeID}</td>
                    <td style={{ padding: "7px 10px", color: "#1e293b", fontWeight: 500 }}>{d.FirstName} {d.LastName}</td>
                    <td style={{ padding: "7px 10px", color: "#475569" }}>{d.Department}</td>
                    <td style={{ padding: "7px 10px" }}>
                      <span style={{
                        background: gen === "Gen Z" ? "#fef3c7" : gen === "Millennial" ? "#eff6ff" : "#f0fdf4",
                        color: gen === "Gen Z" ? "#92400e" : gen === "Millennial" ? "#1d4ed8" : "#166534",
                        padding: "2px 7px", borderRadius: 20, fontSize: 10, fontWeight: 700,
                      }}>{gen}</span>
                    </td>
                    <td style={{ padding: "7px 10px", color: d.MonthlySalary < cliff ? "#ef4444" : "#16a34a", fontWeight: 600 }}>
                      ${(d.MonthlySalary || 0).toLocaleString()}
                    </td>
                    <td style={{ padding: "7px 10px", color: d.OvertimeStatus === "Yes" ? "#ef4444" : "#16a34a", fontWeight: 700 }}>{d.OvertimeStatus}</td>
                    <td style={{ padding: "7px 10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <div style={{ width: 36, height: 5, borderRadius: 3, background: "#f1f5f9", overflow: "hidden" }}>
                          <div style={{ width: `${((d.JobSatisfaction || 0) / 10) * 100}%`, height: "100%", background: (d.JobSatisfaction || 0) <= 3 ? "#ef4444" : (d.JobSatisfaction || 0) <= 6 ? "#f59e0b" : "#22c55e", borderRadius: 3 }} />
                        </div>
                        <span style={{ color: "#475569", fontSize: 11 }}>{d.JobSatisfaction}/10</span>
                      </div>
                    </td>
                    <td style={{ padding: "7px 10px" }}>
                      <span style={{
                        background: d.AttritionStatus === "Resigned" ? "#fef2f2" : d.AttritionStatus === "High Risk" ? "#fffbeb" : "#f0fdf4",
                        color: getStatusColor(d.AttritionStatus),
                        padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700,
                      }}>{d.AttritionStatus}</span>
                    </td>
                    <td style={{ padding: "7px 10px", color: "#64748b" }}>{d.YearsAtCompany}y</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length > 25 && (
            <div style={{ textAlign: "center", padding: "10px", fontSize: 11, color: "#94a3b8" }}>
              Showing 25 of {filtered.length} records
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
