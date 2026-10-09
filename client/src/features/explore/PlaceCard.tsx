import React from 'react';
import { Star, Bookmark, Scale, Clock, Accessibility, MapPin } from 'lucide-react';
import { Place } from '../../../../shared/types';
import { useAppStore } from '../../store/useAppStore';
import { ScoreRing } from '../../components/ui/ScoreRing';
import { ProvenanceChip } from '../../components/ui/ProvenanceChip';

interface Props {
  place: Place;
}

export const PlaceCard: React.FC<Props> = ({ place }) => {
  const {
    selectedPlace,
    setSelectedPlace,
    savedPlaces,
    toggleSavePlace,
    compareList,
    addToCompare,
    setFlyTo,
  } = useAppStore();

  const isSelected = selectedPlace?.id === place.id;
  const isSaved = savedPlaces.some((p) => p.id === place.id);
  const isCompared = compareList.some((p) => p.id === place.id);

  const priceSymbol = place.priceTier === 1 ? '₹' : place.priceTier === 2 ? '₹₹' : '₹₹₹';
  const priceColor = place.priceTier === 1 ? 'text-emerald-400' : place.priceTier === 2 ? 'text-amber-400' : 'text-purple-400';

  const handleClick = () => {
    setSelectedPlace(place);
    setFlyTo([place.lat, place.lng], 15);
  };

  return (
    <div
      onClick={handleClick}
      className={`group relative p-3.5 rounded-2xl border transition-all cursor-pointer ${
        isSelected
          ? 'bg-white/10 border-teal-400/60 shadow-lg shadow-teal-500/10'
          : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-white/20'
      }`}
    >
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400">
              {place.category}
            </span>
            <ProvenanceChip source={place.source} />
          </div>

          <h3 className="text-sm font-bold text-white group-hover:text-teal-300 transition-colors truncate">
            {place.name}
          </h3>

          <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-300">
            <span className="flex items-center gap-1 text-amber-400 font-semibold">
              <Star className="w-3.5 h-3.5 fill-current" />
              {place.rating}
            </span>
            <span className="text-slate-500">•</span>
            <span className={`font-mono font-bold ${priceColor}`}>
              {priceSymbol}
            </span>
            {place.wheelchair === 'yes' && (
              <>
                <span className="text-slate-500">•</span>
                <span title="Wheelchair accessible" className="text-emerald-400">
                  <Accessibility className="w-3.5 h-3.5" />
                </span>
              </>
            )}
          </div>
        </div>

        {/* CityScore Ring */}
        {place.scores && (
          <div className="flex-shrink-0" title={`CityScore: ${place.scores.compositeScore}/100`}>
            <ScoreRing score={place.scores.compositeScore} size={42} strokeWidth={3.5} />
          </div>
        )}
      </div>

      {/* Opening Hours & Actions */}
      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-white/5 text-[11px] text-slate-400">
        <div className="flex items-center gap-1 truncate">
          <Clock className="w-3 h-3 text-slate-500" />
          <span className="truncate">{place.openingHours || 'Open standard hours'}</span>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleSavePlace(place);
            }}
            title={isSaved ? 'Remove from saved' : 'Save place'}
            className={`p-1.5 rounded-lg border transition-all ${
              isSaved
                ? 'bg-pink-500/20 border-pink-500/40 text-pink-300'
                : 'border-white/10 hover:bg-white/10 text-slate-400'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              addToCompare(place);
            }}
            title="Add to Compare view"
            disabled={isCompared}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-semibold transition-all ${
              isCompared
                ? 'bg-purple-500/20 border-purple-500/40 text-purple-300 opacity-60'
                : 'border-white/10 hover:bg-white/10 text-slate-300'
            }`}
          >
            <Scale className="w-3 h-3" />
            <span>{isCompared ? 'Added' : 'Compare'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
