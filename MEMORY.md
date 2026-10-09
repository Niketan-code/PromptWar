# MEMORY.md: CityPulse Project Memory

## 1. Project Snapshot
| Field | Value |
|---|---|
| Project | CityPulse, interactive urban intelligence and safe navigation platform |
| Target city | Configurable: Pune & Mumbai default presets + dynamic search for any city in India |
| Tech Stack | React + Vite + TS, Tailwind CSS, Leaflet, Framer Motion, Zustand, Recharts, Express, SQLite (sql.js WASM) |
| Current milestone | M7 Complete (Demo-ready) |
| Last updated | 2026-10-09 |
| Gemini key present? | Works both ways: optional Gemini API key with robust deterministic rule-based NLP fallback |

## 2. Locked Decisions
| # | Decision | Reason |
|---|---|---|
| D1 | Stack: React + Vite + TS, Tailwind, Framer Motion, Zustand, Recharts | Rapid interactive UI, glassmorphic dark theme, smooth micro-interactions |
| D2 | Map: Leaflet with Dark Matter Carto & OSM tiles | Free-tier friendly, no paid Google/Mapbox keys required |
| D3 | Backend: Node + Express + SQLite (sql.js WebAssembly) | Zero native C++ compilation issues on Node 24 Windows; disk persistence |
| D4 | Free APIs only: Overpass (OSM), Nominatim, OSRM demo, Open-Meteo | No credit card, hackathon safe |
| D5 | Gemini optional with rule-based NLP fallback | Zero dependency on paid API keys; demo never crashes if key is omitted |
| D6 | Anonymous reports, EXIF GPS stripped | Pure buffer APP1 JPEG/PNG stripper guarantees privacy |
| D7 | Dynamic Indian City Switcher & Search | Users can find ANY city across India with live Nominatim geocoding proxy |
| D8 | Transparent Provenance Chips | Live (green dot), Demo data (dashed outline), Simulated (amber), AI-generated (violet) |

## 3. Milestone Progress Log
- `[x]` M0: Setup, Planning, Architecture, Data Model, and Indian cities registry
- `[x]` M1: Scaffold, full-screen map canvas, Overpass POIs, category chips, detail drawer
- `[x]` M2: Live weather (Open-Meteo), AQI alerts, heritage layer, AI story cards with audio, walking trail generator
- `[x]` M3: Citizen report submission (photo + voice notes), NLP classification, clustering, live feed
- `[x]` M4: Credibility scoring (0-100), risk heatmap grid, OSRM Fastest vs Safest routing, Night Mode risk weighting, Emergency SOS hub
- `[x]` M5: CityScore composite weighted rankings, adjustable weight sliders, Top/Bottom 10 leaderboards, multi-place radar compare with AI verdict
- `[x]` M6: Social Pulse with sentiment analysis, Recharts analytics dashboard, simulated traffic congestion overlay, conversational AI Concierge
- `[x]` M7: Automated 3-minute Demo Mode walkthrough, Ctrl+K command palette, Vitest unit tests, README.md, walkthrough artifact

## 4. Change Log
- Built complete full-stack CityPulse monorepo (`client/`, `server/`, `shared/`)
- Added `sql.js` SQLite WebAssembly persistence with disk sync (`citypulse.sqlite`)
- Implemented EXIF GPS privacy stripper in upload middleware
- Added dynamic Indian city resolver supporting Pune, Mumbai, Delhi, Bengaluru, and any user-entered Indian city
- Added 4 unit test suites for credibility, CityScore, rule-based NLP, and Haversine geo formulas (100% passing)
- Built interactive 3-minute Demo Mode walkthrough controller with step captions and automatic feature tours
