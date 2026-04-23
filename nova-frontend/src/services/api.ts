import axios from 'axios';

// TMDB proxy configuration (frontend never sends TMDB key directly)
const TMDB_PROXY_BASE_URL = '/api/tmdb';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';
const TMDB_DEFAULT_LANGUAGE = 'es-ES';

// Create Axios instance that calls backend TMDB proxy
const tmdbApi = axios.create({
    baseURL: TMDB_PROXY_BASE_URL,
});

// No local UI caching per user request - always fetch fresh
const LANGUAGE_BY_CODE: Record<string, string> = {
    en: 'en-US',
    es: 'es-ES',
    fr: 'fr-FR',
    pt: 'pt-PT',
};

const resolveTmdbLanguage = (): string => {
    try {
        const rawSettings = localStorage.getItem('nova_settings');
        if (rawSettings) {
            const parsed = JSON.parse(rawSettings) as { language?: string };
            if (parsed.language) {
                return LANGUAGE_BY_CODE[parsed.language] || TMDB_DEFAULT_LANGUAGE;
            }
        }

        const i18nLang = localStorage.getItem('i18nextLng') || localStorage.getItem('language');
        if (i18nLang) {
            const short = i18nLang.split('-')[0].toLowerCase();
            return LANGUAGE_BY_CODE[short] || TMDB_DEFAULT_LANGUAGE;
        }

        if (navigator?.language) {
            const short = navigator.language.split('-')[0].toLowerCase();
            return LANGUAGE_BY_CODE[short] || TMDB_DEFAULT_LANGUAGE;
        }

        return TMDB_DEFAULT_LANGUAGE;
    } catch {
        return TMDB_DEFAULT_LANGUAGE;
    }
};

// Removed stableParams helper since cache is disabled

const getCachedTmdbData = async <T>(
    path: string,
    params: Record<string, unknown> = {},
    _ttlMs?: number
): Promise<T> => {
    const mergedParams: Record<string, unknown> = {
        language: resolveTmdbLanguage(),
        ...params,
    };

    const response = await tmdbApi.get(path, { params: mergedParams });
    return response.data as T;
};

