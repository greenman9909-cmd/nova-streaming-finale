import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMovieVideos, getSeriesVideos } from '../services/api';
import { getStreams } from '../services/sportsService';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

interface ContentCardProps {
    id: string | number;
    title: string;
    image: string;
    type?: string;
    year?: string;
    link?: string;
    badge?: string;
    isLive?: boolean;
    tmdbId?: number;
    mediaType?: 'movie' | 'tv';
    variant?: 'portrait' | 'landscape';
    teams?: {
        home?: { name: string; badge?: string };
        away?: { name: string; badge?: string };
    };
    category?: string;
}

const SPORT_GRADIENTS: Record<string, string> = {
    football:         'from-emerald-900 to-green-950',
    soccer:           'from-emerald-900 to-green-950',
    basketball:       'from-orange-900 to-amber-950',
    tennis:           'from-lime-900 to-green-950',
    cricket:          'from-blue-900 to-cyan-950',
    baseball:         'from-red-900 to-rose-950',
    hockey:           'from-sky-900 to-blue-950',
    boxing:           'from-red-950 to-rose-950',
    mma:              'from-red-950 to-rose-950',
    fight:            'from-red-950 to-rose-950',
    'motor-sports':   'from-red-900 to-orange-950',
    motorsport:       'from-red-900 to-orange-950',
    f1:               'from-red-900 to-orange-950',
    golf:             'from-green-900 to-emerald-950',
    rugby:            'from-green-900 to-teal-950',
    darts:            'from-purple-900 to-violet-950',
    nfl:              'from-blue-900 to-indigo-950',
    'american-football': 'from-blue-900 to-indigo-950',
};

const SPORT_ICONS: Record<string, string> = {
    football: 'ri-football-line', soccer: 'ri-football-line',
    basketball: 'ri-basketball-line', tennis: 'ri-ping-pong-line',
    cricket: 'ri-cricket-line', baseball: 'ri-baseball-line',
    hockey: 'ri-hockey-line', golf: 'ri-golf-line',
    boxing: 'ri-boxing-line', mma: 'ri-boxing-line', fight: 'ri-boxing-line',
    'motor-sports': 'ri-speed-line', motorsport: 'ri-speed-line', f1: 'ri-speed-line',
    rugby: 'ri-football-line', darts: 'ri-focus-3-line',
    nfl: 'ri-football-line', 'american-football': 'ri-football-line',
};

const trailerCache = new Map<string, string>();
const MAX_TRAILER_CACHE = 200;

const trimTrailerCache = () => {
    while (trailerCache.size > MAX_TRAILER_CACHE) {
        const firstKey = trailerCache.keys().next().value as string | undefined;
        if (!firstKey) return;
        trailerCache.delete(firstKey);
    }
};

