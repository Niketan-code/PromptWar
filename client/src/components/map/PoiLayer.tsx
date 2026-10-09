import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { useAppStore } from '../../store/useAppStore';
import { Place } from '../../../../shared/types';

interface Props {
  map: L.Map;
}

const CATEGORY_COLORS: Record<string, string> = {
  food: '#2DD4BF', // teal
  cafes: '#38BDF8', // sky
  attractions: '#FBBF24', // amber
  hotels: '#A78BFA', // purple
  budget: '#34D399', // emerald
  parks: '#4ADE80', // green
};

export const PoiLayer: React.FC<Props> = ({ map }) => {
  const { places, selectedPlace, setSelectedPlace } = useAppStore();
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!layerGroupRef.current) {
      layerGroupRef.current = L.layerGroup().addTo(map);
    }
    const group = layerGroupRef.current;
    group.clearLayers();

    places.forEach((place) => {
      const isSelected = selectedPlace?.id === place.id;
      const color = CATEGORY_COLORS[place.category] || '#2DD4BF';

      const customIcon = L.divIcon({
        className: 'custom-poi-marker',
        html: `
          <div style="
            position: relative;
            width: ${isSelected ? '36px' : '28px'};
            height: ${isSelected ? '36px' : '28px'};
            display: flex;
            align-items: center;
            justify-content: center;
            background: ${color};
            border: 2px solid white;
            border-radius: 50%;
            box-shadow: 0 4px 14px rgba(0,0,0,0.4);
            transform: translate(-50%, -50%);
            cursor: pointer;
            transition: all 0.2s ease;
          ">
            <span style="font-size: ${isSelected ? '14px' : '11px'}; font-weight: bold; color: #0B1020;">
              ${place.priceTier === 1 ? '₹' : place.priceTier === 2 ? '₹₹' : '₹₹₹'}
            </span>
          </div>
        `,
        iconSize: [0, 0],
      });

      const marker = L.marker([place.lat, place.lng], { icon: customIcon });

      marker.on('click', () => {
        setSelectedPlace(place);
        map.panTo([place.lat, place.lng], { animate: true, duration: 0.6 });
      });

      // Tooltip on hover
      marker.bindTooltip(`
        <div style="font-family: 'Inter', sans-serif; font-size: 11px;">
          <strong>${place.name}</strong><br/>
          <span>⭐ ${place.rating} · ${place.category.toUpperCase()}</span>
        </div>
      `, {
        direction: 'top',
        offset: [0, -18],
        opacity: 0.95,
      });

      marker.addTo(group);
    });

    return () => {
      group.clearLayers();
    };
  }, [places, selectedPlace, map]);

  return null;
};
