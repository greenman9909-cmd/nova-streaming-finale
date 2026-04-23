import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
    getSeriesDetails,
    getSeasonEpisodes,
    getImageUrl,
    TMDBSeriesDetails,
    TMDBEpisode
} from '../services/api';
import EnhancedPlayer from '../components/EnhancedPlayer';
import { useAuth } from '../context/AuthContext';
import { saveProgress, getLocalProgress, buildResumeUrl, formatTime } from '../utils/watchProgress';
import { runSpeedTest } from '../utils/speedTest';
import SpeedTestLoader from '../components/SpeedTestLoader';

type AnimeServer = {
    id: string;
    name: string;
    kind: 'vidsrc';
    buildUrl: (contentId: number, season: number, episode: number) => string;
};

const ANIME_SERVERS: AnimeServer[] = [
    {
        id: 'vidsrc',
        name: 'Server 1',
        kind: 'vidsrc',
        buildUrl: (contentId, season, episode) => `https://vidsrc.me/embed/tv?tmdb=${contentId}&season=${season}&episode=${episode}`
    },
    {
        id: 'vidsrcxyz',
        name: 'Server 2',
        kind: 'vidsrc',
        buildUrl: (contentId, season, episode) => `https://vidsrc.xyz/embed/tv/${contentId}/${season}/${episode}`
    },
    {
        id: 'videasy',
        name: 'Server 3',
        kind: 'vidsrc',
        buildUrl: (contentId, season, episode) => `https://player.videasy.net/tv/${contentId}/${season}/${episode}`
    },
    {
        id: 'moviesapi',
        name: 'Server 4',
        kind: 'vidsrc',
        buildUrl: (contentId, season, episode) => `https://moviesapi.club/tv/${contentId}-${season}-${episode}`
    },
    {
        id: 'twoembed',
        name: 'Server 5',
        kind: 'vidsrc',
        buildUrl: (contentId, season, episode) => `https://www.2embed.cc/embedtv/${contentId}&s=${season}&e=${episode}`
    }
];

const MIN_RECOMMENDED_MBPS = 8;
const SERVER_SWITCH_TIMEOUT_MS = 8000;

// No-op for stability
const force1080 = (url: string) => url;

