import React from 'react';
import { CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react';
import { ReportStatus } from '../../../../shared/types';

interface Props {
  status: ReportStatus;
  credibility: number;
  className?: string;
}

export const CredibilityBadge: React.FC<Props> = ({ status, credibility, className = '' }) => {
  if (status === 'verified') {
    return (
      <span
        title={`Verified by community & AI consistency (${credibility}/100)`}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 ${className}`}
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        Verified ({credibility}%)
      </span>
    );
  }

  if (status === 'likely') {
    return (
      <span
        title={`Likely incident - awaiting further confirmations (${credibility}/100)`}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 ${className}`}
      >
        <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
        Likely ({credibility}%)
      </span>
    );
  }

  return (
    <span
      title={`Unverified citizen report (${credibility}/100)`}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-500/15 text-slate-300 border border-slate-500/30 ${className}`}
    >
      <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
      Unverified ({credibility}%)
    </span>
  );
};
