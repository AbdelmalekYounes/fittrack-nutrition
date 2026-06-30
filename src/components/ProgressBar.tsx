interface ProgressBarProps {
  label?: string;
  current: number;
  target: number;
  unit?: string;
  color?: string;
}

export default function ProgressBar({ label, current, target, unit = '', color }: ProgressBarProps) {
  const percent = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
  const fillColor = color ?? 'var(--color-primary)';

  return (
    <div className="progress-row">
      {label && (
        <div className="progress-row__labels">
          <span>{label}</span>
          <span>
            {Math.round(current)} / {Math.round(target)} {unit}
          </span>
        </div>
      )}
      <div className="progress-bar">
        <div
          className="progress-bar__fill"
          style={{ width: `${percent}%`, backgroundColor: fillColor }}
        />
      </div>
    </div>
  );
}
