# CityPulse — Urban Intelligence & Safe Navigation Platform

> **Hackathon Theme:** *City Life: Exploring, Experiencing & Navigating the Chaos We Call Home.*  
> **Tagline:** *Turning urban chaos into a better, verified experience.*

---

## 🌟 Overview
**CityPulse** is a map-centric, full-stack urban intelligence web application designed to turn scattered, fragmented urban data into **verified, actionable insights**. Built for tourists, late-night commuters, residents, and civic authorities, CityPulse seamlessly unifies five pillars:

1. **🧭 Exploration & Hospitality**: Real attractions, food, hotels, cafes, parks, and budget spots via OpenStreetMap (Overpass API) with cached SQLite persistence, price tier badges (₹ / ₹₹ / ₹₹₹), opening hours, and wheelchair tags.
2. **🏛️ History & Culture**: Historic monument markers, an automated **Heritage Trail Generator** (1h, 2h, half-day) with OSRM foot routing, and AI-generated **Story Cards** with local tradition tips and Web Speech text-to-speech audio.
3. **🛡️ Safety & Security**: Dynamic **Risk Heatmap** (incident clusters + accident-prone zones + low-light weighting), **Safe Route Comparison** (Fastest vs. Safest route with plain-English reasons and emergency proximity), **Night Mode** risk multiplier, and a dedicated **Emergency SOS Hub** (police, hospitals, 24x7 pharmacies, one-tap live location share).
4. **⚖️ Best vs. Worst Places**: Multi-metric composite **CityScore** (Safety, Cleanliness, Affordability, Rating, Accessibility) with user-adjustable weight sliders, **Top 10 Best** & **Bottom 10 Worst** leaderboards with honest reasoning, and side-by-side **Radar Chart Compare** with AI comparison verdicts.
5. **📊 Smart City Insights**: Live weather and AQI forecast via Open-Meteo with automated **Weather Alert Banners** (rain, heatwave, pollution), simulated time-of-day traffic congestion layers, **Citizen Reporting Loop** (photo upload with automatic EXIF GPS stripping, Web Speech voice notes, NLP classification, and credibility scoring), **Social Pulse** civic sentiment monitoring, and an **AI Concierge Chat** with transparent reasoning.

**Configurable Cities**: Supports **Pune** (default) and **Mumbai** presets, plus an intelligent **Indian City Search** enabling users to select **ANY city across India**.

---

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│             FRONTEND CLIENT (React 18 + Vite + TypeScript)             │
│                                                                        │
│  Full-screen Leaflet Canvas · Carto Dark Matter / OSM Tile Layers     │
│  Glassmorphism UI (Tokens, Backdrop Blur) · Navigation Rail & Tabs    │
│  Zustand Unified Store · Framer Motion Animations · Recharts Radar     │
│  Web Speech API (Voice Notes & Audio Narration) · Geolocation API     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ REST (JSON, Zod validated)
┌───────────────────────────────────▼────────────────────────────────────┐
│                    BACKEND SERVER (Node.js + Express)                  │
│                                                                        │
│  Routes: /places · /heritage · /routes · /reports · /scores · /concierge│
│  Services:                                                             │
│  • Overpass POI & Heritage Service (24h SQLite Cache + Seed Fallback)  │
│  • OSRM Alternative Routing & Safety Scorer (Fastest vs. Safest)       │
│  • Open-Meteo Weather & AQI Service (Hourly forecast + Alert rules)    │
│  • NLP Pipeline (Gemini API with rule-based regex & heuristic fallback)│
│  • Verification Engine (Credibility 0-100, 200m/24h clustering)        │
│  • Risk Grid Heatmap Engine (Accident zones + Citizen reports + Night) │
│  • CityScore Engine (User-weighted composite rankings & Leaderboards)  │
│  • AI Concierge Service (Natural language intent parsing & reasoning)  │
│  • Multer Upload Pipeline (Pure buffer EXIF GPS stripping for privacy) │
└─────────────┬─────────────────┬────────────────┬─────────────────┬─────┘
              │                 │                │                 │
       ┌──────▼──────┐   ┌──────▼──────┐  ┌──────▼──────┐   ┌──────▼──────┐
       │   sql.js    │   │ /uploads    │  │ Free APIs   │   │ Gemini API  │
       │ SQLite WASM │   │ EXIF-clean  │  │ Overpass    │   │ (Optional)  │
       │ Persistence │   │ User Photos │  │ OSRM        │   │ + Rule NLP  │
       └─────────────┘   └─────────────┘  │ Open-Meteo  │   │  Fallback   │
                                          └─────────────┘   └─────────────┘
