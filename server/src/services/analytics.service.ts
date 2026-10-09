import { AnalyticsSummary, SocialPost } from '../../../shared/types.js';
import { queryAll } from '../db/connection.js';
import { getCityConfig } from '../config/city.config.js';

export async function getAnalyticsSummary(cityId: string): Promise<AnalyticsSummary> {
  const city = getCityConfig(cityId);

  const reports = await queryAll<any>('SELECT * FROM reports WHERE city = ?', [city.id]);

  const totalReports = reports.length;
  let verifiedCount = 0;
  let unverifiedCount = 0;
  const reportsByCategory: Record<string, number> = {
    Safety: 0,
    Accident: 0,
    Traffic: 0,
    Cleanliness: 0,
    Pothole: 0,
    Lighting: 0,
    Other: 0,
  };

  for (const r of reports) {
    if (r.status === 'verified') verifiedCount++;
    else unverifiedCount++;

    if (reportsByCategory[r.category] !== undefined) {
      reportsByCategory[r.category]++;
    } else {
      reportsByCategory[r.category] = 1;
    }
  }

  const verifiedRatioPercent = totalReports > 0 ? Math.round((verifiedCount / totalReports) * 100) : 0;

  // Daily trends (past 7 days)
  const dailyTrends: Array<{ date: string; count: number }> = [];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayLabel = days[d.getDay() === 0 ? 6 : d.getDay() - 1];
    dailyTrends.push({
      date: dayLabel,
      count: Math.round(12 + Math.sin(i * 1.5) * 8 + (totalReports > 50 ? 8 : 2)),
    });
  }

  // Hotspot rankings
  const clusters = await queryAll<any>(
    'SELECT * FROM clusters WHERE city = ? ORDER BY report_count DESC LIMIT 5',
    [city.id]
  );

  const hotspotRankings = clusters.map((c, idx) => ({
    area: `Hotspot #${idx + 1} (${c.category})`,
    reportCount: c.report_count,
    riskLevel: c.max_severity >= 4 ? 'High' : c.max_severity >= 3 ? 'Moderate' : 'Low',
  }));

  if (hotspotRankings.length === 0) {
    hotspotRankings.push(
      { area: 'Station Road Junction', reportCount: 18, riskLevel: 'High' },
      { area: 'Old Market Square', reportCount: 14, riskLevel: 'Moderate' },
      { area: 'Bypass Flyover Underpass', reportCount: 11, riskLevel: 'Moderate' },
      { area: 'University North Gate', reportCount: 7, riskLevel: 'Low' }
    );
  }

  // Sentiment by Area
  const sentimentByArea = [
    { area: 'Civil Lines', positive: 65, neutral: 25, negative: 10 },
    { area: 'Central Market', positive: 38, neutral: 32, negative: 30 },
    { area: 'Old City Center', positive: 45, neutral: 35, negative: 20 },
    { area: 'Tech Corridor', positive: 70, neutral: 20, negative: 10 },
  ];

  return {
    city: city.name,
    totalReports,
    verifiedCount,
    unverifiedCount,
    verifiedRatioPercent,
    avgResolutionDays: 2.4,
    reportsByCategory,
    dailyTrends,
    hotspotRankings,
    sentimentByArea,
    source: 'seed',
  };
}

export async function getSocialPulse(cityId: string): Promise<{
  posts: SocialPost[];
  trendingTopics: string[];
  sentimentScore: number; // -1 to +1
}> {
  const city = getCityConfig(cityId);
  const posts = await queryAll<any>(
    'SELECT * FROM social_posts WHERE city = ? ORDER BY ts DESC LIMIT 30',
    [city.id]
  );

  const formattedPosts: SocialPost[] = posts.map((p) => {
    let topics: string[] = [];
    try { topics = JSON.parse(p.topics || '[]'); } catch {}
    return {
      id: p.id,
      city: p.city,
      area: p.area,
      text: p.text,
      timestamp: p.ts,
      sentiment: p.sentiment,
      topics,
      source: 'seed',
    };
  });

  const trendingTopics = [
    '#MonsoonPrep',
    '#StreetlightRepair',
    '#PotholeWatch',
    '#SafeCommute',
    '#CleanCityDrive',
  ];

  const avgSentiment = formattedPosts.length > 0
    ? Number((formattedPosts.reduce((acc, p) => acc + p.sentiment, 0) / formattedPosts.length).toFixed(2))
    : 0.15;

  return {
    posts: formattedPosts,
    trendingTopics,
    sentimentScore: avgSentiment,
  };
}

export function getTrafficCongestion(cityId: string, centerLat: number, centerLng: number): {
  features: Array<{
    id: string;
    roadName: string;
    congestionLevel: 'low' | 'moderate' | 'heavy' | 'gridlock';
    speedKmh: number;
    coordinates: [number, number][];
  }>;
  source: 'simulated';
} {
  const currentHour = new Date().getHours();
  // Peak hours in Indian cities: 8-11 AM and 5-9 PM
  const isPeak = (currentHour >= 8 && currentHour <= 11) || (currentHour >= 17 && currentHour <= 21);

  const roads = [
    { name: 'Arterial Ring Road', offset: [[-0.015, -0.02], [0.015, 0.02]] },
    { name: 'Main Station Boulevard', offset: [[-0.02, 0.005], [0.02, -0.005]] },
    { name: 'Express Highway Connector', offset: [[0.01, -0.025], [0.01, 0.025]] },
    { name: 'Old Town Heritage Way', offset: [[-0.008, -0.008], [0.008, 0.008]] },
  ];

  const features = roads.map((r, idx) => {
    let level: 'low' | 'moderate' | 'heavy' | 'gridlock' = isPeak
      ? idx === 0 ? 'gridlock' : idx === 1 ? 'heavy' : 'moderate'
      : idx === 0 ? 'moderate' : 'low';

    let speed = level === 'gridlock' ? 8 : level === 'heavy' ? 15 : level === 'moderate' ? 28 : 45;

    const coords: [number, number][] = [
      [centerLat + r.offset[0][0], centerLng + r.offset[0][1]],
      [centerLat + r.offset[1][0], centerLng + r.offset[1][1]],
    ];

    return {
      id: `traffic-${idx + 1}`,
      roadName: r.name,
      congestionLevel: level,
      speedKmh: speed,
      coordinates: coords,
    };
  });

  return { features, source: 'simulated' };
}
