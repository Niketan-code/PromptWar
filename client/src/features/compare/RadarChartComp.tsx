import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { Place } from '../../../../shared/types';

interface Props {
  places: Place[];
}

const COLORS = ['#2DD4BF', '#FBBF24', '#A78BFA'];

export const RadarChartComp: React.FC<Props> = ({ places }) => {
  if (places.length === 0) return null;

  const metrics = [
    { key: 'safety', label: 'Safety' },
    { key: 'cleanliness', label: 'Cleanliness' },
    { key: 'affordability', label: 'Affordability' },
    { key: 'rating', label: 'Rating' },
    { key: 'accessibility', label: 'Accessibility' },
  ];

  const data = metrics.map((m) => {
    const row: any = { metric: m.label };
    places.forEach((p, idx) => {
      row[`place_${idx}`] = p.scores ? (p.scores as any)[m.key] : 70;
    });
    return row;
  });

  return (
    <div className="w-full h-64 p-2 rounded-2xl bg-black/40 border border-white/10">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
          <PolarGrid stroke="rgba(255, 255, 255, 0.15)" />
          <PolarAngleAxis
            dataKey="metric"
            tick={{ fill: '#E8ECF8', fontSize: 11, fontWeight: 600 }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={{ fill: '#94A3B8', fontSize: 9 }}
          />
          {places.map((place, idx) => (
            <Radar
              key={place.id}
              name={place.name}
              dataKey={`place_${idx}`}
              stroke={COLORS[idx % COLORS.length]}
              fill={COLORS[idx % COLORS.length]}
              fillOpacity={0.25}
              strokeWidth={2}
            />
          ))}
          <Tooltip
            contentStyle={{
              backgroundColor: '#141A2D',
              borderColor: 'rgba(255, 255, 255, 0.15)',
              borderRadius: '12px',
              color: '#E8ECF8',
              fontSize: '12px',
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};
