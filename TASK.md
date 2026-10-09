# TASK.md: CityPulse Task Board

> Work milestone by milestone (M1 → M7). All milestones completed and verified.
> Priority tags match PRD.md: **P0** must ship, **P1** should ship, **P2** nice to have.

---

## M0: Setup and Planning
- [x] Read RULES.md, MEMORY.md, PRD.md, ARCHITECTURE.md, DESIGN.md
- [x] Produce the implementation plan artifact (architecture, folders, data model, APIs, milestones)
- [x] Set the target city in `city.config.ts` and record it in MEMORY.md (Pune & Mumbai + All Indian Cities)

---

## M1: Scaffold, Map, Explore
**Goal:** a working map with real POIs and a detail drawer.
- [x] (P0) Monorepo scaffold: `client/`, `server/`, `shared/`, single `npm run dev` (concurrently)
- [x] (P0) `.env.example`, env validation (zod), `city.config.ts`
- [x] (P0) Express app: error middleware, CORS, helmet, rate limit, `{data, meta, error}` envelope
- [x] (P0) SQLite setup, `schema.sql`, `api_cache` table and helper
- [x] (P0) `lib/httpClient` with timeout, retry, User-Agent
- [x] (P0) Tailwind plus design tokens from DESIGN.md (dark/light), fonts loaded
- [x] (P0) App shell: icon rail, glass panel, full-screen map (mobile: bottom tab bar)
- [x] (P0) Geolocation "near me" with permission-denied fallback
- [x] (P0) `GET /places` via Overpass for the viewport (cached) plus category chips
- [x] (P0) Place detail drawer (tags, hours, price tier, distance, Save, Compare)
- [x] (P1) Budget slider, "open now" toggle
- [x] (P1) Marker clustering & custom SVG pins
- [x] (P0) Skeleton, empty, and error states for the Explore list

---

## M2: Weather and Heritage
**Goal:** live weather alerts and the heritage experience.
- [x] (P0) `GET /weather` (Open-Meteo): current, hourly, AQI
- [x] (P0) Alert rules (rain, heat, AQI thresholds) with advice text; `AlertBanner`
- [x] (P0) Weather chip plus forecast panel
- [x] (P0) Heritage layer (OSM `historic=*`, `heritage=*`) with toggle
- [x] (P0) `GET /heritage/:id/story` with Gemini and template fallback, cached in `story_cards`
- [x] (P0) Story Card UI with the "AI-generated, verify locally" chip & Web Speech audio reader
- [x] (P1) Heritage Trail: time chips (1h/2h/half-day), nearest-neighbour ordering, OSRM walking route, numbered stops
- [x] (P1) Animated route drawing

---

## M3: Citizen Reports and NLP
**Goal:** the core engagement loop.
- [x] (P0) DB: `reports`, `upvotes` tables
- [x] (P0) `POST /reports` (multipart) with zod validation, rate limit, upload limits
- [x] (P0) Image handling: type/size checks, **EXIF strip**, random filenames
- [x] (P0) Report form stepper: category, text/voice, draggable pin, photo, review
- [x] (P0) Voice to text via Web Speech API with an unsupported-browser fallback
- [x] (P0) `nlp.service`: Gemini JSON mode plus rule-based fallback (category, severity, sentiment, location hints, spam/toxicity)
- [x] (P0) `GET /reports` with filters; live feed UI
- [x] (P0) Report markers on the map with category icons
- [x] (P1) Success screen showing the classified category and severity
- [x] (P0) Unit tests: NLP fallback

---

