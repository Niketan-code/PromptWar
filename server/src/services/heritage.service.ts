import { HeritagePlace, HeritageStoryCard, HeritageTrail } from '../../../shared/types.js';
import { fetchWithRetry } from '../lib/httpClient.js';
import { getCache, setCache } from './cache.service.js';
import { queryAll, queryOne, execute } from '../db/connection.js';
import { getCityConfig } from '../config/city.config.js';
import { haversineDistanceKm } from '../lib/geo.js';
import { env } from '../config/env.js';

export async function fetchHeritagePlaces(
  cityId: string,
  bbox?: [number, number, number, number]
): Promise<HeritagePlace[]> {
  const city = getCityConfig(cityId);
  const activeBbox = bbox || city.bbox;
  const cacheKey = `heritage:${city.id}:${activeBbox.map(b => b.toFixed(2)).join(',')}`;

  const cached = await getCache<HeritagePlace[]>(cacheKey);
  if (cached && cached.length > 0) return cached;

  // Check DB
  const dbHeritage = await queryAll<any>(
    "SELECT * FROM places WHERE city = ? AND (category = 'attractions' OR category = 'heritage') AND tags LIKE '%historic%'",
    [city.id]
  );
  if (dbHeritage.length > 0) {
    const formatted = dbHeritage.map((row) => ({
      ...row,
      category: 'attractions' as const,
      historicType: 'Monuments & Forts',
      heritageStatus: 'State Protected',
      tags: JSON.parse(row.tags || '{}'),
      source: row.source || 'real',
    }));
    await setCache(cacheKey, formatted, 3600 * 24);
    return formatted;
  }

  // Overpass heritage query
  const [south, west, north, east] = activeBbox;
  const query = `
    [out:json][timeout:8];
    (
      node["historic"](${south},${west},${north},${east});
      way["historic"](${south},${west},${north},${east});
    );
    out center 25;
  `;

  let heritageList: HeritagePlace[] = [];
  try {
    const resp = await fetchWithRetry('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: `data=${encodeURIComponent(query)}`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeoutMs: 6000,
      retries: 1,
    });
    if (resp.ok) {
      const json = (await resp.json()) as any;
      if (json.elements && json.elements.length > 0) {
        heritageList = json.elements.map((el: any): HeritagePlace => {
          const lat = el.lat || el.center?.lat;
          const lng = el.lon || el.center?.lon;
          const name = el.tags?.name || el.tags?.['name:en'] || 'Heritage Site';
          return {
            id: `heritage-osm-${el.id}`,
            osmId: String(el.id),
            city: city.id,
            name,
            category: 'attractions',
            lat,
            lng,
            tags: el.tags,
            priceTier: 1,
            rating: 4.7,
            openingHours: el.tags?.opening_hours || '09:00 AM - 06:00 PM',
            wheelchair: el.tags?.wheelchair === 'yes' ? 'yes' : 'limited',
            historicType: el.tags?.historic || 'monument',
            heritageStatus: el.tags?.heritage ? 'National Heritage' : 'Historical Landmark',
            source: 'real',
            fetchedAt: Date.now(),
          };
        });
      }
    }
  } catch (err) {
    console.warn(`Heritage Overpass fetch failed, using curated landmarks for ${city.name}`);
  }

  if (heritageList.length === 0) {
    heritageList = getCuratedHeritageForCity(city.id, city.center.lat, city.center.lng);
  }

  // Persist into DB
  for (const h of heritageList) {
    await execute(
      `INSERT OR REPLACE INTO places (id, osm_id, city, name, category, lat, lng, tags, price_tier, rating, opening_hours, wheelchair, source, fetched_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        h.id,
        h.osmId || null,
        h.city,
        h.name,
        h.category,
        h.lat,
        h.lng,
        JSON.stringify(h.tags || { historic: h.historicType || 'monument' }),
        h.priceTier,
        h.rating,
        h.openingHours || null,
        h.wheelchair || 'limited',
        h.source,
        Date.now(),
      ]
    );
  }

  await setCache(cacheKey, heritageList, 3600 * 24);
  return heritageList;
}

export function getCuratedHeritageForCity(cityId: string, lat: number, lng: number): HeritagePlace[] {
  // Rich landmark presets for Pune, Mumbai, and other cities
  const citySites: Record<string, Array<{ name: string; type: string; offset: [number, number]; desc: string }>> = {
    pune: [
      { name: 'Shaniwar Wada Fort Palace', type: 'Fortress', offset: [-0.001, -0.003], desc: 'Seat of the Maratha Peshwas built in 1732' },
      { name: 'Aga Khan Palace', type: 'Palace Memorial', offset: [0.038, 0.052], desc: 'National monument where Mahatma Gandhi was interned' },
      { name: 'Lal Mahal (Red Palace)', type: 'Historical Palace', offset: [0.001, -0.001], desc: '16th century residence of Chhatrapati Shivaji Maharaj' },
      { name: 'Pataleshwar Cave Temple', type: 'Rock-cut Temple', offset: [0.012, -0.012], desc: '8th century Rashtrakuta rock-cut architectural marvel' },
      { name: 'Vishrambaug Wada', type: 'Wada Architecture', offset: [-0.006, -0.005], desc: 'Ornate 19th century timber palace with carved pillars' },
      { name: 'Sinhagad Fort Outpost', type: 'Hill Fort', offset: [-0.15, -0.08], desc: 'Iconic fortress celebrated for legendary battlefield valor' },
    ],
    mumbai: [
      { name: 'Gateway of India', type: 'Arch Monument', offset: [-0.18, -0.04], desc: '20th century basalt arch monument facing the Arabian Sea' },
      { name: 'Chhatrapati Shivaji Maharaj Terminus', type: 'UNESCO Heritage Railway', offset: [-0.13, -0.04], desc: 'Gothic revival architectural masterpiece built in 1887' },
      { name: 'Elephanta Caves Dock', type: 'Ancient Rock Cave', offset: [-0.12, 0.04], desc: 'UNESCO World Heritage rock-cut cave temples' },
      { name: 'Flora Fountain & Heritage Mile', type: 'Heritage Square', offset: [-0.14, -0.04], desc: '1864 ornamental stone fountain at Hutatma Chowk' },
      { name: 'Bandra Fort (Castella de Aguada)', type: 'Coastal Fort', offset: [0.05, -0.07], desc: '1640 Portuguese sea fortress overlooking Mahim Bay' },
    ],
  };

  const selected = citySites[cityId] || [
    { name: 'Old Town Heritage Bastion', type: 'Fort', offset: [0.005, 0.003], desc: 'Ancient city stronghold' },
    { name: 'Royal Stepwell & Pavilions', type: 'Stepwell', offset: [-0.008, 0.012], desc: 'Carved subterranean water structure' },
    { name: 'Centennial Clock Tower', type: 'Monument', offset: [0.015, -0.009], desc: 'Iconic civic landmark' },
    { name: 'Victory Memorial Arch', type: 'Arch', offset: [-0.012, -0.015], desc: 'Memorial celebrating historic triumphs' },
  ];

  return selected.map((s, idx) => ({
    id: `heritage-${cityId}-${idx}`,
    osmId: `h-${idx}`,
    city: cityId,
    name: s.name,
    category: 'attractions',
    lat: Number((lat + s.offset[0]).toFixed(5)),
    lng: Number((lng + s.offset[1]).toFixed(5)),
    tags: { historic: s.type, description: s.desc },
    priceTier: 1,
    rating: 4.8,
    openingHours: '09:00 AM - 06:00 PM',
    wheelchair: 'limited',
    historicType: s.type,
    heritageStatus: 'Historic Monument',
    source: 'seed',
    fetchedAt: Date.now(),
  }));
}

export async function getStoryCard(placeId: string, placeName: string, cityId: string): Promise<HeritageStoryCard> {
  // 1. Check existing story card in DB
  const existing = await queryOne<any>('SELECT * FROM story_cards WHERE place_id = ?', [placeId]);
  if (existing) {
    return {
      placeId: existing.place_id,
      name: placeName,
      historyText: existing.history_text,
      culturalSignificance: existing.cultural_significance,
      traditionFestivalTip: existing.tradition_festival_tip,
      generatedBy: existing.generated_by as any,
      createdAt: existing.created_at,
    };
  }

  // 2. Try Gemini if API key is provided
  if (env.GEMINI_API_KEY) {
    try {
      const prompt = `You are an expert Indian historian and cultural guide. For the heritage site "${placeName}" in ${cityId}, provide a structured JSON response:
{
  "historyText": "Exactly 3 concise sentences describing when it was built, who built it, and its historical role.",
  "culturalSignificance": "1-2 sentences on its artistic, architectural, or social legacy.",
  "traditionFestivalTip": "1 practical local tip about festivals, best visiting hours, or nearby traditional crafts/sweets."
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
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const parsed = JSON.parse(text);
          const card: HeritageStoryCard = {
            placeId,
            name: placeName,
            historyText: parsed.historyText,
            culturalSignificance: parsed.culturalSignificance,
            traditionFestivalTip: parsed.traditionFestivalTip,
            generatedBy: 'ai',
            createdAt: Date.now(),
          };
          await saveStoryCard(card);
          return card;
        }
      }
    } catch (e) {
      console.warn('Gemini call failed, falling back to rule-based heritage card', e);
    }
  }

  // 3. Deterministic rule-based template fallback
  const card: HeritageStoryCard = generateTemplateStoryCard(placeId, placeName, cityId);
  await saveStoryCard(card);
  return card;
}

