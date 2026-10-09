# TASK.md: CityPulse Task Board

> Work milestone by milestone (M1 → M7). Tick boxes as you finish. After each milestone: run the app, test in the browser, take a screenshot, and log it in MEMORY.md.
> Priority tags match PRD.md: **P0** must ship, **P1** should ship, **P2** nice to have.

---

## M0: Setup and Planning
- [ ] Read RULES.md, MEMORY.md, PRD.md, ARCHITECTURE.md, DESIGN.md
- [ ] Produce the implementation plan artifact (architecture, folders, data model, APIs, milestones)
- [ ] Set the target city in `city.config.ts` and record it in MEMORY.md

---

## M1: Scaffold, Map, Explore
**Goal:** a working map with real POIs and a detail drawer.
- [ ] (P0) Monorepo scaffold: `client/`, `server/`, `shared/`, single `npm run dev` (concurrently)
- [ ] (P0) `.env.example`, env validation (zod), `city.config.ts`
- [ ] (P0) Express app: error middleware, CORS, helmet, rate limit, `{data, meta, error}` envelope
- [ ] (P0) SQLite setup, `schema.sql`, `api_cache` table and helper
- [ ] (P0) `lib/httpClient` with timeout, retry, User-Agent
- [ ] (P0) Tailwind plus design tokens from DESIGN.md (dark/light), fonts loaded
- [ ] (P0) App shell: icon rail, glass panel, full-screen map (mobile: bottom tab bar)
- [ ] (P0) Geolocation "near me" with permission-denied fallback
- [ ] (P0) `GET /places` via Overpass for the viewport (cached) plus category chips
- [ ] (P0) Place detail drawer (tags, hours, price tier, distance, Save, Compare)
- [ ] (P1) Budget slider, "open now" toggle
- [ ] (P1) Marker clustering
- [ ] (P0) Skeleton, empty, and error states for the Explore list

**Acceptance:** open the app, click "Food", see real pins, open a drawer, and keep working with the network throttled (cached or fallback shown).

---

## M2: Weather and Heritage
**Goal:** live weather alerts and the heritage experience.
- [ ] (P0) `GET /weather` (Open-Meteo): current, hourly, AQI
- [ ] (P0) Alert rules (rain, heat, AQI thresholds) with advice text; `AlertBanner`
- [ ] (P0) Weather chip plus forecast panel
- [ ] (P0) Heritage layer (OSM `historic=*`, `heritage=*`) with toggle
- [ ] (P0) `GET /heritage/:id/story` with Gemini and template fallback, cached in `story_cards`
- [ ] (P0) Story Card UI with the "AI-generated, verify locally" chip
- [ ] (P1) Heritage Trail: time chips (1h/2h/half-day), nearest-neighbour ordering, OSRM walking route, numbered stops
- [ ] (P1) Animated route drawing

**Acceptance:** weather alert appears when thresholds are simulated; the trail renders for a 2h walk; the story card works with the Gemini key removed.

---

## M3: Citizen Reports and NLP
**Goal:** the core engagement loop.
- [ ] (P0) DB: `reports`, `upvotes` tables
- [ ] (P0) `POST /reports` (multipart) with zod validation, rate limit, upload limits
- [ ] (P0) Image handling: type/size checks, **EXIF strip** (sharp), random filenames
- [ ] (P0) Report form stepper: category, text/voice, draggable pin, photo, review
- [ ] (P0) Voice to text via Web Speech API with an unsupported-browser fallback
- [ ] (P0) `nlp.service`: Gemini JSON mode plus rule-based fallback (category, severity, sentiment, location hints, spam/toxicity)
- [ ] (P0) `GET /reports` with filters; live feed UI
- [ ] (P0) Report markers on the map with category icons
- [ ] (P1) Success screen showing the classified category and severity
- [ ] (P0) Unit tests: NLP fallback

**Acceptance:** submit a text-plus-photo report and a voice report; both appear in the feed and on the map with correct classification; the photo has no EXIF GPS.

---

## M4: Verification, Risk Heatmap, Safe Route
**Goal:** the demo centerpiece.
- [ ] (P0) Clustering service (200 m / 24 h / same category) plus `clusters` table
- [ ] (P0) Credibility score service plus badges (Unverified / Likely / Verified)
- [ ] (P0) `POST /reports/:id/confirm` (deduped upvotes) and the Confirm button
- [ ] (P0) Seed script (`npm run seed`): ~150 reports clustered around hotspots, accident zones, low-light zones, all `source: "seed"`
- [ ] (P0) Risk grid service plus `GET /risk/heatmap?night=`
- [ ] (P0) Heatmap layer with a layer toggle
- [ ] (P0) `POST /routes/safe`: OSRM alternatives, safety scoring, Fastest vs Safest, plain-English explanation
- [ ] (P0) `RouteCompareCard` UI with animated route drawing
- [ ] (P1) Night Mode toggle re-weights risk and visibly changes scores
- [ ] (P1) Emergency panel: nearest police, hospital, pharmacy via Overpass; share-location text
- [ ] (P0) Unit tests: credibility, clustering, risk grid, safe-route score
- [ ] (P0) "Demo data" chips wherever seed data shows

