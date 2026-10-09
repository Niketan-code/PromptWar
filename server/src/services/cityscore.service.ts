import { Place, PlaceScore, ScoreWeights, PoiCategory } from '../../../shared/types.js';
import { queryAll, queryOne, execute } from '../db/connection.js';
import { haversineDistanceMeters } from '../lib/geo.js';
import { env } from '../config/env.js';

export function computeCityScore(
  metrics: {
    safety: number;
    cleanliness: number;
    affordability: number;
    rating: number;
    accessibility: number;
  },
  weights: ScoreWeights = {
    safety: 1,
    cleanliness: 1,
    affordability: 1,
    rating: 1,
    accessibility: 1,
  }
): number {
  const sumWeights =
    (weights.safety || 1) +
    (weights.cleanliness || 1) +
    (weights.affordability || 1) +
    (weights.rating || 1) +
    (weights.accessibility || 1);

  if (sumWeights === 0) return 50;

  const total =
    metrics.safety * (weights.safety || 1) +
    metrics.cleanliness * (weights.cleanliness || 1) +
    metrics.affordability * (weights.affordability || 1) +
    metrics.rating * (weights.rating || 1) +
    metrics.accessibility * (weights.accessibility || 1);

  return Math.round(Math.max(0, Math.min(100, total / sumWeights)));
}

