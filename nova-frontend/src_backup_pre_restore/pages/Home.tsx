import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ContentRow from '../components/ContentRow';
import DynamicHeroBanner from '../components/DynamicHeroBanner';
import NovaLogo from '../components/NovaLogo';
import PremiumCTA from '../components/PremiumCTA';
import PremiumLoader from '../components/PremiumLoader';
import { getTrendingAnime, getPopularAnime } from '../services/api';
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
    TMDBMovie,
    TMDBSeries
} from '../services/api';
import { getLiveMatches, matchToContent } from '../services/sportsService';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

// Transform TMDB movie to content format
const movieToContent = (movie: TMDBMovie) => ({
    id: movie.id,
    tmdbId: movie.id,
    title: { english: movie.title },
    image: getImageUrl(movie.poster_path, 'w500'),
    rating: Math.round(movie.vote_average * 10),
    type: 'Movie',
    releaseDate: movie.release_date?.split('-')[0] || 'N/A',
});

// Transform TMDB series to content format
const seriesToContent = (series: TMDBSeries) => ({
    id: series.id,
    tmdbId: series.id,
    title: { english: series.name },
    image: getImageUrl(series.poster_path, 'w500'),
    rating: Math.round(series.vote_average * 10),
    type: 'TV',
    releaseDate: series.first_air_date?.split('-')[0] || 'N/A',
});

