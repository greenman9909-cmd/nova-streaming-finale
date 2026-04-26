import { useEffect, useRef, useState, useCallback } from 'react';

const MANGA_API = 'https://manga-manwha-scrapper-nova.vercel.app';
const MD = 'https://api.mangadex.org';

const RATINGS = 'contentRating[]=safe&contentRating[]=suggestive';
const LANG = 'availableTranslatedLanguage[]=en';
const INCLUDE = 'includes[]=cover_art';

const TAGS = {
    action:    '5920b825-4181-4a17-befd-0de3d0d9731c',
    romance:   '423e2eae-a7a2-4a8b-ac03-a8351462d71a',
    fantasy:   'cdc58593-87dd-415e-bbc0-2ec27bf404cc',
    adventure: '87cc87cd-a395-47af-b27a-93258283bbc6',
    thriller:  '07251805-a27e-4d59-b488-f0bfbec15168',
};

interface MangaItem {
    id: string;
    title: string;
    description: string;
    cover: string;
    status: string;
    year: number | null;
    tags: string[];
    isKorean: boolean;
}

function parseMD(item: Record<string, unknown>): MangaItem | null {
    const attrs = (item.attributes || {}) as Record<string, unknown>;
    const titleMap = (attrs.title || {}) as Record<string, string>;
    const descMap  = (attrs.description || {}) as Record<string, string>;
    const rels     = (item.relationships || []) as Record<string, unknown>[];

    const title = titleMap.en || titleMap['ja-ro'] || Object.values(titleMap)[0] || '';
    if (!title) return null;

    const coverRel  = rels.find(r => r.type === 'cover_art');
    const coverAttr = (coverRel?.attributes || {}) as Record<string, string>;
    const fileName  = coverAttr.fileName || '';
    if (!fileName) return null;

    const raw   = `https://uploads.mangadex.org/covers/${item.id}/${fileName}.512.jpg`;
    const cover = `${MANGA_API}/api/proxy-image?url=${encodeURIComponent(raw)}&hd=`;

    const tags = ((attrs.tags || []) as Record<string, unknown>[])
        .map(t => ((t.attributes || {}) as Record<string, Record<string, string>>).name?.en || '')
        .filter(Boolean)
        .slice(0, 3);

    const description = descMap.en || Object.values(descMap)[0] || '';
    const origLangs   = (attrs.originalLanguage as string) || '';

    return {
        id: item.id as string,
        title,
        description,
        cover,
        status: (attrs.status as string) || 'unknown',
        year: (attrs.year as number) || null,
        tags,
        isKorean: origLangs === 'ko',
    };
}

async function mdFetch(query: string, limit = 20): Promise<MangaItem[]> {
    try {
        const res  = await fetch(`${MD}/manga?${query}&${INCLUDE}&${LANG}&${RATINGS}&limit=${limit}`);
        if (!res.ok) return [];
        const json = await res.json();
        return (json.data as Record<string, unknown>[]).map(parseMD).filter(Boolean) as MangaItem[];
    } catch {
        return [];
    }
}

// ── Scroll Row ────────────────────────────────────────────────────────────────
interface Section {
    label: string;
    icon: string;
    accent: string;
    items: MangaItem[];
}

function SkeletonCard() {
    return (
        <div className="flex-shrink-0 w-[150px] sm:w-[165px] animate-pulse">
            <div className="aspect-[2/3] rounded-2xl bg-white/5" />
            <div className="mt-2 h-3 rounded bg-white/5 w-4/5" />
            <div className="mt-1.5 h-2.5 rounded bg-white/5 w-2/5" />
        </div>
    );
}

