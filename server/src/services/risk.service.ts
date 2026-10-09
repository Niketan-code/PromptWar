import { HeatPoint, RiskZone } from '../../../shared/types.js';
import { queryAll } from '../db/connection.js';
import { getCityConfig } from '../config/city.config.js';
import { haversineDistanceMeters } from '../lib/geo.js';

export async function generateRiskHeatmap(
  cityId: string,
  isNight?: boolean,
  bbox?: [number, number, number, number]
): Promise<HeatPoint[]> {
  const city = getCityConfig(cityId);
  const activeBbox = bbox || city.bbox;
  const [south, west, north, east] = activeBbox;

  // Determine night time factor
  const currentHour = new Date().getHours();
  const nightActive = isNight !== undefined ? isNight : currentHour >= 20 || currentHour < 5;

  // Fetch active reports and risk zones
  const reports = await queryAll<any>(
    'SELECT lat, lng, severity, credibility, spam_flag, created_at FROM reports WHERE city = ? AND spam_flag = 0',
    [city.id]
  );

  const zones = await queryAll<any>(
    'SELECT lat, lng, radius_m, base_risk, night_multiplier, kind FROM risk_zones WHERE city = ?',
    [city.id]
  );

  // Generate grid points across active bounding box (~20x20 or 25x25 grid for high resolution)
  const latSteps = 22;
  const lngSteps = 22;
  const latDelta = (north - south) / latSteps;
  const lngDelta = (east - west) / lngSteps;

  const heatPoints: HeatPoint[] = [];
  const now = Date.now();
  const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

  for (let i = 0; i <= latSteps; i++) {
    const lat = Number((south + i * latDelta).toFixed(5));
    for (let j = 0; j <= lngSteps; j++) {
      const lng = Number((west + j * lngDelta).toFixed(5));

      let cellRisk = 0;

      // 1. Contribution from Citizen Reports within 400m
      for (const r of reports) {
        const dist = haversineDistanceMeters(lat, lng, r.lat, r.lng);
        if (dist <= 400) {
          const falloff = (400 - dist) / 400; // 1 at 0m, 0 at 400m
          const ageDays = (now - r.created_at) / (24 * 60 * 60 * 1000);
          const recencyDecay = Math.max(0.2, 1 - ageDays / 30);
          const credWeight = (r.credibility || 50) / 100;
          const repRisk = (r.severity / 5.0) * recencyDecay * credWeight;
          cellRisk += repRisk * falloff * 0.45;
        }
      }

      // 2. Contribution from Risk Zones (Accident hotspots, low-light corridors)
      for (const z of zones) {
        const radius = z.radius_m || 300;
        const dist = haversineDistanceMeters(lat, lng, z.lat, z.lng);
        if (dist <= radius) {
          const falloff = (radius - dist) / radius;
          let zoneRisk = z.base_risk * falloff;
          if (nightActive && (z.kind === 'lowlight' || z.kind === 'accident')) {
            zoneRisk *= z.night_multiplier || 1.8;
          }
          cellRisk += zoneRisk * 0.55;
        }
      }

      // Add point if there is noticeable risk
      if (cellRisk > 0.08) {
        heatPoints.push({
          lat,
          lng,
          weight: Number(Math.min(1.0, cellRisk).toFixed(2)),
        });
      }
    }
  }

  return heatPoints;
}

export function samplePolylineRisk(
  polyline: [number, number][],
  heatPoints: HeatPoint[],
  riskZones: any[],
  isNight: boolean = false
): { avgRisk: number; accidentCrossings: number } {
  if (polyline.length === 0) return { avgRisk: 0.1, accidentCrossings: 0 };

  let totalRisk = 0;
  let accidentCrossings = 0;

  // Sample every few vertices
  const step = Math.max(1, Math.floor(polyline.length / 25));
  let samples = 0;

  for (let i = 0; i < polyline.length; i += step) {
    const [pLat, pLng] = polyline[i];
    samples++;

    // Nearest heatpoint risk
    let localRisk = 0.05;
    for (const hp of heatPoints) {
      const d = haversineDistanceMeters(pLat, pLng, hp.lat, hp.lng);
      if (d < 250) {
        const contribution = hp.weight * ((250 - d) / 250);
        if (contribution > localRisk) localRisk = contribution;
      }
    }

    // Accident zone crossings
    for (const z of riskZones) {
      const d = haversineDistanceMeters(pLat, pLng, z.lat, z.lng);
      if (d < (z.radius_m || 200)) {
        accidentCrossings++;
        localRisk += 0.3 * (isNight ? z.night_multiplier : 1.0);
      }
    }

    totalRisk += Math.min(1.0, localRisk);
  }

  const avgRisk = samples > 0 ? totalRisk / samples : 0.1;
  return { avgRisk, accidentCrossings };
}