const parsePositiveInt = (value: string | null): number | null => {
    if (!value) return null;
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

export default function AnimeWatch() {
    const { id } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();
    const { user } = useAuth();

    const [anime, setAnime] = useState<TMDBSeriesDetails | null>(null);
    const [episodes, setEpisodes] = useState<TMDBEpisode[]>([]);
    const [selectedSeason, setSelectedSeason] = useState(1);
    const [currentEpisode, setCurrentEpisode] = useState<TMDBEpisode | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedServer, setSelectedServer] = useState('super');
    const [embedUrl, setEmbedUrl] = useState('');
    const [pendingEmbedUrl, setPendingEmbedUrl] = useState('');
    const [speedTesting, setSpeedTesting] = useState(false);
    const [speedTestError, setSpeedTestError] = useState<string | null>(null);
    const [speedTestNonce, setSpeedTestNonce] = useState(0);
    const [forceLoad, setForceLoad] = useState(false);
    const [playerReady, setPlayerReady] = useState(false);
    const [playerError, setPlayerError] = useState<string | null>(null);
    const [autoSwitching, setAutoSwitching] = useState(false);
    const [switchingToServer, _setSwitchingToServer] = useState<string | null>(null);

    const [resumeBanner, setResumeBanner] = useState<{ seconds: number; label: string } | null>(null);
    const contentId = parseInt(id || '0');
    const serverIds = ANIME_SERVERS.map((server) => server.id);
    const watchStartRef = useRef<number | null>(null);
    const resumeSecondsRef = useRef<number>(0);

    useEffect(() => {
        if (!contentId) return;

        let cancelled = false;

        const fetchData = async () => {
            setLoading(true);
            try {
                const details = await getSeriesDetails(contentId);
                if (!details || cancelled) return;

                setAnime(details);

                const preferredSeason = parsePositiveInt(searchParams.get('season'));
                const preferredEpisode = parsePositiveInt(searchParams.get('episode'));

                const availableSeasons = (details.seasons || [])
                    .map((season) => season.season_number)
                    .filter((seasonNum) => seasonNum > 0);

                const seasonCandidates = Array.from(
                    new Set([
                        ...(preferredSeason ? [preferredSeason] : []),
                        ...availableSeasons,
                        1
                    ])
                );

                let resolvedSeason = seasonCandidates[0] || 1;
                let resolvedEpisodes: TMDBEpisode[] = [];

                for (const seasonNum of seasonCandidates) {
                    const seasonEpisodes = await getSeasonEpisodes(contentId, seasonNum);
                    if (cancelled) return;
                    if (seasonEpisodes.length > 0) {
                        resolvedSeason = seasonNum;
                        resolvedEpisodes = seasonEpisodes;
                        break;
                    }
                }

                if (resolvedEpisodes.length === 0) {
                    resolvedEpisodes = await getSeasonEpisodes(contentId, resolvedSeason);
                    if (cancelled) return;
                }

                setSelectedSeason(resolvedSeason);
                setEpisodes(resolvedEpisodes);

                const initialEpisode = preferredEpisode
                    ? resolvedEpisodes.find((ep) => ep.episode_number === preferredEpisode) || resolvedEpisodes[0] || null
                    : resolvedEpisodes[0] || null;

                setCurrentEpisode(initialEpisode);
            } catch (err) {
                console.error('Error loading anime details:', err);
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        fetchData();

        return () => {
            cancelled = true;
        };
    }, [contentId, searchParams]);

    const handleSeasonChange = async (seasonNum: number) => {
        if (!contentId) return;
        setSelectedSeason(seasonNum);

        const seasonEpisodes = await getSeasonEpisodes(contentId, seasonNum);
        setEpisodes(seasonEpisodes);
        setCurrentEpisode(seasonEpisodes[0] || null);
    };

    const handleEpisodeChange = (ep: TMDBEpisode) => {
        setCurrentEpisode(ep);
    };

    // Load saved progress for resume banner
    useEffect(() => {
        if (!user || !contentId || !currentEpisode) return;
        const mediaId = `${contentId}-ep-${currentEpisode.episode_number}`;
        const saved = getLocalProgress(user.id, mediaId);
        if (saved && saved.timestampSeconds > 30) {
            resumeSecondsRef.current = saved.timestampSeconds;
            setResumeBanner({ seconds: saved.timestampSeconds, label: formatTime(saved.timestampSeconds) });
        } else {
            resumeSecondsRef.current = 0;
            setResumeBanner(null);
        }
    }, [user?.id, contentId, currentEpisode?.episode_number]);

    const recordHistory = useCallback(async (elapsedSeconds: number) => {
        if (!user || !contentId || !currentEpisode) return;
        const mediaId = `${contentId}-ep-${currentEpisode.episode_number}`;
        const durationSec = 1440;
        const progress = Math.min(Math.round((elapsedSeconds / durationSec) * 100), 95);
        await saveProgress(user.id, {
            mediaId,
            mediaType: 'anime',
            title: anime?.name || 'Anime',
            image: getImageUrl(anime?.backdrop_path || anime?.poster_path || null),
            timestampSeconds: elapsedSeconds,
            durationSeconds: durationSec,
            progress,
            episode: currentEpisode.episode_number,
            updatedAt: new Date().toISOString(),
        });
    }, [user, contentId, currentEpisode, anime]);

    useEffect(() => {
        if (!playerReady || !currentEpisode || !user) return;
        watchStartRef.current = Date.now();
        recordHistory(resumeSecondsRef.current || 0);
        const interval = setInterval(() => {
            if (!watchStartRef.current) return;
            const elapsed = Math.round((Date.now() - watchStartRef.current) / 1000) + (resumeSecondsRef.current || 0);
            recordHistory(elapsed);
        }, 15000);
        return () => clearInterval(interval);
    }, [playerReady, currentEpisode, user, recordHistory]);

    useEffect(() => {
        if (!contentId || !currentEpisode || !anime) {
            setPendingEmbedUrl('');
            return;
        }
        const server = ANIME_SERVERS.find((item) => item.id === selectedServer) || ANIME_SERVERS[0];
        const nextUrl = force1080(server.buildUrl(contentId, selectedSeason, currentEpisode.episode_number));
        setPendingEmbedUrl(buildResumeUrl(nextUrl, resumeSecondsRef.current));
    }, [anime, contentId, currentEpisode, selectedSeason, selectedServer]);

    useEffect(() => {
        setPlayerReady(false);
        setPlayerError(null);
        setAutoSwitching(false);
    }, [pendingEmbedUrl, selectedServer]);

    useEffect(() => {
        if (!pendingEmbedUrl) {
            setEmbedUrl('');
            return;
        }

        let cancelled = false;

        const runTest = async () => {
            setSpeedTesting(true);
            setSpeedTestError(null);
            setForceLoad(false);
            let passed = false;
            try {
                const result = await runSpeedTest({ minDurationMs: 1200, timeoutMs: 5000 });
                if (cancelled) return;
                if (result.mbps < MIN_RECOMMENDED_MBPS) {
                    setSpeedTestError(`Your connection is below ${MIN_RECOMMENDED_MBPS} Mbps. Playback may buffer.`);
                }
                passed = true;
            } catch {
                if (cancelled) return;
                setSpeedTestError('Speed test unavailable. Continuing playback.');
                passed = true;
            } finally {
                if (cancelled) return;
                setSpeedTesting(false);
                if (passed) {
                    setEmbedUrl(pendingEmbedUrl);
                } else {
                    setForceLoad(true);
                }
            }
        };

        runTest();

        return () => {
            cancelled = true;
        };
    }, [pendingEmbedUrl, speedTestNonce]);

    useEffect(() => {
        if (!embedUrl) return;

        const timeoutId = setTimeout(() => {
            if (playerReady) return;

            const currentIndex = serverIds.indexOf(selectedServer);
            if (currentIndex >= 0 && currentIndex < serverIds.length - 1) {
                setAutoSwitching(true);
                setSelectedServer(serverIds[currentIndex + 1]);
            } else {
                setPlayerError('Stream failed to load. Try another server.');
            }
        }, SERVER_SWITCH_TIMEOUT_MS);

        return () => clearTimeout(timeoutId);
    }, [embedUrl, playerReady, selectedServer, serverIds.join('|')]);

    if (loading && !anime) {
        return (
            <div className="min-h-screen bg-nova-bg flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-nova-accent border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-nova-bg pt-20 pb-12">
            <div className="max-w-screen-2xl mx-auto px-4 lg:px-6">
                <div className="flex flex-col lg:flex-row gap-8">
                    <div className="flex-1 min-w-0">
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
                        {currentEpisode ? (
                            speedTesting || (!embedUrl && !forceLoad) ? (
                                <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl mb-6 relative group border border-white/5">
                                    <SpeedTestLoader
                                        message={speedTesting ? 'Probando conexión (recomendado 8+ Mbps)...' : 'Cargando stream...'}
                                        showRetry={Boolean(speedTestError)}
                                        errorText={speedTestError}
                                        onRetry={() => setSpeedTestNonce((n) => n + 1)}
                                    />
                                </div>
                            ) : (
                                <EnhancedPlayer
                                    src={forceLoad ? pendingEmbedUrl : embedUrl}
                                    title={anime?.name || 'Anime'}
                                    poster={getImageUrl(anime?.backdrop_path || anime?.poster_path || null)}
                                    contentType="anime"
                                    loading={!playerReady && !playerError}
                                    autoSwitching={autoSwitching}
                                    switchingToServer={switchingToServer || undefined}
                                    playerError={playerError || undefined}
                                    episodeTag={`S${selectedSeason} E${currentEpisode?.episode_number || '-'}`}
                                    onReady={() => {
                                        setPlayerReady(true);
                                        setPlayerError(null);
                                        setAutoSwitching(false);
                                        watchStartRef.current = Date.now();
                                        recordHistory(1);
                                    }}
                                    onEnded={() => recordHistory(100)}
                                />
                            )
                        ) : (
                            <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl mb-6 relative group border border-white/5 flex items-center justify-center text-gray-500">
                                No hay episodios disponibles para este título.
                            </div>
                        )}

                        <div className="mb-8">
                            <h1 className="text-2xl md:text-3xl font-black text-white mb-2 uppercase italic tracking-wider">
                                {anime?.name}
                            </h1>
                            <div className="flex items-center gap-4 text-nova-muted text-sm">
                                <span className="text-nova-accent font-bold px-2 py-0.5 bg-nova-accent/10 rounded">
                                    S{selectedSeason} E{currentEpisode?.episode_number || '-'}
                                </span>
                                <span>{currentEpisode?.name || 'Episodio no disponible'}</span>
                            </div>
                        </div>

                    </div>

                    <div className="w-full lg:w-96 shrink-0">
                        <div className="glass rounded-2xl p-6 sticky top-24 max-h-[calc(100vh-120px)] flex flex-col border border-white/5">
                            <div className="mb-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-white font-bold flex items-center gap-2">
                                        <i className="ri-play-list-2-line text-nova-accent"></i>
                                        Episodios
                                    </h3>
                                    <span className="text-nova-dim text-xs font-mono">{episodes.length} EPISODIOS</span>
                                </div>

                                {anime?.seasons && anime.seasons.length > 0 && (
                                    <div className="relative">
                                        <select
                                            value={selectedSeason}
                                            onChange={(e) => handleSeasonChange(parseInt(e.target.value))}
                                            className="w-full bg-black/40 border border-white/10 text-white text-sm rounded-xl px-4 py-3 outline-none focus:border-nova-accent appearance-none cursor-pointer"
                                        >
                                            {anime.seasons
                                                .filter((s) => s.season_number > 0)
                                                .sort((a, b) => a.season_number - b.season_number)
                                                .map((s) => (
                                                    <option key={s.id} value={s.season_number}>
                                                        Temporada {s.season_number}
                                                    </option>
                                                ))}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                            <i className="ri-arrow-down-s-line"></i>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="overflow-y-auto pr-2 custom-scrollbar flex-1 space-y-2">
                                {episodes.map((ep) => (
                                    <button
                                        key={ep.id}
                                        onClick={() => handleEpisodeChange(ep)}
                                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left group ${currentEpisode?.id === ep.id
                                            ? 'bg-nova-accent text-white shadow-lg shadow-nova-accent/20'
                                            : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                                            }`}
                                    >
                                        <div className="relative w-24 aspect-video rounded-lg overflow-hidden bg-black/50 shrink-0">
                                            <img
                                                src={ep.still_path ? getImageUrl(ep.still_path) : getImageUrl(anime?.backdrop_path || anime?.poster_path || null)}
                                                alt=""
                                                className={`w-full h-full object-cover transition-opacity ${currentEpisode?.id === ep.id ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'}`}
                                                onError={(e) => { (e.target as HTMLImageElement).src = getImageUrl(anime?.poster_path || null); }}
                                            />
                                            {currentEpisode?.id === ep.id && (
                                                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                                    <i className="ri-bar-chart-fill text-white animate-pulse"></i>
                                                </div>
                                            )}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-baseline justify-between mb-1">
                                                <span className={`text-xs font-bold ${currentEpisode?.id === ep.id ? 'text-white' : 'text-gray-500 group-hover:text-nova-accent'}`}>
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
                </div>
            </div>
        </main>
    );
}
