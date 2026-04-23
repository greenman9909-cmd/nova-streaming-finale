
import { Hono } from 'hono';
import axios from 'axios';

const sportsRouter = new Hono();
const BASE_URL = 'https://streamed.pk/api';

// Create a client with browser-like headers
const client = axios.create({
    baseURL: BASE_URL,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://streamed.pk/',
        'Origin': 'https://streamed.pk'
    }
});

const proxyRequest = async (endpoint: string) => {
    try {
        const response = await client.get(endpoint);
        return response.data;
    } catch (error) {
        console.error(`Error proxying to ${endpoint}:`, error);
        throw error;
    }
};

sportsRouter.get('/matches/live', async (c) => {
    try {
        const data = await proxyRequest('/matches/live');
        return c.json(data);
    } catch (e) { return c.json([], 500); }
});

sportsRouter.get('/matches/all-today', async (c) => {
    try {
        const data = await proxyRequest('/matches/all-today');
        return c.json(data);
    } catch (e) { return c.json([], 500); }
});

sportsRouter.get('/matches/all/popular', async (c) => {
    try {
        const data = await proxyRequest('/matches/all/popular');
        return c.json(data);
    } catch (e) { return c.json([], 500); }
});

sportsRouter.get('/sports', async (c) => {
    try {
        const data = await proxyRequest('/sports');
        return c.json(data);
    } catch (e) { return c.json([], 500); }
});

sportsRouter.get('/matches/:sport', async (c) => {
    const sport = c.req.param('sport');
    try {
        const data = await proxyRequest(`/matches/${sport}`);
        return c.json(data);
    } catch (e) { return c.json([], 500); }
});

sportsRouter.get('/stream/:source/:id', async (c) => {
    const source = c.req.param('source');
    const id = c.req.param('id');
    try {
        const data = await proxyRequest(`/stream/${source}/${id}`);
        return c.json(data);
    } catch (e) { return c.json([], 500); }
});

export { sportsRouter };
