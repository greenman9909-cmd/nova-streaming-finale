import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    getPopularSeries,
    getTrendingSeries,
    getImageUrl,
    TMDBSeries,
    seriesGenres
} from '../services/api';

export default function Series() {
    const [series, setSeries] = useState<TMDBSeries[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

    const categories = [
        { id: null, name: 'Todos' },
        { id: 18, name: 'Drama' },
        { id: 35, name: 'Comedia' },
        { id: 10765, name: 'Sci-Fi' },
        { id: 10759, name: 'Acción' },
        { id: 9648, name: 'Misterio' },
        { id: 80, name: 'Crimen' },
        { id: 16, name: 'Animación' },
    ];

    useEffect(() => {
        const fetchSeries = async () => {
            setIsLoading(true);
            try {
                const [trending, popular] = await Promise.all([
                    getTrendingSeries(),
                    getPopularSeries()
                ]);
                // Combine and deduplicate
                const combined = [...trending, ...popular];
                const unique = combined.filter((show, index, self) =>
                    index === self.findIndex(s => s.id === show.id)
                );
                setSeries(unique);
            } catch (error) {
                console.error('Error fetching series:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSeries();
    }, []);

    // Filter series by category
    const filteredSeries = selectedCategory
        ? series.filter(show => show.genre_ids.includes(selectedCategory))
        : series;

    return (
        <main className="min-h-screen bg-[#030305] pt-20">
            {/* Cosmic Background Elements */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-violet-600/10 blur-[120px] rounded-full animate-pulse-slow" />
                <div className="absolute top-[20%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full animate-pulse-slow delay-700" />
            </div>

            {/* Hero Banner - Compact & Premium */}
            <section className="relative h-[40vh] min-h-[350px] overflow-hidden flex items-end pb-8">
                <div className="absolute inset-0 bg-[url('https://image.tmdb.org/t/p/original/uKvVjHNqB5VmOrdxqAt2F7J78ED.jpg')] bg-cover bg-center opacity-40"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#030305] via-[#030305]/60 to-transparent"></div>

                <div className="relative z-10 w-full px-6 md:px-12">
                    <span className="inline-block px-3 py-1 mb-3 rounded-lg bg-white/5 backdrop-blur border border-white/10 text-[10px] font-bold text-indigo-300 uppercase tracking-widest">
                        TV Shows & Series
                    </span>
                    <h1 className="font-display font-black text-4xl md:text-6xl text-white mb-3 leading-none tracking-tight">
                        Series
                    </h1>
                    <p className="text-gray-400 max-w-xl text-base font-medium line-clamp-2">
                        Binge-worthy stories from around the globe. Premium quality, zero interruptions.
                    </p>
                </div>
            </section>

            {/* Content Area */}
            <div className="relative z-10 w-full px-6 md:px-12 pb-20">
                {/* Category Filter - Glass Bar */}
                <div className="mb-6 -mx-6 md:-mx-12 px-6 md:px-12 py-3 bg-transparent border-y border-white/5">
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                        {categories.map((cat) => (
                            <button
                                key={cat.id ?? 'all'}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-300 ${selectedCategory === cat.id
                                    ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)] scale-105'
                                    : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                                    }`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Loading State */}
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                    </div>
                ) : (
                    /* Series Grid */
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {filteredSeries.map((show) => (
                            <Link
                                key={show.id}
                                to={`/watch/tv/${show.id}`}
                                className="group relative flex flex-col gap-3"
                            >
                                <div className="aspect-[2/3] rounded-2xl overflow-hidden bg-gray-900 relative shadow-2xl transition-all duration-500 group-hover:scale-[1.02] group-hover:shadow-[0_0_30px_rgba(99,102,241,0.3)] ring-1 ring-white/10 group-hover:ring-indigo-500/50">
                                    <img
                                        src={getImageUrl(show.poster_path)}
                                        alt={show.name}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        loading="lazy"
                                    />

                                    {/* Hover Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5">
                                        <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                            <div className="flex items-center gap-2 mb-3">
                                                <span className="px-2 py-1 rounded-md bg-white/20 backdrop-blur text-[10px] font-bold text-white">
                                                    4K HDR
                                                </span>
                                                <span className="flex items-center gap-1 text-amber-400 text-xs font-bold">
                                                    <i className="ri-star-fill"></i> {show.vote_average.toFixed(1)}
                                                </span>
                                            </div>
                                            <button className="w-full py-2.5 rounded-xl bg-white text-black font-bold text-sm hover:scale-105 transition-transform shadow-lg">
                                                <i className="ri-play-fill mr-1"></i> Watch Now
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="px-1">
                                    <h3 className="font-bold text-white text-base line-clamp-1 group-hover:text-indigo-400 transition-colors">
                                        {show.name}
                                    </h3>
                                    <div className="flex items-center gap-2 text-xs text-gray-500 font-medium mt-1">
                                        <span>{show.first_air_date?.split('-')[0] || 'N/A'}</span>
                                        <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                                        <span>{seriesGenres[show.genre_ids[0]] || 'TV'}</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && filteredSeries.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                        <i className="ri-tv-line text-5xl mb-4 opacity-50"></i>
                        <p>No series found for this category</p>
                    </div>
                )}
            </div>
        </main>
    );
}
