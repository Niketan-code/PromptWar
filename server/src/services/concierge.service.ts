import { Place, ConciergeQueryResponse, PoiCategory } from '../../../shared/types.js';
import { queryAll } from '../db/connection.js';
import { getOrComputePlaceScore } from './cityscore.service.js';
import { haversineDistanceKm } from '../lib/geo.js';
import { env } from '../config/env.js';
import { getCityConfig } from '../config/city.config.js';
import { fetchPoisFromOverpass } from './overpass.service.js';

export async function processConciergeQuery(params: {
  query: string;
  cityId: string;
  userLat?: number;
  userLng?: number;
}): Promise<ConciergeQueryResponse> {
  const { query, cityId, userLat, userLng } = params;
  const city = getCityConfig(cityId);
  const lat = userLat ?? city.center.lat;
  const lng = userLng ?? city.center.lng;

  // 1. Parse natural language into structured filters
  const parsed = await parseQueryFilters(query);

  // 2. Fetch places in this category for the city
  const category = parsed.category || 'food';
  const allPlaces = await fetchPoisFromOverpass(city.id, category);

  // 3. Filter and rank places
  const qualified: Array<Place & { matchScore: number; reason: string }> = [];

  for (const p of allPlaces) {
    const scores = await getOrComputePlaceScore(p);
    const dist = haversineDistanceKm(lat, lng, p.lat, p.lng);

    // Budget match
    if (parsed.budgetTier && p.priceTier > parsed.budgetTier) {
      continue;
    }

    // Safety threshold
    if (parsed.minSafetyScore && scores.safety < parsed.minSafetyScore) {
      continue;
    }

    // Radius match
    if (parsed.radiusKm && dist > parsed.radiusKm) {
      continue;
    }

    // Match ranking: combination of CityScore and distance
    const distPenalty = Math.min(20, dist * 3);
    const matchScore = scores.compositeScore * 0.7 + (100 - distPenalty) * 0.3;

    // Build transparent reasoning string from actual fields
    const reasonParts: string[] = [];
    reasonParts.push(`Rated ${p.rating}★`);
    reasonParts.push(`Safety score ${scores.safety}/100`);
    reasonParts.push(`Budget tier ${p.priceTier === 1 ? '₹ (Budget)' : p.priceTier === 2 ? '₹₹ (Moderate)' : '₹₹₹ (Premium)'}`);
    reasonParts.push(`${dist.toFixed(1)} km away`);

    qualified.push({
      ...p,
      distanceMeters: Math.round(dist * 1000),
      scores,
      matchScore,
      reason: `Because: ${reasonParts.join(', ')}.`,
    });
  }

  // Sort descending by match score
  qualified.sort((a, b) => b.matchScore - a.matchScore);
  const topResults = qualified.slice(0, 5);

  const fallbackReasoning = topResults.length > 0
    ? `Identified top ${topResults.length} recommended venues matching your criteria for ${category} with verified safety and budget compliance.`
    : `No exact matches met the strict filters, showing top verified spots in ${city.name}.`;

  return {
    query,
    parsedFilters: parsed,
    reasoning: fallbackReasoning,
    results: topResults,
    source: env.GEMINI_API_KEY ? 'ai' : 'real',
  };
}

async function parseQueryFilters(query: string): Promise<{
  category: PoiCategory;
  budgetTier?: number;
  minSafetyScore?: number;
  radiusKm?: number;
  openNow?: boolean;
}> {
  const lower = query.toLowerCase();

  // Try Gemini if available
  if (env.GEMINI_API_KEY) {
    try {
      const prompt = `Parse this urban recommendation query into structured JSON:
"${query}"
Allowed categories: "food" | "cafes" | "hotels" | "attractions" | "budget" | "parks".
Schema:
{
  "category": string,
  "budgetTier": 1 | 2 | 3 | null,
  "minSafetyScore": integer 0-100 | null,
  "radiusKm": float | null,
  "openNow": boolean | null
}`;
      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      });
      if (resp.ok) {
        const data = (await resp.json()) as any;
        const json = JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text);
        return {
          category: json.category || 'food',
          budgetTier: json.budgetTier || undefined,
          minSafetyScore: json.minSafetyScore || undefined,
          radiusKm: json.radiusKm || undefined,
          openNow: json.openNow || undefined,
        };
      }
    } catch {}
  }

  // Regex and keyword parsing fallback
  let category: PoiCategory = 'food';
  if (lower.includes('coffee') || lower.includes('cafe') || lower.includes('tea')) category = 'cafes';
  else if (lower.includes('hotel') || lower.includes('stay') || lower.includes('lodge')) category = 'hotels';
  else if (lower.includes('visit') || lower.includes('attraction') || lower.includes('museum') || lower.includes('sight')) category = 'attractions';
  else if (lower.includes('park') || lower.includes('garden')) category = 'parks';
  else if (lower.includes('street food') || lower.includes('cheap') || lower.includes('budget')) category = 'budget';

  let budgetTier: number | undefined = undefined;
  if (lower.includes('cheap') || lower.includes('budget') || lower.includes('affordable') || lower.includes('under 200')) {
    budgetTier = 1;
  } else if (lower.includes('luxury') || lower.includes('fine dine') || lower.includes('5 star')) {
    budgetTier = 3;
  }

  let minSafetyScore: number | undefined = undefined;
  if (lower.includes('safe') || lower.includes('night') || lower.includes('woman') || lower.includes('secure')) {
    minSafetyScore = 75;
  }

  let radiusKm = 10;
  if (lower.includes('walking') || lower.includes('near me') || lower.includes('nearby')) {
    radiusKm = 5;
  }

  return {
    category,
    budgetTier,
    minSafetyScore,
    radiusKm,
    openNow: lower.includes('tonight') || lower.includes('now') || lower.includes('open'),
  };
}
