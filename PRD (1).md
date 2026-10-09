# PRD.md: CityPulse Product Requirements

> Source of truth for WHAT we build and WHY. For HOW, see ARCHITECTURE.md. For look and feel, see DESIGN.md.

## 1. Vision
CityPulse is a map-centric web app that turns scattered urban data (OSM, weather, citizen reports, social posts) into **verified, actionable insights**, so people can explore, understand, and safely navigate their city.

**Tagline:** *Turning urban chaos into a better experience.*

## 2. Problem Statement
City dwellers and visitors face fragmented information: food and hotel apps ignore safety, safety info is anecdotal, heritage content is buried, and traffic/weather alerts are disconnected from route decisions. Nobody tells you whether a place is *good, safe, clean, affordable, and accessible* in one view.

## 3. Target Users (Personas)
| Persona | Need | Key feature |
|---|---|---|
| **Tourist (Aarav)** | Find cheap, safe food and heritage spots fast | Explore, Heritage Trail, AI Concierge |
| **Late-night commuter (Meera)** | Get home safely | Safe Route, Night Mode, Emergency panel |
| **Resident / activist (Rohan)** | Report issues and see them acted on | Citizen Reports, Verification, Analytics |
| **Accessibility-conscious user (Sunita)** | Find wheelchair-friendly places | Accessibility score and filter |
| **Judge / evaluator** | See value in 3 minutes | Demo Mode |

## 4. Goals and Non-Goals
**Goals**
- G1: Cover all five pillars (Explore, Heritage, Safety, Compare, Insights) in one cohesive app.
- G2: Show verified insights, not raw data (credibility scoring, clustering).
- G3: Fully functional with only free/no-key APIs; works with and without the Gemini key.
- G4: Be honest about data provenance (real vs seeded vs simulated).
- G5: A flawless 3-minute demo.

**Non-Goals**
- No user accounts or auth (anonymous by default).
- No real crime statistics or official data claims.
- No native mobile app (responsive web only).
- No paid APIs, payments, or booking flows.

## 5. Functional Requirements

Priority: **P0** must ship, **P1** should ship, **P2** nice to have.

### FR-1 Exploration and Hospitality
| ID | Requirement | Pri |
|---|---|---|
| FR-1.1 | Interactive map with OSM tiles, geolocation "near me" | P0 |
| FR-1.2 | Category chips: Attractions, Food, Hotels, Budget, Cafes, Parks | P0 |
| FR-1.3 | POIs fetched from Overpass for the viewport, cached in SQLite | P0 |
| FR-1.4 | Place detail drawer (tags, hours, price tier, distance, Save, Compare) | P0 |
| FR-1.5 | Budget filter (₹/₹₹/₹₹₹) and "open now" toggle | P1 |
| FR-1.6 | Marker clustering | P1 |

### FR-2 History and Culture
| ID | Requirement | Pri |
|---|---|---|
| FR-2.1 | Heritage layer toggle (historic=*, heritage=*) | P0 |
| FR-2.2 | AI Story Card (3-sentence history, significance, tradition tip), cached, labelled "AI-generated, verify locally" | P0 |
| FR-2.3 | Heritage Trail generator (1h / 2h / half-day), nearest-neighbour order plus OSRM walking route | P1 |

### FR-3 Safety and Security
| ID | Requirement | Pri |
|---|---|---|
| FR-3.1 | Risk heatmap from reports, seeded accident zones, time-of-day weighting | P0 |
| FR-3.2 | Safe Route: 2-3 OSRM alternatives, Fastest vs Safest, score 0-100, plain-English reason | P0 |
| FR-3.3 | Night Mode re-weights risk | P1 |
| FR-3.4 | Emergency panel: nearest police, hospital, pharmacy, share-location text | P1 |