## M4: Verification, Risk Heatmap, Safe Route
**Goal:** the demo centerpiece.
- [x] (P0) Clustering service (200 m / 24 h / same category) plus `clusters` table
- [x] (P0) Credibility score service plus badges (Unverified / Likely / Verified)
- [x] (P0) `POST /reports/:id/confirm` (deduped upvotes) and the Confirm button
- [x] (P0) Seed script (`npm run seed`): reports clustered around hotspots, accident zones, low-light zones, all `source: "seed"`
- [x] (P0) Risk grid service plus `GET /risk/heatmap?night=`
- [x] (P0) Heatmap layer with a layer toggle
- [x] (P0) `POST /routes/safe`: OSRM alternatives, safety scoring, Fastest vs Safest, plain-English explanation
- [x] (P0) `RouteCompareCard` UI with animated route drawing
- [x] (P1) Night Mode toggle re-weights risk and visibly changes scores
- [x] (P1) Emergency panel: nearest police, hospital, pharmacy via Overpass; share-location text
- [x] (P0) Unit tests: credibility, clustering, risk grid, safe-route score
- [x] (P0) "Demo data" chips wherever seed data shows

---

## M5: CityScore, Leaderboard, Compare
**Goal:** the Best vs Worst pillar.
- [x] (P0) `place_scores` computation (safety and cleanliness from reports; affordability from price tier; accessibility from the OSM wheelchair tag plus reports; rating from OSM/seed)
- [x] (P0) CityScore function with adjustable weights, plus unit tests
- [x] (P0) Weight sliders UI
- [x] (P0) `GET /scores/leaderboard`: Top 10 / Bottom 10 with a reason string each
- [x] (P0) Compare view: pick 2-3 places, radar chart, table with per-metric winner highlight
- [x] (P0) AI verdict paragraph (Gemini with template fallback)
- [x] (P1) Compare button wired from the place drawer

---

## M6: Social Pulse, Analytics, Concierge
**Goal:** the insights layer and the AI chat.
- [x] (P1) Seed social posts JSON (labelled "sample social data")
- [x] (P1) Sentiment plus topic extraction per area; trending issues list; sentiment trend chart
- [x] (P1) `GET /analytics/summary`: reports by category/day, hotspot ranking, verified ratio, average resolution time, sentiment by area
- [x] (P1) Analytics dashboard (Recharts, lazy-loaded)
- [x] (P1) Traffic layer: labelled **Simulated** time-of-day layer
- [x] (P0) `POST /concierge`: query to structured filters to ranked results
- [x] (P0) Concierge chat UI with result cards and a "Because..." line built from real fields
- [x] (P0) Pins for concierge results sync to the map

---

## M7: Polish, Demo Mode, Docs
**Goal:** judge-ready.
- [x] (P0) Demo Mode: scripted walkthrough per DESIGN.md §10 (≈3 min), with pause/skip
- [x] (P1) Command palette (Ctrl/⌘+K)
- [x] (P1) Theme toggle polish, layer control, micro-interactions
- [x] (P0) Privacy note in the UI
- [x] (P0) Accessibility pass: contrast, focus rings, ARIA, list alternative to the map, reduced motion
- [x] (P0) Responsive pass at 375 px and 1280 px
- [x] (P0) Error and offline pass: graceful fallbacks and no blank screens
- [x] (P0) README: setup, env vars, architecture diagram, API list, demo script, known limitations
- [x] (P0) Walkthrough artifact
- [x] (P0) Run the full Definition of Done below

---

## Definition of Done (Verified)
- [x] `npm install && npm run dev` runs with zero errors
- [x] Works with the Gemini key removed and with it set
- [x] **Journey 1:** find cheap food nearby via the Concierge
- [x] **Journey 2:** build and view a heritage trail with a Story Card
- [x] **Journey 3:** submit a photo plus voice report and see the cluster and badge
- [x] **Journey 4:** compare two places with the radar chart and verdict
- [x] **Journey 5:** get Fastest vs Safest routes with an explanation, toggle Night Mode
- [x] **Journey 6:** view Analytics and Social Pulse
- [x] All simulated, seeded, and AI content is visibly labelled
- [x] 375 px and desktop layouts both verified
- [x] Unit tests pass (credibility, clustering, risk, safe route, CityScore, NLP fallback)
- [x] README demo script matches the app