export default function ContentCard(props: ContentCardProps) {
    const { id, title, image, type, year, link, badge: _badge, isLive, tmdbId, mediaType, variant = 'portrait', teams, category } = props;
    const { addToWatchlist, removeFromWatchlist, isInWatchlist, user } = useAuth();
    const { t } = useSettings();
    const navigate = useNavigate();
    const [imgError, setImgError] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [trailerUrl, setTrailerUrl] = useState<string | null>(null);
    const [isVerifyingSports, setIsVerifyingSports] = useState(false);
    const [sportsError, setSportsError] = useState<string | null>(null);
    const [wlBusy, setWlBusy] = useState(false);
    const [wlFlash, setWlFlash] = useState<'added' | 'removed' | 'error' | null>(null);
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const fadeOutTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isMountedRef = useRef(true);

    // Normalised id used for watchlist lookups
    const numericId = tmdbId || parseInt(String(id), 10);
    const mediaId = String(id);
    const inWatchlist = isInWatchlist(numericId) || isInWatchlist(mediaId);

    const toggleWatchlist = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!user) {
            window.location.href = '/login';
            return;
        }
        if (wlBusy) return;
        setWlBusy(true);
        try {
            if (inWatchlist) {
                const ok = await removeFromWatchlist(mediaId);
                setWlFlash(ok ? 'removed' : 'error');
            } else {
                const ok = await addToWatchlist({
                    id: numericId,
                    title,
                    category: mediaType === 'movie' ? 'Movie' : 'Series',
                    image,
                    type: mediaType || 'tv',
                    mediaId,
                    addedAt: Date.now(),
                });
                setWlFlash(ok ? 'added' : 'error');
            }
        } finally {
            setTimeout(() => setWlFlash(null), 1400);
            if (isMountedRef.current) setWlBusy(false);
        }
    };

    const handleMouseEnter = () => {
        setIsHovered(true);
        if (fadeOutTimeoutRef.current) clearTimeout(fadeOutTimeoutRef.current);

        hoverTimeoutRef.current = setTimeout(async () => {
            if (tmdbId && mediaType && !trailerUrl && type !== 'Sports') {
                const cacheKey = `${mediaType}:${tmdbId}`;
                const cached = trailerCache.get(cacheKey);
                if (cached) {
                    if (isMountedRef.current) setTrailerUrl(cached);
                    return;
                }
                try {
                    const fetchVideos = mediaType === 'movie' ? getMovieVideos : getSeriesVideos;
                    const videos = await fetchVideos(tmdbId);
                    const trailer = videos.find((v: any) => v.site === 'YouTube' && v.type === 'Trailer');
                    if (trailer) {
                        const url = `https://www.youtube-nocookie.com/embed/${trailer.key}?autoplay=1&mute=1&controls=0&modestbranding=1&loop=1&playlist=${trailer.key}&playsinline=1`;
                        trailerCache.set(cacheKey, url);
                        trimTrailerCache();
                        if (isMountedRef.current) setTrailerUrl(url);
                    }
                } catch (err) {
                    console.error('Hover trailer fetch failed:', err);
                }
            }
        }, 700);
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        if (trailerUrl) {
            fadeOutTimeoutRef.current = setTimeout(() => { setTrailerUrl(null); }, 700);
        }
    };

    useEffect(() => {
        return () => {
            isMountedRef.current = false;
            if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
            if (fadeOutTimeoutRef.current) clearTimeout(fadeOutTimeoutRef.current);
        };
    }, []);

    const handleSportsVerify = async (e: MouseEvent<HTMLAnchorElement>) => {
        if (type !== 'Sports' || !link || !link.includes('/deportes/watch/')) return;
        if (isVerifyingSports) { e.preventDefault(); return; }
        e.preventDefault();
        setSportsError(null);
        setIsVerifyingSports(true);
        try {
            const url = new URL(link, window.location.origin);
            const parts = url.pathname.split('/').filter(Boolean);
            const watchIdx = parts.findIndex((p) => p === 'watch');
            const source = parts[watchIdx + 1];
            const streamId = parts[watchIdx + 2];
            if (!source || !streamId) { navigate('/deportes'); return; }
            const streams = await getStreams(source, streamId);
            if (streams && streams.length > 0) { navigate(link); return; }
            setSportsError('No hay streams activos. Intenta mas tarde.');
        } catch (err) {
            console.error('Sports pre-verify failed:', err);
            setSportsError('No hay streams activos. Intenta mas tarde.');
        } finally {
            setIsVerifyingSports(false);
            if (isMountedRef.current) setTimeout(() => setSportsError(null), 2200);
        }
    };

    return (
        <Link
            to={link || `/watch/${mediaType || 'tv'}/${id}`}
            className={`group block flex-shrink-0 transition-all duration-300 z-10 hover:z-50 ${variant === 'landscape' ? 'w-[240px] md:w-[320px]' : 'w-[140px] md:w-[192px]'}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={handleSportsVerify}
        >
            {/* ── Sports card ────────────────────────────────────────────────── */}
            {type === 'Sports' && teams ? (
                <div className="relative aspect-video w-64 md:w-80 rounded-xl overflow-hidden mb-2 bg-[#0F0F13] transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] border border-white/5 group-hover:border-emerald-500/50">
                    {isLive && (
                        <div className="absolute top-3 left-3 flex items-center gap-1.5 z-30 px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-bold shadow-lg shadow-red-600/20 animate-pulse">
                            <span className="w-1.5 h-1.5 bg-white rounded-full" />
                            LIVE
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/40 to-black z-0" />
                    <div className="absolute inset-0 bg-black/40 z-0" />
                    <div className="absolute inset-0 z-10 flex items-center justify-between px-6">
                        <div className="flex flex-col items-center gap-2 w-1/3">
                            <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white/10 p-2 flex items-center justify-center backdrop-blur-sm border border-white/10">
                                {teams.home?.badge ? (
                                    <img src={`${import.meta.env.VITE_API_URL || ""}/api/sports/images/badge/${teams.home.badge}.webp`} alt={teams.home.name} className="w-full h-full object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
                                ) : (
                                    <span className="text-xl font-bold text-white">{teams.home?.name?.[0]}</span>
                                )}
                            </div>
                            <span className="text-[10px] md:text-xs font-bold text-white text-center leading-tight line-clamp-2">{teams.home?.name || 'Home'}</span>
                        </div>
                        <div className="flex flex-col items-center justify-center">
                            <span className="text-xl md:text-2xl font-black italic text-white/20">VS</span>
                            {isLive && <span className="text-[10px] text-emerald-400 font-mono mt-1">45:00</span>}
                        </div>
                        <div className="flex flex-col items-center gap-2 w-1/3">
                            <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white/10 p-2 flex items-center justify-center backdrop-blur-sm border border-white/10">
                                {teams.away?.badge ? (
                                    <img src={`${import.meta.env.VITE_API_URL || ""}/api/sports/images/badge/${teams.away.badge}.webp`} alt={teams.away.name} className="w-full h-full object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
                                ) : (
                                    <span className="text-xl font-bold text-white">{teams.away?.name?.[0]}</span>
                                )}
                            </div>
                            <span className="text-[10px] md:text-xs font-bold text-white text-center leading-tight line-clamp-2">{teams.away?.name || 'Away'}</span>
                        </div>
                    </div>
                    <div className={`absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'} z-20`}>
                        <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/50">
                            <i className="ri-play-fill text-white text-2xl ml-1" />
                        </div>
                    </div>
                    {(isVerifyingSports || sportsError) && (
                        <div className="absolute inset-0 z-40 bg-black/70 backdrop-blur-sm flex items-center justify-center text-center px-4">
                            <div className="text-white text-xs font-bold uppercase tracking-widest">
                                {sportsError ? sportsError : 'Verificando streams...'}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                /* ── Standard card ──────────────────────────────────────────────── */
                <div className={`relative ${variant === 'landscape' ? 'aspect-video' : 'aspect-[2/3]'} w-full rounded-xl overflow-hidden bg-[#18181b] transition-all duration-400 ease-out ${isHovered ? 'shadow-[0_8px_40px_rgba(0,0,0,0.6),0_0_20px_rgba(255,255,255,0.05)] ring-1 ring-white/15 scale-[1.05]' : ''}`}>

                    {/* ── Always-visible Watchlist Bookmark ─────────────────────── */}
                    <button
                        onClick={toggleWatchlist}
                        title={inWatchlist ? 'Quitar de mi lista' : 'Añadir a mi lista'}
                        aria-pressed={inWatchlist}
                        aria-label={inWatchlist ? 'Quitar de mi lista' : 'Añadir a mi lista'}
                        disabled={wlBusy}
                        className={`absolute top-1.5 right-1.5 z-30 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 shadow-md border
                            ${inWatchlist
                                ? 'bg-violet-600 text-white border-violet-400/60 shadow-violet-500/40'
                                : 'bg-black/55 backdrop-blur-sm text-white border-white/20 hover:bg-violet-600 hover:border-violet-400/60 hover:shadow-violet-500/40'
                            }
                            ${wlBusy ? 'opacity-60 cursor-wait' : ''}`}
                    >
                        {wlBusy ? (
                            <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                            </svg>
                        ) : inWatchlist ? (
                            <i className="ri-bookmark-fill text-xs" />
                        ) : (
                            <i className="ri-bookmark-line text-xs" />
                        )}
                    </button>
                    {wlFlash && (
                        <span className={`
                            absolute -top-7 right-2 z-40
                            text-[9px] font-bold px-2 py-0.5 rounded
                            animate-fade-in pointer-events-none
                            ${wlFlash === 'added' ? 'bg-emerald-500 text-white' : wlFlash === 'removed' ? 'bg-zinc-700 text-white' : 'bg-red-500 text-white'}
                        `}>
                            {wlFlash === 'added' ? '✓ Guardado' : wlFlash === 'removed' ? 'Eliminado' : 'Error'}
                        </span>
                    )}

                    {/* ── Image ─────────────────────────────────────────────────── */}
                    {!imgError ? (
                        <>
                            <img
                                src={image}
                                alt={title}
                                className={`w-full h-full object-cover transition-opacity duration-700 ${(isHovered && trailerUrl) ? 'opacity-0' : 'opacity-100'}`}
                                loading="lazy"
                                decoding="async"
                                fetchPriority="low"
                                onError={() => setImgError(true)}
                            />
                            {trailerUrl && (
                                <div className={`absolute inset-0 z-0 bg-black overflow-hidden transition-opacity duration-700 pointer-events-none ${(isHovered && trailerUrl) ? 'opacity-100' : 'opacity-0'}`}>
                                    <iframe
                                        src={trailerUrl}
                                        className="w-[150%] h-[150%] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-80"
                                        title={`${title} Trailer`}
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
                                    <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] z-10 pointer-events-none" />
                                </div>
                            )}
                        </>
                    ) : type === 'Sports' ? (
                        /* ── Sports fallback — sport-specific gradient + icon ── */
                        <div className={`w-full h-full flex flex-col items-center justify-center bg-gradient-to-br ${SPORT_GRADIENTS[(category || '').toLowerCase()] || 'from-slate-800 to-slate-900'} p-3 gap-2`}>
                            <i className={`${SPORT_ICONS[(category || '').toLowerCase()] || 'ri-trophy-line'} text-3xl text-white/25`} />
                            <span className="text-[9px] font-bold uppercase tracking-widest text-white/30 text-center line-clamp-2">{title}</span>
                            {isLive && (
                                <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-red-600 text-white text-[9px] font-bold tracking-wide animate-pulse">
                                    LIVE
                                </span>
                            )}
                        </div>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800 text-gray-500 p-3">
                            <i className="ri-film-line text-3xl" />
                        </div>
                    )}

                    {/* ── Hover Overlay Controls ─────────────────────────────────── */}
                    {isHovered && (
                        <div className="absolute inset-0 z-20 flex flex-col justify-between p-3.5 bg-gradient-to-t from-black/95 via-black/50 to-black/10 animate-fade-in text-left">
                            <div className="self-end">
                                <div className="w-7 h-7 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/10">
                                    <i className="ri-volume-mute-line text-xs" />
                                </div>
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-sm leading-tight mb-1 drop-shadow-md line-clamp-2">{title}</h3>
                                <div className="flex items-center gap-1.5 mb-3">
                                    <i className="ri-checkbox-circle-fill text-[#00A8E1] text-xs" />
                                    <span className="text-[10px] font-bold text-gray-200">{t('contentCard.includedWithNovaPlus')}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(link || `/watch/${mediaType || 'tv'}/${id}`); }}
                                        className="flex-1 bg-white text-black py-2 rounded-lg flex items-center justify-center gap-1.5 hover:bg-gray-100 transition-all duration-200 shadow-[0_2px_10px_rgba(255,255,255,0.15)]"
                                    >
                                        <i className="ri-play-fill text-lg" />
                                        <span className="font-bold text-[10px] uppercase tracking-wide">{t('contentCard.play')}</span>
                                    </button>
                                    <button
                                        onClick={toggleWatchlist}
                                        aria-pressed={inWatchlist}
                                        aria-label={inWatchlist ? 'Quitar de mi lista' : 'Añadir a mi lista'}
                                        disabled={wlBusy}
                                        className={`w-8 h-8 rounded-full border flex items-center justify-center text-white transition-all ${inWatchlist ? 'bg-white border-white text-black' : 'bg-white/10 backdrop-blur border-white/20 hover:bg-white/20'}`}
                                    >
                                        {inWatchlist ? <i className="ri-check-line font-bold" /> : <i className="ri-add-line" />}
                                    </button>
                                    <button
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(link || `/watch/${mediaType || 'tv'}/${id}`); }}
                                        className="w-8 h-8 rounded-full bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all"
                                    >
                                        <i className="ri-information-line" />
                                    </button>
                                </div>
                                <div className="flex items-center gap-2 mt-2 text-[10px] font-medium text-gray-400">
                                    <span className="border border-gray-600 px-1 rounded text-gray-300">{t('contentCard.maturity')}</span>
                                    <span>{year || String(new Date().getFullYear())}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Title Below */}
            {type !== 'Sports' && (
                <div className={`mt-2 h-[2.4rem] transition-opacity duration-300 ${isHovered ? 'opacity-0' : 'opacity-100'}`}>
                    <h3 className="text-[0.8rem] font-semibold text-gray-100 leading-tight line-clamp-2">{title}</h3>
                </div>
            )}
        </Link>
    );
}
