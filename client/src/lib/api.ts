import {
  ApiResponse,
  CityConfig,
  Place,
  HeritagePlace,
  HeritageStoryCard,
  HeritageTrail,
  WeatherData,
  CitizenReport,
  RouteAlternative,
  EmergencyFacility,
  HeatPoint,
  ScoreWeights,
  AnalyticsSummary,
  SocialPost,
  ConciergeQueryResponse,
  PoiCategory,
} from '../../../shared/types';

const API_BASE = '/api';

export async function getCityConfig(cityId?: string): Promise<{ activeCity: CityConfig; supportedCities: CityConfig[] }> {
  const url = cityId ? `${API_BASE}/config?city=${encodeURIComponent(cityId)}` : `${API_BASE}/config`;
  const res = await fetch(url);
  const json: ApiResponse<{ activeCity: CityConfig; supportedCities: CityConfig[] }> = await res.json();
  return json.data;
}

export async function searchCities(query: string): Promise<CityConfig[]> {
  const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
  const json: ApiResponse<CityConfig[]> = await res.json();
  return json.data || [];
}

export async function getPlaces(params: {
  city: string;
  category: PoiCategory;
  budget?: number;
  openNow?: boolean;
  bbox?: [number, number, number, number];
}): Promise<Place[]> {
  const sp = new URLSearchParams();
  sp.set('city', params.city);
  sp.set('category', params.category);
  if (params.budget) sp.set('budget', String(params.budget));
  if (params.openNow) sp.set('openNow', 'true');
  if (params.bbox) sp.set('bbox', params.bbox.join(','));

  const res = await fetch(`${API_BASE}/places?${sp.toString()}`);
  const json: ApiResponse<Place[]> = await res.json();
  return json.data || [];
}

export async function getHeritagePlaces(city: string): Promise<HeritagePlace[]> {
  const res = await fetch(`${API_BASE}/heritage?city=${encodeURIComponent(city)}`);
  const json: ApiResponse<HeritagePlace[]> = await res.json();
  return json.data || [];
}

export async function getStoryCard(id: string, name: string, city: string): Promise<HeritageStoryCard> {
  const res = await fetch(`${API_BASE}/heritage/${encodeURIComponent(id)}/story?name=${encodeURIComponent(name)}&city=${encodeURIComponent(city)}`);
  const json: ApiResponse<HeritageStoryCard> = await res.json();
  return json.data;
}

export async function generateHeritageTrail(params: {
  city: string;
  durationMinutes: number;
  startLat?: number;
  startLng?: number;
}): Promise<HeritageTrail> {
  const res = await fetch(`${API_BASE}/heritage/trail`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const json: ApiResponse<HeritageTrail> = await res.json();
  return json.data;
}

export async function getWeather(city: string, lat?: number, lng?: number): Promise<WeatherData> {
  const sp = new URLSearchParams();
  sp.set('city', city);
  if (lat) sp.set('lat', String(lat));
  if (lng) sp.set('lng', String(lng));

  const res = await fetch(`${API_BASE}/weather?${sp.toString()}`);
  const json: ApiResponse<WeatherData> = await res.json();
  return json.data;
}

export async function getReports(city: string, category?: string, status?: string): Promise<{ reports: CitizenReport[]; clusters: any[] }> {
  const sp = new URLSearchParams();
  sp.set('city', city);
  if (category) sp.set('category', category);
  if (status) sp.set('status', status);

  const res = await fetch(`${API_BASE}/reports?${sp.toString()}`);
  const json: ApiResponse<{ reports: CitizenReport[]; clusters: any[] }> = await res.json();
  return json.data;
}

export async function submitReport(formData: FormData): Promise<CitizenReport> {
  const res = await fetch(`${API_BASE}/reports`, {
    method: 'POST',
    body: formData,
  });
  const json: ApiResponse<CitizenReport> = await res.json();
  if (json.error) throw new Error(json.error);
  return json.data;
}

export async function confirmReport(id: string): Promise<{ success: boolean; newUpvotes: number; newCredibility: number; newStatus: string }> {
  const res = await fetch(`${API_BASE}/reports/${encodeURIComponent(id)}/confirm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  const json = await res.json();
  return json.data;
}

export async function getRiskHeatmap(city: string, night: boolean): Promise<HeatPoint[]> {
  const res = await fetch(`${API_BASE}/risk/heatmap?city=${encodeURIComponent(city)}&night=${night}`);
  const json: ApiResponse<HeatPoint[]> = await res.json();
  return json.data || [];
}

export async function getSafeRoutes(params: {
  city: string;
  fromLat: number;
  fromLng: number;
  toLat: number;
  toLng: number;
  isNight: boolean;
}): Promise<RouteAlternative[]> {
  const res = await fetch(`${API_BASE}/routes/safe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const json: ApiResponse<RouteAlternative[]> = await res.json();
  return json.data || [];
}

export async function getEmergencyFacilities(city: string, lat?: number, lng?: number): Promise<EmergencyFacility[]> {
  const sp = new URLSearchParams();
  sp.set('city', city);
  if (lat) sp.set('lat', String(lat));
  if (lng) sp.set('lng', String(lng));

  const res = await fetch(`${API_BASE}/emergency?${sp.toString()}`);
  const json: ApiResponse<EmergencyFacility[]> = await res.json();
  return json.data || [];
}

export async function getLeaderboard(params: {
  city: string;
  category?: PoiCategory;
  weights: ScoreWeights;
}): Promise<{ top10: Place[]; bottom10: Place[] }> {
  const sp = new URLSearchParams();
  sp.set('city', params.city);
  if (params.category) sp.set('category', params.category);
  sp.set('wSafety', String(params.weights.safety));
  sp.set('wClean', String(params.weights.cleanliness));
  sp.set('wAfford', String(params.weights.affordability));
  sp.set('wRating', String(params.weights.rating));
  sp.set('wAccess', String(params.weights.accessibility));

  const res = await fetch(`${API_BASE}/scores/leaderboard?${sp.toString()}`);
  const json: ApiResponse<{ top10: Place[]; bottom10: Place[] }> = await res.json();
  return json.data;
}

export async function comparePlaces(placeIds: string[], weights?: ScoreWeights): Promise<{
  places: Place[];
  metricWinners: Record<string, { placeId: string; placeName: string; value: number }>;
  aiVerdict: string;
}> {
  const res = await fetch(`${API_BASE}/scores/compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ placeIds, weights }),
  });
  const json = await res.json();
  return json.data;
}

export async function getSocialPulse(city: string): Promise<{ posts: SocialPost[]; trendingTopics: string[]; sentimentScore: number }> {
  const res = await fetch(`${API_BASE}/social/pulse?city=${encodeURIComponent(city)}`);
  const json = await res.json();
  return json.data;
}

export async function getAnalyticsSummary(city: string): Promise<AnalyticsSummary> {
  const res = await fetch(`${API_BASE}/analytics/summary?city=${encodeURIComponent(city)}`);
  const json = await res.json();
  return json.data;
}

export async function getTraffic(city: string): Promise<any[]> {
  const res = await fetch(`${API_BASE}/traffic?city=${encodeURIComponent(city)}`);
  const json = await res.json();
  return json.data || [];
}

export async function queryConcierge(query: string, city: string, userLat?: number, userLng?: number): Promise<ConciergeQueryResponse> {
  const res = await fetch(`${API_BASE}/concierge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, city, lat: userLat, lng: userLng }),
  });
  const json = await res.json();
  return json.data;
}