// Image URL helpers
export const getImageUrl = (path: string | null, size: 'w500' | 'w780' | 'original' = 'w500') => {
    if (!path) return '/placeholder-poster.svg';
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
    original_language?: string;
    origin_country?: string[];
    vote_count?: number;
    adult?: boolean;
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
    original_language?: string;
    origin_country?: string[];
    vote_count?: number;
}
export interface AnimeMediaItem {
    id: number;
    title?: string;
    name?: string;
    poster_path: string | null;
    vote_average: number;
    media_type?: 'movie' | 'tv';
    release_date?: string;
    first_air_date?: string;
    backdrop_path?: string | null;
    popularity?: number;
    overview?: string;
    vote_count?: number;
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

export interface WatchProvidersResult {
    link?: string;
    flatrate?: Array<{ provider_id: number }>;
    free?: Array<{ provider_id: number }>;
    ads?: Array<{ provider_id: number }>;
    rent?: Array<{ provider_id: number }>;
    buy?: Array<{ provider_id: number }>;
}

export interface WatchProvidersResponse {
    results: Record<string, WatchProvidersResult>;
}

export interface HomeRowItem {
    id: number | string;
    tmdbId?: number;
    title: { english: string };
    image: string;
    rating: number;
    type: 'Movie' | 'TV' | 'Anime' | 'Sports';
    releaseDate: string;
    mediaType?: 'movie' | 'tv';
    isLive?: boolean;
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

export interface TMDBVideo {
    id: string;
    key: string;
    name: string;
    site: string;
    type: string;
    official?: boolean;
}

export type ContentMediaType = 'movie' | 'tv';

export interface WatchHistoryItem {
    id: string;
    media_id: string;
    media_type: ContentMediaType;
    title: string;
    image: string | null;
    progress: number | null;
    updated_at: string;
}

export interface AnimeSearchItem extends MultiSearchResult {
    genre_ids?: number[];
    original_language?: string;
    origin_country?: string[];
}

export interface TMDBCredits {
    cast: unknown[];
    crew: unknown[];
}

// Genre mappings
export const movieGenres: Record<number, string> = {
    28: 'Accion', 12: 'Aventura', 16: 'Animacion', 35: 'Comedia',
    80: 'Crimen', 99: 'Documental', 18: 'Drama', 10751: 'Familiar',
    14: 'Fantasia', 36: 'Historia', 27: 'Terror', 10402: 'Musica',
    9648: 'Misterio', 10749: 'Romance', 878: 'Ciencia ficcion', 10770: 'Pelicula TV',
    53: 'Suspenso', 10752: 'Guerra', 37: 'Western'
};

export const seriesGenres: Record<number, string> = {
    10759: 'Accion', 16: 'Animacion', 35: 'Comedia', 80: 'Crimen',
    99: 'Documental', 18: 'Drama', 10751: 'Familiar', 10762: 'Infantil',
    9648: 'Misterio', 10763: 'Noticias', 10764: 'Reality', 10765: 'Ciencia ficcion',
    10766: 'Telenovela', 10767: 'Talk Show', 10768: 'Guerra', 37: 'Western'
};

/**
 * Get trending movies (week)
 */
export const getTrendingMovies = async (): Promise<TMDBMovie[]> => {
    try {
        const data = await getCachedTmdbData<{ results: TMDBMovie[] }>('/trending/movie/week');
        return data.results || [];
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
        const data = await getCachedTmdbData<{ results: TMDBSeries[] }>('/trending/tv/week');
        return data.results || [];
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
        const data = await getCachedTmdbData<{ results: TMDBMovie[] }>('/movie/popular', { page });
        return data.results || [];
    } catch (error) {
        console.error('Error fetching popular movies:', error);
        return [];
    }
};

/**
 * Get upcoming movies
 */
export const getUpcomingMovies = async (page: number = 1): Promise<TMDBMovie[]> => {
    try {
        const data = await getCachedTmdbData<{ results: TMDBMovie[] }>('/movie/upcoming', { page });
        return data.results || [];
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
        const data = await getCachedTmdbData<{ results: TMDBSeries[] }>('/tv/popular', { page });
        return data.results || [];
    } catch (error) {
        console.error('Error fetching popular series:', error);
        return [];
    }
};

/**
 * Get now playing movies
 */
export const getNowPlayingMovies = async (page: number = 1): Promise<TMDBMovie[]> => {
    try {
        const data = await getCachedTmdbData<{ results: TMDBMovie[] }>('/movie/now_playing', { page });
        return data.results || [];
    } catch (error) {
        console.error('Error fetching now playing movies:', error);
        return [];
    }
};

/**
 * Get top rated movies
 */
export const getTopRatedMovies = async (page: number = 1): Promise<TMDBMovie[]> => {
    try {
        const data = await getCachedTmdbData<{ results: TMDBMovie[] }>('/movie/top_rated', { page });
        return data.results || [];
    } catch (error) {
        console.error('Error fetching top rated movies:', error);
        return [];
    }
};

/**
 * Get top rated TV series
 */
export const getTopRatedSeries = async (page: number = 1): Promise<TMDBSeries[]> => {
    try {
        const data = await getCachedTmdbData<{ results: TMDBSeries[] }>('/tv/top_rated', { page });
        return data.results || [];
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
        return await getCachedTmdbData<TMDBMovie>(`/movie/${id}`);
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
        return await getCachedTmdbData<TMDBSeriesDetails>(`/tv/${id}`);
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
        const data = await getCachedTmdbData<{ episodes: TMDBEpisode[] }>(`/tv/${seriesId}/season/${seasonNumber}`);
        return data.episodes || [];
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
        const data = await getCachedTmdbData<{ results: TMDBMovie[] }>('/search/movie', { query }, 60 * 1000);
        return data.results || [];
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
        const data = await getCachedTmdbData<{ results: TMDBSeries[] }>('/search/tv', { query }, 60 * 1000);
        return data.results || [];
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
        const data = await getCachedTmdbData<{ results: MultiSearchResult[] }>('/search/multi', { query }, 60 * 1000);
        return data.results || [];
    } catch (error) {
        console.error('Error searching multi:', error);
        return [];
    }
};

/**
 * Search anime (filtering TMDB results for animation + Japanese language)
 */
export const searchAnime = async (query: string): Promise<AnimeSearchItem[]> => {
    try {
        const data = await getCachedTmdbData<{ results: AnimeSearchItem[] }>('/search/multi', { query }, 60 * 1000);
        const results = data.results || [];
        return results.filter((item) =>
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
        const data = await getCachedTmdbData<{ results: MultiSearchResult[] }>('/person/popular', { page });
        return data.results || [];
    } catch (error) {
        console.error('Error fetching popular people:', error);
        return [];
    }
};

/**
 * Get videos for a movie
 */
export const getMovieVideos = async (id: number): Promise<TMDBVideo[]> => {
    try {
        const data = await getCachedTmdbData<{ results: TMDBVideo[] }>(`/movie/${id}/videos`, {}, 10 * 60 * 1000);
        return data.results || [];
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
        const data = await getCachedTmdbData<{ results: TMDBMovie[] }>(`/movie/${id}/recommendations`);
        return data.results || [];
    } catch (error) {
        console.error('Error fetching movie recommendations:', error);
        return [];
    }
};

/**
 * Get movie credits (cast & crew)
 */
export const getMovieCredits = async (id: number): Promise<TMDBCredits> => {
    try {
        return await getCachedTmdbData<TMDBCredits>(`/movie/${id}/credits`);
    } catch (error) {
        console.error('Error fetching movie credits:', error);
        return { cast: [], crew: [] };
    }
};

/**
 * Get series credits (cast & crew)
 */
export const getSeriesCredits = async (id: number): Promise<TMDBCredits> => {
    try {
        return await getCachedTmdbData<TMDBCredits>(`/tv/${id}/credits`);
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
        const data = await getCachedTmdbData<{ results: TMDBMovie[] }>(`/movie/${id}/similar`);
        return data.results || [];
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
        const data = await getCachedTmdbData<{ results: TMDBSeries[] }>(`/tv/${id}/similar`);
        return data.results || [];
    } catch (error) {
        console.error('Error fetching similar series:', error);
        return [];
    }
};

/**
 * Get videos for a TV series
 */
export const getSeriesVideos = async (id: number): Promise<TMDBVideo[]> => {
    try {
        const data = await getCachedTmdbData<{ results: TMDBVideo[] }>(`/tv/${id}/videos`, {}, 10 * 60 * 1000);
        return data.results || [];
    } catch (error) {
        console.error('Error fetching series videos:', error);
        return [];
    }
};

/**
 * Get watch providers for a movie or TV series
 */
export const getWatchProviders = async (
    type: 'movie' | 'tv',
    id: number
): Promise<WatchProvidersResponse | null> => {
    try {
        return await getCachedTmdbData<WatchProvidersResponse>(`/${type}/${id}/watch/providers`);
    } catch (error) {
        console.error('Error fetching watch providers:', error);
        return null;
    }
};

/**
 * Get movies by genre
 */
export const getMoviesByGenre = async (genreId: number, page: number = 1): Promise<TMDBMovie[]> => {
    try {
        const data = await getCachedTmdbData<{ results: TMDBMovie[] }>(
            '/discover/movie',
            { with_genres: genreId, page, sort_by: 'popularity.desc' }
        );
        return data.results || [];
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
        const data = await getCachedTmdbData<{ results: TMDBSeries[] }>(
            '/discover/tv',
            { with_genres: genreId, page, sort_by: 'popularity.desc' }
        );
        return data.results || [];
    } catch (error) {
        console.error('Error fetching series by genre:', error);
        return [];
    }
};

// Dedup helper — removes duplicates by ID
const dedupeById = <T extends { id: number }>(items: T[]): T[] => {
    const seen = new Set<number>();
    return items.filter(item => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
    });
};

/**
 * Get trending anime — uses /trending/tv/week filtered for Japanese animation,
 * then fills remaining slots from /discover/tv page 1
 */
export const getTrendingAnime = async (): Promise<(TMDBMovie | TMDBSeries)[]> => {
    try {
        const [trendingData, discoverData] = await Promise.all([
            getCachedTmdbData<{ results: TMDBSeries[] }>('/trending/tv/week'),
            getCachedTmdbData<{ results: TMDBSeries[] }>('/discover/tv', {
                with_genres: 16,
                with_original_language: 'ja',
                sort_by: 'popularity.desc',
                page: 1
            })
        ]);
        // Filter trending for Japanese animation
        const trendingAnime = (trendingData.results || []).filter((item) =>
            (item.genre_ids?.includes(16) || item.origin_country?.includes('JP')) &&
            item.original_language === 'ja'
        );
        const combined = [
            ...trendingAnime,
            ...(discoverData.results || [])
        ].map((item) => ({ ...item, media_type: 'tv' as const }));
        return dedupeById(combined);
    } catch (error) {
        console.error('Error fetching trending anime:', error);
        return [];
    }
};

/**
 * Get popular anime series — pages 2 & 3 to avoid overlap with trending
 */
export const getPopularAnime = async (): Promise<TMDBSeries[]> => {
    try {
        const [page2, page3] = await Promise.all([
            getCachedTmdbData<{ results: TMDBSeries[] }>('/discover/tv', {
                with_genres: 16,
                with_original_language: 'ja',
                sort_by: 'popularity.desc',
                page: 2
            }),
            getCachedTmdbData<{ results: TMDBSeries[] }>('/discover/tv', {
                with_genres: 16,
                with_original_language: 'ja',
                sort_by: 'popularity.desc',
                page: 3
            })
        ]);
        const combined = [
            ...(page2.results || []),
            ...(page3.results || [])
        ].map((item) => ({ ...item, media_type: 'tv' as const }));
        return dedupeById(combined);
    } catch (error) {
        console.error('Error fetching popular anime:', error);
        return [];
    }
};

/**
 * Get latest anime episodes — recently-aired anime
 */
export const getLatestAnimeEpisodes = async (): Promise<TMDBSeries[]> => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const data = await getCachedTmdbData<{ results: TMDBSeries[] }>('/discover/tv', {
            with_genres: 16,
            with_original_language: 'ja',
            sort_by: 'first_air_date.desc',
            'air_date.lte': today,
            page: 1
        });
        return (data.results || []).map((item) => ({ ...item, media_type: 'tv' as const }));
    } catch (error) {
        console.error('Error fetching latest anime episodes:', error);
        return [];
    }
};

