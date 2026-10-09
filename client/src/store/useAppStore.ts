import { create } from 'zustand';
import {
  CityConfig,
  Place,
  HeritagePlace,
  HeritageStoryCard,
  HeritageTrail,
  WeatherData,
  CitizenReport,
  RouteAlternative,
  EmergencyFacility,
  ScoreWeights,
  PoiCategory,
} from '../../../shared/types';
import { DEFAULT_CITY, INDIAN_CITIES } from '../config/city.config';

export type Pillar = 'explore' | 'heritage' | 'safety' | 'compare' | 'insights';

interface AppState {
  // City
  activeCity: CityConfig;
  supportedCities: CityConfig[];
  setActiveCity: (city: CityConfig) => void;

  // View & Pillar
  activePillar: Pillar;
  setActivePillar: (pillar: Pillar) => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  nightMode: boolean;
  toggleNightMode: () => void;

  // Map state
  mapCenter: [number, number];
  mapZoom: number;
  flyToCoords: [number, number] | null;
  setFlyTo: (coords: [number, number] | null, zoom?: number) => void;

  // Layers
  layers: {
    heatmap: boolean;
    heritage: boolean;
    traffic: boolean;
    reports: boolean;
  };
  toggleLayer: (layer: 'heatmap' | 'heritage' | 'traffic' | 'reports') => void;

  // Explore
  selectedCategory: PoiCategory;
  setSelectedCategory: (cat: PoiCategory) => void;
  budgetFilter?: 1 | 2 | 3;
  setBudgetFilter: (tier?: 1 | 2 | 3) => void;
  openNowFilter: boolean;
  setOpenNowFilter: (val: boolean) => void;
  places: Place[];
  setPlaces: (places: Place[]) => void;
  selectedPlace: Place | null;
  setSelectedPlace: (place: Place | null) => void;
  savedPlaces: Place[];
  toggleSavePlace: (place: Place) => void;

  // Heritage
  heritagePlaces: HeritagePlace[];
  setHeritagePlaces: (places: HeritagePlace[]) => void;
  activeStoryCard: HeritageStoryCard | null;
  setActiveStoryCard: (card: HeritageStoryCard | null) => void;
  heritageTrail: HeritageTrail | null;
  setHeritageTrail: (trail: HeritageTrail | null) => void;

  // Safety & Routing
  safeRoutes: RouteAlternative[];
  setSafeRoutes: (routes: RouteAlternative[]) => void;
  selectedRoute: RouteAlternative | null;
  setSelectedRoute: (route: RouteAlternative | null) => void;
  emergencyDrawerOpen: boolean;
  setEmergencyDrawerOpen: (open: boolean) => void;
  emergencyFacilities: EmergencyFacility[];
  setEmergencyFacilities: (facs: EmergencyFacility[]) => void;

  // Compare & Leaderboard
  compareList: Place[];
  addToCompare: (place: Place) => void;
  removeFromCompare: (id: string) => void;
  clearCompare: () => void;
  scoreWeights: ScoreWeights;
  setScoreWeight: (key: keyof ScoreWeights, value: number) => void;

  // Citizen Reports
  reports: CitizenReport[];
  clusters: any[];
  setReports: (reports: CitizenReport[], clusters?: any[]) => void;
  reportModalOpen: boolean;
  setReportModalOpen: (open: boolean) => void;

  // Weather & Insights
  weather: WeatherData | null;
  setWeather: (weather: WeatherData | null) => void;

  // AI Concierge
  conciergeOpen: boolean;
  setConciergeOpen: (open: boolean) => void;

  // Demo Mode
  demoMode: boolean;
  demoStep: number;
  setDemoMode: (active: boolean) => void;
  setDemoStep: (step: number) => void;

  // Command Palette
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;

  // Global loading
  loading: boolean;
  setLoading: (l: boolean) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  activeCity: DEFAULT_CITY,
  supportedCities: INDIAN_CITIES,
  setActiveCity: (city) => {
    set({
      activeCity: city,
      mapCenter: [city.center.lat, city.center.lng],
      mapZoom: city.defaultZoom,
      flyToCoords: [city.center.lat, city.center.lng],
      selectedPlace: null,
      heritageTrail: null,
      safeRoutes: [],
      selectedRoute: null,
    });
  },

