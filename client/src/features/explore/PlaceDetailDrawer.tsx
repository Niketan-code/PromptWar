import React from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Star,
  Bookmark,
  Scale,
  Clock,
  Accessibility,
  MapPin,
  Navigation,
  Shield,
  Sparkles,
  DollarSign,
  HeartHandshake,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { ScoreRing } from '../../components/ui/ScoreRing';
import { ProvenanceChip } from '../../components/ui/ProvenanceChip';

export const PlaceDetailDrawer: React.FC = () => {
  const {
    selectedPlace,
    setSelectedPlace,
    savedPlaces,
    toggleSavePlace,
    compareList,
    addToCompare,
    setActivePillar,
  } = useAppStore();

  if (!selectedPlace) return null;

  const isSaved = savedPlaces.some((p) => p.id === selectedPlace.id);
  const isCompared = compareList.some((p) => p.id === selectedPlace.id);
  const scores = selectedPlace.scores;

  const priceSymbol = selectedPlace.priceTier === 1 ? '₹ (Budget)' : selectedPlace.priceTier === 2 ? '₹₹ (Moderate)' : '₹₹₹ (Premium)';

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="fixed top-14 right-0 bottom-0 w-full sm:w-[420px] glass-panel border-l border-white/10 z-40 flex flex-col overflow-hidden shadow-2xl"
    >
      {/* Hero Visual Placeholder */}
      <div className="relative h-44 w-full bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 overflow-hidden flex-shrink-0">
        <div className="absolute inset-0 bg-[radial-gradient(#2dd4bf_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#141A2D] via-transparent to-black/30" />

        <button
          onClick={() => setSelectedPlace(null)}
          className="absolute top-3 right-3 p-2 rounded-xl bg-black/50 text-white/80 hover:text-white hover:bg-black/80 transition-colors z-10"
          aria-label="Close details"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                {selectedPlace.category}
              </span>
              <ProvenanceChip source={selectedPlace.source} />
            </div>
            <h2 className="text-lg font-bold text-white font-heading truncate drop-shadow-md">
              {selectedPlace.name}
            </h2>
          </div>

          {scores && (
            <div className="flex-shrink-0 bg-black/60 p-1.5 rounded-2xl border border-white/10 backdrop-blur-md">
              <ScoreRing score={scores.compositeScore} size={46} strokeWidth={4} />
            </div>
          )}
        </div>
      </div>

      {/* Content scroll */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Quick Highlights Bar */}
        <div className="grid grid-cols-3 gap-2 text-center p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
          <div>
            <span className="text-[10px] text-slate-400 block">Rating</span>
            <span className="text-xs font-bold text-amber-400 flex items-center justify-center gap-1 mt-0.5">
              <Star className="w-3.5 h-3.5 fill-current" />
              {selectedPlace.rating} / 5.0
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">Pricing</span>
            <span className="text-xs font-bold text-teal-300 mt-0.5 block font-mono">
              {priceSymbol}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">Wheelchair</span>
            <span className="text-xs font-bold text-emerald-400 mt-0.5 flex items-center justify-center gap-1">
              <Accessibility className="w-3.5 h-3.5" />
              {selectedPlace.wheelchair === 'yes' ? 'Accessible' : 'Partial'}
            </span>
          </div>
        </div>

        {/* CityScore Breakdown */}
        {scores && (
          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-2.5">
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              CityScore Breakdown ({scores.compositeScore}/100)
            </h3>

            <div className="space-y-2 text-xs">
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span className="flex items-center gap-1 text-[11px]">
                    <Shield className="w-3 h-3 text-red-400" /> Safety
                  </span>
                  <span className="font-bold">{scores.safety}%</span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-400 rounded-full transition-all duration-500"
                    style={{ width: `${scores.safety}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span className="flex items-center gap-1 text-[11px]">
                    <HeartHandshake className="w-3 h-3 text-emerald-400" /> Cleanliness
                  </span>
                  <span className="font-bold">{scores.cleanliness}%</span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${scores.cleanliness}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span className="flex items-center gap-1 text-[11px]">
                    <DollarSign className="w-3 h-3 text-teal-400" /> Affordability
                  </span>
                  <span className="font-bold">{scores.affordability}%</span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-400 rounded-full transition-all duration-500"
                    style={{ width: `${scores.affordability}%` }}
                  />
                </div>
              </div>
            </div>

            {scores.reasonText && (
              <p className="text-[11px] text-slate-300 bg-white/[0.04] p-2 rounded-lg border border-white/5 leading-relaxed">
                💡 {scores.reasonText}
              </p>
            )}
          </div>
        )}

        {/* Info list */}
        <div className="space-y-2 text-xs text-slate-300">
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
            <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <span>Hours: {selectedPlace.openingHours || 'Standard operational hours'}</span>
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
            <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <span className="truncate">Coordinates: {selectedPlace.lat.toFixed(4)}, {selectedPlace.lng.toFixed(4)}</span>
          </div>
        </div>
      </div>

      {/* Drawer Action Footer */}
      <div className="p-3.5 border-t border-white/10 bg-white/[0.02] flex items-center gap-2">
        <button
          onClick={() => toggleSavePlace(selectedPlace)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-xs font-bold transition-all ${
            isSaved
              ? 'bg-pink-500/20 border-pink-500/40 text-pink-300'
              : 'border-white/10 hover:bg-white/10 text-white'
          }`}
        >
          <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
          <span>{isSaved ? 'Saved' : 'Save Place'}</span>
        </button>

        <button
          onClick={() => addToCompare(selectedPlace)}
          disabled={isCompared}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-xs font-bold transition-all ${
            isCompared
              ? 'bg-purple-500/20 border-purple-500/40 text-purple-300 opacity-60'
              : 'border-white/10 hover:bg-white/10 text-white'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>{isCompared ? 'In Compare' : 'Add to Compare'}</span>
        </button>

        <button
          onClick={() => setActivePillar('safety')}
          className="p-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 text-slate-950 font-bold hover:scale-105 transition-transform"
          title="Safe Route Directions"
        >
          <Navigation className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};
