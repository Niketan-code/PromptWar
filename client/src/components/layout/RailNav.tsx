import React from 'react';
import { Compass, Landmark, Shield, Scale, BarChart3, PlusCircle } from 'lucide-react';
import { useAppStore, Pillar } from '../../store/useAppStore';

export const RailNav: React.FC = () => {
  const { activePillar, setActivePillar, setReportModalOpen } = useAppStore();

  const navItems: Array<{
    pillar: Pillar;
    label: string;
    icon: React.ReactNode;
    color: string;
    activeBorder: string;
  }> = [
    {
      pillar: 'explore',
      label: 'Explore',
      icon: <Compass className="w-5 h-5" />,
      color: 'text-teal-400 group-hover:text-teal-300',
      activeBorder: 'border-teal-400 text-teal-400 bg-teal-500/10',
    },
    {
      pillar: 'heritage',
      label: 'Heritage',
      icon: <Landmark className="w-5 h-5" />,
      color: 'text-amber-400 group-hover:text-amber-300',
      activeBorder: 'border-amber-400 text-amber-400 bg-amber-500/10',
    },
    {
      pillar: 'safety',
      label: 'Safety',
      icon: <Shield className="w-5 h-5" />,
      color: 'text-red-400 group-hover:text-red-300',
      activeBorder: 'border-red-400 text-red-400 bg-red-500/10',
    },
    {
      pillar: 'compare',
      label: 'Compare',
      icon: <Scale className="w-5 h-5" />,
      color: 'text-purple-400 group-hover:text-purple-300',
      activeBorder: 'border-purple-400 text-purple-400 bg-purple-500/10',
    },
    {
      pillar: 'insights',
      label: 'Insights',
      icon: <BarChart3 className="w-5 h-5" />,
      color: 'text-blue-400 group-hover:text-blue-300',
      activeBorder: 'border-blue-400 text-blue-400 bg-blue-500/10',
    },
  ];

  return (
    <nav
      aria-label="Pillar Navigation"
      className="hidden md:flex flex-col items-center justify-between w-16 py-4 glass-panel border-r border-white/10 z-20 h-full select-none"
    >
      {/* Brand Icon */}
      <div className="flex flex-col items-center gap-1">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/20 text-slate-950 font-black text-lg">
          CP
        </div>
        <span className="text-[9px] font-bold tracking-widest text-teal-400 uppercase font-heading">
          PULSE
        </span>
      </div>

      {/* Nav Buttons */}
      <div className="flex flex-col items-center gap-3 my-auto">
        {navItems.map((item) => {
          const isActive = activePillar === item.pillar;
          return (
            <button
              key={item.pillar}
              onClick={() => setActivePillar(item.pillar)}
              title={item.label}
              className={`group relative flex flex-col items-center justify-center w-12 h-12 rounded-xl transition-all duration-200 ${
                isActive
                  ? `${item.activeBorder} shadow-lg shadow-black/40`
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {item.icon}
              <span className="text-[9px] font-medium tracking-tight mt-0.5">
                {item.label}
              </span>
              {isActive && (
                <span className="absolute -left-1 top-3 bottom-3 w-1 rounded-r-full bg-current" />
              )}
            </button>
          );
        })}
      </div>

      {/* Citizen Report Trigger Button */}
      <div className="flex flex-col items-center">
        <button
          onClick={() => setReportModalOpen(true)}
          title="Submit Citizen Report"
          className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 text-white shadow-lg shadow-pink-500/25 hover:scale-105 active:scale-95 transition-transform"
        >
          <PlusCircle className="w-5 h-5" />
          <span className="text-[9px] font-bold mt-0.5">Report</span>
        </button>
      </div>
    </nav>
  );
};
