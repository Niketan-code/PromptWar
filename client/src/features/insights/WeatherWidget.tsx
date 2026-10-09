import React from 'react';
import { CloudSun, Droplets, Wind, Compass } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { AlertBanner } from '../../components/ui/AlertBanner';

export const WeatherWidget: React.FC = () => {
  const { weather, activeCity } = useAppStore();

  if (!weather) return null;

  return (
    <div className="space-y-3">
      {/* Alert Banners (if any) */}
      {weather.alerts && weather.alerts.length > 0 && (
        <div className="space-y-2">
          {weather.alerts.map((alert) => (
            <AlertBanner key={alert.id} alert={alert} />
          ))}
        </div>
      )}

      {/* Main Weather Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-950/40 via-slate-900 to-[#141A2D] border border-blue-500/20 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
              Live Weather & Atmospheric Conditions
            </span>
            <h3 className="text-2xl font-black text-white font-heading mt-0.5">
              {weather.current.temp}°C
            </h3>
            <p className="text-xs text-slate-300">{weather.current.weatherText}</p>
          </div>

          <div className="text-right">
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-lg inline-block ${
                weather.current.aqi > 150
                  ? 'bg-red-500/20 text-red-300'
                  : weather.current.aqi > 100
                  ? 'bg-amber-500/20 text-amber-300'
                  : 'bg-emerald-500/20 text-emerald-300'
              }`}
            >
              AQI {weather.current.aqi} ({weather.current.aqiStatus})
            </span>
            <span className="text-[10px] text-slate-400 block mt-1">Open-Meteo API</span>
          </div>
        </div>

        {/* Atmosphere Stats */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <Droplets className="w-3.5 h-3.5 text-blue-400" />
            <span>Humidity: {weather.current.humidity}%</span>
          </div>
          <div className="flex items-center gap-2">
            <Wind className="w-3.5 h-3.5 text-teal-400" />
            <span>Wind: {weather.current.windSpeed} km/h</span>
          </div>
        </div>
      </div>

      {/* Hourly Forecast Strip */}
      {weather.hourly && weather.hourly.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
            Hourly Forecast (Next 8 Hours)
          </span>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
            {weather.hourly.slice(0, 8).map((h, idx) => (
              <div
                key={idx}
                className="flex-shrink-0 flex flex-col items-center p-2 rounded-xl bg-white/[0.03] border border-white/5 text-center min-w-[58px]"
              >
                <span className="text-[10px] text-slate-400 font-mono">{h.time}</span>
                <span className="text-xs font-bold text-white my-1">{h.temp}°</span>
                <span className="text-[9px] text-blue-300 font-mono">
                  {h.precipProb}% rain
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
