interface GaugeProps {
  percent: number; // 0-100
  label: string;
  size?: number;
  color?: string;
}

export default function Gauge({ percent, label, size = 110, color = 'var(--color-primary)' }: GaugeProps) {
  const clamped = Math.max(0, Math.min(100, percent));
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="gauge">
      <svg className="gauge__svg" width={size} height={size}>
        <circle
          className="gauge__bg"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <circle
          className="gauge__fill"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="gauge__label">{Math.round(clamped)}%</div>
      <div className="text-muted">{label}</div>
    </div>
  );
}
