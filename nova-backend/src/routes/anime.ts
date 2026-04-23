import { Hono } from 'hono';

const animeRouter = new Hono();

// Base URL for the hosted anime API (itzzzme/anime-api on Vercel)
const API_BASE = 'https://anime-peach-eight.vercel.app/api';

// Cache configuration
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
let homeCache: { data: any; timestamp: number } | null = null;

// Get home data (spotlights, trending, popular, etc.)
animeRouter.get('/home', async (c) => {
    try {
        // Return cached data if valid
        if (homeCache && Date.now() - homeCache.timestamp < CACHE_TTL) {
            return c.json(homeCache.data);
        }

        const response = await fetch(`${API_BASE}/`);
        const data = await response.json();

        if (data.success && data.results) {
            // Update cache
            homeCache = {
                data,
                timestamp: Date.now()
            };
            return c.json(data);
        }
        throw new Error('Invalid upstream data');
    } catch (error) {
        console.error('Home error:', error);

        // Return stale cache if available and upstream fails
        if (homeCache) {
            return c.json(homeCache.data);
        }
        return c.json({ error: 'Failed to get home data' }, 500);
    }
});

// Get trending anime
animeRouter.get('/trending', async (c) => {
    try {
        const response = await fetch(`${API_BASE}/`);
        const data = await response.json();

        if (data.success && data.results?.trending) {
            return c.json({
                success: true,
                results: data.results.trending.map((anime: any) => ({
                    id: anime.id,
                    title: { english: anime.title, native: anime.japanese_title },
                    image: anime.poster,
                    rating: anime.number ? anime.number * 10 : 85,
                    type: 'TV',
                    releaseDate: '2024'
                }))
            });
        }
        return c.json({ results: getMockAnimeList() });
    } catch (error) {
        console.error('Trending error:', error);
        return c.json({ results: getMockAnimeList() });
    }
});

// Get popular anime  
animeRouter.get('/popular', async (c) => {
    try {
        const response = await fetch(`${API_BASE}/`);
        const data = await response.json();

        if (data.success && data.results?.mostPopular) {
            return c.json({
                success: true,
                results: data.results.mostPopular.map((anime: any) => ({
                    id: anime.id,
                    title: { english: anime.title, native: anime.japanese_title },
                    image: anime.poster,
                    description: anime.description,
                    rating: 90,
                    type: anime.tvInfo?.showType || 'TV',
                    releaseDate: '2024'
                }))
            });
        }
        return c.json({ results: getMockAnimeList() });
    } catch (error) {
        console.error('Popular error:', error);
        return c.json({ results: getMockAnimeList() });
    }
});

// Get recent/latest episodes
animeRouter.get('/recent', async (c) => {
    try {
        const response = await fetch(`${API_BASE}/`);
        const data = await response.json();

        if (data.success && data.results?.latestEpisode) {
            return c.json({
                success: true,
                results: data.results.latestEpisode.map((anime: any) => ({
                    id: anime.id,
                    title: { english: anime.title, native: anime.japanese_title },
                    image: anime.poster,
                    description: anime.description,
                    rating: 85,
                    type: anime.tvInfo?.showType || 'TV',
                    releaseDate: '2024'
                }))
            });
        }
        return c.json({ results: getMockAnimeList() });
    } catch (error) {
        console.error('Recent error:', error);
        return c.json({ results: getMockAnimeList() });
    }
});

// Get top airing anime
animeRouter.get('/top-airing', async (c) => {
    try {
        const response = await fetch(`${API_BASE}/`);
        const data = await response.json();

        if (data.success && data.results?.topAiring) {
            return c.json({
                success: true,
                results: data.results.topAiring.map((anime: any) => ({
                    id: anime.id,
                    title: { english: anime.title, native: anime.japanese_title },
                    image: anime.poster,
                    description: anime.description,
                    rating: 90,
                    type: anime.tvInfo?.showType || 'TV',
                    releaseDate: '2024'
                }))
            });
        }
        return c.json({ results: getMockAnimeList() });
    } catch (error) {
        console.error('Top Airing error:', error);
        return c.json({ results: getMockAnimeList() });
    }
});

