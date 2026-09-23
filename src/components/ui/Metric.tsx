interface MetricProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'neutral';
  variant?: 'default' | 'warning' | 'success';
}

export function Metric({ label, value, unit, variant = 'default' }: MetricProps) {
  return (
    <div className={`metric metric-${variant}`}>
      <div className="metric-label">{label}</div>
      <div className="metric-value">
        {value}
        {unit && <span className="metric-unit">{unit}</span>}
      </div>
    </div>
  );
}

interface SimpleLineChartProps {
  data: { x: number; y: number }[];
  label: string;
  color?: string;
  yUnit?: string;
  compareData?: { x: number; y: number }[];
  compareLabel?: string;
  compareColor?: string;
}

export function SimpleLineChart({
  data,
  label,
  color = '#4fc3f7',
  yUnit = '',
  compareData,
  compareLabel = 'Control',
  compareColor = '#94a3b8',
}: SimpleLineChartProps) {
  if (data.length < 2) {
    return (
      <div className="chart-empty" role="img" aria-label={`${label}: insufficient data`}>
        <span>{label}</span>
        <p>Insufficient data points</p>
      </div>
    );
  }

  const width = 400;
  const height = 120;
  const padding = { top: 10, right: 10, bottom: 24, left: 40 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const allY = [
    ...data.map((d) => d.y),
    ...(compareData ?? []).map((d) => d.y),
  ];
  const xMin = Math.min(data[0].x, ...(compareData?.map((d) => d.x) ?? [data[0].x]));
  const xMax = Math.max(
    data[data.length - 1].x,
    ...(compareData?.map((d) => d.x) ?? [data[data.length - 1].x]),
  );
  const yMin = Math.min(...allY);
  const yMax = Math.max(...allY);
  const yRange = yMax - yMin || 1;

  const toPoints = (series: { x: number; y: number }[]) =>
    series
      .map((d) => {
        const x = padding.left + ((d.x - xMin) / (xMax - xMin || 1)) * chartW;
        const y = padding.top + chartH - ((d.y - yMin) / yRange) * chartH;
        return `${x},${y}`;
      })
      .join(' ');

  return (
    <div className="simple-chart" role="img" aria-label={`${label} trend chart`}>
      <div className="chart-label">{label}{yUnit ? ` (${yUnit})` : ''}</div>
      <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg" aria-hidden="true">
        <line
          x1={padding.left}
          y1={padding.top + chartH}
          x2={padding.left + chartW}
          y2={padding.top + chartH}
          stroke="#334155"
          strokeWidth="1"
        />
        {compareData && compareData.length >= 2 && (
          <polyline
            points={toPoints(compareData)}
            fill="none"
            stroke={compareColor}
            strokeWidth="2"
            strokeDasharray="4 3"
            strokeLinejoin="round"
          />
        )}
        <polyline
          points={toPoints(data)}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {data.length > 0 && (
          <circle
            cx={padding.left + chartW}
            cy={
              padding.top +
              chartH -
              ((data[data.length - 1].y - yMin) / yRange) * chartH
            }
            r="3"
            fill={color}
          />
        )}
      </svg>
      {compareData && compareData.length >= 2 && (
        <p className="chart-legend text-muted">
          Solid: experimental · Dashed: {compareLabel}
        </p>
      )}
    </div>
  );
}
