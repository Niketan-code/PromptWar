import { CitizenReport, ReportCluster, ReportCategory, ReportStatus } from '../../../shared/types.js';
import { queryAll, queryOne, execute } from '../db/connection.js';
import { haversineDistanceMeters } from '../lib/geo.js';
import crypto from 'crypto';

export function calculateCredibilityScore(params: {
  aiConsistency: number; // 0..1
  hasPhoto: boolean;
  upvotes: number;
  clusterSize: number;
  reputation: number; // 0..1 (default 0.7 for honest citizen)
  spamFlag: boolean;
}): { score: number; status: ReportStatus } {
  const base = 20;
  const aiPart = 20 * Math.max(0, Math.min(1, params.aiConsistency));
  const photoPart = params.hasPhoto ? 15 : 0;
  const upvotePart = Math.min(20, 5 * Math.max(0, params.upvotes));
  const clusterPart = Math.min(15, 5 * Math.max(0, params.clusterSize - 1));
  const repPart = 10 * Math.max(0, Math.min(1, params.reputation));
  const spamPenalty = params.spamFlag ? 40 : 0;

  const raw = base + aiPart + photoPart + upvotePart + clusterPart + repPart - spamPenalty;
  const score = Math.max(0, Math.min(100, Math.round(raw)));

  let status: ReportStatus = 'unverified';
  if (score >= 70) {
    status = 'verified';
  } else if (score >= 40) {
    status = 'likely';
  }

  return { score, status };
}

export async function processReportClustering(
  cityId: string,
  category: ReportCategory,
  lat: number,
  lng: number,
  severity: number,
  createdAt: number
): Promise<{ clusterId: string; clusterSize: number }> {
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const minTime = createdAt - ONE_DAY_MS;

  // Search existing clusters in this city & category within the last 24h
  const activeClusters = await queryAll<any>(
    'SELECT * FROM clusters WHERE city = ? AND category = ? AND last_at >= ?',
    [cityId, category, minTime]
  );

  let matchedCluster: any = null;
  let minDistance = 200; // max 200 meters threshold

  for (const c of activeClusters) {
    const dist = haversineDistanceMeters(lat, lng, c.centroid_lat, c.centroid_lng);
    if (dist <= minDistance) {
      matchedCluster = c;
      minDistance = dist;
    }
  }

  if (matchedCluster) {
    const newCount = matchedCluster.report_count + 1;
    // Recompute centroid weighted average
    const newLat = Number(
      ((matchedCluster.centroid_lat * matchedCluster.report_count + lat) / newCount).toFixed(6)
    );
    const newLng = Number(
      ((matchedCluster.centroid_lng * matchedCluster.report_count + lng) / newCount).toFixed(6)
    );
    const newMaxSeverity = Math.max(matchedCluster.max_severity, severity);

    await execute(
      `UPDATE clusters 
       SET centroid_lat = ?, centroid_lng = ?, report_count = ?, max_severity = ?, last_at = ?
       WHERE id = ?`,
      [newLat, newLng, newCount, newMaxSeverity, createdAt, matchedCluster.id]
    );

    return { clusterId: matchedCluster.id, clusterSize: newCount };
  } else {
    // Create new cluster
    const clusterId = `cluster-${crypto.randomUUID().slice(0, 8)}`;
    await execute(
      `INSERT INTO clusters (id, city, category, centroid_lat, centroid_lng, report_count, max_severity, first_at, last_at)
       VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)`,
      [clusterId, cityId, category, lat, lng, severity, createdAt, createdAt]
    );

    return { clusterId, clusterSize: 1 };
  }
}

export async function addReportUpvote(
  reportId: string,
  clientHash: string
): Promise<{ success: boolean; newUpvotes: number; newCredibility: number; newStatus: ReportStatus }> {
  // Check if client already upvoted
  const existing = await queryOne(
    'SELECT * FROM upvotes WHERE report_id = ? AND client_hash = ?',
    [reportId, clientHash]
  );
  if (existing) {
    // Return current state without error
    const r = await queryOne<any>('SELECT * FROM reports WHERE id = ?', [reportId]);
    return {
      success: false,
      newUpvotes: r?.upvotes || 0,
      newCredibility: r?.credibility || 50,
      newStatus: (r?.status as any) || 'likely',
    };
  }

  // Record upvote
  await execute(
    'INSERT INTO upvotes (report_id, client_hash, created_at) VALUES (?, ?, ?)',
    [reportId, clientHash, Date.now()]
  );

  // Increment report upvotes
  await execute('UPDATE reports SET upvotes = upvotes + 1 WHERE id = ?', [reportId]);

  // Recalculate credibility score
  const report = await queryOne<any>('SELECT * FROM reports WHERE id = ?', [reportId]);
  let clusterSize = 1;
  if (report.cluster_id) {
    const cl = await queryOne<any>('SELECT report_count FROM clusters WHERE id = ?', [report.cluster_id]);
    if (cl) clusterSize = cl.report_count;
  }

  const { score, status } = calculateCredibilityScore({
    aiConsistency: 0.85,
    hasPhoto: Boolean(report.photo_path),
    upvotes: report.upvotes,
    clusterSize,
    reputation: 0.8,
    spamFlag: Boolean(report.spam_flag),
  });

  await execute(
    'UPDATE reports SET credibility = ?, status = ? WHERE id = ?',
    [score, status, reportId]
  );

  return {
    success: true,
    newUpvotes: report.upvotes,
    newCredibility: score,
    newStatus: status,
  };
}
