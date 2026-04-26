import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import NovaLogo from '../components/NovaLogo';
import { useAuth } from '../context/AuthContext';
import { usePlan } from '../hooks/usePlan';

const MANGA_API = 'https://manga-manwha-scrapper-nova.vercel.app';
const MD        = 'https://api.mangadex.org';

// Note: NO availableTranslatedLanguage filter — it kills Action/Romance results
const RATINGS = 'contentRating[]=safe&contentRating[]=suggestive';
const INCLUDE = 'includes[]=cover_art';

const TAGS = {
    action:    '5920b825-4181-4a17-befd-0de3d0d9731c',
    romance:   '423e2eae-a7a2-4a8b-ac03-a8351462d71a',
    fantasy:   'cdc58593-87dd-415e-bbc0-2ec27bf404cc',
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
    const attrs    = (item.attributes  || {}) as Record<string, unknown>;
    const titleMap = (attrs.title      || {}) as Record<string, string>;
    const descMap  = (attrs.description|| {}) as Record<string, string>;
    const rels     = (item.relationships || []) as Record<string, unknown>[];

    const title = titleMap.en || titleMap['ja-ro'] || Object.values(titleMap)[0] || '';
    if (!title) return null;

    const coverRel  = rels.find(r => r.type === 'cover_art');
    const coverAttr = ((coverRel?.attributes) || {}) as Record<string, string>;
    const fileName  = coverAttr.fileName || '';
    if (!fileName) return null;

    const raw   = `https://uploads.mangadex.org/covers/${item.id}/${fileName}.512.jpg`;
    const cover = `${MANGA_API}/api/proxy-image?url=${encodeURIComponent(raw)}&hd=`;

    const tags = ((attrs.tags || []) as Record<string, unknown>[])
        .map(t => ((t.attributes || {}) as Record<string, Record<string, string>>).name?.en || '')
        .filter(Boolean)
        .slice(0, 3);

    return {
        id:          item.id as string,
        title,
        description: descMap.en || Object.values(descMap)[0] || '',
        cover,
        status:      (attrs.status as string) || 'unknown',
        year:        (attrs.year   as number) || null,
        tags,
        isKorean:    (attrs.originalLanguage as string) === 'ko',
    };
}

async function mdFetch(query: string, limit = 20): Promise<MangaItem[]> {
    try {
        const res  = await fetch(`${MD}/manga?${query}&${INCLUDE}&${RATINGS}&limit=${limit}`);
        if (!res.ok) return [];
        const json = await res.json();
        return ((json.data || []) as Record<string, unknown>[])
            .map(parseMD)
            .filter(Boolean) as MangaItem[];
    } catch {
        return [];
    }
}

// ── Section definitions ───────────────────────────────────────────────────────
interface SectionDef {
    label:     string;
    icon:      string;
    lineColor: string;
    iconColor: string;
    query:     string;
}

const SECTION_DEFS: SectionDef[] = [
    { label: 'Más Populares',   icon: 'ri-fire-fill',         lineColor: 'bg-orange-500',  iconColor: 'text-orange-400',  query: `order[followedCount]=desc` },
    { label: 'Mejor Valorados', icon: 'ri-star-fill',          lineColor: 'bg-yellow-400',  iconColor: 'text-yellow-400',  query: `order[rating]=desc` },
    { label: 'Manhwa Coreano',  icon: 'ri-book-open-fill',     lineColor: 'bg-blue-500',    iconColor: 'text-blue-400',    query: `originalLanguage[]=ko&order[followedCount]=desc` },
    { label: 'Acción',          icon: 'ri-flashlight-fill',    lineColor: 'bg-red-500',     iconColor: 'text-red-400',     query: `includedTags[]=${TAGS.action}&order[followedCount]=desc` },
    { label: 'Romance',         icon: 'ri-heart-fill',         lineColor: 'bg-pink-500',    iconColor: 'text-pink-400',    query: `includedTags[]=${TAGS.romance}&order[followedCount]=desc` },
    { label: 'Fantasía',        icon: 'ri-sparkling-2-fill',   lineColor: 'bg-violet-500',  iconColor: 'text-violet-400',  query: `includedTags[]=${TAGS.fantasy}&order[followedCount]=desc` },
];

