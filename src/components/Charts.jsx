export function BarChart({ data, valueKey, labelKey, colorFn, height = 180, formatValue }) {
  if (!data || data.length === 0) return (
    <svg width="100%" viewBox="0 0 300 180" style={{ overflow: "visible" }}>
      <text x="150" y="90" textAnchor="middle" fontSize={11} fill="#cbd5e1">No data</text>
    </svg>
  );
  const max = Math.max(...data.map(d => Number(d[valueKey]) || 0), 0.01);
  const count = data.length;
  const totalW = 300;
  const barW = Math.max(20, Math.floor(totalW / count) - 10);

  return (
    <svg width="100%" viewBox={`0 0 ${totalW} ${height}`} style={{ overflow: "visible" }}>
      {data.map((d, i) => {
        const rawVal = d[valueKey];
        const pct = typeof rawVal === "number" ? rawVal : 0;
        const bh = Math.max(4, (pct / max) * (height - 44));
        const x = i * (totalW / count) + (totalW / count - barW) / 2;
        const y = height - 30 - bh;
        const color = colorFn ? colorFn(d) : "#f59e0b";
        const displayVal = formatValue
          ? formatValue(rawVal)
          : pct < 1 && pct > 0
            ? (pct * 100).toFixed(0) + "%"
            : typeof pct === "number" ? pct : rawVal;
        const label = String(d[labelKey]);
        const shortLabel = label.length > 9 ? label.slice(0, 8) + "…" : label;

        return (
          <g key={`${String(d[labelKey])}-${i}`}>
            <rect x={x} y={y} width={barW} height={bh} rx={5} fill={color} opacity={0.88}>
              <title>{String(d[labelKey])}: {displayVal}</title>
            </rect>
            <text x={x + barW / 2} y={y - 5} textAnchor="middle" fontSize={9} fill="#1e293b" fontWeight="700">
              {displayVal}
            </text>
            <text x={x + barW / 2} y={height - 10} textAnchor="middle" fontSize={8} fill="#94a3b8">
              {shortLabel}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function DonutChart({ data, size = 140 }) {
  const total = data.reduce((s, d) => s + (d.value || 0), 0);
  if (total === 0) return (
    <div style={{ width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center", color: "#cbd5e1", fontSize: 12 }}>
      No data
    </div>
  );

  let cumAngle = -Math.PI / 2;
  const cx = size / 2, cy = size / 2;
  const r = size * 0.38, innerR = size * 0.23;

  const slices = data
    .filter(d => (d.value || 0) > 0) // skip zero-value slices — they produce NaN paths
    .map(d => {
      const angle = (d.value / total) * 2 * Math.PI;
      const x1 = cx + r * Math.cos(cumAngle);
      const y1 = cy + r * Math.sin(cumAngle);
      cumAngle += angle;
      const x2 = cx + r * Math.cos(cumAngle);
      const y2 = cy + r * Math.sin(cumAngle);
      const ix1 = cx + innerR * Math.cos(cumAngle);
      const iy1 = cy + innerR * Math.sin(cumAngle);
      const ix2 = cx + innerR * Math.cos(cumAngle - angle);
      const iy2 = cy + innerR * Math.sin(cumAngle - angle);
      const lg = angle > Math.PI ? 1 : 0;
      return {
        path: `M${x1},${y1} A${r},${r} 0 ${lg} 1 ${x2},${y2} L${ix1},${iy1} A${innerR},${innerR} 0 ${lg} 0 ${ix2},${iy2} Z`,
        color: d.color,
        label: d.label,
        value: d.value,
      };
    });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {slices.map((s, i) => (
        <path key={i} d={s.path} fill={s.color} opacity={0.9}>
          <title>{s.label}: {s.value}</title>
        </path>
      ))}
      <text x={cx} y={cy + 2} textAnchor="middle" fontSize={size * 0.13} fontWeight="800" fill="#0f172a">{total}</text>
      <text x={cx} y={cy + size * 0.12} textAnchor="middle" fontSize={size * 0.08} fill="#64748b">total</text>
    </svg>
  );
}

export function ScatterPlot({ data, cliffValue = 5000, currencySymbol = "$", width = 300, height = 160 }) {
  if (!data || data.length === 0) return null;
  const salaries = data.map(d => d.MonthlySalary).filter(Boolean);
  const maxS = Math.max(...salaries, cliffValue + 1000);
  const minS = Math.min(...salaries, cliffValue - 1000);
  const pad = { l: 34, r: 16, t: 14, b: 30 };
  const W = width - pad.l - pad.r;
  const H = height - pad.t - pad.b;

  const toX = s => {
    if (maxS === minS) return pad.l + W / 2; 
    return pad.l + ((s - minS) / (maxS - minS)) * W;
  };
  const toY = sat => {
    const clamped = Math.max(1, Math.min(10, Number(sat) || 1));
    return pad.t + H - ((clamped - 1) / 9) * H;
  };
  const cliffX = toX(cliffValue);
  const statusColor = (s) => s === "Resigned" ? "#ef4444" : s === "High Risk" ? "#f59e0b" : "#22c55e";

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`}>
      <line x1={pad.l} y1={pad.t} x2={pad.l} y2={pad.t + H} stroke="#e2e8f0" strokeWidth={1} />
      <line x1={pad.l} y1={pad.t + H} x2={pad.l + W} y2={pad.t + H} stroke="#e2e8f0" strokeWidth={1} />
      <line x1={cliffX} y1={pad.t} x2={cliffX} y2={pad.t + H} stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4,3" />
      <text x={cliffX + 3} y={pad.t + 9} fontSize={8} fill="#f59e0b" fontWeight="700">
        {currencySymbol}{(cliffValue / 1000).toFixed(0)}k cliff
      </text>
      {data.map((d, i) => (
        <circle
          key={d.EmployeeID || i}
          cx={toX(d.MonthlySalary || minS)}
          cy={toY(d.JobSatisfaction || 1)}
          r={4}
          fill={statusColor(d.AttritionStatus)}
          opacity={0.75}
        >
          <title>{d.FirstName} {d.LastName} · {currencySymbol}{Number(d.MonthlySalary || 0).toLocaleString()} · Sat: {d.JobSatisfaction}/10 · {d.AttritionStatus}</title>
        </circle>
      ))}
      <text x={pad.l - 4} y={pad.t + 4} fontSize={7} fill="#94a3b8" textAnchor="end">10</text>
      <text x={pad.l - 4} y={pad.t + H} fontSize={7} fill="#94a3b8" textAnchor="end">1</text>
      <text x={pad.l + W / 2} y={height - 2} fontSize={7} fill="#94a3b8" textAnchor="middle">Monthly Salary →</text>
    </svg>
  );
}

export function GaugeChart({ value = 0, size = 160, label = "Flight Risk" }) {
  const pct = Math.min(100, Math.max(0, Number(value) || 0));
  const color = pct >= 75 ? "#ef4444" : pct >= 50 ? "#f59e0b" : pct >= 25 ? "#3b82f6" : "#22c55e";
  const cx = size / 2;
  const cy = size * 0.58;         
  const r  = size * 0.40;
  const strokeW = Math.max(10, size * 0.09);
  const trackD = `M${cx - r},${cy} A${r},${r} 0 0 1 ${cx + r},${cy}`;
  const angleDeg = (pct / 100) * 180;                
  const angleRad = (angleDeg * Math.PI) / 180;
  const valX = cx + r * Math.cos(Math.PI - angleRad); 
  const valY = cy - r * Math.sin(angleRad); 
  const largeArc = angleDeg > 180 ? 1 : 0;

  const valueD = pct > 0
    ? `M${cx - r},${cy} A${r},${r} 0 ${largeArc} 1 ${valX},${valY}`
    : null;

  return (
    <svg width={size} height={size * 0.68} viewBox={`0 0 ${size} ${size * 0.68}`}>
      {/* Track */}
      <path d={trackD} fill="none" stroke="#f1f5f9" strokeWidth={strokeW} strokeLinecap="round" />
      {/* Value arc */}
      {valueD && (
        <path
          d={valueD}
          fill="none"
          stroke={color}
          strokeWidth={strokeW}
          strokeLinecap="round"
          style={{ transition: "stroke 0.4s ease" }}
        />
      )}
      {/* Dot at tip */}
      {pct > 0 && (
        <circle cx={valX} cy={valY} r={strokeW * 0.5} fill={color} />
      )}
      {/* Score text */}
      <text x={cx} y={cy - r * 0.05} textAnchor="middle" fontSize={size * 0.2} fontWeight="800" fill={color}>
        {pct.toFixed(0)}%
      </text>
      {/* Label */}
      <text x={cx} y={cy + r * 0.28} textAnchor="middle" fontSize={size * 0.09} fill="#64748b">
        {label}
      </text>
      {/* Scale labels */}
      <text x={cx - r - 2} y={cy + 12} textAnchor="middle" fontSize={size * 0.07} fill="#94a3b8">0</text>
      <text x={cx + r + 2} y={cy + 12} textAnchor="middle" fontSize={size * 0.07} fill="#94a3b8">100</text>
    </svg>
  );
}
