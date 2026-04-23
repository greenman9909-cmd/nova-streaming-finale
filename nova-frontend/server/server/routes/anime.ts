
import { Hono } from 'hono';
import { ANIME, META } from '@consumet/extensions';

const animeRouter = new Hono();
// Use Hianime (formerly Zoro) as the primary provider
const provider = new ANIME.Hianime();

// Helper to handle errors
const handleError = (c: any, error: any) => {
    console.error('Anime API Error:', error);
    return c.json({ error: error.message || 'Internal Server Error' }, 500);
};

// Get Home/Trending Data
animeRouter.get('/home', async (c) => {
    try {
        // Fetch trending and spotlight in parallel for speed
        const [trending, spotlight] = await Promise.all([
            provider.fetchTrendingAnime(),
            provider.fetchSpotlightAnime()
        ]);

        return c.json({
            results: {
                trending: trending.results,
                spotlights: spotlight.results,
                latestEpisodes: trending.results, // Fallback/Alias for Home.tsx
                mostPopular: [] // Optional
            }
        });
    } catch (error) {
        return handleError(c, error);
    }
});

// Trending (Separate endpoint if needed)
animeRouter.get('/trending', async (c) => {
    try {
        const data = await provider.fetchTrendingAnime();
        return c.json({ results: data.results });
    } catch (error) {
        return handleError(c, error);
    }
});

// Popular
animeRouter.get('/popular', async (c) => {
    try {
        const data = await provider.fetchMostPopularAnime();
        return c.json({ results: data.results });
    } catch (error) {
        return handleError(c, error);
    }
});

// Search
animeRouter.get('/search/:query', async (c) => {
    const query = c.req.param('query');
    try {
        const data = await provider.search(query);
        return c.json({ results: data.results });
    } catch (error) {
        return handleError(c, error);
    }
});

// Info
animeRouter.get('/info/:id', async (c) => {
    const id = c.req.param('id');
    try {
        const data = await provider.fetchAnimeInfo(id);
        return c.json(data);
    } catch (error) {
        return handleError(c, error);
    }
});

// Stream Sources
animeRouter.get('/watch/:episodeId', async (c) => {
    const episodeId = c.req.param('episodeId');
    const server = c.req.query('server');
    // Default server logic handled by provider or we can specify
    try {
        // fetchEpisodeSources(episodeId, server category?)
        // Consumet args: episodeId, server (optional)
        const data = await provider.fetchEpisodeSources(episodeId, server as any);
        return c.json({ results: data });
    } catch (error) {
        return handleError(c, error);
    }
});

// Available Servers (if supported)
animeRouter.get('/servers/:episodeId', async (c) => {
    const episodeId = c.req.param('episodeId');
    try {
        // Zoro provider usually returns servers with sources, but we can try fetches
        // provider.fetchEpisodeServers(episodeId) might not be standard on all providers
        // For Zoro, fetchEpisodeSources returns sources.
        // We'll return empty if not supported, or check provider capabilities.
        return c.json({ results: [] });
    } catch (error) {
        return handleError(c, error);
    }
});

export { animeRouter };
