import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import EnhancedPlayer from '../components/EnhancedPlayer';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { runSpeedTest } from '../utils/speedTest';
import SpeedTestLoader from '../components/SpeedTestLoader';
import { saveProgress, getLocalProgress, buildResumeUrl, formatTime } from '../utils/watchProgress';

interface Episode {
    id: string;
    number: number;
    title?: string;
    data_id?: number;
}

interface StreamServer {
    id: string;
    name: string;
    icon?: string;
}

export default function Watch() {
    const { episodeId } = useParams<{ episodeId: string }>();
    const { user } = useAuth();
    const { settings } = useSettings();
    const [_loading, setLoading] = useState(true);
    const [embedUrl, setEmbedUrl] = useState('');
    const [pendingEmbedUrl, setPendingEmbedUrl] = useState('');
    // const [streamError, setStreamError] = useState('');
    const [selectedServer, setSelectedServer] = useState('hd-1');
    const [selectedType, setSelectedType] = useState<'sub' | 'dub'>('sub');
    const [episodes, setEpisodes] = useState<Episode[]>([]);
    const [serversByType, setServersByType] = useState<{ sub: StreamServer[]; dub: StreamServer[] }>({ sub: [], dub: [] });
    const [playerReady, setPlayerReady] = useState(false);
    const [playerError, setPlayerError] = useState<string | null>(null);
    const [autoSwitching, setAutoSwitching] = useState(false);
    const [speedTesting, setSpeedTesting] = useState(false);
    const [speedTestError, setSpeedTestError] = useState<string | null>(null);
    const [speedTestNonce, setSpeedTestNonce] = useState(0);
    const [forceLoad, setForceLoad] = useState(false);
    const [dubAvailable, setDubAvailable] = useState<boolean | null>(null);
    const [typeMessage, setTypeMessage] = useState<string | null>(null);
    const [resumeBanner, setResumeBanner] = useState<{ seconds: number; label: string } | null>(null);
    const MIN_RECOMMENDED_MBPS = settings.dataSaver ? 4 : 8;
    const SERVER_SWITCH_TIMEOUT_MS = 8000;
    const watchStartRef = useRef<number | null>(null);
    const resumeSecondsRef = useRef<number>(0);
    const audioInitRef = useRef(false);

    const defaultServers: StreamServer[] = [
        { id: 'hd-1', name: 'Server 1 (HD)', icon: 'ri-speed-line' },
        { id: 'hd-2', name: 'Server 2 (Alt)', icon: 'ri-server-line' },
    ];

    // Extract anime ID and episode number from episodeId
    const parseEpisodeId = () => {
        if (!episodeId) return { animeId: '', episodeNum: '1' };
        const parts = episodeId.split('-episode-');
        return {
            animeId: parts[0] || '',
            episodeNum: parts[1] || '1'
        };
    };

    const { animeId, episodeNum } = parseEpisodeId();
    const animeTitle = animeId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const currentEpisode = episodes.find((ep) => String(ep.number) === String(episodeNum));
    const episodeStreamId = currentEpisode?.id || (currentEpisode?.data_id ? String(currentEpisode.data_id) : '') || episodeId || '';

    const normalizeServerList = (list: any[]): StreamServer[] => {
        return (list || []).map((server: any, idx: number) => {
            const id = String(server?.server_id || server?.id || server?.name || server?.server || server?.source || `server-${idx + 1}`);
            const name = String(server?.server_name || server?.name || server?.server || server?.source || `Server ${idx + 1}`);
            return { id, name, icon: 'ri-server-line' };
        }).filter((s) => s.id);
    };

    const resolveServersForType = () => {
        if (selectedType === 'dub' && serversByType.dub.length > 0) return serversByType.dub;
        if (serversByType.sub.length > 0) return serversByType.sub;
        return defaultServers;
    };

    // Fetch episodes list
    useEffect(() => {
        const fetchEpisodes = async () => {
            try {
                const response = await fetch(`/api/episodes/${animeId}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.results?.episodes) {
                        setEpisodes(data.results.episodes.map((ep: any) => ({
                            id: ep.id,
                            number: ep.episode_no,
                            title: ep.title || `Episode ${ep.episode_no}`,
                            data_id: ep.data_id
                        })));
                    }
                }
            } catch (error) {
                console.error('Failed to fetch episodes:', error);
                // Use default episodes as fallback
                setEpisodes(Array.from({ length: 12 }, (_, i) => ({
                    id: `ep-${i + 1}`,
                    number: i + 1,
                    title: `Episode ${i + 1}`
                })));
            }
        };

        if (animeId) {
            fetchEpisodes();
        }
    }, [animeId]);

    useEffect(() => {
        if (audioInitRef.current) return;
        setSelectedType(settings.preferredAudioType);
        audioInitRef.current = true;
    }, [settings.preferredAudioType]);

    // Fetch available servers for episode
    useEffect(() => {
        if (!episodeStreamId) return;
        let cancelled = false;
        setDubAvailable(null);
        const loadServers = async () => {
            try {
                const response = await fetch(`/api/servers/${encodeURIComponent(episodeStreamId)}`);
                const data = await response.json();
                if (cancelled) return;

                const raw = data?.results ?? data?.servers ?? data;
                let subList: any[] = [];
                let dubList: any[] = [];
                let hasDubInfo = false;

                if (Array.isArray(raw)) {
                    subList = raw;
                } else if (raw && typeof raw === 'object') {
                    if (Array.isArray((raw as any).sub) || Array.isArray((raw as any).dub)) {
                        subList = (raw as any).sub || [];
                        dubList = (raw as any).dub || [];
                        hasDubInfo = true;
                    } else if (Array.isArray((raw as any).data)) {
                        subList = (raw as any).data;
                    }
                }

                const normalizedSub = normalizeServerList(subList);
                const normalizedDub = normalizeServerList(dubList);
                setServersByType({ sub: normalizedSub, dub: normalizedDub });

                if (hasDubInfo) {
                    setDubAvailable(normalizedDub.length > 0);
                    if (normalizedDub.length === 0 && selectedType === 'dub') {
                        setSelectedType('sub');
                        setTypeMessage('Dub not available for this episode. Switched to Sub.');
                    }
                }
            } catch (error) {
                console.error('Failed to load servers:', error);
            }
        };

        loadServers();
        return () => { cancelled = true; };
    }, [episodeStreamId]);

    useEffect(() => {
        const available = resolveServersForType();
        if (available.length > 0 && !available.some((s) => s.id === selectedServer)) {
            setSelectedServer(available[0].id);
        }
    }, [selectedType, serversByType.sub.length, serversByType.dub.length]);

    // Fetch stream — uses backend anime stream endpoint (sub/dub aware)
    useEffect(() => {
        if (!episodeStreamId) return;
        let cancelled = false;
        const loadStream = async () => {
            setPlayerReady(false);
            setPlayerError(null);
            setAutoSwitching(false);
            setPendingEmbedUrl('');
            setEmbedUrl('');
            setTypeMessage(null);

            try {
                const url = `/api/stream?id=${encodeURIComponent(episodeStreamId)}&server=${encodeURIComponent(selectedServer)}&type=${selectedType}`;
                const response = await fetch(url);
                const data = await response.json();
                if (cancelled) return;

                const file =
                    data?.results?.streamingLink?.link?.file ||
                    data?.results?.streamingLink?.file ||
                    data?.results?.streamingLink?.url ||
                    data?.results?.sources?.[0]?.file ||
                    data?.results?.sources?.[0]?.url;

                if (!file) {
                    throw new Error('No stream available');
                }

                setPendingEmbedUrl(buildResumeUrl(file, resumeSecondsRef.current));
                setLoading(false);
                if (selectedType === 'dub') {
                    setDubAvailable(true);
                }
            } catch (error) {
                if (selectedType === 'dub') {
                    setDubAvailable(false);
                    setSelectedType('sub');
                    setTypeMessage('Dub not available for this episode. Switched to Sub.');
                    return;
                }
                setPlayerError('Stream failed to load. Try a different server.');
            }
        };

        loadStream();
        return () => { cancelled = true; };
    }, [episodeStreamId, selectedServer, selectedType]);


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
                // Do not block playback if the speed probe fails.
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

    const displayServers = resolveServersForType();
    const serverIds = displayServers.map((s) => s.id);

    useEffect(() => {
        setPlayerReady(false);
        setPlayerError(null);
        setAutoSwitching(false);
    }, [embedUrl, selectedServer, selectedType]);

    useEffect(() => {
        if (!embedUrl) return;
        const timeoutId = setTimeout(() => {
            if (playerReady) return;
            const currentIndex = serverIds.indexOf(selectedServer);
            if (currentIndex >= 0 && currentIndex < serverIds.length - 1) {
                setAutoSwitching(true);
                setSelectedServer(serverIds[currentIndex + 1]);
            } else {
                setPlayerError('Stream failed to load. Try a different server.');
            }
        }, SERVER_SWITCH_TIMEOUT_MS);

        return () => clearTimeout(timeoutId);
    }, [embedUrl, playerReady, selectedServer, serverIds.join('|')]);

    // Load saved progress for resume banner
    useEffect(() => {
        if (!user || !animeId) return;
        const mediaId = `${animeId}-episode-${episodeNum}`;
        const saved = getLocalProgress(user.id, mediaId);
        if (saved && saved.timestampSeconds > 30) {
            resumeSecondsRef.current = saved.timestampSeconds;
            setResumeBanner({ seconds: saved.timestampSeconds, label: formatTime(saved.timestampSeconds) });
        } else {
            resumeSecondsRef.current = 0;
            setResumeBanner(null);
        }
    }, [user?.id, animeId, episodeNum]);

    const recordHistory = useCallback(async (elapsedSeconds: number) => {
        if (!user || !animeId) return;
        const mediaId = `${animeId}-episode-${episodeNum}`;
        const durationSec = 1440; // 24 min
        const progress = Math.min(Math.round((elapsedSeconds / durationSec) * 100), 95);
        await saveProgress(user.id, {
            mediaId,
            mediaType: 'tv',
            title: animeTitle,
            image: '',
            timestampSeconds: elapsedSeconds,
            durationSeconds: durationSec,
            progress,
            updatedAt: new Date().toISOString(),
        });
    }, [user, animeId, episodeNum, animeTitle]);

    useEffect(() => {
        if (!playerReady || !animeId || !user) return;
        watchStartRef.current = Date.now();
        recordHistory(resumeSecondsRef.current || 0);
        const interval = setInterval(() => {
            if (!watchStartRef.current) return;
            const elapsed = Math.round((Date.now() - watchStartRef.current) / 1000) + (resumeSecondsRef.current || 0);
            recordHistory(elapsed);
        }, 15000);
        return () => clearInterval(interval);
    }, [playerReady, animeId, user, recordHistory]);

    return (
        <main className="min-h-screen bg-nova-bg pt-20">
            <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm mb-6">
                    <Link to="/" className="text-nova-muted hover:text-white transition-colors">Home</Link>
                    <i className="ri-arrow-right-s-line text-nova-dim"></i>
                    <Link to="/anime" className="text-nova-muted hover:text-white transition-colors">Anime</Link>
                    <i className="ri-arrow-right-s-line text-nova-dim"></i>
                    <span className="text-nova-accent">{animeTitle}</span>
                </div>

                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Main Content */}
                    <div className="flex-1">
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
                        <div className="relative aspect-video rounded-2xl overflow-hidden bg-nova-card mb-6">
                            {(speedTesting || (!embedUrl && !forceLoad)) ? (
                                <div className="absolute inset-0">
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
                                    title={animeTitle}
                                    contentType="anime"
                                    loading={!playerReady && !playerError}
                                    autoSwitching={autoSwitching}
                                    playerError={playerError || undefined}
                                    episodeTag={`EP ${episodeNum}`}
                                    onReady={() => {
                                        setPlayerReady(true);
                                        setPlayerError(null);
                                        setAutoSwitching(false);
                                        recordHistory(0);
                                    }}
                                    onEnded={() => recordHistory(100)}
                                />
                            )}
                        </div>

                        {/* Title & Info */}
                        <div className="mb-6">
                            <h1 className="font-display font-bold text-2xl md:text-3xl text-white mb-2">
                                {animeTitle}
                            </h1>
                            <p className="text-nova-accent font-medium">Episode {episodeNum}</p>
                        </div>

                        {/* Type Selection (Sub/Dub) */}
                        <div className="glass rounded-2xl p-5 mb-4">
                            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                                <i className="ri-translate-2 text-nova-accent"></i>
                                Audio Type
                            </h3>
                            <div className="flex gap-3">
                                {['sub', 'dub'].map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => setSelectedType(type as 'sub' | 'dub')}
                                        disabled={type === 'dub' && dubAvailable === false}
                                        className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all ${selectedType === type
                                            ? 'gradient-accent text-white glow-accent'
                                            : 'bg-nova-surface text-nova-muted hover:text-white hover:bg-white/10'
                                            } ${type === 'dub' && dubAvailable === false ? 'opacity-50 cursor-not-allowed hover:bg-nova-surface' : ''}`}
                                    >
                                        <i className={type === 'sub' ? 'ri-closed-captioning-line' : 'ri-volume-up-line'}></i>
                                        {type === 'sub' ? 'Subtitled' : (dubAvailable === false ? 'Dub Unavailable' : 'Dubbed')}
                                    </button>
                                ))}
                            </div>
                            {typeMessage && (
                                <p className="text-xs text-amber-300 mt-3">{typeMessage}</p>
                            )}
                            {dubAvailable === false && !typeMessage && (
                                <p className="text-xs text-amber-300 mt-3">Dub not available for this episode.</p>
                            )}
                        </div>


                        {/* Actions */}
                        <div className="flex flex-wrap gap-4">
                            <button className="flex items-center gap-2 px-6 py-3 rounded-xl glass text-nova-muted hover:text-white hover:bg-white/10 transition-all">
                                <i className="ri-download-line text-xl"></i>
                                Download
                            </button>
                            <button className="flex items-center gap-2 px-6 py-3 rounded-xl glass text-nova-muted hover:text-white hover:bg-white/10 transition-all">
                                <i className="ri-share-line text-xl"></i>
                                Share
                            </button>
                            <button className="flex items-center gap-2 px-6 py-3 rounded-xl glass text-nova-muted hover:text-white hover:bg-white/10 transition-all">
                                <i className="ri-heart-line text-xl"></i>
                                Add to Favorites
                            </button>
                        </div>
                    </div>

                    {/* Episode Sidebar */}
                    <div className="w-full lg:w-80">
                        <div className="glass rounded-2xl p-5 sticky top-24">
                            <h3 className="text-white font-semibold mb-4 flex items-center justify-between">
                                <span className="flex items-center gap-2">
                                    <i className="ri-play-list-line text-nova-accent"></i>
                                    Episodios
                                </span>
                                <span className="text-nova-dim text-sm">{episodes.length || 12} en total</span>
                            </h3>
                            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                                {(episodes.length > 0 ? episodes : Array.from({ length: 12 }, (_, i) => ({ id: `ep-${i + 1}`, number: i + 1, title: `Episodio ${i + 1}` }))).map((ep) => (
                                    <Link
                                        key={ep.id}
                                        to={`/watch/${animeId}-episode-${ep.number}`}
                                        className={`flex items-center gap-3 p-3 rounded-xl transition-all ${String(ep.number) === episodeNum
                                            ? 'bg-nova-accent/20 text-nova-accent border border-nova-accent/30'
                                            : 'bg-nova-surface/50 text-nova-muted hover:bg-white/10 hover:text-white'
                                            }`}
                                    >
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium ${String(ep.number) === episodeNum ? 'gradient-accent' : 'bg-nova-bg'
                                            }`}>
                                            {ep.number}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm truncate">Episode {ep.number}</p>
                                            {ep.title && <p className="text-xs text-nova-dim truncate">{ep.title}</p>}
                                        </div>
                                        {String(ep.number) === episodeNum && (
                                            <i className="ri-play-fill text-nova-accent"></i>
                                        )}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main >
    );
}


