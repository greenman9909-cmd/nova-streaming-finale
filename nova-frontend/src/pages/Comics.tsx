import { useState, useCallback, useRef } from 'react';

const MANGA_API = 'https://manga-manwha-scrapper-nova.vercel.app';

const SOURCES = [
    { id: '0', name: 'MangaDex', icon: 'ri-global-line' },
    { id: '9', name: 'Bato', icon: 'ri-book-open-line' },
    { id: '7', name: 'Mangahere', icon: 'ri-book-line' },
    { id: '8', name: 'Mangapill', icon: 'ri-pages-line' },
];

const POPULAR = [
    'Solo Leveling', 'One Piece', 'Attack on Titan', 'Jujutsu Kaisen',
    'Tower of God', 'Chainsaw Man', 'Berserk', 'Naruto', 'Vagabond', 'Vinland Saga',
];

interface MangaResult {
    id: string;
    title: string | Record<string, string>;
    cover_art?: string;
    availableLanguages?: string[];
}

function extractResults(data: unknown): MangaResult[] {
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object') {
        const d = data as Record<string, unknown>;
        for (const key of ['results', 'data', 'manga', 'items', 'list']) {
            if (Array.isArray(d[key])) return d[key] as MangaResult[];
        }
    }
    return [];
}

function getTitle(item: MangaResult): string {
    if (typeof item.title === 'string') return item.title;
    const t = item.title as Record<string, string>;
    return t?.en || t?.['ja-ro'] || Object.values(t)[0] || 'Unknown';
}

function getCover(item: MangaResult): string {
    const raw = item.cover_art || '';
    if (!raw) return '';
    // cover_art is already a relative /api/proxy-image?url=... path
    if (raw.startsWith('http')) return `${MANGA_API}/api/proxy-image?url=${encodeURIComponent(raw)}`;
    return `${MANGA_API}${raw}`;
}

