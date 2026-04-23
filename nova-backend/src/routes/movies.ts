import { Hono } from 'hono';
import { MOVIES } from '@consumet/extensions';

const moviesRouter = new Hono();
const flixhq = new MOVIES.FlixHQ();

// Ensure the TMDB API key is available
const TMDB_API_KEY = process.env.VITE_TMDB_API_KEY || 'ded1ef15d787754f762319ef46fbdb89';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

moviesRouter.get('/:id', async (c) => {
    try {
        const id = c.req.param('id');

        let movieTitle = '';

        // 1. Fetch movie title from TMDB explicitly if needed
        try {
            const tmdbRes = await fetch(`${TMDB_BASE_URL}/movie/${id}?api_key=${TMDB_API_KEY}&language=en-US`);
            if (tmdbRes.ok) {
                const tmdbData = await tmdbRes.json();
                movieTitle = tmdbData.title || tmdbData.original_title;
            }
        } catch (e) {
            console.warn("Failed to fetch TMDB data for title:", e);
        }

        if (!movieTitle) {
            throw new Error('Could not resolve movie title from TMDB ID');
        }

        // 2. Search FlixHQ for the exact title
        const searchRes = await flixhq.search(movieTitle);
        if (!searchRes.results || searchRes.results.length === 0) {
            return c.json({ success: false, error: 'Movie not found on provider' }, 404);
        }

        const firstResult = searchRes.results[0]; // Take best match

        // 3. Fetch media info
        const movieInfo = await flixhq.fetchMediaInfo(firstResult.id);
        if (!movieInfo.episodes || movieInfo.episodes.length === 0) {
            return c.json({ success: false, error: 'No media available for movie' }, 404);
        }

        // 4. Fetch the actual stream sources
        const firstEpisode = movieInfo.episodes[0];
        const stream = await flixhq.fetchEpisodeSources(firstEpisode.id, movieInfo.id);

        if (!stream.sources || stream.sources.length === 0) {
            return c.json({ success: false, error: 'No stream sources returned by provider' }, 404);
        }

        // Return the clean B.L.A.S.T payload
        return c.json({
            success: true,
            sources: stream.sources,
            subtitles: stream.subtitles || []
        });

    } catch (error: any) {
        console.error('Movies API Error:', error);
        return c.json({
            success: false,
            error: error.message || 'Failed to fetch movie stream'
        }, 500);
    }
});

export { moviesRouter };
