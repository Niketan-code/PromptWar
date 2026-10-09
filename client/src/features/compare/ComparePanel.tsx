import React, { useState, useEffect } from 'react';
import { Scale, Trophy, Sliders, Sparkles, X, Star, CheckCircle, AlertOctagon, Loader2 } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { getLeaderboard, comparePlaces } from '../../lib/api';
import { RadarChartComp } from './RadarChartComp';
import { GlassPanel } from '../../components/ui/GlassPanel';
import { ScoreRing } from '../../components/ui/ScoreRing';
import { ProvenanceChip } from '../../components/ui/ProvenanceChip';
import { Place } from '../../../../shared/types';

export const ComparePanel: React.FC = () => {
  const {
    activeCity,
    scoreWeights,
    setScoreWeight,
    compareList,
    removeFromCompare,
    clearCompare,
    setFlyTo,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'leaderboard' | 'compare'>('leaderboard');
  const [top10, setTop10] = useState<Place[]>([]);
  const [bottom10, setBottom10] = useState<Place[]>([]);
  const [comparisonData, setComparisonData] = useState<{
    metricWinners: Record<string, { placeId: string; placeName: string; value: number }>;
    aiVerdict: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [comparing, setComparing] = useState(false);

  // Fetch leaderboard when weights or city change
  useEffect(() => {
    setLoading(true);
    getLeaderboard({
      city: activeCity.id,
      weights: scoreWeights,
    })
      .then((res) => {
        setTop10(res.top10);
        setBottom10(res.bottom10);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Leaderboard fetch failed', err);
        setLoading(false);
      });
  }, [activeCity, scoreWeights]);

  // Run multi-place comparison when compareList changes
  useEffect(() => {
    if (compareList.length >= 2) {
      setComparing(true);
      comparePlaces(
        compareList.map((p) => p.id),
        scoreWeights
      )
        .then((res) => {
          setComparisonData({
            metricWinners: res.metricWinners,
            aiVerdict: res.aiVerdict,
          });
          setComparing(false);
        })
        .catch((err) => {
          console.error('Compare failed', err);
          setComparing(false);
        });
    } else {
      setComparisonData(null);
    }
  }, [compareList, scoreWeights]);

  const weightSliders = [
    { key: 'safety' as const, label: 'Safety', color: 'accent-red-400' },
    { key: 'cleanliness' as const, label: 'Cleanliness', color: 'accent-emerald-400' },
    { key: 'affordability' as const, label: 'Affordability', color: 'accent-teal-400' },
    { key: 'rating' as const, label: 'Rating', color: 'accent-amber-400' },
    { key: 'accessibility' as const, label: 'Accessibility', color: 'accent-purple-400' },
  ];

  return (
    <GlassPanel
      title="Best vs Worst & Compare"
      subtitle={`CityScore Composite Analytics in ${activeCity.name}`}
      icon={<Scale className="w-5 h-5 text-purple-400" />}
      width="w-full sm:w-[420px]"
    >
      {/* Top Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/[0.04] border border-white/5 select-none">
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'leaderboard'
              ? 'bg-purple-500 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Leaderboards (Top & Bottom 10)
        </button>
        <button
          onClick={() => setActiveTab('compare')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'compare'
              ? 'bg-purple-500 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>Radar Compare</span>
          {compareList.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-white/20 text-[10px] flex items-center justify-center">
              {compareList.length}
            </span>
          )}
        </button>
      </div>

      {/* Customizable Weights Sliders Accordion */}
      <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2.5">
        <div className="flex items-center justify-between text-xs font-bold text-white">
          <span className="flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
            <Sliders className="w-3.5 h-3.5 text-purple-400" />
            Adjust CityScore Weights
          </span>
          <span className="text-[10px] text-slate-400 font-normal">Real-time recalculation</span>
        </div>

        <div className="space-y-2 pt-1">
          {weightSliders.map((s) => (
            <div key={s.key} className="flex items-center justify-between gap-3 text-xs">
              <span className="text-slate-300 text-[11px] w-24 truncate">{s.label}:</span>
              <input
                type="range"
                min="0"
                max="5"
                step="1"
                value={scoreWeights[s.key]}
                onChange={(e) => setScoreWeight(s.key, Number(e.target.value))}
                className={`flex-1 h-1 bg-white/10 rounded-lg cursor-pointer ${s.color}`}
              />
              <span className="text-[11px] font-mono font-bold text-white w-4 text-right">
                {scoreWeights[s.key]}x
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Tab 1: Leaderboards */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-4">
          {/* Top 10 Best Places */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 px-1">
              <Trophy className="w-4 h-4 text-emerald-400" />
              Top 10 Best Rated Venues
            </h3>

            {loading ? (
              <div className="text-center py-6 text-xs text-slate-400">Recalculating...</div>
            ) : (
              top10.slice(0, 5).map((place, idx) => (
                <div
                  key={place.id}
                  onClick={() => setFlyTo([place.lat, place.lng], 15)}
                  className="p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-emerald-500/40 transition-all cursor-pointer flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-300 font-black text-xs flex items-center justify-center flex-shrink-0">
                      #{idx + 1}
                    </span>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white truncate">{place.name}</h4>
                      <p className="text-[10px] text-slate-400 truncate">
                        {place.scores?.reasonText || `Rated ${place.rating}★ with high safety`}
                      </p>
                    </div>
                  </div>

                  {place.scores && (
                    <div className="text-right flex-shrink-0">
                      <span className="text-xs font-black text-emerald-400 block font-mono">
                        {place.scores.compositeScore}
                      </span>
                      <span className="text-[9px] text-slate-400">Score</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Bottom 10 Ranked Venues with Honest Explanations */}
          <div className="space-y-2 pt-2 border-t border-white/5">
            <h3 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5 px-1">
              <AlertOctagon className="w-4 h-4 text-rose-400" />
              Bottom Ranked Venues (Need Attention)
            </h3>

            {bottom10.slice(0, 5).map((place, idx) => (
              <div
                key={place.id}
                onClick={() => setFlyTo([place.lat, place.lng], 15)}
                className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/20 hover:border-rose-500/40 transition-all cursor-pointer flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-6 h-6 rounded-lg bg-rose-500/20 text-rose-300 font-black text-xs flex items-center justify-center flex-shrink-0">
                    #{idx + 1}
                  </span>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">{place.name}</h4>
                    <p className="text-[10px] text-rose-200/80 truncate">
                      {place.scores?.reasonText || 'Lower cleanliness or nearby reported incidents.'}
                    </p>
                  </div>
                </div>

                {place.scores && (
                  <div className="text-right flex-shrink-0">
                    <span className="text-xs font-black text-rose-400 block font-mono">
                      {place.scores.compositeScore}
                    </span>
                    <span className="text-[9px] text-slate-400">Score</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Side-by-Side Compare */}
      {activeTab === 'compare' && (
        <div className="space-y-4">
          {compareList.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs space-y-2">
              <Scale className="w-8 h-8 mx-auto text-purple-400 opacity-60" />
              <p>No places selected for comparison.</p>
              <p className="text-[11px] text-slate-500">
                Click &quot;Compare&quot; on 2 or 3 places in the Explore tab to see a radar chart and AI verdict.
              </p>
            </div>
          ) : (
            <>
              {/* Selected Place Chips */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-300">
                  Comparing ({compareList.length}/3 places):
                </span>
                <button
                  onClick={clearCompare}
                  className="text-[11px] text-slate-400 hover:text-white"
                >
                  Clear All
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {compareList.map((p, idx) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-200 text-xs"
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ['#2DD4BF', '#FBBF24', '#A78BFA'][idx] }} />
                    <span className="truncate max-w-[120px] font-medium">{p.name}</span>
                    <button
                      onClick={() => removeFromCompare(p.id)}
                      className="p-0.5 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Radar Chart */}
              {compareList.length >= 2 && <RadarChartComp places={compareList} />}

              {/* AI Comparison Verdict */}
              {comparisonData && (
                <div className="p-3.5 rounded-2xl bg-purple-950/30 border border-purple-500/30 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-purple-300 uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>AI Verdict & Recommendation</span>
                  </div>
                  <p className="text-xs text-purple-100 leading-relaxed">
                    {comparisonData.aiVerdict}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </GlassPanel>
  );
};
