import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { INDIAN_CITIES, DEFAULT_CITY, getCityConfig, createDynamicCityConfig } from '../config/city.config.js';
import { fetchPoisFromOverpass } from '../services/overpass.service.js';
import { fetchHeritagePlaces, getStoryCard, generateHeritageTrail } from '../services/heritage.service.js';
import { fetchWeatherData } from '../services/weather.service.js';
import { analyzeReportText } from '../services/nlp.service.js';
import { calculateCredibilityScore, processReportClustering, addReportUpvote } from '../services/verification.service.js';
import { generateRiskHeatmap } from '../services/risk.service.js';
import { computeSafeRoutes, getNearestEmergencyFacilities } from '../services/routing.service.js';
import { getLeaderboard, comparePlaces, getOrComputePlaceScore } from '../services/cityscore.service.js';
import { getAnalyticsSummary, getSocialPulse, getTrafficCongestion } from '../services/analytics.service.js';
import { processConciergeQuery } from '../services/concierge.service.js';
import { upload, saveCleanImage } from '../middleware/upload.js';
import { reportSubmitLimiter } from '../middleware/rateLimiter.js';
import { queryAll, queryOne, execute } from '../db/connection.js';
import { fetchWithRetry } from '../lib/httpClient.js';
import { PoiCategory, ReportCategory } from '../../../shared/types.js';

export const apiRouter = Router();

// 1. City Config & Registry
apiRouter.get('/config', (req: Request, res: Response) => {
  const cityParam = (req.query.city as string) || DEFAULT_CITY.id;
  const activeCity = getCityConfig(cityParam);
  res.json({
    data: {
      activeCity,
      supportedCities: INDIAN_CITIES,
    },
    meta: { source: 'real', cached: true },
  });
});

apiRouter.get('/cities', (_req: Request, res: Response) => {
  res.json({
    data: INDIAN_CITIES,
    meta: { source: 'real', cached: true },
  });
});

