import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    getPopularSeries,
    getTrendingSeries,
    getImageUrl,
    TMDBSeries,
    seriesGenres
} from '../services/api';
import PremiumLoader from '../components/PremiumLoader';

export default function Series() {
    const [series, setSeries] = useState<TMDBSeries[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);

    const categories = [
        { id: null, name: 'Todos' },
        { id: 18, name: 'Drama' },
        { id: 35, name: 'Comedia' },
        { id: 10765, name: 'Sci-Fi' },
        { id: 10759, name: 'Accion' },
        { id: 9648, name: 'Misterio' },
        { id: 80, name: 'Crimen' },
        { id: 16, name: 'Animacion' },
    ];

    useEffect(() => {
        const fetchSeries = async () => {
            setIsLoading(true);
            try {
                // Fetch trending and 2 full pages of popular series (60 series total)
                const [trending, pop1, pop2] = await Promise.all([
                    getTrendingSeries(),
                    getPopularSeries(1),
                    getPopularSeries(2)
                ]);
                // Combine and deduplicate
                const combined = [...trending, ...pop1, ...pop2]
                    .filter((show) => Boolean(show?.id) && Boolean(show?.name) && Boolean(show?.poster_path || show?.backdrop_path));
                const unique = combined.filter((show, index, self) =>
                    index === self.findIndex(s => s.id === show.id)
                );

                // Shuffle the vast library
                const shuffled = unique.sort(() => 0.5 - Math.random());
                setSeries(shuffled);
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
    const heroSeries = series.length > 0 ? (series.find((s) => s.backdrop_path || s.poster_path) || series[0]) : null;

    return (
        <main className="min-h-screen bg-[#030305]">
            {/* Cosmic Background Elements */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-violet-600/10 blur-[120px] rounded-full animate-pulse-slow" />
                <div className="absolute top-[20%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full animate-pulse-slow delay-700" />
            </div>

            {/* Hero Banner */}
            {series.length > 0 && heroSeries && (
                <section className="relative h-[88vh] min-h-[560px] overflow-hidden">
                    {/* Backdrop image */}
                    <div className="absolute inset-0">
                        <img
                            src={getImageUrl(heroSeries.backdrop_path || heroSeries.poster_path, 'original')}
                            className="w-full h-full object-cover object-top"
                            alt=""
                            style={{ filter: 'brightness(0.55) saturate(1.15)' }}
                            onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder-poster.svg'; }}
                        />
                    </div>

                    {/* Layered gradients */}
                    {/* Top — navbar blend */}
                    <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#030305] via-[#030305]/40 to-transparent" />
                    {/* Left — text readability */}
                    <div className="absolute inset-y-0 left-0 w-3/4 bg-gradient-to-r from-[#030305] via-[#030305]/70 to-transparent" />
                    {/* Bottom — page blend */}
                    <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-[#030305] via-[#030305]/80 to-transparent" />
                    {/* Vignette edges */}
                    <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 70% 50%, transparent 40%, rgba(3,3,5,0.6) 100%)' }} />

                    {/* Content */}
                    <div className="absolute inset-0 flex items-end pb-16 px-8 md:px-16">
                        <div className="max-w-xl">
                            {/* Badge */}
                            <div className="flex items-center gap-2 mb-4">
                                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/20 border border-violet-400/30 text-[11px] font-black uppercase tracking-widest text-violet-300">
                                    <i className="ri-fire-line" /> #1 en tendencia
                                </span>
                                {heroSeries.vote_average > 0 && (
                                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/40 border border-white/10 text-[11px] font-bold text-yellow-400">
                                        <i className="ri-star-fill text-[10px]" /> {heroSeries.vote_average.toFixed(1)}
                                    </span>
                                )}
                            </div>

                            {/* Title */}
                            <h1 className="text-5xl md:text-7xl font-black text-white leading-[0.9] tracking-tight mb-4 drop-shadow-2xl"
                                style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", textShadow: '0 4px 32px rgba(0,0,0,0.8)' }}>
                                {heroSeries.name}
                            </h1>

                            {/* Overview */}
                            <p className="text-white/65 text-sm md:text-base leading-relaxed line-clamp-2 mb-7 max-w-md">
                                {heroSeries.overview}
                            </p>

                            {/* CTAs */}
                            <div className="flex items-center gap-3">
                                <Link
                                    to={`/watch/tv/${heroSeries.id}`}
                                    className="flex items-center gap-2.5 px-7 py-3 bg-white text-black font-black text-sm rounded-xl hover:bg-white/90 active:scale-95 transition-all shadow-lg shadow-black/40"
                                >
                                    <i className="ri-play-fill text-lg" /> Ver ahora
                                </Link>
                                <Link
                                    to={`/series/${heroSeries.id}`}
                                    className="flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold text-sm rounded-xl backdrop-blur transition-all"
                                >
                                    <i className="ri-information-line" /> Más info
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            )}

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
                    <PremiumLoader className="min-h-[40vh]" />
                ) : (
                    /* Series Grid */
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {filteredSeries.map((show) => (
                            <Link
                                key={show.id}
                                to={`/watch/tv/${show.id}`}
                                className="group relative flex flex-col gap-3"
                                style={{ animationDelay: `${(filteredSeries.indexOf(show) % 12) * 50}ms` }}
                            >
                                <div className="aspect-[2/3] rounded-2xl overflow-hidden bg-gray-900 relative transition-all duration-500 group-hover:scale-[1.04] group-hover:-translate-y-1 group-hover:shadow-[0_8px_40px_rgba(99,102,241,0.3)] ring-1 ring-white/10 group-hover:ring-indigo-500/50">
                                    <img
                                        src={getImageUrl(show.poster_path)}
                                        alt={show.name}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        loading="lazy"
                                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder-poster.svg'; }}
                                    />

                                    {/* Hover Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5">
                                        <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                            <div className="flex items-center gap-2 mb-3">
                                                <span className="px-2 py-1 rounded-md bg-white/20 backdrop-blur text-[10px] font-bold text-white group-hover:bg-indigo-500/40 transition-colors">
                                                    FHD
                                                </span>
                                                <span className="flex items-center gap-1 text-amber-400 text-xs font-bold">
                                                    <i className="ri-star-fill"></i> {show.vote_average.toFixed(1)}
                                                </span>
                                            </div>
                                            <button className="w-full py-2.5 rounded-xl bg-white text-black font-bold text-sm hover:scale-105 active:scale-95 transition-transform shadow-lg">
                                                <i className="ri-play-fill mr-1"></i> Ver ahora
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
                        <p>No hay series para esta categoría</p>
                    </div>
                )}
            </div>
        </main>
    );
}
