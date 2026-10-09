import { ReportCategory } from '../../../shared/types.js';
import { env } from '../config/env.js';

export interface NlpAnalysisResult {
  category: ReportCategory;
  severity: number; // 1-5
  sentiment: number; // -1 to +1
  locationHints: string[];
  spamFlag: boolean;
  toxicityFlag: boolean;
  confidence: number; // 0-1
  source: 'ai' | 'fallback';
}

const CATEGORY_KEYWORDS: Record<ReportCategory, string[]> = {
  Accident: ['accident', 'crash', 'collision', 'hit', 'injured', 'ambulance', 'bike fall', 'vehicle', 'overturned', 'blood'],
  Safety: ['unsafe', 'harassment', 'stalking', 'dark', 'isolated', 'theft', 'chain snatching', 'mugging', 'shady', 'danger', 'threat', 'unsafe for women'],
  Lighting: ['streetlight', 'dark', 'bulb', 'light', 'blackout', 'lamp post', 'no light', 'pitch black', 'illumination', 'low light'],
  Pothole: ['pothole', 'broken road', 'crater', 'ditch', 'uneven', 'road damage', 'asphalt', 'manhole open', 'tar'],
  Cleanliness: ['garbage', 'trash', 'dump', 'waste', 'smell', 'stench', 'overflowing bin', 'debris', 'filth', 'unclean'],
  Traffic: ['traffic', 'jam', 'congestion', 'gridlock', 'signal broken', 'stuck', 'slow moving', 'choked', 'bottleneck', 'diversion'],
  Other: ['water leak', 'pipe burst', 'tree fallen', 'stray dogs', 'encroachment', 'noise', 'construction'],
};

const HIGH_SEVERITY_WORDS = [
  'urgent', 'fatal', 'severe', 'fire', 'danger', 'injury', 'injured',
  'bleeding', 'live wire', 'emergency', 'collapsed', 'deep crater', 'threat', 'open manhole'
];

const MODERATE_SEVERITY_WORDS = [
  'bad', 'broken', 'jam', 'dark', 'overflowing', 'delay', 'damage', 'pothole', 'stuck', 'smell'
];

const SPAM_PATTERNS = [
  /http[s]?:\/\//i,
  /free crypto/i,
  /buy followers/i,
  /casino/i,
  /call now \+?\d{10}/i,
];

export async function analyzeReportText(
  text: string,
  userProvidedCategory?: ReportCategory
): Promise<NlpAnalysisResult> {
  const cleanText = text.trim();

  // Check spam first
  const isSpam = SPAM_PATTERNS.some(p => p.test(cleanText)) || cleanText.length < 5;

  // 1. Try Gemini API if key is present and not obviously spam
  if (env.GEMINI_API_KEY && !isSpam) {
    try {
      const prompt = `You are CityPulse's AI Urban Incident Classifier. Analyze the citizen report:
"${cleanText}"

Respond ONLY with valid JSON matching this schema:
{
  "category": "Safety" | "Accident" | "Traffic" | "Cleanliness" | "Pothole" | "Lighting" | "Other",
  "severity": <integer 1 to 5>,
  "sentiment": <float -1.0 to 1.0>,
  "locationHints": [<string of extracted landmark/chowk/street names>],
  "spam": <boolean>,
  "toxicity": <boolean>,
  "confidence": <float 0.0 to 1.0>
}`;

      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' },
          }),
        }
      );

      if (resp.ok) {
        const data = (await resp.json()) as any;
        const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (jsonText) {
          const parsed = JSON.parse(jsonText);
          const validCategories: ReportCategory[] = [
            'Safety', 'Accident', 'Traffic', 'Cleanliness', 'Pothole', 'Lighting', 'Other'
          ];
          const cat = validCategories.includes(parsed.category)
            ? parsed.category
            : userProvidedCategory || 'Other';

          return {
            category: cat,
            severity: Math.min(5, Math.max(1, Math.round(parsed.severity || 3))),
            sentiment: Math.min(1, Math.max(-1, Number(parsed.sentiment || -0.5))),
            locationHints: Array.isArray(parsed.locationHints) ? parsed.locationHints : [],
            spamFlag: Boolean(parsed.spam),
            toxicityFlag: Boolean(parsed.toxicity),
            confidence: Number(parsed.confidence || 0.85),
            source: 'ai',
          };
        }
      }
    } catch (err) {
      console.warn('Gemini NLP call failed, using rule-based NLP fallback');
    }
  }

  // 2. Rule-Based NLP Fallback
  return fallbackRuleBasedNlp(cleanText, userProvidedCategory, isSpam);
}

export function fallbackRuleBasedNlp(
  text: string,
  userProvidedCategory?: ReportCategory,
  isSpam: boolean = false
): NlpAnalysisResult {
  const lower = text.toLowerCase();

  // Category determination
  let detectedCategory: ReportCategory = userProvidedCategory || 'Other';
  let bestMatches = 0;

  for (const [cat, words] of Object.entries(CATEGORY_KEYWORDS) as [ReportCategory, string[]][]) {
    let count = 0;
    for (const w of words) {
      if (lower.includes(w)) count++;
    }
    if (count > bestMatches) {
      bestMatches = count;
      detectedCategory = cat;
    }
  }

  // Severity calculation (1-5)
  let severity = 3; // Default moderate
  const hasHigh = HIGH_SEVERITY_WORDS.some(w => lower.includes(w));
  const hasMod = MODERATE_SEVERITY_WORDS.some(w => lower.includes(w));

  if (hasHigh) {
    severity = 5;
  } else if (hasMod) {
    severity = 3;
  } else {
    severity = 2;
  }

  // Sentiment calculation: incident reports are naturally negative/urgent (-0.2 to -0.9)
  let sentiment = -0.4;
  if (severity >= 4) sentiment = -0.8;
  if (severity === 1) sentiment = -0.2;

  // Extract location hints (e.g. Near X, Chowk, Road, Bridge, Station)
  const locationHints: string[] = [];
  const locRegex = /(?:near|at|opposite|behind|on|chowk|road|station|flyover|bridge|hospital|mall)\s+([a-zA-Z0-9\s]{3,20})/gi;
  let match;
  while ((match = locRegex.exec(text)) !== null) {
    if (match[1] && match[1].trim()) {
      locationHints.push(match[1].trim());
    }
  }

  return {
    category: detectedCategory,
    severity,
    sentiment,
    locationHints: locationHints.slice(0, 3),
    spamFlag: isSpam,
    toxicityFlag: false,
    confidence: bestMatches > 0 ? 0.75 : 0.5,
    source: 'fallback',
  };
}
