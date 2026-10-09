import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { Sparkles, MessageSquare } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { Header } from './Header';
import { RailNav } from './RailNav';
import { BottomNav } from './BottomNav';
import { MapCanvas } from '../map/MapCanvas';

// Panels
import { ExplorePanel } from '../../features/explore/ExplorePanel';
import { HeritagePanel } from '../../features/heritage/HeritagePanel';
import { SafetyPanel } from '../../features/safety/SafetyPanel';
import { ComparePanel } from '../../features/compare/ComparePanel';
import { InsightsPanel } from '../../features/insights/InsightsPanel';

// Drawers & Modals
import { PlaceDetailDrawer } from '../../features/explore/PlaceDetailDrawer';
import { EmergencyDrawer } from '../../features/safety/EmergencyDrawer';
import { StoryCardModal } from '../../features/heritage/StoryCardModal';
import { ReportModal } from '../../features/report/ReportModal';
import { ConciergeChatDrawer } from '../../features/concierge/ConciergeChatDrawer';
import { DemoModeController } from '../demo/DemoModeController';
import { CommandPalette } from '../demo/CommandPalette';

export const AppShell: React.FC = () => {
  const { activePillar, conciergeOpen, setConciergeOpen } = useAppStore();

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0B1020] text-[#E8ECF8]">
      {/* Top Application Header */}
      <Header />

      {/* Main Body: RailNav + Map & Floating Panels */}
      <div className="relative flex-1 flex overflow-hidden">
        {/* Left Navigation Rail (Desktop) */}
        <RailNav />

        {/* Full-Screen Map Canvas */}
        <div className="relative flex-1 h-full overflow-hidden">
          <MapCanvas />

          {/* Left Floating Contextual Panel */}
          <div className="absolute top-4 left-4 z-20 pointer-events-none max-h-[calc(100vh-6.5rem)]">
            <AnimatePresence mode="wait">
              {activePillar === 'explore' && <ExplorePanel key="explore" />}
              {activePillar === 'heritage' && <HeritagePanel key="heritage" />}
              {activePillar === 'safety' && <SafetyPanel key="safety" />}
              {activePillar === 'compare' && <ComparePanel key="compare" />}
              {activePillar === 'insights' && <InsightsPanel key="insights" />}
            </AnimatePresence>
          </div>

          {/* Floating AI Concierge Bubble Button (Bottom Right) */}
          {!conciergeOpen && (
            <button
              onClick={() => setConciergeOpen(true)}
              className="absolute bottom-6 right-6 md:bottom-8 md:right-8 z-30 flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-bold text-xs shadow-2xl shadow-teal-500/30 hover:scale-105 active:scale-95 transition-all pointer-events-auto"
            >
              <Sparkles className="w-4 h-4 fill-current text-slate-950" />
              <span>Ask AI Concierge</span>
            </button>
          )}
        </div>

        {/* Right Sliders / Drawers */}
        <AnimatePresence>
          <PlaceDetailDrawer key="place-drawer" />
          <EmergencyDrawer key="emergency-drawer" />
          <ConciergeChatDrawer key="concierge-drawer" />
        </AnimatePresence>
      </div>

      {/* Mobile Bottom Navigation Bar (< 768px) */}
      <BottomNav />

      {/* Full-Screen Modals & Overlay Controllers */}
      <AnimatePresence>
        <StoryCardModal key="story-modal" />
        <ReportModal key="report-modal" />
        <CommandPalette key="command-palette" />
        <DemoModeController key="demo-controller" />
      </AnimatePresence>
    </div>
  );
};