  activePillar: 'explore',
  setActivePillar: (pillar) => set({ activePillar: pillar }),
  theme: 'dark',
  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    set({ theme: next });
  },
  nightMode: false,
  toggleNightMode: () => set((state) => ({ nightMode: !state.nightMode })),

  mapCenter: [DEFAULT_CITY.center.lat, DEFAULT_CITY.center.lng],
  mapZoom: DEFAULT_CITY.defaultZoom,
  flyToCoords: null,
  setFlyTo: (coords, zoom) => set({ flyToCoords: coords, mapZoom: zoom ?? get().mapZoom }),

  layers: {
    heatmap: false,
    heritage: true,
    traffic: false,
    reports: true,
  },
  toggleLayer: (layer) =>
    set((state) => ({
      layers: { ...state.layers, [layer]: !state.layers[layer] },
    })),

  selectedCategory: 'food',
  setSelectedCategory: (cat) => set({ selectedCategory: cat }),
  budgetFilter: undefined,
  setBudgetFilter: (tier) => set({ budgetFilter: tier }),
  openNowFilter: false,
  setOpenNowFilter: (val) => set({ openNowFilter: val }),
  places: [],
  setPlaces: (places) => set({ places }),
  selectedPlace: null,
  setSelectedPlace: (place) => set({ selectedPlace: place }),
  savedPlaces: [],
  toggleSavePlace: (place) =>
    set((state) => {
      const exists = state.savedPlaces.some((p) => p.id === place.id);
      return {
        savedPlaces: exists
          ? state.savedPlaces.filter((p) => p.id !== place.id)
          : [...state.savedPlaces, place],
      };
    }),

  heritagePlaces: [],
  setHeritagePlaces: (places) => set({ heritagePlaces: places }),
  activeStoryCard: null,
  setActiveStoryCard: (card) => set({ activeStoryCard: card }),
  heritageTrail: null,
  setHeritageTrail: (trail) => set({ heritageTrail: trail }),

  safeRoutes: [],
  setSafeRoutes: (routes) => set({ safeRoutes: routes }),
  selectedRoute: null,
  setSelectedRoute: (route) => set({ selectedRoute: route }),
  emergencyDrawerOpen: false,
  setEmergencyDrawerOpen: (open) => set({ emergencyDrawerOpen: open }),
  emergencyFacilities: [],
  setEmergencyFacilities: (facs) => set({ emergencyFacilities: facs }),

  compareList: [],
  addToCompare: (place) =>
    set((state) => {
      if (state.compareList.length >= 3 || state.compareList.some((p) => p.id === place.id)) {
        return state;
      }
      return { compareList: [...state.compareList, place] };
    }),
  removeFromCompare: (id) =>
    set((state) => ({
      compareList: state.compareList.filter((p) => p.id !== id),
    })),
  clearCompare: () => set({ compareList: [] }),
  scoreWeights: {
    safety: 1,
    cleanliness: 1,
    affordability: 1,
    rating: 1,
    accessibility: 1,
  },
  setScoreWeight: (key, val) =>
    set((state) => ({
      scoreWeights: { ...state.scoreWeights, [key]: val },
    })),

  reports: [],
  clusters: [],
  setReports: (reports, clusters) =>
    set((state) => ({
      reports,
      clusters: clusters ?? state.clusters,
    })),
  reportModalOpen: false,
  setReportModalOpen: (open) => set({ reportModalOpen: open }),

  weather: null,
  setWeather: (weather) => set({ weather }),

  conciergeOpen: false,
  setConciergeOpen: (open) => set({ conciergeOpen: open }),

  demoMode: false,
  demoStep: 0,
  setDemoMode: (active) => set({ demoMode: active, demoStep: 0 }),
  setDemoStep: (step) => set({ demoStep: step }),

  commandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),

  loading: false,
  setLoading: (l) => set({ loading: l }),
}));
