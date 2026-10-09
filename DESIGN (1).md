# DESIGN.md: CityPulse UI/UX System

> Look, feel, and interaction rules. Every UI change must follow this file.

## 1. Design Principles
1. **Map is the product.** Full-screen map canvas; UI floats above it and never fights it.
2. **Insight over data.** Show a score, a badge, a sentence, not a raw table.
3. **Honest by design.** Every data point shows its provenance (Real / Seed / Simulated / AI).
4. **Calm in chaos.** Generous spacing, soft motion, clear hierarchy.
5. **Never blank.** Every state (loading, empty, error, offline) is designed.
6. **Inclusive.** WCAG AA, keyboard-first, no colour-only meaning.

## 2. Layout
### Desktop (≥1024 px)
```
┌────┬──────────────────────────────────────────────┐
│Rail│  [Search ⌘K]            [Weather chip] [Theme]│
│    │                                              │
│ 🧭 │   ┌────────────┐                              │
│ 🏛 │   │ Glass panel│        FULL-SCREEN MAP       │
│ 🛡 │   │ (380px)    │                              │
│ ⚖ │   └────────────┘             [Layer control]  │
│ 📊 │                                              │
│ ✎  │                              [AI chat bubble]│
└────┴──────────────────────────────────────────────┘
```
- Left icon rail (64 px) with labelled tooltips; active item has accent bar.
- Contextual glass panel (360-400 px) slides in next to the rail.
- Detail drawer slides from the right (420 px).
- Layer control top-right; Concierge FAB bottom-right.

### Mobile (< 768 px)
- Map full screen; icon rail becomes a **bottom tab bar** (5 tabs plus Report FAB centre).
- Panels are **bottom sheets** with 3 snap points (peek 20% / half 50% / full 90%), drag handle, swipe to dismiss.
- Search collapses into a top pill.

## 3. Visual Language
### Theme
Dark default, light toggle. Glassmorphism: `backdrop-filter: blur(16px)`, translucent surfaces, 1 px inner border.

### Pillar Accent Colours
| Pillar | Token | Dark | Light | Icon |
|---|---|---|---|---|
| Explore | `--c-explore` | `#2DD4BF` | `#0D9488` | Compass |
| Heritage | `--c-heritage` | `#FBBF24` | `#B45309` | Landmark |
| Safety | `--c-safety` | `#F87171` | `#B91C1C` | Shield |
| Compare | `--c-compare` | `#A78BFA` | `#6D28D9` | Scale |
| Insights | `--c-insights` | `#60A5FA` | `#1D4ED8` | BarChart |
| Report | `--c-report` | `#F472B6` | `#BE185D` | PenLine |

### Neutrals (tokens)
```css
:root[data-theme="dark"] {
  --bg: #0B1020;  --surface: rgba(20,26,45,.72);  --surface-solid: #141A2D;
  --border: rgba(255,255,255,.10);  --text: #E8ECF8;  --text-muted: #9AA4BF;
}
:root[data-theme="light"] {
  --bg: #F5F7FB;  --surface: rgba(255,255,255,.78); --surface-solid: #FFFFFF;
  --border: rgba(15,23,42,.10);  --text: #0F172A;  --text-muted: #51607A;
}
```
### Semantic Status
Safe `#22C55E` · Caution `#F59E0B` · Danger `#EF4444` · Info `#3B82F6`. Always paired with an icon and label.

### Provenance Chips
| Source | Label | Style |
|---|---|---|
| real | `Live` | green dot |
| seed | `Demo data` | dashed outline, grey |
| simulated | `Simulated` | amber outline |
| ai | `AI-generated, verify locally` | violet sparkle icon |

### Typography
- Headings: **Space Grotesk** (600/700); Body: **Inter** (400/500); Numbers: tabular figures.
- Scale: 12 / 14 / 16 / 20 / 24 / 32. Body 14-16, line-height 1.5.

### Shape, Spacing, Elevation
- Radius: 8 (inputs), 12 (cards), 20 (panels), 999 (chips).
- 4 px spacing grid. Shadows: `0 8px 32px rgba(0,0,0,.35)` for floating panels.

