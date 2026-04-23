import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { searchMovies, searchSeries, searchAnime, getImageUrl, movieGenres, seriesGenres } from '../services/api';

type SearchResult = {
    id: string | number;
    title: string;
    image: string;
    type: 'movie' | 'tv' | 'anime';
    animeMediaType?: 'movie' | 'tv';
    rating?: number;
    year?: string;
    popularity?: number;
    genreIds?: number[];
};

type SortKey = 'relevance' | 'rating' | 'year_desc' | 'year_asc' | 'popularity';

const DECADES = [
    { label: 'Todos los años', value: '' },
    { label: '2020s', value: '2020' },
    { label: '2010s', value: '2010' },
    { label: '2000s', value: '2000' },
    { label: '1990s', value: '1990' },
    { label: 'Antes de 1990', value: 'old' },
];

const SORT_OPTIONS: { label: string; value: SortKey }[] = [
    { label: 'Relevancia', value: 'relevance' },
    { label: 'Mejor valorados', value: 'rating' },
    { label: 'Más nuevos', value: 'year_desc' },
    { label: 'Más antiguos', value: 'year_asc' },
    { label: 'Popularidad', value: 'popularity' },
];

const CONTENT_GENRES: Record<number, string> = { ...movieGenres, ...seriesGenres };

const POPULAR_GENRES = [28, 12, 35, 18, 27, 878, 10749, 80, 99, 10759, 16];

