import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ContentRow from '../components/ContentRow';
import DynamicHeroBanner from '../components/DynamicHeroBanner';
import PremiumCTA from '../components/PremiumCTA';
import PremiumLoader from '../components/PremiumLoader';
import {
    getTrendingMovies,
    getPopularMovies,
    getUpcomingMovies,
    getTrendingSeries,
    getTopRatedMovies,
    getNowPlayingMovies,
    getTopRatedSeries,
    getPopularSeries,
    getAiringTodaySeries,
    getMoviesByGenre,
    getSeriesByGenre,
    getImageUrl,
    getBackdropUrl,
    getMovieVideos,
    getSeriesVideos,
    getMovieRecommendations,
    getHorrorMovies,
    getThrillerMovies,
    getDramaSeries,
    getRomanceSeries,
    getTrendingAnime,
    TMDBMovie,
    TMDBSeries
} from '../services/api';
import { getLiveMatches, getTodaysMatches, matchToContent } from '../services/sportsService';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { supabase } from '../lib/supabase';

// Transform TMDB movie to content format
const movieToContent = (movie: TMDBMovie) => ({
    id: movie.id,
    tmdbId: movie.id,
    title: { english: movie.title },
    image: getImageUrl(movie.poster_path, 'w780'),
    backdrop: getBackdropUrl(movie.backdrop_path, 'w1280'),
    rating: Math.round(movie.vote_average * 10),
    type: 'Movie',
    releaseDate: movie.release_date?.split('-')[0] || 'N/A',
});

// Transform TMDB series to content format
const seriesToContent = (series: TMDBSeries) => ({
    id: series.id,
    tmdbId: series.id,
    title: { english: series.name },
    image: getImageUrl(series.poster_path, 'w780'),
    backdrop: getBackdropUrl(series.backdrop_path, 'w1280'),
    rating: Math.round(series.vote_average * 10),
    type: 'TV',
    releaseDate: series.first_air_date?.split('-')[0] || 'N/A',
});

