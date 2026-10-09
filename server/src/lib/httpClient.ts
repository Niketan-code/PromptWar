export interface RequestOptions extends RequestInit {
  timeoutMs?: number;
  retries?: number;
}

export async function fetchWithRetry(url: string, options: RequestOptions = {}): Promise<Response> {
  const timeoutMs = options.timeoutMs ?? 8000;
  const retries = options.retries ?? 2;

  const headers = new Headers(options.headers || {});
  if (!headers.has('User-Agent')) {
    headers.set('User-Agent', 'CityPulse-UrbanIntelligence/1.0 (HackathonDemo; contact: demo@citypulse.local)');
  }

  let attempt = 0;
  while (attempt <= retries) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeout);
      if (response.ok) {
        return response;
      }

      // If rate limited or 5xx error, retry with backoff
      if (response.status === 429 || response.status >= 500) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (err: any) {
      clearTimeout(timeout);
      attempt++;
      if (attempt > retries) {
        throw err;
      }
      // Exponential backoff with jitter: 500ms, 1200ms
      const delay = Math.pow(2, attempt) * 400 + Math.random() * 200;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error(`Failed to fetch ${url} after ${retries} retries`);
}
