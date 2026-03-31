import { useState, useCallback, useEffect } from "react";
import { useTheme } from "../context/GlobalContext";

export function useChartColors() {
  const { isDark } = useTheme();
  return isDark ? CHART_COLORS.dark : CHART_COLORS.light;
}

const CHART_COLORS = {
  light: {
    text:        "#1e293b",
    textMuted:   "#94a3b8",
    textSubtle:  "#64748b",
    grid:        "#f1f5f9",
    axis:        "#e2e8f0",
    background:  "#f8fafc",
    tooltipBg:   "#ffffff",
    tooltipBorder: "#e2e8f0",
  },
  dark: {
    text:        "#f1f5f9",
    textMuted:   "#475569",
    textSubtle:  "#64748b",
    grid:        "#1e293b",
    axis:        "#334155",
    background:  "#0f172a",
    tooltipBg:   "#1e293b",
    tooltipBorder: "#334155",
  },
};

export function useChartTooltip() {
  const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, content: null });

  const show = useCallback((e, content) => {
    setTooltip({
      show: true,
      x: e.clientX,
      y: e.clientY,
      content
    });
  }, []);

  const hide = useCallback(() => {
    setTooltip(prev => ({ ...prev, show: false }));
  }, []);

  const move = useCallback((e) => {
    setTooltip(prev => ({ ...prev, x: e.clientX, y: e.clientY }));
  }, []);

  return { tooltip, show, hide, move };
}

export function ChartTooltip({ tooltip }) {
  const colors = useChartColors();
  if (!tooltip || !tooltip.show) return null;

  const left = Math.min(tooltip.x + 12, window.innerWidth  - 200);
  const top  = Math.min(tooltip.y + 12, window.innerHeight - 100);

  return (
    <div style={{
      position: "fixed",
      left, top,
      background:   colors.tooltipBg,
      border:       `1px solid ${colors.tooltipBorder}`,
      padding:      "8px 12px",
      borderRadius: "8px",
      boxShadow:    "0 4px 16px rgba(15,23,42,0.12)",
      pointerEvents: "none",
      zIndex:       9999,
      fontSize:     "12px",
      color:        colors.text,
      maxWidth:     240,
      lineHeight:   1.5,
    }}>
      {tooltip.content}
    </div>
  );
}

function NoData({ width = 300, height = 160, message = "No data" }) {
const colors = useChartColors();
  return (
    <svg
      width="100%"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={message}
      style={{ overflow: "visible" }}
    >
      <rect x={0} y={0} width={width} height={height} fill={colors.background} rx={8} />
      <text x={width / 2} y={height / 2 - 8} textAnchor="middle" fontSize={18} fill="#e2e8f0">📊</text>
      <text x={width / 2} y={height / 2 + 12} textAnchor="middle" fontSize={11} fill="#cbd5e1">{message}</text>
    </svg>
  );
}

function clamp(val, min, max) { return Math.min(max, Math.max(min, val)); }

export function BarChart({
  data,
  valueKey,
  labelKey,
  colorFn,
  height = 180,
  formatValue,
  maxBars = 20,
}) {
  const { tooltip, show, hide, move } = useChartTooltip();
  const colors = useChartColors();

  if (!data || data.length === 0) return <NoData height={height} />;

  const sliced  = data.slice(0, maxBars);
  const count   = sliced.length;
  const totalW  = 300;
  const padB    = 32; 
  const padT    = 20; 
  const chartH  = height - padB - padT;

  const slotW   = totalW / count;
  const barW    = clamp(Math.floor(slotW * 0.65), 12, 48);
  const values  = sliced.map(d => Number(d[valueKey]) || 0);
  const max     = Math.max(...values, 0.01);

    return (
    <>
    <ChartTooltip tooltip={tooltip} />
    <svg
  width="100%"
  height="auto"
  viewBox={`0 0 ${totalW} ${height}`}
  role="img"
  aria-label="Bar chart"
  style={{ overflow: "visible", display: "block" }}
>
      {[0.25, 0.5, 0.75, 1].map(ratio => {
        const gy = padT + chartH - ratio * chartH;
        return (
          <line
            key={ratio}
            x1={0} y1={gy} x2={totalW} y2={gy}
            stroke="#f1f5f9" strokeWidth={1}
          />
        );
      })}

      {sliced.map((d, i) => {
        const rawVal    = Number(d[valueKey]) || 0;
        const bh        = Math.max(4, (rawVal / max) * chartH);
        const slotStart = i * slotW;
        const x         = slotStart + (slotW - barW) / 2;
        const y         = padT + chartH - bh;
        const color     = colorFn ? colorFn(d) : "#f59e0b";
        const displayVal = formatValue
          ? formatValue(rawVal)
          : rawVal < 1 && rawVal > 0
            ? (rawVal * 100).toFixed(0) + "%"
            : String(rawVal);
        const label      = String(d[labelKey] ?? "");
        const shortLabel = label.length > 9 ? label.slice(0, 8) + "…" : label;

        // Clamp value label Y so it never goes above the SVG
        const labelY = Math.max(padT - 2, y - 5);

        return (
                    <g key={`bar-${i}`}>
            <rect
              x={x} y={y} width={barW} height={bh} rx={4}
              fill={color} opacity={0.88}
              onMouseEnter={(e) => show(e, <div style={{fontWeight:700}}>{label}<br/><span style={{color: color, fontSize: '13px'}}>{displayVal}</span></div>)}
              onMouseMove={move}
              onMouseLeave={hide}
              style={{ cursor: "crosshair", transition: "opacity 0.2s" }}
            />
            <text
              x={x + barW / 2} y={labelY}
              textAnchor="middle" fontSize={9} fill={colors.text} fontWeight="700"
            >
              {displayVal}
            </text>
            <text
              x={x + barW / 2} y={height - 8}
              textAnchor="middle" fontSize={8} fill={colors.textMuted}
            >
              {shortLabel}
            </text>
          </g>
        );
            })}
    </svg>
    </>
  );
}