```

---

## 🛠️ Tech Stack (100% Free-Tier Friendly)
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Leaflet, Framer Motion, Zustand, Recharts, Lucide React, Canvas Confetti.
- **Backend**: Node.js, Express, `sql.js` (SQLite WebAssembly with disk persistence — zero native C++ compilation needed), Multer (with custom APP1 JPEG EXIF stripper), Zod.
- **APIs**:
  - **Overpass API (OSM)**: Real POIs and historic monuments.
  - **Open-Meteo API**: Live weather, hourly forecasts, and European/Indian AQI.
  - **OSRM Demo Server**: Multi-alternative driving and walking routes.
  - **Nominatim (OSM)**: Indian city and locality geocoding search.
  - **Gemini API (Optional)**: Advanced NLP parsing and story generation (falls back seamlessly to deterministic rule-based algorithms if key is omitted).
  - **Browser Web Speech API**: Speech-to-text voice reporting and audio narration.

---

## 🚀 Quickstart & Setup

### 1. Prerequisites
- **Node.js** (v18 or higher; tested on Node v24 on Windows).
- **npm** (v9 or higher).

### 2. Installation
Clone the repository and install all dependencies:
```bash
cd d:/Promptwar
npm install
cd server && npm install
cd ../client && npm install
cd ..
```

### 3. Seed Realistic Demonstration Data
Populate SQLite with realistic citizen reports clustered around urban hotspots, accident zones, and low-light areas for Pune and Mumbai:
```bash
npm run seed
```

### 4. Start Development Servers
Start both the backend server (`http://localhost:5000`) and the frontend client (`http://localhost:5173`) with a single command:
```bash
npm run dev
```

Open **`http://localhost:5173`** in your browser!

### 5. Running Automated Unit Tests
```bash
npm run test
```
All test suites (credibility score, composite CityScore, rule-based NLP fallback, Haversine geo formulas) will run and pass using Vitest.

---

## ⚙️ Environment Variables (`server/.env`)
A `.env.example` file is included in `server/.env.example`:
```env
PORT=5000
CLIENT_ORIGIN=http://localhost:5173

# Optional: Add your Gemini API key for live generative AI responses.
# If omitted or quota-limited, CityPulse automatically uses its built-in rule-based NLP engine.
GEMINI_API_KEY=

OVERPASS_URL=https://overpass-api.de/api/interpreter
OSRM_URL=https://router.project-osrm.org
NOMINATIM_URL=https://nominatim.openstreetmap.org
UPLOAD_MAX_MB=5
RATE_LIMIT_PER_MIN=120
```

---

## 📡 REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/config?city=pune` | Active city center, bounds, and supported Indian cities |
| `GET` | `/api/cities` | Full curated registry of Indian cities |
| `GET` | `/api/search?q=jaipur` | Dynamic search & Nominatim geocoding proxy across India |
| `GET` | `/api/places?city=&category=&budget=&openNow=` | Overpass POIs cached in SQLite with CityScores |
| `GET` | `/api/places/:id` | Detailed place data, tags, and score breakdown |
| `GET` | `/api/heritage?city=` | Heritage landmarks with OSM `historic=*` |
| `GET` | `/api/heritage/:id/story` | AI Story Card with history, significance, and tips |
| `POST` | `/api/heritage/trail` | Ordered walking circuit with OSRM foot routing |
| `GET` | `/api/weather?city=&lat=&lng=` | Live weather, hourly forecast, AQI, and alert banners |
| `GET` | `/api/traffic?city=` | Time-of-day driven simulated congestion overlay |
| `POST` | `/api/reports` | Multipart report submission with EXIF stripping & NLP |
| `GET` | `/api/reports?city=&category=&status=` | Live feed of citizen reports and clusters |
| `POST` | `/api/reports/:id/confirm` | Community upvote increasing credibility score |
| `GET` | `/api/risk/heatmap?city=&night=` | Risk grid points with night multiplier |
| `POST` | `/api/routes/safe` | OSRM alternatives scored: Fastest vs. Safest |
| `GET` | `/api/emergency?city=` | Nearest police stations, hospitals, 24x7 pharmacies |
| `GET` | `/api/scores/leaderboard?city=&wSafety=...` | Top 10 Best and Bottom 10 Worst leaderboards |
| `POST` | `/api/scores/compare` | Multi-place radar metrics with AI comparison verdict |
| `GET` | `/api/social/pulse?city=` | Civic sentiment analysis & trending neighborhood issues |
| `GET` | `/api/analytics/summary?city=` | Incident statistics, category counts, hotspot rankings |
| `POST` | `/api/concierge` | Natural language query parsing with ranked venues |

