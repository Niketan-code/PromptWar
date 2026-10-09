import React, { useEffect, useState } from 'react';
import { Compass, Filter, Utensils, Coffee, Landmark, Hotel, Banknote, Trees, Loader2 } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { getPlaces } from '../../lib/api';
import { PlaceCard } from './PlaceCard';
import { GlassPanel } from '../../components/ui/GlassPanel';
import { PoiCategory } from '../../../../shared/types';

export const ExplorePanel: React.FC = () => {
  const {
    activeCity,
    selectedCategory,
    setSelectedCategory,
    budgetFilter,
    setBudgetFilter,
    openNowFilter,
    setOpenNowFilter,
    places,
    setPlaces,
    loading,
    setLoading,
  } = useAppStore();

  const [error, setError] = useState<string | null>(null);

  const categories: Array<{ id: PoiCategory; label: string; icon: React.ReactNode }> = [
    { id: 'food', label: 'Food', icon: <Utensils className="w-3.5 h-3.5" /> },
    { id: 'attractions', label: 'Attractions', icon: <Landmark className="w-3.5 h-3.5" /> },
    { id: 'cafes', label: 'Cafes', icon: <Coffee className="w-3.5 h-3.5" /> },
    { id: 'budget', label: 'Budget Food', icon: <Banknote className="w-3.5 h-3.5" /> },
    { id: 'hotels', label: 'Hotels', icon: <Hotel className="w-3.5 h-3.5" /> },
    { id: 'parks', label: 'Parks', icon: <Trees className="w-3.5 h-3.5" /> },
  ];

  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setError(null);

    getPlaces({
      city: activeCity.id,
      category: selectedCategory,
      budget: budgetFilter,
      openNow: openNowFilter,
    })
      .then((data) => {
        if (!isCancelled) {
          setPlaces(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          setError('Failed to fetch places. Falling back to cached results.');
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [activeCity, selectedCategory, budgetFilter, openNowFilter]);

  return (
    <GlassPanel
      title={`Explore ${activeCity.name}`}
      subtitle="Verified POIs & Hospitality"
      icon={<Compass className="w-5 h-5 text-teal-400" />}
      width="w-full sm:w-[390px]"
    >
      {/* Category Chips Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar select-none">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                  : 'bg-white/[0.04] text-slate-300 hover:bg-white/10 border border-white/5'
              }`}
            >
              {cat.icon}
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filters: Budget & Open Now */}
      <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-xs">
        {/* Budget tier selector */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] uppercase font-bold text-slate-400 mr-1">Budget:</span>
          {[undefined, 1, 2, 3].map((tier) => (
            <button
              key={tier ?? 'all'}
              onClick={() => setBudgetFilter(tier as any)}
              className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-bold transition-all ${
                budgetFilter === tier
                  ? 'bg-teal-400 text-slate-950'
                  : 'bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              {tier === undefined ? 'All' : tier === 1 ? '₹' : tier === 2 ? '₹₹' : '₹₹₹'}
            </button>
          ))}
        </div>

        {/* Open Now toggle */}
        <button
          onClick={() => setOpenNowFilter(!openNowFilter)}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
            openNowFilter
              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
              : 'border-white/10 text-slate-400 hover:text-white'
          }`}
        >
          Open Now
        </button>
      </div>

      {/* Loading & Error States */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-teal-400 mb-2" />
          <span className="text-xs">Fetching verified POIs from Overpass & SQLite...</span>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-red-950/30 border border-red-500/30 text-xs text-red-200">
          {error}
        </div>
      )}

      {/* Places List */}
      {!loading && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span>Showing {places.length} places</span>
            <span>Sorted by CityScore</span>
          </div>

          {places.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              No venues found for the selected budget and filters.
            </div>
          ) : (
            places.map((place) => <PlaceCard key={place.id} place={place} />)
          )}
        </div>
      )}
    </GlassPanel>
  );
};
