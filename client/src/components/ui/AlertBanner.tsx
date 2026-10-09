import React, { useState } from 'react';
import { CloudRain, Flame, Wind, AlertOctagon, X } from 'lucide-react';
import { WeatherAlert } from '../../../../shared/types';

interface Props {
  alert: WeatherAlert;
}

export const AlertBanner: React.FC<Props> = ({ alert }) => {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  const icon =
    alert.type === 'rain' ? (
      <CloudRain className="w-5 h-5 text-blue-400 flex-shrink-0" />
    ) : alert.type === 'heat' ? (
      <Flame className="w-5 h-5 text-amber-400 flex-shrink-0" />
    ) : alert.type === 'aqi' ? (
      <Wind className="w-5 h-5 text-purple-400 flex-shrink-0" />
    ) : (
      <AlertOctagon className="w-5 h-5 text-red-400 flex-shrink-0" />
    );

  const borderClass =
    alert.severity === 'critical'
      ? 'border-red-500/40 bg-red-950/40 text-red-100'
      : 'border-amber-500/40 bg-amber-950/40 text-amber-100';

  return (
    <div
      role="alert"
      className={`relative flex items-start gap-3 p-3 rounded-xl border backdrop-blur-md shadow-lg transition-all animate-fadeIn ${borderClass}`}
    >
      <div className="mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0 pr-6">
        <h4 className="text-xs font-bold leading-tight flex items-center gap-2">
          {alert.headline}
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 font-mono">
            {alert.metricValue}
          </span>
        </h4>
        <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">{alert.advice}</p>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-2.5 right-2.5 p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
        aria-label="Dismiss alert"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
