import React from 'react';
import { Sparkles, Radio, Database, Cpu } from 'lucide-react';
import { ProvenanceSource } from '../../../../shared/types';

interface Props {
  source: ProvenanceSource;
  className?: string;
}

export const ProvenanceChip: React.FC<Props> = ({ source, className = '' }) => {
  if (source === 'real') {
    return (
      <span
        title="Verified Live Data (Overpass / Open-Meteo / User)"
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        Live
      </span>
    );
  }

  if (source === 'seed') {
    return (
      <span
        title="Demonstration dataset clustered around realistic urban hotspots"
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-500/10 text-slate-300 border border-dashed border-slate-400/30 ${className}`}
      >
        <Database className="w-3 h-3 text-slate-400" />
        Demo data
      </span>
    );
  }

  if (source === 'simulated') {
    return (
      <span
        title="Simulated layer driven by time-of-day traffic models"
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/30 ${className}`}
      >
        <Cpu className="w-3 h-3 text-amber-400" />
        Simulated
      </span>
    );
  }

  // AI-generated
  return (
    <span
      title="AI-generated, verify locally"
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-purple-500/10 text-purple-300 border border-purple-500/30 ${className}`}
    >
      <Sparkles className="w-3 h-3 text-purple-400" />
      AI-generated, verify locally
    </span>
  );
};
