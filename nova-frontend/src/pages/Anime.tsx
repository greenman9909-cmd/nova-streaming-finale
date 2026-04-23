import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    getTrendingAnime,
    getPopularAnime,
    getLatestAnimeEpisodes,
    getTopRatedAnime,
    getAnimeMovies,
    getWatchProviders,
    getImageUrl,
    TMDBMovie,
    TMDBSeries
} from '../services/api';
import PremiumLoader from '../components/PremiumLoader';

type AnimeItem = (TMDBMovie | TMDBSeries) & { media_type?: 'movie' | 'tv' };

export default function Anime() {
    const [animeList, setAnimeList] = useState<AnimeItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'Todo' | 'Peliculas' | 'Series'>('Todo');
    const availabilityCache = useRef<Map<string, boolean>>(new Map());

    const REGION_PRIORITY = [
        'ES', 'PT', 'FR', 'DE', 'IT', 'GB', 'IE', 'NL', 'BE', 'CH', 'AT',
        'SE', 'NO', 'FI', 'DK', 'PL', 'CZ', 'SK', 'HU', 'RO', 'BG', 'GR', 'HR',
        'SI', 'EE', 'LV', 'LT'
    ];

    const hasProviders = (result?: { flatrate?: any[]; free?: any[]; rent?: any[]; buy?: any[] }) => {
        if (!result) return false;
        return Boolean(
            (result.flatrate && result.flatrate.length > 0) ||
            (result.free && result.free.length > 0) ||
            (result.rent && result.rent.length > 0) ||
            (result.buy && result.buy.length > 0)
        );
    };

    const filterByAvailability = async (items: AnimeItem[]) => {
        if (items.length === 0) return items;
        const availability = new Array(items.length).fill(false);
        let index = 0;
        const poolSize = Math.min(6, items.length);

        const worker = async () => {
            while (true) {
                const currentIndex = index++;
                if (currentIndex >= items.length) return;
                const item = items[currentIndex];
                const mediaType = (item as any).media_type === 'movie' ? 'movie' : 'tv';
                const cacheKey = `${mediaType}-${item.id}`;

                if (availabilityCache.current.has(cacheKey)) {
                    availability[currentIndex] = availabilityCache.current.get(cacheKey) || false;
                    continue;
                }

                try {
                    const data = await getWatchProviders(mediaType, item.id);
                    const results = data?.results || {};
                    const region = REGION_PRIORITY.find((code) => hasProviders(results[code]));
                    const isAvailable = Boolean(region);
                    availability[currentIndex] = isAvailable;
                    availabilityCache.current.set(cacheKey, isAvailable);
                } catch {
                    availability[currentIndex] = false;
                    availabilityCache.current.set(cacheKey, false);
                }
            }
        };

        await Promise.all(Array.from({ length: poolSize }, () => worker()));
        return items.filter((_, i) => availability[i]);
    };

    useEffect(() => {
        const fetchAnime = async () => {
            setIsLoading(true);
            try {
                const [trending, popular, latest, topRated, movies] = await Promise.allSettled([
                    getTrendingAnime(),
                    getPopularAnime(),
                    getLatestAnimeEpisodes(),
                    getTopRatedAnime(),
                    getAnimeMovies()
                ]);

                const extract = (res: PromiseSettledResult<any[]>) =>
                    res.status === 'fulfilled' && Array.isArray(res.value) ? res.value : [];

                const all: AnimeItem[] = [
                    ...extract(trending),
                    ...extract(popular),
                    ...extract(latest),
                    ...extract(topRated),
                    ...extract(movies)
                ];

                const seen = new Set<number>();
                const unique = all.filter(item => {
                    if (seen.has(item.id)) return false;
                    seen.add(item.id);
                    return true;
                }).filter((item) =>
                    Boolean(item?.id) &&
                    Boolean((item as any).title || (item as any).name) &&
                    Boolean(item.poster_path || item.backdrop_path)
                );

                const sorted = unique.sort((a, b) => (b as any).popularity - (a as any).popularity);
                const available = await filterByAvailability(sorted);

                setAnimeList(available);
            } catch (error) {
                console.error('Error fetching anime:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAnime();
    }, []);

    const filteredAnime = activeTab === 'Todo'
        ? animeList
        : animeList.filter(item => (item as any).media_type === (activeTab === 'Peliculas' ? 'movie' : 'tv'));
    const heroAnime = animeList.length > 0 ? (animeList.find((a) => a.backdrop_path || a.poster_path) || animeList[0]) : null;

    const getWatchLink = (item: AnimeItem) =>
        (item as any).media_type === 'movie' ? `/watch/movie/${item.id}` : `/anime/watch/${item.id}`;

    const getDetailsLink = (item: AnimeItem) =>
        (item as any).media_type === 'movie' ? `/watch/movie/${item.id}` : `/anime/${item.id}`;

    return (
        <main className="min-h-screen bg-[#030305]">
            {/* Cosmic Background Elements */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-rose-600/10 blur-[120px] rounded-full animate-pulse-slow" />
                <div className="absolute top-[20%] left-[-10%] w-[40%] h-[40%] bg-violet-600/10 blur-[120px] rounded-full animate-pulse-slow delay-700" />
            </div>

            {/* Hero Banner */}
            {animeList.length > 0 && heroAnime && (
                <section className="relative h-[88vh] min-h-[560px] overflow-hidden">
                    <div className="absolute inset-0">
                        <img
                            src={getImageUrl(heroAnime.backdrop_path || heroAnime.poster_path, 'original')}
                            className="w-full h-full object-cover object-top"
                            alt=""
                            style={{ filter: 'brightness(0.55) saturate(1.2)' }}
                            onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder-poster.svg'; }}
                        />
                    </div>
                    <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#030305] via-[#030305]/40 to-transparent" />
                    <div className="absolute inset-y-0 left-0 w-3/4 bg-gradient-to-r from-[#030305] via-[#030305]/70 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-[#030305] via-[#030305]/80 to-transparent" />
                    <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 70% 50%, transparent 40%, rgba(3,3,5,0.6) 100%)' }} />

                    <div className="absolute inset-0 flex items-end pb-16 px-8 md:px-16">
                        <div className="max-w-xl">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/30 text-[11px] font-black uppercase tracking-widest text-rose-300">
                                    <i className="ri-fire-line" /> #1 Trending Anime
                                </span>
                                {heroAnime.vote_average > 0 && (
                                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/40 border border-white/10 text-[11px] font-bold text-yellow-400">
                                        <i className="ri-star-fill text-[10px]" /> {heroAnime.vote_average.toFixed(1)}
                                    </span>
                                )}
                            </div>
                            <h1 className="text-5xl md:text-7xl font-black text-white leading-[0.9] tracking-tight mb-4 drop-shadow-2xl"
                                style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", textShadow: '0 4px 32px rgba(0,0,0,0.8)' }}>
                                {'name' in heroAnime ? heroAnime.name : (heroAnime as any).title}
                            </h1>
                            <p className="text-white/65 text-sm md:text-base leading-relaxed line-clamp-2 mb-7 max-w-md">
                                {heroAnime.overview}
                            </p>
                            <div className="flex items-center gap-3">
                                <Link
                                    to={getWatchLink(heroAnime)}
                                    className="flex items-center gap-2.5 px-7 py-3 bg-white text-black font-black text-sm rounded-xl hover:bg-white/90 active:scale-95 transition-all shadow-lg shadow-black/40"
                                >
                                    <i className="ri-play-fill text-lg" /> Ver ahora
                                </Link>
                                <Link
                                    to={getDetailsLink(heroAnime)}
                                    className="flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold text-sm rounded-xl backdrop-blur transition-all"
                                >
                                    <i className="ri-information-line" /> Detalles
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Content Area */}
            <div className="relative z-10 w-full px-6 md:px-12 pb-20">
                {/* Tab Filter */}
                <div className="mb-6 -mx-6 md:-mx-12 px-6 md:px-12 py-3 bg-transparent border-y border-white/5">
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                        {['Todo', 'Peliculas', 'Series'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-300 ${activeTab === tab
                                    ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)] scale-105'
                                    : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}

                        <span className="ml-auto flex items-center text-xs text-gray-500 font-medium">
                            {filteredAnime.length} titles
                        </span>
                    </div>
                </div>

                {isLoading ? (
                    <PremiumLoader className="min-h-[40vh]" />
                ) : filteredAnime.length === 0 ? (
                    <div className="flex items-center justify-center h-64 text-sm text-gray-400">
                        No hay títulos de anime disponibles para esta región.
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {filteredAnime.map((item) => (
                            <Link
                                key={`${item.id}-${(item as any).media_type}`}
                                to={getWatchLink(item)}
                                className="group relative flex flex-col gap-3"
                            >
                                <div className="aspect-[2/3] rounded-2xl overflow-hidden bg-gray-900 relative shadow-2xl transition-all duration-500 group-hover:scale-[1.02] group-hover:shadow-[0_0_30px_rgba(244,63,94,0.3)] ring-1 ring-white/10 group-hover:ring-rose-500/50">
                                    <img
                                        src={getImageUrl(item.poster_path)}
                                        alt={(item as any).title || (item as any).name}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        loading="lazy"
                                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder-poster.svg'; }}
                                    />

                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5">
                                        <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                            <div className="flex items-center gap-2 mb-3">
                                                <span className="px-2 py-1 rounded-md bg-white/20 backdrop-blur text-[10px] font-bold text-white uppercase">
                                                    {(item as any).media_type === 'movie' ? 'Pelicula' : 'Serie'}
                                                </span>
                                                <span className="flex items-center gap-1 text-amber-400 text-xs font-bold">
                                                    <i className="ri-star-fill"></i> {item.vote_average.toFixed(1)}
                                                </span>
                                            </div>
                                            <button className="w-full py-2.5 rounded-xl bg-white text-black font-bold text-sm hover:scale-105 transition-transform shadow-lg">
                                                <i className="ri-play-fill mr-1"></i> Ver ahora
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="px-1">
                                    <h3 className="font-bold text-white text-base line-clamp-1 group-hover:text-rose-400 transition-colors">
                                        {(item as any).title || (item as any).name}
                                    </h3>
                                    <div className="flex items-center gap-2 text-xs text-gray-500 font-medium mt-1">
                                        <span>{((item as any).release_date || (item as any).first_air_date)?.split('-')[0] || 'N/A'}</span>
                                        <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                                        <span>Anime</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