// Get spotlights for hero section
animeRouter.get('/spotlights', async (c) => {
    try {
        const response = await fetch(`${API_BASE}/`);
        const data = await response.json();

        if (data.success && data.results?.spotlights) {
            return c.json({
                success: true,
                results: data.results.spotlights.map((anime: any) => ({
                    id: anime.id,
                    data_id: anime.data_id,
                    title: anime.title,
                    japanese_title: anime.japanese_title,
                    description: anime.description,
                    poster: anime.poster,
                    tvInfo: anime.tvInfo
                }))
            });
        }
        return c.json({ success: false, results: [] });
    } catch (error) {
        console.error('Spotlights error:', error);
        return c.json({ success: false, results: [] });
    }
});

// Search anime
animeRouter.get('/search', async (c) => {
    const query = c.req.query('q') || c.req.query('keyword');
    if (!query) {
        return c.json({ error: 'Query parameter is required' }, 400);
    }

    try {
        const response = await fetch(`${API_BASE}/search?keyword=${encodeURIComponent(query)}`);
        const data = await response.json();

        if (data.success && data.results) {
            return c.json({
                success: true,
                results: data.results.map((anime: any) => ({
                    id: anime.id,
                    data_id: anime.data_id,
                    title: { english: anime.title, native: anime.japanese_title },
                    image: anime.poster,
                    tvInfo: anime.tvInfo,
                    type: 'TV'
                }))
            });
        }
        return c.json({ success: false, results: [] });
    } catch (error) {
        console.error('Search error:', error);
        return c.json({ error: 'Failed to search anime' }, 500);
    }
});

// Get anime info (query param version - frontend uses this)
animeRouter.get('/info', async (c) => {
    const id = c.req.query('id');
    if (!id) {
        return c.json({ error: 'ID is required' }, 400);
    }

    try {
        const response = await fetch(`${API_BASE}/info?id=${encodeURIComponent(id)}`);
        const data = await response.json();
        return c.json(data);
    } catch (error) {
        console.error('Info error:', error);
        return c.json({ error: 'Failed to get anime info' }, 500);
    }
});

// Get anime info (path param version)
animeRouter.get('/info/:id', async (c) => {
    const id = c.req.param('id');

    try {
        const response = await fetch(`${API_BASE}/info?id=${encodeURIComponent(id)}`);
        const data = await response.json();
        return c.json(data);
    } catch (error) {
        console.error('Info error:', error);
        return c.json({ error: 'Failed to get anime info' }, 500);
    }
});

// Get episodes list
animeRouter.get('/episodes/:id', async (c) => {
    const id = c.req.param('id');

    try {
        const response = await fetch(`${API_BASE}/episodes/${encodeURIComponent(id)}`);
        const data = await response.json();
        return c.json(data);
    } catch (error) {
        console.error('Episodes error:', error);
        return c.json({ error: 'Failed to get episodes' }, 500);
    }
});

// Get episode stream sources via query params (frontend uses this)
animeRouter.get('/stream', async (c) => {
    const episodeId = c.req.query('id');
    const server = c.req.query('server') || 'hd-1';
    const type = c.req.query('type') || 'sub';

    if (!episodeId) {
        return c.json({ error: 'Episode ID is required' }, 400);
    }

    try {
        const response = await fetch(
            `${API_BASE}/stream?id=${encodeURIComponent(episodeId)}&server=${server}&type=${type}`
        );
        const data = await response.json();
        return c.json(data);
    } catch (error) {
        console.error('Stream error:', error);
        // Fallback to demo stream if API fails
        return c.json({
            success: true,
            results: {
                streamingLink: {
                    link: {
                        file: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
                    }
                }
            }
        });
    }
});

