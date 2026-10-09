import React from 'react';
import { Compass, Landmark, Shield, Scale, BarChart3, Plus } from 'lucide-react';
import { useAppStore, Pillar } from '../../store/useAppStore';

export const BottomNav: React.FC = () => {
  const { activePillar, setActivePillar, setReportModalOpen } = useAppStore();

  const tabs: Array<{ pillar: Pillar; label: string; icon: React.ReactNode }> = [
    { pillar: 'explore', label: 'Explore', icon: <Compass className="w-5 h-5" /> },
    { pillar: 'heritage', label: 'Heritage', icon: <Landmark className="w-5 h-5" /> },
    { pillar: 'safety', label: 'Safety', icon: <Shield className="w-5 h-5" /> },
    { pillar: 'compare', label: 'Compare', icon: <Scale className="w-5 h-5" /> },
    { pillar: 'insights', label: 'Insights', icon: <BarChart3 className="w-5 h-5" /> },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass-panel border-t border-white/10 px-2 py-2 flex items-center justify-around">
      {tabs.slice(0, 2).map((t) => {
        const isActive = activePillar === t.pillar;
        return (
          <button
            key={t.pillar}
            onClick={() => setActivePillar(t.pillar)}
            className={`flex flex-col items-center gap-0.5 p-1 rounded-lg ${
              isActive ? 'text-teal-400 font-bold' : 'text-slate-400'
            }`}
          >
            {t.icon}
            <span className="text-[10px]">{t.label}</span>
          </button>
        );
      })}

      {/* Floating Center Report Button */}
      <button
        onClick={() => setReportModalOpen(true)}
        className="flex items-center justify-center w-11 h-11 -mt-4 rounded-full bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-xl shadow-pink-500/30"
        aria-label="Submit Citizen Report"
      >
        <Plus className="w-6 h-6" />
      </button>

      {tabs.slice(2).map((t) => {
        const isActive = activePillar === t.pillar;
        return (
          <button
            key={t.pillar}
            onClick={() => setActivePillar(t.pillar)}
            className={`flex flex-col items-center gap-0.5 p-1 rounded-lg ${
              isActive ? 'text-teal-400 font-bold' : 'text-slate-400'
            }`}
          >
            {t.icon}
            <span className="text-[10px]">{t.label}</span>
          </button>
        );
      })}
    </div>
  );
};
