import React, { useState } from 'react';
import { BarChart3, CloudSun, TrendingUp, Activity } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { GlassPanel } from '../../components/ui/GlassPanel';
import { WeatherWidget } from './WeatherWidget';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { SocialPulseView } from './SocialPulseView';

export const InsightsPanel: React.FC = () => {
  const { activeCity } = useAppStore();
  const [tab, setTab] = useState<'weather' | 'analytics' | 'social'>('weather');

  return (
    <GlassPanel
      title="Smart City Insights"
      subtitle={`Environmental, Analytics & Social Pulse for ${activeCity.name}`}
      icon={<BarChart3 className="w-5 h-5 text-blue-400" />}
      width="w-full sm:w-[410px]"
    >
      {/* Sub Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.04] border border-white/5 select-none">
        <button
          onClick={() => setTab('weather')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            tab === 'weather'
              ? 'bg-blue-500 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <CloudSun className="w-3.5 h-3.5" />
          <span>Weather & AQI</span>
        </button>

        <button
          onClick={() => setTab('analytics')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            tab === 'analytics'
              ? 'bg-blue-500 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Analytics</span>
        </button>

        <button
          onClick={() => setTab('social')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            tab === 'social'
              ? 'bg-blue-500 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Social Pulse</span>
        </button>
      </div>

      {/* Tab Panels */}
      {tab === 'weather' && <WeatherWidget />}
      {tab === 'analytics' && <AnalyticsDashboard />}
      {tab === 'social' && <SocialPulseView />}
    </GlassPanel>
  );
};
