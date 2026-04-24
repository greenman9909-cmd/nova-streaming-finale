import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    getNowPlayingMovies,
    getUpcomingMovies,
    getAiringTodaySeries,
    getTrendingMovies,
    getTrendingSeries,
    getImageUrl,
    TMDBMovie,
    TMDBSeries,
} from '../services/api';
import PremiumLoader from '../components/PremiumLoader';

type Item = {
    id: number;
    title: string;
    poster: string;
    backdrop: string;
    rating: number;
    date: string;
    type: 'movie' | 'tv';
    overview: string;
    genres: number[];
};

type Tab = 'all' | 'movies' | 'series' | 'upcoming';

function toItem(raw: any, type: 'movie' | 'tv'): Item {
    return {
        id: raw.id,
        title: raw.title || raw.name || '',
        poster: getImageUrl(raw.poster_path),
        backdrop: raw.backdrop_path ? getImageUrl(raw.backdrop_path, 'original') : getImageUrl(raw.poster_path),
        rating: raw.vote_average ?? 0,
        date: raw.release_date || raw.first_air_date || '',
        type,
        overview: raw.overview || '',
        genres: raw.genre_ids || [],
    };
}

function formatDate(dateStr: string) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}

function daysUntil(dateStr: string) {
    if (!dateStr) return null;
    const days = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
    return days > 0 ? days : null;
}

/* ─── Individual card — matches Series/Peliculas card exactly ─────── */
function NovedadCard({ item }: { item: Item }) {
    const [imgErr, setImgErr] = useState(false);
    if (imgErr) return null;

    const days = daysUntil(item.date);
    const link = `/watch/${item.type}/${item.id}`;

    return (
        <Link
            to={link}
            className="group relative flex flex-col gap-3"
        >
            <div className="aspect-[2/3] rounded-2xl overflow-hidden bg-gray-900 relative transition-all duration-500 group-hover:scale-[1.04] group-hover:-translate-y-1 group-hover:shadow-[0_8px_40px_rgba(139,92,246,0.3)] ring-1 ring-white/10 group-hover:ring-violet-500/50">
                <img
                    src={item.poster}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                    onError={() => setImgErr(true)}
                />

                {/* Rating */}
                {item.rating > 0 && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-black/70 backdrop-blur text-[10px] font-bold text-yellow-400">
                        <i className="ri-star-fill text-[9px]" />{item.rating.toFixed(1)}
                    </div>
                )}

                {/* Countdown for upcoming */}
                {days && (
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-violet-600/90 text-white text-[9px] font-bold">
                        {days}d
                    </div>
                )}

                {/* Type dot */}
                <div className={`absolute bottom-2 left-2 w-2 h-2 rounded-full ring-1 ring-black/50 ${item.type === 'movie' ? 'bg-blue-400' : 'bg-emerald-400'}`} />

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
                    <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                        <span className="flex items-center gap-1 text-amber-400 text-xs font-bold mb-2">
                            <i className="ri-star-fill" /> {item.rating.toFixed(1)}
                        </span>
                        <button className="w-full py-2.5 rounded-xl bg-white text-black font-bold text-sm hover:scale-105 transition-transform shadow-lg">
                            <i className="ri-play-fill mr-1" /> Ver ahora
                        </button>
                    </div>
                </div>
            </div>

            <div className="px-1">
                <h3 className="font-bold text-white text-sm line-clamp-1 group-hover:text-violet-400 transition-colors">
                    {item.title}
                </h3>
                <p className="text-gray-500 text-xs mt-0.5">{formatDate(item.date)}</p>
            </div>
        </Link>
    );
}

