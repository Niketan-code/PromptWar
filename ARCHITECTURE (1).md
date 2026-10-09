# ARCHITECTURE.md: CityPulse System Design

> HOW the system is built. Requirements live in PRD.md.

## 1. High-Level Overview

```
┌──────────────────────────── Browser (React + Vite + TS) ────────────────────────────┐
│  Map (Leaflet/MapLibre) · Panels · Zustand store · Recharts · Web Speech · Geoloc   │
└───────────────┬──────────────────────────────────────────────────────────────────────┘
                │ REST (JSON, zod-validated)
┌───────────────▼──────────────────── Express API (Node) ─────────────────────────────┐
│ routes → controllers → services → repositories                                      │
│                                                                                     │
│  Services: poi · heritage · weather · report · nlp · verification · risk · route    │
│            · cityscore · social · analytics · concierge · seed                      │
└──────┬───────────────┬──────────────────┬──────────────────┬───────────────────────┘
       │               │                  │                  │
  SQLite (WAL)    /uploads (EXIF-    External APIs      Gemini (optional)
  better-sqlite3   stripped images)  Overpass · Nominatim  + rule-based NLP fallback
                                     OSRM · Open-Meteo
```

## 2. Repository Structure
```
citypulse/
├── client/
│   ├── src/
│   │   ├── app/              # App shell, routing, providers
│   │   ├── components/       # ui/, map/, panels/, charts/, layout/
│   │   ├── features/         # explore, heritage, safety, compare, insights, report, concierge, demo
│   │   ├── store/            # Zustand slices
│   │   ├── hooks/            # useGeolocation, useSpeech, useDebounce, useMapBounds
│   │   ├── lib/              # api client, formatters, a11y helpers
│   │   └── styles/           # tokens.css, tailwind config
│   └── index.html
├── server/
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── middleware/       # error, rateLimit, validate, upload
│   │   ├── lib/              # httpClient (timeout/retry), cache, geo utils, logger
│   │   ├── db/               # schema.sql, migrations, connection
│   │   ├── seed/             # seed.ts + JSON fixtures
│   │   └── config/           # env.ts (zod), city.config.ts
│   ├── uploads/              # gitignored
│   └── tests/
├── shared/                   # types, zod schemas, constants (imported by both)
├── .env.example
├── ARCHITECTURE.md DESIGN.md MEMORY.md PRD.md RULES.md TASK.md
└── README.md
```

## 3. Configuration
`server/src/config/city.config.ts` (and mirrored for the client):
```ts
export const CITY = {
  name: "Pune",
  center: { lat: 18.5204, lng: 73.8567 },
  bbox: [18.40, 73.75, 18.65, 73.98], // south, west, north, east
  defaultZoom: 13,
  currency: "INR",
  timezone: "Asia/Kolkata",
};
```
`.env.example`: `PORT`, `CLIENT_ORIGIN`, `GEMINI_API_KEY` (optional), `OVERPASS_URL`, `OSRM_URL`, `NOMINATIM_URL`, `UPLOAD_MAX_MB`, `RATE_LIMIT_PER_MIN`.

## 4. Data Model (SQLite)
```sql
places(id TEXT PK, osm_id TEXT, name, category, lat REAL, lng REAL, tags JSON,
       price_tier INT, rating REAL, source TEXT, fetched_at INT);

reports(id TEXT PK, category, description, lat REAL, lng REAL, severity INT,
        sentiment REAL, photo_path, voice_transcript, spam_flag INT,
        credibility INT, status TEXT,        -- unverified|likely|verified
        cluster_id TEXT, upvotes INT DEFAULT 0, created_at INT,
        resolved_at INT, source TEXT);        -- user|seed

clusters(id TEXT PK, category, centroid_lat, centroid_lng, report_count INT,
         max_severity INT, first_at INT, last_at INT);

risk_zones(id TEXT PK, kind TEXT, lat, lng, radius_m, base_risk REAL,
           night_multiplier REAL, source TEXT);   -- accident|lowlight|seed

place_scores(place_id PK, safety, cleanliness, affordability, rating,
             accessibility, updated_at, source TEXT);

story_cards(place_id PK, body TEXT, generated_by TEXT, created_at INT);

social_posts(id TEXT PK, text, area, ts INT, sentiment REAL, topics JSON,
             source TEXT DEFAULT 'seed');

api_cache(key TEXT PK, value JSON, expires_at INT);

upvotes(report_id, client_hash, PRIMARY KEY(report_id, client_hash));
```
Indexes: `reports(lat,lng)`, `reports(created_at)`, `places(category)`, `api_cache(expires_at)`.

## 5. API Surface (REST, prefix `/api`)
| Method | Path | Purpose |
|---|---|---|
| GET | `/config` | City config |
| GET | `/places?bbox=&category=&budget=&openNow=` | POIs (Overpass, cached) |
| GET | `/places/:id` | Detail plus scores |
| GET | `/heritage?bbox=` | Heritage sites |
| GET | `/heritage/:id/story` | Story card (AI or fallback) |
| POST | `/heritage/trail` | `{start, duration}` to ordered stops plus route |
| GET | `/weather?lat=&lng=` | Current, hourly, AQI, alerts |
| GET | `/traffic?bbox=` | Real or simulated (flagged) |
| POST | `/reports` | multipart: fields, photo, transcript |
| GET | `/reports?bbox=&category=&status=&since=` | Feed |
| POST | `/reports/:id/confirm` | Community upvote |
| GET | `/risk/heatmap?bbox=&night=` | Weighted grid points |
| POST | `/routes/safe` | `{from, to, time}` returns routes with scores plus explanations |
| GET | `/emergency?lat=&lng=` | Nearest police, hospital, pharmacy |
| GET | `/scores/leaderboard?category=&weights=` | Top/Bottom 10 |
| POST | `/scores/compare` | `{placeIds[], weights}` metrics plus verdict |
| GET | `/social/pulse?area=` | Sentiment and topics |
| GET | `/analytics/summary` | Dashboard aggregates |
| POST | `/concierge` | `{query, lat, lng}` filters, results, reasoning |
| GET | `/search?q=` | Nominatim proxy |

