import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Compass,
  Landmark,
  Shield,
  Scale,
  BarChart3,
  Moon,
  Play,
  MapPin,
  X,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export const CommandPalette: React.FC = () => {
  const {
    commandPaletteOpen,
    setCommandPaletteOpen,
    setActivePillar,
    toggleNightMode,
    setDemoMode,
    supportedCities,
    setActiveCity,
  } = useAppStore();

  const [query, setQuery] = useState('');

  // Keyboard shortcut listener for Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
      if (e.key === 'Escape') {
        setCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commandPaletteOpen]);

  if (!commandPaletteOpen) return null;

  const actions = [
    {
      label: 'Explore Attractions & Food',
      icon: <Compass className="w-4 h-4 text-teal-400" />,
      run: () => setActivePillar('explore'),
    },
    {
      label: 'Heritage Sites & Story Cards',
      icon: <Landmark className="w-4 h-4 text-amber-400" />,
      run: () => setActivePillar('heritage'),
    },
    {
      label: 'Safety Corridors & Safe Route',
      icon: <Shield className="w-4 h-4 text-red-400" />,
      run: () => setActivePillar('safety'),
    },
    {
      label: 'Best vs Worst Leaderboard & Compare',
      icon: <Scale className="w-4 h-4 text-purple-400" />,
      run: () => setActivePillar('compare'),
    },
    {
      label: 'Smart City Insights & Live Weather',
      icon: <BarChart3 className="w-4 h-4 text-blue-400" />,
      run: () => setActivePillar('insights'),
    },
    {
      label: 'Toggle Night Safety Mode',
      icon: <Moon className="w-4 h-4 text-indigo-400" />,
      run: () => toggleNightMode(),
    },
    {
      label: 'Start 3-Minute Demo Walkthrough',
      icon: <Play className="w-4 h-4 text-emerald-400" />,
      run: () => setDemoMode(true),
    },
  ];

  const filteredActions = actions.filter((a) =>
    a.label.toLowerCase().includes(query.toLowerCase())
  );

  const filteredCities = supportedCities.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase()) ||
    c.state.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        className="glass-panel w-full max-w-lg rounded-3xl border border-white/20 overflow-hidden shadow-2xl relative"
      >
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/10 bg-white/[0.02]">
          <Search className="w-5 h-5 text-teal-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, feature, or city..."
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none"
            autoFocus
          />
          <kbd className="px-2 py-0.5 rounded bg-white/10 text-[10px] font-mono text-slate-400">
            ESC
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2 space-y-1 text-xs">
          {/* Actions */}
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1 block">
            Navigation & Actions
          </span>
          {filteredActions.map((act, idx) => (
            <button
              key={idx}
              onClick={() => {
                act.run();
                setCommandPaletteOpen(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-slate-200 hover:bg-teal-500/20 hover:text-white transition-colors"
            >
              {act.icon}
              <span className="font-medium">{act.label}</span>
            </button>
          ))}

          {/* Switch City Quick Actions */}
          {filteredCities.length > 0 && (
            <div className="border-t border-white/10 pt-2 mt-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1 block">
                Jump to Indian City
              </span>
              {filteredCities.slice(0, 6).map((city) => (
                <button
                  key={city.id}
                  onClick={() => {
                    setActiveCity(city);
                    setCommandPaletteOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-slate-200 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-teal-400" />
                    <span>{city.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">{city.state}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