### FR-4 Best vs Worst
| ID | Requirement | Pri |
|---|---|---|
| FR-4.1 | CityScore (Safety, Cleanliness, Affordability, Rating, Accessibility) with user-adjustable weights | P0 |
| FR-4.2 | Top 10 / Bottom 10 leaderboard with reasons | P0 |
| FR-4.3 | Compare 2-3 places: radar chart, table, per-metric winner, AI verdict | P0 |

### FR-5 Smart City Insights
| ID | Requirement | Pri |
|---|---|---|
| FR-5.1 | Weather widget, hourly forecast, alert banners (rain/heat/AQI) | P0 |
| FR-5.2 | Citizen report submission: category, text, pin, photo, voice-to-text | P0 |
| FR-5.3 | NLP pipeline: category, severity 1-5, sentiment, location hints, spam/toxicity flag | P0 |
| FR-5.4 | Verification engine: Credibility Score, clustering (200 m / 24 h), upvotes, badges | P0 |
| FR-5.5 | Live feed with filters | P1 |
| FR-5.6 | Social Pulse on labelled sample data: sentiment, topics, trend chart | P1 |
| FR-5.7 | Analytics dashboard (by category/day, hotspots, verified ratio, resolution time) | P1 |
| FR-5.8 | Traffic layer: real source if free, else clearly labelled simulation | P1 |

### FR-6 AI Concierge
| ID | Requirement | Pri |
|---|---|---|
| FR-6.1 | Natural-language query to structured filters to ranked results plus map pins | P0 |
| FR-6.2 | Transparent "Because..." reasoning per result | P0 |

### FR-7 Cross-cutting
| ID | Requirement | Pri |
|---|---|---|
| FR-7.1 | Demo Mode: guided auto-walkthrough | P0 |
| FR-7.2 | Command palette (Ctrl+K) | P2 |
| FR-7.3 | Dark/light theme | P1 |
| FR-7.4 | City configurable via a single config file | P0 |

## 6. Non-Functional Requirements
- **Performance:** first meaningful map paint < 3 s on broadband; API p95 < 800 ms for cached queries.
- **Resilience:** no blank screens; every external call has timeout, retry, fallback, and an error state.
- **Privacy:** anonymous reports, EXIF GPS stripped from photos, no PII, privacy note in the UI.
- **Accessibility:** WCAG AA contrast, keyboard navigable, no colour-only meaning.
- **Responsiveness:** works at 375 px and desktop.
- **Honesty:** every seeded or simulated datum carries a visible label.

## 7. Success Metrics (demo and hackathon)
- All P0 requirements pass the Definition of Done checklist.
- A judge can complete the 6 core journeys (see TASK.md, "Definition of Done") in under 3 minutes.
- Zero console errors in the demo path.
- App works with the Gemini key removed.

## 8. Key User Journeys
1. **Cheap safe dinner:** Concierge query, ranked results with reasons, tap a pin, open the detail drawer.
2. **Heritage morning:** Heritage layer, 2h trail, Story Card for a stop.
3. **Report an issue:** photo plus voice report, NLP classification, cluster and credibility badge appear in the feed.
4. **Get home safe:** A to B, Fastest vs Safest comparison, explanation, Night Mode toggle changes scores.
5. **Pick a hotel:** Compare 2-3 places, radar chart, AI verdict.
6. **City pulse:** Analytics plus Social Pulse show trending problems per neighbourhood.

## 9. Assumptions and Risks
| Risk | Mitigation |
|---|---|
| Overpass/OSRM public servers rate-limit or go down | Cache aggressively, retry with backoff, fall back to cached/seed data |
| Gemini key missing or quota hit | Rule-based NLP fallback, keyword classifier, template story cards |
| Sparse OSM data in the target city | Seed script supplements POIs and ratings, labelled as demo |
| Scope creep | RULES.md freezes scope until P0 is done |
| Judges doubt data authenticity | Provenance chips (Real / Seed / Simulated / AI) |

## 10. Out of Scope (Future)
Accounts and reputation sync, push alerts, official police/municipal API integration, real traffic vendors, multi-language UI, offline PWA caching.
