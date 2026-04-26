import { useState, useEffect, useRef, useCallback } from 'react';
import { trackIntercomEvent } from '../components/IntercomProvider';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
    getMovieDetails,
    getSeriesDetails,
    getSeasonEpisodes,
    getImageUrl,
    getMovieVideos,
    getSeriesVideos,
    getMovieRecommendations,
    getSimilarMovies,
    getSimilarSeries,
    TMDBMovie,
    TMDBSeries,
    TMDBSeriesDetails,
    TMDBEpisode,
    TMDBVideo,
} from '../services/api';
import EnhancedPlayer from '../components/EnhancedPlayer';
import { useAuth } from '../context/AuthContext';
import { saveProgress, getLocalProgress, buildResumeUrl, formatTime } from '../utils/watchProgress';
import { usePlan } from '../hooks/usePlan';

export default function MovieWatch() {
    const { type, id } = useParams<{ type: string; id: string }>();
    const { user, loading: authLoading } = useAuth();
    const { canWatch, tier, minutesLeft, recordWatchMinutes } = usePlan();
    const navigate = useNavigate();

    const [content, setContent] = useState<TMDBMovie | TMDBSeriesDetails | null>(null);
    const [episodes, setEpisodes] = useState<TMDBEpisode[]>([]);
    const [selectedSeason, setSelectedSeason] = useState(1);
    const [selectedEpisode, setSelectedEpisode] = useState(1);
    const [loading, setLoading] = useState(true);
    const [embedUrl, setEmbedUrl] = useState('');
    const [selectedServer, setSelectedServer] = useState('vidsrc');
    const [playerReady, setPlayerReady] = useState(false);
    const [playerError, setPlayerError] = useState<string | null>(null);
    const [autoSwitching, setAutoSwitching] = useState(false);
    const [switchingToServer, setSwitchingToServer] = useState<string | null>(null);
    const [effectiveQuality, setEffectiveQuality] = useState('1080p');
    const [triedInternalApi, setTriedInternalApi] = useState(false);
    const [resumeBanner, setResumeBanner] = useState<{ seconds: number; label: string } | null>(null);

    // Theater mode
    const [theaterMode, setTheaterMode] = useState(false);

    // Trailer modal
    const [trailerOpen, setTrailerOpen] = useState(false);
    const [trailerKey, setTrailerKey] = useState<string | null>(null);
    const [trailerLoading, setTrailerLoading] = useState(false);

    // Subtitles / audio panel
    const [subtitlePanelOpen, setSubtitlePanelOpen] = useState(false);

    // Recommendations
    const [recommendations, setRecommendations] = useState<(TMDBMovie | TMDBSeries)[]>([]);

    const SERVER_SWITCH_TIMEOUT_MS = 8000;
    const watchStartRef = useRef<number | null>(null);
    const resumeSecondsRef = useRef<number>(0);
    const ytPlayerRef = useRef<any>(null);
    const trailerContainerRef = useRef<HTMLDivElement>(null);

    const isMovie = type === 'movie';
    const contentId = parseInt(id || '0');

    // Robust embed alternatives â€” only verified working servers
    interface WatchServer {
        id: string;
        name: string;
        url: (id: string, s?: number, e?: number) => string;
    }

    const servers: WatchServer[] = [
        {
            id: 'vidsrc',
            name: 'Server 1',
            url: (id, s, e) =>
                s && e
                    ? `https://vidsrc.me/embed/tv?tmdb=${id}&season=${s}&episode=${e}`
                    : `https://vidsrc.me/embed/movie?tmdb=${id}`
        },
        {
            id: 'vidsrcxyz',
            name: 'Server 2',
            url: (id, s, e) =>
                s && e
                    ? `https://vidsrc.xyz/embed/tv/${id}/${s}/${e}`
                    : `https://vidsrc.xyz/embed/movie/${id}`
        },
        {
            id: 'videasy',
            name: 'Server 3',
            url: (id, s, e) =>
                s && e
                    ? `https://player.videasy.net/tv/${id}/${s}/${e}`
                    : `https://player.videasy.net/movie/${id}`
        },
        {
            id: 'moviesapi',
            name: 'Server 4',
            url: (id, s, e) =>
                s && e
                    ? `https://moviesapi.club/tv/${id}-${s}-${e}`
                    : `https://moviesapi.club/movie/${id}`
        },
        {
            id: 'twoembed',
            name: 'Server 5',
            url: (id, s, e) =>
                s && e
                    ? `https://www.2embed.cc/embedtv/${id}&s=${s}&e=${e}`
                    : `https://www.2embed.cc/embed/${id}`
        },
    ];
    useEffect(() => {
        const fetchContent = async () => {
            if (!contentId) return;
            setLoading(true);
            try {
                if (isMovie) {
                    const movie = await getMovieDetails(contentId);
                    setContent(movie);
                } else {
                    const series = await getSeriesDetails(contentId);
                    setContent(series);
                    if (series) {
                        const seasonCandidates = (series.seasons || [])
                            .map((season) => season.season_number)
                            .filter((seasonNum) => seasonNum > 0);

                        const orderedSeasons = Array.from(new Set([...seasonCandidates, 1]));

                        let resolvedSeason = orderedSeasons[0] || 1;
                        let resolvedEpisodes: TMDBEpisode[] = [];

                        for (const seasonNum of orderedSeasons) {
                            const seasonEpisodes = await getSeasonEpisodes(contentId, seasonNum);
                            if (seasonEpisodes.length > 0) {
                                resolvedSeason = seasonNum;
                                resolvedEpisodes = seasonEpisodes;
                                break;
                            }
                        }

                        if (resolvedEpisodes.length === 0) {
                            resolvedEpisodes = await getSeasonEpisodes(contentId, resolvedSeason);
                        }

                        setSelectedSeason(resolvedSeason);
                        setEpisodes(resolvedEpisodes);
                        setSelectedEpisode(resolvedEpisodes[0]?.episode_number || 1);
                    }
                }
            } catch (error) {
                console.error('Error fetching content:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchContent();
    }, [contentId, type]);

    // Load saved progress from localStorage for resume banner
    useEffect(() => {
        if (!user || !contentId) return;
        const mediaId = isMovie ? `${contentId}` : `${contentId}-s${selectedSeason}-e${selectedEpisode}`;
        const saved = getLocalProgress(user.id, mediaId);
        if (saved && saved.timestampSeconds > 30) {
            resumeSecondsRef.current = saved.timestampSeconds;
            setResumeBanner({ seconds: saved.timestampSeconds, label: formatTime(saved.timestampSeconds) });
        } else {
            resumeSecondsRef.current = 0;
            setResumeBanner(null);
        }
    }, [user?.id, contentId, isMovie, selectedSeason, selectedEpisode]);

    // Dynamic URL generation based on selected server or internal backend
    useEffect(() => {
        if (!contentId) return;

        if (isMovie) {
            const fetchMovieStream = async () => {
                setPlayerReady(false);
                setPlayerError(null);
                setAutoSwitching(false);

                if (!triedInternalApi && selectedServer === 'vidsrc') {
                    try {
                        const controller = new AbortController();
                        const timer = setTimeout(() => controller.abort(), 5000);
                        const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/movies/${contentId}`, { signal: controller.signal });
                        clearTimeout(timer);
                        const data = await res.json();

                        if (data.success && data.sources && data.sources.length > 0) {
                            const source = data.sources.find((s: any) => s.quality === '1080p' || s.quality === 'auto') || data.sources[0];
                            setEmbedUrl(buildResumeUrl(source.url, resumeSecondsRef.current));
                            setTriedInternalApi(true);
                        } else {
                            throw new Error('No sources from internal API');
                        }
                    } catch (err) {
                        const server = servers.find((s) => s.id === selectedServer) || servers[0];
                        setEmbedUrl(buildResumeUrl(server.url(String(contentId)), resumeSecondsRef.current));
                        setTriedInternalApi(true);
                    }
                } else {
                    const server = servers.find((s) => s.id === selectedServer) || servers[0];
                    setEmbedUrl(buildResumeUrl(server.url(String(contentId)), resumeSecondsRef.current));
                }
            };
            fetchMovieStream();
        } else {
            const server = servers.find(s => s.id === selectedServer) || servers[0];
            setEmbedUrl(buildResumeUrl(server.url(String(contentId), selectedSeason, selectedEpisode), resumeSecondsRef.current));
            setPlayerReady(false);
            setPlayerError(null);
            setAutoSwitching(false);
        }
    }, [selectedServer, contentId, isMovie, selectedSeason, selectedEpisode]);

    useEffect(() => {
        if (!embedUrl) return;
        const timeoutId = setTimeout(() => {
            if (playerReady) return;
            const currentIndex = servers.findIndex(s => s.id === selectedServer);
            
            if (currentIndex >= 0 && currentIndex < servers.length - 1) {
                const nextServer = servers[currentIndex + 1];
                setAutoSwitching(true);
                setSwitchingToServer(nextServer.name);
                if (isMovie) {
                    setEmbedUrl(nextServer.url(String(contentId)));
                }
                setSelectedServer(nextServer.id);
            } else if (isMovie && !triedInternalApi) {
                // If we haven't tried the API yet (unlikely) or exhausted all servers
                setPlayerError('Movie stream failed to initialize on all servers.');
            } else {
                setPlayerError('This source did not load. Try another server.');
            }
        }, SERVER_SWITCH_TIMEOUT_MS);

        return () => clearTimeout(timeoutId);
    }, [embedUrl, playerReady, selectedServer, servers.length, isMovie, triedInternalApi]);

    useEffect(() => {
        const testSpeed = async () => {
            if (!content) return;
            try {
                const imagePath = (content as any).backdrop_path || (content as any).poster_path;
                if (!imagePath) {
                    setEffectiveQuality('1080p');
                    return;
                }
                const testUrl = `https://image.tmdb.org/t/p/w300${imagePath}?ts=${Date.now()}`;
                const start = performance.now();
                const res = await fetch(testUrl, { cache: 'no-store' });
                if (!res.ok) return;
                const blob = await res.blob();
                const duration = (performance.now() - start) / 1000;
                const sizeBits = blob.size * 8;
                const mbps = sizeBits / duration / 1_000_000;
                setEffectiveQuality(mbps < 5 ? '720p' : '1080p');
            } catch {
                setEffectiveQuality('1080p');
            }
        };
        testSpeed();
    }, [contentId, content]);

    const recordHistory = useCallback(async (elapsedSeconds: number) => {
        if (!user || !contentId || !content) return;
        const title = isMovie ? (content as TMDBMovie).title : (content as TMDBSeriesDetails).name;
        const image = getImageUrl((content as any).backdrop_path || (content as any).poster_path);
        const durationSec = isMovie ? 7200 : 2700;
        const progress = Math.min(Math.round((elapsedSeconds / durationSec) * 100), 95);
        const mediaId = isMovie ? `${contentId}` : `${contentId}-s${selectedSeason}-e${selectedEpisode}`;
        await saveProgress(user.id, {
            mediaId,
            mediaType: isMovie ? 'movie' : 'tv',
            title,
            image,
            timestampSeconds: elapsedSeconds,
            durationSeconds: durationSec,
            progress,
            season: isMovie ? undefined : selectedSeason,
            episode: isMovie ? undefined : selectedEpisode,
            updatedAt: new Date().toISOString(),
        });
    }, [user, contentId, content, isMovie, selectedSeason, selectedEpisode]);

    // Track progress every 15s based on elapsed viewing time
    useEffect(() => {
        if (!playerReady || !user || !contentId || !content) return;
        watchStartRef.current = Date.now();
        // Save initial entry immediately
        recordHistory(0);
        const interval = setInterval(() => {
            if (!watchStartRef.current) return;
            const elapsed = Math.round((Date.now() - watchStartRef.current) / 1000);
            recordHistory(elapsed);
        }, 15000);
        return () => clearInterval(interval);
    }, [playerReady, user, contentId, content, isMovie, recordHistory]);

    // Theater mode keyboard shortcut (T)
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 't' || e.key === 'T') {
                if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) return;
                setTheaterMode(v => !v);
            }
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, []);

    // Fetch trailer
    const loadTrailer = useCallback(async () => {
        if (!contentId) return;
        setTrailerLoading(true);
        try {
            const videos: TMDBVideo[] = isMovie
                ? await getMovieVideos(contentId)
                : await getSeriesVideos(contentId);
            const trailer = videos.find(v => v.site === 'YouTube' && v.type === 'Trailer' && v.official)
                || videos.find(v => v.site === 'YouTube' && v.type === 'Trailer')
                || videos.find(v => v.site === 'YouTube');
            setTrailerKey(trailer?.key || null);
        } catch { setTrailerKey(null); }
        finally { setTrailerLoading(false); }
    }, [contentId, isMovie]);

    // Initialize YouTube IFrame API player when trailer opens
    useEffect(() => {
        if (!trailerOpen || !trailerKey) return;

        const initPlayer = () => {
            if (!trailerContainerRef.current) return;
            ytPlayerRef.current = new (window as any).YT.Player(trailerContainerRef.current, {
                videoId: trailerKey,
                playerVars: { autoplay: 1, rel: 0, modestbranding: 1 },
                events: { onReady: (e: any) => e.target.playVideo() },
            });
        };

        if ((window as any).YT?.Player) {
            initPlayer();
        } else {
            (window as any).onYouTubeIframeAPIReady = initPlayer;
            if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
                const s = document.createElement('script');
                s.src = 'https://www.youtube.com/iframe_api';
                document.head.appendChild(s);
            }
        }

        return () => { ytPlayerRef.current?.destroy?.(); ytPlayerRef.current = null; };
    }, [trailerOpen, trailerKey]);

    const skipTrailer = (seconds: number) => {
        const player = ytPlayerRef.current;
        if (!player?.getCurrentTime) return;
        player.seekTo(player.getCurrentTime() + seconds, true);
    };

    // Fetch recommendations after content loads
    useEffect(() => {
        if (!contentId || !content) return;
        const fetchRecs = async () => {
            try {
                const recs = isMovie
                    ? [...await getMovieRecommendations(contentId), ...await getSimilarMovies(contentId)]
                    : await getSimilarSeries(contentId);
                const seen = new Set<number>();
                const unique = recs.filter(r => { if (seen.has(r.id)) return false; seen.add(r.id); return true; });
                setRecommendations(unique.slice(0, 12));
            } catch { /* silent */ }
        };
        fetchRecs();
    }, [contentId, isMovie, content]);

    const handleSeasonChange = async (seasonNum: number) => {
        setSelectedSeason(seasonNum);
        const eps = await getSeasonEpisodes(contentId, seasonNum);
        setEpisodes(eps);
        setSelectedEpisode(eps[0]?.episode_number || 1);
    };

    // Track free-tier watch minutes (1 min per interval)
    useEffect(() => {
        if (tier !== 'free' || !canWatch || !playerReady) return;
        const id = setInterval(() => recordWatchMinutes(1), 60000);
        return () => clearInterval(id);
    }, [tier, canWatch, playerReady]);

    const handleEpisodeClick = (epNum: number) => {
        setSelectedEpisode(epNum);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-nova-bg flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-nova-accent border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!content) return null;

    // Track free-tier watch minutes
    // (effect runs after content loads — moved here as inline hook isn't allowed; handled via useEffect below)

    // Auth / plan gate
    if (!authLoading && !user) {
        return (
            <main className="min-h-screen bg-nova-bg flex items-center justify-center p-6">
                <div className="max-w-md w-full text-center">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-violet-500/15 border border-violet-400/20 flex items-center justify-center">
                        <i className="ri-lock-line text-4xl text-violet-400" />
                    </div>
                    <h2 className="text-2xl font-black text-white mb-2">Inicia sesión para ver</h2>
                    <p className="text-gray-400 text-sm mb-6">Necesitas una cuenta para acceder al contenido de Nova.</p>
                    <div className="flex gap-3 justify-center">
                        <button onClick={() => navigate('/login?redirect=' + location.pathname)} className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold hover:brightness-110 transition-all">Iniciar sesión</button>
                        <button onClick={() => navigate('/signup')} className="px-6 py-3 rounded-xl bg-white/8 border border-white/10 text-white font-semibold hover:bg-white/12 transition-colors">Registrarse</button>
                    </div>
                </div>
            </main>
        );
    }

    if (!authLoading && user && !canWatch) {
        return (
            <main className="min-h-screen bg-nova-bg flex items-center justify-center p-6">
                <div className="max-w-md w-full text-center">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-orange-500/15 border border-orange-400/20 flex items-center justify-center">
                        <i className="ri-time-line text-4xl text-orange-400" />
                    </div>
                    <h2 className="text-2xl font-black text-white mb-2">Límite diario alcanzado</h2>
                    <p className="text-gray-400 text-sm mb-2">Has usado tus 3 horas gratuitas de hoy. Vuelve mañana o actualiza tu plan.</p>
                    <p className="text-gray-600 text-xs mb-6">Minutos restantes hoy: {minutesLeft}</p>
                    <div className="flex gap-3 justify-center">
                        <button onClick={() => navigate('/plans')} className="px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold hover:brightness-110 transition-all"><i className="ri-vip-crown-fill mr-1" />Ver planes</button>
                        <button onClick={() => navigate(-1)} className="px-6 py-3 rounded-xl bg-white/8 border border-white/10 text-white font-semibold hover:bg-white/12 transition-colors">Volver</button>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className={`min-h-screen bg-nova-bg pt-20 pb-12 transition-all duration-500 ${theaterMode ? 'bg-black' : ''}`}>
            {/* Trailer Modal */}
            {trailerOpen && (
                <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={() => setTrailerOpen(false)}>
                    <div className="relative w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                        {/* Player area */}
                        <div className="aspect-video bg-black">
                            {trailerLoading ? (
                                <div className="w-full h-full flex items-center justify-center">
                                    <div className="w-10 h-10 border-4 border-nova-accent border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : trailerKey ? (
                                <div ref={trailerContainerRef} className="w-full h-full" />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                                    <i className="ri-video-off-line text-4xl text-nova-dim" />
                                    <p className="text-nova-muted text-sm">No hay trailer disponible</p>
                                </div>
                            )}

                            {/* Skip overlays — left -10s, right +10s */}
                            {trailerKey && !trailerLoading && (
                                <>
                                    <button
                                        onClick={() => skipTrailer(-10)}
                                        className="absolute left-0 top-0 bottom-12 w-1/4 flex items-center justify-center group"
                                    >
                                        <span className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center gap-1 bg-black/50 rounded-xl px-4 py-3">
                                            <i className="ri-replay-10-line text-white text-3xl" />
                                            <span className="text-white text-xs font-bold">-10s</span>
                                        </span>
                                    </button>
                                    <button
                                        onClick={() => skipTrailer(10)}
                                        className="absolute right-0 top-0 bottom-12 w-1/4 flex items-center justify-center group"
                                    >
                                        <span className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center gap-1 bg-black/50 rounded-xl px-4 py-3">
                                            <i className="ri-forward-10-line text-white text-3xl" />
                                            <span className="text-white text-xs font-bold">+10s</span>
                                        </span>
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Bottom controls bar */}
                        {trailerKey && !trailerLoading && (
                            <div className="flex items-center justify-center gap-4 bg-black/80 backdrop-blur py-3 px-4">
                                <button
                                    onClick={() => skipTrailer(-10)}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-bold transition-all hover:scale-105 active:scale-95"
                                >
                                    <i className="ri-replay-10-line text-lg" />
                                    -10s
                                </button>
                                <span className="text-white/30 text-xs">Trailer</span>
                                <button
                                    onClick={() => skipTrailer(10)}
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-bold transition-all hover:scale-105 active:scale-95"
                                >
                                    +10s
                                    <i className="ri-forward-10-line text-lg" />
                                </button>
                            </div>
                        )}

                        {/* Close button */}
                        <button onClick={() => setTrailerOpen(false)} className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 backdrop-blur border border-white/10 flex items-center justify-center text-white hover:bg-black/90 transition-colors z-10">
                            <i className="ri-close-line" />
                        </button>
                    </div>
                </div>
            )}

            <div className="max-w-screen-2xl mx-auto px-4 lg:px-6">
                <div className={`flex flex-col ${theaterMode ? '' : 'lg:flex-row'} gap-8`}>
                    {/* Main Content (Player) */}
                    <div className="flex-1 min-w-0">
                        {/* Resume banner */}
                        {resumeBanner && (
                            <div className="flex items-center justify-between gap-3 mb-3 px-4 py-2.5 rounded-xl bg-nova-accent/10 border border-nova-accent/25 text-sm">
                                <span className="flex items-center gap-2 text-white/80">
                                    <i className="ri-play-circle-line text-nova-accent text-base" />
                                    Continuando desde <span className="font-bold text-nova-accent">{resumeBanner.label}</span>
                                </span>
                                <button onClick={() => setResumeBanner(null)} className="text-white/30 hover:text-white/60 transition-colors">
                                    <i className="ri-close-line" />
                                </button>
                            </div>
                        )}

                        {/* Video Player */}
                        <EnhancedPlayer
                            src={embedUrl}
                            title={isMovie ? (content as TMDBMovie).title : (content as TMDBSeriesDetails).name}
                            poster={getImageUrl(content.backdrop_path)}
                            contentType={isMovie ? 'movie' : 'series'}
                            loading={!playerReady && !playerError}
                            autoSwitching={autoSwitching}
                            switchingToServer={switchingToServer || undefined}
                            playerError={playerError || undefined}
                            episodeTag={!isMovie ? `S${selectedSeason} E${selectedEpisode}` : undefined}
                            quality={effectiveQuality}
                            onReady={() => {
                                setPlayerReady(true);
                                setPlayerError(null);
                                setAutoSwitching(false);
                                watchStartRef.current = Date.now();
                                recordHistory(1);
                                const title = isMovie
                                    ? (content as TMDBMovie).title
                                    : (content as TMDBSeriesDetails).name;
                                trackIntercomEvent('started_watching', {
                                    title,
                                    type: isMovie ? 'movie' : 'series',
                                    id: contentId,
                                    server: selectedServer,
                                });
                            }}
                            onEnded={() => recordHistory(100)}
                        />

                        {/* Title & Info */}
                        <div className="mb-5">
                            <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
                                <h1 className="text-2xl md:text-3xl font-black text-white uppercase italic tracking-wider">
                                    {isMovie ? (content as TMDBMovie).title : (content as TMDBSeriesDetails).name}
                                </h1>
                                {/* Action buttons */}
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    {/* Trailer button */}
                                    <button
                                        onClick={async () => { setTrailerOpen(true); await loadTrailer(); }}
                                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold transition-all hover:scale-105"
                                    >
                                        <i className="ri-youtube-line text-red-400" />
                                        Trailer
                                    </button>
                                    {/* Subtitle/Audio button */}
                                    <div className="relative">
                                        <button
                                            onClick={() => setSubtitlePanelOpen(v => !v)}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold transition-all hover:scale-105 ${subtitlePanelOpen ? 'bg-nova-accent text-white border-nova-accent' : 'bg-white/5 hover:bg-white/10 border-white/10 text-white'}`}
                                        >
                                            <i className="ri-closed-captioning-line" />
                                            CC / Audio
                                        </button>
                                        {subtitlePanelOpen && (
                                            <div className="absolute right-0 top-full mt-2 w-64 rounded-xl bg-nova-card border border-white/10 shadow-2xl z-50 overflow-hidden animate-fade-in">
                                                <div className="px-4 pt-4 pb-3">
                                                    <p className="text-white font-bold text-sm mb-1 flex items-center gap-2">
                                                        <i className="ri-closed-captioning-fill text-nova-accent" />
                                                        Subtítulos y audio
                                                    </p>
                                                    <p className="text-nova-dim text-xs leading-relaxed mb-3">
                                                        Los reproductores integrados gestionan subtítulos e idiomas de audio internamente.
                                                    </p>
                                                    <div className="space-y-2">
                                                        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                                                            <i className="ri-closed-captioning-line text-nova-accent mt-0.5 flex-shrink-0" />
                                                            <p className="text-white/70 text-xs">Busca el botón <span className="text-white font-bold">CC</span> dentro del reproductor para activar subtítulos.</p>
                                                        </div>
                                                        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                                                            <i className="ri-volume-up-line text-nova-accent mt-0.5 flex-shrink-0" />
                                                            <p className="text-white/70 text-xs">El icono de audio <span className="text-white font-bold">🎧</span> o ajustes <span className="text-white font-bold">⚙️</span> permite cambiar el idioma.</p>
                                                        </div>
                                                        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                                                            <i className="ri-refresh-line text-nova-accent mt-0.5 flex-shrink-0" />
                                                            <p className="text-white/70 text-xs">Si el servidor actual no tiene subtítulos, prueba con otro servidor.</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button onClick={() => setSubtitlePanelOpen(false)} className="w-full px-4 py-2.5 text-xs text-nova-muted hover:text-white border-t border-white/5 transition-colors text-center">
                                                    Cerrar
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    {/* Theater mode button */}
                                    <button
                                        onClick={() => setTheaterMode(v => !v)}
                                        title="Modo teatro (T)"
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold transition-all hover:scale-105 ${theaterMode ? 'bg-nova-accent text-white border-nova-accent' : 'bg-white/5 hover:bg-white/10 border-white/10 text-white'}`}
                                    >
                                        <i className={theaterMode ? 'ri-layout-masonry-fill' : 'ri-picture-in-picture-2-line'} />
                                        Teatro
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 text-nova-muted text-sm flex-wrap">
                                {!isMovie && (
                                    <span className="text-nova-accent font-bold px-2 py-0.5 bg-nova-accent/10 rounded">
                                        S{selectedSeason} E{selectedEpisode}
                                    </span>
                                )}
                                <span className="opacity-80">{isMovie ? (content as TMDBMovie).release_date : (content as TMDBSeriesDetails).first_air_date}</span>
                                <span className="text-yellow-500 flex items-center gap-1">
                                    <i className="ri-star-fill" /> {content.vote_average?.toFixed(1)}
                                </span>
                                <span className="text-xs px-2 py-0.5 rounded bg-white/5 border border-white/10">
                                    {effectiveQuality}
                                </span>
                            </div>
                        </div>

                        {/* Overview */}
                        <div className="glass rounded-2xl p-6 border border-white/5 mb-8">
                            <h3 className="text-white font-bold mb-2">Sinopsis</h3>
                            <p className="text-gray-400 leading-relaxed text-sm">{content.overview}</p>
                        </div>

                        {/* Recommendations */}
                        {recommendations.length > 0 && (
                            <div className="mb-4">
                                <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                                    <i className="ri-magic-line text-nova-accent" />
                                    {isMovie ? 'También te puede gustar' : 'Series similares'}
                                </h3>
                                <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide">
                                    {recommendations.map(rec => {
                                        const recTitle = (rec as TMDBMovie).title || (rec as TMDBSeries).name || '';
                                        const recImage = getImageUrl(rec.poster_path);
                                        const recLink = isMovie ? `/watch/movie/${rec.id}` : `/watch/tv/${rec.id}`;
                                        const recYear = ((rec as TMDBMovie).release_date || (rec as TMDBSeries).first_air_date || '').split('-')[0];
                                        return (
                                            <Link
                                                key={rec.id}
                                                to={recLink}
                                                className="flex-shrink-0 w-32 group"
                                            >
                                                <div className="aspect-[2/3] rounded-xl overflow-hidden bg-nova-card mb-2 group-hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all duration-300">
                                                    <img
                                                        src={recImage}
                                                        alt={recTitle}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                        loading="lazy"
                                                        onError={e => { (e.currentTarget as HTMLImageElement).src = '/placeholder-poster.svg'; }}
                                                    />
                                                </div>
                                                <p className="text-white text-xs font-semibold truncate group-hover:text-nova-accent transition-colors">{recTitle}</p>
                                                <p className="text-nova-dim text-[10px]">{recYear}</p>
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar: Episodes (For Series) - hidden in theater mode */}
                    {!isMovie && (content as TMDBSeriesDetails).seasons && !theaterMode && (
                        <div className="w-full lg:w-96 shrink-0">
                            <div className="glass rounded-2xl p-6 sticky top-24 max-h-[calc(100vh-120px)] flex flex-col border border-white/5">
                                {/* Header & Season Selector */}
                                <div className="mb-6 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-white font-bold flex items-center gap-2">
                                            <i className="ri-play-list-2-line text-nova-accent"></i>
                                            Episodios
                                        </h3>
                                        <span className="text-nova-dim text-xs font-mono">{episodes.length} EPISODIOS</span>
                                    </div>

                                    <div className="relative">
                                        <select
                                            value={selectedSeason}
                                            onChange={(e) => handleSeasonChange(parseInt(e.target.value))}
                                            className="w-full bg-black/40 border border-white/10 text-white text-sm rounded-xl px-4 py-3 outline-none focus:border-nova-accent appearance-none cursor-pointer"
                                        >
                                            {(content as TMDBSeriesDetails).seasons
                                                .filter(s => s.season_number > 0)
                                                .map(s => (
                                                    <option key={s.id} value={s.season_number}>
                                                        Temporada {s.season_number}
                                                    </option>
                                                ))
                                            }
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                            <i className="ri-arrow-down-s-line"></i>
                                        </div>
                                    </div>
                                </div>

                                {/* Episode List */}
                                <div className="overflow-y-auto pr-2 custom-scrollbar flex-1 space-y-2">
                                    {episodes.map((ep) => (
                                        <button
                                            key={ep.id}
                                            onClick={() => handleEpisodeClick(ep.episode_number)}
                                            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left group ${selectedEpisode === ep.episode_number
                                                ? 'bg-nova-accent text-white shadow-lg shadow-nova-accent/20'
                                                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                                                }`}
                                        >
                                            <div className="relative w-24 aspect-video rounded-lg overflow-hidden bg-black/50 shrink-0">
                                                <img
                                                    src={ep.still_path ? getImageUrl(ep.still_path) : getImageUrl(content.backdrop_path || content.poster_path)}
                                                    alt=""
                                                    className={`w-full h-full object-cover transition-opacity ${selectedEpisode === ep.episode_number ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'}`}
                                                    onError={(e) => { (e.target as HTMLImageElement).src = getImageUrl(content.poster_path); }}
                                                />
                                                {selectedEpisode === ep.episode_number && (
                                                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                                        <i className="ri-bar-chart-fill text-white animate-pulse"></i>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-baseline justify-between mb-1">
                                                    <span className={`text-xs font-bold ${selectedEpisode === ep.episode_number ? 'text-white' : 'text-gray-500 group-hover:text-nova-accent'}`}>
                                                        EP {ep.episode_number}
                                                    </span>
                                                </div>
                                                <h4 className="text-sm font-medium truncate leading-tight mb-1">
                                                    {ep.name || `Episode ${ep.episode_number}`}
                                                </h4>
                                                <p className="text-[10px] opacity-60 line-clamp-1">
                                                    {ep.air_date?.split('-')[0] || 'Unknown'}
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