export function HorizontalBarChart({
  data,
  formatValue,
  maxItems = 10,
  barHeight = 20,
  gap = 8,
}) {
  if (!data || data.length === 0) return <NoData height={120} />;

  const sliced  = data.slice(0, maxItems);
  const max     = Math.max(...sliced.map(d => Number(d.value) || 0), 0.01);
  const totalW  = 300;
  const labelW  = 90;   // left column for labels
  const barAreaW = totalW - labelW - 40;  // 40px right margin for value labels
  const totalH  = sliced.length * (barHeight + gap) + 10;

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${totalW} ${totalH}`}
      role="img"
      aria-label="Horizontal bar chart"
      style={{ overflow: "visible" }}
    >
      {sliced.map((d, i) => {
        const val      = Number(d.value) || 0;
        const bw       = Math.max(4, (val / max) * barAreaW);
        const y        = i * (barHeight + gap) + 5;
        const color    = d.color || "#f59e0b";
        const label    = String(d.label ?? "");
        const shortLbl = label.length > 14 ? label.slice(0, 13) + "…" : label;
        const display  = formatValue ? formatValue(val) : String(val);

        return (
          <g key={`hbar-${i}`}>
            {/* Label */}
            <text
              x={labelW - 6} y={y + barHeight / 2 + 4}
              textAnchor="end" fontSize={9} fill="#475569"
            >
              {shortLbl}
            </text>
            {/* Track */}
            <rect
              x={labelW} y={y}
              width={barAreaW} height={barHeight}
              rx={4} fill="#f1f5f9"
            />
            {/* Bar */}
            <rect
              x={labelW} y={y}
              width={bw} height={barHeight}
              rx={4} fill={color} opacity={0.88}
            >
              <title>{label}: {display}</title>
            </rect>
            {/* Value */}
            <text
              x={labelW + bw + 5} y={y + barHeight / 2 + 4}
              fontSize={9} fill="#1e293b" fontWeight="700"
            >
              {display}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function DonutChart({
  data,
  size = 140,
  centerLabel,
  centerSub = "total",
}) {
  const { tooltip, show, hide, move } = useChartTooltip();
  const colors = useChartColors();
  if (!data || data.length === 0) return <NoData width={size} height={size} />;

  const total = data.reduce((s, d) => s + (d.value || 0), 0);
  if (total === 0) return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="No data">
      <circle cx={size/2} cy={size/2} r={size*0.38} fill="none" stroke="#f1f5f9" strokeWidth={size*0.15} />
      <text x={size/2} y={size/2+4} textAnchor="middle" fontSize={size*0.1} fill="#cbd5e1">No data</text>
    </svg>
  );

  let cumAngle = -Math.PI / 2;
  const cx = size / 2;
  const cy = size / 2;
  const r  = size * 0.38;
  const ir = size * 0.23;

  const slices = data
    .filter(d => (d.value || 0) > 0)
    .map(d => {
      const angle = (d.value / total) * 2 * Math.PI;
      const x1    = cx + r * Math.cos(cumAngle);
      const y1    = cy + r * Math.sin(cumAngle);
      cumAngle   += angle;
      const x2    = cx + r * Math.cos(cumAngle);
      const y2    = cy + r * Math.sin(cumAngle);
      const ix1   = cx + ir * Math.cos(cumAngle);
      const iy1   = cy + ir * Math.sin(cumAngle);
      const ix2   = cx + ir * Math.cos(cumAngle - angle);
      const iy2   = cy + ir * Math.sin(cumAngle - angle);
      const lg = angle > Math.PI ? 1 : 0;

const isFullCircle = Math.abs(angle - 2 * Math.PI) < 0.001;
const path = isFullCircle
  ? `M${cx - r},${cy} A${r},${r} 0 0 1 ${cx + r},${cy}
     A${r},${r} 0 0 1 ${cx - r},${cy}
     M${cx - ir},${cy} A${ir},${ir} 0 0 0 ${cx + ir},${cy}
     A${ir},${ir} 0 0 0 ${cx - ir},${cy} Z`
  : `M${x1},${y1} A${r},${r} 0 ${lg} 1 ${x2},${y2} L${ix1},${iy1} A${ir},${ir} 0 ${lg} 0 ${ix2},${iy2} Z`;

return { path, color: d.color, label: d.label, value: d.value };
    });

  const displayCenter = centerLabel ?? String(total);
    return (
    <>
    <ChartTooltip tooltip={tooltip} />
    <svg
  width="100%"
  height="100%"
  viewBox={`0 0 ${size} ${size}`}
  role="img" aria-label="Donut chart"
  style={{ 
    display: "block", 
    margin: "0 auto", 
    maxWidth: size * 1.3,
    maxHeight: size * 1.3,
    overflow: "visible" 
  }}
>
      {slices.map((s, i) => (
        <path 
          key={i} d={s.path} fill={s.color} opacity={0.9}
          onMouseEnter={(e) => show(e, <div style={{fontWeight:700}}>{s.label}<br/><span style={{fontSize: '12px'}}>{s.value} ({((s.value/total)*100).toFixed(1)}%)</span></div>)}
          onMouseMove={move}
          onMouseLeave={hide}
          style={{ cursor: "crosshair", transition: "opacity 0.2s" }}
        />
      ))}
      <text
        x={cx} y={cy + 2}
        textAnchor="middle" fontSize={size * 0.13}
        fontWeight="800" fill="#0f172a"
      >
        {displayCenter}
      </text>
      <text
        x={cx} y={cy + size * 0.13}
        textAnchor="middle" fontSize={size * 0.08}
        fill={colors.textSubtle}
      >
        {centerSub}
           </text>
    </svg>
    </>
  );
}

export function ScatterPlot({
  data,
  cliffValue = 5000,
  currencySymbol = "$",
  currencyLocale = "en-US",
  width = 300,
  height = 160,
}) {
  const colors = useChartColors();
  if (!data || data.length === 0) return <NoData width={width} height={height} />;
  const validData = data.filter(d => d.MonthlySalary != null && !isNaN(Number(d.MonthlySalary)));
  if (validData.length === 0) return <NoData width={width} height={height} message="No salary data" />;

  const salaries = validData.map(d => Number(d.MonthlySalary));
  const pad = { l: 34, r: 20, t: 14, b: 30 };
  const W   = width  - pad.l - pad.r;
  const H   = height - pad.t - pad.b;
  const rawMin = Math.min(...salaries);
  const rawMax = Math.max(...salaries);
  // Ensure cliff is always visible even if outside data range
  const minS = Math.min(rawMin, cliffValue) - (rawMax - rawMin) * 0.05;
  const maxS = Math.max(rawMax, cliffValue) + (rawMax - rawMin) * 0.05;
  const range = maxS - minS || 1;

  const toX = s  => pad.l + ((Number(s) - minS) / range) * W;
  const toY = sat => {
    const c = clamp(Number(sat) || 1, 1, 10);
    return pad.t + H - ((c - 1) / 9) * H;
  };

  // Currency-aware cliff label
  const cliffLabel = cliffValue >= 1_000_000
    ? `${currencySymbol}${(cliffValue / 1_000_000).toFixed(1)}M`
    : cliffValue >= 1_000
      ? `${currencySymbol}${(cliffValue / 1_000).toFixed(0)}K`
      : `${currencySymbol}${cliffValue}`;

  const statusColor = s =>
    String(s).toLowerCase().includes("resigned")  ? "#ef4444" :
    String(s).toLowerCase().includes("high risk") ? "#f59e0b" : "#22c55e";

  const cliffX = toX(cliffValue);

  return (
<svg
  width="100%"
  height="auto"
  viewBox={`0 0 ${width} ${height}`}
  role="img"
  aria-label="Scatter plot: salary vs satisfaction"
  style={{ overflow: "visible", display: "block" }}
>
      <line x1={pad.l} y1={pad.t}     x2={pad.l}         y2={pad.t + H} stroke="#e2e8f0" strokeWidth={1} />
      <line x1={pad.l} y1={pad.t + H} x2={pad.l + W + 4} y2={pad.t + H} stroke="#e2e8f0" strokeWidth={1} />

      {/* Y gridlines at 3, 5, 7, 10 */}
      {[3, 5, 7, 10].map(v => (
        <line
          key={v}
          x1={pad.l} y1={toY(v)} x2={pad.l + W} y2={toY(v)}
          stroke={colors.grid} strokeWidth={1} strokeDasharray="3,3"
        />
      ))}

      {/* Cliff line */}
      <line
        x1={cliffX} y1={pad.t} x2={cliffX} y2={pad.t + H}
        stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4,3"
      />
      <text x={cliffX + 3} y={pad.t + 9} fontSize={7} fill="#f59e0b" fontWeight="700">
        {cliffLabel} cliff
      </text>

      {/* Dots — slight jitter to avoid perfect overlap */}
      {validData.map((d, i) => {
        // Deterministic jitter based on EmployeeID hash
        const seed  = (String(d.EmployeeID || i).split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 100) / 100;
        const jitterX = (seed - 0.5) * 15;
const jitterY = ((seed * 7 % 1) - 0.5) * 10;
        const cx   = clamp(toX(d.MonthlySalary) + jitterX, pad.l, pad.l + W);
        const cy   = clamp(toY(d.JobSatisfaction) + jitterY, pad.t, pad.t + H);
        const fill = statusColor(d.AttritionStatus);
        return (
          <circle key={d.EmployeeID || i} cx={cx} cy={cy} r={3.5} fill={fill} opacity={0.62}>
            <title>
              {[d.FirstName, d.LastName].filter(Boolean).join(" ") || d.EmployeeID}
              {" · "}{currencySymbol}{Number(d.MonthlySalary).toLocaleString(currencyLocale)}
              {" · Satisfaction: "}{d.JobSatisfaction}/10
              {" · "}{d.AttritionStatus}
            </title>
          </circle>
        );
      })}

      {/* Y-axis labels */}
      <text x={pad.l - 5} y={toY(10) + 4} textAnchor="end" fontSize={7} fill="#94a3b8">10</text>
      <text x={pad.l - 5} y={toY(5)  + 4} textAnchor="end" fontSize={7} fill="#94a3b8">5</text>
      <text x={pad.l - 5} y={toY(1)  + 4} textAnchor="end" fontSize={7} fill="#94a3b8">1</text>

      {/* X-axis label */}
      <text x={pad.l + W / 2} y={height - 2} textAnchor="middle" fontSize={7} fill="#94a3b8">
        Monthly Salary →
      </text>

      {/* Legend */}
      {[["Resigned","#ef4444"],["High Risk","#f59e0b"],["Active","#22c55e"]].map(([lbl, clr], i) => (
        <g key={lbl} transform={`translate(${pad.l + i * 68}, ${height - 2})`}>
          <circle cx={0} cy={-3} r={3} fill={clr} opacity={0.8} />
          <text x={6} y={0} fontSize={6} fill="#94a3b8">{lbl}</text>
        </g>
      ))}
    </svg>
  );
}

export function GaugeChart({ value = 0, size = 160, label = "Flight Risk", color: colorOverride }) {
  const pct         = clamp(Number(value) || 0, 0, 100);
  const autoColor   = pct >= 75 ? "#ef4444" : pct >= 50 ? "#f59e0b" : pct >= 25 ? "#3b82f6" : "#22c55e";
  const activeColor = colorOverride || autoColor;
  
  const cx = size / 2;
  const cy = size * 0.52;
  const r  = size * 0.38;
  
  // Membuat garis-garis skala (Dial Ticks) layaknya spidometer asli
  const ticks = [];
  for (let i = 0; i <= 100; i += 2.5) {
    const isMajor  = i % 25 === 0;
    const isMedium = i % 10 === 0;
    const length   = isMajor ? size * 0.07 : isMedium ? size * 0.05 : size * 0.025;
    const thick    = isMajor ? 2.5 : isMedium ? 1.5 : 1;
    
    // Perhitungan matematika untuk posisi putaran dari kiri ke kanan
    const angleRad = Math.PI - (i / 100) * Math.PI;
    const x1 = cx + (r - length) * Math.cos(angleRad);
    const y1 = cy - (r - length) * Math.sin(angleRad);
    const x2 = cx + r * Math.cos(angleRad);
    const y2 = cy - r * Math.sin(angleRad);
    
    // Warnai garis jika dilewati oleh jarum, jika tidak beri warna abu-abu pudar
    const tickColor = i <= pct ? activeColor : "rgba(148, 163, 184, 0.25)";
    
    ticks.push(
      <line 
        key={i} 
        x1={x1} y1={y1} x2={x2} y2={y2} 
        stroke={tickColor} 
        strokeWidth={thick} 
        strokeLinecap="round"
        style={{ transition: "stroke 0.8s ease" }}
      />
    );
  }

  // Sudut rotasi jarum
  const needleAngle = -90 + (pct / 100) * 180;

  return (
    <svg
      width="100%"
      height="auto"
      viewBox={`0 0 ${size} ${size * 0.9}`}
      role="img"
      aria-label={`${label}: ${pct.toFixed(0)}%`}
      style={{
        display: "block",
        margin: "0 auto",
        maxWidth: "240px",
        overflow: "visible"
      }}
    >
      <defs>
        {/* Efek Bayangan untuk Jarum */}
        <filter id="needle-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="4" stdDeviation="3" floodOpacity="0.2" />
        </filter>
        {/* Efek Glow untuk Angka */}
        <filter id="text-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor={activeColor} floodOpacity="0.3" />
        </filter>
      </defs>
      
      {/* Garis Skala Spidometer */}
      {ticks}
      
      {/* Lintasan Halus di Luar Skala */}
      <path 
        d={`M${cx - r - size*0.02},${cy} A${r + size*0.02},${r + size*0.02} 0 0 1 ${cx + r + size*0.02},${cy}`} 
        fill="none" 
        stroke="rgba(148, 163, 184, 0.15)" 
        strokeWidth="1.5" 
        strokeDasharray="4, 4"
      />

      {/* Group Jarum (Needle) dengan Animasi Bouncy */}
      <g 
        style={{ 
          transition: "transform 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)", 
          transformOrigin: `${cx}px ${cy}px` 
        }} 
        transform={`rotate(${needleAngle}, ${cx}, ${cy})`}
      >
        {/* Bentuk Jarum Utama */}
        <polygon
          points={`${cx - size*0.03},${cy} ${cx + size*0.03},${cy} ${cx},${cy - r + size*0.06}`}
          fill={activeColor}
          filter="url(#needle-shadow)"
        />
        {/* Highlight 3D pada Jarum (Warna lebih terang di satu sisi) */}
        <polygon
          points={`${cx - size*0.015},${cy} ${cx},${cy} ${cx},${cy - r + size*0.06}`}
          fill="rgba(255, 255, 255, 0.25)" 
        />
      </g>

      {/* Titik Poros Tengah yang Elegan */}
      <circle cx={cx} cy={cy} r={size * 0.07} fill="#1e293b" filter="url(#needle-shadow)" />
      <circle cx={cx} cy={cy} r={size * 0.025} fill="#f1f5f9" />
      <circle cx={cx} cy={cy} r={size * 0.01} fill={activeColor} />
      
      {/* Angka Batas 0 dan 100 */}
      <text x={cx - r} y={cy + size * 0.10} textAnchor="middle" fontSize={size * 0.06} fill="#94a3b8" fontWeight="600">0</text>
      <text x={cx + r} y={cy + size * 0.10} textAnchor="middle" fontSize={size * 0.06} fill="#94a3b8" fontWeight="600">100</text>

      {/* Persentase Utama (Besar & Menyala) */}
      <text
        x={cx} y={cy + size * 0.24}
        textAnchor="middle" fontSize={size * 0.18}
        fontWeight="800" fill={activeColor}
        filter="url(#text-glow)"
      >
        {pct.toFixed(0)}%
      </text>

      {/* Nama Metrik (Label) - Desain Huruf Kapital Elegan */}
      <text
        x={cx} y={cy + size * 0.35}
        textAnchor="middle" fontSize={size * 0.07}
        fill="#64748b"
        fontWeight="700"
        letterSpacing="0.5"
      >
        {String(label).toUpperCase()}
      </text>
    </svg>
  );
}


export function LineChart({
  series = [],
  xLabel = "",
  yLabel = "",
  formatX,
  formatY,
  width  = 300,
  height = 160,
  showArea = true,
}) {
  if (!series || series.length === 0 || series.every(s => !s.data?.length)) {
    return <NoData width={width} height={height} />;
  }

  const pad = { l: 36, r: 16, t: 16, b: 36 };
  const W   = width  - pad.l - pad.r;
  const H   = height - pad.t - pad.b;

  const allPoints = series.flatMap(s => s.data || []);
  const allX = allPoints.map(p => Number(p.x));
  const allY = allPoints.map(p => Number(p.y));
  const minX = Math.min(...allX);
  const maxX = Math.max(...allX);
  const minY = Math.min(...allY, 0);
  const maxY = Math.max(...allY, 0.01);
  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;

  const toX = x => pad.l + ((Number(x) - minX) / rangeX) * W;
  const toY = y => pad.t + H - ((Number(y) - minY) / rangeY) * H;

  // 4 y-axis gridlines
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(r => minY + r * rangeY);

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`Line chart${xLabel ? `: ${xLabel}` : ""}`}
      style={{ overflow: "visible" }}
    >
      {/* Gridlines */}
      {yTicks.map((v, i) => (
        <line
          key={i}
          x1={pad.l} y1={toY(v)} x2={pad.l + W} y2={toY(v)}
          stroke="#f1f5f9" strokeWidth={1}
        />
      ))}

      {/* Y-axis labels */}
      {yTicks.filter((_, i) => i % 2 === 0).map((v, i) => (
        <text key={i} x={pad.l - 4} y={toY(v) + 4} textAnchor="end" fontSize={8} fill="#94a3b8">
          {formatY ? formatY(v) : Math.round(v)}
        </text>
      ))}

      {/* X-axis */}
      <line x1={pad.l} y1={pad.t + H} x2={pad.l + W} y2={pad.t + H} stroke={colors.axis} strokeWidth={1} />

      {/* Series */}
      {series.map((s, si) => {
        if (!s.data || s.data.length === 0) return null;
        const pts   = s.data.map(p => `${toX(p.x)},${toY(p.y)}`).join(" ");
        const color = s.color || "#f59e0b";

        // Area path: line + down to baseline + back
        const firstX = toX(s.data[0].x);
        const lastX  = toX(s.data[s.data.length - 1].x);
        const baseY  = toY(minY);
        const areaD  = `M${firstX},${baseY} L${s.data.map(p => `${toX(p.x)},${toY(p.y)}`).join(" L")} L${lastX},${baseY} Z`;

        return (
          <g key={si}>
            {showArea && (
              <path d={areaD} fill={color} opacity={0.08} />
            )}
            <polyline
              points={pts} fill="none"
              stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round"
            />
            {/* Dots at each data point */}
            {s.data.map((p, pi) => (
              <circle key={pi} cx={toX(p.x)} cy={toY(p.y)} r={3} fill={color}>
                <title>
                  {s.label}: {formatY ? formatY(p.y) : p.y}
                  {p.label ? ` — ${p.label}` : ""}
                </title>
              </circle>
            ))}
          </g>
        );
      })}

      {/* X-axis tick labels — show first, middle, last */}
      {(() => {
        const allXVals = [...new Set(allPoints.map(p => p.x))].sort((a, b) => a - b);
        const show = allXVals.length <= 6
          ? allXVals
          : [allXVals[0], allXVals[Math.floor(allXVals.length / 2)], allXVals[allXVals.length - 1]];
        return show.map((x, i) => (
          <text key={i} x={toX(x)} y={pad.t + H + 14} textAnchor="middle" fontSize={8} fill="#94a3b8">
            {formatX ? formatX(x) : x}
          </text>
        ));
      })()}

      {/* Axis labels */}
      {xLabel && (
        <text x={pad.l + W / 2} y={height - 2} textAnchor="middle" fontSize={8} fill="#94a3b8">
          {xLabel}
        </text>
      )}

      {/* Legend */}
      {series.length > 1 && series.map((s, i) => (
        <g key={i} transform={`translate(${pad.l + i * 80}, ${height - 4})`}>
          <line x1={0} y1={-3} x2={12} y2={-3} stroke={s.color || "#f59e0b"} strokeWidth={2} />
          <text x={15} y={0} fontSize={7} fill="#64748b">{s.label}</text>
        </g>
      ))}
    </svg>
  );
}

export function RadarChart({ metrics = [], series, size = 200, maxVal = 1 }) {
  if (!metrics || metrics.length < 3) {
    return <NoData width={size} height={size} message="Need ≥3 metrics" />;
  }

  const cx     = size / 2;
  const cy     = size / 2;
  const r      = size * 0.36;
  const n      = metrics.length;
  const levels = 4;  // concentric grid rings

  // Angle for each axis (start at top, clockwise)
  const angle = i => (i / n) * 2 * Math.PI - Math.PI / 2;

  // Point on axis at given ratio (0–1)
  const axisPoint = (i, ratio) => ({
    x: cx + r * ratio * Math.cos(angle(i)),
    y: cy + r * ratio * Math.sin(angle(i)),
  });

  // Build polygon path from values array
  const buildPath = values =>
    values.map((v, i) => {
      const ratio = clamp(Number(v) / maxVal, 0, 1);
      const p     = axisPoint(i, ratio);
      return `${i === 0 ? "M" : "L"}${p.x},${p.y}`;
    }).join(" ") + " Z";

  // Determine series to draw
  const allSeries = series
    ? series
    : [{ label: "", color: "#f59e0b", values: metrics.map(m => m.value || 0) }];

  return (
    <svg
      width={size} height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label="Radar chart"
    >
      {/* Grid rings */}
      {Array.from({ length: levels }, (_, li) => {
        const ratio = (li + 1) / levels;
        const pts   = Array.from({ length: n }, (_, i) => {
          const p = axisPoint(i, ratio);
          return `${p.x},${p.y}`;
        }).join(" ");
        return (
          <polygon
            key={li} points={pts}
            fill="none" stroke="#e2e8f0" strokeWidth={1}
          />
        );
      })}

      {/* Axis lines */}
      {metrics.map((_, i) => {
        const end = axisPoint(i, 1);
        return (
          <line key={i} x1={cx} y1={cy} x2={end.x} y2={end.y} stroke="#e2e8f0" strokeWidth={1} />
        );
      })}

      {/* Series fills and strokes */}
      {allSeries.map((s, si) => (
        <g key={si}>
          <path
            d={buildPath(s.values || metrics.map(m => m.value || 0))}
            fill={s.color || "#f59e0b"} opacity={0.15}
          />
          <path
            d={buildPath(s.values || metrics.map(m => m.value || 0))}
            fill="none" stroke={s.color || "#f59e0b"}
            strokeWidth={2} strokeLinejoin="round"
          />
          {/* Dots at each vertex */}
          {(s.values || metrics.map(m => m.value || 0)).map((v, i) => {
            const ratio = clamp(Number(v) / maxVal, 0, 1);
            const p     = axisPoint(i, ratio);
            return (
              <circle key={i} cx={p.x} cy={p.y} r={3} fill={s.color || "#f59e0b"}>
                <title>{metrics[i]?.label}: {v}</title>
              </circle>
            );
          })}
        </g>
      ))}

      {/* Axis labels */}
      {metrics.map((m, i) => {
        const labelRatio = 1.18;
        const lx = cx + r * labelRatio * Math.cos(angle(i));
        const ly = cy + r * labelRatio * Math.sin(angle(i));
        const anchor =
          Math.abs(Math.cos(angle(i))) < 0.1 ? "middle" :
          Math.cos(angle(i)) > 0 ? "start" : "end";
        return (
          <text
            key={i} x={lx} y={ly + 4}
            textAnchor={anchor} fontSize={9}
            fontWeight="600" fill="#475569"
          >
            {m.label}
          </text>
        );
      })}

      {/* Legend for multi-series */}
      {allSeries.length > 1 && allSeries.map((s, i) => (
        <g key={i} transform={`translate(8, ${size - 14 - i * 14})`}>
          <rect width={10} height={10} rx={2} fill={s.color || "#f59e0b"} opacity={0.7} />
          <text x={13} y={9} fontSize={8} fill="#64748b">{s.label}</text>
        </g>
      ))}
    </svg>
  );
}

export function SparklineChart({
  data = [],
  color = "#f59e0b",
  width = 80,
  height = 32,
  showDot = true,
}) {
  if (!data || data.length < 2) return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <line x1={0} y1={height/2} x2={width} y2={height/2} stroke="#e2e8f0" strokeWidth={1} strokeDasharray="3,3" />
    </svg>
  );

  const nums  = data.map(Number);
  const min   = Math.min(...nums);
  const max   = Math.max(...nums);
  const range = max - min || 1;
  const pad   = 3;
  const W     = width  - pad * 2;
  const H     = height - pad * 2;

  const toX = i  => pad + (i / (nums.length - 1)) * W;
  const toY = v  => pad + H - ((v - min) / range) * H;

  const points = nums.map((v, i) => `${toX(i)},${toY(v)}`).join(" ");
  const lastX  = toX(nums.length - 1);
  const lastY  = toY(nums[nums.length - 1]);

  // Trend direction color
  const trendColor = nums[nums.length - 1] >= nums[0] ? color : "#ef4444";

  return (
    <svg
      width={width} height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Trend sparkline"
    >
      <polyline
        points={points} fill="none"
        stroke={trendColor} strokeWidth={1.5}
        strokeLinejoin="round" strokeLinecap="round"
      />
      {showDot && (
        <circle cx={lastX} cy={lastY} r={2.5} fill={trendColor} />
      )}
    </svg>
  );
}

export function HeatmapChart({
  data = [],
  rows = [],
  cols = [],
  colorFn,
  formatVal,
  cellSize = 24,
}) {
  if (!data.length || !rows.length || !cols.length) {
    return <NoData width={200} height={100} />;
  }

  const values = data.map(d => Number(d.value) || 0);
  const minV   = Math.min(...values);
  const maxV   = Math.max(...values, 0.01);

  const defaultColorFn = (v) => {
    const ratio = (v - minV) / (maxV - minV);
    // White → amber → red
    if (ratio < 0.5) {
      const r = Math.round(255);
      const g = Math.round(255 - ratio * 2 * (255 - 159));
      const b = Math.round(255 - ratio * 2 * 255);
      return `rgb(${r},${g},${b})`;
    } else {
      const r = 255;
      const g = Math.round(159 - (ratio - 0.5) * 2 * 159);
      const b = 0;
      return `rgb(${r},${g},${b})`;
    }
  };

  const getColor = colorFn || defaultColorFn;

  const padL  = 60;  // left for row labels
  const padT  = 28;  // top for col labels
  const w     = padL + cols.length * cellSize;
  const h     = padT + rows.length * cellSize;

  // Build lookup for fast access
  const lookup = {};
  data.forEach(d => { lookup[`${d.row}__${d.col}`] = d; });

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label="Heatmap chart"
      style={{ overflow: "visible" }}
    >
      {/* Column headers */}
      {cols.map((col, ci) => (
        <text
          key={ci}
          x={padL + ci * cellSize + cellSize / 2}
          y={padT - 6}
          textAnchor="middle" fontSize={8} fill="#64748b"
        >
          {String(col).slice(0, 5)}
        </text>
      ))}

      {/* Row headers + cells */}
      {rows.map((row, ri) => (
        <g key={ri}>
          <text
            x={padL - 6}
            y={padT + ri * cellSize + cellSize / 2 + 4}
            textAnchor="end" fontSize={8} fill="#64748b"
          >
            {String(row).length > 8 ? String(row).slice(0, 7) + "…" : String(row)}
          </text>
          {cols.map((col, ci) => {
            const cell  = lookup[`${row}__${col}`];
            const val   = cell ? Number(cell.value) : 0;
            const fill  = getColor(val, minV, maxV);
            const label = cell?.label ?? (formatVal ? formatVal(val) : String(val));
            return (
              <rect
                key={ci}
                x={padL + ci * cellSize} y={padT + ri * cellSize}
                width={cellSize - 1} height={cellSize - 1}
                rx={3} fill={fill}
              >
                <title>{row} × {col}: {label}</title>
              </rect>
            );
          })}
        </g>
      ))}
    </svg>
  );
}

export function GanttChart({
  tasks = [],
  totalDays = 90,
  milestones = [],
}) {
  if (!tasks || tasks.length === 0) return <NoData height={80} />;

  const rowH   = 26;
  const padL   = 88;   // left for task labels
  const padT   = 24;   // top for day axis
  const padR   = 12;
  const totalW = 360;
  const barW   = totalW - padL - padR;
  const totalH = padT + tasks.length * rowH + 16;

  const toX = day => padL + (clamp(Number(day), 0, totalDays) / totalDays) * barW;

  // Day tick marks: 0, 30, 60, 90
  const ticks = [0, 30, 60, 90].filter(d => d <= totalDays);

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${totalW} ${totalH}`}
      role="img"
      aria-label="Gantt chart"
      style={{ overflow: "visible" }}
    >
      {/* Day axis ticks */}
      {ticks.map(d => (
        <g key={d}>
          <line
            x1={toX(d)} y1={padT - 4} x2={toX(d)} y2={totalH - 8}
            stroke="#f1f5f9" strokeWidth={1}
          />
          <text x={toX(d)} y={padT - 8} textAnchor="middle" fontSize={8} fill="#94a3b8">
            Day {d}
          </text>
        </g>
      ))}

      {/* Milestone vertical lines */}
      {milestones.map((m, i) => (
        <g key={i}>
          <line
            x1={toX(m.day)} y1={padT} x2={toX(m.day)} y2={totalH - 8}
            stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4,3"
          />
          <text x={toX(m.day) + 3} y={padT + 10} fontSize={7} fill="#f59e0b" fontWeight="700">
            {m.label}
          </text>
        </g>
      ))}

      {/* Tasks */}
      {tasks.map((t, i) => {
        const y      = padT + i * rowH + 4;
        const x      = toX(t.start || 0);
        const w      = Math.max(4, (clamp(t.duration || 7, 1, totalDays) / totalDays) * barW);
        const color  = t.color || "#f59e0b";
        const label  = String(t.label || "");
        const short  = label.length > 13 ? label.slice(0, 12) + "…" : label;

        return (
          <g key={i}>
            {/* Row background — alternating */}
            <rect
              x={0} y={y - 2} width={totalW} height={rowH - 2}
              fill={i % 2 === 0 ? "#f8fafc" : "#fff"} opacity={0.6}
            />
            {/* Task label */}
            <text
              x={padL - 6} y={y + rowH / 2}
              textAnchor="end" fontSize={8} fill="#475569"
              dominantBaseline="middle"
            >
              {short}
            </text>
            {/* Bar track */}
            <rect
              x={padL} y={y + 3} width={barW} height={rowH - 10}
              rx={4} fill="#f1f5f9"
            />
            {/* Bar fill */}
            <rect
              x={x} y={y + 3} width={w} height={rowH - 10}
              rx={4} fill={color} opacity={0.85}
            >
              <title>{label}: Day {t.start}–{(t.start || 0) + (t.duration || 7)}</title>
            </rect>
            {/* Category badge if provided */}
            {t.category && (
              <text x={x + w + 4} y={y + rowH / 2} fontSize={7} fill={color} dominantBaseline="middle">
                {t.category}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
