import axios from 'axios';

// TMDB API Configuration
const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY as string | undefined;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

if (!TMDB_API_KEY) {
    throw new Error('Missing TMDB API key (VITE_TMDB_API_KEY).');
}

// Create Axios instance with interceptor
const tmdbApi = axios.create({
    baseURL: TMDB_BASE_URL,
    params: {
        api_key: TMDB_API_KEY,
        language: 'en-US'
    }
});

// Image URL helpers
export const getImageUrl = (path: string | null, size: 'w500' | 'w780' | 'original' = 'w500') => {
    if (!path) return 'https://via.placeholder.com/500x750?text=No+Image';
    return `${TMDB_IMAGE_BASE}/${size}${path}`;
};

export const getBackdropUrl = (path: string | null, size: 'w780' | 'w1280' | 'original' = 'w1280') => {
    if (!path) return null;
    return `${TMDB_IMAGE_BASE}/${size}${path}`;
};

// Types
export interface TMDBMovie {
    id: number;
    title: string;
    overview: string;
    poster_path: string | null;
    backdrop_path: string | null;
    release_date: string;
    vote_average: number;
    genre_ids: number[];
    genres?: { id: number; name: string }[];
    runtime?: number;
    media_type?: 'movie' | 'tv';
    popularity: number;
}

export interface TMDBSeries {
    id: number;
    name: string;
    overview: string;
    poster_path: string | null;
    backdrop_path: string | null;
    first_air_date: string;
    vote_average: number;
    genre_ids: number[];
    number_of_seasons?: number;
    media_type?: 'movie' | 'tv';
    popularity: number;
}

export interface AnimeCharacter {
    id: number;
    name: string;
    image: string;
    about: string;
    favorites: number;
}

export interface TMDBSeriesDetails extends TMDBSeries {
    seasons: TMDBSeason[];
    genres: { id: number; name: string }[];
    number_of_episodes?: number; // Added '?' as it might not always be present directly on the series details object
}

export interface MultiSearchResult {
    id: number;
    media_type: 'movie' | 'tv' | 'person';
    title?: string;
    name?: string;
    poster_path: string | null;
    backdrop_path: string | null;
    release_date?: string;
    first_air_date?: string;
    vote_average: number;
}

export interface TMDBSeason {
    id: number;
    name: string;
    season_number: number;
    episode_count: number;
    poster_path: string | null;
}

export interface TMDBEpisode {
    id: number;
    name: string;
    episode_number: number;
    season_number: number;
    still_path: string | null;
    overview: string;
    air_date: string;
}

// Genre mappings
export const movieGenres: Record<number, string> = {
    28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy',
    80: 'Crime', 99: 'Documentary', 18: 'Drama', 10751: 'Family',
    14: 'Fantasy', 36: 'History', 27: 'Horror', 10402: 'Music',
    9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi', 10770: 'TV Movie',
    53: 'Thriller', 10752: 'War', 37: 'Western'
};

export const seriesGenres: Record<number, string> = {
    10759: 'Action', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
    99: 'Documentary', 18: 'Drama', 10751: 'Family', 10762: 'Kids',
    9648: 'Mystery', 10763: 'News', 10764: 'Reality', 10765: 'Sci-Fi',
    10766: 'Soap', 10767: 'Talk', 10768: 'War', 37: 'Western'
};

/**
 * Get trending movies (week)
 */
export const getTrendingMovies = async (): Promise<TMDBMovie[]> => {
    try {
        const response = await tmdbApi.get('/trending/movie/week');
        return response.data.results;
    } catch (error) {
        console.error('Error fetching trending movies:', error);
        return [];
    }
};

/**
 * Get trending TV series (week)
 */
export const getTrendingSeries = async (): Promise<TMDBSeries[]> => {
    try {
        const response = await tmdbApi.get('/trending/tv/week');
        return response.data.results;
    } catch (error) {
        console.error('Error fetching trending series:', error);
        return [];
    }
};

/**
 * Get popular movies
 */
export const getPopularMovies = async (page: number = 1): Promise<TMDBMovie[]> => {
    try {
        const response = await tmdbApi.get('/movie/popular', { params: { page } });
        return response.data.results;
    } catch (error) {
        console.error('Error fetching popular movies:', error);
        return [];
    }
};

