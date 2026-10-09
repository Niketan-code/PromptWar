import React from 'react';
import { Shield, Clock, Navigation2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { RouteAlternative } from '../../../../shared/types';
import { useAppStore } from '../../store/useAppStore';

interface Props {
  route: RouteAlternative;
}

export const SafeRouteCard: React.FC<Props> = ({ route }) => {
  const { selectedRoute, setSelectedRoute } = useAppStore();
  const isSelected = selectedRoute?.id === route.id;

  const badgeColor = route.isSafest
    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
    : route.isFastest
    ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
    : 'bg-white/10 text-slate-300 border-white/20';

  const badgeText = route.isSafest ? '🛡️ SAFEST ROUTE' : route.isFastest ? '⚡ FASTEST ROUTE' : 'ALTERNATIVE';

  return (
    <div
      onClick={() => setSelectedRoute(route)}
      className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
        isSelected
          ? route.isSafest
            ? 'bg-emerald-950/30 border-emerald-500/60 shadow-lg shadow-emerald-500/15'
            : 'bg-blue-950/30 border-blue-500/60 shadow-lg shadow-blue-500/15'
          : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-white/20'
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}>
          {badgeText}
        </span>
        <div className="flex items-center gap-1 text-xs font-bold font-mono text-white">
          <span>{route.durationMin} mins</span>
          <span className="text-slate-500">·</span>
          <span>{route.distanceKm} km</span>
        </div>
      </div>

      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-bold text-white truncate">{route.summary}</h4>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-[10px] text-slate-400">Safety Score:</span>
          <span
            className={`text-xs font-extrabold px-2 py-0.5 rounded-lg ${
              route.safetyScore >= 80
                ? 'bg-emerald-500 text-slate-950'
                : route.safetyScore >= 65
                ? 'bg-amber-500 text-slate-950'
                : 'bg-red-500 text-white'
            }`}
          >
            {route.safetyScore}/100
          </span>
        </div>
      </div>

      {/* Plain English Reason */}
      <p className="text-[11px] text-slate-300 leading-relaxed bg-white/[0.02] p-2 rounded-xl border border-white/5">
        {route.reason}
      </p>

      {/* Metrics Row */}
      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-white/5 text-[10px] text-slate-400">
        <span>Accident Hotspots Crossed: {route.accidentZoneCrossings}</span>
        <span>Police/Medical: ~{route.emergencyProximityKm} km</span>
      </div>
    </div>
  );
};
