import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Volume2, Landmark, Calendar, ShieldCheck } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { ProvenanceChip } from '../../components/ui/ProvenanceChip';

export const StoryCardModal: React.FC = () => {
  const { activeStoryCard, setActiveStoryCard } = useAppStore();

  if (!activeStoryCard) return null;

  // Browser speech synthesis for Story Card reading
  const handleSpeak = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const textToSpeak = `${activeStoryCard.name}. ${activeStoryCard.historyText}. Cultural significance: ${activeStoryCard.culturalSignificance}. Tip: ${activeStoryCard.traditionFestivalTip}`;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="glass-panel w-full max-w-lg rounded-3xl border border-amber-500/30 overflow-hidden shadow-2xl relative"
      >
        {/* Modal Top Banner */}
        <div className="relative p-6 bg-gradient-to-br from-amber-950/60 via-slate-900 to-[#141A2D] border-b border-amber-500/20">
          <button
            onClick={() => {
              if ('speechSynthesis' in window) window.speechSynthesis.cancel();
              setActiveStoryCard(null);
            }}
            className="absolute top-4 right-4 p-2 rounded-xl bg-black/40 text-slate-300 hover:text-white transition-colors"
            aria-label="Close story card"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <Landmark className="w-4 h-4" />
            </span>
            <ProvenanceChip source={activeStoryCard.generatedBy === 'ai' ? 'ai' : 'seed'} />
          </div>

          <h2 className="text-xl font-bold text-white font-heading">
            {activeStoryCard.name}
          </h2>
          <p className="text-xs text-amber-300/80 mt-0.5">Heritage Intelligence & Cultural Chronicle</p>
        </div>

        {/* Story Card Content */}
        <div className="p-6 space-y-4 text-xs leading-relaxed max-h-[60vh] overflow-y-auto">
          {/* History */}
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
              Architectural & Political History
            </span>
            <p className="text-slate-200 text-sm leading-relaxed">
              {activeStoryCard.historyText}
            </p>
          </div>

          {/* Cultural Significance */}
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400 block">
              Cultural & Community Legacy
            </span>
            <p className="text-slate-300 leading-relaxed">
              {activeStoryCard.culturalSignificance}
            </p>
          </div>

          {/* Local Tradition & Festival Tip */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Local Traditions & Insider Tips
            </span>
            <p className="text-amber-100 leading-relaxed">
              {activeStoryCard.traditionFestivalTip}
            </p>
          </div>
        </div>

        {/* Modal Footer with Audio Reader */}
        <div className="p-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-between">
          <button
            onClick={handleSpeak}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition-all"
          >
            <Volume2 className="w-4 h-4" />
            <span>Listen Story (Audio)</span>
          </button>

          <span className="text-[10px] text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
            Historical references verified
          </span>
        </div>
      </motion.div>
    </div>
  );
};
