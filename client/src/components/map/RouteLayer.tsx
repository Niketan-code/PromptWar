import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { useAppStore } from '../../store/useAppStore';

interface Props {
  map: L.Map;
}

export const RouteLayer: React.FC<Props> = ({ map }) => {
  const { safeRoutes, selectedRoute, setSelectedRoute } = useAppStore();
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!layerGroupRef.current) {
      layerGroupRef.current = L.layerGroup().addTo(map);
    }
    const group = layerGroupRef.current;
    group.clearLayers();

    if (safeRoutes.length === 0) return;

    // Draw all routes, putting active route on top
    safeRoutes.forEach((route) => {
      const isSelected = selectedRoute ? selectedRoute.id === route.id : route.isSafest;

      let color = '#3B82F6'; // blue default
      let dashArray: string | undefined = undefined;

      if (route.isSafest) {
        color = '#10B981'; // emerald green
      } else if (route.isFastest) {
        color = '#3B82F6'; // blue
        dashArray = '6, 6';
      }

      // Glow outline for selected route
      if (isSelected) {
        L.polyline(route.coordinates, {
          color: route.isSafest ? '#059669' : '#2563EB',
          weight: 10,
          opacity: 0.35,
        }).addTo(group);
      }

      const polyline = L.polyline(route.coordinates, {
        color,
        weight: isSelected ? 6 : 4,
        opacity: isSelected ? 1 : 0.6,
        dashArray,
      }).addTo(group);

      polyline.on('click', () => {
        setSelectedRoute(route);
      });

      polyline.bindTooltip(`
        <strong>${route.summary}</strong><br/>
        <span>🛡️ Safety: ${route.safetyScore}/100 · ⏱️ ${route.durationMin} mins (${route.distanceKm} km)</span>
      `, { sticky: true });
    });

    // Draw Origin (A) and Destination (B) Markers
    const firstRoute = safeRoutes[0];
    if (firstRoute && firstRoute.coordinates.length > 0) {
      const startCoord = firstRoute.coordinates[0];
      const endCoord = firstRoute.coordinates[firstRoute.coordinates.length - 1];

      // Marker A
      const iconA = L.divIcon({
        html: `
          <div style="
            width: 28px; height: 28px; border-radius: 50%;
            background: #2DD4BF; color: #0B1020; font-weight: 900; font-size: 13px;
            display: flex; align-items: center; justify-content: center;
            border: 2px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.5);
            transform: translate(-50%, -50%);
          ">A</div>
        `,
        iconSize: [0, 0],
      });
      L.marker(startCoord, { icon: iconA }).addTo(group);

      // Marker B
      const iconB = L.divIcon({
        html: `
          <div style="
            width: 28px; height: 28px; border-radius: 50%;
            background: #F43F5E; color: white; font-weight: 900; font-size: 13px;
            display: flex; align-items: center; justify-content: center;
            border: 2px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.5);
            transform: translate(-50%, -50%);
          ">B</div>
        `,
        iconSize: [0, 0],
      });
      L.marker(endCoord, { icon: iconB }).addTo(group);

      // Fit map to routes
      const bounds = L.latLngBounds(firstRoute.coordinates);
      map.fitBounds(bounds, { padding: [80, 80] });
    }

    return () => {
      group.clearLayers();
    };
  }, [safeRoutes, selectedRoute, map]);

  return null;
};