// Dynamic Indian City Search via Nominatim Proxy with rate limiting & caching
apiRouter.get('/search', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q = (req.query.q as string || '').trim();
    if (!q) {
      res.json({ data: [], meta: { source: 'real', cached: false } });
      return;
    }

    // First search in preset Indian cities
    const localMatches = INDIAN_CITIES.filter(
      c => c.name.toLowerCase().includes(q.toLowerCase()) || c.state.toLowerCase().includes(q.toLowerCase())
    );

    if (localMatches.length > 0) {
      res.json({ data: localMatches, meta: { source: 'real', cached: true } });
      return;
    }

    // Nominatim geocoding restricted to India
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&countrycodes=in&format=json&addressdetails=1&limit=5`;
    const resp = await fetchWithRetry(nominatimUrl, { timeoutMs: 5000, retries: 1 });
    if (resp.ok) {
      const results = (await resp.json()) as any[];
      const mapped = results.map((r: any) => {
        const lat = Number(r.lat);
        const lng = Number(r.lon);
        const name = r.name || r.display_name.split(',')[0];
        const state = r.address?.state || 'India';
        return createDynamicCityConfig(name, state, lat, lng);
      });
      res.json({ data: mapped, meta: { source: 'real', cached: false } });
      return;
    }

    res.json({ data: [], meta: { source: 'real', cached: false } });
  } catch (err) {
    next(err);
  }
});

// 2. Places (Explore POIs)
apiRouter.get('/places', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const city = (req.query.city as string) || DEFAULT_CITY.id;
    const category = (req.query.category as PoiCategory) || 'food';
    const budget = req.query.budget ? Number(req.query.budget) : undefined;
    const openNow = req.query.openNow === 'true';

    let bbox: [number, number, number, number] | undefined = undefined;
    if (req.query.bbox) {
      const parts = (req.query.bbox as string).split(',').map(Number);
      if (parts.length === 4 && parts.every(p => !isNaN(p))) {
        bbox = [parts[0], parts[1], parts[2], parts[3]];
      }
    }

    let places = await fetchPoisFromOverpass(city, category, bbox);

    if (budget) {
      places = places.filter(p => p.priceTier <= budget);
    }

    // Attach calculated CityScores
    const placesWithScores = await Promise.all(
      places.map(async (p) => {
        const scores = await getOrComputePlaceScore(p);
        return { ...p, scores };
      })
    );

    res.json({
      data: placesWithScores,
      meta: { source: places[0]?.source || 'real', cached: true },
    });
  } catch (err) {
    next(err);
  }
});

apiRouter.get('/places/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const place = await queryOne<any>('SELECT * FROM places WHERE id = ?', [id]);
    if (!place) {
      res.status(404).json({ data: null, error: 'Place not found' });
      return;
    }

    let parsedTags = {};
    try { parsedTags = JSON.parse(place.tags || '{}'); } catch {}

    const placeObj = {
      id: place.id,
      osmId: place.osm_id,
      city: place.city,
      name: place.name,
      category: place.category as PoiCategory,
      lat: place.lat,
      lng: place.lng,
      tags: parsedTags,
      priceTier: place.price_tier || 2,
      rating: place.rating || 4.2,
      openingHours: place.opening_hours,
      wheelchair: place.wheelchair,
      source: place.source,
    };

    const scores = await getOrComputePlaceScore(placeObj as any);

    res.json({
      data: { ...placeObj, scores },
      meta: { source: place.source, cached: true },
    });
  } catch (err) {
    next(err);
  }
});

// 3. Heritage & Story Cards
apiRouter.get('/heritage', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const city = (req.query.city as string) || DEFAULT_CITY.id;
    const places = await fetchHeritagePlaces(city);
    res.json({
      data: places,
      meta: { source: places[0]?.source || 'seed', cached: true },
    });
  } catch (err) {
    next(err);
  }
});

apiRouter.get('/heritage/:id/story', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const name = String(req.query.name || 'Heritage Landmark');
    const city = String(req.query.city || DEFAULT_CITY.id);

    const story = await getStoryCard(id, name, city);
    res.json({
      data: story,
      meta: { source: story.generatedBy === 'ai' ? 'ai' : 'seed', cached: true },
    });
  } catch (err) {
    next(err);
  }
});

apiRouter.post('/heritage/trail', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const duration = req.body.durationMinutes ? Number(req.body.durationMinutes) : 120;
    const city = req.body.city || DEFAULT_CITY.id;
    const startLat = req.body.startLat ? Number(req.body.startLat) : undefined;
    const startLng = req.body.startLng ? Number(req.body.startLng) : undefined;

    const trail = await generateHeritageTrail(city, duration, startLat, startLng);
    res.json({
      data: trail,
      meta: { source: 'real', cached: false },
    });
  } catch (err) {
    next(err);
  }
});

// 4. Weather & Alerts
apiRouter.get('/weather', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cityConfig = getCityConfig(req.query.city as string);
    const lat = req.query.lat ? Number(req.query.lat) : cityConfig.center.lat;
    const lng = req.query.lng ? Number(req.query.lng) : cityConfig.center.lng;

    const weather = await fetchWeatherData(lat, lng, cityConfig.id);
    res.json({
      data: weather,
      meta: { source: 'real', cached: true },
    });
  } catch (err) {
    next(err);
  }
});

// 5. Citizen Reports & NLP Verification
apiRouter.post(
  '/reports',
  reportSubmitLimiter,
  upload.single('photo'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const city = req.body.city || DEFAULT_CITY.id;
      const category = (req.body.category as ReportCategory) || 'Other';
      const description = (req.body.description as string || '').trim();
      const lat = Number(req.body.lat);
      const lng = Number(req.body.lng);
      const voiceTranscript = req.body.voiceTranscript as string | undefined;

      if (!description || isNaN(lat) || isNaN(lng)) {
        res.status(400).json({ data: null, error: 'Description, lat, and lng are required.' });
        return;
      }

      // Handle photo upload with EXIF privacy stripping
      let photoPath: string | undefined = undefined;
      if (req.file) {
        photoPath = saveCleanImage(req.file.buffer, req.file.mimetype);
      }

      // Run NLP Pipeline
      const nlpResult = await analyzeReportText(
        `${description} ${voiceTranscript || ''}`,
        category
      );

      const createdAt = Date.now();

      // Run Clustering Engine (200m / 24h threshold)
      const { clusterId, clusterSize } = await processReportClustering(
        city,
        nlpResult.category,
        lat,
        lng,
        nlpResult.severity,
        createdAt
      );

      // Compute initial Credibility Score
      const { score: credibility, status } = calculateCredibilityScore({
        aiConsistency: nlpResult.confidence,
        hasPhoto: Boolean(photoPath),
        upvotes: 0,
        clusterSize,
        reputation: 0.75,
        spamFlag: nlpResult.spamFlag,
      });

      const reportId = `report-${crypto.randomUUID().slice(0, 8)}`;

      await execute(
        `INSERT INTO reports (id, city, category, description, lat, lng, severity, sentiment, photo_path, voice_transcript, spam_flag, credibility, status, cluster_id, upvotes, created_at, source)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 'user')`,
        [
          reportId,
          city,
          nlpResult.category,
          description,
          lat,
          lng,
          nlpResult.severity,
          nlpResult.sentiment,
          photoPath || null,
          voiceTranscript || null,
          nlpResult.spamFlag ? 1 : 0,
          credibility,
          status,
          clusterId,
          createdAt,
        ]
      );

      const createdReport = await queryOne<any>('SELECT * FROM reports WHERE id = ?', [reportId]);

      res.status(201).json({
        data: {
          ...createdReport,
          spamFlag: Boolean(createdReport.spam_flag),
          nlpAnalysis: nlpResult,
          clusterSize,
        },
        meta: { source: 'real', cached: false },
      });
    } catch (err) {
      next(err);
    }
  }
);

apiRouter.get('/reports', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const city = (req.query.city as string) || DEFAULT_CITY.id;
    const category = req.query.category as string | undefined;
    const status = req.query.status as string | undefined;

    let sql = 'SELECT * FROM reports WHERE city = ? AND spam_flag = 0';
    const params: any[] = [city];

    if (category && category !== 'All') {
      sql += ' AND category = ?';
      params.push(category);
    }
    if (status && status !== 'All') {
      sql += ' AND status = ?';
      params.push(status);
    }

    sql += ' ORDER BY created_at DESC LIMIT 100';

    const reports = await queryAll<any>(sql, params);
    const clusters = await queryAll<any>('SELECT * FROM clusters WHERE city = ?', [city]);

    res.json({
      data: {
        reports: reports.map(r => ({ ...r, spamFlag: Boolean(r.spam_flag) })),
        clusters,
      },
      meta: { source: 'real', cached: false },
    });
  } catch (err) {
    next(err);
  }
});

apiRouter.post('/reports/:id/confirm', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = String(req.params.id);
    const clientHash = req.body.clientHash || crypto.createHash('sha256').update(req.ip || 'anon').digest('hex');

    const result = await addReportUpvote(id, clientHash);
    res.json({
      data: result,
      meta: { source: 'real', cached: false },
    });
  } catch (err) {
    next(err);
  }
});

// 6. Risk Heatmap & Safe Routing
apiRouter.get('/risk/heatmap', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const city = (req.query.city as string) || DEFAULT_CITY.id;
    const isNight = req.query.night === 'true';

    const points = await generateRiskHeatmap(city, isNight);
    res.json({
      data: points,
      meta: { source: 'real', cached: false },
    });
  } catch (err) {
    next(err);
  }
});

apiRouter.post('/routes/safe', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { city, fromLat, fromLng, toLat, toLng, isNight } = req.body;
    if (isNaN(fromLat) || isNaN(fromLng) || isNaN(toLat) || isNaN(toLng)) {
      res.status(400).json({ data: null, error: 'Valid from and to coordinates required.' });
      return;
    }

    const routes = await computeSafeRoutes({
      cityId: city || DEFAULT_CITY.id,
      fromLat: Number(fromLat),
      fromLng: Number(fromLng),
      toLat: Number(toLat),
      toLng: Number(toLng),
      isNight: Boolean(isNight),
    });

    res.json({
      data: routes,
      meta: { source: 'real', cached: false },
    });
  } catch (err) {
    next(err);
  }
});

apiRouter.get('/emergency', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cityConfig = getCityConfig(String(req.query.city || ''));
    const lat = req.query.lat ? Number(req.query.lat) : cityConfig.center.lat;
    const lng = req.query.lng ? Number(req.query.lng) : cityConfig.center.lng;

    const facilities = await getNearestEmergencyFacilities(lat, lng, cityConfig.id);
    res.json({
      data: facilities,
      meta: { source: 'real', cached: false },
    });
  } catch (err) {
    next(err);
  }
});

// 7. CityScore Leaderboard & Compare
apiRouter.get('/scores/leaderboard', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const city = (req.query.city as string) || DEFAULT_CITY.id;
    const category = req.query.category as PoiCategory | undefined;

    const weights = {
      safety: req.query.wSafety ? Number(req.query.wSafety) : 1,
      cleanliness: req.query.wClean ? Number(req.query.wClean) : 1,
      affordability: req.query.wAfford ? Number(req.query.wAfford) : 1,
      rating: req.query.wRating ? Number(req.query.wRating) : 1,
      accessibility: req.query.wAccess ? Number(req.query.wAccess) : 1,
    };

    const leaderboard = await getLeaderboard({ cityId: city, category, weights });
    res.json({
      data: leaderboard,
      meta: { source: 'seed', cached: true },
    });
  } catch (err) {
    next(err);
  }
});

apiRouter.post('/scores/compare', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const placeIds = req.body.placeIds as string[];
    if (!Array.isArray(placeIds) || placeIds.length < 2) {
      res.status(400).json({ data: null, error: 'Provide at least 2 placeIds to compare.' });
      return;
    }

    const weights = req.body.weights || undefined;
    const comparison = await comparePlaces(placeIds, weights);

    res.json({
      data: comparison,
      meta: { source: comparison.aiVerdict.includes('overall winner') ? 'ai' : 'seed', cached: false },
    });
  } catch (err) {
    next(err);
  }
});

// 8. Social Pulse, Analytics, and Traffic
apiRouter.get('/social/pulse', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const city = (req.query.city as string) || DEFAULT_CITY.id;
    const pulse = await getSocialPulse(city);
    res.json({
      data: pulse,
      meta: { source: 'seed', cached: true },
    });
  } catch (err) {
    next(err);
  }
});

apiRouter.get('/analytics/summary', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const city = (req.query.city as string) || DEFAULT_CITY.id;
    const summary = await getAnalyticsSummary(city);
    res.json({
      data: summary,
      meta: { source: 'seed', cached: true },
    });
  } catch (err) {
    next(err);
  }
});

apiRouter.get('/traffic', (req: Request, res: Response) => {
  const cityConfig = getCityConfig(req.query.city as string);
  const traffic = getTrafficCongestion(cityConfig.id, cityConfig.center.lat, cityConfig.center.lng);
  res.json({
    data: traffic.features,
    meta: { source: traffic.source, cached: false },
  });
});

// 9. AI Concierge
apiRouter.post('/concierge', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = (req.body.query as string || '').trim();
    const city = req.body.city || DEFAULT_CITY.id;
    const lat = req.body.lat ? Number(req.body.lat) : undefined;
    const lng = req.body.lng ? Number(req.body.lng) : undefined;

    if (!query) {
      res.status(400).json({ data: null, error: 'Query string is required.' });
      return;
    }

    const response = await processConciergeQuery({
      query,
      cityId: city,
      userLat: lat,
      userLng: lng,
    });

    res.json({
      data: response,
      meta: { source: response.source, cached: false },
    });
  } catch (err) {
    next(err);
  }
});
