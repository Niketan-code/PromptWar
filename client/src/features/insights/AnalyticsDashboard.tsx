import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { BarChart3, CheckCircle2, Clock, Flame, PieChart } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { getAnalyticsSummary } from '../../lib/api';
import { AnalyticsSummary } from '../../../../shared/types';
import { ProvenanceChip } from '../../components/ui/ProvenanceChip';

export const AnalyticsDashboard: React.FC = () => {
  const { activeCity } = useAppStore();
  const [data, setData] = useState<AnalyticsSummary | null>(null);

  useEffect(() => {
    getAnalyticsSummary(activeCity.id)
      .then(setData)
      .catch(console.error);
  }, [activeCity]);

  if (!data) return null;

  const categoryBarData = Object.entries(data.reportsByCategory).map(([key, val]) => ({
    category: key,
    count: val,
  }));

  return (
    <div className="space-y-4">
      {/* 3 Metric Summary Cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-center">
          <span className="text-[10px] text-slate-400 block">Total Reports</span>
          <span className="text-base font-black text-white font-mono mt-0.5 block">
            {data.totalReports}
          </span>
        </div>
        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-center">
          <span className="text-[10px] text-slate-400 block">Verified Ratio</span>
          <span className="text-base font-black text-emerald-400 font-mono mt-0.5 block">
            {data.verifiedRatioPercent}%
          </span>
        </div>
        <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 text-center">
          <span className="text-[10px] text-slate-400 block">Avg Resolution</span>
          <span className="text-base font-black text-teal-300 font-mono mt-0.5 block">
            {data.avgResolutionDays}d
          </span>
        </div>
      </div>

      {/* Bar Chart: Reports by Category */}
      <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
        <span className="text-[11px] font-bold text-white uppercase tracking-wider block">
          Citizen Reports by Category
        </span>
        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryBarData} margin={{ top: 10, right: 10, bottom: 20, left: -20 }}>
              <XAxis dataKey="category" tick={{ fill: '#94A3B8', fontSize: 10 }} interval={0} angle={-30} textAnchor="end" />
              <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#141A2D',
                  borderColor: 'rgba(255, 255, 255, 0.15)',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '11px',
                }}
              />
              <Bar dataKey="count" fill="#38BDF8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 7-Day Trend Chart */}
      <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
        <span className="text-[11px] font-bold text-white uppercase tracking-wider block">
          7-Day Incident Trend Velocity
        </span>
        <div className="h-36 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.dailyTrends} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
              <XAxis dataKey="date" tick={{ fill: '#94A3B8', fontSize: 10 }} />
              <YAxis tick={{ fill: '#94A3B8', fontSize: 10 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#141A2D',
                  borderColor: 'rgba(255, 255, 255, 0.15)',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '11px',
                }}
              />
              <Line type="monotone" dataKey="count" stroke="#F43F5E" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Hotspots Ranking */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1 block">
          Top Incident Hotspots
        </span>
        {data.hotspotRankings.map((h, idx) => (
          <div
            key={idx}
            className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs"
          >
            <div className="flex items-center gap-2">
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              <span className="font-semibold text-white">{h.area}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 font-mono">{h.reportCount} incidents</span>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                  h.riskLevel === 'High' ? 'bg-red-500/20 text-red-300' : 'bg-amber-500/20 text-amber-300'
                }`}
              >
                {h.riskLevel}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
