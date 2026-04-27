import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const MD = 'https://api.mangadex.org';
const MANGA_API = 'https://manga-manwha-scrapper-nova.vercel.app';

interface Chapter {
    id: string;
    chapter: string | null;
    title: string | null;
    pages: number;
    publishAt: string;
    translatedLanguage: string;
}

interface MangaInfo {
    id: string;
    title: string;
    description: string;
    cover: string;
    status: string;
    year: number | null;
    tags: string[];
}

async function fetchMangaInfo(id: string): Promise<MangaInfo | null> {
    try {
        const res = await fetch(`${MD}/manga/${id}?includes[]=cover_art`);
        if (!res.ok) return null;
        const { data } = await res.json();
        const attrs = data.attributes;
        const titleMap = attrs.title || {};
        const descMap = attrs.description || {};
        const coverRel = data.relationships.find((r: any) => r.type === 'cover_art');
        const fileName = coverRel?.attributes?.fileName || '';
        const raw = `https://uploads.mangadex.org/covers/${id}/${fileName}.512.jpg`;
        const cover = `${MANGA_API}/api/proxy-image?url=${encodeURIComponent(raw)}&hd=`;
        const tags = (attrs.tags || []).map((t: any) => t.attributes?.name?.en || '').filter(Boolean).slice(0, 5);
        return {
            id,
            title: titleMap.en || titleMap['ja-ro'] || Object.values(titleMap)[0] || '',
            description: descMap.en || Object.values(descMap)[0] || '',
            cover,
            status: attrs.status || 'unknown',
            year: attrs.year || null,
            tags,
        };
    } catch { return null; }
}

async function fetchChapters(id: string): Promise<Chapter[]> {
    try {
        const res = await fetch(
            `${MD}/manga/${id}/feed?translatedLanguage[]=en&translatedLanguage[]=es&order[chapter]=desc&limit=500&contentRating[]=safe&contentRating[]=suggestive`
        );
        if (!res.ok) return [];
        const { data } = await res.json();
        return (data || [])
            .filter((c: any) => c.attributes.pages > 0)
            .map((c: any) => ({
                id: c.id,
                chapter: c.attributes.chapter,
                title: c.attributes.title,
                pages: c.attributes.pages,
                publishAt: c.attributes.publishAt,
                translatedLanguage: c.attributes.translatedLanguage,
            }));
    } catch { return []; }
}

async function fetchPages(chapterId: string): Promise<string[]> {
    try {
        const res = await fetch(`${MD}/at-home/server/${chapterId}`);
        if (!res.ok) return [];
        const json = await res.json();
        const { chapter, baseUrl } = json;
        const pageFiles = chapter?.data?.length ? chapter.data : (chapter?.dataSaver || []);
        if (!pageFiles.length) return [];
        const quality = chapter?.data?.length ? 'data' : 'data-saver';
        return pageFiles.map((f: string) => {
            const raw = `${baseUrl}/${quality}/${chapter.hash}/${f}`;
            return `${MANGA_API}/api/proxy-image?url=${encodeURIComponent(raw)}&hd=`;
        });
    } catch { return []; }
}