---

## ⏱️ 3-Minute Hackathon Demo Script

- **[0:00 - 0:30] Introduction & City Explorer**:
  - Show the dark glassmorphic map canvas centered on **Pune**.
  - Click the **City Selector** in the header to show Mumbai and the search bar for **any Indian city**.
  - Click category chips: **Food**, **Cafes**, **Attractions**, and filter by Budget (**₹**).
  - Click a place card to open the **Place Detail Drawer** showing the animated **CityScore Ring** (Safety, Cleanliness, Affordability).

- **[0:30 - 1:00] AI Concierge & Natural Language Search**:
  - Click the floating **"Ask AI Concierge"** button in the bottom right.
  - Click the quick prompt: *"Where can I eat cheap and safe near me tonight?"*.
  - Show the AI translating the query into structured filters and returning ranked recommendations with transparent **"Because..."** reasoning lines.
  - Notice the map automatically synchronizing pins with the recommended venues.

- **[1:00 - 1:40] Heritage Trail & AI Story Cards**:
  - Switch to the **Heritage** tab on the left rail.
  - Click **"Generate Walking Circuit (2 Hours)"** — observe the map draw the numbered stops and OSRM walking polyline.
  - Click **"Story Card"** on a stop (e.g., Shaniwar Wada) to view the 3-sentence history, cultural significance, and local tradition tip.
  - Click **"Listen Story (Audio)"** to demonstrate the Web Speech API voice reader.

- **[1:40 - 2:20] Citizen Report & NLP Verification Engine**:
  - Click the pink **Report** button to open the submission stepper.
  - Pick **Pothole** or **Safety**, click the **Mic button** to dictate a voice note or type: *"Deep crater pothole near station road junction"*.
  - Point out the **Privacy Safeguard** note detailing that all camera EXIF GPS data is stripped before saving.
  - Submit the report: show the instant **NLP pipeline results** (severity 5, sentiment -0.8), the **Credibility Score** badge (Likely / Verified), and the automated **incident clustering** (merged within 200m).

- **[2:20 - 2:45] Safe Route: Fastest vs. Safest**:
  - Switch to the **Safety** tab and click **"Compare Fastest vs Safest"**.
  - Show the side-by-side comparison cards:
    - **Fastest route** (dashed blue line): saves minutes but traverses high-congestion sections.
    - **Safest route** (solid emerald line): avoids accident zones and stays close to emergency facilities.
  - Toggle **Night Mode**: watch the risk scores and heatmap blooms adjust in real time.
  - Open the **Emergency SOS Hub** and show the one-tap **"Copy Emergency Share Text"** button.

- **[2:45 - 3:00] Best vs. Worst Radar Compare & Insights**:
  - Switch to **Compare**: drag the **Safety** weight slider to 5x to show the leaderboard dynamically re-ranking.
  - Switch to **Radar Compare** to show the Recharts radar chart comparing multiple venues with the AI comparison verdict.
  - Click the **"Demo Mode"** button in the header to demonstrate the automated hands-free walkthrough for judges!

---

## 🔒 Security & Privacy Guarantee
- **Anonymous by Default**: No user sign-up or PII collection.
- **EXIF GPS Removal**: All uploaded images have APP1 Exif segments stripped in memory before disk storage.
- **Rate-Limited Endpoints**: Write operations are rate-limited to prevent abuse.
- **Data Provenance Transparency**: Every visual element carries a provenance chip (`Live`, `Demo data`, `Simulated`, `AI-generated`) to ensure complete honesty.
