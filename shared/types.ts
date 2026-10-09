export type ProvenanceSource = 'real' | 'seed' | 'simulated' | 'ai';

export interface CityConfig {
  id: string;
  name: string;
  state: string;
  center: { lat: number; lng: number };
  bbox: [number, number, number, number]; // [south, west, north, east]
  defaultZoom: number;
  popular?: boolean;
}

export type PoiCategory = 'attractions' | 'food' | 'hotels' | 'budget' | 'cafes' | 'parks';

export interface Place {
  id: string;
  osmId?: string;
  city: string;
  name: string;
  category: PoiCategory;
  lat: number;
  lng: number;
  tags?: Record<string, string>;
  priceTier: 1 | 2 | 3; // 1=₹, 2=₹₹, 3=₹₹₹
  rating: number; // 0.0 - 5.0
  openingHours?: string;
  wheelchair?: 'yes' | 'no' | 'limited' | 'unknown';
  distanceMeters?: number;
  scores?: PlaceScore;
  source: ProvenanceSource;
  fetchedAt?: number;
}

export interface PlaceScore {
  placeId: string;
  city: string;
  safety: number; // 0-100
  cleanliness: number; // 0-100
  affordability: number; // 0-100
  rating: number; // 0-100
  accessibility: number; // 0-100
  compositeScore: number; // 0-100 weighted
  reasonText: string;
  source: ProvenanceSource;
}

export type ReportCategory =
  | 'Safety'
  | 'Accident'
  | 'Traffic'
  | 'Cleanliness'
  | 'Pothole'
  | 'Lighting'
  | 'Other';

export type ReportStatus = 'unverified' | 'likely' | 'verified';

export interface CitizenReport {
  id: string;
  city: string;
  category: ReportCategory;
  description: string;
  lat: number;
  lng: number;
  severity: number; // 1 to 5
  sentiment: number; // -1 to +1
  photoPath?: string;
  voiceTranscript?: string;
  spamFlag: boolean;
  credibility: number; // 0-100
  status: ReportStatus;
  clusterId?: string;
  upvotes: number;
  createdAt: number;
  resolvedAt?: number;
  source: ProvenanceSource;
}

export interface ReportCluster {
  id: string;
  city: string;
  category: ReportCategory;
  centroidLat: number;
  centroidLng: number;
  reportCount: number;
  maxSeverity: number;
  firstAt: number;
  lastAt: number;
}

export interface RiskZone {
  id: string;
  city: string;
  kind: 'accident' | 'lowlight' | 'intersection';
  name: string;
  lat: number;
  lng: number;
  radiusM: number;
  baseRisk: number; // 0-1
  nightMultiplier: number;
  source: ProvenanceSource;
}

export interface HeatPoint {
  lat: number;
  lng: number;
  weight: number;
}

export interface RouteAlternative {
  id: string;
  summary: string;
  distanceKm: number;
  durationMin: number;
  safetyScore: number; // 0-100
  riskFactor: number;
  isFastest: boolean;
  isSafest: boolean;
  reason: string;
  coordinates: [number, number][]; // [lat, lng]
  accidentZoneCrossings: number;
  emergencyProximityKm: number;
}

export interface EmergencyFacility {
  id: string;
  name: string;
  type: 'police' | 'hospital' | 'pharmacy';
  lat: number;
  lng: number;
  distanceKm: number;
  phone?: string;
  address?: string;
}

export interface WeatherAlert {
  id: string;
  type: 'rain' | 'heat' | 'aqi' | 'storm';
  severity: 'info' | 'warning' | 'critical';
  headline: string;
  advice: string;
  metricValue: string;
}

export interface WeatherData {
  city: string;
  current: {
    temp: number;
    humidity: number;
    windSpeed: number;
    weatherCode: number;
    weatherText: string;
    aqi: number;
    aqiStatus: 'Good' | 'Moderate' | 'Poor' | 'Unhealthy' | 'Hazardous';
  };
  hourly: Array<{
    time: string;
    temp: number;
    precipProb: number;
  }>;
  alerts: WeatherAlert[];
  source: ProvenanceSource;
}

export interface HeritagePlace extends Place {
  historicType?: string;
  heritageStatus?: string;
  architecturalStyle?: string;
}

export interface HeritageStoryCard {
  placeId: string;
  name: string;
  historyText: string;
  culturalSignificance: string;
  traditionFestivalTip: string;
  generatedBy: 'ai' | 'fallback';
  createdAt: number;
}

export interface HeritageTrail {
  durationMinutes: number;
  totalDistanceKm: number;
  estimatedWalkMinutes: number;
  stops: Array<{
    place: HeritagePlace;
    order: number;
  }>;
  routeCoordinates: [number, number][];
}

export interface ScoreWeights {
  safety: number;
  cleanliness: number;
  affordability: number;
  rating: number;
  accessibility: number;
}

export interface SocialPost {
  id: string;
  city: string;
  area: string;
  text: string;
  timestamp: number;
  sentiment: number;
  topics: string[];
  source: ProvenanceSource;
}

export interface AnalyticsSummary {
  city: string;
  totalReports: number;
  verifiedCount: number;
  unverifiedCount: number;
  verifiedRatioPercent: number;
  avgResolutionDays: number;
  reportsByCategory: Record<string, number>;
  dailyTrends: Array<{ date: string; count: number }>;
  hotspotRankings: Array<{ area: string; reportCount: number; riskLevel: string }>;
  sentimentByArea: Array<{ area: string; positive: number; neutral: number; negative: number }>;
  source: ProvenanceSource;
}

export interface ConciergeQueryResponse {
  query: string;
  parsedFilters: {
    category?: PoiCategory;
    budgetTier?: number;
    minSafetyScore?: number;
    radiusKm?: number;
    openNow?: boolean;
  };
  reasoning: string;
  results: Place[];
  source: ProvenanceSource;
}

export interface ApiResponse<T> {
  data: T;
  meta: {
    source: ProvenanceSource;
    cached: boolean;
    timestamp?: number;
  };
  error?: string;
}
