import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    getTrendingAnime,
    getPopularAnime,
    getImageUrl,
    TMDBMovie,
    TMDBSeries
} from '../services/api';

export default function Anime() {
    const [animeList, setAnimeList] = useState<(TMDBMovie | TMDBSeries)[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'All' | 'Movies' | 'Series'>('All');

    useEffect(() => {
        const fetchAnime = async () => {
            setIsLoading(true);
            try {
                const [movies, series] = await Promise.all([
                    getTrendingAnime(),
                    getPopularAnime()
                ]);

                // Add media_type for routing
                const moviesWithType = movies.map(m => ({ ...m, media_type: 'movie' as const }));
                const seriesWithType = series.map(s => ({ ...s, media_type: 'tv' as const }));

                const combined = [...moviesWithType, ...seriesWithType];
                // Sort by popularity roughly by interleaving or using vote/popularity
                const sorted = combined.sort((a, b) => (b as any).popularity - (a as any).popularity);

                setAnimeList(sorted);
            } catch (error) {
                console.error('Error fetching anime:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAnime();
    }, []);

    const filteredAnime = activeTab === 'All'
        ? animeList
        : animeList.filter(item => (item as any).media_type === (activeTab === 'Movies' ? 'movie' : 'tv'));

    return (
        <main className="min-h-screen bg-[#030305] pt-20">
            {/* Cosmic Background Elements */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-rose-600/10 blur-[120px] rounded-full animate-pulse-slow" />
                <div className="absolute top-[20%] left-[-10%] w-[40%] h-[40%] bg-violet-600/10 blur-[120px] rounded-full animate-pulse-slow delay-700" />
            </div>

            {/* Hero Banner */}
            {/* Hero Banner */}
            {animeList.length > 0 && (
                <section className="relative h-[50vh] min-h-[400px] overflow-hidden flex items-end pb-12 group">
                    <div className="absolute inset-0">
                        <img
                            src={getImageUrl(animeList[0].backdrop_path, 'original')}
                            className="w-full h-full object-cover object-top transition-transform duration-1000 group-hover:scale-105"
                            alt=""
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#030305] via-[#030305]/60 to-transparent"></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-[#030305] via-transparent to-transparent"></div>
                    </div>

                    <div className="relative z-10 w-full px-6 md:px-12">
                        <span className="inline-block px-3 py-1 mb-3 rounded-lg bg-rose-500/20 backdrop-blur border border-rose-500/30 text-[10px] font-bold text-rose-300 uppercase tracking-widest shadow-[0_0_15px_rgba(244,63,94,0.2)]">
                            #1 Trending Anime
                        </span>
                        <h1 className="font-display font-black text-4xl md:text-7xl text-white mb-4 leading-none tracking-tight drop-shadow-2xl">
                            {(animeList[0] as any).name || (animeList[0] as any).title}
                        </h1>
                        <p className="text-gray-200 max-w-xl text-base font-medium line-clamp-2 mb-6 drop-shadow-md">
                            {animeList[0].overview}
                        </p>

                        <div className="flex gap-4">
                            <Link
                                to={`/anime/watch/${animeList[0].id}`}
                                className="px-8 py-3 bg-white text-black font-bold rounded-xl hover:scale-105 transition-transform flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                            >
                                <i className="ri-play-fill text-xl"></i>
                                Watch Now
                            </Link>
                            <Link
                                to={`/anime/${animeList[0].id}`}
                                className="px-8 py-3 bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold rounded-xl hover:bg-white/20 transition-all flex items-center gap-2"
                            >
                                <i className="ri-information-line text-xl"></i>
                                Details
                            </Link>
                        </div>
                    </div>
                </section>
            )}

            {/* Content Area */}
            <div className="relative z-10 w-full px-6 md:px-12 pb-20">
                {/* Tab Filter */}
                <div className="mb-6 -mx-6 md:-mx-12 px-6 md:px-12 py-3 bg-transparent border-y border-white/5">
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                        {['All', 'Movies', 'Series'].map((tab) => (
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
                    </div>
                </div>

                {/* Loading State */}
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="w-12 h-12 border-4 border-rose-500/30 border-t-rose-500 rounded-full animate-spin"></div>
                    </div>
                ) : (
                    /* Anime Grid */
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {filteredAnime.map((item) => (
                            <Link
                                key={item.id}
                                to={`/anime/watch/${item.id}`}
                                className="group relative flex flex-col gap-3"
                            >
                                <div className="aspect-[2/3] rounded-2xl overflow-hidden bg-gray-900 relative shadow-2xl transition-all duration-500 group-hover:scale-[1.02] group-hover:shadow-[0_0_30px_rgba(244,63,94,0.3)] ring-1 ring-white/10 group-hover:ring-rose-500/50">
                                    <img
                                        src={getImageUrl(item.poster_path)}
                                        alt={(item as any).title || (item as any).name}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        loading="lazy"
                                    />

                                    {/* Hover Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5">
                                        <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                            <div className="flex items-center gap-2 mb-3">
                                                <span className="px-2 py-1 rounded-md bg-white/20 backdrop-blur text-[10px] font-bold text-white uppercase">
                                                    {(item as any).media_type === 'movie' ? 'Movie' : 'Series'}
                                                </span>
                                                <span className="flex items-center gap-1 text-amber-400 text-xs font-bold">
                                                    <i className="ri-star-fill"></i> {item.vote_average.toFixed(1)}
                                                </span>
                                            </div>
                                            <button className="w-full py-2.5 rounded-xl bg-white text-black font-bold text-sm hover:scale-105 transition-transform shadow-lg">
                                                <i className="ri-play-fill mr-1"></i> Watch Now
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