All responses: `{ data, meta: { source: "real"|"seed"|"simulated"|"ai", cached: boolean }, error? }`.

## 6. Core Algorithms

### 6.1 NLP Pipeline (`nlp.service`)
1. Try Gemini with a strict JSON schema prompt (category, severity, sentiment, locationHints, spam, toxicity).
2. On missing key, timeout, or invalid JSON: **rule-based fallback**: keyword dictionaries per category, severity from intensity words ("injured", "fire", "urgent"), lexicon-based sentiment, regex for landmark/street hints, spam via repetition and link heuristics.
3. Output validated by zod before DB write.

### 6.2 Credibility Score (0-100)
```
credibility = clamp(
  20 (base)
 + 20 * aiConsistency        // 0..1: text/category/location coherence
 + 15 * hasPhoto
 + min(20, 5 * upvotes)
 + min(15, 5 * (clusterSize - 1))   // corroborating reports within 200 m / 24 h
 + 10 * reputation           // anonymous client hash history, 0..1
 - 40 * spamFlag
, 0, 100)
```
Badges: `<40` Unverified · `40-69` Likely · `>=70` Verified.

### 6.3 Clustering
Haversine distance ≤ 200 m, same category, within 24 h, attach to the nearest cluster else create one. Recompute centroid and counts.

### 6.4 Risk Heatmap
Grid of ~150 m cells. Cell risk = Σ over reports (severity × recencyDecay × credibilityWeight) + Σ over risk_zones (base_risk × distanceFalloff). Time-of-day multiplier: night (20:00-05:00) applies `night_multiplier` for low-light/low-footfall zones. Normalize to 0..1.

### 6.5 Safe Route Score (0-100, higher is safer)
```
risk   = 0.40*avgCellRisk(route) + 0.25*accidentZoneCrossings(norm)
       + 0.20*timeOfDayFactor + 0.15*(1 - emergencyProximity)
score  = round(100 * (1 - clamp(risk,0,1)))
```
Sample the polyline every ~50 m. Return top 3, label Fastest (min duration) and Safest (max score), plus a generated sentence ("Avoids 2 accident-prone junctions; passes within 400 m of a police station").

### 6.6 CityScore
```
CityScore = Σ(wᵢ × metricᵢ) / Σwᵢ      // metrics normalized 0..100
metrics: safety, cleanliness, affordability, rating, accessibility
```
Default weights 1/1/1/1/1, adjustable. Safety and cleanliness derive from nearby verified reports (inverse); affordability from price tier; accessibility from the OSM `wheelchair` tag plus reports; rating from OSM/seed.

### 6.7 AI Concierge
Query to (Gemini or regex parser) to `{category, budget, minSafety, radius, openNow, time}` to SQL/in-memory filter to rank by CityScore and distance to attach "Because..." reasons from actual field values (never invented).

## 7. External Integration Rules
- All outbound calls go through `lib/httpClient` (timeout 8 s, 2 retries with backoff, User-Agent set).
- Cache in `api_cache` (Overpass 24 h, weather 10 min, OSRM 1 h, Nominatim 7 d).
- Respect Nominatim usage policy (1 req/s, identify the app). Debounce client search.
- Each integration has a **fallback**: cached data, then seed data, then an empty state with an explanation.

## 8. Security and Privacy
- zod validation on every route; helmet; CORS allowlist; express-rate-limit (stricter on POST `/reports`).
- Uploads: multer, image/jpeg|png|webp only, ≤ 5 MB, random filenames, **EXIF stripped** (sharp), served from a static path with no directory listing.
- No auth, no PII. Upvote dedupe via a salted hash of IP and UA (not stored raw).
- Secrets only via env; never logged.
- Sanitize all text rendered in the UI (no `dangerouslySetInnerHTML`).

## 9. Frontend Architecture
- **State (Zustand slices):** `mapSlice` (viewport, layers), `exploreSlice`, `safetySlice`, `compareSlice`, `reportSlice`, `uiSlice` (panel, theme, nightMode, demoMode).
- **Data fetching:** thin typed `api` client plus a small cache hook (stale-while-revalidate); abortable on map move; debounced bbox queries.
- **Map:** one `<MapCanvas>` owns the Leaflet instance; layers are independent components (`PoiLayer`, `HeritageLayer`, `HeatLayer`, `RouteLayer`, `ReportLayer`, `TrafficLayer`).
- **Error boundaries** per panel; skeletons while loading.

## 10. Testing Strategy
- **Unit (Vitest):** credibility, clustering, risk grid, safe-route score, CityScore, NLP fallback.
- **Integration:** report submission end-to-end (supertest), seed script idempotency.
- **Manual/browser:** per-milestone smoke test with screenshots (see TASK.md).

## 11. Deployment / Run
- Dev: `npm run dev` (concurrently runs client and server).
- Prod demo: `npm run build && npm start` (Express serves the built client).
- Optional hosting: Render/Railway (server plus SQLite volume) or a single container.