function MangaCard({ item }: { item: MangaItem }) {
    return (
        <div className="flex-shrink-0 w-[150px] sm:w-[165px] group cursor-pointer">
            <div className="aspect-[2/3] rounded-2xl overflow-hidden relative ring-1 ring-white/8
                            transition-all duration-400
                            group-hover:scale-[1.04] group-hover:-translate-y-1
                            group-hover:ring-orange-500/60
                            group-hover:shadow-[0_12px_40px_rgba(251,146,60,0.28)]">
                <img
                    src={item.cover}
                    alt={item.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-600 group-hover:scale-110"
                    onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0'; }}
                />

                {/* Bottom gradient always visible */}
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/70 to-transparent" />

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent
                                opacity-0 group-hover:opacity-100 transition-opacity duration-300
                                flex flex-col justify-end p-3 gap-2">
                    {item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {item.tags.slice(0, 2).map(tag => (
                                <span key={tag}
                                    className="text-[9px] px-1.5 py-0.5 rounded-full bg-orange-500/25 text-orange-300 border border-orange-500/20 font-semibold">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                    <button className="w-full py-2 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs font-black tracking-wide shadow-lg">
                        Leer
                    </button>
                </div>

                {/* Korean badge */}
                {item.isKorean && (
                    <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-blue-500/80 backdrop-blur text-[9px] font-black text-white">
                        MANHWA
                    </div>
                )}

                {/* Status dot */}
                <div className={`absolute top-2 right-2 w-2 h-2 rounded-full shadow-lg
                    ${item.status === 'ongoing' ? 'bg-green-400 shadow-green-400/60' : 'bg-gray-400'}`} />
            </div>

            <h3 className="text-white text-sm font-semibold mt-2 line-clamp-1 group-hover:text-orange-300 transition-colors">
                {item.title}
            </h3>
            <p className="text-nova-dim text-xs mt-0.5">
                {item.year || ''}{item.year && item.isKorean ? ' · ' : ''}{item.isKorean ? 'Manhwa' : ''}
            </p>
        </div>
    );
}

function ScrollRow({ section, loading }: { section?: Section; loading: boolean }) {
    const rowRef = useRef<HTMLDivElement>(null);

    const scroll = (dir: number) =>
        rowRef.current?.scrollBy({ left: dir * 520, behavior: 'smooth' });

    return (
        <div className="relative group/row">
            {/* Left arrow */}
            <button
                onClick={() => scroll(-1)}
                className="absolute left-0 top-[40%] -translate-y-1/2 z-20
                           w-10 h-10 rounded-full bg-black/70 border border-white/10
                           text-white text-xl flex items-center justify-center backdrop-blur
                           opacity-0 group-hover/row:opacity-100 hover:bg-orange-500/80
                           transition-all duration-200 -translate-x-1/2 shadow-xl"
            >
                <i className="ri-arrow-left-s-line" />
            </button>

            <div
                ref={rowRef}
                className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide scroll-smooth"
                style={{ scrollSnapType: 'x mandatory' }}
            >
                {loading
                    ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
                    : (section?.items || []).map(item => (
                        <div key={item.id} style={{ scrollSnapAlign: 'start' }}>
                            <MangaCard item={item} />
                        </div>
                    ))
                }
            </div>

            {/* Right arrow */}
            <button
                onClick={() => scroll(1)}
                className="absolute right-0 top-[40%] -translate-y-1/2 z-20
                           w-10 h-10 rounded-full bg-black/70 border border-white/10
                           text-white text-xl flex items-center justify-center backdrop-blur
                           opacity-0 group-hover/row:opacity-100 hover:bg-orange-500/80
                           transition-all duration-200 translate-x-1/2 shadow-xl"
            >
                <i className="ri-arrow-right-s-line" />
            </button>
        </div>
    );
}

// ── Search overlay ────────────────────────────────────────────────────────────
function SearchOverlay({ onClose }: { onClose: () => void }) {
    const [query, setQuery]     = useState('');
    const [results, setResults] = useState<MangaItem[]>([]);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { inputRef.current?.focus(); }, []);

    useEffect(() => {
        if (!query.trim() || query.length < 2) { setResults([]); return; }
        const t = setTimeout(async () => {
            setLoading(true);
            try {
                const res  = await fetch(`${MANGA_API}/api/search?title=${encodeURIComponent(query)}&source=0`);
                const json = await res.json();
                const list = (json.results || []) as Record<string, unknown>[];
                setResults(list.map(item => ({
                    id: item.id as string,
                    title: (() => {
                        const t = item.title as Record<string, string> | string;
                        return typeof t === 'string' ? t : (t?.en || Object.values(t || {})[0] || '');
                    })(),
                    description: '',
                    cover: (() => {
                        const ca = item.cover_art as string || '';
                        return ca.startsWith('http') ? ca : ca ? `${MANGA_API}${ca}` : '';
                    })(),
                    status: '', year: null, tags: [], isKorean: false,
                })));
            } catch { setResults([]); }
            finally { setLoading(false); }
        }, 400);
        return () => clearTimeout(t);
    }, [query]);

    return (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex flex-col items-center pt-24 px-4"
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="w-full max-w-2xl">
                <div className="relative flex items-center">
                    <i className="ri-search-line absolute left-4 text-orange-400 text-xl" />
                    <input
                        ref={inputRef}
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={e => e.key === 'Escape' && onClose()}
                        placeholder="Buscar manga, manhwa..."
                        className="w-full pl-12 pr-12 py-4 rounded-2xl bg-white/8 border border-orange-500/30
                                   text-white placeholder:text-gray-500 text-lg focus:outline-none
                                   focus:border-orange-500/60 focus:bg-white/10 transition-all"
                    />
                    <button onClick={onClose} className="absolute right-4 text-gray-400 hover:text-white transition-colors">
                        <i className="ri-close-line text-xl" />
                    </button>
                </div>

                {loading && (
                    <div className="flex justify-center mt-8">
                        <div className="w-6 h-6 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
                    </div>
                )}

                {results.length > 0 && (
                    <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-[60vh] overflow-y-auto pr-1 scrollbar-hide">
                        {results.map(item => (
                            <MangaCard key={item.id} item={item} />
                        ))}
                    </div>
                )}

                {!loading && query.length >= 2 && results.length === 0 && (
                    <p className="text-center text-gray-500 mt-10">No se encontraron resultados</p>
                )}
            </div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function Comics() {
    const [sections, setSections]       = useState<Section[]>([]);
    const [featured, setFeatured]       = useState<MangaItem | null>(null);
    const [loading, setLoading]         = useState(true);
    const [searchOpen, setSearchOpen]   = useState(false);
    const [heroLoaded, setHeroLoaded]   = useState(false);

    const SECTION_DEFS = [
        { label: 'Más Populares',      icon: 'ri-fire-fill',        accent: 'from-orange-500 to-pink-500',   query: `order[followedCount]=desc` },
        { label: 'Mejor Valorados',    icon: 'ri-star-fill',         accent: 'from-yellow-400 to-orange-500', query: `order[rating]=desc` },
        { label: 'Manhwa Coreano',     icon: 'ri-book-open-fill',    accent: 'from-blue-400 to-violet-500',   query: `originalLanguage[]=ko&order[followedCount]=desc` },
        { label: 'Acción',             icon: 'ri-sword-fill',        accent: 'from-red-500 to-orange-400',    query: `includedTags[]=${TAGS.action}&order[followedCount]=desc` },
        { label: 'Romance',            icon: 'ri-heart-fill',        accent: 'from-pink-400 to-rose-500',     query: `includedTags[]=${TAGS.romance}&order[followedCount]=desc` },
        { label: 'Fantasía',           icon: 'ri-magic-fill',        accent: 'from-violet-400 to-purple-600', query: `includedTags[]=${TAGS.fantasy}&order[followedCount]=desc` },
    ];

    useEffect(() => {
        (async () => {
            setLoading(true);
            const results = await Promise.allSettled(
                SECTION_DEFS.map(s => mdFetch(s.query, 20))
            );

            const built: Section[] = SECTION_DEFS.map((def, i) => ({
                label: def.label,
                icon:  def.icon,
                accent: def.accent,
                items: results[i].status === 'fulfilled' ? results[i].value : [],
            }));

            setSections(built);

            // Pick featured from first non-empty section with a description
            for (const sec of built) {
                const f = sec.items.find(m => m.description.length > 40);
                if (f) { setFeatured(f); break; }
            }
            if (!featured && built[0]?.items[0]) setFeatured(built[0].items[0]);

            setLoading(false);
        })();
    }, []);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true); }
        if (e.key === 'Escape') setSearchOpen(false);
    }, []);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    return (
        <main className="min-h-screen bg-[#030305] text-white">

            {/* Ambient glows */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-8%] right-[10%] w-[45%] h-[40%] bg-orange-600/8 blur-[140px] rounded-full" />
                <div className="absolute top-[30%] left-[-5%] w-[35%] h-[40%] bg-pink-600/8 blur-[120px] rounded-full" />
                <div className="absolute bottom-[5%] right-[-5%] w-[30%] h-[30%] bg-violet-600/6 blur-[100px] rounded-full" />
            </div>

            {/* ── Hero ── */}
            <section className="relative h-[90vh] min-h-[580px] overflow-hidden">
                {featured ? (
                    <>
                        {/* Background */}
                        <div className="absolute inset-0">
                            <img
                                src={featured.cover}
                                alt=""
                                className="w-full h-full object-cover object-center scale-110"
                                style={{ filter: 'brightness(0.35) saturate(1.3) blur(2px)' }}
                                onLoad={() => setHeroLoaded(true)}
                            />
                        </div>

                        {/* Gradients */}
                        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[#030305] to-transparent" />
                        <div className="absolute inset-y-0 left-0 w-[70%] bg-gradient-to-r from-[#030305] via-[#030305]/80 to-transparent" />
                        <div className="absolute inset-x-0 bottom-0 h-80 bg-gradient-to-t from-[#030305] via-[#030305]/70 to-transparent" />

                        {/* Content */}
                        <div className={`absolute inset-0 flex items-end pb-20 px-8 md:px-16 transition-opacity duration-700 ${heroLoaded ? 'opacity-100' : 'opacity-0'}`}>
                            <div className="max-w-lg">
                                {/* Section badge */}
                                <div className="flex items-center gap-2 mb-5">
                                    <span className="flex items-center gap-2 px-3 py-1.5 rounded-full
                                                     bg-gradient-to-r from-orange-500/20 to-pink-500/20
                                                     border border-orange-500/30 text-orange-300
                                                     text-[11px] font-black uppercase tracking-widest">
                                        <i className="ri-book-2-fill" /> Comics &amp; Manga
                                    </span>
                                    {featured.isKorean && (
                                        <span className="px-2.5 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-[11px] font-black uppercase tracking-widest">
                                            Manhwa
                                        </span>
                                    )}
                                </div>

                                {/* Title */}
                                <h1 className="text-5xl md:text-7xl font-black leading-none tracking-tight mb-4 drop-shadow-2xl"
                                    style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", textShadow: '0 4px 40px rgba(0,0,0,0.9)' }}>
                                    {featured.title}
                                </h1>

                                {/* Tags */}
                                {featured.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {featured.tags.map(tag => (
                                            <span key={tag}
                                                className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/10 text-white/70 text-xs font-semibold backdrop-blur">
                                                {tag}
                                            </span>
                                        ))}
                                        {featured.year && (
                                            <span className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/10 text-white/70 text-xs font-semibold">
                                                {featured.year}
                                            </span>
                                        )}
                                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${featured.status === 'ongoing' ? 'bg-green-500/20 border border-green-500/30 text-green-300' : 'bg-gray-500/20 border border-gray-500/30 text-gray-300'}`}>
                                            {featured.status === 'ongoing' ? 'En curso' : 'Completado'}
                                        </span>
                                    </div>
                                )}

                                {/* Description */}
                                {featured.description && (
                                    <p className="text-white/60 text-sm leading-relaxed line-clamp-2 mb-7 max-w-md">
                                        {featured.description}
                                    </p>
                                )}

                                {/* CTA Buttons */}
                                <div className="flex items-center gap-3">
                                    <button className="flex items-center gap-2.5 px-7 py-3.5 rounded-xl
                                                       bg-gradient-to-r from-orange-500 to-pink-500
                                                       text-white font-black text-sm shadow-2xl shadow-orange-500/30
                                                       hover:shadow-orange-500/50 hover:scale-[1.02]
                                                       active:scale-95 transition-all duration-200">
                                        <i className="ri-book-open-fill text-base" />
                                        Leer ahora
                                    </button>
                                    <button
                                        onClick={() => setSearchOpen(true)}
                                        className="flex items-center gap-2 px-5 py-3.5 rounded-xl
                                                   bg-white/10 hover:bg-white/18 border border-white/15
                                                   text-white font-bold text-sm backdrop-blur
                                                   hover:border-white/30 transition-all duration-200">
                                        <i className="ri-search-line" />
                                        Buscar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    /* Loading hero skeleton */
                    <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a15] to-[#030305] flex items-end pb-20 px-8 md:px-16">
                        <div className="max-w-lg w-full space-y-4 animate-pulse">
                            <div className="h-4 w-32 rounded-full bg-white/8" />
                            <div className="h-16 w-80 rounded-xl bg-white/8" />
                            <div className="h-4 w-24 rounded bg-white/8" />
                            <div className="h-3 w-full max-w-sm rounded bg-white/5" />
                            <div className="flex gap-3 pt-2">
                                <div className="h-12 w-36 rounded-xl bg-white/8" />
                                <div className="h-12 w-28 rounded-xl bg-white/5" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Search shortcut pill */}
                <button
                    onClick={() => setSearchOpen(true)}
                    className="absolute top-24 right-6 md:right-12 flex items-center gap-2 px-4 py-2 rounded-full
                               bg-black/40 border border-white/10 backdrop-blur text-sm text-gray-400
                               hover:text-white hover:border-orange-500/30 transition-all duration-200 z-10"
                >
                    <i className="ri-search-line" />
                    <span className="hidden sm:inline">Buscar manga</span>
                    <span className="hidden sm:flex items-center gap-1 ml-1 px-1.5 py-0.5 rounded bg-white/10 text-xs text-gray-500">
                        <i className="ri-command-line text-[10px]" />K
                    </span>
                </button>
            </section>

            {/* ── Sections ── */}
            <div className="relative z-10 px-6 md:px-12 pb-28 space-y-12 -mt-6">
                {SECTION_DEFS.map((def, i) => (
                    <section key={def.label}>
                        {/* Section header */}
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-3">
                                {/* Colored accent line */}
                                <div className={`w-1 h-7 rounded-full bg-gradient-to-b ${def.accent}`} />
                                <i className={`${def.icon} text-lg bg-gradient-to-r ${def.accent} bg-clip-text text-transparent`} />
                                <h2 className="text-white font-black text-lg tracking-tight">
                                    {def.label}
                                </h2>
                                {!loading && sections[i] && (
                                    <span className="text-gray-600 text-sm font-medium">
                                        {sections[i].items.length} títulos
                                    </span>
                                )}
                            </div>
                            <button className="text-xs text-gray-500 hover:text-orange-400 transition-colors font-semibold flex items-center gap-1">
                                Ver todo <i className="ri-arrow-right-s-line" />
                            </button>
                        </div>

                        <ScrollRow
                            section={sections[i]}
                            loading={loading || !sections[i]}
                        />
                    </section>
                ))}
            </div>

            {/* Search overlay */}
            {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
        </main>
    );
}
