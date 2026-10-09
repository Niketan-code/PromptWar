import { queryOne, execute } from '../db/connection.js';

export async function getCache<T>(key: string): Promise<T | null> {
  const now = Date.now();
  const row = await queryOne<{ value: string; expires_at: number }>(
    'SELECT value, expires_at FROM api_cache WHERE key = ? AND expires_at > ?',
    [key, now]
  );
  if (!row) return null;
  try {
    return JSON.parse(row.value) as T;
  } catch {
    return null;
  }
}

export async function setCache(key: string, value: any, ttlSeconds: number): Promise<void> {
  const expiresAt = Date.now() + ttlSeconds * 1000;
  const json = JSON.stringify(value);
  await execute(
    'INSERT OR REPLACE INTO api_cache (key, value, expires_at) VALUES (?, ?, ?)',
    [key, json, expiresAt]
  );
}

export async function clearExpiredCache(): Promise<void> {
  const now = Date.now();
  await execute('DELETE FROM api_cache WHERE expires_at <= ?', [now]);
}
