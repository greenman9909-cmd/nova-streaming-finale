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

function ItemCard({ item }: { item: Item }) {
    const link = `/watch/${item.type}/${item.id}`;
    const year = item.date.split('-')[0];
    const month = item.date ? new Date(item.date).toLocaleDateString('es-ES', { month: 'short' }) : '';
    const day = item.date ? new Date(item.date).getDate() : '';

    return (
        <Link to={link} className="group flex-shrink-0 w-36">
            <div className="aspect-[2/3] rounded-2xl overflow-hidden bg-nova-card mb-2.5 relative group-hover:shadow-[0_0_25px_rgba(255,255,255,0.12)] transition-all duration-300">
                <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    onError={e => { (e.currentTarget as HTMLImageElement).src = '/placeholder-poster.svg'; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-2">
                    <i className="ri-play-circle-fill text-white text-3xl drop-shadow-lg" />
                </div>
                {item.rating > 0 && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-black/60 backdrop-blur text-[10px] font-bold text-yellow-400">
                        <i className="ri-star-fill text-[9px]" />
                        {item.rating.toFixed(1)}
                    </div>
                )}
            </div>
            <p className="text-white font-semibold text-xs truncate group-hover:text-nova-accent transition-colors">{item.title}</p>
            <p className="text-nova-dim text-[10px] mt-0.5">{day} {month} {year}</p>
        </Link>
    );
}

function HeroCard({ item }: { item: Item }) {
    const link = `/watch/${item.type}/${item.id}`;
    return (
        <Link to={link} className="group relative flex-shrink-0 w-72 h-40 rounded-2xl overflow-hidden bg-nova-card">
            {item.backdrop && (
                <img src={item.backdrop} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-3">
                <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded-md bg-nova-accent/80 text-white text-[10px] font-bold uppercase">
                        {item.type === 'movie' ? 'Película' : 'Serie'}
                    </span>
                    {item.rating > 0 && (
                        <span className="flex items-center gap-1 text-yellow-400 text-[10px] font-bold">
                            <i className="ri-star-fill" />{item.rating.toFixed(1)}
                        </span>
                    )}
                </div>
                <p className="text-white font-bold text-sm truncate">{item.title}</p>
                <p className="text-white/50 text-[10px]">{item.date.split('-')[0]}</p>
            </div>
            <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <i className="ri-play-fill text-white text-sm" />
            </div>
        </Link>
    );
}

function Section({ title, icon, items, variant = 'card' }: {
    title: string;
    icon: string;
    items: Item[];
    variant?: 'card' | 'hero';
}) {
    if (items.length === 0) return null;
    return (
        <section className="mb-12">
            <h2 className="text-white font-black text-xl mb-5 flex items-center gap-3">
                <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-nova-accent/10 border border-nova-accent/20">
                    <i className={`${icon} text-nova-accent`} />
                </span>
                {title}
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide">
                {items.map(item =>
                    variant === 'hero'
                        ? <HeroCard key={item.id} item={item} />
                        : <ItemCard key={item.id} item={item} />
                )}
            </div>
        </section>
    );
}

export default function Novedades() {
    const [nowPlaying, setNowPlaying] = useState<Item[]>([]);
    const [upcoming, setUpcoming] = useState<Item[]>([]);
    const [airingToday, setAiringToday] = useState<Item[]>([]);
    const [trendingMovies, setTrendingMovies] = useState<Item[]>([]);
    const [trendingSeries, setTrendingSeries] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
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
        fetch();
    }, []);

    const featuredItems = [...nowPlaying.slice(0, 4), ...airingToday.slice(0, 4)];

    if (loading) {
        return (
            <div className="min-h-screen bg-nova-bg flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-nova-accent border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-nova-bg pt-20 pb-16">
            <div className="max-w-7xl mx-auto px-4 lg:px-6">
                {/* Header */}
                <div className="mb-10">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-fuchsia-500/20 to-cyan-500/20 border border-white/10">
                            <i className="ri-fire-fill text-nova-accent text-lg" />
                        </span>
                        <div>
                            <h1 className="text-3xl font-black text-white tracking-tight">Novedades</h1>
                            <p className="text-nova-dim text-sm">Lo más nuevo y lo que viene pronto</p>
                        </div>
                    </div>
                </div>

                {/* Featured horizontal cards */}
                {featuredItems.length > 0 && (
                    <div className="mb-12">
                        <h2 className="text-white font-black text-xl mb-5 flex items-center gap-3">
                            <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-nova-accent/10 border border-nova-accent/20">
                                <i className="ri-sparkling-fill text-nova-accent" />
                            </span>
                            Destacados de hoy
                        </h2>
                        <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide">
                            {featuredItems.map(item => <HeroCard key={`feat-${item.id}`} item={item} />)}
                        </div>
                    </div>
                )}

                <Section title="Películas en cartelera" icon="ri-film-fill" items={nowPlaying} />
                <Section title="Nuevas series en emisión" icon="ri-tv-2-fill" items={airingToday} />
                <Section title="Próximos estrenos" icon="ri-calendar-event-fill" items={upcoming} />
                <Section title="Películas en tendencia" icon="ri-bar-chart-fill" items={trendingMovies} />
                <Section title="Series en tendencia" icon="ri-trophy-fill" items={trendingSeries} />
            </div>
        </main>
    );
}

