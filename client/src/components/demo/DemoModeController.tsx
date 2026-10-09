import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, SkipForward, X, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

const DEMO_STEPS = [
  {
    title: '1. CityPulse Overview & Interactive Canvas',
    caption: 'Full-screen urban canvas combining OpenStreetMap, real Overpass POIs, live weather, and civic reports.',
    action: (store: any) => {
      store.setActivePillar('explore');
      store.setSelectedPlace(null);
      store.setConciergeOpen(false);
      store.setReportModalOpen(false);
      store.setFlyTo([store.activeCity.center.lat, store.activeCity.center.lng], 13);
    },
    duration: 8000,
  },
  {
    title: '2. AI Concierge & Transparent Reasoning',
    caption: 'Ask natural language queries like "cheap safe food near me". Receives ranked spots with explicit "Because..." explanations.',
    action: (store: any) => {
      store.setConciergeOpen(true);
      store.setActivePillar('explore');
    },
    duration: 9000,
  },
  {
    title: '3. History & Heritage Walking Circuit',
    caption: 'Generated nearest-neighbor walking trail through historical landmarks with AI Story Cards and audio narration.',
    action: (store: any) => {
      store.setConciergeOpen(false);
      store.setActivePillar('heritage');
      if (!store.layers.heritage) store.toggleLayer('heritage');
    },
    duration: 9000,
  },
  {
    title: '4. Verified Citizen Reports & Clustering',
    caption: 'Citizens submit photo + voice reports. The NLP pipeline classifies severity and automatically clusters reports within 200m.',
    action: (store: any) => {
      store.setReportModalOpen(true);
    },
    duration: 9000,
  },
  {
    title: '5. Safe Route: Fastest vs. Safest Scoring',
    caption: 'Scores routes using accident hotspots and low-light risk. Toggling Night Mode re-weights risk dynamically.',
    action: (store: any) => {
      store.setReportModalOpen(false);
      store.setActivePillar('safety');
      if (!store.nightMode) store.toggleNightMode();
      if (!store.layers.heatmap) store.toggleLayer('heatmap');
    },
    duration: 9000,
  },
  {
    title: '6. CityScore & Multi-Place Radar Compare',
    caption: 'Adjustable weights calculate composite scores across Safety, Cleanliness, Affordability, Rating, and Accessibility with an AI verdict.',
    action: (store: any) => {
      store.setActivePillar('compare');
      if (store.places.length >= 2 && store.compareList.length < 2) {
        store.addToCompare(store.places[0]);
        store.addToCompare(store.places[1]);
      }
    },
    duration: 9000,
  },
  {
    title: '7. Smart City Insights & Wrap Up',
    caption: 'Real-time weather alerts, simulated congestion overlays, and comprehensive civic analytics.',
    action: (store: any) => {
      store.setActivePillar('insights');
      if (!store.layers.traffic) store.toggleLayer('traffic');
    },
    duration: 8000,
  },
];

export const DemoModeController: React.FC = () => {
  const store = useAppStore();
  const { demoMode, setDemoMode, demoStep, setDemoStep } = store;
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!demoMode) return;

    const currentStepConfig = DEMO_STEPS[demoStep];
    if (currentStepConfig) {
      currentStepConfig.action(store);
    }

    if (isPaused) return;

    const timer = setTimeout(() => {
      if (demoStep < DEMO_STEPS.length - 1) {
        setDemoStep(demoStep + 1);
      } else {
        setDemoMode(false);
      }
    }, currentStepConfig.duration);

    return () => clearTimeout(timer);
  }, [demoMode, demoStep, isPaused]);

  if (!demoMode) return null;

  const currentStep = DEMO_STEPS[demoStep];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-4 pointer-events-auto">
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 30, opacity: 0 }}
        className="glass-panel p-4 rounded-3xl border border-teal-400/40 shadow-2xl bg-black/80 backdrop-blur-xl space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/30">
              <Sparkles className="w-4 h-4 animate-spin text-teal-400" />
            </span>
            <span className="text-xs font-bold text-white font-heading">
              {currentStep.title}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
              title={isPaused ? 'Resume walkthrough' : 'Pause walkthrough'}
            >
              {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </button>

            <button
              onClick={() => {
                if (demoStep < DEMO_STEPS.length - 1) setDemoStep(demoStep + 1);
                else setDemoMode(false);
              }}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
              title="Next step"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            <button
              onClick={() => setDemoMode(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              title="Exit demo mode"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-200 leading-relaxed">
          {currentStep.caption}
        </p>

        {/* Step Progress Dots */}
        <div className="flex items-center justify-between pt-1 border-t border-white/10">
          <div className="flex items-center gap-1.5">
            {DEMO_STEPS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setDemoStep(idx)}
                className={`h-1.5 rounded-full transition-all ${
                  idx === demoStep
                    ? 'w-8 bg-teal-400'
                    : idx < demoStep
                    ? 'w-3 bg-teal-600/50'
                    : 'w-3 bg-white/20'
                }`}
              />
            ))}
          </div>
          <span className="text-[10px] text-teal-300 font-mono">
            Step {demoStep + 1} of {DEMO_STEPS.length}
          </span>
        </div>
      </motion.div>
    </div>
  );
};
