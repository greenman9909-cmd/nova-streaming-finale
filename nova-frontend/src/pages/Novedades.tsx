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
    image: string;
    backdrop?: string;
    rating: number;
    date: string;
    type: 'movie' | 'tv';
    overview?: string;
};

type Tab = 'all' | 'movies' | 'series' | 'upcoming';

function toItem(raw: any, type: 'movie' | 'tv'): Item {
    return {
        id: raw.id,
        title: raw.title || raw.name || '',
        image: getImageUrl(raw.poster_path),
        backdrop: raw.backdrop_path ? getImageUrl(raw.backdrop_path, 'w780') : undefined,
        rating: raw.vote_average ?? 0,
        date: raw.release_date || raw.first_air_date || '',
        type,
        overview: raw.overview,
    };
}

function formatDate(dateStr: string) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}

function daysUntil(dateStr: string) {
    if (!dateStr) return null;
    const diff = new Date(dateStr).getTime() - Date.now();
    const days = Math.ceil(diff / 86400000);
    return days > 0 ? days : null;
}

/* ─── Hero spotlight card (wide landscape) ─────────────────────────── */
function SpotlightCard({ item }: { item: Item }) {
    const [imgErr, setImgErr] = useState(false);
    if (imgErr && !item.backdrop) return null;
    const link = `/watch/${item.type}/${item.id}`;
    const days = daysUntil(item.date);

    return (
        <Link
            to={link}
            className="group relative flex-shrink-0 w-[320px] md:w-[380px] h-[200px] md:h-[220px] rounded-2xl overflow-hidden cursor-pointer"
        >
            {/* backdrop */}
            <img
                src={item.backdrop || item.image}
                alt={item.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
                onError={() => setImgErr(true)}
            />

            {/* gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />

            {/* play button */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center">
                    <i className="ri-play-fill text-white text-2xl ml-1" />
                </div>
            </div>

            {/* bottom info */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="flex items-center gap-2 mb-1.5">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${item.type === 'movie' ? 'bg-blue-500/80 text-white' : 'bg-emerald-500/80 text-white'}`}>
                        {item.type === 'movie' ? 'Película' : 'Serie'}
                    </span>
                    {item.rating > 0 && (
                        <span className="flex items-center gap-1 text-yellow-400 text-[11px] font-bold">
                            <i className="ri-star-fill text-[10px]" />{item.rating.toFixed(1)}
                        </span>
                    )}
                    {days && (
                        <span className="ml-auto px-2 py-0.5 rounded-full bg-nova-accent/80 text-white text-[10px] font-bold">
                            En {days}d
                        </span>
                    )}
                </div>
                <p className="text-white font-bold text-sm leading-tight line-clamp-1 drop-shadow">{item.title}</p>
                <p className="text-white/50 text-[11px] mt-0.5">{formatDate(item.date)}</p>
            </div>

            {/* border glow on hover */}
            <div className="absolute inset-0 ring-1 ring-white/10 group-hover:ring-nova-accent/40 rounded-2xl transition-all duration-300 pointer-events-none" />
        </Link>
    );
}

/* ─── Portrait poster card ──────────────────────────────────────────── */
function PosterCard({ item }: { item: Item }) {
    const [imgErr, setImgErr] = useState(false);
    if (imgErr) return null;
    const link = `/watch/${item.type}/${item.id}`;
    const days = daysUntil(item.date);

    return (
        <Link to={link} className="group flex-shrink-0 w-[130px] md:w-[148px]">
            <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-[#0f0f13] mb-2.5 ring-1 ring-white/5 group-hover:ring-nova-accent/30 transition-all duration-300 group-hover:shadow-[0_8px_30px_rgba(139,92,246,0.2)]">
                <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                    onError={() => setImgErr(true)}
                />

                {/* overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-3">
                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                        <i className="ri-play-fill text-white text-lg ml-0.5" />
                    </div>
                </div>

                {/* rating badge */}
                {item.rating > 0 && (
                    <div className="absolute top-2 right-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg bg-black/70 backdrop-blur text-[10px] font-bold text-yellow-400">
                        <i className="ri-star-fill text-[8px]" />{item.rating.toFixed(1)}
                    </div>
                )}

                {/* countdown badge */}
                {days && (
                    <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-lg bg-nova-accent/90 text-white text-[9px] font-bold">
                        {days}d
                    </div>
                )}

                {/* type dot */}
                <div className={`absolute bottom-2 left-2 w-1.5 h-1.5 rounded-full ${item.type === 'movie' ? 'bg-blue-400' : 'bg-emerald-400'}`} />
            </div>
            <p className="text-white text-[12px] font-semibold leading-tight line-clamp-2 group-hover:text-nova-accent-bright transition-colors">{item.title}</p>
            <p className="text-white/40 text-[10px] mt-1">{formatDate(item.date)}</p>
        </Link>
    );
}

/* ─── Section wrapper with horizontal scroll ────────────────────────── */
function Section({ title, icon, color, items, variant = 'poster' }: {
    title: string;
    icon: string;
    color: string;
    items: Item[];
    variant?: 'poster' | 'spotlight';
}) {
    if (items.length === 0) return null;

    return (
        <section className="mb-14">
            {/* section header */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
                        <i className={`${icon} text-base`} />
                    </div>
                    <h2 className="text-white font-black text-lg tracking-tight">{title}</h2>
                    <span className="text-white/25 text-sm font-medium">{items.length}</span>
                </div>
                <div className="h-px flex-1 mx-5 bg-gradient-to-r from-white/10 to-transparent" />
            </div>

            {/* scrollable row */}
            <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide -mx-1 px-1">
                {variant === 'spotlight'
                    ? items.map(item => <SpotlightCard key={item.id} item={item} />)
                    : items.map(item => <PosterCard key={item.id} item={item} />)
                }
            </div>
        </section>
    );
}

/* ─── Main page ─────────────────────────────────────────────────────── */
export default function Novedades() {
    const [nowPlaying, setNowPlaying]     = useState<Item[]>([]);
    const [upcoming, setUpcoming]         = useState<Item[]>([]);
    const [airingToday, setAiringToday]   = useState<Item[]>([]);
    const [trendingMovies, setTrendingMovies] = useState<Item[]>([]);
    const [trendingSeries, setTrendingSeries] = useState<Item[]>([]);
    const [activeTab, setActiveTab]       = useState<Tab>('all');
    const [loading, setLoading]           = useState(true);

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

    const tabs: { id: Tab; label: string; icon: string }[] = [
        { id: 'all',      label: 'Todo',           icon: 'ri-apps-2-line' },
        { id: 'movies',   label: 'Películas',       icon: 'ri-film-line' },
        { id: 'series',   label: 'Series',          icon: 'ri-tv-line' },
        { id: 'upcoming', label: 'Próximamente',    icon: 'ri-calendar-event-line' },
    ];

    /* top featured strip — mix of now-playing + airing */
    const featured = [
        ...nowPlaying.filter(i => i.backdrop).slice(0, 4),
        ...airingToday.filter(i => i.backdrop).slice(0, 4),
    ].slice(0, 8);

    return (
        <main className="min-h-screen bg-nova-bg pt-20 pb-20 overflow-x-hidden">

            {/* ── ambient glow ── */}
            <div className="pointer-events-none fixed inset-0 z-0">
                <div className="absolute top-0 left-1/4 w-[600px] h-[300px] rounded-full bg-nova-accent/5 blur-[120px]" />
                <div className="absolute top-20 right-1/4 w-[400px] h-[200px] rounded-full bg-fuchsia-500/4 blur-[100px]" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 lg:px-8">

                {/* ── page header ── */}
                <div className="mb-10">
                    <div className="flex items-end gap-4 mb-6">
                        <div className="relative">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-nova-accent/30 to-fuchsia-500/20 border border-nova-accent/20 flex items-center justify-center shadow-[0_0_30px_rgba(139,92,246,0.2)]">
                                <i className="ri-fire-fill text-nova-accent text-2xl" />
                            </div>
                            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-nova-accent animate-ping opacity-60" />
                            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-nova-accent" />
                        </div>
                        <div>
                            <p className="text-nova-accent text-xs font-bold uppercase tracking-[0.2em] mb-1">Actualizado hoy</p>
                            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-none">Novedades</h1>
                        </div>
                    </div>
                    <p className="text-white/40 text-sm max-w-lg">Lo más nuevo en cines, series en emisión y los próximos estrenos que no te puedes perder.</p>
                </div>

                {/* ── tabs ── */}
                <div className="flex items-center gap-2 mb-10 overflow-x-auto scrollbar-hide pb-1">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                                activeTab === tab.id
                                    ? 'bg-nova-accent text-white shadow-[0_0_20px_rgba(139,92,246,0.4)]'
                                    : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white border border-white/10'
                            }`}
                        >
                            <i className={`${tab.icon} text-base`} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* ── featured spotlight row (all / movies / series) ── */}
                {(activeTab === 'all' || activeTab === 'movies' || activeTab === 'series') && featured.length > 0 && (
                    <div className="mb-14">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/20">
                                <i className="ri-sparkling-2-fill text-yellow-400 text-base" />
                            </div>
                            <h2 className="text-white font-black text-lg tracking-tight">Destacados de hoy</h2>
                            <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                        </div>
                        <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide -mx-1 px-1">
                            {featured
                                .filter(i => activeTab === 'all' || (activeTab === 'movies' && i.type === 'movie') || (activeTab === 'series' && i.type === 'tv'))
                                .map(item => <SpotlightCard key={`feat-${item.id}`} item={item} />)
                            }
                        </div>
                    </div>
                )}

                {/* ── conditional sections by tab ── */}
                {(activeTab === 'all' || activeTab === 'movies') && (
                    <Section
                        title="En cartelera ahora"
                        icon="ri-film-fill"
                        color="bg-blue-500/15 text-blue-400 border border-blue-500/20"
                        items={nowPlaying}
                    />
                )}

                {(activeTab === 'all' || activeTab === 'series') && (
                    <Section
                        title="Series en emisión hoy"
                        icon="ri-tv-2-fill"
                        color="bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                        items={airingToday}
                    />
                )}

                {(activeTab === 'all' || activeTab === 'upcoming') && (
                    <Section
                        title="Próximos estrenos"
                        icon="ri-calendar-event-fill"
                        color="bg-nova-accent/15 text-nova-accent border border-nova-accent/20"
                        items={upcoming}
                        variant="spotlight"
                    />
                )}

                {(activeTab === 'all' || activeTab === 'movies') && (
                    <Section
                        title="Películas en tendencia"
                        icon="ri-bar-chart-fill"
                        color="bg-orange-500/15 text-orange-400 border border-orange-500/20"
                        items={trendingMovies}
                    />
                )}

                {(activeTab === 'all' || activeTab === 'series') && (
                    <Section
                        title="Series en tendencia"
                        icon="ri-trophy-fill"
                        color="bg-fuchsia-500/15 text-fuchsia-400 border border-fuchsia-500/20"
                        items={trendingSeries}
                    />
                )}

            </div>
        </main>
    );
}
