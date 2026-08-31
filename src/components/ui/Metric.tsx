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
}

export function SimpleLineChart({ data, label, color = '#4fc3f7', yUnit = '' }: SimpleLineChartProps) {
  if (data.length < 2) {
    return (
      <div className="chart-empty">
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

  const xMin = data[0].x;
  const xMax = data[data.length - 1].x;
  const yMin = Math.min(...data.map((d) => d.y));
  const yMax = Math.max(...data.map((d) => d.y));
  const yRange = yMax - yMin || 1;

  const points = data
    .map((d) => {
      const x = padding.left + ((d.x - xMin) / (xMax - xMin || 1)) * chartW;
      const y = padding.top + chartH - ((d.y - yMin) / yRange) * chartH;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="simple-chart">
      <div className="chart-label">{label}{yUnit ? ` (${yUnit})` : ''}</div>
      <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg">
        <line
          x1={padding.left}
          y1={padding.top + chartH}
          x2={padding.left + chartW}
          y2={padding.top + chartH}
          stroke="#334155"
          strokeWidth="1"
        />
        <polyline
          points={points}
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
    </div>
  );
}