// Get episode stream sources (alternate route)
animeRouter.get('/watch/:episodeId', async (c) => {
    const episodeId = c.req.param('episodeId');
    const server = c.req.query('server') || 'hd-1';
    const type = c.req.query('type') || 'sub';

    try {
        const response = await fetch(
            `${API_BASE}/stream?id=${encodeURIComponent(episodeId)}&server=${server}&type=${type}`
        );
        const data = await response.json();
        return c.json(data);
    } catch (error) {
        console.error('Stream error:', error);
        // Fallback to demo stream if API fails
        return c.json({
            success: true,
            results: {
                streamingLink: {
                    link: {
                        file: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
                    }
                }
            }
        });
    }
});

// Get available servers for an episode
animeRouter.get('/servers/:episodeId', async (c) => {
    const episodeId = c.req.param('episodeId');

    try {
        const response = await fetch(`${API_BASE}/servers/${encodeURIComponent(episodeId)}`);
        const data = await response.json();
        return c.json(data);
    } catch (error) {
        console.error('Servers error:', error);
        return c.json({ error: 'Failed to get servers' }, 500);
    }
});

// Get top 10 anime
animeRouter.get('/top-ten', async (c) => {
    try {
        const response = await fetch(`${API_BASE}/top-ten`);
        const data = await response.json();
        return c.json(data);
    } catch (error) {
        console.error('Top ten error:', error);
        return c.json({ error: 'Failed to get top ten' }, 500);
    }
});

// Mock data fallback
function getMockAnimeList() {
    return [
        {
            id: 'solo-leveling-18718',
            title: { english: 'Solo Leveling', native: '俺だけレベルアップな件' },
            image: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx151807-m1gX3iwfIsLu.png',
            rating: 85,
            type: 'TV',
            releaseDate: '2024'
        },
        {
            id: 'jujutsu-kaisen-2nd-season-17912',
            title: { english: 'Jujutsu Kaisen Season 2', native: '呪術廻戦' },
            image: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx145064-5fa4ZBbW4dqA.jpg',
            rating: 88,
            type: 'TV',
            releaseDate: '2023'
        },
        {
            id: 'demon-slayer-kimetsu-no-yaiba-hashira-training-arc-19109',
            title: { english: 'Demon Slayer: Hashira Training Arc', native: '鬼滅の刃' },
            image: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx166240-aOCZjxr1vMPC.jpg',
            rating: 84,
            type: 'TV',
            releaseDate: '2024'
        },
        {
            id: 'one-piece-100',
            title: { english: 'One Piece', native: 'ワンピース' },
            image: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/nx21-tXMN3Y20PIL9.jpg',
            rating: 88,
            type: 'TV',
            releaseDate: '1999'
        },
        {
            id: 'attack-on-titan-the-final-season-16498',
            title: { english: 'Attack on Titan Final Season', native: '進撃の巨人' },
            image: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx110277-qDRIhu50PXzz.jpg',
            rating: 91,
            type: 'TV',
            releaseDate: '2020'
        },
        {
            id: 'spy-x-family-17977',
            title: { english: 'SPY x FAMILY', native: 'SPY×FAMILY' },
            image: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx140960-vN39AmOWrVB5.jpg',
            rating: 87,
            type: 'TV',
            releaseDate: '2022'
        },
        {
            id: 'chainsaw-man-17076',
            title: { english: 'Chainsaw Man', native: 'チェンソーマン' },
            image: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx127230-FlochcFsyoF4.png',
            rating: 86,
            type: 'TV',
            releaseDate: '2022'
        },
        {
            id: 'frieren-beyond-journeys-end-18542',
            title: { english: "Frieren: Beyond Journey's End", native: '葬送のフリーレン' },
            image: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx154587-gHSraOSa0nBG.jpg',
            rating: 92,
            type: 'TV',
            releaseDate: '2023'
        }
    ];
}

export { animeRouter };
