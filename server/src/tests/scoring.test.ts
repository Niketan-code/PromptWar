import { describe, it, expect } from 'vitest';
import { calculateCredibilityScore } from '../services/verification.service.js';
import { computeCityScore } from '../services/cityscore.service.js';
import { fallbackRuleBasedNlp } from '../services/nlp.service.js';
import { haversineDistanceMeters } from '../lib/geo.js';

describe('Scoring & Verification Algorithms', () => {
  it('computes credibility score with valid ranges and status badges', () => {
    // Basic unverified report
    const res1 = calculateCredibilityScore({
      aiConsistency: 0.5,
      hasPhoto: false,
      upvotes: 0,
      clusterSize: 1,
      reputation: 0.5,
      spamFlag: false,
    });
    expect(res1.score).toBeGreaterThanOrEqual(0);
    expect(res1.score).toBeLessThanOrEqual(100);
    expect(res1.status).toBe('unverified');

    // Highly credible verified report with photo and upvotes
    const res2 = calculateCredibilityScore({
      aiConsistency: 0.95,
      hasPhoto: true,
      upvotes: 5,
      clusterSize: 3,
      reputation: 0.9,
      spamFlag: false,
    });
    expect(res2.score).toBeGreaterThanOrEqual(70);
    expect(res2.status).toBe('verified');

    // Spam report penalty
    const resSpam = calculateCredibilityScore({
      aiConsistency: 0.5,
      hasPhoto: false,
      upvotes: 0,
      clusterSize: 1,
      reputation: 0.5,
      spamFlag: true,
    });
    expect(resSpam.score).toBeLessThan(40);
    expect(resSpam.status).toBe('unverified');
  });

  it('computes composite CityScore accurately using customizable weights', () => {
    const metrics = {
      safety: 90,
      cleanliness: 80,
      affordability: 70,
      rating: 85,
      accessibility: 95,
    };

    // Equal weights
    const equalScore = computeCityScore(metrics, {
      safety: 1,
      cleanliness: 1,
      affordability: 1,
      rating: 1,
      accessibility: 1,
    });
    expect(equalScore).toBe(84);

    // Heavily weighted for safety
    const safetyHeavyScore = computeCityScore(metrics, {
      safety: 5,
      cleanliness: 1,
      affordability: 1,
      rating: 1,
      accessibility: 1,
    });
    expect(safetyHeavyScore).toBeGreaterThan(85);
  });

  it('classifies urban reports using rule-based NLP fallback correctly', () => {
    const potholeReport = fallbackRuleBasedNlp('Dangerous crater pothole on left wheel lane near station road');
    expect(potholeReport.category).toBe('Pothole');
    expect(potholeReport.severity).toBeGreaterThanOrEqual(3);
    expect(potholeReport.locationHints.length).toBeGreaterThan(0);

    const accidentReport = fallbackRuleBasedNlp('Urgent: Severe bike collision near flyover, ambulance needed');
    expect(accidentReport.category).toBe('Accident');
    expect(accidentReport.severity).toBe(5);

    const cleanlinessReport = fallbackRuleBasedNlp('Overflowing garbage bin and terrible stench behind market');
    expect(cleanlinessReport.category).toBe('Cleanliness');
  });

  it('calculates Haversine distance with high geographical accuracy', () => {
    // Distance between Shaniwar Wada (18.5196, 73.8553) and Lal Mahal (18.5205, 73.8566) is ~170 meters
    const dist = haversineDistanceMeters(18.5196, 73.8553, 18.5205, 73.8566);
    expect(dist).toBeGreaterThan(100);
    expect(dist).toBeLessThan(250);
  });
});