/**
 * Get top rated anime
 */
export const getTopRatedAnime = async (): Promise<TMDBSeries[]> => {
    try {
        const data = await getCachedTmdbData<{ results: TMDBSeries[] }>('/discover/tv', {
            with_genres: 16,
            with_original_language: 'ja',
            sort_by: 'vote_average.desc',
            'vote_count.gte': 200,
            page: 1
        });
        return (data.results || []).map((item) => ({ ...item, media_type: 'tv' as const }));
    } catch (error) {
        console.error('Error fetching top rated anime:', error);
        return [];
    }
};

/**
 * Get anime movies
 */
export const getAnimeMovies = async (): Promise<TMDBMovie[]> => {
    try {
        const data = await getCachedTmdbData<{ results: TMDBMovie[] }>('/discover/movie', {
            with_genres: 16,
            with_original_language: 'ja',
            sort_by: 'popularity.desc',
            page: 1
        });
        return (data.results || []).map((item) => ({ ...item, media_type: 'movie' as const }));
    } catch (error) {
        console.error('Error fetching anime movies:', error);
        return [];
    }
};

/**
 * Get horror movies
 */
export const getHorrorMovies = async (): Promise<TMDBMovie[]> => {
    try {
        const data = await getCachedTmdbData<{ results: TMDBMovie[] }>(
            '/discover/movie',
            { with_genres: 27, sort_by: 'popularity.desc', page: 1 }
        );
        return data.results || [];
    } catch (error) {
        console.error('Error fetching horror movies:', error);
        return [];
    }
};

