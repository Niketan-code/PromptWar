import React from 'react';

interface Props {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  className?: string;
}

export const ScoreRing: React.FC<Props> = ({
  score,
  size = 46,
  strokeWidth = 4,
  label,
  className = '',
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const normalized = Math.min(100, Math.max(0, score));
  const strokeDashoffset = circumference - (normalized / 100) * circumference;

  let color = '#22C55E'; // green
  if (normalized < 50) color = '#EF4444'; // red
  else if (normalized < 75) color = '#F59E0B'; // amber

  return (
    <div className={`relative flex flex-col items-center justify-center ${className}`}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.12)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold tabular-nums text-white">
          {Math.round(score)}
        </span>
      </div>
      {label && <span className="text-[10px] text-slate-400 mt-1">{label}</span>}
    </div>
  );
};
