import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Search,
  CloudSun,
  Moon,
  Sun,
  ShieldAlert,
  Play,
  Command,
  ChevronDown,
  X,
  Loader2,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { searchCities, getWeather } from '../../lib/api';
import { CityConfig } from '../../../../shared/types';

export const Header: React.FC = () => {
  const {
    activeCity,
    setActiveCity,
    supportedCities,
    theme,
    toggleTheme,
    nightMode,
    toggleNightMode,
    weather,
    setWeather,
    setDemoMode,
    setCommandPaletteOpen,
  } = useAppStore();

  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CityConfig[]>([]);
  const [searching, setSearching] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch initial weather for active city
  useEffect(() => {
    getWeather(activeCity.id, activeCity.center.lat, activeCity.center.lng)
      .then(setWeather)
      .catch(console.error);
  }, [activeCity]);

  // Click outside listener for dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setCityDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search input debounce for Indian cities
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchCities(searchQuery);
        setSearchResults(results);
      } catch (err) {
        console.error('City search failed', err);
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectCity = (city: CityConfig) => {
    setActiveCity(city);
    setCityDropdownOpen(false);
    setSearchQuery('');
  };

  return (
    <header className="relative z-30 flex items-center justify-between px-4 py-2.5 glass-panel border-b border-white/10 select-none">
      {/* Left: City Switcher & Indian City Search */}
      <div className="flex items-center gap-3" ref={dropdownRef}>
        <div className="relative">
          <button
            onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl glass-pill hover:bg-white/10 border border-white/10 transition-all text-sm font-semibold text-white shadow-sm"
          >
            <MapPin className="w-4 h-4 text-teal-400" />
            <span>{activeCity.name}</span>
            <span className="text-[11px] px-1.5 py-0.2 rounded bg-teal-500/20 text-teal-300 font-normal">
              {activeCity.state}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
          </button>

          {/* City Selection Dropdown */}
          {cityDropdownOpen && (
            <div className="absolute top-full left-0 mt-2 w-80 glass-panel rounded-2xl shadow-2xl border border-white/15 p-3 z-50 animate-fadeIn">
              <div className="relative mb-2.5">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search ANY city in India..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-7 py-1.5 bg-black/40 border border-white/15 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-teal-400"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {searching && (
                <div className="flex items-center justify-center py-4 text-xs text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin mr-2 text-teal-400" />
                  Searching cities across India...
                </div>
              )}

              {/* Search Results */}
              {searchResults.length > 0 && !searching && (
                <div className="max-h-48 overflow-y-auto mb-2 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                    Search Results
                  </span>
                  {searchResults.map((city) => (
                    <button
                      key={city.id}
                      onClick={() => handleSelectCity(city)}
                      className="w-full flex items-center justify-between p-2 rounded-lg text-left text-xs text-white hover:bg-teal-500/20 transition-colors"
                    >
                      <span className="font-medium">{city.name}</span>
                      <span className="text-[10px] text-slate-400">{city.state}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Curated Popular Indian Cities */}
              <div className="border-t border-white/10 pt-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1 mb-1 block">
                  Popular Indian Hubs
                </span>
                <div className="grid grid-cols-2 gap-1 max-h-48 overflow-y-auto">
                  {supportedCities.map((city) => (
                    <button
                      key={city.id}
                      onClick={() => handleSelectCity(city)}
                      className={`flex items-center justify-between p-2 rounded-lg text-left text-xs transition-colors ${
                        activeCity.id === city.id
                          ? 'bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30'
                          : 'text-slate-300 hover:bg-white/5'
                      }`}
                    >
                      <span className="truncate">{city.name}</span>
                      {city.id === 'pune' && (
                        <span className="text-[9px] px-1 rounded bg-teal-500/30 text-teal-300">
                          Demo
                        </span>
                      )}
                      {city.id === 'mumbai' && (
                        <span className="text-[9px] px-1 rounded bg-amber-500/30 text-amber-300">
                          Demo
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Command Palette Trigger */}
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl glass-pill hover:bg-white/10 border border-white/10 text-xs text-slate-300 transition-all"
        >
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span>Quick Find...</span>
          <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-mono text-slate-400">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5">
        {/* Weather Chip */}
        {weather && (
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-xl glass-pill border border-white/10 text-xs">
            <CloudSun className="w-4 h-4 text-amber-400" />
            <span className="font-semibold text-white">{weather.current.temp}°C</span>
            <span className="text-slate-400">|</span>
            <span className="text-[11px] text-slate-300">{weather.current.weatherText}</span>
            <span
              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                weather.current.aqi > 150
                  ? 'bg-red-500/20 text-red-300'
                  : weather.current.aqi > 100
                  ? 'bg-amber-500/20 text-amber-300'
                  : 'bg-emerald-500/20 text-emerald-300'
              }`}
            >
              AQI {weather.current.aqi}
            </span>
          </div>
        )}

        {/* Night Mode Safety Risk Toggle */}
        <button
          onClick={toggleNightMode}
          title={nightMode ? 'Night Mode Active: Risk weights amplified' : 'Toggle Night Safety Mode'}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
            nightMode
              ? 'bg-indigo-600/30 border-indigo-400/50 text-indigo-300 shadow-lg shadow-indigo-500/20'
              : 'glass-pill border-white/10 text-slate-300 hover:text-white'
          }`}
        >
          <Moon className={`w-3.5 h-3.5 ${nightMode ? 'text-indigo-400' : 'text-slate-400'}`} />
          <span className="hidden sm:inline">Night Mode</span>
          {nightMode && (
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
          )}
        </button>

        {/* Light/Dark Theme Toggle */}
        <button
          onClick={toggleTheme}
          title="Toggle Theme"
          className="p-2 rounded-xl glass-pill hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
        </button>

        {/* 3-Minute Demo Mode Trigger Button */}
        <button
          onClick={() => setDemoMode(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-bold text-xs shadow-lg shadow-teal-500/20 hover:scale-105 active:scale-95 transition-all"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Demo Mode</span>
        </button>
      </div>
    </header>
  );
};
