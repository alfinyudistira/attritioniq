export function BarChart({ data, valueKey, labelKey, colorFn, height = 180 }) {
  const max = Math.max(...data.map(d => d[valueKey]), 0.01);
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
        const displayVal = pct < 1 && pct > 0
          ? (pct * 100).toFixed(0) + "%"
          : typeof pct === "number" ? pct : rawVal;
        const label = String(d[labelKey]);
        const shortLabel = label.length > 9 ? label.slice(0, 8) + "…" : label;

        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={bh} rx={5} fill={color} opacity={0.88} />
            <text
              x={x + barW / 2} y={y - 5}
              textAnchor="middle" fontSize={9} fill="#1e293b" fontWeight="700"
            >
              {displayVal}
            </text>
            <text
              x={x + barW / 2} y={height - 10}
              textAnchor="middle" fontSize={8} fill="#94a3b8"
            >
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
  if (total === 0) return <div style={{ width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center", color: "#cbd5e1", fontSize: 12 }}>No data</div>;

  let cumAngle = -Math.PI / 2;
  const cx = size / 2, cy = size / 2;
  const r = size * 0.38, innerR = size * 0.23;

  const slices = data.map(d => {
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
        <path key={i} d={s.path} fill={s.color} opacity={0.9} />
      ))}
      <text x={cx} y={cy + 2} textAnchor="middle" fontSize={size * 0.13} fontWeight="800" fill="#0f172a">{total}</text>
      <text x={cx} y={cy + size * 0.12} textAnchor="middle" fontSize={size * 0.08} fill="#64748b">total</text>
    </svg>
  );
}

export function ScatterPlot({ data, cliffValue = 5000, width = 300, height = 160 }) {
  if (!data || data.length === 0) return null;
  const salaries = data.map(d => d.MonthlySalary).filter(Boolean);
  const maxS = Math.max(...salaries, cliffValue + 1000);
  const minS = Math.min(...salaries, cliffValue - 1000);
  const pad = { l: 34, r: 16, t: 14, b: 30 };
  const W = width - pad.l - pad.r;
  const H = height - pad.t - pad.b;

  const toX = s => pad.l + ((s - minS) / (maxS - minS)) * W;
  const toY = sat => pad.t + H - ((sat - 1) / 9) * H;
  const cliffX = toX(cliffValue);

  const statusColor = (s) => s === "Resigned" ? "#ef4444" : s === "High Risk" ? "#f59e0b" : "#22c55e";

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`}>
      <line x1={pad.l} y1={pad.t} x2={pad.l} y2={pad.t + H} stroke="#e2e8f0" strokeWidth={1} />
      <line x1={pad.l} y1={pad.t + H} x2={pad.l + W} y2={pad.t + H} stroke="#e2e8f0" strokeWidth={1} />
      <line x1={cliffX} y1={pad.t} x2={cliffX} y2={pad.t + H} stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4,3" />
      <text x={cliffX + 3} y={pad.t + 9} fontSize={8} fill="#f59e0b" fontWeight="700">${(cliffValue/1000).toFixed(0)}k cliff</text>
      {data.map((d, i) => (
        <circle
          key={i}
          cx={toX(d.MonthlySalary || minS)}
          cy={toY(d.JobSatisfaction || 1)}
          r={4}
          fill={statusColor(d.AttritionStatus)}
          opacity={0.75}
        />
      ))}
      <text x={pad.l - 4} y={pad.t + 4} fontSize={7} fill="#94a3b8" textAnchor="end">10</text>
      <text x={pad.l - 4} y={pad.t + H} fontSize={7} fill="#94a3b8" textAnchor="end">1</text>
      <text x={pad.l + W / 2} y={height - 2} fontSize={7} fill="#94a3b8" textAnchor="middle">Monthly Salary →</text>
    </svg>
  );
}

export function GaugeChart({ value = 0, size = 160 }) {
  const pct = Math.min(100, Math.max(0, value));
  const color = pct >= 75 ? "#ef4444" : pct >= 50 ? "#f59e0b" : pct >= 25 ? "#3b82f6" : "#22c55e";
  const cx = size / 2;
  const cy = size * 0.65;
  const r = size * 0.38;
  const strokeW = Math.max(10, size * 0.09);
  const trackX1 = cx - r;
  const trackY1 = cy;
  const trackX2 = cx + r;
  const trackY2 = cy;
  const valueAngle = Math.PI - (pct / 100) * Math.PI;
  const valX = cx + r * Math.cos(valueAngle);
  const valY = cy - r * Math.sin(valueAngle);
  const largeArc = pct > 50 ? 1 : 0;
  return (
    <svg width={size} height={size * 0.72} viewBox={`0 0 ${size} ${size * 0.72}`}>
      <path
        d={`M${trackX1},${trackY1} A${r},${r} 0 0 1 ${trackX2},${trackY2}`}
        fill="none" stroke="#f1f5f9" strokeWidth={strokeW} strokeLinecap="round"
      />
      {pct > 0 && (
        <path
          d={`M${trackX1},${trackY1} A${r},${r} 0 ${largeArc} 1 ${valX},${valY}`}
          fill="none" stroke={color} strokeWidth={strokeW} strokeLinecap="round"
        />
      )}
      <circle cx={valX} cy={valY} r={strokeW * 0.55} fill={color} />
      <text x={cx} y={cy - r * 0.1} textAnchor="middle" fontSize={size * 0.2} fontWeight="800" fill={color}>
        {pct.toFixed(0)}%
      </text>
      <text x={cx} y={cy + r * 0.22} textAnchor="middle" fontSize={size * 0.09} fill="#64748b">
        Flight Risk
      </text>
    </svg>
  );
}