## 4. Core Components
| Component | Notes |
|---|---|
| `GlassPanel` | Blur surface, header with pillar icon and title, close button |
| `CategoryChips` | Horizontally scrollable, toggleable, count badges |
| `PlaceCard` | Name, category icon, CityScore ring, price tier, distance, provenance chip |
| `ScoreRing` | Animated circular 0-100, colour plus numeric label |
| `CredibilityBadge` | Unverified (grey, `?`) / Likely (amber, `~`) / Verified (green, `✓`) with tooltip breakdown |
| `RouteCompareCard` | Fastest vs Safest: time, distance, Safety Score, "Why" sentence |
| `RadarCompare` | Recharts radar, 2-3 overlays, legend with icons |
| `ReportForm` | Stepper: Category → Details (text/voice) → Location (draggable pin) → Photo → Review |
| `VoiceButton` | Mic with live waveform and pulse while listening; text fallback if unsupported |
| `AlertBanner` | Weather/AQI alerts with icon, severity, advice |
| `Skeleton`, `EmptyState`, `ErrorState` | Required for every data view |
| `CommandPalette` | `Ctrl/⌘+K`, fuzzy search places and actions |
| `DemoOverlay` | Step caption, progress dots, pause/skip |

## 5. Map Styling
- Tiles: OSM standard (light) / CartoDB Dark Matter (dark), with attribution always visible.
- Markers: circular pins with pillar-colour fill plus category glyph.
- Clusters: numbered bubbles that scale by count.
- Heatmap gradient: transparent → amber → orange → red (night mode shifts the intensity).
- Routes: Fastest = dashed blue; Safest = solid green; selected route thicker with glow. Animated draw (stroke-dashoffset, ~800 ms).
- Hotspots: soft pulsing ring (reduced under `prefers-reduced-motion`).
- Heritage markers: amber with a landmark glyph; Trail: numbered stops joined by a dotted line.

## 6. Motion (Framer Motion)
| Interaction | Spec |
|---|---|
| Panel open | slide plus fade, 220 ms, ease-out |
| Map flyTo | 1.2 s, easeLinear off; auto when selecting a place |
| Route draw | 800 ms path animation |
| Score ring | count-up 600 ms |
| List items | stagger 40 ms |
| Hover | scale 1.02, 120 ms |
Respect `prefers-reduced-motion`: disable pulses, parallax, and long transitions.

## 7. Key Screens and States
1. **Explore:** chips, budget slider, results list with map sync (hover a card highlights its pin).
2. **Place Drawer:** hero photo placeholder, scores, tags, hours, Save and Compare actions.
3. **Heritage:** layer toggle, trail builder (time chips), Story Card with provenance.
4. **Safety:** A/B inputs, route cards, night toggle, emergency panel (sticky, red accent).
5. **Compare/Leaderboard:** weight sliders, Top/Bottom lists with reasons, radar view.
6. **Report:** stepper, success state showing the resulting badge and cluster message.
7. **Insights:** weather alerts, Social Pulse, analytics cards and charts.
8. **Concierge:** chat bubble opens a panel; results as compact cards with "Because..." line.

**State designs required:** loading (skeleton), empty (illustration plus CTA), error (reason plus Retry), offline (banner plus cached data), permission denied (location), unsupported (voice).

## 8. Accessibility Checklist
- Contrast ≥ 4.5:1 text, 3:1 UI components in both themes.
- All interactive elements keyboard reachable, visible `:focus-visible` ring (2 px accent).
- ARIA: labelled icons, `role="dialog"` for drawers, `aria-live="polite"` for alerts and report results.
- Map has a **list alternative** for all marker data.
- Touch targets ≥ 44 px on mobile.
- Never use colour alone (add icon, text, or pattern).

## 9. Content and Tone
- Plain English, short sentences. Explain scores ("Safer because it avoids 2 accident-prone junctions").
- Never alarmist; use "reported" not "dangerous" unless verified.
- Microcopy for privacy: *"We use your location only on your device to show nearby results. Reports are anonymous and photos have location data removed."*

## 10. Demo Mode Choreography (≈3 min)
1. Intro caption → map flies to the city (0:00)
2. Concierge: "cheap safe dinner near me" (0:20)
3. Heritage trail plus Story Card (0:50)
4. Submit voice and photo report, show cluster and badge (1:20)
5. Safe Route: Fastest vs Safest, toggle Night (1:50)
6. Compare two hotels, radar, verdict (2:20)
7. Insights dashboard, wrap-up caption (2:40)