// Mock sports fallback for when API has no live data
const mockSportsFallback = [
    { id: 'no-live', title: { english: 'Sin eventos en vivo' }, image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&q=90', rating: 0, type: 'Sports', releaseDate: 'Ver calendario', isLive: false },
];

// Category definitions
const categories = [
    { id: 'all',     name: 'Todo',      icon: 'ri-apps-line' },
    { id: 'movies',  name: 'Películas', icon: 'ri-film-line',       link: '/peliculas' },
    { id: 'series',  name: 'Series',    icon: 'ri-tv-line',          link: '/series' },
    { id: 'anime',   name: 'Anime',     icon: 'ri-sword-line',       link: '/anime' },
    { id: 'sports',  name: 'Deportes',  icon: 'ri-basketball-line',  link: '/deportes' },
];

export default function Home() {
    const { user } = useAuth();
    const { settings } = useSettings();
    const contentFilter = settings.contentFilter;
    const [trendingMovies, setTrendingMovies] = useState<any[]>([]);
    const [topRatedMovies, setTopRatedMovies] = useState<any[]>([]);
    const [nowPlayingMovies, setNowPlayingMovies] = useState<any[]>([]);
    const [popularMovies, setPopularMovies] = useState<any[]>([]);
    const [upcomingMovies, setUpcomingMovies] = useState<any[]>([]);
    const [actionMovies, setActionMovies] = useState<any[]>([]);
    const [trendingSeries, setTrendingSeries] = useState<any[]>([]);
    const [topRatedSeries, setTopRatedSeries] = useState<any[]>([]);
    const [popularSeries, setPopularSeries] = useState<any[]>([]);
    const [airingTodaySeries, setAiringTodaySeries] = useState<any[]>([]);
    const [liveSports, setLiveSports] = useState<any[]>([]);
    const [scifiMovies, setScifiMovies] = useState<any[]>([]);
    const [comedySeries, setComedySeries] = useState<any[]>([]);
    const [documentaries, setDocumentaries] = useState<any[]>([]);
    const [horrorMovies, setHorrorMovies] = useState<any[]>([]);
    const [thrillerMovies, setThrillerMovies] = useState<any[]>([]);
    const [dramaSeries, setDramaSeries] = useState<any[]>([]);
    const [romanceSeries, setRomanceSeries] = useState<any[]>([]);
    const [animeItems, setAnimeItems] = useState<any[]>([]);
    const [recommendations, setRecommendations] = useState<any[]>([]);
    const [recommendationTitle, setRecommendationTitle] = useState<string>('');
    const [heroItems, setHeroItems] = useState<(TMDBMovie | TMDBSeries)[]>([]);
    const [spotlightIndex, setSpotlightIndex] = useState(0);
    const [activeCategory, setActiveCategory] = useState('all');
    const [isLoading, setIsLoading] = useState(true);
    const [historyItems, setHistoryItems] = useState<any[]>([]);

    const isBannedTitle = (item: any) => {
        const raw = `${item?.title || item?.name || item?.title?.english || ''}`.toLowerCase();
        return (
            raw.includes('zootopia') ||
            raw.includes('zootropolis') ||
            raw.includes('zootropolis 2') ||
            raw.includes('zootopia 2') ||
            raw.includes('zootrópolis')
        );
    };

    // Filter 18+ adult content when contentFilter setting is ON
    // Uses keyword matching on titles + overview since TMDB rarely sets adult=true
    const ADULT_KEYWORDS = [
        'porn', 'porno', 'xxx', 'erotic', 'erótic', 'hentai',
        'sex tape', 'sextape', 'nude', 'nudes', 'nudist',
        'stripper', 'striptease', 'playboy', 'playmate',
        'orgasm', 'orgasmo', 'clitoris', 'clítoris',
        'viagra', 'dildo', 'bdsm', 'bondage', 'fetish',
        'brothel', 'bordello', 'escort girl', 'call girl',
        'nymphomaniac', 'ninfómana', 'dominatrix',
        'kamasutra', 'kama sutra', 'tantric',
        'swinger', 'orgy', 'orgía', 'threesome',
        'seduction', 'seducción', 'lap dance',
        'burlesque', 'concubine', 'gigolo', 'gigolò',
        'adult film', 'adult movie', 'adult entertainment',
        'skin flick', 'softcore', 'hardcore',
        'x-rated', 'x rated', 'unrated',
        'after porn', 'deep throat',
    ];

    const isAdultContent = (item: any): boolean => {
        if (!contentFilter) return false;
        // Always filter TMDB adult flag
        if (item?.adult === true) return true;
        // Keyword scan on title + overview
        const title = `${item?.title || item?.name || ''}`.toLowerCase();
        const overview = `${item?.overview || ''}`.toLowerCase();
        const combined = `${title} | ${overview}`;
        return ADULT_KEYWORDS.some(kw => combined.includes(kw));
    };

    const filterContent = <T extends any>(items: T[]): T[] => {
        return items.filter(item => !isBannedTitle(item) && !isAdultContent(item));
    };

    const hasPlayableVideo = async (item: any) => {
        try {
            const isMovie = Boolean(item?.title) && !Boolean(item?.name);
            const videos = isMovie ? await getMovieVideos(item.id) : await getSeriesVideos(item.id);
            return Array.isArray(videos) && videos.some((v: any) => v?.site === 'YouTube');
        } catch {
            return false;
        }
    };

    const filterHeroByVideo = async (items: any[]) => {
        if (!items.length) return [];
        const results: any[] = [];
        const queue = [...items];
        const limit = 4;
        let active = 0;

        return new Promise<any[]>((resolve) => {
            const next = () => {
                if (queue.length === 0 && active === 0) {
                    resolve(results);
                    return;
                }
                while (active < limit && queue.length > 0) {
                    const item = queue.shift();
                    if (!item) break;
                    active++;
                    hasPlayableVideo(item)
                        .then((ok) => { if (ok) results.push(item); })
                        .finally(() => { active--; next(); });
                }
            };
            next();
        });
    };

    useEffect(() => {
        const fetchAllData = async () => {
            setIsLoading(true);
            try {
                // Fetch all data in parallel but handle failures individually
                const [
                    moviesResult,
                    popularMoviesRes,
                    upcomingMoviesRes,
                    seriesResult,
                    sportsResult,
                    todaySportsResult,
                    topRatedMoviesRes,
                    nowPlayingMoviesRes,
                    topRatedSeriesRes,
                    popularSeriesRes,
                    airingTodaySeriesRes,
                    scifiMoviesRes,
                    comedySeriesRes,
                    docsRes,
                    actionMoviesRes,
                    horrorRes,
                    thrillerRes,
                    dramaRes,
                    romanceRes,
                    animeRes,
                ] = await Promise.allSettled([
                    getTrendingMovies(),
                    getPopularMovies(),
                    getUpcomingMovies(),
                    getTrendingSeries(),
                    getLiveMatches(),
                    getTodaysMatches(),
                    getTopRatedMovies(),
                    getNowPlayingMovies(),
                    getTopRatedSeries(),
                    getPopularSeries(),
                    getAiringTodaySeries(),
                    getMoviesByGenre(878), // Sci-Fi Movies
                    getSeriesByGenre(35),  // Comedy Series
                    getMoviesByGenre(99),  // Documentaries
                    getMoviesByGenre(28),  // Action Movies
                    getHorrorMovies(),
                    getThrillerMovies(),
                    getDramaSeries(),
                    getRomanceSeries(),
                    getTrendingAnime(),
                ]);

                // Handle Movies Data
                if (moviesResult.status === 'fulfilled' && Array.isArray(moviesResult.value)) {
                    setTrendingMovies(filterContent(moviesResult.value).slice(0, 10).map(movieToContent));
                }
                if (topRatedMoviesRes.status === 'fulfilled' && Array.isArray(topRatedMoviesRes.value)) {
                    setTopRatedMovies(filterContent(topRatedMoviesRes.value).slice(0, 10).map(movieToContent));
                }
                if (nowPlayingMoviesRes.status === 'fulfilled' && Array.isArray(nowPlayingMoviesRes.value)) {
                    setNowPlayingMovies(filterContent(nowPlayingMoviesRes.value).slice(0, 10).map(movieToContent));
                }
                if (popularMoviesRes.status === 'fulfilled' && Array.isArray(popularMoviesRes.value)) {
                    setPopularMovies(filterContent(popularMoviesRes.value).slice(0, 10).map(movieToContent));
                }
                if (upcomingMoviesRes.status === 'fulfilled' && Array.isArray(upcomingMoviesRes.value)) {
                    setUpcomingMovies(filterContent(upcomingMoviesRes.value).slice(0, 10).map(movieToContent));
                }
                if (actionMoviesRes.status === 'fulfilled' && Array.isArray(actionMoviesRes.value)) {
                    setActionMovies(filterContent(actionMoviesRes.value).slice(0, 10).map(movieToContent));
                }

                // Handle New Categories
                if (scifiMoviesRes.status === 'fulfilled' && Array.isArray(scifiMoviesRes.value)) {
                    setScifiMovies(filterContent(scifiMoviesRes.value).slice(0, 10).map(movieToContent));
                }
                if (comedySeriesRes.status === 'fulfilled' && Array.isArray(comedySeriesRes.value)) {
                    setComedySeries(filterContent(comedySeriesRes.value).slice(0, 10).map(seriesToContent));
                }
                if (docsRes.status === 'fulfilled' && Array.isArray(docsRes.value)) {
                    setDocumentaries(filterContent(docsRes.value).slice(0, 10).map(movieToContent));
                }
                if (horrorRes.status === 'fulfilled' && Array.isArray(horrorRes.value)) {
                    setHorrorMovies(filterContent(horrorRes.value).slice(0, 12).map(movieToContent));
                }
                if (thrillerRes.status === 'fulfilled' && Array.isArray(thrillerRes.value)) {
                    setThrillerMovies(filterContent(thrillerRes.value).slice(0, 12).map(movieToContent));
                }

                // Handle Series Data
                if (seriesResult.status === 'fulfilled' && Array.isArray(seriesResult.value)) {
                    setTrendingSeries(filterContent(seriesResult.value).slice(0, 10).map(seriesToContent));
                }
                if (topRatedSeriesRes.status === 'fulfilled' && Array.isArray(topRatedSeriesRes.value)) {
                    setTopRatedSeries(filterContent(topRatedSeriesRes.value).slice(0, 10).map(seriesToContent));
                }
                if (popularSeriesRes.status === 'fulfilled' && Array.isArray(popularSeriesRes.value)) {
                    setPopularSeries(filterContent(popularSeriesRes.value).slice(0, 10).map(seriesToContent));
                }
                if (airingTodaySeriesRes.status === 'fulfilled' && Array.isArray(airingTodaySeriesRes.value)) {
                    setAiringTodaySeries(filterContent(airingTodaySeriesRes.value).slice(0, 10).map(seriesToContent));
                }
                if (dramaRes.status === 'fulfilled' && Array.isArray(dramaRes.value)) {
                    setDramaSeries(filterContent(dramaRes.value).slice(0, 12).map(seriesToContent));
                }
                if (romanceRes.status === 'fulfilled' && Array.isArray(romanceRes.value)) {
                    setRomanceSeries(filterContent(romanceRes.value).slice(0, 12).map(seriesToContent));
                }
                if (animeRes.status === 'fulfilled' && Array.isArray(animeRes.value)) {
                    setAnimeItems(filterContent(animeRes.value).slice(0, 12).map((a: any) =>
                        'title' in a ? movieToContent(a as TMDBMovie) : seriesToContent(a as TMDBSeries)
                    ));
                }

                // Handle Hero Items (BEST QUALITY CURATION)
                // Pull from trending + top-rated + popular for the widest possible high-quality pool

                const rawMovies = (moviesResult.status === 'fulfilled' && Array.isArray(moviesResult.value))
                    ? filterContent(moviesResult.value)
                    : [];
                const rawSeries = (seriesResult.status === 'fulfilled' && Array.isArray(seriesResult.value))
                    ? filterContent(seriesResult.value)
                    : [];
                const rawTopMovies = (topRatedMoviesRes.status === 'fulfilled' && Array.isArray(topRatedMoviesRes.value))
                    ? filterContent(topRatedMoviesRes.value)
                    : [];
                const rawPopularMovies = (popularMoviesRes.status === 'fulfilled' && Array.isArray(popularMoviesRes.value))
                    ? filterContent(popularMoviesRes.value)
                    : [];
                const rawTopSeries = (topRatedSeriesRes.status === 'fulfilled' && Array.isArray(topRatedSeriesRes.value))
                    ? filterContent(topRatedSeriesRes.value)
                    : [];
                const rawPopularSeries = (popularSeriesRes.status === 'fulfilled' && Array.isArray(popularSeriesRes.value))
                    ? filterContent(popularSeriesRes.value)
                    : [];

                // Strict Quality Filter — only high-rated, well-known content with great backdrops
                const isTopTier = (item: any) =>
                    item.backdrop_path &&
                    item.vote_average >= 7.5 &&
                    item.vote_count >= 1000 &&
                    item.overview && item.overview.length > 40;

                // Looser fallback in case strict filter leaves too few
                const isMidTier = (item: any) =>
                    item.backdrop_path &&
                    item.vote_average >= 6.8 &&
                    item.vote_count >= 300 &&
                    item.overview && item.overview.length > 20;

                // Combine all sources — top-rated first, then trending, then popular
                const allMovieSources = [...rawTopMovies, ...rawMovies, ...rawPopularMovies];
                const allSeriesSources = [...rawTopSeries, ...rawSeries, ...rawPopularSeries];

                const bestMovies = allMovieSources.filter(isTopTier);
                const bestSeries = allSeriesSources.filter(isTopTier);
                const fallbackMovies = allMovieSources.filter(m => !isTopTier(m) && isMidTier(m));
                const fallbackSeries = allSeriesSources.filter(s => !isTopTier(s) && isMidTier(s));

                // Interleave movies and series for variety, top-tier first
                const heroPool = [
                    ...bestMovies.slice(0, 10),
                    ...bestSeries.slice(0, 10),
                    ...fallbackMovies.slice(0, 6),
                    ...fallbackSeries.slice(0, 6),
                ].filter(item => !isBannedTitle(item) && !isAdultContent(item));

                const seenHero = new Set<string>();
                const uniqueHero = heroPool.filter((item: any) => {
                    const kind = item?.title ? 'movie' : 'series';
                    const key = `${kind}-${item.id}`;
                    if (seenHero.has(key)) return false;
                    seenHero.add(key);
                    return true;
                });

                // Shuffle for variety across refreshes, then run video filter
                const shuffled = uniqueHero.sort(() => Math.random() - 0.5);
                const videoReadyHero = await filterHeroByVideo(shuffled);

                // Pad with image-only items if video filter leaves too few
                const videoIds = new Set(videoReadyHero.map((item: any) => `${item?.title ? 'movie' : 'series'}-${item.id}`));
                const paddedHero = videoReadyHero.concat(
                    shuffled.filter((item: any) => !videoIds.has(`${item?.title ? 'movie' : 'series'}-${item.id}`))
                        .slice(0, Math.max(14 - videoReadyHero.length, 0))
                );

                setHeroItems(paddedHero.slice(0, 14));

                // Handle Deportes Data — merge live + today, deduplicate, live first
                const liveMatches = sportsResult.status === 'fulfilled' && Array.isArray(sportsResult.value) ? sportsResult.value : [];
                const todayMatches = todaySportsResult.status === 'fulfilled' && Array.isArray(todaySportsResult.value) ? todaySportsResult.value : [];

                const seenIds = new Set<string>();
                const merged = [...liveMatches, ...todayMatches].filter((m) => {
                    if (!m?.id || seenIds.has(m.id)) return false;
                    seenIds.add(m.id);
                    return true;
                });

                // Live first, then upcoming sorted by time
                const now = Date.now();
                merged.sort((a, b) => {
                    const aLive = a.date <= now;
                    const bLive = b.date <= now;
                    if (aLive && !bLive) return -1;
                    if (!aLive && bLive) return 1;
                    return a.date - b.date;
                });

                if (merged.length > 0) {
                    setLiveSports(merged.slice(0, 14).map(matchToContent));
                } else {
                    setLiveSports(mockSportsFallback);
                }

            } catch (err) {
                console.error("Unexpected error in data fetch", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAllData();
    }, [contentFilter]);

    useEffect(() => {
        if (trendingMovies.length + popularMovies.length + trendingSeries.length + popularSeries.length === 0) return;
        const id = window.setInterval(() => {
            setSpotlightIndex((prev) => prev + 1);
        }, 8000);
        return () => window.clearInterval(id);
    }, [trendingMovies.length, popularMovies.length, trendingSeries.length, popularSeries.length]);

    useEffect(() => {
        const loadHistory = async () => {
            if (!user) return;
            const { data, error } = await supabase
                .from('watch_history')
                .select('media_id,media_type,title,image,progress,updated_at')
                .eq('user_id', user.id)
                .order('updated_at', { ascending: false })
                .limit(12);

            if (!error) {
                const mapped = (data || [])
                    .filter((item: any) => item.media_type !== 'anime')
                    .map((item: any) => ({
                        id: item.media_id,
                        tmdbId: parseInt(item.media_id) || undefined,
                        title: { english: item.title || 'Seguir viendo' },
                        image: item.image || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&q=80',
                        rating: item.progress ? Math.min(100, Math.max(0, item.progress)) : 0,
                        type: item.media_type === 'movie' ? 'Movie' : 'Series',
                        releaseDate: new Date(item.updated_at).toLocaleDateString()
                    }));
                setHistoryItems(mapped);

                // Load recommendations based on last watched movie
                const lastMovie = (data || []).find((item: any) => item.media_type === 'movie');
                if (lastMovie) {
                    try {
                        const recs = await getMovieRecommendations(parseInt(lastMovie.media_id));
                        if (Array.isArray(recs) && recs.length > 0) {
                            setRecommendations(recs.slice(0, 12).map(movieToContent));
                            setRecommendationTitle(`Porque viste ${lastMovie.title}`);
                        }
                    } catch { /* ignore */ }
                }
            } else {
                console.error('Failed to load history:', error);
            }
        };
        loadHistory();
    }, [user]);

    if (isLoading) return <PremiumLoader />;

    const movieSpotlightPool = trendingMovies.length ? trendingMovies : popularMovies;
    const seriesSpotlightPool = trendingSeries.length ? trendingSeries : popularSeries;
    const spotlightMovie = movieSpotlightPool.length ? movieSpotlightPool[spotlightIndex % movieSpotlightPool.length] : undefined;
    const spotlightSeries = seriesSpotlightPool.length ? seriesSpotlightPool[(spotlightIndex + 1) % seriesSpotlightPool.length] : undefined;

    const newSeriesCount = Math.min(airingTodaySeries.length, 10);
    const topMoviesCount = Math.min(trendingMovies.length, 10);

    return (
        <main className="min-h-screen bg-[#0d0d0f] relative home-page">
            <DynamicHeroBanner items={heroItems} />

            {/* Category Bar - Glass Effect */}
            <div className="home-category-bar">
                <div className="home-category-inner">
                    <div className="home-category-track scrollbar-hide">
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={`home-category-chip ${activeCategory === cat.id ? 'is-active' : ''}`}
                            >
                                <i className={`${cat.icon} home-category-chip-icon`}></i>
                                <span className="home-category-chip-label">{cat.name}</span>
                                {cat.id === 'movies' && topMoviesCount > 0 && <span className="cat-badge cat-badge-top">Top {topMoviesCount}</span>}
                                {cat.id === 'series' && newSeriesCount > 0 && <span className="cat-badge cat-badge-new">Nuevos {newSeriesCount}</span>}
                                {cat.id === 'sports' && <span className="cat-badge cat-badge-live">En vivo</span>}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content Sections - Tight Spacing */}
            <div className="home-stage">
                <div className="home-glow home-glow-left" />
                <div className="home-glow home-glow-right" />

                {(activeCategory === 'all') && (
                    <div className="home-ribbon">Tendencias de la semana</div>
                )}

                {(activeCategory === 'all') && null}

                <div className="relative z-10 pt-0 pb-16">
                    {/* Seguir viendo */}
                    {historyItems.length > 0 && (
                        <ContentRow
                            title="Seguir viendo"
                            items={historyItems}
                            seeAllLink="/history"
                            cardVariant="landscape"
                            getLink={(item: any) => {
                                const type = item.type === 'Movie' ? 'movie' : 'tv';
                                return `/watch/${type}/${item.tmdbId || item.id}`;
                            }}
                        />
                    )}
                    {/* Spotlight — uses backdrop for wide cinematic look */}
                    {(activeCategory === 'all' || activeCategory === 'movies' || activeCategory === 'series') && (
                        <section className="home-spotlight nova-reveal">
                            {spotlightMovie && (
                                <Link
                                    to={`/watch/movie/${spotlightMovie.id}`}
                                    key={spotlightMovie.id}
                                    className="spotlight-card spotlight-movie spotlight-fade reveal-up delay-1"
                                    style={{ backgroundImage: `url(${spotlightMovie.backdrop || spotlightMovie.image})` }}
                                >
                                    <div className="spotlight-overlay" />
                                    <div className="spotlight-content">
                                        <div className="spotlight-tag"><i className="ri-film-line"></i> Película</div>
                                        <h3 className="spotlight-title">{spotlightMovie.title?.english || 'Película destacada'}</h3>
                                        <p className="spotlight-meta">{spotlightMovie.releaseDate}</p>
                                        <div className="spotlight-cta">
                                            <i className="ri-play-fill"></i>
                                            <span>Ver ahora</span>
                                        </div>
                                    </div>
                                </Link>
                            )}
                            {spotlightSeries && (
                                <Link
                                    to={`/watch/tv/${spotlightSeries.id}`}
                                    key={spotlightSeries.id}
                                    className="spotlight-card spotlight-series spotlight-fade reveal-up delay-2"
                                    style={{ backgroundImage: `url(${spotlightSeries.backdrop || spotlightSeries.image})` }}
                                >
                                    <div className="spotlight-overlay" />
                                    <div className="spotlight-content">
                                        <div className="spotlight-tag"><i className="ri-tv-line"></i> Serie</div>
                                        <h3 className="spotlight-title">{spotlightSeries.title?.english || 'Serie destacada'}</h3>
                                        <p className="spotlight-meta">{spotlightSeries.releaseDate}</p>
                                        <div className="spotlight-cta">
                                            <i className="ri-play-fill"></i>
                                            <span>Ver ahora</span>
                                        </div>
                                    </div>
                                </Link>
                            )}
                        </section>
                    )}

                    {/* Centro de Películas */}
                    {(activeCategory === 'all' || activeCategory === 'movies') && (
                        <section className="home-band home-band-movies nova-reveal">
                            <div className="home-band-head">
                                <div>
                                    <h2 className="home-band-title">Películas</h2>
                                    <p className="home-band-sub">Estrenos, éxitos y favoritos de la crítica en un solo lugar.</p>
                                </div>
                                <Link to="/peliculas" className="home-band-link">
                                    Ver Películas <i className="ri-arrow-right-s-line"></i>
                                </Link>
                            </div>

                            {topRatedMovies.length > 0 && (
                                <div className="critics-row">
                                    <div className="critics-title">Selección de la crítica</div>
                                    <div className="critics-track">
                                        {topRatedMovies.slice(0, 6).map((movie) => (
                                            <Link
                                                key={movie.id}
                                                to={`/watch/movie/${movie.id}`}
                                                className="critic-card"
                                                style={{ backgroundImage: `url(${movie.image})` }}
                                            >
                                                <div className="critic-overlay" />
                                                <div className="critic-label">Top</div>
                                                <div className="critic-name">{movie.title?.english}</div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {trendingMovies.length > 0 && (
                                <div className="topten-row">
                                    <div className="topten-title">Top 10 de hoy</div>
                                    <div className="topten-track">
                                        {trendingMovies.slice(0, 10).map((movie, index) => (
                                            <Link
                                                key={movie.id}
                                                to={`/watch/movie/${movie.id}`}
                                                className="topten-item"
                                            >
                                                <span className="topten-num">{index + 1}</span>
                                                <div
                                                    className="topten-card"
                                                    style={{ backgroundImage: `url(${movie.image})` }}
                                                >
                                                    <div className="topten-overlay" />
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {nowPlayingMovies.length > 0 && (
                                <ContentRow
                                    title="Ahora en cines"
                                    items={nowPlayingMovies}
                                    seeAllLink="/peliculas"
                                    getLink={(item) => `/watch/movie/${item.id}`}
                                />
                            )}
                            {popularMovies.length > 0 && (
                                <ContentRow
                                    title="Más populares"
                                    items={popularMovies}
                                    seeAllLink="/peliculas"
                                    getLink={(item) => `/watch/movie/${item.id}`}
                                />
                            )}
                            {upcomingMovies.length > 0 && (
                                <ContentRow
                                    title="Próximos estrenos"
                                    items={upcomingMovies}
                                    seeAllLink="/peliculas"
                                    getLink={(item) => `/watch/movie/${item.id}`}
                                />
                            )}
                            {actionMovies.length > 0 && (
                                <ContentRow
                                    title="Acción y aventura"
                                    items={actionMovies}
                                    seeAllLink="/peliculas"
                                    getLink={(item) => `/watch/movie/${item.id}`}
                                />
                            )}
                            {scifiMovies.length > 0 && (
                                <ContentRow
                                    title="Ciencia ficción"
                                    items={scifiMovies}
                                    seeAllLink="/peliculas"
                                    getLink={(item) => `/watch/movie/${item.id}`}
                                />
                            )}
                            {horrorMovies.length > 0 && (
                                <ContentRow
                                    title="Terror"
                                    items={horrorMovies}
                                    seeAllLink="/peliculas"
                                    getLink={(item: any) => `/watch/movie/${item.id}`}
                                />
                            )}
                            {thrillerMovies.length > 0 && (
                                <ContentRow
                                    title="Thriller"
                                    items={thrillerMovies}
                                    seeAllLink="/peliculas"
                                    getLink={(item: any) => `/watch/movie/${item.id}`}
                                />
                            )}
                            {documentaries.length > 0 && (
                                <ContentRow
                                    title="Documentales"
                                    items={documentaries}
                                    seeAllLink="/peliculas"
                                    getLink={(item: any) => `/watch/movie/${item.id}`}
                                />
                            )}
                        </section>
                    )}

                    {/* Centro de Series */}
                    {(activeCategory === 'all' || activeCategory === 'series') && (
                        <section className="home-band home-band-series nova-reveal">
                            <div className="home-band-head">
                                <div>
                                    <h2 className="home-band-title">Series</h2>
                                    <p className="home-band-sub">Dramas premium, favoritos de culto y nuevos estrenos.</p>
                                </div>
                                <Link to="/series" className="home-band-link">
                                    Ver Series <i className="ri-arrow-right-s-line"></i>
                                </Link>
                            </div>

                            {airingTodaySeries.length > 0 && (
                                <div className="newweek-row">
                                    <div className="newweek-title">Novedades de la semana</div>
                                    <div className="newweek-track">
                                        {airingTodaySeries.slice(0, 6).map((series) => (
                                            <Link
                                                key={series.id}
                                                to={`/watch/tv/${series.id}`}
                                                className="newweek-card"
                                                style={{ backgroundImage: `url(${series.image})` }}
                                            >
                                                <div className="newweek-overlay" />
                                                <div className="newweek-label">Nuevo</div>
                                                <div className="newweek-name">{series.title?.english}</div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {trendingSeries.length > 0 && (
                                <div className="topten-row topten-series">
                                    <div className="topten-title">Top 10 de series</div>
                                    <div className="topten-track">
                                        {trendingSeries.slice(0, 10).map((series, index) => (
                                            <Link
                                                key={series.id}
                                                to={`/watch/tv/${series.id}`}
                                                className="topten-item"
                                            >
                                                <span className="topten-num">{index + 1}</span>
                                                <div
                                                    className="topten-card"
                                                    style={{ backgroundImage: `url(${series.image})` }}
                                                >
                                                    <div className="topten-overlay" />
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {topRatedSeries.length > 0 && (
                                <ContentRow
                                    title="Más valoradas"
                                    items={topRatedSeries}
                                    seeAllLink="/series"
                                    getLink={(item: any) => `/watch/tv/${item.id}`}
                                />
                            )}
                            {popularSeries.length > 0 && (
                                <ContentRow
                                    title="Más populares"
                                    items={popularSeries}
                                    seeAllLink="/series"
                                    getLink={(item: any) => `/watch/tv/${item.id}`}
                                />
                            )}
                            {comedySeries.length > 0 && (
                                <ContentRow
                                    title="Comedias"
                                    items={comedySeries}
                                    seeAllLink="/series"
                                    getLink={(item: any) => `/watch/tv/${item.id}`}
                                />
                            )}
                            {dramaSeries.length > 0 && (
                                <ContentRow
                                    title="Dramas"
                                    items={dramaSeries}
                                    seeAllLink="/series"
                                    getLink={(item: any) => `/watch/tv/${item.id}`}
                                />
                            )}
                            {romanceSeries.length > 0 && (
                                <ContentRow
                                    title="Romance"
                                    items={romanceSeries}
                                    seeAllLink="/series"
                                    getLink={(item: any) => `/watch/tv/${item.id}`}
                                />
                            )}
                        </section>
                    )}

                    {/* Anime Section */}
                    {(activeCategory === 'all' || activeCategory === 'anime') && animeItems.length > 0 && (
                        <section className="home-band home-band-anime nova-reveal">
                            <div className="home-band-head">
                                <div>
                                    <h2 className="home-band-title">Anime</h2>
                                    <p className="home-band-sub">Los títulos más populares del mundo del anime.</p>
                                </div>
                                <Link to="/anime" className="home-band-link">
                                    Ver Anime <i className="ri-arrow-right-s-line"></i>
                                </Link>
                            </div>
                            <ContentRow
                                title="Tendencias en anime"
                                items={animeItems}
                                seeAllLink="/anime"
                                getLink={(item: any) => `/watch/tv/${item.id}`}
                            />
                        </section>
                    )}

                    {/* Personalized Recommendations */}
                    {recommendations.length > 0 && (activeCategory === 'all' || activeCategory === 'movies') && (
                        <section className="home-band nova-reveal">
                            <ContentRow
                                title={recommendationTitle}
                                items={recommendations}
                                seeAllLink="/peliculas"
                                getLink={(item: any) => `/watch/movie/${item.id}`}
                            />
                        </section>
                    )}
                    {/* Deportes en vivo */}
                    {(activeCategory === 'all' || activeCategory === 'sports') && liveSports.length > 0 && (
                        <ContentRow
                            title="Deportes en vivo"
                            items={liveSports}
                            seeAllLink="/deportes"
                            getLink={(item: any) => {
                                if (item.sources && item.sources.length > 0) {
                                    const source = item.sources[0];
                                    return `/deportes/watch/${source.source}/${source.id}?title=${encodeURIComponent(item.title?.english || '')}&category=${item.category || 'sports'}`;
                                }
                                return `/deportes`;
                            }}
                            variant="live"
                        />
                    )}

                    <PremiumCTA />
                </div>
            </div>
            {/*
            <footer className="border-t border-white/5 bg-[#050507]">
                <div className="w-full page-gutter py-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-3">
                            <NovaLogo className="w-8 h-8" />
                            <span className="font-display font-bold text-xl text-white">NOVA</span>
                        </div>
                        <div className="flex items-center gap-6 text-sm text-gray-400">
                            <Link to="/peliculas" className="hover:text-white transition-colors">Películas</Link>
                            <Link to="/series" className="hover:text-white transition-colors">Series</Link>
                            <Link to="/deportes" className="hover:text-white transition-colors">Deportes</Link>
                        </div>
                        <div className="flex items-center gap-4 text-gray-500 text-sm">
                            <a href="#" className="hover:text-white transition-colors">Privacy</a>
                            <a href="#" className="hover:text-white transition-colors">Terms</a>
                            <span>© 2024 NOVA</span>
                        </div>
                    </div>
                </div>
            </footer>
        */}
        </main>
    );
}