/* ─── Main page ─────────────────────────────────────────────────────── */
export default function Novedades() {
    const [nowPlaying, setNowPlaying]         = useState<Item[]>([]);
    const [upcoming, setUpcoming]             = useState<Item[]>([]);
    const [airingToday, setAiringToday]       = useState<Item[]>([]);
    const [trendingMovies, setTrendingMovies] = useState<Item[]>([]);
    const [trendingSeries, setTrendingSeries] = useState<Item[]>([]);
    const [activeTab, setActiveTab]           = useState<Tab>('all');
    const [loading, setLoading]               = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const [np, up, at, tm, ts] = await Promise.all([
                    getNowPlayingMovies(),
                    getUpcomingMovies(),
                    getAiringTodaySeries(),
                    getTrendingMovies(),
                    getTrendingSeries(),
                ]);
                setNowPlaying((np as TMDBMovie[]).map(m => toItem(m, 'movie')).slice(0, 20));
                setUpcoming((up as TMDBMovie[]).map(m => toItem(m, 'movie')).slice(0, 20));
                setAiringToday((at as TMDBSeries[]).map(s => toItem(s, 'tv')).slice(0, 20));
                setTrendingMovies((tm as TMDBMovie[]).map(m => toItem(m, 'movie')).slice(0, 20));
                setTrendingSeries((ts as TMDBSeries[]).map(s => toItem(s, 'tv')).slice(0, 20));
            } catch { /* silent */ } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    if (loading) return <PremiumLoader />;

    /* pick hero: first item with a real backdrop */
    const heroItem = [...nowPlaying, ...airingToday, ...trendingMovies].find(i => i.backdrop) || nowPlaying[0] || trendingMovies[0];

    const tabs: { id: Tab; label: string; icon: string }[] = [
        { id: 'all',      label: 'Todo',        icon: 'ri-apps-2-line' },
        { id: 'movies',   label: 'Películas',   icon: 'ri-film-line' },
        { id: 'series',   label: 'Series',      icon: 'ri-tv-line' },
        { id: 'upcoming', label: 'Próximamente',icon: 'ri-calendar-event-line' },
    ];

    /* which grid to show per tab */
    const sections: { label: string; icon: string; accent: string; items: Item[] }[] = [];

    if (activeTab === 'all' || activeTab === 'movies') {
        if (nowPlaying.length)    sections.push({ label: 'En cartelera ahora',    icon: 'ri-film-fill',      accent: 'text-blue-400',    items: nowPlaying });
        if (trendingMovies.length) sections.push({ label: 'Películas en tendencia', icon: 'ri-bar-chart-fill', accent: 'text-orange-400',  items: trendingMovies });
    }
    if (activeTab === 'all' || activeTab === 'series') {
        if (airingToday.length)   sections.push({ label: 'Series en emisión hoy', icon: 'ri-tv-2-fill',      accent: 'text-emerald-400', items: airingToday });
        if (trendingSeries.length) sections.push({ label: 'Series en tendencia',  icon: 'ri-trophy-fill',    accent: 'text-fuchsia-400', items: trendingSeries });
    }
    if (activeTab === 'all' || activeTab === 'upcoming') {
        if (upcoming.length)      sections.push({ label: 'Próximos estrenos',     icon: 'ri-calendar-event-fill', accent: 'text-violet-400', items: upcoming });
    }

    return (
        <main className="min-h-screen bg-[#030305]">

            {/* ── fixed cosmic glow (same as Series/Anime) ── */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-violet-600/10 blur-[120px] rounded-full animate-pulse-slow" />
                <div className="absolute top-[20%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full animate-pulse-slow delay-700" />
            </div>

            {/* ── Hero Banner ── */}
            {heroItem && (
                <section className="relative h-[88vh] min-h-[560px] overflow-hidden">
                    <div className="absolute inset-0">
                        <img
                            src={heroItem.backdrop}
                            alt=""
                            className="w-full h-full object-cover object-top"
                            style={{ filter: 'brightness(0.5) saturate(1.1)' }}
                        />
                    </div>

                    {/* gradient layers — identical to Series page */}
                    <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#030305] via-[#030305]/40 to-transparent" />
                    <div className="absolute inset-y-0 left-0 w-3/4 bg-gradient-to-r from-[#030305] via-[#030305]/70 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-[#030305] via-[#030305]/80 to-transparent" />
                    <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 70% 50%, transparent 40%, rgba(3,3,5,0.6) 100%)' }} />

                    {/* content */}
                    <div className="absolute inset-0 flex items-end pb-16 px-8 md:px-16">
                        <div className="max-w-xl">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/20 border border-violet-400/30 text-[11px] font-black uppercase tracking-widest text-violet-300">
                                    <i className="ri-fire-line" /> Novedades
                                </span>
                                <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-bold ${heroItem.type === 'movie' ? 'bg-blue-500/20 border-blue-400/30 text-blue-300' : 'bg-emerald-500/20 border-emerald-400/30 text-emerald-300'}`}>
                                    {heroItem.type === 'movie' ? 'Película' : 'Serie'}
                                </span>
                                {heroItem.rating > 0 && (
                                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/40 border border-white/10 text-[11px] font-bold text-yellow-400">
                                        <i className="ri-star-fill text-[10px]" /> {heroItem.rating.toFixed(1)}
                                    </span>
                                )}
                            </div>

                            <h1
                                className="text-5xl md:text-7xl font-black text-white leading-[0.9] tracking-tight mb-4 drop-shadow-2xl"
                                style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", textShadow: '0 4px 32px rgba(0,0,0,0.8)' }}
                            >
                                {heroItem.title}
                            </h1>

                            <p className="text-white/65 text-sm md:text-base leading-relaxed line-clamp-2 mb-6 max-w-md">
                                {heroItem.overview}
                            </p>

                            <div className="flex items-center gap-3">
                                <Link
                                    to={`/watch/${heroItem.type}/${heroItem.id}`}
                                    className="flex items-center gap-2.5 px-7 py-3 bg-white text-black font-black text-sm rounded-xl hover:bg-white/90 active:scale-95 transition-all shadow-lg shadow-black/40"
                                >
                                    <i className="ri-play-fill text-lg" /> Ver ahora
                                </Link>
                                <p className="text-white/40 text-sm">{formatDate(heroItem.date)}</p>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* ── Content Area — full width, same as Series/Anime ── */}
            <div className="relative z-10 w-full px-6 md:px-12 pb-20">

                {/* Tab filter bar */}
                <div className="mb-8 -mx-6 md:-mx-12 px-6 md:px-12 py-3 bg-transparent border-y border-white/5">
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-300 ${
                                    activeTab === tab.id
                                        ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)] scale-105'
                                        : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                                }`}
                            >
                                <i className={`${tab.icon} text-sm`} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Sections */}
                {sections.map(sec => (
                    <section key={sec.label} className="mb-14">
                        {/* Section header */}
                        <div className="flex items-center gap-3 mb-6">
                            <i className={`${sec.icon} text-lg ${sec.accent}`} />
                            <h2 className="text-white font-black text-xl tracking-tight">{sec.label}</h2>
                            <span className="text-white/25 text-sm">{sec.items.length}</span>
                            <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent ml-2" />
                        </div>

                        {/* Grid — identical structure to Series page */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4">
                            {sec.items.map(item => (
                                <NovedadCard key={item.id} item={item} />
                            ))}
                        </div>
                    </section>
                ))}

                {/* Empty state */}
                {sections.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                        <i className="ri-fire-line text-5xl mb-4 opacity-30" />
                        <p className="text-sm">No hay contenido disponible</p>
                    </div>
                )}
            </div>
        </main>
    );
}
