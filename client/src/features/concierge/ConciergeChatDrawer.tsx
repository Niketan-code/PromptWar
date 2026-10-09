import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Bot,
  User,
  Star,
  MapPin,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { queryConcierge } from '../../lib/api';
import { Place } from '../../../../shared/types';
import { ProvenanceChip } from '../../components/ui/ProvenanceChip';

export const ConciergeChatDrawer: React.FC = () => {
  const {
    conciergeOpen,
    setConciergeOpen,
    activeCity,
    setPlaces,
    setSelectedPlace,
    setFlyTo,
  } = useAppStore();

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<
    Array<{
      sender: 'user' | 'bot';
      text: string;
      reasoning?: string;
      results?: Place[];
    }>
  >([
    {
      sender: 'bot',
      text: `Namaste! I am your CityPulse AI Concierge for ${activeCity.name}. Ask me anything like "Where can I eat cheap and safe near me tonight?" or "Find wheelchair-accessible heritage spots".`,
    },
  ]);

  if (!conciergeOpen) return null;

  const quickChips = [
    'Where can I eat cheap and safe near me tonight?',
    'Best cafes with high safety rating',
    'Historical spots with good accessibility',
  ];

  const handleSend = async (queryText?: string) => {
    const q = queryText || input;
    if (!q.trim() || loading) return;

    // Add user message
    setMessages((prev) => [...prev, { sender: 'user', text: q }]);
    setInput('');
    setLoading(true);

    try {
      const resp = await queryConcierge(q, activeCity.id, activeCity.center.lat, activeCity.center.lng);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: resp.reasoning,
          results: resp.results,
        },
      ]);

      // Sync results to map
      if (resp.results && resp.results.length > 0) {
        setPlaces(resp.results);
        setSelectedPlace(resp.results[0]);
        setFlyTo([resp.results[0].lat, resp.results[0].lng], 15);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: 'Sorry, I encountered an issue processing that query. Please try another request.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed top-14 right-0 bottom-0 w-full sm:w-[410px] glass-panel border-l border-teal-500/30 z-40 flex flex-col overflow-hidden shadow-2xl"
    >
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-teal-950/60 via-slate-900 to-[#141A2D] border-b border-teal-500/20 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider font-heading">
              CityPulse AI Concierge
            </h2>
            <p className="text-[11px] text-teal-300/80">Natural Language Urban Intelligence</p>
          </div>
        </div>

        <button
          onClick={() => setConciergeOpen(false)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-2.5 ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                m.sender === 'user'
                  ? 'bg-teal-500 text-slate-950'
                  : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
              }`}
            >
              {m.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div
              className={`p-3 rounded-2xl max-w-[85%] text-xs leading-relaxed space-y-2 ${
                m.sender === 'user'
                  ? 'bg-teal-500 text-slate-950 font-medium'
                  : 'bg-white/[0.04] border border-white/10 text-slate-200'
              }`}
            >
              <p>{m.text}</p>

              {/* Bot Ranked Results */}
              {m.results && m.results.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-white/10">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400 block">
                    Top Verified Recommendations ({m.results.length}):
                  </span>

                  {m.results.map((res: any) => (
                    <div
                      key={res.id}
                      onClick={() => {
                        setSelectedPlace(res);
                        setFlyTo([res.lat, res.lng], 16);
                      }}
                      className="p-2.5 rounded-xl bg-black/40 border border-white/10 hover:border-teal-400/50 transition-all cursor-pointer space-y-1 text-left"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs truncate">{res.name}</span>
                        <span className="text-[10px] text-amber-400 flex items-center gap-0.5">
                          <Star className="w-3 h-3 fill-current" /> {res.rating}
                        </span>
                      </div>

                      {/* Transparent Reasoning Sentence */}
                      <p className="text-[10px] text-teal-300 leading-normal">
                        {res.reason}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-white/[0.03] border border-white/5 text-xs text-slate-400 max-w-[80%]">
            <Loader2 className="w-4 h-4 animate-spin text-teal-400" />
            <span>Analyzing filters and ranking safe venues...</span>
          </div>
        )}
      </div>

      {/* Suggested Query Chips */}
      <div className="px-4 py-2 border-t border-white/5 bg-white/[0.01] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {quickChips.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(chip)}
            className="flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-white/5 hover:bg-teal-500/20 text-slate-300 hover:text-teal-300 border border-white/10 transition-colors truncate max-w-[200px]"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="p-3 border-t border-white/10 bg-white/[0.02] flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={`Ask about food, safety, routes in ${activeCity.name}...`}
          className="flex-1 px-3 py-2 rounded-xl bg-black/40 border border-white/15 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-teal-400"
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || loading}
          className="p-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 text-slate-950 hover:scale-105 disabled:opacity-40 transition-all"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};
