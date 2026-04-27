import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import NovaLogo from '../components/NovaLogo';
import { useAuth } from '../context/AuthContext';
import { usePlan } from '../hooks/usePlan';

const MANGA_API = 'https://manga-manwha-scrapper-nova.vercel.app';
const MD        = 'https://api.mangadex.org';

const RATINGS  = 'contentRating[]=safe&contentRating[]=suggestive';
const INCLUDE  = 'includes[]=cover_art';
const JP_ONLY  = 'originalLanguage[]=ja';
const TRANS    = 'availableTranslatedLanguage[]=en&availableTranslatedLanguage[]=es';

const TAGS = {
    action:   '5920b825-4181-4a17-befd-0de3d0d9731c',
    romance:  '423e2eae-a7a2-4a8b-ac03-a8351462d71a',
    fantasy:  'cdc58593-87dd-415e-bbc0-2ec27bf404cc',
    thriller: '07251805-a27e-4d59-b488-f0bfbec15168',
};

interface MangaItem {
    id:          string;
    title:       string;
    description: string;
    cover:       string;
    status:      string;
    year:        number | null;
    tags:        string[];
}

function parseMD(item: Record<string, unknown>): MangaItem | null {
    const attrs    = (item.attributes   || {}) as Record<string, unknown>;
    const titleMap = (attrs.title       || {}) as Record<string, string>;
    const descMap  = (attrs.description || {}) as Record<string, string>;
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
    };
}

async function mdFetch(query: string, limit = 20): Promise<MangaItem[]> {
    try {
        const res = await fetch(
            `${MD}/manga?${query}&${JP_ONLY}&${INCLUDE}&${RATINGS}&limit=${limit}&hasAvailableChapters=true&${TRANS}`
        );
        if (!res.ok) return [];
        const json = await res.json();
        return ((json.data || []) as Record<string, unknown>[])
            .map(parseMD)
            .filter(Boolean) as MangaItem[];
    } catch {
        return [];
    }
}

// ── Sections ──────────────────────────────────────────────────────────────────
interface SectionDef {
    label:  string;
    sub:    string;
    icon:   string;
    accent: string;
    query:  string;
}

const SECTION_DEFS: SectionDef[] = [
    {
        label:  'Más Populares',
        sub:    'Los manga más seguidos del mundo',
        icon:   'ri-fire-fill',
        accent: 'from-orange-500 to-amber-400',
        query:  'order[followedCount]=desc',
    },
    {
        label:  'Mejor Valorados',
        sub:    'Puntuaciones más altas de la comunidad',
        icon:   'ri-star-fill',
        accent: 'from-yellow-400 to-orange-400',
        query:  'order[rating]=desc',
    },
    {
        label:  'Nuevos Capítulos',
        sub:    'Actualizados recientemente',
        icon:   'ri-refresh-line',
        accent: 'from-cyan-500 to-teal-400',
        query:  'order[latestUploadedChapter]=desc',
    },
    {
        label:  'Acción',
        sub:    'Batallas épicas y aventuras intensas',
        icon:   'ri-sword-fill',
        accent: 'from-red-500 to-orange-500',
        query:  `includedTags[]=${TAGS.action}&order[followedCount]=desc`,
    },
    {
        label:  'Romance',
        sub:    'Historias de amor y drama emocional',
        icon:   'ri-heart-fill',
        accent: 'from-rose-500 to-pink-400',
        query:  `includedTags[]=${TAGS.romance}&order[followedCount]=desc`,
    },
    {
        label:  'Fantasía',
        sub:    'Mundos mágicos y aventuras épicas',
        icon:   'ri-sparkling-2-fill',
        accent: 'from-violet-500 to-purple-400',
        query:  `includedTags[]=${TAGS.fantasy}&order[followedCount]=desc`,
    },
];

interface Section extends SectionDef { items: MangaItem[]; }