/**
 * Get upcoming movies
 */
export const getUpcomingMovies = async (): Promise<TMDBMovie[]> => {
    try {
        const response = await tmdbApi.get('/movie/upcoming');
        return response.data.results;
    } catch (error) {
        console.error('Error fetching upcoming movies:', error);
        return [];
    }
};

/**
 * Get popular TV series
 */
export const getPopularSeries = async (page: number = 1): Promise<TMDBSeries[]> => {
    try {
        const response = await tmdbApi.get('/tv/popular', { params: { page } });
        return response.data.results;
    } catch (error) {
        console.error('Error fetching popular series:', error);
        return [];
    }
};

/**
 * Get now playing movies
 */
export const getNowPlayingMovies = async (): Promise<TMDBMovie[]> => {
    try {
        const response = await tmdbApi.get('/movie/now_playing');
        return response.data.results;
    } catch (error) {
        console.error('Error fetching now playing movies:', error);
        return [];
    }
};

/**
 * Get top rated movies
 */
export const getTopRatedMovies = async (): Promise<TMDBMovie[]> => {
    try {
        const response = await tmdbApi.get('/movie/top_rated');
        return response.data.results;
    } catch (error) {
        console.error('Error fetching top rated movies:', error);
        return [];
    }
};

/**
 * Get top rated TV series
 */
export const getTopRatedSeries = async (): Promise<TMDBSeries[]> => {
    try {
        const response = await tmdbApi.get('/tv/top_rated');
        return response.data.results;
    } catch (error) {
        console.error('Error fetching top rated series:', error);
        return [];
    }
};

/**
 * Get movie details
 */
