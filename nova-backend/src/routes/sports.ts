import { Hono } from 'hono';

const sports = new Hono();
const STREAMED_API = 'https://streamed.pk/api';

// Helper to reliably proxy requests with proper error handling
const proxyFetch = async (endpoint: string) => {
    try {
        const response = await fetch(`${STREAMED_API}${endpoint}`, {
            headers: {
                'Accept': 'application/json'
            }
        });
        if (!response.ok) {
            console.warn(`Upstream API failed for ${endpoint}: ${response.status}`);
            return null; // Return null on failure and let the handler deal with fallback
        }
        return await response.json();
    } catch (err) {
        console.error(`Error fetching from streamed.pk${endpoint}:`, err);
        return null;
    }
};

sports.get('/matches/live', async (c) => {
    const data = await proxyFetch('/matches/live');
    return c.json(data || []);
});

sports.get('/matches/all-today', async (c) => {
    const data = await proxyFetch('/matches/all-today');
    return c.json(data || []);
});

sports.get('/sports', async (c) => {
    const data = await proxyFetch('/sports');
    // Fallback just in case, but streamed.pk usually provides this
    return c.json(data || [
        { id: 'football', name: 'Football' },
        { id: 'basketball', name: 'Basketball' },
        { id: 'hockey', name: 'Hockey' },
        { id: 'tennis', name: 'Tennis' },
        { id: 'f1', name: 'Formula 1' }
    ]);
});

sports.get('/matches/:sport', async (c) => {
    const sport = c.req.param('sport');
    const endpoint = sport === 'all' ? '/matches/all' : `/matches/${sport}`;
    const data = await proxyFetch(endpoint);
    return c.json(data || []);
});

sports.get('/stream/:source/:id', async (c) => {
    const source = c.req.param('source');
    const id = c.req.param('id');
    const data = await proxyFetch(`/stream/${source}/${id}`);
    return c.json(data || []);
});

export { sports as sportsRouter };
