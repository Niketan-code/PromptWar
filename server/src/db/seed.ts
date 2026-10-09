import { getDb, execute, queryOne, saveDb } from './connection.js';
import { INDIAN_CITIES } from '../config/city.config.js';
import { calculateCredibilityScore } from '../services/verification.service.js';
import { ReportCategory } from '../../../shared/types.js';

async function seed() {
  console.log('🌱 Starting CityPulse seed script...');
  await getDb();

  const citiesToSeed = ['pune', 'mumbai'];

  for (const cityId of citiesToSeed) {
    const city = INDIAN_CITIES.find(c => c.id === cityId) || INDIAN_CITIES[0];
    console.log(`\n📍 Seeding data for ${city.name} (${city.state})...`);

    // 1. Seed Risk Zones (Accident hotspots, low-light corridors)
    const riskZonesData = [
      { name: `${city.name} Station Chowk Junction`, kind: 'accident', offset: [0.005, 0.003], base: 0.85, nightMult: 1.5, radius: 280 },
      { name: 'Swargate Flyover Merging Zone', kind: 'accident', offset: [-0.015, -0.008], base: 0.75, nightMult: 1.4, radius: 260 },
      { name: 'Old Bypass Dark Corridor', kind: 'lowlight', offset: [0.025, -0.018], base: 0.70, nightMult: 2.2, radius: 320 },
      { name: 'Industrial Canal Underside', kind: 'lowlight', offset: [-0.022, 0.021], base: 0.65, nightMult: 2.0, radius: 240 },
      { name: 'Expressway Exit Toll Ramp', kind: 'accident', offset: [0.038, 0.035], base: 0.80, nightMult: 1.6, radius: 300 },
    ];

    for (const z of riskZonesData) {
      const id = `risk-${city.id}-${z.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
      await execute(
        `INSERT OR REPLACE INTO risk_zones (id, city, kind, name, lat, lng, radius_m, base_risk, night_multiplier, source)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          city.id,
          z.kind,
          z.name,
          Number((city.center.lat + z.offset[0]).toFixed(5)),
          Number((city.center.lng + z.offset[1]).toFixed(5)),
          z.radius,
          z.base,
          z.nightMult,
          'seed',
        ]
      );
    }

    // 2. Seed ~75 citizen reports per city clustered around realistic urban hotspots
    const hotspotCenters = [
      { name: 'Central Railway Hub', lat: city.center.lat + 0.005, lng: city.center.lng + 0.003, cat: 'Traffic' as ReportCategory },
      { name: 'Bazaar Corridor', lat: city.center.lat - 0.008, lng: city.center.lng - 0.006, cat: 'Cleanliness' as ReportCategory },
      { name: 'Ring Road Junction', lat: city.center.lat + 0.018, lng: city.center.lng + 0.012, cat: 'Accident' as ReportCategory },
      { name: 'Metro Underpass', lat: city.center.lat - 0.015, lng: city.center.lng + 0.016, cat: 'Lighting' as ReportCategory },
      { name: 'University North Avenue', lat: city.center.lat + 0.022, lng: city.center.lng - 0.014, cat: 'Pothole' as ReportCategory },
      { name: 'Old Town Residential Lane', lat: city.center.lat - 0.003, lng: city.center.lng - 0.018, cat: 'Safety' as ReportCategory },
    ];

    const reportDescriptions: Record<ReportCategory, string[]> = {
      Traffic: [
        'Massive signal failure at junction causing gridlock for 40 minutes.',
        'Heavy bumper-to-bumper traffic due to stalled commercial truck on right lane.',
        'Bus breakdown near intersection blocking two central lanes.',
        'Traffic police absent during evening peak rush hour; auto rickshaws blocking turn.',
      ],
      Cleanliness: [
        'Overflowing municipality garbage bin emitting severe odor near food market.',
        'Construction debris and discarded packaging dumped across sidewalk.',
        'Open waste accumulation near storm drain attracting stray cattle and dogs.',
        'Litter accumulated around public bus stop; needs municipal cleaning vehicle.',
      ],
      Accident: [
        'Two-wheeler skid collision on wet asphalt near sharp junction curve.',
        'Rear-end collision between delivery van and private car; traffic slowing.',
        'Minor collision at unmonitored zebra crossing; ambulance attended.',
        'Near-miss pedestrian incident due to missing blinker light.',
      ],
      Lighting: [
        'Three consecutive streetlights flickering and out along pedestrian walkway.',
        'Dark, unlit stretch for 300 meters near canal; feels isolated after 8 PM.',
        'Streetlight pole damaged in thunderstorm last night; exposed cabling.',
        'No lighting at underpass; cyclists struggling with visibility.',
      ],
      Pothole: [
        'Deep circular pothole on left wheel track causing dangerous two-wheeler swerving.',
        'Cluster of 4 craters after heavy rain; vehicle suspension damage risk.',
        'Road asphalt peeled off across 10 meters exposing sharp stones.',
        'Depression near storm sewer grate needs urgent patch repair.',
      ],
      Safety: [
        'Dimly lit isolated corner with no foot patrol; commuters feel unsafe.',
        'Report of chain snatching attempt near alleyway around 9:30 PM.',
        'Unruly group loitering outside closed shutter complex; avoiding lane.',
        'Poorly monitored pathway between parking lot and metro entrance.',
      ],
      Other: [
        'Water pipeline leaking drinking water across carriageway.',
        'Overhanging dried banyan tree branch threatening overhead wires.',
      ],
    };

    let reportIdx = 1;
    const now = Date.now();

    for (const spot of hotspotCenters) {
      // Create a cluster entry for this hotspot
      const clusterId = `cluster-${city.id}-${spot.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
      const reportsInSpot = 10 + Math.floor(Math.random() * 5); // 10-14 reports per cluster
      let maxSev = 1;

      for (let r = 0; r < reportsInSpot; r++) {
        // Jitter within ~120m
        const rLat = spot.lat + (Math.random() - 0.5) * 0.0022;
        const rLng = spot.lng + (Math.random() - 0.5) * 0.0022;
        const severity = 2 + Math.floor(Math.random() * 4); // 2 to 5
        if (severity > maxSev) maxSev = severity;

        const descriptions = reportDescriptions[spot.cat] || reportDescriptions.Other;
        const desc = descriptions[r % descriptions.length];
        const ageHours = (reportsInSpot - r) * 3 + Math.random() * 5;
        const createdAt = now - Math.round(ageHours * 3600 * 1000);
        const upvotes = Math.floor(Math.random() * 8) + (r === 0 ? 12 : 2);
        const hasPhoto = r % 2 === 0;

        const { score: credibility, status } = calculateCredibilityScore({
          aiConsistency: 0.9,
          hasPhoto,
          upvotes,
          clusterSize: reportsInSpot,
          reputation: 0.85,
          spamFlag: false,
        });

        const reportId = `report-${city.id}-${reportIdx++}`;

        await execute(
          `INSERT OR REPLACE INTO reports (id, city, category, description, lat, lng, severity, sentiment, photo_path, voice_transcript, spam_flag, credibility, status, cluster_id, upvotes, created_at, resolved_at, source)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            reportId,
            city.id,
            spot.cat,
            desc,
            Number(rLat.toFixed(5)),
            Number(rLng.toFixed(5)),
            severity,
            Number((-0.3 - severity * 0.12).toFixed(2)),
            hasPhoto ? '/uploads/sample-evidence.jpg' : null,
            r % 3 === 0 ? `Citizen voice note: ${desc}` : null,
            0,
            credibility,
            status,
            clusterId,
            upvotes,
            createdAt,
            null,
            'seed',
          ]
        );
      }

      // Record cluster in clusters table
      await execute(
        `INSERT OR REPLACE INTO clusters (id, city, category, centroid_lat, centroid_lng, report_count, max_severity, first_at, last_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          clusterId,
          city.id,
          spot.cat,
          Number(spot.lat.toFixed(5)),
          Number(spot.lng.toFixed(5)),
          reportsInSpot,
          maxSev,
          now - 48 * 3600 * 1000,
          now,
        ]
      );
    }

    // 3. Seed Social Pulse Posts
    const socialData = [
      { area: 'Civil Lines', text: 'Appreciate the quick municipal response fixing the pipeline leak today! #CleanCity', sentiment: 0.7, topics: ['#CleanCity', '#PublicWorks'] },
      { area: 'Station Road', text: 'Traffic at station chowk is unbearable during evening hours, need better signal timing.', sentiment: -0.6, topics: ['#Traffic', '#Commute'] },
      { area: 'Old Bazaar', text: 'Street food vendors in Khau Galli maintaining great hygiene standards this monsoon!', sentiment: 0.8, topics: ['#Foodie', '#Monsoon'] },
      { area: 'Ring Road', text: 'Multiple potholes reported along the bypass flyover. Two-wheelers please ride carefully! #PotholeWatch', sentiment: -0.5, topics: ['#PotholeWatch', '#RoadSafety'] },
      { area: 'Heritage Mile', text: 'Evening walking trail at the heritage wada is wonderfully lit and peaceful. #CityLife', sentiment: 0.85, topics: ['#Heritage', '#Explore'] },
      { area: 'Tech Corridor', text: 'Streetlights repaired near the metro bridge. Feels much safer for late night commuters. #SafeCommute', sentiment: 0.75, topics: ['#SafeCommute', '#Lighting'] },
    ];

    for (let s = 0; s < socialData.length; s++) {
      const sp = socialData[s];
      await execute(
        `INSERT OR REPLACE INTO social_posts (id, city, area, text, ts, sentiment, topics, source)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          `soc-${city.id}-${s + 1}`,
          city.id,
          sp.area,
          sp.text,
          now - s * 3 * 3600 * 1000,
          sp.sentiment,
          JSON.stringify(sp.topics),
          'seed',
        ]
      );
    }

    console.log(`✅ Seeded ${reportIdx - 1} reports, ${hotspotCenters.length} clusters, and ${riskZonesData.length} risk zones for ${city.name}.`);
  }

  saveDb();
  console.log('\n🎉 Database seed completed successfully!');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
