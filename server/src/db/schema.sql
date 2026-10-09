CREATE TABLE IF NOT EXISTS places (
  id TEXT PRIMARY KEY,
  osm_id TEXT,
  city TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  tags TEXT,
  price_tier INTEGER DEFAULT 1,
  rating REAL DEFAULT 4.0,
  opening_hours TEXT,
  wheelchair TEXT DEFAULT 'unknown',
  source TEXT DEFAULT 'real',
  fetched_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_places_city_cat ON places(city, category);
CREATE INDEX IF NOT EXISTS idx_places_lat_lng ON places(lat, lng);

CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  city TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  severity INTEGER DEFAULT 3,
  sentiment REAL DEFAULT 0,
  photo_path TEXT,
  voice_transcript TEXT,
  spam_flag INTEGER DEFAULT 0,
  credibility INTEGER DEFAULT 50,
  status TEXT DEFAULT 'likely',
  cluster_id TEXT,
  upvotes INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  resolved_at INTEGER,
  source TEXT DEFAULT 'user'
);

CREATE INDEX IF NOT EXISTS idx_reports_city ON reports(city, created_at);
CREATE INDEX IF NOT EXISTS idx_reports_lat_lng ON reports(lat, lng);

CREATE TABLE IF NOT EXISTS clusters (
  id TEXT PRIMARY KEY,
  city TEXT NOT NULL,
  category TEXT NOT NULL,
  centroid_lat REAL NOT NULL,
  centroid_lng REAL NOT NULL,
  report_count INTEGER DEFAULT 1,
  max_severity INTEGER DEFAULT 1,
  first_at INTEGER NOT NULL,
  last_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_clusters_city ON clusters(city);

CREATE TABLE IF NOT EXISTS risk_zones (
  id TEXT PRIMARY KEY,
  city TEXT NOT NULL,
  kind TEXT NOT NULL,
  name TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  radius_m REAL DEFAULT 250,
  base_risk REAL DEFAULT 0.5,
  night_multiplier REAL DEFAULT 1.8,
  source TEXT DEFAULT 'seed'
);

CREATE INDEX IF NOT EXISTS idx_risk_zones_city ON risk_zones(city);

CREATE TABLE IF NOT EXISTS place_scores (
  place_id TEXT PRIMARY KEY,
  city TEXT NOT NULL,
  safety REAL NOT NULL,
  cleanliness REAL NOT NULL,
  affordability REAL NOT NULL,
  rating REAL NOT NULL,
  accessibility REAL NOT NULL,
  composite_score REAL NOT NULL,
  reason_text TEXT,
  updated_at INTEGER,
  source TEXT DEFAULT 'seed'
);

CREATE INDEX IF NOT EXISTS idx_place_scores_city ON place_scores(city);

CREATE TABLE IF NOT EXISTS story_cards (
  place_id TEXT PRIMARY KEY,
  history_text TEXT NOT NULL,
  cultural_significance TEXT NOT NULL,
  tradition_festival_tip TEXT NOT NULL,
  generated_by TEXT DEFAULT 'ai',
  created_at INTEGER
);

CREATE TABLE IF NOT EXISTS social_posts (
  id TEXT PRIMARY KEY,
  city TEXT NOT NULL,
  area TEXT NOT NULL,
  text TEXT NOT NULL,
  ts INTEGER NOT NULL,
  sentiment REAL NOT NULL,
  topics TEXT NOT NULL,
  source TEXT DEFAULT 'seed'
);

CREATE INDEX IF NOT EXISTS idx_social_posts_city ON social_posts(city);

CREATE TABLE IF NOT EXISTS api_cache (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_cache_expires ON api_cache(expires_at);

CREATE TABLE IF NOT EXISTS upvotes (
  report_id TEXT NOT NULL,
  client_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (report_id, client_hash)
);
