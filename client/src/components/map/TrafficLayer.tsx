import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { useAppStore } from '../../store/useAppStore';
import { getTraffic } from '../../lib/api';

interface Props {
  map: L.Map;
}

const CONGESTION_COLORS: Record<string, string> = {
  low: '#10B981', // green
  moderate: '#F59E0B', // amber
  heavy: '#EF4444', // red
  gridlock: '#7C3AED', // deep purple
};

export const TrafficLayer: React.FC<Props> = ({ map }) => {
  const { activeCity } = useAppStore();
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!layerGroupRef.current) {
      layerGroupRef.current = L.layerGroup().addTo(map);
    }
    const group = layerGroupRef.current;
    group.clearLayers();

    getTraffic(activeCity.id).then((features) => {
      features.forEach((feat) => {
        const color = CONGESTION_COLORS[feat.congestionLevel] || '#F59E0B';

        const polyline = L.polyline(feat.coordinates, {
          color,
          weight: 6,
          opacity: 0.85,
        });

        polyline.bindTooltip(`
          <strong>${feat.roadName}</strong><br/>
          <span>Status: ${feat.congestionLevel.toUpperCase()} · Avg Speed: ${feat.speedKmh} km/h (Simulated)</span>
        `, { sticky: true });

        polyline.addTo(group);
      });
    });

    return () => {
      group.clearLayers();
    };
  }, [activeCity, map]);

  return null;
};
