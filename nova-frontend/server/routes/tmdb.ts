import { Hono } from 'hono';

const tmdbRouter = new Hono();

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const DEFAULT_LANGUAGE = 'es-ES';
const CACHE_TTL_MS = 5 * 60 * 1000;
const ALLOWED_PATH = /^\/[a-z0-9/_-]+$/i;

type CacheEntry = {
  expiresAt: number;
  payload: unknown;
  status: number;
};

const tmdbCache = new Map<string, CacheEntry>();

const buildCacheKey = (path: string, query: URLSearchParams): string =>
  `${path}?${query.toString()}`;

const getOrSetLanguage = (query: URLSearchParams): URLSearchParams => {
  const next = new URLSearchParams(query);
  if (!next.get('language')) {
    next.set('language', DEFAULT_LANGUAGE);
  }
  return next;
};

tmdbRouter.get('/*', async (c) => {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    return c.json({ error: 'TMDB_API_KEY is not configured on backend' }, 500);
  }

  const fullPath = c.req.path;
  const proxiedPath = fullPath.replace(/^\/api\/tmdb/, '') || '/';

  if (!ALLOWED_PATH.test(proxiedPath) || proxiedPath.includes('..')) {
    return c.json({ error: 'Invalid TMDB path' }, 400);
  }

  const query = getOrSetLanguage(new URL(c.req.url).searchParams);
  query.set('api_key', apiKey);

  const cacheKey = buildCacheKey(proxiedPath, query);
  const now = Date.now();
  const cached = tmdbCache.get(cacheKey);

  if (cached && cached.expiresAt > now) {
    return c.json(cached.payload, cached.status);
  }

  const upstreamUrl = `${TMDB_BASE_URL}${proxiedPath}?${query.toString()}`;
  const upstreamResponse = await fetch(upstreamUrl, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!upstreamResponse.ok) {
    const text = await upstreamResponse.text();
    return c.json(
      {
        error: 'TMDB upstream error',
        status: upstreamResponse.status,
        message: text.slice(0, 300),
      },
      upstreamResponse.status
    );
  }

  const payload = await upstreamResponse.json();
  tmdbCache.set(cacheKey, {
    payload,
    status: upstreamResponse.status,
    expiresAt: now + CACHE_TTL_MS,
  });

  return c.json(payload, upstreamResponse.status);
});

export { tmdbRouter };
