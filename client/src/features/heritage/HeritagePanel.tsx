import React, { useEffect, useState } from 'react';
import { Landmark, Footprints, Clock, MapPin, Sparkles, Navigation, RotateCcw, Loader2 } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { getHeritagePlaces, generateHeritageTrail, getStoryCard } from '../../lib/api';
import { GlassPanel } from '../../components/ui/GlassPanel';
import { ProvenanceChip } from '../../components/ui/ProvenanceChip';

export const HeritagePanel: React.FC = () => {
  const {
    activeCity,
    heritagePlaces,
    setHeritagePlaces,
    heritageTrail,
    setHeritageTrail,
    setActiveStoryCard,
    setFlyTo,
    layers,
    toggleLayer,
  } = useAppStore();

  const [trailDuration, setTrailDuration] = useState<number>(120);
  const [generatingTrail, setGeneratingTrail] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    getHeritagePlaces(activeCity.id)
      .then((places) => {
        setHeritagePlaces(places);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch heritage places', err);
        setLoading(false);
      });
  }, [activeCity]);

  const handleGenerateTrail = async () => {
    setGeneratingTrail(true);
    try {
      const trail = await generateHeritageTrail({
        city: activeCity.id,
        durationMinutes: trailDuration,
      });
      setHeritageTrail(trail);
      // Ensure heritage layer is turned on so trail displays
      if (!layers.heritage) toggleLayer('heritage');
    } catch (err) {
      console.error('Failed to generate trail', err);
    } finally {
      setGeneratingTrail(false);
    }
  };

  const handleOpenStory = async (placeId: string, name: string) => {
    const card = await getStoryCard(placeId, name, activeCity.id);
    setActiveStoryCard(card);
  };

  return (
    <GlassPanel
      title={`Heritage & Culture`}
      subtitle={`Historic Monuments & Walking Trails in ${activeCity.name}`}
      icon={<Landmark className="w-5 h-5 text-amber-400" />}
      width="w-full sm:w-[390px]"
    >
      {/* Trail Generator Card */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5 uppercase tracking-wider">
            <Footprints className="w-4 h-4 text-amber-400" />
            AI Heritage Trail Generator
          </span>
          {heritageTrail && (
            <button
              onClick={() => setHeritageTrail(null)}
              className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          )}
        </div>

        <p className="text-[11px] text-slate-300 leading-relaxed">
          Select your available time to generate an optimized walking circuit through key landmarks with OSRM foot routing:
        </p>

        {/* Duration selection chips */}
        <div className="grid grid-cols-3 gap-1.5">
          {[
            { mins: 60, label: '1 Hour' },
            { mins: 120, label: '2 Hours' },
            { mins: 240, label: 'Half-Day' },
          ].map((d) => (
            <button
              key={d.mins}
              onClick={() => setTrailDuration(d.mins)}
              className={`py-2 px-1 rounded-xl text-xs font-bold transition-all text-center ${
                trailDuration === d.mins
                  ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        <button
          onClick={handleGenerateTrail}
          disabled={generatingTrail}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
        >
          {generatingTrail ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4 fill-current" />
          )}
          <span>{generatingTrail ? 'Building Trail...' : 'Generate Walking Circuit'}</span>
        </button>

        {/* Active Trail Summary Banner */}
        {heritageTrail && (
          <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-[11px] text-amber-200 space-y-1">
            <div className="flex justify-between font-bold">
              <span>{heritageTrail.stops.length} Ordered Stops</span>
              <span>{heritageTrail.totalDistanceKm} km total</span>
            </div>
            <p className="text-slate-300">
              Estimated walk duration: ~{heritageTrail.estimatedWalkMinutes} minutes. Follow the numbered markers on the map.
            </p>
          </div>
        )}
      </div>

      {/* Heritage Landmarks List */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
          <span>{heritagePlaces.length} Historical Sites</span>
          <span>OSM historic=*</span>
        </div>

        {loading ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-amber-400" />
            Loading heritage sites...
          </div>
        ) : (
          heritagePlaces.map((place) => (
            <div
              key={place.id}
              onClick={() => setFlyTo([place.lat, place.lng], 15)}
              className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] hover:border-amber-400/40 transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                      {place.historicType || 'Monument'}
                    </span>
                    <ProvenanceChip source={place.source} />
                  </div>
                  <h4 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                    {place.name}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                    {place.tags?.description || 'Prominent cultural landmark with historical heritage recognition.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5">
                <span className="text-[10px] text-slate-400">
                  Rating: ⭐ {place.rating}
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenStory(place.id, place.name);
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-[11px] font-bold transition-all"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Story Card</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </GlassPanel>
  );
};