/**
 * Get romance series
 */
export const getRomanceSeries = async (): Promise<TMDBSeries[]> => {
    try {
        const data = await getCachedTmdbData<{ results: TMDBSeries[] }>(
            '/discover/tv',
            { with_genres: 10749, sort_by: 'popularity.desc', page: 1 }
        );
        return data.results || [];
    } catch (error) {
        console.error('Error fetching romance series:', error);
        return [];
    }
};

/**
 * Get thriller movies
 */
export const getThrillerMovies = async (): Promise<TMDBMovie[]> => {
    try {
        const data = await getCachedTmdbData<{ results: TMDBMovie[] }>(
            '/discover/movie',
            { with_genres: 53, sort_by: 'popularity.desc', page: 1 }
        );
        return data.results || [];
    } catch (error) {
        console.error('Error fetching thriller movies:', error);
        return [];
    }
};

/**
 * Get drama series
 */
export const getDramaSeries = async (): Promise<TMDBSeries[]> => {
    try {
        const data = await getCachedTmdbData<{ results: TMDBSeries[] }>(
            '/discover/tv',
            { with_genres: 18, sort_by: 'popularity.desc', page: 1 }
        );
        return data.results || [];
    } catch (error) {
        console.error('Error fetching drama series:', error);
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
        const data = await getCachedTmdbData<{ results: TMDBSeries[] }>('/tv/airing_today');
        return data.results || [];
    } catch (error) {
        console.error('Error fetching airing today series:', error);
        return [];
    }
};