// ── Reader ────────────────────────────────────────────────────────────────────
function Reader({ manga, chapters, initialChapter, onClose }: {
    manga: MangaInfo;
    chapters: Chapter[];
    initialChapter: Chapter;
    onClose: () => void;
}) {
    const [chapter, setChapter] = useState(initialChapter);
    const [pages, setPages] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(0);
    const [mode, setMode] = useState<'scroll' | 'page'>('scroll');
    const [showChapters, setShowChapters] = useState(false);
    const [headerVisible, setHeaderVisible] = useState(true);
    const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const chapterIndex = chapters.findIndex(c => c.id === chapter.id);
    const prevChapter = chapters[chapterIndex + 1] ?? null;
    const nextChapter = chapters[chapterIndex - 1] ?? null;

    const loadChapter = useCallback(async (ch: Chapter) => {
        setLoading(true);
        setPages([]);
        setCurrentPage(0);
        setChapter(ch);
        window.scrollTo(0, 0);
        const p = await fetchPages(ch.id);
        setPages(p);
        setLoading(false);
    }, []);

    useEffect(() => { loadChapter(initialChapter); }, []);

    const showHeader = () => {
        setHeaderVisible(true);
        if (hideTimer.current) clearTimeout(hideTimer.current);
        hideTimer.current = setTimeout(() => setHeaderVisible(false), 3000);
    };

    return (
        <div className="fixed inset-0 bg-[#0a0a0a] z-[100] overflow-y-auto"
            ref={containerRef} onMouseMove={showHeader} onClick={showHeader}>

            {/* Header */}
            <AnimatePresence>
                {headerVisible && (
                    <motion.div
                        initial={{ y: -60, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -60, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/95 to-transparent
                                   backdrop-blur-sm px-4 py-3 flex items-center gap-3"
                    >
                        <button onClick={onClose}
                            className="p-2 rounded-lg bg-white/8 hover:bg-white/15 text-white transition-colors shrink-0">
                            <i className="ri-arrow-left-line text-lg" />
                        </button>

                        <div className="flex-1 min-w-0">
                            <p className="text-white font-bold text-sm truncate">{manga.title}</p>
                            <p className="text-white/40 text-xs">
                                Cap. {chapter.chapter || '?'}
                                {chapter.title ? ` · ${chapter.title}` : ''}
                                {pages.length > 0 && mode === 'page' && ` · ${currentPage + 1}/${pages.length}`}
                            </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            {/* Mode toggle */}
                            <button onClick={() => setMode(m => m === 'scroll' ? 'page' : 'scroll')}
                                className="p-2 rounded-lg bg-white/8 hover:bg-white/15 text-white/70 hover:text-white transition-colors text-xs flex items-center gap-1.5">
                                <i className={mode === 'scroll' ? 'ri-menu-line' : 'ri-book-open-line'} />
                            </button>
                            {/* Chapter list */}
                            <button onClick={e => { e.stopPropagation(); setShowChapters(s => !s); }}
                                className="p-2 rounded-lg bg-white/8 hover:bg-white/15 text-white/70 hover:text-white transition-colors">
                                <i className="ri-list-check text-lg" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Chapter sidebar */}
            <AnimatePresence>
                {showChapters && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-40" onClick={() => setShowChapters(false)} />
                        <motion.div
                            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                            transition={{ type: 'tween', duration: 0.25 }}
                            className="fixed right-0 top-0 bottom-0 w-72 z-50 bg-[#111118] border-l border-white/8
                                       overflow-y-auto"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="px-4 py-5 border-b border-white/8 flex items-center justify-between">
                                <h3 className="text-white font-black text-sm">Capítulos</h3>
                                <button onClick={() => setShowChapters(false)}
                                    className="text-white/40 hover:text-white transition-colors">
                                    <i className="ri-close-line text-xl" />
                                </button>
                            </div>
                            <div className="divide-y divide-white/5">
                                {chapters.map(ch => (
                                    <button key={ch.id}
                                        onClick={() => { loadChapter(ch); setShowChapters(false); }}
                                        className={`w-full px-4 py-3.5 text-left transition-colors
                                            ${ch.id === chapter.id
                                                ? 'bg-orange-500/15 text-orange-300'
                                                : 'hover:bg-white/5 text-white/70 hover:text-white'}`}
                                    >
                                        <p className="text-sm font-semibold">
                                            Cap. {ch.chapter || '?'}
                                            {ch.title ? ` · ${ch.title}` : ''}
                                        </p>
                                        <p className="text-xs text-white/30 mt-0.5 uppercase">{ch.translatedLanguage} · {ch.pages}p</p>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Content */}
            <div className="pt-14 pb-24">
                {loading ? (
                    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-white/30 text-sm">Cargando capítulo...</p>
                    </div>
                ) : pages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-6 text-center">
                        <i className="ri-error-warning-line text-4xl text-white/20" />
                        <p className="text-white/50 text-sm">Este capítulo no está disponible para lectura en línea.</p>
                        <button onClick={() => nextChapter && loadChapter(nextChapter)}
                            className="px-5 py-2.5 rounded-xl bg-orange-500/20 text-orange-300 text-sm font-semibold hover:bg-orange-500/30 transition-colors">
                            Siguiente capítulo
                        </button>
                    </div>
                ) : mode === 'scroll' ? (
                    // Vertical scroll mode
                    <div className="max-w-2xl mx-auto">
                        {pages.map((url, i) => (
                            <img key={i} src={url} alt={`Página ${i + 1}`}
                                className="w-full block" loading="lazy"
                                onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                        ))}
                    </div>
                ) : (
                    // Page-by-page mode
                    <div className="flex flex-col items-center justify-center min-h-[80vh] select-none">
                        <div className="relative max-w-2xl w-full mx-auto px-4">
                            <img src={pages[currentPage]} alt={`Página ${currentPage + 1}`}
                                className="w-full object-contain max-h-[80vh]"
                                onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0.2'; }} />

                            {/* Page nav overlays */}
                            <button onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                                className="absolute left-0 top-0 bottom-0 w-1/3 opacity-0 hover:opacity-100
                                           flex items-center justify-start pl-6 transition-opacity"
                                disabled={currentPage === 0}>
                                <div className="p-3 rounded-full bg-black/60 text-white">
                                    <i className="ri-arrow-left-s-line text-2xl" />
                                </div>
                            </button>
                            <button onClick={() => setCurrentPage(p => Math.min(pages.length - 1, p + 1))}
                                className="absolute right-0 top-0 bottom-0 w-1/3 opacity-0 hover:opacity-100
                                           flex items-center justify-end pr-6 transition-opacity"
                                disabled={currentPage === pages.length - 1}>
                                <div className="p-3 rounded-full bg-black/60 text-white">
                                    <i className="ri-arrow-right-s-line text-2xl" />
                                </div>
                            </button>
                        </div>

                        {/* Page dots / counter */}
                        <div className="flex items-center gap-4 mt-6">
                            <button onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                                disabled={currentPage === 0}
                                className="p-2 rounded-lg bg-white/8 text-white/60 hover:text-white hover:bg-white/15
                                           disabled:opacity-30 transition-all">
                                <i className="ri-arrow-left-s-line text-xl" />
                            </button>
                            <span className="text-white/50 text-sm font-mono">
                                {currentPage + 1} / {pages.length}
                            </span>
                            <button onClick={() => setCurrentPage(p => Math.min(pages.length - 1, p + 1))}
                                disabled={currentPage === pages.length - 1}
                                className="p-2 rounded-lg bg-white/8 text-white/60 hover:text-white hover:bg-white/15
                                           disabled:opacity-30 transition-all">
                                <i className="ri-arrow-right-s-line text-xl" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom nav */}
            <AnimatePresence>
                {headerVisible && (
                    <motion.div
                        initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 60, opacity: 0 }} transition={{ duration: 0.2 }}
                        className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 to-transparent
                                   backdrop-blur-sm px-4 py-4 flex items-center justify-between gap-3"
                    >
                        <button onClick={() => prevChapter && loadChapter(prevChapter)}
                            disabled={!prevChapter}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/8 hover:bg-white/15
                                       text-white/70 hover:text-white text-sm font-semibold transition-all
                                       disabled:opacity-30 disabled:cursor-not-allowed">
                            <i className="ri-skip-back-line" />
                            Anterior
                        </button>

                        <span className="text-white/30 text-xs text-center">
                            Cap. {chapter.chapter || '?'}
                        </span>

                        <button onClick={() => nextChapter && loadChapter(nextChapter)}
                            disabled={!nextChapter}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500/20 hover:bg-orange-500/30
                                       text-orange-300 text-sm font-semibold transition-all
                                       disabled:opacity-30 disabled:cursor-not-allowed">
                            Siguiente
                            <i className="ri-skip-forward-line" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ── Detail Page ───────────────────────────────────────────────────────────────
export default function ComicDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [manga, setManga] = useState<MangaInfo | null>(null);
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [loading, setLoading] = useState(true);
    const [readingChapter, setReadingChapter] = useState<Chapter | null>(null);
    const [langFilter, setLangFilter] = useState<'all' | 'en' | 'es'>('all');

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        Promise.all([fetchMangaInfo(id), fetchChapters(id)]).then(([info, chs]) => {
            setManga(info);
            setChapters(chs);
            setLoading(false);
        });
    }, [id]);

    if (readingChapter && manga) {
        const filteredChapters = langFilter === 'all'
            ? chapters
            : chapters.filter(c => c.translatedLanguage === langFilter);
        return (
            <Reader
                manga={manga}
                chapters={filteredChapters.length ? filteredChapters : chapters}
                initialChapter={readingChapter}
                onClose={() => setReadingChapter(null)}
            />
        );
    }

    const filteredChapters = langFilter === 'all'
        ? chapters
        : chapters.filter(c => c.translatedLanguage === langFilter);

    const langs = [...new Set(chapters.map(c => c.translatedLanguage))];

    return (
        <div className="min-h-screen bg-[#07070f] text-white">
            <div className="px-6 md:px-12 pt-24">
                <button onClick={() => navigate('/comics')}
                    className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm mb-10">
                    <i className="ri-arrow-left-line" /> Comics
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-40">
                    <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : !manga ? (
                <div className="text-center py-40 text-white/30">No encontrado</div>
            ) : (
                <>
                    {/* Hero */}
                    <div className="px-6 md:px-12 pb-16">
                        <div className="flex flex-col md:flex-row gap-10 items-start">
                            {/* Cover */}
                            <div className="shrink-0 w-36 md:w-48">
                                <div className="aspect-[2/3] rounded-2xl overflow-hidden ring-1 ring-white/10 shadow-2xl">
                                    <img src={manga.cover} alt={manga.title} className="w-full h-full object-cover object-top" />
                                </div>
                            </div>

                            {/* Info */}
                            <div className="flex-1 pt-2">
                                <h1 className="text-3xl md:text-5xl font-black leading-tight mb-4 tracking-tight">
                                    {manga.title}
                                </h1>
                                <div className="flex flex-wrap items-center gap-2 mb-5">
                                    {manga.year && (
                                        <span className="text-white/35 text-sm">{manga.year}</span>
                                    )}
                                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wide
                                        ${manga.status === 'ongoing'
                                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                                            : 'bg-white/8 text-white/40 border border-white/10'}`}>
                                        {manga.status === 'ongoing' ? 'En curso' : 'Completado'}
                                    </span>
                                    {manga.tags.map(t => (
                                        <span key={t}
                                            className="text-xs px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-300
                                                       border border-orange-500/15 font-medium">
                                            {t}
                                        </span>
                                    ))}
                                </div>
                                {manga.description && (
                                    <p className="text-white/45 text-sm leading-relaxed line-clamp-3 max-w-xl mb-7">
                                        {manga.description}
                                    </p>
                                )}
                                {chapters.length > 0 && (
                                    <button onClick={() => setReadingChapter(chapters[chapters.length - 1])}
                                        className="flex items-center gap-2.5 px-7 py-3.5 rounded-xl
                                                   bg-gradient-to-r from-orange-500 to-pink-500
                                                   text-white font-black text-sm
                                                   shadow-[0_8px_32px_rgba(251,146,60,0.3)]
                                                   hover:shadow-[0_8px_40px_rgba(251,146,60,0.5)]
                                                   hover:scale-[1.02] active:scale-95 transition-all duration-200">
                                        <i className="ri-play-fill text-base" />
                                        Leer desde el principio
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Chapter list */}
                    <div className="border-t border-white/6">
                        <div className="px-6 md:px-12 py-8">
                            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                                <h2 className="text-lg font-black text-white">
                                    {filteredChapters.length} capítulos
                                </h2>
                                {/* Language filter */}
                                {langs.length > 1 && (
                                    <div className="flex items-center gap-1.5 bg-white/5 rounded-xl p-1">
                                        {(['all', ...langs] as string[]).slice(0, 4).map(l => (
                                            <button key={l}
                                                onClick={() => setLangFilter(l as any)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all
                                                    ${langFilter === l
                                                        ? 'bg-orange-500 text-white shadow'
                                                        : 'text-white/40 hover:text-white'}`}>
                                                {l === 'all' ? 'Todo' : l}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {filteredChapters.length === 0 ? (
                                <p className="text-white/25 text-sm py-12 text-center">
                                    No hay capítulos en este idioma.
                                </p>
                            ) : (
                                <div className="rounded-2xl border border-white/8 overflow-hidden divide-y divide-white/6">
                                    {filteredChapters.map((ch, i) => (
                                        <motion.button key={ch.id}
                                            onClick={() => setReadingChapter(ch)}
                                            whileHover={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
                                            className="w-full flex items-center justify-between px-5 py-4
                                                       bg-transparent text-left group transition-colors">
                                            <div className="flex items-center gap-4">
                                                <span className="text-white/15 font-mono text-xs w-6 text-right shrink-0">
                                                    {filteredChapters.length - i}
                                                </span>
                                                <div>
                                                    <p className="text-white/85 font-semibold text-sm group-hover:text-white transition-colors">
                                                        Capítulo {ch.chapter || '?'}
                                                        {ch.title ? <span className="text-white/40 font-normal"> · {ch.title}</span> : null}
                                                    </p>
                                                    <p className="text-white/25 text-xs mt-0.5 flex items-center gap-2">
                                                        <span>{ch.pages} páginas</span>
                                                        <span className="uppercase font-bold">{ch.translatedLanguage}</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <i className="ri-play-circle-line text-xl text-white/20 group-hover:text-orange-400 transition-colors shrink-0" />
                                        </motion.button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