// Mock sports fallback for when API has no live data
const mockSportsFallback = [
    { id: 'no-live', title: { english: 'No Live Events' }, image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&q=90', rating: 0, type: 'Sports', releaseDate: 'Check Schedule', isLive: false },
];

// Category definitions
const categories = [
    { id: 'all', name: 'All', icon: 'ri-apps-line' },
    { id: 'anime', name: 'Anime', icon: 'ri-ghost-line', link: '/anime' },
    { id: 'movies', name: 'Movies', icon: 'ri-film-line', link: '/peliculas' },
    { id: 'series', name: 'Series', icon: 'ri-tv-line', link: '/series' },
    { id: 'sports', name: 'Sports', icon: 'ri-basketball-line', link: '/deportes' },
];

export default function Home() {
    const { user } = useAuth();
    const [trendingAnime, setTrendingAnime] = useState<any[]>([]);
    const [popularAnime, setPopularAnime] = useState<any[]>([]);
    const [latestAnime, setLatestAnime] = useState<any[]>([]);
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
    const [heroItems, setHeroItems] = useState<(TMDBMovie | TMDBSeries)[]>([]);
    const [activeCategory, setActiveCategory] = useState('all');
    const [isLoading, setIsLoading] = useState(true);
    const [historyItems, setHistoryItems] = useState<any[]>([]);

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
                    topRatedMoviesRes,
                    nowPlayingMoviesRes,
                    topRatedSeriesRes,
                    popularSeriesRes,
                    airingTodaySeriesRes,
                    scifiMoviesRes,
                    comedySeriesRes,
                    docsRes,
                    actionMoviesRes
                ] = await Promise.allSettled([
                    getTrendingMovies(),
                    getPopularMovies(),
                    getUpcomingMovies(),
                    getTrendingSeries(),
                    getLiveMatches(),
                    getTopRatedMovies(),
                    getNowPlayingMovies(),
                    getTopRatedSeries(),
                    getPopularSeries(),
                    getAiringTodaySeries(),
                    getMoviesByGenre(878), // Sci-Fi Movies
                    getSeriesByGenre(35),  // Comedy Series
                    getMoviesByGenre(99),  // Documentaries
                    getMoviesByGenre(28)   // Action Movies
                ]);

                // Handle Anime Data
                const [trendingAnimeRes, popularAnimeRes] = await Promise.all([
                    getTrendingAnime(),
                    getPopularAnime()
                ]);

                const mapAnime = (anime: any) => ({
                    id: anime.id,
                    tmdbId: anime.id,
                    title: { english: anime.title || anime.name },
                    image: getImageUrl(anime.poster_path, 'w500'),
                    rating: Math.round(anime.vote_average * 10),
                    type: 'Anime',
                    mediaType: anime.media_type || (anime.title ? 'movie' : 'tv'),
                    releaseDate: (anime.release_date || anime.first_air_date)?.split('-')[0] || '2024'
                });

                if (trendingAnimeRes) {
                    setTrendingAnime(trendingAnimeRes.map(mapAnime));
                    setLatestAnime(trendingAnimeRes.slice(0, 10).map(mapAnime));
                }
                if (popularAnimeRes) {
                    setPopularAnime(popularAnimeRes.map(mapAnime));
                }

                // Handle Movies Data
                if (moviesResult.status === 'fulfilled' && Array.isArray(moviesResult.value)) {
                    setTrendingMovies(moviesResult.value.slice(0, 10).map(movieToContent));
                }
                if (topRatedMoviesRes.status === 'fulfilled' && Array.isArray(topRatedMoviesRes.value)) {
                    setTopRatedMovies(topRatedMoviesRes.value.slice(0, 10).map(movieToContent));
                }
                if (nowPlayingMoviesRes.status === 'fulfilled' && Array.isArray(nowPlayingMoviesRes.value)) {
                    setNowPlayingMovies(nowPlayingMoviesRes.value.slice(0, 10).map(movieToContent));
                }
                if (popularMoviesRes.status === 'fulfilled' && Array.isArray(popularMoviesRes.value)) {
                    setPopularMovies(popularMoviesRes.value.slice(0, 10).map(movieToContent));
                }
                if (upcomingMoviesRes.status === 'fulfilled' && Array.isArray(upcomingMoviesRes.value)) {
                    setUpcomingMovies(upcomingMoviesRes.value.slice(0, 10).map(movieToContent));
                }
                if (actionMoviesRes.status === 'fulfilled' && Array.isArray(actionMoviesRes.value)) {
                    setActionMovies(actionMoviesRes.value.slice(0, 10).map(movieToContent));
                }

                // Handle New Categories
                if (scifiMoviesRes.status === 'fulfilled' && Array.isArray(scifiMoviesRes.value)) {
                    setScifiMovies(scifiMoviesRes.value.slice(0, 10).map(movieToContent));
                }
                if (comedySeriesRes.status === 'fulfilled' && Array.isArray(comedySeriesRes.value)) {
                    setComedySeries(comedySeriesRes.value.slice(0, 10).map(seriesToContent));
                }
                if (docsRes.status === 'fulfilled' && Array.isArray(docsRes.value)) {
                    setDocumentaries(docsRes.value.slice(0, 10).map(movieToContent));
                }

                // Handle Series Data
                if (seriesResult.status === 'fulfilled' && Array.isArray(seriesResult.value)) {
                    setTrendingSeries(seriesResult.value.slice(0, 10).map(seriesToContent));
                }
                if (topRatedSeriesRes.status === 'fulfilled' && Array.isArray(topRatedSeriesRes.value)) {
                    setTopRatedSeries(topRatedSeriesRes.value.slice(0, 10).map(seriesToContent));
                }
                if (popularSeriesRes.status === 'fulfilled' && Array.isArray(popularSeriesRes.value)) {
                    setPopularSeries(popularSeriesRes.value.slice(0, 10).map(seriesToContent));
                }
                if (airingTodaySeriesRes.status === 'fulfilled' && Array.isArray(airingTodaySeriesRes.value)) {
                    setAiringTodaySeries(airingTodaySeriesRes.value.slice(0, 10).map(seriesToContent));
                }

                // Handle Hero Items (BEST QUALITY CURATION)
                // We want: High Quality (7+ Rating), Popular, High Res Backdrop, Mix of Movie/TV/Anime

                const rawMovies = (moviesResult.status === 'fulfilled' && Array.isArray(moviesResult.value)) ? moviesResult.value : [];
                const rawSeries = (seriesResult.status === 'fulfilled' && Array.isArray(seriesResult.value)) ? seriesResult.value : [];
                const rawAnime = trendingAnimeRes || [];

                // Helper: Strict Quality Filter
                const isTopTier = (item: any) => {
                    return item.backdrop_path &&                    // Must have backdrop
                        item.vote_average >= 7.0 &&              // High Rating
                        item.vote_count >= 500 &&                // Reliable Rating (Not obscure)
                        item.overview && item.overview.length > 20; // Good metadata
                };

                const bestMovies = rawMovies.filter(isTopTier);
                const bestSeries = rawSeries.filter(isTopTier);
                // Anime usually has fewer votes on TMDB, slightly lower threshold or just take top trends
                const bestAnime = rawAnime.filter((a: any) => a.backdrop_path && a.vote_average >= 7.5);

                // Create a curated mix (e.g., 2 Movies, 2 Series, 1 Anime)
                const curatedHero: any[] = [];

                if (bestMovies[0]) curatedHero.push(bestMovies[0]);
                if (bestSeries[0]) curatedHero.push(bestSeries[0]);
                if (bestMovies[1]) curatedHero.push(bestMovies[1]);
                if (bestAnime[0]) curatedHero.push(bestAnime[0]);
                if (bestSeries[1]) curatedHero.push(bestSeries[1]);

                // Fill remaining spots if needed with top rated generally
                const leftovers = [...bestMovies.slice(2), ...bestSeries.slice(2), ...bestAnime.slice(1)]
                    .sort((a, b) => b.popularity - a.popularity)
                    .slice(0, 3);

                const randomizedHero = [...curatedHero, ...leftovers]
                    .sort(() => Math.random() - 0.5);
                setHeroItems(randomizedHero);

                // Handle Sports Data
                if (sportsResult.status === 'fulfilled' && Array.isArray(sportsResult.value) && sportsResult.value.length > 0) {
                    setLiveSports(sportsResult.value.slice(0, 8).map(matchToContent));
                } else {
                    console.error("Sports fetch failed", sportsResult.status === 'rejected' ? sportsResult.reason : 'No/Invalid data');
                    setLiveSports(mockSportsFallback);
                }

            } catch (err) {
                console.error("Unexpected error in data fetch", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAllData();
    }, []);

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
                const mapped = (data || []).map((item: any) => ({
                    id: item.media_id,
                    tmdbId: parseInt(item.media_id) || undefined,
                    title: { english: item.title || 'Continue Watching' },
                    image: item.image || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&q=80',
                    rating: item.progress ? Math.min(100, Math.max(0, item.progress)) : 0,
                    type: item.media_type === 'movie' ? 'Movie' : 'Series',
                    releaseDate: new Date(item.updated_at).toLocaleDateString()
                }));
                setHistoryItems(mapped);
            } else {
                console.error('Failed to load history:', error);
            }
        };
        loadHistory();
    }, [user]);

    if (isLoading) return <PremiumLoader />;

    return (
        <main className="min-h-screen bg-transparent relative">
            <DynamicHeroBanner items={heroItems} />

            {/* Category Bar - Glass Effect */}
            <div className="z-40 bg-[#020204]/60 backdrop-blur-xl border-b border-white/5 supports-[backdrop-filter]:bg-[#020204]/60">
                <div className="w-full px-[5%]">
                    <div className="flex items-center gap-3 py-3 overflow-x-auto scrollbar-hide">
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl text-xs font-display font-bold uppercase tracking-wider whitespace-nowrap transition-all duration-300 border ${activeCategory === cat.id
                                    ? 'bg-white text-black border-white scale-105 shadow-[0_0_25px_rgba(255,255,255,0.25)]'
                                    : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:text-white hover:border-white/20'
                                    }`}
                            >
                                <i className={`${cat.icon} text-lg`}></i>
                                <span>{cat.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content Sections - Tight Spacing */}
            <div className="relative z-10 pt-0 pb-16">
                {/* Continue Watching */}
                {historyItems.length > 0 && (
                    <ContentRow
                        title="Continue Watching"
                        items={historyItems}
                        seeAllLink="/history"
                        cardVariant="landscape"
                        getLink={(item: any) => {
                            const type = item.type === 'Movie' ? 'movie' : 'tv';
                            return `/watch/${type}/${item.tmdbId || item.id}`;
                        }}
                    />
                )}
                {/* Trending Movies - PRIORITY 1 */}
                {(activeCategory === 'all' || activeCategory === 'movies') && trendingMovies.length > 0 && (
                    <ContentRow
                        title="Featured Movies"
                        items={trendingMovies}
                        seeAllLink="/peliculas"
                        getLink={(item) => `/watch/movie/${item.id}`}
                    />
                )}

                {/* Trending Series - PRIORITY 2 */}
                {(activeCategory === 'all' || activeCategory === 'series') && trendingSeries.length > 0 && (
                    <ContentRow
                        title="Premium Series"
                        items={trendingSeries}
                        seeAllLink="/series"
                        getLink={(item) => `/watch/tv/${item.id}`}
                        titleClassName="text-gradient-gold"
                    />
                )}

                {/* Now Playing Movies */}
                {(activeCategory === 'all' || activeCategory === 'movies') && nowPlayingMovies.length > 0 && (
                    <ContentRow
                        title="Now in Cinemas"
                        items={nowPlayingMovies}
                        seeAllLink="/peliculas"
                        getLink={(item) => `/watch/movie/${item.id}`}
                    />
                )}

                {/* Popular Movies */}
                {(activeCategory === 'all' || activeCategory === 'movies') && popularMovies.length > 0 && (
                    <ContentRow
                        title="Most Watched Movies"
                        items={popularMovies}
                        seeAllLink="/peliculas"
                        getLink={(item) => `/watch/movie/${item.id}`}
                    />
                )}

                {/* Upcoming Movies */}
                {(activeCategory === 'all' || activeCategory === 'movies') && upcomingMovies.length > 0 && (
                    <ContentRow
                        title="Upcoming Premieres"
                        items={upcomingMovies}
                        seeAllLink="/peliculas"
                        getLink={(item) => `/watch/movie/${item.id}`}
                    />
                )}

                {/* Sci-Fi Movies - NEW */}
                {(activeCategory === 'all' || activeCategory === 'movies') && scifiMovies.length > 0 && (
                    <ContentRow
                        title="Sci-Fi & Fantasy"
                        items={scifiMovies}
                        seeAllLink="/peliculas"
                        getLink={(item) => `/watch/movie/${item.id}`}
                    />
                )}

                {/* Trending Anime - MOVED DOWN */}
                {(activeCategory === 'all' || activeCategory === 'anime') && trendingAnime.length > 0 && (
                    <ContentRow
                        title="Trending Anime"
                        items={trendingAnime}
                        seeAllLink="/anime"
                        getLink={(item: any) => `/watch/tv/${item.id}`}
                        titleClassName="text-gradient"
                    />
                )}

                {/* Comedy Series - NEW */}
                {(activeCategory === 'all' || activeCategory === 'series') && comedySeries.length > 0 && (
                    <ContentRow
                        title="Comedy Hits"
                        items={comedySeries}
                        seeAllLink="/series"
                        getLink={(item: any) => `/watch/tv/${item.id}`}
                    />
                )}

                {/* Airing Today Series */}
                {(activeCategory === 'all' || activeCategory === 'series') && airingTodaySeries.length > 0 && (
                    <ContentRow
                        title="Airing Today"
                        items={airingTodaySeries}
                        seeAllLink="/series"
                        getLink={(item: any) => `/watch/tv/${item.id}`}
                    />
                )}

                {/* Top Rated Movies */}
                {(activeCategory === 'all' || activeCategory === 'movies') && topRatedMovies.length > 0 && (
                    <ContentRow
                        title="Critically Acclaimed Movies"
                        items={topRatedMovies}
                        seeAllLink="/peliculas"
                        getLink={(item) => `/watch/movie/${item.id}`}
                    />
                )}

                {/* Top Rated Series */}
                {(activeCategory === 'all' || activeCategory === 'series') && topRatedSeries.length > 0 && (
                    <ContentRow
                        title="All-Time Best Sereis"
                        items={topRatedSeries}
                        seeAllLink="/series"
                        getLink={(item: any) => `/watch/tv/${item.id}`}
                    />
                )}

                {/* Action Movies */}
                {(activeCategory === 'all' || activeCategory === 'movies') && actionMovies.length > 0 && (
                    <ContentRow
                        title="Adrenaline Rush"
                        items={actionMovies}
                        seeAllLink="/peliculas"
                        getLink={(item) => `/watch/movie/${item.id}`}
                    />
                )}

                {/* Popular Anime */}
                {(activeCategory === 'all' || activeCategory === 'anime') && popularAnime.length > 0 && (
                    <ContentRow
                        title="Most Popular Anime"
                        items={popularAnime}
                        seeAllLink="/anime"
                        getLink={(item: any) => `/watch/tv/${item.id}`}
                    />
                )}

                {/* Documentaries - NEW */}
                {(activeCategory === 'all' || activeCategory === 'movies') && documentaries.length > 0 && (
                    <ContentRow
                        title="Fascinating Documentaries"
                        items={documentaries}
                        seeAllLink="/peliculas"
                        getLink={(item) => `/watch/movie/${item.id}`}
                    />
                )}

                {/* Popular Series */}
                {(activeCategory === 'all' || activeCategory === 'series') && popularSeries.length > 0 && (
                    <ContentRow
                        title="Most Watched Shows"
                        items={popularSeries}
                        seeAllLink="/series"
                        getLink={(item: any) => `/watch/tv/${item.id}`}
                    />
                )}

                {/* Latest Episodes */}
                {(activeCategory === 'all' || activeCategory === 'anime') && latestAnime.length > 0 && (
                    <ContentRow
                        title="New Anime Episodes"
                        items={latestAnime}
                        seeAllLink="/anime"
                        getLink={(item: any) => `/watch/tv/${item.id}`}
                    />
                )}

                {/* Live Sports */}
                {(activeCategory === 'all' || activeCategory === 'sports') && liveSports.length > 0 && (
                    <ContentRow
                        title="Live Sports"
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

            {/* Footer - Compact */}
            <footer className="border-t border-white/5 bg-[#050507]">
                <div className="w-full px-[5%] py-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-3">
                            <NovaLogo className="w-8 h-8" />
                            <span className="font-display font-bold text-xl text-white">NOVA</span>
                        </div>
                        <div className="flex items-center gap-6 text-sm text-gray-400">
                            <Link to="/anime" className="hover:text-white transition-colors">Anime</Link>
                            <Link to="/peliculas" className="hover:text-white transition-colors">Movies</Link>
                            <Link to="/series" className="hover:text-white transition-colors">Series</Link>
                            <Link to="/deportes" className="hover:text-white transition-colors">Sports</Link>
                        </div>
                        <div className="flex items-center gap-4 text-gray-500 text-sm">
                            <a href="#" className="hover:text-white transition-colors">Privacy</a>
                            <a href="#" className="hover:text-white transition-colors">Terms</a>
                            <span>© 2024 NOVA</span>
                        </div>
                    </div>
                </div>
            </footer>
        </main>
    );
}