export default function Search() {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';

    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeType, setActiveType] = useState<'all' | 'movie' | 'tv' | 'anime'>('all');
    const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
    const [selectedDecade, setSelectedDecade] = useState('');
    const [minRating, setMinRating] = useState(0);
    const [sortBy, setSortBy] = useState<SortKey>('relevance');
    const [filtersOpen, setFiltersOpen] = useState(false);

    useEffect(() => {
        let active = true;
        const run = async () => {
            if (!query.trim()) { setResults([]); return; }
            setLoading(true);
            try {
                const [movies, series, anime] = await Promise.all([
                    searchMovies(query),
                    searchSeries(query),
                    searchAnime(query),
                ]);

                const safeMovies = movies.filter((m: any) => m?.id && m?.title && (m?.poster_path || m?.backdrop_path));
                const safeSeries = series.filter((s: any) => s?.id && s?.name && (s?.poster_path || s?.backdrop_path));
                const safeAnime = anime.filter((a: any) => a?.id && (a?.title || a?.name) && (a?.poster_path || a?.backdrop_path));

                const combined: SearchResult[] = [
                    ...safeMovies.map((m: any) => ({
                        id: m.id, title: m.title,
                        image: getImageUrl(m.poster_path),
                        type: 'movie' as const,
                        rating: m.vote_average,
                        year: m.release_date?.split('-')[0],
                        popularity: m.popularity,
                        genreIds: m.genre_ids,
                    })),
                    ...safeSeries.map((s: any) => ({
                        id: s.id, title: s.name,
                        image: getImageUrl(s.poster_path),
                        type: 'tv' as const,
                        rating: s.vote_average,
                        year: s.first_air_date?.split('-')[0],
                        popularity: s.popularity,
                        genreIds: s.genre_ids,
                    })),
                    ...safeAnime.map((a: any) => ({
                        id: a.id, title: a.title || a.name,
                        image: getImageUrl(a.poster_path),
                        type: 'anime' as const,
                        animeMediaType: (a.media_type === 'movie' ? 'movie' : 'tv') as 'movie' | 'tv',
                        rating: a.vote_average,
                        year: (a.release_date || a.first_air_date)?.split('-')[0],
                        popularity: a.popularity,
                        genreIds: a.genre_ids,
                    })),
                ];

                if (active) setResults(combined);
            } catch { /* silent */ } finally {
                if (active) setLoading(false);
            }
        };
        const t = setTimeout(run, 500);
        return () => { active = false; clearTimeout(t); };
    }, [query]);

    const filtered = useMemo(() => {
        let out = activeType === 'all' ? results : results.filter(r => r.type === activeType);

        if (selectedGenre) out = out.filter(r => r.genreIds?.includes(selectedGenre));

        if (selectedDecade) {
            if (selectedDecade === 'old') {
                out = out.filter(r => r.year && parseInt(r.year) < 1990);
            } else {
                const start = parseInt(selectedDecade);
                out = out.filter(r => r.year && parseInt(r.year) >= start && parseInt(r.year) < start + 10);
            }
        }

        if (minRating > 0) out = out.filter(r => (r.rating || 0) >= minRating);

        out = [...out].sort((a, b) => {
            if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
            if (sortBy === 'year_desc') return parseInt(b.year || '0') - parseInt(a.year || '0');
            if (sortBy === 'year_asc') return parseInt(a.year || '0') - parseInt(b.year || '0');
            if (sortBy === 'popularity') return (b.popularity || 0) - (a.popularity || 0);
            return 0;
        });

        return out;
    }, [results, activeType, selectedGenre, selectedDecade, minRating, sortBy]);

    const activeFiltersCount = [
        selectedGenre !== null,
        selectedDecade !== '',
        minRating > 0,
        sortBy !== 'relevance',
    ].filter(Boolean).length;

    const typeLabels = { all: 'Todo', movie: 'Películas', tv: 'Series', anime: 'Anime' };

    const clearFilters = () => {
        setSelectedGenre(null);
        setSelectedDecade('');
        setMinRating(0);
        setSortBy('relevance');
    };

    return (
        <main className="min-h-screen bg-nova-bg pt-20 pb-20">
            <div className="max-w-7xl mx-auto px-4 lg:px-6">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-white mb-1">
                        {query ? `Resultados para "${query}"` : 'Busca lo que quieras'}
                    </h1>
                    <p className="text-nova-dim text-sm">{filtered.length} títulos encontrados</p>
                </div>

                {/* Type filter + Filter toggle */}
                <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                        {(['all', 'movie', 'tv', 'anime'] as const).map(f => (
                            <button
                                key={f}
                                onClick={() => setActiveType(f)}
                                className={`px-5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${activeType === f ? 'bg-white text-black' : 'bg-white/5 text-nova-muted hover:bg-white/10'}`}
                            >
                                {typeLabels[f]}
                                {f !== 'all' && (
                                    <span className="ml-1.5 opacity-60">
                                        {results.filter(r => r.type === f).length}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2">
                        {activeFiltersCount > 0 && (
                            <button
                                onClick={clearFilters}
                                className="text-xs text-nova-muted hover:text-white transition-colors flex items-center gap-1"
                            >
                                <i className="ri-close-line" /> Limpiar filtros
                            </button>
                        )}
                        <button
                            onClick={() => setFiltersOpen(v => !v)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${filtersOpen || activeFiltersCount > 0 ? 'bg-nova-accent text-white' : 'bg-white/5 text-nova-muted hover:bg-white/10'}`}
                        >
                            <i className="ri-equalizer-line" />
                            Filtros
                            {activeFiltersCount > 0 && (
                                <span className="w-4 h-4 rounded-full bg-white text-black text-[10px] flex items-center justify-center font-black">
                                    {activeFiltersCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Advanced Filters Panel */}
                {filtersOpen && (
                    <div className="mb-6 p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-5 animate-fade-in">
                        {/* Sort */}
                        <div>
                            <p className="text-xs font-bold text-nova-muted uppercase tracking-widest mb-2">Ordenar por</p>
                            <div className="flex flex-wrap gap-2">
                                {SORT_OPTIONS.map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setSortBy(opt.value)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${sortBy === opt.value ? 'bg-nova-accent text-white' : 'bg-white/5 text-nova-muted hover:bg-white/10'}`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Genre */}
                        <div>
                            <p className="text-xs font-bold text-nova-muted uppercase tracking-widest mb-2">Género</p>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => setSelectedGenre(null)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${selectedGenre === null ? 'bg-nova-accent text-white' : 'bg-white/5 text-nova-muted hover:bg-white/10'}`}
                                >
                                    Todos
                                </button>
                                {POPULAR_GENRES.map(gid => CONTENT_GENRES[gid] && (
                                    <button
                                        key={gid}
                                        onClick={() => setSelectedGenre(gid === selectedGenre ? null : gid)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${selectedGenre === gid ? 'bg-nova-accent text-white' : 'bg-white/5 text-nova-muted hover:bg-white/10'}`}
                                    >
                                        {CONTENT_GENRES[gid]}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Decade */}
                        <div>
                            <p className="text-xs font-bold text-nova-muted uppercase tracking-widest mb-2">Época</p>
                            <div className="flex flex-wrap gap-2">
                                {DECADES.map(d => (
                                    <button
                                        key={d.value}
                                        onClick={() => setSelectedDecade(d.value)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${selectedDecade === d.value ? 'bg-nova-accent text-white' : 'bg-white/5 text-nova-muted hover:bg-white/10'}`}
                                    >
                                        {d.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Min rating */}
                        <div>
                            <p className="text-xs font-bold text-nova-muted uppercase tracking-widest mb-2">
                                Valoración mínima: <span className="text-white">{minRating > 0 ? `${minRating}+` : 'Todas'}</span>
                            </p>
                            <div className="flex items-center gap-3">
                                <input
                                    type="range"
                                    min={0}
                                    max={9}
                                    step={1}
                                    value={minRating}
                                    onChange={e => setMinRating(parseInt(e.target.value))}
                                    className="w-48 accent-nova-accent"
                                />
                                <div className="flex gap-1">
                                    {[0, 3, 5, 7, 8, 9].map(v => (
                                        <button
                                            key={v}
                                            onClick={() => setMinRating(v)}
                                            className={`w-7 h-7 rounded-lg text-[10px] font-bold transition-all ${minRating === v ? 'bg-nova-accent text-white' : 'bg-white/5 text-nova-muted hover:bg-white/10'}`}
                                        >
                                            {v === 0 ? 'All' : `${v}+`}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Results */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-12 h-12 border-4 border-nova-accent border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                        {filtered.map(item => (
                            <Link
                                key={`${item.type}-${item.id}`}
                                to={
                                    item.type === 'anime'
                                        ? (item.animeMediaType === 'movie' ? `/watch/movie/${item.id}` : `/anime/${item.id}`)
                                        : `/watch/${item.type === 'movie' ? 'movie' : 'tv'}/${item.id}`
                                }
                                className="group flex flex-col gap-3"
                            >
                                <div className="aspect-[2/3] rounded-2xl overflow-hidden bg-nova-card relative group-hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] transition-all duration-300">
                                    <img
                                        src={item.image}
                                        alt={item.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        loading="lazy"
                                        decoding="async"
                                        onError={e => { (e.currentTarget as HTMLImageElement).src = '/placeholder-poster.svg'; }}
                                    />
                                    <div className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-black/60 backdrop-blur text-[10px] font-bold text-white uppercase">
                                        {item.type}
                                    </div>
                                    {item.rating && item.rating > 0 && (
                                        <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur text-[10px] font-bold text-yellow-400">
                                            <i className="ri-star-fill text-[9px]" />
                                            {item.rating.toFixed(1)}
                                        </div>
                                    )}
                                </div>
                                <div className="px-1">
                                    <h3 className="text-white font-bold text-sm truncate group-hover:text-nova-accent transition-colors">
                                        {item.title}
                                    </h3>
                                    <p className="text-nova-dim text-xs mt-0.5">{item.year || 'N/A'}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {!loading && filtered.length === 0 && query && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <i className="ri-search-line text-5xl text-nova-dim mb-4" />
                        <h3 className="text-white font-bold text-xl mb-2">Sin resultados</h3>
                        <p className="text-nova-dim max-w-sm">
                            {activeFiltersCount > 0
                                ? 'No hay resultados con estos filtros. Prueba a cambiarlos.'
                                : 'No encontramos nada que coincida. Prueba con otras palabras.'}
                        </p>
                        {activeFiltersCount > 0 && (
                            <button onClick={clearFilters} className="mt-4 px-5 py-2 rounded-xl bg-nova-accent text-white text-xs font-bold hover:opacity-90 transition-opacity">
                                Limpiar filtros
                            </button>
                        )}
                    </div>
                )}

                {!loading && !query && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <i className="ri-search-2-line text-5xl text-nova-dim mb-4" />
                        <h3 className="text-white font-bold text-xl mb-2">¿Qué quieres ver hoy?</h3>
                        <p className="text-nova-dim max-w-sm">Busca películas, series o anime usando la barra de búsqueda.</p>
                    </div>
                )}
            </div>
        </main>
    );
}