**Acceptance:** two nearby reports merge into a cluster and the credibility badge rises after upvotes; the A to B route shows two options with different scores and reasons; Night Mode changes the scores.

---

## M5: CityScore, Leaderboard, Compare
**Goal:** the Best vs Worst pillar.
- [ ] (P0) `place_scores` computation (safety and cleanliness from reports; affordability from price tier; accessibility from the OSM wheelchair tag plus reports; rating from OSM/seed)
- [ ] (P0) CityScore function with adjustable weights, plus unit tests
- [ ] (P0) Weight sliders UI
- [ ] (P0) `GET /scores/leaderboard`: Top 10 / Bottom 10 with a reason string each
- [ ] (P0) Compare view: pick 2-3 places, radar chart, table with per-metric winner highlight
- [ ] (P0) AI verdict paragraph (Gemini with template fallback)
- [ ] (P1) Compare button wired from the place drawer

**Acceptance:** changing a weight reorders the leaderboard; the compare view shows winners per metric and a verdict.

---

## M6: Social Pulse, Analytics, Concierge
**Goal:** the insights layer and the AI chat.
- [ ] (P1) Seed social posts JSON (labelled "sample social data")
- [ ] (P1) Sentiment plus topic extraction per area; trending issues list; sentiment trend chart
- [ ] (P1) `GET /analytics/summary`: reports by category/day, hotspot ranking, verified ratio, average resolution time, sentiment by area
- [ ] (P1) Analytics dashboard (Recharts, lazy-loaded)
- [ ] (P1) Traffic layer: try a free real source; otherwise a labelled **Simulated** time-of-day layer
- [ ] (P0) `POST /concierge`: query to structured filters (Gemini or regex parser) to ranked results
- [ ] (P0) Concierge chat UI with result cards and a "Because..." line built from real fields
- [ ] (P0) Pins for concierge results sync to the map

**Acceptance:** ask "cheap safe food near me tonight" and get ranked results with truthful reasons, with and without the Gemini key.

---

## M7: Polish, Demo Mode, Docs
**Goal:** judge-ready.
- [ ] (P0) Demo Mode: scripted walkthrough per DESIGN.md §10 (≈3 min), with pause/skip
- [ ] (P1) Command palette (Ctrl/⌘+K)
- [ ] (P1) Theme toggle polish, layer control, micro-interactions
- [ ] (P0) Privacy note in the UI
- [ ] (P0) Accessibility pass: contrast, focus rings, ARIA, list alternative to the map, reduced motion
- [ ] (P0) Responsive pass at 375 px and 1280 px, screenshots captured
- [ ] (P0) Error and offline pass: kill each API in turn, confirm no blank screens
- [ ] (P0) README: setup, env vars, architecture diagram, API list, demo script, known limitations
- [ ] (P0) Walkthrough artifact
- [ ] (P0) Run the full Definition of Done below

---

## Definition of Done (final verification, in the browser)
- [ ] `npm install && npm run dev` runs with zero errors
- [ ] Works with the Gemini key removed and with it set
- [ ] **Journey 1:** find cheap food nearby via the Concierge
- [ ] **Journey 2:** build and view a heritage trail with a Story Card
- [ ] **Journey 3:** submit a photo plus voice report and see the cluster and badge
- [ ] **Journey 4:** compare two places with the radar chart and verdict
- [ ] **Journey 5:** get Fastest vs Safest routes with an explanation, toggle Night Mode
- [ ] **Journey 6:** view Analytics and Social Pulse
- [ ] All simulated, seeded, and AI content is visibly labelled
- [ ] 375 px and desktop layouts both correct
- [ ] Unit tests pass (credibility, clustering, risk, safe route, CityScore, NLP fallback)
- [ ] README demo script matches the app

---

## Stretch (only after Definition of Done)
- [ ] (P2) PWA install and offline cache of the last viewed area
- [ ] (P2) Multi-language UI (EN/HI/MR)
- [ ] (P2) Shareable safe-route links
- [ ] (P2) Report resolution workflow with an admin view
