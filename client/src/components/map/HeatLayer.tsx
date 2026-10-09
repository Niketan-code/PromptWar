import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { useAppStore } from '../../store/useAppStore';
import { getRiskHeatmap } from '../../lib/api';
import { HeatPoint } from '../../../../shared/types';

interface Props {
  map: L.Map;
}

export const HeatLayer: React.FC<Props> = ({ map }) => {
  const { activeCity, nightMode } = useAppStore();
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!layerGroupRef.current) {
      layerGroupRef.current = L.layerGroup().addTo(map);
    }
    const group = layerGroupRef.current;
    group.clearLayers();

    getRiskHeatmap(activeCity.id, nightMode).then((points: HeatPoint[]) => {
      points.forEach((pt) => {
        const radius = Math.max(120, pt.weight * 260);

        let color = '#FBBF24'; // yellow/amber
        if (pt.weight >= 0.7) color = '#EF4444'; // red
        else if (pt.weight >= 0.4) color = '#F97316'; // orange

        const circle = L.circle([pt.lat, pt.lng], {
          radius,
          color: 'transparent',
          fillColor: color,
          fillOpacity: Math.min(0.65, pt.weight * (nightMode ? 0.75 : 0.55)),
        });

        circle.bindTooltip(`Risk Level: ${Math.round(pt.weight * 100)}% ${nightMode ? '(Night weighted)' : ''}`, {
          direction: 'top',
        });

        circle.addTo(group);
      });
    });

    return () => {
      group.clearLayers();
    };
  }, [activeCity, nightMode, map]);

  return null;
};