export default function Comics() {
    const [query, setQuery] = useState('');
    const [source, setSource] = useState('0');
    const [results, setResults] = useState<MangaResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [hasSearched, setHasSearched] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const doSearch = useCallback(async (q: string, src: string) => {
        if (!q.trim()) return;
        setLoading(true);
        setError('');
        setHasSearched(true);
        setResults([]);
        try {
            const res = await fetch(
                `${MANGA_API}/api/search?title=${encodeURIComponent(q.trim())}&source=${src}`
            );
            if (!res.ok) throw new Error(`${res.status}`);
            const data = await res.json();
            const list = extractResults(data);
            setResults(list);
            if (list.length === 0) setError('No se encontraron resultados para esta búsqueda.');
        } catch {
            setError('No se pudo conectar con la API de manga. Verifica que el servicio esté activo.');
        } finally {
            setLoading(false);
        }
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        doSearch(query, source);
    };

    const handlePopular = (term: string) => {
        setQuery(term);
        doSearch(term, source);
    };

    const handleSourceChange = (id: string) => {
        setSource(id);
        if (hasSearched && query.trim()) doSearch(query, id);
    };

    return (
        <main className="min-h-screen bg-[#030305] text-white pt-20">
            {/* Background glow */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-5%] left-[20%] w-[45%] h-[40%] bg-orange-500/8 blur-[140px] rounded-full" />
                <div className="absolute bottom-[10%] right-[-5%] w-[35%] h-[35%] bg-amber-500/8 blur-[120px] rounded-full" />
            </div>

            {/* ── Hero / Search Section ── */}
            <section className="relative z-10 flex flex-col items-center justify-center px-6 pt-14 pb-10">
                {/* Badge */}
                <div className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-300 text-xs font-bold tracking-widest uppercase mb-6">
                    <i className="ri-book-2-fill text-sm" />
                    Comics & Manga
                </div>

                <h1 className="text-5xl md:text-7xl font-black tracking-tight text-center leading-none mb-3">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500">
                        Manga
                    </span>
                    <span className="text-white"> &amp; </span>
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-orange-500">
                        Manhwa
                    </span>
                </h1>
                <p className="text-nova-muted text-center max-w-md mb-10">
                    Busca entre millones de títulos de manga, manhwa y cómics.
                </p>

                {/* Search Bar */}
                <form onSubmit={handleSubmit} className="w-full max-w-2xl">
                    <div className="relative flex items-center">
                        <i className="ri-search-line absolute left-5 text-orange-400 text-xl pointer-events-none" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Buscar manga, manhwa, cómic..."
                            className="w-full pl-13 pr-36 py-5 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-nova-dim focus:outline-none focus:border-orange-500/50 focus:bg-white/8 transition-all text-lg"
                            style={{ paddingLeft: '3.25rem' }}
                        />
                        <button
                            type="submit"
                            disabled={loading || !query.trim()}
                            className="absolute right-2 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : 'Buscar'}
                        </button>
                    </div>
                </form>

                {/* Popular Suggestions */}
                {!hasSearched && (
                    <div className="flex flex-wrap justify-center gap-2 mt-6 max-w-2xl">
                        {POPULAR.map(term => (
                            <button
                                key={term}
                                onClick={() => handlePopular(term)}
                                className="px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-nova-muted text-sm hover:border-orange-500/40 hover:text-orange-300 hover:bg-orange-500/10 transition-all duration-200"
                            >
                                {term}
                            </button>
                        ))}
                    </div>
                )}
            </section>

            {/* ── Source Tabs ── */}
            <div className="relative z-10 w-full px-6 md:px-12 mb-8">
                <div className="max-w-7xl mx-auto flex items-center gap-2 flex-wrap">
                    <span className="text-nova-dim text-sm mr-2">Fuente:</span>
                    {SOURCES.map(s => (
                        <button
                            key={s.id}
                            onClick={() => handleSourceChange(s.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                                source === s.id
                                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/20'
                                    : 'border border-white/10 bg-white/5 text-nova-muted hover:border-orange-500/30 hover:text-orange-300'
                            }`}
                        >
                            <i className={s.icon} />
                            {s.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Results Area ── */}
            <div className="relative z-10 w-full px-6 md:px-12 pb-24 max-w-7xl mx-auto">

                {/* Error */}
                {error && (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <i className="ri-wifi-off-line text-5xl text-orange-500/40" />
                        <p className="text-nova-muted text-center max-w-sm">{error}</p>
                        <button
                            onClick={() => doSearch(query, source)}
                            className="px-6 py-2 rounded-xl border border-orange-500/30 text-orange-400 hover:bg-orange-500/10 transition-colors text-sm"
                        >
                            Reintentar
                        </button>
                    </div>
                )}

                {/* Loading skeletons */}
                {loading && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {Array.from({ length: 12 }).map((_, i) => (
                            <div key={i} className="flex flex-col gap-3 animate-pulse">
                                <div className="aspect-[2/3] rounded-2xl bg-white/5" />
                                <div className="h-3 rounded bg-white/5 w-3/4" />
                                <div className="h-3 rounded bg-white/5 w-1/2" />
                            </div>
                        ))}
                    </div>
                )}

                {/* Results count */}
                {!loading && results.length > 0 && (
                    <div className="flex items-center gap-3 mb-6">
                        <h2 className="text-white font-bold text-xl">
                            {results.length} resultado{results.length !== 1 ? 's' : ''}
                        </h2>
                        <span className="text-nova-dim text-sm">para "{query}" en {SOURCES.find(s => s.id === source)?.name}</span>
                    </div>
                )}

                {/* Results Grid */}
                {!loading && results.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {results.map((item, i) => {
                            const cover = getCover(item);
                            const title = getTitle(item);
                            const sourceName = SOURCES.find(s => s.id === source)?.name || '';

                            return (
                                <a
                                    key={`${item.id}-${i}`}
                                    href={item.url || '#'}
                                    target={item.url ? '_blank' : undefined}
                                    rel="noopener noreferrer"
                                    className="group relative flex flex-col gap-3 cursor-pointer"
                                >
                                    {/* Cover */}
                                    <div className="aspect-[2/3] rounded-2xl overflow-hidden bg-white/5 relative ring-1 ring-white/10 transition-all duration-500 group-hover:scale-[1.03] group-hover:shadow-[0_0_30px_rgba(251,146,60,0.25)] group-hover:ring-orange-500/40">
                                        {cover ? (
                                            <img
                                                src={cover}
                                                alt={title}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                onError={e => {
                                                    (e.currentTarget as HTMLImageElement).src = '';
                                                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                                                }}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <i className="ri-book-2-line text-4xl text-white/10" />
                                            </div>
                                        )}

                                        {/* Hover overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 gap-2">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/30 text-orange-300 font-bold border border-orange-500/20">
                                                    {sourceName}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Title */}
                                    <div className="px-1">
                                        <h3 className="font-semibold text-white text-sm line-clamp-2 leading-snug group-hover:text-orange-300 transition-colors duration-300">
                                            {title}
                                        </h3>
                                    </div>
                                </a>
                            );
                        })}
                    </div>
                )}

                {/* Welcome state */}
                {!loading && !hasSearched && (
                    <div className="flex flex-col items-center justify-center py-16 gap-6">
                        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-orange-500/20 to-amber-500/10 border border-orange-500/20 flex items-center justify-center">
                            <i className="ri-book-2-line text-4xl text-orange-400" />
                        </div>
                        <div className="text-center">
                            <h3 className="text-white font-bold text-xl mb-2">Empieza a explorar</h3>
                            <p className="text-nova-muted max-w-xs">Busca tu manga o manhwa favorito arriba o haz clic en uno de los títulos populares.</p>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
