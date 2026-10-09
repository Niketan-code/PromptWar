import React, { useState, useEffect } from 'react';
import { Shield, Navigation, Moon, Siren, ArrowUpDown, Sparkles, Loader2 } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { getSafeRoutes, getEmergencyFacilities } from '../../lib/api';
import { SafeRouteCard } from './SafeRouteCard';
import { GlassPanel } from '../../components/ui/GlassPanel';

export const SafetyPanel: React.FC = () => {
  const {
    activeCity,
    nightMode,
    toggleNightMode,
    safeRoutes,
    setSafeRoutes,
    setEmergencyDrawerOpen,
    setEmergencyFacilities,
    layers,
    toggleLayer,
  } = useAppStore();

  const [originName, setOriginName] = useState('Central Railway Station');
  const [destName, setDestName] = useState('University North Campus');
  const [loading, setLoading] = useState(false);

  // Compute preset coordinates offset from city center
  const getCoords = () => {
    return {
      fromLat: activeCity.center.lat + 0.008,
      fromLng: activeCity.center.lng - 0.005,
      toLat: activeCity.center.lat - 0.015,
      toLng: activeCity.center.lng + 0.018,
    };
  };

  const handleCalculateRoutes = async () => {
    setLoading(true);
    const coords = getCoords();
    try {
      const routes = await getSafeRoutes({
        city: activeCity.id,
        fromLat: coords.fromLat,
        fromLng: coords.fromLng,
        toLat: coords.toLat,
        toLng: coords.toLng,
        isNight: nightMode,
      });
      setSafeRoutes(routes);

      // Auto enable risk heatmap if not already visible
      if (!layers.heatmap) toggleLayer('heatmap');

      // Fetch emergency facilities
      const facs = await getEmergencyFacilities(activeCity.id, coords.fromLat, coords.fromLng);
      setEmergencyFacilities(facs);
    } catch (err) {
      console.error('Safe route calculation error', err);
    } finally {
      setLoading(false);
    }
  };

  // Re-run calculation if nightMode changes and routes exist
  useEffect(() => {
    if (safeRoutes.length > 0) {
      handleCalculateRoutes();
    }
  }, [nightMode, activeCity]);

  return (
    <GlassPanel
      title="Safety & Security"
      subtitle={`Risk Heatmaps & Safe Routing in ${activeCity.name}`}
      icon={<Shield className="w-5 h-5 text-red-400" />}
      width="w-full sm:w-[390px]"
    >
      {/* Route Inputs Card */}
      <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Safe Navigation Routing
          </span>
          <button
            onClick={() => {
              const temp = originName;
              setOriginName(destName);
              setDestName(temp);
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Swap Origin & Destination"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2 p-2 rounded-xl bg-black/40 border border-white/10">
            <span className="w-5 h-5 rounded-full bg-teal-400 text-slate-950 font-bold flex items-center justify-center text-[10px]">
              A
            </span>
            <input
              type="text"
              value={originName}
              onChange={(e) => setOriginName(e.target.value)}
              className="bg-transparent text-white focus:outline-none flex-1 truncate"
            />
          </div>

          <div className="flex items-center gap-2 p-2 rounded-xl bg-black/40 border border-white/10">
            <span className="w-5 h-5 rounded-full bg-rose-500 text-white font-bold flex items-center justify-center text-[10px]">
              B
            </span>
            <input
              type="text"
              value={destName}
              onChange={(e) => setDestName(e.target.value)}
              className="bg-transparent text-white focus:outline-none flex-1 truncate"
            />
          </div>
        </div>

        {/* Night Mode & Emergency SOS actions */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={toggleNightMode}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border text-xs font-bold transition-all ${
              nightMode
                ? 'bg-indigo-600/30 border-indigo-400/60 text-indigo-200'
                : 'border-white/10 hover:bg-white/10 text-slate-300'
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            <span>Night Mode: {nightMode ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={() => setEmergencyDrawerOpen(true)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300 text-xs font-bold transition-all"
          >
            <Siren className="w-3.5 h-3.5 text-red-400" />
            <span>Emergency SOS</span>
          </button>
        </div>

        <button
          onClick={handleCalculateRoutes}
          disabled={loading}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 transition-all disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Navigation className="w-4 h-4 fill-current" />
          )}
          <span>{loading ? 'Evaluating Safe Corridors...' : 'Compare Fastest vs Safest'}</span>
        </button>
      </div>

      {/* Night mode active banner */}
      {nightMode && (
        <div className="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-[11px] text-indigo-200 flex items-center gap-2 animate-fadeIn">
          <Moon className="w-4 h-4 text-indigo-400 flex-shrink-0" />
          <span>
            Night risk weighting active: Low-light corridors penalized by 1.8x to 2.2x.
          </span>
        </div>
      )}

      {/* Routes List */}
      <div className="space-y-3">
        {safeRoutes.length > 0 && (
          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span>{safeRoutes.length} Route Alternatives</span>
            <span>OSRM + Risk Grid</span>
          </div>
        )}

        {safeRoutes.map((route) => (
          <SafeRouteCard key={route.id} route={route} />
        ))}

        {safeRoutes.length === 0 && !loading && (
          <div className="text-center py-8 text-slate-400 text-xs">
            Enter endpoints and click &quot;Compare Fastest vs Safest&quot; to inspect alternative routes.
          </div>
        )}
      </div>
    </GlassPanel>
  );
};