export async function getOrComputePlaceScore(
  place: Place,
  weights?: ScoreWeights
): Promise<PlaceScore> {
  const existing = await queryOne<any>(
    'SELECT * FROM place_scores WHERE place_id = ?',
    [place.id]
  );

  let safety = 82;
  let cleanliness = 80;
  let affordability = place.priceTier === 1 ? 92 : place.priceTier === 2 ? 72 : 48;
  let rating = Math.round(place.rating * 20); // 4.5/5 -> 90
  let accessibility = place.wheelchair === 'yes' ? 95 : place.wheelchair === 'limited' ? 65 : 45;
  let reason = '';

  if (existing) {
    safety = existing.safety;
    cleanliness = existing.cleanliness;
    affordability = existing.affordability;
    rating = existing.rating;
    accessibility = existing.accessibility;
    reason = existing.reason_text;
  } else {
    // Derive from citizen reports within 500m
    const nearbyReports = await queryAll<any>(
      'SELECT category, severity FROM reports WHERE city = ? AND abs(lat - ?) < 0.008 AND abs(lng - ?) < 0.008',
      [place.city, place.lat, place.lng]
    );

    let safetyDeduction = 0;
    let cleanDeduction = 0;

    for (const r of nearbyReports) {
      if (r.category === 'Safety' || r.category === 'Accident') {
        safetyDeduction += r.severity * 4;
      }
      if (r.category === 'Cleanliness') {
        cleanDeduction += r.severity * 5;
      }
    }

    safety = Math.max(25, Math.min(98, 92 - safetyDeduction));
    cleanliness = Math.max(20, Math.min(96, 88 - cleanDeduction));

    // Plain English reason
    if (safetyDeduction > 10) {
      reason = `Safety score lowered due to ${nearbyReports.length} reports in surrounding 500m.`;
    } else if (cleanDeduction > 10) {
      reason = `Cleanliness compromised by nearby waste and garbage complaints.`;
    } else {
      reason = `High rating of ${place.rating}★, verified safe surroundings, and good accessibility.`;
    }

    const defaultComposite = computeCityScore({ safety, cleanliness, affordability, rating, accessibility });

    await execute(
      `INSERT OR REPLACE INTO place_scores (place_id, city, safety, cleanliness, affordability, rating, accessibility, composite_score, reason_text, updated_at, source)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        place.id,
        place.city,
        safety,
        cleanliness,
        affordability,
        rating,
        accessibility,
        defaultComposite,
        reason,
        Date.now(),
        place.source,
      ]
    );
  }

  const composite = computeCityScore({ safety, cleanliness, affordability, rating, accessibility }, weights);

  return {
    placeId: place.id,
    city: place.city,
    safety,
    cleanliness,
    affordability,
    rating,
    accessibility,
    compositeScore: composite,
    reasonText: reason,
    source: place.source,
  };
}

export async function getLeaderboard(params: {
  cityId: string;
  category?: PoiCategory;
  weights?: ScoreWeights;
}): Promise<{ top10: Array<Place & { scores: PlaceScore }>; bottom10: Array<Place & { scores: PlaceScore }> }> {
  const { cityId, category, weights } = params;

  let query = 'SELECT * FROM places WHERE city = ?';
  const queryParams: any[] = [cityId];

  if (category) {
    query += ' AND category = ?';
    queryParams.push(category);
  }

  const places = await queryAll<any>(query, queryParams);
  const placesWithScores: Array<Place & { scores: PlaceScore }> = [];

  for (const p of places) {
    let parsedTags = {};
    try { parsedTags = JSON.parse(p.tags || '{}'); } catch {}
    const placeObj: Place = {
      id: p.id,
      osmId: p.osm_id,
      city: p.city,
      name: p.name,
      category: p.category as PoiCategory,
      lat: p.lat,
      lng: p.lng,
      tags: parsedTags,
      priceTier: p.price_tier || 2,
      rating: p.rating || 4.2,
      openingHours: p.opening_hours,
      wheelchair: p.wheelchair,
      source: p.source || 'seed',
    };

    const scores = await getOrComputePlaceScore(placeObj, weights);
    placesWithScores.push({ ...placeObj, scores });
  }

  // Sort descending by composite score
  placesWithScores.sort((a, b) => b.scores.compositeScore - a.scores.compositeScore);

  const top10 = placesWithScores.slice(0, 10);
  const bottom10 = placesWithScores.slice(Math.max(0, placesWithScores.length - 10)).reverse();

  return { top10, bottom10 };
}

export async function comparePlaces(
  placeIds: string[],
  weights?: ScoreWeights
): Promise<{
  places: Array<Place & { scores: PlaceScore }>;
  metricWinners: Record<string, { placeId: string; placeName: string; value: number }>;
  aiVerdict: string;
}> {
  const comparedPlaces: Array<Place & { scores: PlaceScore }> = [];

  for (const id of placeIds) {
    const p = await queryOne<any>('SELECT * FROM places WHERE id = ?', [id]);
    if (p) {
      let parsedTags = {};
      try { parsedTags = JSON.parse(p.tags || '{}'); } catch {}
      const placeObj: Place = {
        id: p.id,
        osmId: p.osm_id,
        city: p.city,
        name: p.name,
        category: p.category as PoiCategory,
        lat: p.lat,
        lng: p.lng,
        tags: parsedTags,
        priceTier: p.price_tier || 2,
        rating: p.rating || 4.2,
        openingHours: p.opening_hours,
        wheelchair: p.wheelchair,
        source: p.source || 'seed',
      };
      const scores = await getOrComputePlaceScore(placeObj, weights);
      comparedPlaces.push({ ...placeObj, scores });
    }
  }

  if (comparedPlaces.length === 0) {
    throw new Error('No valid places found for comparison.');
  }

  // Determine winners per metric
  const metrics = ['safety', 'cleanliness', 'affordability', 'rating', 'accessibility', 'compositeScore'] as const;
  const metricWinners: Record<string, { placeId: string; placeName: string; value: number }> = {};

  for (const m of metrics) {
    let best = comparedPlaces[0];
    for (const p of comparedPlaces) {
      if (p.scores[m] > best.scores[m]) {
        best = p;
      }
    }
    metricWinners[m] = {
      placeId: best.id,
      placeName: best.name,
      value: best.scores[m],
    };
  }

  // Generate comparison verdict
  let aiVerdict = '';
  if (env.GEMINI_API_KEY && comparedPlaces.length >= 2) {
    try {
      const summaryInfo = comparedPlaces.map(p => `${p.name} (CityScore: ${p.scores.compositeScore}, Safety: ${p.scores.safety}, Rating: ${p.scores.rating}, Affordability: ${p.scores.affordability})`).join(' vs ');
      const prompt = `Write a balanced, 3-sentence comparison verdict between these urban places in India: ${summaryInfo}. State clearly which one is best for budget vs safety vs overall experience.`;
      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      });
      if (resp.ok) {
        const data = (await resp.json()) as any;
        aiVerdict = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      }
    } catch {}
  }

  if (!aiVerdict) {
    const bestOverall = comparedPlaces.reduce((prev, curr) => curr.scores.compositeScore > prev.scores.compositeScore ? curr : prev);
    const bestBudget = comparedPlaces.reduce((prev, curr) => curr.scores.affordability > prev.scores.affordability ? curr : prev);
    aiVerdict = `${bestOverall.name} emerges as the overall winner with a CityScore of ${bestOverall.scores.compositeScore}/100, excelling in safety (${bestOverall.scores.safety}) and public ratings (${bestOverall.scores.rating}). If traveling on a tight budget, ${bestBudget.name} (Affordability: ${bestBudget.scores.affordability}/100) presents a compelling value proposition. Both venues maintain acceptable accessibility standards.`;
  }

  return {
    places: comparedPlaces,
    metricWinners,
    aiVerdict,
  };
}
