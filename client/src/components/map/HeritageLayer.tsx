import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { useAppStore } from '../../store/useAppStore';
import { getStoryCard } from '../../lib/api';

interface Props {
  map: L.Map;
}

export const HeritageLayer: React.FC<Props> = ({ map }) => {
  const {
    heritagePlaces,
    heritageTrail,
    setActiveStoryCard,
    activeCity,
  } = useAppStore();

  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!layerGroupRef.current) {
      layerGroupRef.current = L.layerGroup().addTo(map);
    }
    const group = layerGroupRef.current;
    group.clearLayers();

    // 1. If Trail is active, render Trail Polyline & Numbered Stops
    if (heritageTrail && heritageTrail.stops.length > 0) {
      // Draw walking polyline
      const polyline = L.polyline(heritageTrail.routeCoordinates, {
        color: '#FBBF24',
        weight: 5,
        opacity: 0.85,
        dashArray: '8, 8',
        className: 'route-animated',
      }).addTo(group);

      // Fit map bounds to trail
      map.fitBounds(polyline.getBounds(), { padding: [60, 60] });

      // Numbered stops
      heritageTrail.stops.forEach((stop) => {
        const icon = L.divIcon({
          className: 'trail-stop-icon',
          html: `
            <div style="
              width: 32px;
              height: 32px;
              border-radius: 50%;
              background: #FBBF24;
              border: 3px solid #0B1020;
              box-shadow: 0 4px 14px rgba(251, 191, 36, 0.5);
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: 800;
              font-size: 13px;
              color: #0B1020;
              transform: translate(-50%, -50%);
              cursor: pointer;
            ">
              ${stop.order}
            </div>
          `,
          iconSize: [0, 0],
        });

        const marker = L.marker([stop.place.lat, stop.place.lng], { icon });
        marker.on('click', async () => {
          const card = await getStoryCard(stop.place.id, stop.place.name, activeCity.id);
          setActiveStoryCard(card);
        });
        marker.bindTooltip(`Stop #${stop.order}: ${stop.place.name}`, { direction: 'top', offset: [0, -18] });
        marker.addTo(group);
      });

      return;
    }

    // 2. Otherwise render standard heritage landmark pins
    heritagePlaces.forEach((place) => {
      const icon = L.divIcon({
        className: 'heritage-pin-icon',
        html: `
          <div style="
            width: 30px;
            height: 30px;
            border-radius: 8px;
            background: linear-gradient(135deg, #FBBF24, #D97706);
            border: 2px solid white;
            box-shadow: 0 4px 12px rgba(0,0,0,0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            transform: translate(-50%, -50%);
            cursor: pointer;
          ">
            🏛
          </div>
        `,
        iconSize: [0, 0],
      });

      const marker = L.marker([place.lat, place.lng], { icon });

      marker.on('click', async () => {
        const card = await getStoryCard(place.id, place.name, activeCity.id);
        setActiveStoryCard(card);
      });

      marker.bindTooltip(`🏛 <strong>${place.name}</strong><br/><span style="font-size:10px;color:#FBBF24;">Heritage Site</span>`, {
        direction: 'top',
        offset: [0, -16],
      });

      marker.addTo(group);
    });

    return () => {
      group.clearLayers();
    };
  }, [heritagePlaces, heritageTrail, map, activeCity]);

  return null;
};
