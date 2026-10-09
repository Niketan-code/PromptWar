import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { useAppStore } from '../../store/useAppStore';
import { Layers, Flame, Landmark, Car, AlertTriangle } from 'lucide-react';
import { PoiLayer } from './PoiLayer';
import { HeritageLayer } from './HeritageLayer';
import { RouteLayer } from './RouteLayer';
import { ReportLayer } from './ReportLayer';
import { TrafficLayer } from './TrafficLayer';
import { HeatLayer } from './HeatLayer';

export const MapCanvas: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const {
    activeCity,
    mapCenter,
    mapZoom,
    flyToCoords,
    theme,
    layers,
    toggleLayer,
  } = useAppStore();

  // Initialize Leaflet map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [activeCity.center.lat, activeCity.center.lng],
      zoom: activeCity.defaultZoom,
      zoomControl: false,
      attributionControl: true,
    });

    // Custom positioned zoom control
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Layer based on theme
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }

    const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    const attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

    const tiles = L.tileLayer(tileUrl, {
      maxZoom: 19,
      attribution,
      className: theme === 'dark' ? 'dark-map-tiles' : '',
    });

    tiles.addTo(mapInstanceRef.current);
    tileLayerRef.current = tiles;
  }, [theme]);

  // Handle FlyTo on city or coordinate change
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (flyToCoords) {
      mapInstanceRef.current.flyTo(flyToCoords, 14, {
        duration: 1.2,
        easeLinearity: 0.25,
      });
    } else {
      mapInstanceRef.current.flyTo(
        [activeCity.center.lat, activeCity.center.lng],
        activeCity.defaultZoom,
        { duration: 1.2 }
      );
    }
  }, [activeCity, flyToCoords]);

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      {/* Leaflet DOM container */}
      <div ref={mapContainerRef} className="w-full h-full" id="citypulse-map" />

      {/* Layer Visibility Controls (Top Right) */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-1.5 glass-panel rounded-2xl p-2 border border-white/10 shadow-xl pointer-events-auto">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 flex items-center gap-1.5">
          <Layers className="w-3 h-3 text-teal-400" />
          Map Layers
        </span>

        <button
          onClick={() => toggleLayer('heatmap')}
          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            layers.heatmap
              ? 'bg-red-500/20 text-red-300 border border-red-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-red-400" />
          Risk Heatmap
        </button>

        <button
          onClick={() => toggleLayer('heritage')}
          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            layers.heritage
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Landmark className="w-3.5 h-3.5 text-amber-400" />
          Heritage Sites
        </button>

        <button
          onClick={() => toggleLayer('reports')}
          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            layers.reports
              ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-pink-400" />
          Citizen Reports
        </button>

        <button
          onClick={() => toggleLayer('traffic')}
          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            layers.traffic
              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Car className="w-3.5 h-3.5 text-blue-400" />
          Traffic (Simulated)
        </button>
      </div>

      {/* Layer Components attached to Leaflet Map */}
      {mapInstanceRef.current && (
        <>
          <PoiLayer map={mapInstanceRef.current} />
          {layers.heritage && <HeritageLayer map={mapInstanceRef.current} />}
          {layers.heatmap && <HeatLayer map={mapInstanceRef.current} />}
          {layers.reports && <ReportLayer map={mapInstanceRef.current} />}
          {layers.traffic && <TrafficLayer map={mapInstanceRef.current} />}
          <RouteLayer map={mapInstanceRef.current} />
        </>
      )}
    </div>
  );
};
