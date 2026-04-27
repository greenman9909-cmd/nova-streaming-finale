import { useEffect, useState } from 'react';
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
    } catch {
        return null;
    }
}

async function fetchChapters(id: string): Promise<Chapter[]> {
    try {
        const res = await fetch(
            `${MD}/manga/${id}/feed?translatedLanguage[]=en&translatedLanguage[]=es&order[chapter]=desc&limit=100&contentRating[]=safe&contentRating[]=suggestive`
        );
        if (!res.ok) return [];
        const { data } = await res.json();
        return (data || []).map((c: any) => ({
            id: c.id,
            chapter: c.attributes.chapter,
            title: c.attributes.title,
            pages: c.attributes.pages,
            publishAt: c.attributes.publishAt,
            translatedLanguage: c.attributes.translatedLanguage,
        }));
    } catch {
        return [];
    }
}

async function fetchPages(chapterId: string): Promise<string[]> {
    try {
        const res = await fetch(`${MD}/at-home/server/${chapterId}`);
        if (!res.ok) return [];
        const { chapter, baseUrl } = await res.json();
        return (chapter.data || []).map((f: string) => {
            const raw = `${baseUrl}/data/${chapter.hash}/${f}`;
            return `${MANGA_API}/api/proxy-image?url=${encodeURIComponent(raw)}&hd=`;
        });
    } catch {
        return [];
    }
}

export default function ComicDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [manga, setManga] = useState<MangaInfo | null>(null);
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [loading, setLoading] = useState(true);
    const [readingChapter, setReadingChapter] = useState<Chapter | null>(null);
    const [pages, setPages] = useState<string[]>([]);
    const [pagesLoading, setPagesLoading] = useState(false);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        Promise.all([fetchMangaInfo(id), fetchChapters(id)]).then(([info, chs]) => {
            setManga(info);
            setChapters(chs);
            setLoading(false);
        });
    }, [id]);

    const openChapter = async (chapter: Chapter) => {
        setReadingChapter(chapter);
        setPagesLoading(true);
        const p = await fetchPages(chapter.id);
        setPages(p);
        setPagesLoading(false);
        window.scrollTo(0, 0);
    };

    if (readingChapter) {
        return (
            <div className="min-h-screen bg-black">
                {/* Reader header */}
                <div className="sticky top-0 z-50 bg-black/90 backdrop-blur border-b border-white/10 px-4 py-3 flex items-center gap-4">
                    <button onClick={() => { setReadingChapter(null); setPages([]); }}
                        className="text-white/70 hover:text-white transition-colors flex items-center gap-2 text-sm">
                        <i className="ri-arrow-left-line text-lg" />
                        Volver
                    </button>
                    <span className="text-white font-bold text-sm truncate">
                        {manga?.title} — Cap. {readingChapter.chapter || '?'}
                        {readingChapter.title ? ` · ${readingChapter.title}` : ''}
                    </span>
                </div>

                {/* Pages */}
                <div className="max-w-2xl mx-auto px-2 py-4">
                    {pagesLoading ? (
                        <div className="flex items-center justify-center py-32">
                            <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : pages.length === 0 ? (
                        <div className="text-center py-32 text-white/40">
                            No se pudieron cargar las páginas
                        </div>
                    ) : (
                        pages.map((url, i) => (
                            <img key={i} src={url} alt={`Página ${i + 1}`}
                                className="w-full block" loading="lazy" />
                        ))
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#07070f] text-white">
            {/* Back */}
            <div className="px-6 md:px-12 pt-24 pb-4">
                <button onClick={() => navigate('/comics')}
                    className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm mb-8">
                    <i className="ri-arrow-left-line" /> Volver a Comics
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-32">
                    <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : !manga ? (
                <div className="text-center py-32 text-white/40">No se encontró el manga</div>
            ) : (
                <>
                    {/* Info */}
                    <div className="px-6 md:px-12 pb-12 flex flex-col md:flex-row gap-8">
                        <img src={manga.cover} alt={manga.title}
                            className="w-40 md:w-52 aspect-[2/3] object-cover rounded-2xl shrink-0 self-start" />
                        <div className="flex-1">
                            <h1 className="text-3xl md:text-4xl font-black mb-3">{manga.title}</h1>
                            <div className="flex flex-wrap gap-2 mb-4">
                                {manga.year && <span className="text-white/40 text-sm">{manga.year}</span>}
                                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${manga.status === 'ongoing' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'}`}>
                                    {manga.status === 'ongoing' ? 'En curso' : 'Completado'}
                                </span>
                                {manga.tags.map(t => (
                                    <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-300 border border-orange-500/20">{t}</span>
                                ))}
                            </div>
                            {manga.description && (
                                <p className="text-white/50 text-sm leading-relaxed line-clamp-4 max-w-xl">{manga.description}</p>
                            )}
                        </div>
                    </div>

                    {/* Chapters */}
                    <div className="px-6 md:px-12 pb-24">
                        <h2 className="text-lg font-black mb-4 text-white/80">
                            Capítulos <span className="text-white/30 font-normal text-sm">({chapters.length})</span>
                        </h2>
                        {chapters.length === 0 ? (
                            <p className="text-white/30 text-sm">No hay capítulos disponibles en inglés o español.</p>
                        ) : (
                            <div className="divide-y divide-white/6 rounded-2xl border border-white/8 overflow-hidden">
                                {chapters.map(ch => (
                                    <button key={ch.id} onClick={() => openChapter(ch)}
                                        className="w-full flex items-center justify-between px-5 py-4
                                                   bg-white/[0.02] hover:bg-white/[0.06] transition-colors text-left group">
                                        <div>
                                            <span className="text-white font-semibold text-sm group-hover:text-orange-300 transition-colors">
                                                Capítulo {ch.chapter || '?'}
                                                {ch.title ? ` — ${ch.title}` : ''}
                                            </span>
                                            <div className="flex items-center gap-3 mt-0.5">
                                                <span className="text-white/30 text-xs">{ch.pages} páginas</span>
                                                <span className="text-white/20 text-xs uppercase font-bold">{ch.translatedLanguage}</span>
                                            </div>
                                        </div>
                                        <i className="ri-book-open-line text-white/30 group-hover:text-orange-400 transition-colors text-lg" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