function generateTemplateStoryCard(placeId: string, name: string, cityId: string): HeritageStoryCard {
  return {
    placeId,
    name,
    historyText: `${name} stands as an enduring architectural icon deeply woven into the historical fabric of ${cityId}. Erected centuries ago by visionary builders, it survived crucial political transitions and regional transformations. Today, its preserved bastions and courtyards offer visitors an authentic window into ancient urban life.`,
    culturalSignificance: `Renowned for its distinctive regional masonry and craftsmanship, it represents the resilience, pride, and artistic heritage of the local community.`,
    traditionFestivalTip: `Best visited during early morning hours or lit up during Diwali and local cultural festivals; don't miss nearby artisanal sweet shops for authentic regional delicacies.`,
    generatedBy: 'fallback',
    createdAt: Date.now(),
  };
}

async function saveStoryCard(card: HeritageStoryCard): Promise<void> {
  await execute(
    `INSERT OR REPLACE INTO story_cards (place_id, history_text, cultural_significance, tradition_festival_tip, generated_by, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      card.placeId,
      card.historyText,
      card.culturalSignificance,
      card.traditionFestivalTip,
      card.generatedBy,
      card.createdAt,
    ]
  );
}

export async function generateHeritageTrail(
  cityId: string,
  durationMinutes: number = 120,
  startLat?: number,
  startLng?: number
): Promise<HeritageTrail> {
  const city = getCityConfig(cityId);
  const places = await fetchHeritagePlaces(city.id);
  if (places.length === 0) {
    throw new Error('No heritage places available to generate a trail.');
  }

  const originLat = startLat ?? city.center.lat;
  const originLng = startLng ?? city.center.lng;

  // Maximum stops based on time: 1h -> 3 stops, 2h -> 4-5 stops, 4h (half-day) -> 6-8 stops
  const maxStops = durationMinutes <= 60 ? 3 : durationMinutes <= 120 ? 4 : 6;

  // Nearest-neighbor ordering
  const unvisited = [...places];
  const orderedStops: Array<{ place: HeritagePlace; order: number }> = [];
  let currLat = originLat;
  let currLng = originLng;

  while (unvisited.length > 0 && orderedStops.length < maxStops) {
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < unvisited.length; i++) {
      const d = haversineDistanceKm(currLat, currLng, unvisited[i].lat, unvisited[i].lng);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }
    const [picked] = unvisited.splice(bestIdx, 1);
    orderedStops.push({ place: picked, order: orderedStops.length + 1 });
    currLat = picked.lat;
    currLng = picked.lng;
  }

  // Fetch walking route polyline via OSRM public server
  const coordsParam = orderedStops.map(s => `${s.place.lng},${s.place.lat}`).join(';');
  let routeCoordinates: [number, number][] = orderedStops.map(s => [s.place.lat, s.place.lng]);
  let totalDistanceKm = 0;
  let estimatedWalkMinutes = Math.round(durationMinutes * 0.7);

  try {
    const osrmUrl = `https://router.project-osrm.org/route/v1/foot/${coordsParam}?overview=full&geometries=geojson`;
    const resp = await fetchWithRetry(osrmUrl, { timeoutMs: 4000, retries: 1 });
    if (resp.ok) {
      const data = (await resp.json()) as any;
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        totalDistanceKm = Number((route.distance / 1000).toFixed(2));
        estimatedWalkMinutes = Math.round(route.duration / 60);
        routeCoordinates = route.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);
      }
    }
  } catch {
    // If OSRM foot routing is unavailable, connect stops with direct line
    totalDistanceKm = 0;
    for (let i = 0; i < orderedStops.length - 1; i++) {
      totalDistanceKm += haversineDistanceKm(
        orderedStops[i].place.lat,
        orderedStops[i].place.lng,
        orderedStops[i + 1].place.lat,
        orderedStops[i + 1].place.lng
      );
    }
    totalDistanceKm = Number(totalDistanceKm.toFixed(2));
    estimatedWalkMinutes = Math.round((totalDistanceKm / 4.0) * 60); // 4km/h walking speed
  }

  return {
    durationMinutes,
    totalDistanceKm,
    estimatedWalkMinutes,
    stops: orderedStops,
    routeCoordinates,
  };
}
