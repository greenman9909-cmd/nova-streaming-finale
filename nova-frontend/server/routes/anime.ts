
import { Hono } from 'hono';
import { ANIME, StreamingServers, SubOrSub } from '@consumet/extensions';

const animeRouter = new Hono();
// Use Hianime (formerly Zoro) as the primary provider
const provider = new ANIME.Hianime();
const ANIME_SOURCE_API_BASE = 'https://anime-peach-eight.vercel.app/api';

const normalizeEpisodeId = (episodeId: string): string => {
    const decoded = decodeURIComponent(episodeId || '').trim();
    if (!decoded) return '';
    if (decoded.includes('$episode$')) return decoded;
    if (decoded.includes('?ep=')) return decoded.replace('?ep=', '$episode$');
    return decoded;
};

const normalizeAnimeQuery = (value: string): string =>
    value
        .replace(/[-_]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

const mapServer = (server?: string): StreamingServers | undefined => {
    const normalized = (server || '').trim().toLowerCase();
    if (!normalized) return undefined;

    switch (normalized) {
        case 'hd-1':
        case 'megacloud':
        case 'vidcloud':
        case 'rapidcloud':
            return StreamingServers.VidCloud;
        case 'hd-2':
        case 'vidstream':
        case 'vidstreaming':
            return StreamingServers.VidStreaming;
        case 'hd-3':
        case 'streamsb':
            return StreamingServers.StreamSB;
        case 'pro':
        case 'streamtape':
            return StreamingServers.StreamTape;
        default:
            return undefined;
    }
};

const mapSubOrDub = (type?: string): SubOrSub | undefined => {
    const normalized = (type || '').trim().toLowerCase();
    if (!normalized) return undefined;
    return normalized === 'dub' ? SubOrSub.DUB : SubOrSub.SUB;
};

const toAnimeSourceId = (normalizedEpisodeId: string): string =>
    normalizedEpisodeId.includes('$episode$')
        ? normalizedEpisodeId.replace('$episode$', '?ep=')
        : normalizedEpisodeId;

const fetchAnimeSourceStream = async (
    normalizedEpisodeId: string,
    server?: string,
    type?: string
) => {
    const externalId = toAnimeSourceId(normalizedEpisodeId);
    const streamUrl = `${ANIME_SOURCE_API_BASE}/stream?id=${encodeURIComponent(externalId)}&server=${encodeURIComponent(server || 'hd-1')}&type=${encodeURIComponent(type || 'sub')}`;
    const response = await fetch(streamUrl);
    if (!response.ok) throw new Error(`Fallback source failed with status ${response.status}`);

    const payload = await response.json();
    if (!payload?.success) throw new Error('Fallback source did not return success');
    return payload;
};

const resolveAnimeInfo = async (rawId: string) => {
    const animeId = decodeURIComponent(rawId || '').trim();
    if (!animeId) throw new Error('Anime id is required');

    try {
        return await provider.fetchAnimeInfo(animeId);
    } catch {
        const query = normalizeAnimeQuery(animeId);
        if (!query) throw new Error('Anime id is invalid');

        const search = await provider.search(query, 1);
        const candidates = search.results || [];
        const normalizedId = animeId.toLowerCase();
        const best =
            candidates.find((item: any) => item?.id?.toLowerCase() === normalizedId) ||
            candidates.find((item: any) => item?.id?.toLowerCase().includes(normalizedId)) ||
            candidates[0];

        if (!best?.id) throw new Error(`Anime not found: ${animeId}`);
        return await provider.fetchAnimeInfo(best.id);
    }
};

// Helper to handle errors
const handleError = (c: any, error: any) => {
    console.error('Anime API Error:', error);
    return c.json({ error: error.message || 'Internal Server Error' }, 500);
};

// Get Home/Trending Data
animeRouter.get('/home', async (c) => {
    try {
        const [topAiring, spotlight, recentlyUpdated, mostPopular] = await Promise.all([
            provider.fetchTopAiring(),
            provider.fetchSpotlight(),
            provider.fetchRecentlyUpdated(),
            provider.fetchMostPopular()
        ]);

        return c.json({
            success: true,
            results: {
                trending: topAiring.results,
                spotlights: spotlight.results,
                latestEpisodes: recentlyUpdated.results,
                mostPopular: mostPopular.results
            }
        });
    } catch (error) {
        return handleError(c, error);
    }
});

// Trending (Separate endpoint if needed)
animeRouter.get('/trending', async (c) => {
    try {
        const data = await provider.fetchTopAiring();
        return c.json({ success: true, results: data.results });
    } catch (error) {
        return handleError(c, error);
    }
});

// Popular
animeRouter.get('/popular', async (c) => {
    try {
        const data = await provider.fetchMostPopular();
        return c.json({ success: true, results: data.results });
    } catch (error) {
        return handleError(c, error);
    }
});

// Search
animeRouter.get('/search/:query', async (c) => {
    const query = c.req.param('query');
    try {
        const data = await provider.search(query, 1);
        return c.json({ success: true, results: data.results });
    } catch (error) {
        return handleError(c, error);
    }
});

// Info
animeRouter.get('/info/:id', async (c) => {
    const id = c.req.param('id');
    try {
        const data = await provider.fetchAnimeInfo(id);
        return c.json({ success: true, results: data });
    } catch (error) {
        return handleError(c, error);
    }
});

// Episode List
animeRouter.get('/episodes/:id', async (c) => {
    const id = c.req.param('id');
    try {
        const data = await resolveAnimeInfo(id);
        const episodes = (data.episodes || []).map((ep) => ({
            id: ep.id,
            episode_no: ep.number,
            title: ep.title || `Episode ${ep.number}`,
            data_id: ep.number
        }));

        return c.json({
            success: true,
            results: {
                animeId: data.id,
                episodes
            }
        });
    } catch (error) {
        return handleError(c, error);
    }
});

// Stream Sources
animeRouter.get('/watch/:episodeId', async (c) => {
    const episodeId = c.req.param('episodeId');
    const rawServer = c.req.query('server') || '';
    const rawType = c.req.query('type') || '';
    const server = mapServer(c.req.query('server'));
    const subOrDub = mapSubOrDub(c.req.query('type'));

    try {
        const normalizedEpisodeId = normalizeEpisodeId(episodeId);
        if (!normalizedEpisodeId) {
            return c.json({ success: false, error: 'Episode id is required' }, 400);
        }

        try {
            const data = await provider.fetchEpisodeSources(normalizedEpisodeId, server, subOrDub);
            const hasSourceArray = Array.isArray(data?.sources) && data.sources.length > 0;
            if (hasSourceArray) {
                return c.json({ success: true, results: data });
            }
            throw new Error('No sources returned');
        } catch {
            const fallbackPayload = await fetchAnimeSourceStream(normalizedEpisodeId, rawServer, rawType);
            return c.json(fallbackPayload);
        }
    } catch (error) {
        return handleError(c, error);
    }
});

// Available Servers (if supported)
animeRouter.get('/servers/:episodeId', async (c) => {
    try {
        return c.json({
            success: true,
            results: [
                { server_id: 'hd-1', server_name: 'HD-1', type: 'sub' },
                { server_id: 'hd-2', server_name: 'HD-2', type: 'sub' },
                { server_id: 'hd-3', server_name: 'HD-3', type: 'sub' },
                { server_id: 'megacloud', server_name: 'MegaCloud', type: 'sub' }
            ]
        });
    } catch (error) {
        return handleError(c, error);
    }
});

export { animeRouter };