export const getMovieDetails = async (id: number): Promise<TMDBMovie | null> => {
    try {
        const response = await tmdbApi.get(`/movie/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching movie details:', error);
        return null;
    }
};

/**
 * Get TV series details with seasons
 */
export const getSeriesDetails = async (id: number): Promise<TMDBSeriesDetails | null> => {
    try {
        const response = await tmdbApi.get(`/tv/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching series details:', error);
        return null;
    }
};

/**
 * Get episodes for a specific season
 */
export const getSeasonEpisodes = async (seriesId: number, seasonNumber: number): Promise<TMDBEpisode[]> => {
    try {
        const response = await tmdbApi.get(`/tv/${seriesId}/season/${seasonNumber}`);
        return response.data.episodes || [];
    } catch (error) {
        console.error('Error fetching season episodes:', error);
        return [];
    }
};

/**
 * Search movies
 */
export const searchMovies = async (query: string): Promise<TMDBMovie[]> => {
    try {
        const response = await tmdbApi.get('/search/movie', { params: { query } });
        return response.data.results;
    } catch (error) {
        console.error('Error searching movies:', error);
        return [];
    }
};

/**
 * Search TV series
 */
export const searchSeries = async (query: string): Promise<TMDBSeries[]> => {
    try {
        const response = await tmdbApi.get('/search/tv', { params: { query } });
        return response.data.results;
    } catch (error) {
        console.error('Error searching series:', error);
        return [];
    }
};

/**
 * Search across movies, TV shows and people
 */
export const searchMulti = async (query: string): Promise<MultiSearchResult[]> => {
    try {
        const response = await tmdbApi.get('/search/multi', { params: { query } });
        return response.data.results;
    } catch (error) {
        console.error('Error searching multi:', error);
        return [];
    }
};

/**
 * Search anime (filtering TMDB results for animation + Japanese language)
 */
export const searchAnime = async (query: string): Promise<any[]> => {
    try {
        const response = await tmdbApi.get('/search/multi', { params: { query } });
        const results = response.data.results || [];
        return results.filter((item: any) =>
            (item.media_type === 'movie' || item.media_type === 'tv') &&
            (item.genre_ids?.includes(16) || item.original_language === 'ja')
        );
    } catch (error) {
        console.error('Error searching anime:', error);
        return [];
    }
};

/**
 * Get popular people
 */
export const getPopularPeople = async (page: number = 1): Promise<MultiSearchResult[]> => {
    try {
        const response = await tmdbApi.get('/person/popular', { params: { page } });
        return response.data.results;
    } catch (error) {
        console.error('Error fetching popular people:', error);
        return [];
    }
};

/**
 * Get videos for a movie
 */
export const getMovieVideos = async (id: number) => {
    try {
        const response = await tmdbApi.get(`/movie/${id}/videos`);
        return response.data.results;
    } catch (error) {
        console.error('Error fetching movie videos:', error);
        return [];
    }
};

/**
 * Get movie recommendations
 */
export const getMovieRecommendations = async (id: number): Promise<TMDBMovie[]> => {
    try {
        const response = await tmdbApi.get(`/movie/${id}/recommendations`);
        return response.data.results;
    } catch (error) {
        console.error('Error fetching movie recommendations:', error);
        return [];
    }
};

/**
 * Get movie credits (cast & crew)
 */
export const getMovieCredits = async (id: number) => {
    try {
        const response = await tmdbApi.get(`/movie/${id}/credits`);
        return response.data;
    } catch (error) {
        console.error('Error fetching movie credits:', error);
        return { cast: [], crew: [] };
    }
};

/**
 * Get series credits (cast & crew)
 */
export const getSeriesCredits = async (id: number) => {
    try {
        const response = await tmdbApi.get(`/tv/${id}/credits`);
        return response.data;
    } catch (error) {
        console.error('Error fetching series credits:', error);
        return { cast: [], crew: [] };
    }
};

/**
 * Get similar movies
 */
export const getSimilarMovies = async (id: number): Promise<TMDBMovie[]> => {
    try {
        const response = await tmdbApi.get(`/movie/${id}/similar`);
        return response.data.results;
    } catch (error) {
        console.error('Error fetching similar movies:', error);
        return [];
    }
};

/**
 * Get similar series
 */
export const getSimilarSeries = async (id: number): Promise<TMDBSeries[]> => {
    try {
        const response = await tmdbApi.get(`/tv/${id}/similar`);
        return response.data.results;
    } catch (error) {
        console.error('Error fetching similar series:', error);
        return [];
    }
};

/**
 * Get videos for a TV series
 */
export const getSeriesVideos = async (id: number) => {
    try {
        const response = await tmdbApi.get(`/tv/${id}/videos`);
        return response.data.results;
    } catch (error) {
        console.error('Error fetching series videos:', error);
        return [];
    }
};

/**
 * Get movies by genre
 */
export const getMoviesByGenre = async (genreId: number, page: number = 1): Promise<TMDBMovie[]> => {
    try {
        const response = await tmdbApi.get('/discover/movie', {
            params: { with_genres: genreId, page, sort_by: 'popularity.desc' }
        });
        return response.data.results;
    } catch (error) {
        console.error('Error fetching movies by genre:', error);
        return [];
    }
};

/**
 * Get series by genre
 */
export const getSeriesByGenre = async (genreId: number, page: number = 1): Promise<TMDBSeries[]> => {
    try {
        const response = await tmdbApi.get('/discover/tv', {
            params: { with_genres: genreId, page, sort_by: 'popularity.desc' }
        });
        return response.data.results;
    } catch (error) {
        console.error('Error fetching series by genre:', error);
        return [];
    }
};

/**
 * Get trending anime (Mix of movies and series)
 */
export const getTrendingAnime = async (): Promise<(TMDBMovie | TMDBSeries)[]> => {
    try {
        const response = await tmdbApi.get('/trending/all/week');
        // Filter for Animation genre (16) and Japanese language (ja)
        const animeResults = response.data.results.filter((item: any) =>
            (item.genre_ids?.includes(16) || item.genre_id === 16) &&
            (item.original_language === 'ja')
        );
        return animeResults as (TMDBMovie | TMDBSeries)[];
    } catch (error) {
        console.error('Error fetching trending anime:', error);
        return [];
    }
};

/**
 * Get popular anime series (Animation genre + Japanese language)
 */
export const getPopularAnime = async (): Promise<TMDBSeries[]> => {
    try {
        const response = await tmdbApi.get('/discover/tv', {
            params: {
                with_genres: 16,
                with_original_language: 'ja',
                sort_by: 'popularity.desc'
            }
        });
        return response.data.results.map((item: any) => ({ ...item, media_type: 'tv' as const }));
    } catch (error) {
        console.error('Error fetching popular anime:', error);
        return [];
    }
};

// VidSrc URL helpers for streaming
export const getVidSrcMovieUrl = (tmdbId: number): string => {
    return `https://vidsrcme.su/embed/movie/${tmdbId}`;
};

export const getVidSrcSeriesUrl = (tmdbId: number, season: number, episode: number): string => {
    return `https://vidsrcme.su/embed/tv/${tmdbId}/${season}/${episode}`;
};

// JIKAN API (Anime Characters)
const JIKAN_BASE_URL = 'https://api.jikan.moe/v4';




/**
 * Get airing today series
 */
export const getAiringTodaySeries = async (): Promise<TMDBSeries[]> => {
    try {
        const response = await tmdbApi.get('/tv/airing_today');
        return response.data.results;
    } catch (error) {
        console.error('Error fetching airing today series:', error);
        return [];
    }
};



// Cache key for top characters
const CACHE_KEY_TOP_CHARACTERS = 'nova_top_anime_characters';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export const getTopAnimeCharacters = async (): Promise<AnimeCharacter[]> => {
    try {
        // Check cache first
        const cached = localStorage.getItem(CACHE_KEY_TOP_CHARACTERS);
        if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < CACHE_DURATION) {
                return data;
            }
        }

        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        const response = await axios.get(`${JIKAN_BASE_URL}/top/characters`);

        const mappedData = response.data.data.map((item: any) => ({
            id: item.mal_id,
            name: item.name,
            image: item.images.jpg.image_url,
            about: item.about,
            favorites: item.favorites
        }));

        //  Save to cache
        localStorage.setItem(CACHE_KEY_TOP_CHARACTERS, JSON.stringify({
            data: mappedData,
            timestamp: Date.now()
        }));

        return mappedData;
    } catch (error: any) {
        // Only warn if it's not a rate limit (which is expected sometimes)
        if (error.response?.status !== 429) {
            console.warn('Error fetching top anime characters (falling back to mock data):', error);
        }
        return [
            { id: 40, name: "Luffy Monkey D.", image: "https://cdn.myanimelist.net/images/characters/9/310307.jpg", about: "Captain of the Straw Hat Pirates", favorites: 120000 },
            { id: 417, name: "Lelouch Lamperouge", image: "https://cdn.myanimelist.net/images/characters/8/406163.jpg", about: "The Black Prince", favorites: 85000 },
            { id: 1, name: "Spike Spiegel", image: "https://cdn.myanimelist.net/images/characters/4/50197.jpg", about: "Bounty Hunter", favorites: 60000 },
            { id: 2, name: "Naruto Uzumaki", image: "https://cdn.myanimelist.net/images/characters/9/131317.jpg", about: "Future Hokage", favorites: 80000 }
        ];
    }
};

export const searchAnimeCharacters = async (query: string): Promise<any[]> => {
    try {
        const response = await axios.get(`${JIKAN_BASE_URL}/characters`, { params: { q: query } });
        return response.data.data;
    } catch (error) {
        console.error('Error searching anime characters:', error);
        return [];
    }
};

export const getAnimeId = async (query: string): Promise<number | null> => {
    try {
        const response = await axios.get(`${JIKAN_BASE_URL}/anime`, { params: { q: query, limit: 1 } });
        if (response.data.data && response.data.data.length > 0) {
            return response.data.data[0].mal_id;
        }
        return null;
    } catch (error) {
        console.error('Error searching anime ID:', error);
        return null;
    }
};

export const getAnimeCharacters = async (malId: number): Promise<any[]> => {
    try {
        const response = await axios.get(`${JIKAN_BASE_URL}/anime/${malId}/characters`);
        // Sort by favorites to get main characters first (approximation)
        const chars = response.data.data;
        return chars.sort((a: any, _b: any) => (a.role === 'Main' ? -1 : 1));
    } catch (error) {
        console.error('Error getting anime characters:', error);
        return [];
    }
};

export default tmdbApi;
