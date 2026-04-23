
import { Hono } from 'hono';
import axios from 'axios';

const sportsRouter = new Hono();
const BASE_URL = 'https://streamed.pk/api';

// Create a client with browser-like headers
const client = axios.create({
    baseURL: BASE_URL,
    timeout: 12000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://streamed.pk/',
        'Origin': 'https://streamed.pk',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin',
    }
});

const MAX_RETRIES = 2;
const RETRY_DELAY = 800;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const fetchWithRetry = async (endpoint: string, retries = 0): Promise<any> => {
    try {
        const response = await client.get(endpoint);
        return response.data;
    } catch (error: any) {
        if (retries < MAX_RETRIES) {
            await sleep(RETRY_DELAY * (retries + 1));
            return fetchWithRetry(endpoint, retries + 1);
        }
        console.warn(`[Sports] All retries exhausted for ${endpoint}: ${error.message}`);
        throw error;
    }
};

const proxyRequest = async (endpoint: string) => {
    return fetchWithRetry(endpoint);
};

// All routes return 200+[] on failure so the frontend can use its mock fallback
// without red console errors

sportsRouter.get('/matches/live', async (c) => {
    try {
        const data = await proxyRequest('/matches/live');
        return c.json(Array.isArray(data) ? data : []);
    } catch {
        return c.json([]);
    }
});

sportsRouter.get('/matches/all-today', async (c) => {
    try {
        const data = await proxyRequest('/matches/all-today');
        return c.json(Array.isArray(data) ? data : []);
    } catch {
        return c.json([]);
    }
});

sportsRouter.get('/matches/all/popular', async (c) => {
    try {
        const data = await proxyRequest('/matches/all/popular');
        return c.json(Array.isArray(data) ? data : []);
    } catch {
        return c.json([]);
    }
});

sportsRouter.get('/sports', async (c) => {
    try {
        const data = await proxyRequest('/sports');
        return c.json(Array.isArray(data) ? data : []);
    } catch {
        return c.json([]);
    }
});

sportsRouter.get('/matches/:sport', async (c) => {
    const sport = c.req.param('sport');
    try {
        const data = await proxyRequest(`/matches/${sport}`);
        return c.json(Array.isArray(data) ? data : []);
    } catch {
        return c.json([]);
    }
});

sportsRouter.get('/stream/:source/:id', async (c) => {
    const source = c.req.param('source');
    const id = c.req.param('id');
    try {
        const data = await proxyRequest(`/stream/${source}/${id}`);
        return c.json(Array.isArray(data) ? data : []);
    } catch {
        return c.json([]);
    }
});


sportsRouter.get('/images/badge/:id', async (c) => {
    const id = c.req.param('id');
    try {
        const response = await client.get(`/../images/badge/${id}`, {
            responseType: 'arraybuffer'
        });
        c.header('Content-Type', response.headers['content-type'] || 'image/webp');
        c.header('Cache-Control', 'public, max-age=3600');
        return c.body(response.data);
    } catch {
        return c.body(null, 404);
    }
});

sportsRouter.get('/images/poster/:id', async (c) => {
    const id = c.req.param('id');
    try {
        const response = await client.get(`/../images/poster/${id}`, {
            responseType: 'arraybuffer'
        });
        c.header('Content-Type', response.headers['content-type'] || 'image/webp');
        c.header('Cache-Control', 'public, max-age=3600');
        return c.body(response.data);
    } catch {
        return c.body(null, 404);
    }
});

export { sportsRouter };