interface Section extends SectionDef { items: MangaItem[]; }

// ── Card ──────────────────────────────────────────────────────────────────────
function MangaCard({ item, index }: { item: MangaItem; index: number }) {
    return (
        <motion.a
            href={`https://mangadex.org/title/${item.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 w-[148px] sm:w-[162px] group cursor-pointer block"
            style={{ scrollSnapAlign: 'start' }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: index * 0.04, ease: 'easeOut' }}
        >
            {/* Cover */}
            <div className="aspect-[2/3] rounded-2xl overflow-hidden relative ring-1 ring-white/8
                            transition-all duration-300
                            group-hover:scale-[1.05] group-hover:-translate-y-1.5
                            group-hover:ring-orange-500/50
                            group-hover:shadow-[0_16px_48px_rgba(251,146,60,0.30)]">
                <img
                    src={item.cover}
                    alt={item.title}
                    loading="lazy"
                    className="w-full h-full object-cover object-top
                               transition-transform duration-500 group-hover:scale-110"
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />

                {/* Permanent bottom vignette */}
                <div className="absolute inset-x-0 bottom-0 h-2/5
                                bg-gradient-to-t from-black/75 to-transparent pointer-events-none" />

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent
                                opacity-0 group-hover:opacity-100 transition-opacity duration-250
                                flex flex-col justify-end p-3 gap-2">
                    {item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {item.tags.slice(0, 2).map(tag => (
                                <span key={tag}
                                    className="text-[9px] px-1.5 py-0.5 rounded-full
                                               bg-orange-500/20 border border-orange-500/25
                                               text-orange-300 font-semibold">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                    <div className="flex items-center gap-1.5 w-full py-2 rounded-xl
                                    bg-gradient-to-r from-orange-500 to-pink-500
                                    justify-center text-white text-xs font-black tracking-wide shadow-lg">
                        <i className="ri-book-open-fill text-sm" />
                        Leer en MangaDex
                    </div>
                </div>

                {/* Badges */}
                {item.isKorean && (
                    <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md
                                    bg-blue-600/85 backdrop-blur text-[9px] font-black text-white z-10">
                        MANHWA
                    </div>
                )}
                <div className={`absolute top-2 right-2 w-2 h-2 rounded-full z-10
                    ${item.status === 'ongoing'
                        ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]'
                        : 'bg-gray-500'}`}
                />
            </div>

            {/* Info */}
            <h3 className="text-white text-sm font-semibold mt-2.5 line-clamp-1
                           group-hover:text-orange-300 transition-colors duration-200 leading-snug">
                {item.title}
            </h3>
            <p className="text-nova-dim text-xs mt-0.5 flex items-center gap-1">
                {item.year && <span>{item.year}</span>}
                {item.year && item.isKorean && <span className="text-gray-700">·</span>}
                {item.isKorean && <span className="text-blue-400/80">Manhwa</span>}
            </p>
        </motion.a>
    );
}

function SkeletonCard() {
    return (
        <div className="flex-shrink-0 w-[148px] sm:w-[162px] animate-pulse">
            <div className="aspect-[2/3] rounded-2xl bg-white/5" />
            <div className="mt-2.5 h-3 rounded bg-white/5 w-4/5" />
            <div className="mt-1.5 h-2.5 rounded bg-white/5 w-2/5" />
        </div>
    );
}

// ── Scroll Row ────────────────────────────────────────────────────────────────
function ScrollRow({ section, loading }: { section?: Section; loading: boolean }) {
    const rowRef = useRef<HTMLDivElement>(null);
    const scroll = (dir: number) =>
        rowRef.current?.scrollBy({ left: dir * 560, behavior: 'smooth' });

    return (
        <div className="relative group/row">
            {/* Left arrow */}
            <button onClick={() => scroll(-1)}
                className="absolute left-0 top-[38%] -translate-y-1/2 -translate-x-1/2 z-20
                           w-9 h-9 rounded-full bg-[#0c0c14]/90 border border-white/10
                           text-white text-lg flex items-center justify-center backdrop-blur
                           opacity-0 group-hover/row:opacity-100
                           hover:bg-orange-500 hover:border-orange-500
                           transition-all duration-200 shadow-xl">
                <i className="ri-arrow-left-s-line" />
            </button>

            <div ref={rowRef}
                className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide"
                style={{ scrollSnapType: 'x mandatory' }}>
                {loading
                    ? Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)
                    : (section?.items || []).map((item, i) => (
                        <MangaCard key={item.id} item={item} index={i} />
                    ))
                }
            </div>

            {/* Right arrow */}
            <button onClick={() => scroll(1)}
                className="absolute right-0 top-[38%] -translate-y-1/2 translate-x-1/2 z-20
                           w-9 h-9 rounded-full bg-[#0c0c14]/90 border border-white/10
                           text-white text-lg flex items-center justify-center backdrop-blur
                           opacity-0 group-hover/row:opacity-100
                           hover:bg-orange-500 hover:border-orange-500
                           transition-all duration-200 shadow-xl">
                <i className="ri-arrow-right-s-line" />
            </button>
        </div>
    );
}

// ── Search Overlay ────────────────────────────────────────────────────────────
function SearchOverlay({ onClose }: { onClose: () => void }) {
    const [query,   setQuery]   = useState('');
    const [results, setResults] = useState<MangaItem[]>([]);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { setTimeout(() => inputRef.current?.focus(), 80); }, []);

    useEffect(() => {
        if (query.trim().length < 2) { setResults([]); return; }
        const t = setTimeout(async () => {
            setLoading(true);
            try {
                const res  = await fetch(
                    `${MANGA_API}/api/search?title=${encodeURIComponent(query.trim())}&source=0`
                );
                const json = await res.json();
                const list = (json.results || []) as Record<string, unknown>[];
                setResults(list.map(item => {
                    const titleRaw = item.title as Record<string, string> | string;
                    const title    = typeof titleRaw === 'string'
                        ? titleRaw
                        : (titleRaw?.en || Object.values(titleRaw || {})[0] || '');
                    const ca    = (item.cover_art as string) || '';
                    const cover = ca.startsWith('http') ? ca : ca ? `${MANGA_API}${ca}` : '';
                    return { id: item.id as string, title, description: '', cover,
                             status: '', year: null, tags: [], isKorean: false };
                }).filter(m => m.title));
            } catch { setResults([]); }
            finally   { setLoading(false); }
        }, 380);
        return () => clearTimeout(t);
    }, [query]);

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex flex-col items-center pt-24 px-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={e => { if (e.target === e.currentTarget) onClose(); }}
            >
                <motion.div
                    className="w-full max-w-2xl"
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0,   opacity: 1 }}
                    transition={{ delay: 0.05, ease: 'easeOut' }}
                >
                    {/* Input */}
                    <div className="relative flex items-center mb-5">
                        <i className="ri-search-line absolute left-4 text-orange-400 text-xl pointer-events-none" />
                        <input
                            ref={inputRef}
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            onKeyDown={e => e.key === 'Escape' && onClose()}
                            placeholder="Buscar manga, manhwa..."
                            className="w-full pl-12 pr-14 py-4 rounded-2xl
                                       bg-white/8 border border-orange-500/30 text-white
                                       placeholder:text-gray-600 text-base
                                       focus:outline-none focus:border-orange-500/70
                                       focus:bg-white/10 transition-all"
                        />
                        <button onClick={onClose}
                            className="absolute right-3 w-9 h-9 rounded-xl bg-white/8
                                       flex items-center justify-center text-gray-400
                                       hover:text-white hover:bg-white/15 transition-colors">
                            <i className="ri-close-line text-lg" />
                        </button>
                    </div>

                    {loading && (
                        <div className="flex justify-center py-10">
                            <div className="w-7 h-7 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
                        </div>
                    )}

                    {results.length > 0 && (
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3
                                        max-h-[58vh] overflow-y-auto scrollbar-hide">
                            {results.map((item, i) => <MangaCard key={item.id} item={item} index={i} />)}
                        </div>
                    )}

                    {!loading && query.length >= 2 && results.length === 0 && (
                        <p className="text-center text-gray-600 mt-12 text-sm">
                            No se encontraron resultados para "{query}"
                        </p>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

// ── Plan Gate ─────────────────────────────────────────────────────────────────
function ComicsGate({ isLoggedIn }: { isLoggedIn: boolean }) {
    const navigate = useNavigate();
    return (
        <main className="min-h-screen bg-[#030305] flex items-center justify-center p-6">
            <motion.div
                className="max-w-lg w-full text-center"
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
                {/* Ambient glow */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-orange-600/8 blur-[120px] rounded-full" />
                </div>

                <div className="relative">
                    {/* Icon */}
                    <div className="w-24 h-24 mx-auto mb-8 rounded-3xl
                                    bg-gradient-to-br from-orange-500/20 to-pink-600/20
                                    border border-orange-500/20
                                    flex items-center justify-center
                                    shadow-[0_0_60px_rgba(251,146,60,0.15)]">
                        <i className="ri-book-2-fill text-5xl text-orange-400" />
                    </div>

                    <h1 className="text-4xl font-black text-white mb-3"
                        style={{ fontFamily: "'Bebas Neue', Impact, sans-serif" }}>
                        Comics & Manhwa
                    </h1>
                    <p className="text-gray-400 text-base leading-relaxed mb-3">
                        {isLoggedIn
                            ? 'Comics & Manhwa es una función exclusiva de Nova+. Activa tu plan para acceder a miles de títulos.'
                            : 'Inicia sesión y activa Nova+ para acceder a miles de mangas, manhwas y cómics.'}
                    </p>

                    {/* Plan badge - Nova+ only */}
                    <div className="flex items-center justify-center gap-3 mb-8">
                        <span className="flex items-center gap-1.5 px-4 py-2 rounded-full
                                         bg-cyan-500/15 border border-cyan-400/30
                                         text-cyan-300 text-sm font-bold">
                            <i className="ri-vip-crown-fill" /> Exclusivo Nova+
                        </span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                            onClick={() => navigate('/plans')}
                            className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl
                                       bg-gradient-to-r from-orange-500 to-pink-500
                                       text-white font-black text-base
                                       hover:brightness-110 transition-all
                                       shadow-[0_8px_32px_rgba(251,146,60,0.35)]">
                            <i className="ri-vip-crown-fill" />
                            Ver planes
                        </button>
                        <button
                            onClick={() => navigate(-1)}
                            className="px-6 py-4 rounded-xl bg-white/6 border border-white/10
                                       text-white font-semibold hover:bg-white/10 transition-colors">
                            Volver
                        </button>
                    </div>
                </div>
            </motion.div>
        </main>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Comics() {
    const { user, loading: authLoading } = useAuth();
    const { canAccessComics } = usePlan();

    const [sections,    setSections]    = useState<Section[]>([]);
    const [featured,    setFeatured]    = useState<MangaItem | null>(null);
    const [loading,     setLoading]     = useState(true);
    const [searchOpen,  setSearchOpen]  = useState(false);
    const [heroBg,      setHeroBg]      = useState('');

    useEffect(() => {
        (async () => {
            setLoading(true);
            const settled = await Promise.allSettled(
                SECTION_DEFS.map(s => mdFetch(s.query, 20))
            );
            const built: Section[] = SECTION_DEFS.map((def, i) => ({
                ...def,
                items: settled[i].status === 'fulfilled' ? settled[i].value : [],
            }));
            setSections(built);

            // Pick featured: needs a description + cover
            let feat: MangaItem | null = null;
            for (const sec of built) {
                feat = sec.items.find(m => m.description.length > 60) || null;
                if (feat) break;
            }
            if (!feat) feat = built[0]?.items[0] || null;
            setFeatured(feat);
            if (feat) setHeroBg(feat.cover);
            setLoading(false);
        })();
    }, []);

    const handleKey = useCallback((e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true); }
        if (e.key === 'Escape') setSearchOpen(false);
    }, []);

    useEffect(() => {
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [handleKey]);

    // Auth / plan gate
    if (!authLoading && (!user || !canAccessComics)) {
        return <ComicsGate isLoggedIn={!!user} />;
    }

    return (
        <main className="min-h-screen bg-[#030305] text-white overflow-x-hidden">

            {/* ── Ambient glows ── */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-[10%] right-[5%]  w-[50%] h-[45%] bg-orange-600/7  blur-[160px] rounded-full" />
                <div className="absolute  top-[40%] left-[-8%]  w-[40%] h-[40%] bg-pink-600/6    blur-[140px] rounded-full" />
                <div className="absolute  bottom-0  right-[-5%] w-[35%] h-[30%] bg-violet-700/5  blur-[120px] rounded-full" />
            </div>

            {/* ── Hero ── */}
            <section className="relative h-[88vh] min-h-[580px] overflow-hidden">

                {/* Background image */}
                {heroBg && (
                    <div className="absolute inset-0">
                        <img src={heroBg} alt=""
                            className="w-full h-full object-cover object-top scale-[1.08]"
                            style={{ filter: 'brightness(0.30) saturate(1.4) blur(3px)' }}
                        />
                    </div>
                )}

                {/* Gradient layers */}
                <div className="absolute inset-0 bg-gradient-to-b  from-[#030305]/90 via-transparent  to-[#030305]" />
                <div className="absolute inset-0 bg-gradient-to-r  from-[#030305]   via-[#030305]/65 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-tr from-[#030305]/50 to-transparent" />

                {/* Nova branding — top left */}
                <div className="absolute top-24 left-6 md:left-12 flex items-center gap-2.5 z-10">
                    <NovaLogo className="w-7 h-7 opacity-80" />
                    <div className="flex flex-col leading-none">
                        <span className="text-xs font-black text-white/50 tracking-[0.22em] uppercase">NOVA</span>
                        <span className="text-[10px] text-orange-400/70 font-bold tracking-[0.15em] uppercase">Comics</span>
                    </div>
                </div>

                {/* Search shortcut — top right */}
                <button onClick={() => setSearchOpen(true)}
                    className="absolute top-24 right-6 md:right-12 z-10 flex items-center gap-2
                               px-4 py-2 rounded-full bg-black/35 border border-white/10
                               backdrop-blur text-sm text-gray-400
                               hover:text-white hover:border-orange-500/40 transition-all">
                    <i className="ri-search-line text-sm" />
                    <span className="hidden sm:inline text-xs">Buscar</span>
                    <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded
                                   bg-white/8 text-[10px] text-gray-600 font-mono">
                        ⌘K
                    </kbd>
                </button>

                {/* Hero content */}
                <div className="absolute inset-0 flex items-end pb-16 px-6 md:px-14">
                    <div className="max-w-xl w-full">
                        {featured ? (
                            <motion.div
                                initial={{ opacity: 0, y: 36 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                            >
                                {/* Badges */}
                                <div className="flex items-center gap-2 mb-5 flex-wrap">
                                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full
                                                     bg-orange-500/15 border border-orange-500/30
                                                     text-orange-300 text-[11px] font-black uppercase tracking-widest">
                                        <i className="ri-book-2-fill" /> Destacado
                                    </span>
                                    {featured.isKorean && (
                                        <span className="px-3 py-1.5 rounded-full bg-blue-500/15
                                                         border border-blue-400/30 text-blue-300
                                                         text-[11px] font-black uppercase tracking-widest">
                                            Manhwa
                                        </span>
                                    )}
                                    <span className={`px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest
                                        ${featured.status === 'ongoing'
                                            ? 'bg-emerald-500/15 border border-emerald-400/30 text-emerald-300'
                                            : 'bg-gray-500/15 border border-gray-400/20 text-gray-400'}`}>
                                        {featured.status === 'ongoing' ? '● En Curso' : 'Completado'}
                                    </span>
                                </div>

                                {/* Title */}
                                <h1 className="text-5xl md:text-[5.5rem] font-black leading-[0.88] tracking-tight mb-5"
                                    style={{
                                        fontFamily: "'Bebas Neue', Impact, sans-serif",
                                        textShadow: '0 4px 48px rgba(0,0,0,0.95)',
                                    }}>
                                    {featured.title}
                                </h1>

                                {/* Genre tags */}
                                {featured.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {featured.tags.map(tag => (
                                            <span key={tag}
                                                className="px-2.5 py-1 rounded-lg bg-white/8
                                                           border border-white/8 text-white/60
                                                           text-xs font-semibold backdrop-blur">
                                                {tag}
                                            </span>
                                        ))}
                                        {featured.year && (
                                            <span className="px-2.5 py-1 rounded-lg bg-white/8
                                                             border border-white/8 text-white/50 text-xs">
                                                {featured.year}
                                            </span>
                                        )}
                                    </div>
                                )}

                                {/* Description */}
                                {featured.description && (
                                    <p className="text-white/55 text-sm leading-relaxed line-clamp-2 mb-7 max-w-md">
                                        {featured.description}
                                    </p>
                                )}

                                {/* CTAs */}
                                <div className="flex items-center gap-3">
                                    <a href={`https://mangadex.org/title/${featured.id}`}
                                        target="_blank" rel="noopener noreferrer"
                                        className="flex items-center gap-2.5 px-7 py-3.5 rounded-xl
                                                   bg-gradient-to-r from-orange-500 to-pink-500
                                                   text-white font-black text-sm
                                                   shadow-[0_8px_32px_rgba(251,146,60,0.35)]
                                                   hover:shadow-[0_8px_40px_rgba(251,146,60,0.55)]
                                                   hover:scale-[1.03] active:scale-95 transition-all duration-200">
                                        <i className="ri-book-open-fill text-base" />
                                        Leer ahora
                                    </a>
                                    <button onClick={() => setSearchOpen(true)}
                                        className="flex items-center gap-2 px-5 py-3.5 rounded-xl
                                                   bg-white/8 hover:bg-white/14 border border-white/12
                                                   hover:border-white/25 text-white font-bold text-sm
                                                   backdrop-blur transition-all duration-200">
                                        <i className="ri-search-line" />
                                        Buscar
                                    </button>
                                </div>
                            </motion.div>
                        ) : (
                            /* Skeleton */
                            <div className="space-y-4 animate-pulse">
                                <div className="flex gap-2">
                                    <div className="h-7 w-28 rounded-full bg-white/8" />
                                    <div className="h-7 w-20 rounded-full bg-white/5" />
                                </div>
                                <div className="h-20 w-3/4 rounded-xl bg-white/8" />
                                <div className="h-3 w-full max-w-sm rounded bg-white/5" />
                                <div className="h-3 w-2/3 rounded bg-white/5" />
                                <div className="flex gap-3 pt-2">
                                    <div className="h-12 w-36 rounded-xl bg-orange-500/20" />
                                    <div className="h-12 w-28 rounded-xl bg-white/5" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* ── Sections ── */}
            <div className="relative z-10 px-6 md:px-12 pb-28 space-y-14 -mt-2">
                {SECTION_DEFS.map((def, i) => (
                    <motion.section
                        key={def.label}
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-60px' }}
                        transition={{ duration: 0.45, ease: 'easeOut' }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-3">
                                <div className={`w-[3px] h-6 rounded-full ${def.lineColor}`} />
                                <i className={`${def.icon} text-base ${def.iconColor}`} />
                                <h2 className="text-white font-black text-lg tracking-tight">
                                    {def.label}
                                </h2>
                                {!loading && sections[i] && sections[i].items.length > 0 && (
                                    <span className="text-gray-700 text-sm font-medium">
                                        {sections[i].items.length} títulos
                                    </span>
                                )}
                            </div>
                            <a href="https://mangadex.org" target="_blank" rel="noopener noreferrer"
                                className="text-xs text-gray-600 hover:text-orange-400
                                           transition-colors font-semibold flex items-center gap-1">
                                Ver todo <i className="ri-arrow-right-s-line" />
                            </a>
                        </div>

                        <ScrollRow
                            section={sections[i]}
                            loading={loading || !sections[i]}
                        />
                    </motion.section>
                ))}

                {/* Nova footer branding */}
                <motion.div
                    className="flex items-center justify-center gap-3 pt-4 opacity-30"
                    initial={{ opacity: 0 }} whileInView={{ opacity: 0.3 }} viewport={{ once: true }}>
                    <NovaLogo className="w-5 h-5" />
                    <span className="text-xs text-gray-500 font-bold tracking-[0.2em] uppercase">
                        Nova Comics
                    </span>
                    <span className="text-gray-700 text-xs">·</span>
                    <span className="text-xs text-gray-600">Powered by MangaDex</span>
                </motion.div>
            </div>

            {/* Search overlay */}
            {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
        </main>
    );
}