// Cache key for top characters
const CACHE_KEY_TOP_CHARACTERS = 'nova_top_anime_characters';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

type JikanImage = {
    jpg?: {
        image_url?: string;
    };
};

type JikanCharacter = {
    mal_id: number;
    name: string;
    images?: JikanImage;
    about?: string;
    favorites?: number;
};

type JikanCharacterRole = {
    character: JikanCharacter;
    role: string;
};

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

        const mappedData = (response.data.data as JikanCharacter[]).map((item) => ({
            id: item.mal_id,
            name: item.name,
            image: item.images?.jpg?.image_url || '/placeholder-poster.svg',
            about: item.about || '',
            favorites: item.favorites || 0
        }));

        //  Save to cache
        localStorage.setItem(CACHE_KEY_TOP_CHARACTERS, JSON.stringify({
            data: mappedData,
            timestamp: Date.now()
        }));

        return mappedData;
    } catch (error: unknown) {
        // Only warn if it's not a rate limit (which is expected sometimes)
        if (!(axios.isAxiosError(error) && error.response?.status === 429)) {
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

export const searchAnimeCharacters = async (query: string): Promise<JikanCharacter[]> => {
    try {
        const response = await axios.get<{ data: JikanCharacter[] }>(`${JIKAN_BASE_URL}/characters`, { params: { q: query } });
        return response.data.data || [];
    } catch (error) {
        console.error('Error searching anime characters:', error);
        return [];
    }
};

export const getAnimeId = async (query: string): Promise<number | null> => {
    try {
        const response = await axios.get<{ data: Array<{ mal_id: number }> }>(`${JIKAN_BASE_URL}/anime`, { params: { q: query, limit: 1 } });
        if (response.data.data && response.data.data.length > 0) {
            return response.data.data[0].mal_id;
        }
        return null;
    } catch (error) {
        console.error('Error searching anime ID:', error);
        return null;
    }
};

export const getAnimeCharacters = async (malId: number): Promise<JikanCharacterRole[]> => {
    try {
        const response = await axios.get<{ data: JikanCharacterRole[] }>(`${JIKAN_BASE_URL}/anime/${malId}/characters`);
        // Sort by favorites to get main characters first (approximation)
        const chars = response.data.data || [];
        return chars.sort((a, _b) => (a.role === 'Main' ? -1 : 1));
    } catch (error) {
        console.error('Error getting anime characters:', error);
        return [];
    }
};

export default tmdbApi;
