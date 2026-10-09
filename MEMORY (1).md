# MEMORY.md: CityPulse Project Memory

> Living log. The agent **reads this at session start** and **updates it after every milestone or significant decision**. Keep entries short and factual. Newest entries go at the top of each log section.

## 1. Project Snapshot
| Field | Value |
|---|---|
| Project | CityPulse, interactive city exploration platform |
| Target city | `[SET ME]` (configured in `server/src/config/city.config.ts`) |
| Team size / time available | `[SET ME]` |
| Current milestone | M0, not started |
| Last updated | `[DATE]` |
| Gemini key present? | `[yes/no]` (app must work either way) |

## 2. Locked Decisions
| # | Decision | Reason |
|---|---|---|
| D1 | Stack: React + Vite + TS, Tailwind, Framer Motion, Zustand, Recharts | Fast to build, familiar, strong ecosystem |
| D2 | Map: Leaflet (or MapLibre) with OSM tiles | No paid key required |
| D3 | Backend: Node + Express + SQLite (better-sqlite3) | Zero-setup persistence for a demo |
| D4 | Free APIs only: Overpass, Nominatim, OSRM, Open-Meteo | No credit card, hackathon safe |
| D5 | Gemini optional with rule-based fallback | Demo must not depend on a key |
| D6 | Anonymous reports, EXIF stripped | Privacy by default |
| D7 | Seeded data is labelled `source: "seed"` with a "Demo data" chip | Data honesty |
| D8 | Traffic uses a free real source if found, else labelled simulation | Never fake live data |

## 3. Assumptions (add as made)
- A1: Browsers used for demo support Web Speech API (Chrome/Edge); text input is the fallback.
- A2: OSRM public demo server is acceptable for low-volume demo traffic.
- A3: Price tier is inferred from OSM tags or seed data when missing.
- _(Add more: `A#: assumption, date, why`)_

## 4. Milestone Progress Log
_Format: `[date] M#: status, what shipped, evidence (screenshot name), issues`_

- `[ ]` M1: Scaffold, map, geolocation, Overpass POIs, Explore plus drawer
- `[ ]` M2: Weather/AQI and alerts, Heritage layer plus Story Cards
- `[ ]` M3: Report submission (photo plus voice), SQLite, NLP pipeline, feed
- `[ ]` M4: Verification engine, risk heatmap, Safe Route
- `[ ]` M5: CityScore, leaderboard, Compare
- `[ ]` M6: Social Pulse, Analytics, AI Concierge
- `[ ]` M7: Polish, Demo Mode, README, tests, walkthrough

## 5. Change Log
_Newest first. One line per meaningful change set._
- `[date]` _example: Added `credibility.service.ts` with unit tests (12 passing)_

## 6. Dependencies Added (beyond the base stack)
| Package | Why | Milestone |
|---|---|---|
| _example: sharp_ | Strip EXIF, resize photos | M3 |

## 7. Known Issues and Workarounds
| ID | Issue | Impact | Workaround / Status |
|---|---|---|---|
| _I1_ | _example: Overpass timeout on large bbox_ | _Slow POI load_ | _Limit bbox, cache, retry with backoff_ |

## 8. External API Notes
| API | Limits / Quirks | Fallback |
|---|---|---|
| Overpass | Slow on big areas, rate-limited | api_cache 24 h, then seed POIs |
| Nominatim | 1 req/s, needs User-Agent | Debounce, cache 7 d |
| OSRM demo | Best-effort availability | Cached route, then straight-line with a warning |
| Open-Meteo | Generous free tier | Cached last value, then "weather unavailable" |
| Gemini | Key and quota dependent | Rule-based NLP and template story cards |

## 9. Glossary
| Term | Meaning |
|---|---|
| **CityScore** | Weighted composite (Safety, Cleanliness, Affordability, Rating, Accessibility), 0-100 |
| **Credibility Score** | 0-100 trust metric for a citizen report |
| **Incident cluster** | Reports of the same category within 200 m and 24 h merged |
| **Safety Score** | 0-100 per route (higher is safer) |
| **Provenance chip** | UI label: Live / Demo data / Simulated / AI-generated |
| **Story Card** | AI short history, significance, and tradition note for a heritage site |
| **Demo Mode** | Scripted auto-walkthrough for judges |

## 10. Open Questions
- [ ] Which city is the final target?
- [ ] Is a Gemini key available for the demo?
- [ ] Deploy to a public URL or run locally for judging?

## 11. Demo Readiness Checklist (final pass)
- [ ] Fresh clone runs with `npm install && npm run dev`
- [ ] Works with the Gemini key removed
- [ ] Seed data loaded, all demo data labelled
- [ ] Demo Mode tested end-to-end, under 3 minutes
- [ ] 375 px and desktop screenshots captured
- [ ] README demo script matches the app

## 12. Session Handoff Note
_Overwrite at the end of every session so the next one starts fast._

**Last session did:** _nothing yet_
**Next session should:** _Begin M1 per TASK.md_
**Watch out for:** _none_
