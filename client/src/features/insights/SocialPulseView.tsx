import React, { useEffect, useState } from 'react';
import { MessageSquare, TrendingUp, Smile, Frown, Meh, Loader2 } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { getSocialPulse } from '../../lib/api';
import { SocialPost } from '../../../../shared/types';
import { ProvenanceChip } from '../../components/ui/ProvenanceChip';

export const SocialPulseView: React.FC = () => {
  const { activeCity } = useAppStore();
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [trending, setTrending] = useState<string[]>([]);
  const [sentimentScore, setSentimentScore] = useState<number>(0.2);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    getSocialPulse(activeCity.id)
      .then((data) => {
        setPosts(data.posts);
        setTrending(data.trendingTopics);
        setSentimentScore(data.sentimentScore);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Social pulse fetch failed', err);
        setLoading(false);
      });
  }, [activeCity]);

  return (
    <div className="space-y-4">
      {/* Overview Card */}
      <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5 uppercase tracking-wider">
            <TrendingUp className="w-3.5 h-3.5" />
            Neighborhood Social Sentiment
          </span>
          <ProvenanceChip source="seed" />
        </div>

        <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/40 border border-white/5">
          <span className="text-xs text-slate-300">Average Civic Sentiment:</span>
          <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-400">
            {sentimentScore > 0 ? (
              <Smile className="w-4 h-4 text-emerald-400" />
            ) : (
              <Frown className="w-4 h-4 text-rose-400" />
            )}
            <span>{(sentimentScore * 100).toFixed(0)}% Positive</span>
          </div>
        </div>

        {/* Trending Tags */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {trending.map((t) => (
            <span
              key={t}
              className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20"
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Social Feed List */}
      <div className="space-y-2">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-1">
          Sample Public Social Posts ({posts.length})
        </span>

        {loading ? (
          <div className="text-center py-8 text-xs text-slate-400">Loading social posts...</div>
        ) : (
          posts.map((p) => (
            <div
              key={p.id}
              className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5"
            >
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-white">{p.area}</span>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                    p.sentiment > 0.3
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : p.sentiment < -0.2
                      ? 'bg-rose-500/20 text-rose-300'
                      : 'bg-slate-500/20 text-slate-300'
                  }`}
                >
                  {p.sentiment > 0.3 ? 'Positive' : p.sentiment < -0.2 ? 'Critical' : 'Neutral'}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{p.text}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