// ── Card ──────────────────────────────────────────────────────────────────────
function MangaCard({ item, index }: { item: MangaItem; index: number }) {
    const navigate = useNavigate();
    return (
        <motion.div
            onClick={() => navigate(`/comics/${item.id}`)}
            className="flex-shrink-0 w-[158px] sm:w-[176px] group cursor-pointer"
            style={{ scrollSnapAlign: 'start' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
        >
            {/* Cover */}
            <div className="relative aspect-[2/3] rounded-xl overflow-hidden
                            ring-1 ring-white/[0.07]
                            transition-all duration-300 ease-out
                            group-hover:-translate-y-2 group-hover:scale-[1.03]
                            group-hover:ring-orange-500/35
                            group-hover:shadow-[0_20px_56px_rgba(249,115,22,0.26)]">

                <img
                    src={item.cover}
                    alt={item.title}
                    loading="lazy"
                    className="w-full h-full object-cover object-top
                               transition-transform duration-500 group-hover:scale-105"
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />

                {/* Bottom vignette */}
                <div className="absolute inset-x-0 bottom-0 h-2/5
                                bg-gradient-to-t from-black/65 to-transparent pointer-events-none" />

                {/* Status dot */}
                <div className={`absolute top-2 right-2 w-2 h-2 rounded-full z-10
                    ${item.status === 'ongoing'
                        ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]'
                        : 'bg-gray-500/60'}`}
                />

                {/* Hover overlay */}
                <div className="absolute inset-0 flex flex-col justify-end p-3 gap-2
                                bg-gradient-to-t from-black/92 via-black/40 to-transparent
                                opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {item.tags.slice(0, 2).map(tag => (
                                <span key={tag}
                                    className="text-[9px] px-1.5 py-0.5 rounded-full
                                               bg-white/10 border border-white/15
                                               text-white/65 font-medium">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                    <div className="flex items-center justify-center gap-1.5 py-2 rounded-lg
                                    bg-gradient-to-r from-orange-500 to-rose-500
                                    text-white text-[11px] font-black tracking-wider shadow-lg">
                        <i className="ri-book-open-fill" />
                        Leer
                    </div>
                </div>
            </div>

            {/* Info */}
            <div className="mt-2.5 px-0.5">
                <h3 className="text-white/90 text-[13px] font-semibold line-clamp-1 leading-snug
                               group-hover:text-orange-300 transition-colors duration-200">
                    {item.title}
                </h3>
                <p className="text-white/28 text-[11px] mt-0.5">
                    {item.year
                        ? item.year
                        : item.status === 'ongoing' ? 'En Curso' : 'Completado'}
                </p>
            </div>
        </motion.div>
    );
}

function SkeletonCard() {
    return (
        <div className="flex-shrink-0 w-[158px] sm:w-[176px] animate-pulse">
            <div className="aspect-[2/3] rounded-xl bg-white/[0.05]" />
            <div className="mt-2.5 h-3 rounded bg-white/[0.05] w-4/5" />
            <div className="mt-1.5 h-2.5 rounded bg-white/[0.04] w-2/5" />
        </div>
    );
}

// ── Scroll Row ────────────────────────────────────────────────────────────────
function ScrollRow({ section, loading }: { section?: Section; loading: boolean }) {
    const rowRef = useRef<HTMLDivElement>(null);
    const scroll = (dir: number) =>
        rowRef.current?.scrollBy({ left: dir * 580, behavior: 'smooth' });

    return (
        <div className="relative group/row">
            <button onClick={() => scroll(-1)}
                className="absolute left-0 top-[35%] -translate-y-1/2 -translate-x-3 z-20
                           w-10 h-10 rounded-full bg-[#0a0a14]/95 border border-white/[0.08]
                           text-white/60 flex items-center justify-center backdrop-blur-sm
                           opacity-0 group-hover/row:opacity-100
                           hover:text-white hover:bg-orange-500/90 hover:border-orange-500/50
                           transition-all duration-200 shadow-2xl">
                <i className="ri-arrow-left-s-line text-lg" />
            </button>

            <div ref={rowRef}
                className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide"
                style={{ scrollSnapType: 'x mandatory' }}>
                {loading
                    ? Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)
                    : (section?.items || []).map((item, i) => (
                        <MangaCard key={item.id} item={item} index={i} />
                    ))
                }
            </div>

            <button onClick={() => scroll(1)}
                className="absolute right-0 top-[35%] -translate-y-1/2 translate-x-3 z-20
                           w-10 h-10 rounded-full bg-[#0a0a14]/95 border border-white/[0.08]
                           text-white/60 flex items-center justify-center backdrop-blur-sm
                           opacity-0 group-hover/row:opacity-100
                           hover:text-white hover:bg-orange-500/90 hover:border-orange-500/50
                           transition-all duration-200 shadow-2xl">
                <i className="ri-arrow-right-s-line text-lg" />
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
                const res = await fetch(
                    `${MD}/manga?title=${encodeURIComponent(query.trim())}&${JP_ONLY}&${INCLUDE}&${RATINGS}&limit=24&hasAvailableChapters=true&${TRANS}&order[relevance]=desc`
                );
                const json = await res.json();
                const items = ((json.data || []) as Record<string, unknown>[])
                    .map(parseMD)
                    .filter(Boolean) as MangaItem[];
                setResults(items);
            } catch { setResults([]); }
            finally { setLoading(false); }
        }, 380);
        return () => clearTimeout(t);
    }, [query]);

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-50 bg-black/70 backdrop-blur-2xl flex flex-col items-center pt-16 px-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={e => { if (e.target === e.currentTarget) onClose(); }}
            >
                <motion.div
                    className="w-full max-w-2xl"
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.04, ease: [0.22, 1, 0.36, 1] }}
                >
                    <div className="relative flex items-center mb-5">
                        <i className="ri-search-line absolute left-5 text-orange-400/70 text-xl pointer-events-none" />
                        <input
                            ref={inputRef}
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            onKeyDown={e => e.key === 'Escape' && onClose()}
                            placeholder="Buscar manga japonés por título..."
                            className="w-full pl-14 pr-16 py-5 rounded-2xl
                                       bg-[#0e0e18] border border-white/[0.09] text-white text-base
                                       placeholder:text-white/20
                                       focus:outline-none focus:border-orange-500/40
                                       transition-all shadow-2xl"
                        />
                        <button onClick={onClose}
                            className="absolute right-4 w-8 h-8 rounded-lg bg-white/[0.06]
                                       flex items-center justify-center text-white/30
                                       hover:text-white hover:bg-white/[0.12] transition-colors">
                            <i className="ri-close-line text-lg" />
                        </button>
                    </div>

                    {loading && (
                        <div className="flex justify-center py-12">
                            <div className="w-6 h-6 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
                        </div>
                    )}

                    {results.length > 0 && (
                        <>
                            <p className="text-white/20 text-xs mb-4 px-1 font-medium">
                                {results.length} resultados · manga japonés
                            </p>
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3
                                            max-h-[58vh] overflow-y-auto scrollbar-hide pb-4">
                                {results.map((item, i) => <MangaCard key={item.id} item={item} index={i} />)}
                            </div>
                        </>
                    )}

                    {!loading && query.length >= 2 && results.length === 0 && (
                        <div className="text-center py-16">
                            <i className="ri-search-line text-4xl text-white/10 block mb-3" />
                            <p className="text-white/25 text-sm">Sin resultados para "{query}"</p>
                        </div>
                    )}

                    {!query && (
                        <p className="text-center text-white/15 text-sm pt-8">
                            Busca entre miles de mangas originales japoneses
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
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                                w-[600px] h-[400px] bg-orange-600/[0.06] blur-[160px] rounded-full" />
            </div>
            <motion.div
                className="max-w-lg w-full text-center relative"
                initial={{ opacity: 0, y: 32 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
                <div className="w-20 h-20 mx-auto mb-8 rounded-2xl
                                bg-gradient-to-br from-orange-500/20 to-rose-600/20
                                border border-orange-500/15
                                flex items-center justify-center
                                shadow-[0_0_60px_rgba(249,115,22,0.12)]">
                    <i className="ri-book-2-fill text-4xl text-orange-400" />
                </div>

                <h1 className="text-4xl font-black text-white mb-3"
                    style={{ fontFamily: "'Bebas Neue', Impact, sans-serif" }}>
                    Nova Manga
                </h1>
                <p className="text-white/40 text-base leading-relaxed mb-6">
                    {isLoggedIn
                        ? 'Manga es una función exclusiva de Nova+. Activa tu plan para acceder a miles de títulos originales japoneses.'
                        : 'Inicia sesión y activa Nova+ para acceder a miles de mangas originales japoneses.'}
                </p>

                <div className="flex items-center justify-center gap-3 mb-8">
                    <span className="flex items-center gap-1.5 px-4 py-2 rounded-full
                                     bg-cyan-500/10 border border-cyan-400/20
                                     text-cyan-300 text-sm font-bold">
                        <i className="ri-vip-crown-fill" /> Exclusivo Nova+
                    </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        onClick={() => navigate('/plans')}
                        className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl
                                   bg-gradient-to-r from-orange-500 to-rose-500
                                   text-white font-black text-base
                                   hover:brightness-110 transition-all
                                   shadow-[0_8px_32px_rgba(249,115,22,0.3)]">
                        <i className="ri-vip-crown-fill" />
                        Ver planes
                    </button>
                    <button
                        onClick={() => navigate(-1)}
                        className="px-6 py-4 rounded-xl bg-white/[0.05] border border-white/[0.08]
                                   text-white font-semibold hover:bg-white/[0.09] transition-colors">
                        Volver
                    </button>
                </div>
            </motion.div>
        </main>
    );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Comics() {
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const { canAccessComics } = usePlan();

    const [sections,   setSections]   = useState<Section[]>([]);
    const [featured,   setFeatured]   = useState<MangaItem | null>(null);
    const [loading,    setLoading]    = useState(true);
    const [searchOpen, setSearchOpen] = useState(false);
    const [heroBg,     setHeroBg]     = useState('');

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

    if (!authLoading && (!user || !canAccessComics)) {
        return <ComicsGate isLoggedIn={!!user} />;
    }

    return (
        <main className="min-h-screen bg-[#030305] text-white overflow-x-hidden">

            {/* ── Ambient glows ── */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-0">
                <div className="absolute -top-[15%] right-[0%]    w-[50%] h-[45%] bg-rose-600/[0.055]   blur-[180px] rounded-full" />
                <div className="absolute  top-[35%]  left-[-10%]  w-[45%] h-[40%] bg-violet-700/[0.045] blur-[160px] rounded-full" />
                <div className="absolute  bottom-[0] right-[-5%]  w-[38%] h-[32%] bg-orange-600/[0.045] blur-[140px] rounded-full" />
            </div>

            {/* ── Hero ── */}
            <section className="relative h-[82vh] min-h-[560px] overflow-hidden">

                {/* Blurred background */}
                {heroBg && (
                    <div className="absolute inset-0">
                        <img src={heroBg} alt=""
                            className="w-full h-full object-cover object-top scale-[1.12]"
                            style={{ filter: 'brightness(0.18) saturate(1.8) blur(28px)' }}
                        />
                    </div>
                )}

                {/* Gradient layers */}
                <div className="absolute inset-0 bg-gradient-to-b  from-[#030305]/85 via-[#030305]/15 to-[#030305]" />
                <div className="absolute inset-0 bg-gradient-to-r  from-[#030305]   via-[#030305]/75 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-tr from-[#030305]/40 to-transparent" />

                {/* Top bar */}
                <div className="absolute top-0 left-0 right-0 flex items-center justify-between
                                px-6 md:px-14 pt-8 z-20">
                    <div className="flex items-center gap-2.5">
                        <NovaLogo className="w-6 h-6 opacity-70" />
                        <div className="leading-none">
                            <span className="block text-[10px] font-black text-white/40 tracking-[0.25em] uppercase">NOVA</span>
                            <span className="block text-[9px] text-orange-400/60 font-bold tracking-[0.18em] uppercase -mt-0.5">Manga</span>
                        </div>
                    </div>

                    <button onClick={() => setSearchOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-full
                                   bg-white/[0.07] border border-white/[0.08] backdrop-blur-sm
                                   text-white/50 text-sm
                                   hover:text-white hover:bg-white/[0.12] hover:border-orange-500/30
                                   transition-all duration-200">
                        <i className="ri-search-line text-sm" />
                        <span className="hidden sm:inline text-xs tracking-wide">Buscar manga</span>
                        <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded
                                       bg-white/[0.06] text-[10px] text-white/25 font-mono">⌘K</kbd>
                    </button>
                </div>

                {/* Hero content */}
                <div className="absolute inset-0 flex items-center px-6 md:px-14 pt-24">
                    <div className="w-full flex items-center justify-between gap-10">

                        {/* Left — text */}
                        <div className="max-w-lg flex-1">
                            {featured ? (
                                <motion.div
                                    initial={{ opacity: 0, x: -28 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
                                >
                                    {/* Badges */}
                                    <div className="flex items-center gap-2 mb-5 flex-wrap">
                                        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full
                                                         bg-orange-500/15 border border-orange-500/25
                                                         text-orange-300 text-[10px] font-black uppercase tracking-widest">
                                            <i className="ri-sparkling-fill" /> Destacado
                                        </span>
                                        <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest
                                            ${featured.status === 'ongoing'
                                                ? 'bg-emerald-500/15 border border-emerald-500/25 text-emerald-300'
                                                : 'bg-gray-500/15 border border-gray-500/20 text-gray-400'}`}>
                                            {featured.status === 'ongoing' ? '● Activo' : '✓ Completo'}
                                        </span>
                                        <span className="px-3 py-1.5 rounded-full
                                                         bg-rose-500/15 border border-rose-500/25
                                                         text-rose-300 text-[10px] font-black uppercase tracking-widest">
                                            Manga
                                        </span>
                                    </div>

                                    {/* Title */}
                                    <h1 className="text-5xl md:text-[5.5rem] font-black leading-[0.88]
                                                   tracking-tighter mb-4 text-white"
                                        style={{
                                            fontFamily: "'Bebas Neue', Impact, sans-serif",
                                            textShadow: '0 2px 40px rgba(0,0,0,0.9)',
                                        }}>
                                        {featured.title}
                                    </h1>

                                    {/* Genre tags */}
                                    {featured.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {featured.tags.map(tag => (
                                                <span key={tag}
                                                    className="px-2.5 py-1 rounded-lg
                                                               bg-white/[0.07] border border-white/[0.07]
                                                               text-white/50 text-xs font-semibold backdrop-blur">
                                                    {tag}
                                                </span>
                                            ))}
                                            {featured.year && (
                                                <span className="px-2.5 py-1 rounded-lg
                                                                 bg-white/[0.07] border border-white/[0.07]
                                                                 text-white/35 text-xs">
                                                    {featured.year}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {/* Description */}
                                    {featured.description && (
                                        <p className="text-white/45 text-sm leading-relaxed line-clamp-3 mb-7 max-w-md">
                                            {featured.description}
                                        </p>
                                    )}

                                    {/* CTAs */}
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => navigate(`/comics/${featured.id}`)}
                                            className="flex items-center gap-2.5 px-7 py-3.5 rounded-xl
                                                       bg-gradient-to-r from-orange-500 to-rose-500
                                                       text-white font-black text-sm tracking-wide
                                                       shadow-[0_8px_32px_rgba(249,115,22,0.4)]
                                                       hover:shadow-[0_12px_44px_rgba(249,115,22,0.55)]
                                                       hover:scale-[1.03] active:scale-[0.97]
                                                       transition-all duration-200">
                                            <i className="ri-book-open-fill text-base" />
                                            Leer ahora
                                        </button>
                                        <button
                                            onClick={() => setSearchOpen(true)}
                                            className="flex items-center gap-2 px-5 py-3.5 rounded-xl
                                                       bg-white/[0.08] border border-white/[0.10]
                                                       text-white/70 font-semibold text-sm
                                                       hover:bg-white/[0.13] hover:text-white
                                                       hover:border-white/[0.18] backdrop-blur-sm
                                                       transition-all duration-200">
                                            <i className="ri-search-line" />
                                            Explorar
                                        </button>
                                    </div>
                                </motion.div>
                            ) : (
                                /* Skeleton */
                                <div className="space-y-4 animate-pulse">
                                    <div className="flex gap-2">
                                        <div className="h-7 w-24 rounded-full bg-white/[0.07]" />
                                        <div className="h-7 w-20 rounded-full bg-white/[0.05]" />
                                    </div>
                                    <div className="h-20 w-4/5 rounded-xl bg-white/[0.07]" />
                                    <div className="space-y-2">
                                        <div className="h-3 w-full max-w-sm rounded bg-white/[0.05]" />
                                        <div className="h-3 w-3/4 rounded bg-white/[0.04]" />
                                    </div>
                                    <div className="flex gap-3 pt-2">
                                        <div className="h-12 w-36 rounded-xl bg-orange-500/15" />
                                        <div className="h-12 w-28 rounded-xl bg-white/[0.05]" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right — cover image (desktop only) */}
                        {featured && (
                            <motion.div
                                className="hidden lg:block flex-shrink-0"
                                initial={{ opacity: 0, x: 40, scale: 0.9 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1], delay: 0.12 }}
                            >
                                <div className="relative w-52 xl:w-64">
                                    {/* Glow behind cover */}
                                    <div className="absolute -inset-6 bg-gradient-to-b from-orange-500/25 to-rose-500/15 blur-3xl rounded-full" />
                                    <img
                                        src={featured.cover}
                                        alt={featured.title}
                                        className="relative w-full aspect-[2/3] object-cover rounded-2xl
                                                   shadow-[0_32px_80px_rgba(0,0,0,0.85)]
                                                   ring-1 ring-white/[0.12]"
                                    />
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* Bottom fade */}
                <div className="absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-[#030305] to-transparent" />
            </section>

            {/* ── Sections ── */}
            <div className="relative z-10 px-5 md:px-12 pb-28 space-y-12 mt-2">
                {SECTION_DEFS.map((def, i) => (
                    <motion.section
                        key={def.label}
                        initial={{ opacity: 0, y: 28 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-50px' }}
                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    >
                        {/* Header */}
                        <div className="flex items-start justify-between mb-5 gap-4">
                            <div className="flex items-start gap-3">
                                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${def.accent}
                                                flex items-center justify-center shadow-lg flex-shrink-0 mt-0.5`}>
                                    <i className={`${def.icon} text-white text-[15px]`} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2.5">
                                        <h2 className="text-white font-black text-[18px] tracking-tight leading-none">
                                            {def.label}
                                        </h2>
                                        {!loading && sections[i]?.items.length > 0 && (
                                            <span className="text-white/18 text-sm tabular-nums font-medium">
                                                {sections[i].items.length}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-white/28 text-[12px] mt-0.5 font-medium">{def.sub}</p>
                                </div>
                            </div>
                            <a href="https://mangadex.org" target="_blank" rel="noopener noreferrer"
                                className="flex-shrink-0 flex items-center gap-1 text-xs text-white/20
                                           hover:text-orange-400/80 transition-colors font-semibold mt-1.5">
                                Ver todo <i className="ri-external-link-line text-[10px]" />
                            </a>
                        </div>

                        <ScrollRow
                            section={sections[i]}
                            loading={loading || !sections[i]}
                        />
                    </motion.section>
                ))}

                {/* Footer branding */}
                <motion.div
                    className="flex items-center justify-center gap-3 pt-8 border-t border-white/[0.04]"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}>
                    <NovaLogo className="w-4 h-4 opacity-20" />
                    <span className="text-xs text-white/15 font-bold tracking-[0.2em] uppercase">Nova Manga</span>
                    <span className="text-white/10 text-xs">·</span>
                    <span className="text-xs text-white/10">Powered by MangaDex</span>
                </motion.div>
            </div>

            {/* Search overlay */}
            {searchOpen && <SearchOverlay onClose={() => setSearchOpen(false)} />}
        </main>
    );
}
