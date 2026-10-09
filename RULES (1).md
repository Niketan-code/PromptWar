# RULES.md: Agent and Project Rules for CityPulse

> Non-negotiable. Read at the start of every session, together with MEMORY.md and TASK.md.

## 1. Session Protocol
1. Read `RULES.md`, `MEMORY.md`, `TASK.md` first. Then PRD / ARCHITECTURE / DESIGN as needed.
2. Work on **one milestone at a time**, in order (M1 → M7). Do not skip ahead.
3. After each milestone: run the app, test in the browser, fix errors, capture a screenshot, tick tasks in `TASK.md`, and append a log entry to `MEMORY.md`.
4. If the docs conflict, priority is: **RULES > PRD > ARCHITECTURE > DESIGN > TASK**.
5. Ask the user only if truly blocked. Otherwise assume, then record the assumption in `MEMORY.md`.

## 2. Scope Rules
- Build only what PRD.md lists. **No new features until every P0 passes** the Definition of Done.
- Working end-to-end demo > polish > feature count.
- Prefer the simplest implementation that satisfies the requirement.
- Do not add dependencies without a clear reason; record any new one in `MEMORY.md`.

## 3. Data Honesty Rules (critical)
- **Never** fabricate official crime statistics or present seeded or simulated data as real.
- Every record carries `source`: `real | seed | simulated | ai`.
- The UI must show a visible provenance chip wherever non-real data appears.
- AI-generated content (Story Cards, verdicts, summaries) is labelled "AI-generated, verify locally".
- Concierge reasons must come from actual field values, never invented.
- Seed data is deterministic (seeded RNG) and idempotent (`npm run seed` can be re-run safely).

## 4. Tech Rules
- **Free only:** no paid APIs, no credit cards. Allowed: Overpass, Nominatim, OSRM demo, Open-Meteo, OSM tiles, Gemini (optional key).
- **Gemini is optional.** Every AI feature must have a working rule-based fallback; test with the key removed.
- TypeScript strict mode, no `any` unless justified in a comment.
- Shared types and zod schemas live in `shared/`; client and server import them (no duplication).
- Validate all inputs with zod; return a consistent `{ data, meta, error }` envelope.
- All external calls via `lib/httpClient` (timeout, retry, User-Agent) and cached in `api_cache`.
- Respect Nominatim policy: ≤1 req/s, debounced client side, identifying User-Agent.
- No hardcoded secrets, URLs, or city values. Use `.env` and `city.config.ts`.

## 5. Security and Privacy Rules
- No PII collection. Reports are anonymous by default.
- Strip EXIF (including GPS) from every uploaded image before storing.
- Uploads: jpeg/png/webp only, ≤5 MB, random filenames, never executed or listed.
- Never log secrets, raw IPs, or full request bodies with user text in production mode.
- No `dangerouslySetInnerHTML`; sanitize any user text rendered.
- Rate-limit all write endpoints; configure CORS to the known client origin.
- Include the privacy note in the UI (see DESIGN.md §9).

## 6. UI/UX Rules
- Follow `DESIGN.md` tokens, spacing, and components. No ad-hoc colours or fonts.
- Every data view has loading, empty, error, and offline states.
- **The app must never show a blank screen** when an API fails. Degrade to cache, then seed, then a clear message.
- WCAG AA contrast, keyboard access, visible focus, no colour-only meaning, ≥44 px touch targets.
- Respect `prefers-reduced-motion`.
- Verify at **375 px and 1280 px** widths before closing a milestone.
- Map attribution (OSM, tiles) must always be visible.

## 7. Code Quality Rules
- Small, single-purpose functions; services contain logic, controllers stay thin.
- Pure functions for scoring (credibility, risk, safe-route, CityScore) so they are unit-testable.
- Naming: `camelCase` vars/functions, `PascalCase` components/types, `kebab-case` files except components.
- No dead code, no commented-out blocks, no `console.log` left in committed code (use the logger).
- Meaningful commit-style summaries in `MEMORY.md` for each change set.
- Handle errors explicitly; never swallow them silently.

## 8. Testing Rules
- Unit tests (Vitest) are **required** for: credibility score, clustering, risk grid, safe-route score, CityScore, NLP fallback.
- The app must start cleanly with `npm install && npm run dev` and zero console errors on the demo path.
- A milestone is **not done** until its acceptance checks in `TASK.md` pass in the browser.
- Test both modes: with Gemini key and without.

## 9. Performance Rules
- Debounce map-move queries (≥400 ms) and abort stale requests.
- Cluster markers when more than ~100 are visible.
- Lazy-load heavy views (charts, dashboard).
- Cache Overpass for 24 h, weather for 10 min, OSRM for 1 h.

## 10. Documentation Rules
- Keep `README.md` current: setup, env vars, architecture diagram, API list, demo script, known limitations.
- Document every external API fallback and any degraded behaviour.
- Update `MEMORY.md` after every milestone and every non-trivial decision.

## 11. Forbidden
- Paid services, hidden tracking, or real personal data.
- Claiming real incidents, official statistics, or police partnerships.
- Presenting simulated traffic as live.
- Skipping tests or screenshots to "save time".
- Rewriting working code purely for style during the hackathon.
- Editing these rule files without explicit user approval.
