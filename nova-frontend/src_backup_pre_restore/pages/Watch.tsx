import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import EnhancedPlayer from '../components/EnhancedPlayer';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { runSpeedTest } from '../utils/speedTest';
import SpeedTestLoader from '../components/SpeedTestLoader';

interface Episode {
    id: string;
    number: number;
    title?: string;
    data_id?: number;
}

export default function Watch() {
    const { episodeId } = useParams<{ episodeId: string }>();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [embedUrl, setEmbedUrl] = useState('');
    const [pendingEmbedUrl, setPendingEmbedUrl] = useState('');
    // const [streamError, setStreamError] = useState('');
    const [selectedServer, setSelectedServer] = useState('hd-1');
    const [selectedType, setSelectedType] = useState('sub');
    const [episodes, setEpisodes] = useState<Episode[]>([]);
    const [servers, setServers] = useState<any[]>([]);
    const [playerReady, setPlayerReady] = useState(false);
    const [playerError, setPlayerError] = useState<string | null>(null);
    const [autoSwitching, setAutoSwitching] = useState(false);
    const [speedTesting, setSpeedTesting] = useState(false);
    const [speedTestError, setSpeedTestError] = useState<string | null>(null);
    const [speedTestNonce, setSpeedTestNonce] = useState(0);
    const [forceLoad, setForceLoad] = useState(false);

    const defaultServers = [
        { id: 'hd-1', name: 'HD-1', icon: 'ri-hd-line' },
        { id: 'hd-2', name: 'HD-2', icon: 'ri-hd-line' },
        { id: 'megacloud', name: 'MegaCloud', icon: 'ri-cloud-line' },
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

    // Fetch stream
    useEffect(() => {
        const fetchStream = async () => {
            setLoading(true);
            // setStreamError('');

            try {
                // Format: anime-id?ep=episode_data_id
                const currentEp = episodes.find(e => e.number === parseInt(episodeNum));
                const streamId = currentEp?.id || `${animeId}?ep=${episodeNum}`;

                const response = await fetch(
                    `/api/watch/${encodeURIComponent(streamId)}?server=${selectedServer}&type=${selectedType}`
                );

                if (response.ok) {
                    const data = await response.json();

                    if (data.success && data.results?.streamingLink) {
                        const stream = data.results.streamingLink[0];
                        if (stream?.link?.file) {
                            // Use embed player for HLS streams
                            setPendingEmbedUrl(`https://plyr.link/p/player.html#${btoa(stream.link.file)}`);
                        }
                    } else if (data.results?.sources) {
                        // Alternative source format
                        const source = data.results.sources[0];
                        if (source?.url) {
                            setPendingEmbedUrl(`https://plyr.link/p/player.html#${btoa(source.url)}`);
                        }
                    }

                    // Update servers if available
                    if (data.results?.servers) {
                        setServers(data.results.servers.map((s: any) => ({
                            id: s.server_name || s.server_id,
                            name: s.server_name?.toUpperCase() || `Server ${s.server_id}`,
                            icon: 'ri-server-line',
                            type: s.type
                        })));
                    }
                } else {
                    // Try direct API fallback
                    await tryDirectStream();
                }
            } catch (error) {
                console.error('Stream fetch failed:', error);
                await tryDirectStream();
            } finally {
                setLoading(false);
            }
        };

        const tryDirectStream = async () => {
            try {
                // Try direct API call as fallback
                const directResponse = await fetch(
                    `https://anime-peach-eight.vercel.app/api/stream?id=${animeId}?ep=${episodeNum}&server=${selectedServer}&type=${selectedType}`
                );
                if (directResponse.ok) {
                    const data = await directResponse.json();
                    if (data.success && data.results?.streamingLink?.[0]?.link?.file) {
                        setPendingEmbedUrl(`https://plyr.link/p/player.html#${btoa(data.results.streamingLink[0].link.file)}`);
                        return;
                    }
                }
            } catch (e) {
                console.error('Direct API fallback failed:', e);
            }
            // setStreamError('Stream sources unavailable. Try a different server.');
        };

        if (episodeId && animeId) {
            fetchStream();
        }
    }, [episodeId, selectedServer, selectedType, episodes, episodeNum, animeId]);

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
                if (result.mbps < 40) {
                    setEmbedUrl('');
                    setSpeedTestError('Need at least 40 Mbps for 1080p playback.');
                    return;
                }
                passed = true;
            } catch (error) {
                if (cancelled) return;
                setEmbedUrl('');
                setSpeedTestError('Speed test failed. Please retry.');
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
        if (!speedTestError || !pendingEmbedUrl) return;
        const timer = setTimeout(() => {
            setSpeedTestError(null);
            setForceLoad(true);
        }, 5000);
        return () => clearTimeout(timer);
    }, [speedTestError, pendingEmbedUrl]);

    const displayServers = servers.length > 0 ? servers : defaultServers;
    const serverIds = displayServers.map((s: any) => s.id);

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
        }, 9000);

        return () => clearTimeout(timeoutId);
    }, [embedUrl, playerReady, selectedServer, serverIds.join('|')]);

    useEffect(() => {
        if (!playerReady || !animeId || !user) return;
        const interval = setInterval(() => {
            recordHistory(0); // Update timestamp every 30s
        }, 30000);
        return () => clearInterval(interval);
    }, [playerReady, animeId, user]);

    const recordHistory = async (progress: number) => {
        if (!user || !animeId) return;
        const mediaId = `${animeId}-ep-${episodeNum}`;
        await supabase.from('watch_history').upsert({
            user_id: user.id,
            media_id: mediaId,
            media_type: 'tv',
            title: animeTitle,
            image: '',
            progress,
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,media_id' });
    };

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
                        {/* Video Player */}
                        <div className="relative aspect-video rounded-2xl overflow-hidden bg-nova-card mb-6">
                            {(speedTesting || (!embedUrl && !forceLoad)) ? (
                                <div className="absolute inset-0">
                                    <SpeedTestLoader
                                        message={speedTesting ? 'Testing internet (40 Mbps minimum)...' : 'Loading stream...'}
                                        showRetry={Boolean(speedTestError)}
                                        errorText={speedTestError}
                                        onRetry={() => setSpeedTestNonce((n) => n + 1)}
                                    />
                                </div>
                            ) : (
                                <EnhancedPlayer
                                    src={forceLoad ? pendingEmbedUrl : embedUrl}
                                    title={animeTitle}
                                    // @ts-ignore
                                    poster={null}
                                    onReady={() => {
                                        setPlayerReady(true);
                                        setPlayerError(null);
                                        setAutoSwitching(false);
                                        recordHistory(0);
                                    }}
                                    onEnded={() => recordHistory(100)}
                                />
                            )}
                            {!loading && !speedTesting && embedUrl && !playerReady && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                                    <div className="text-center">
                                        <div className="w-14 h-14 border-4 border-nova-accent border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                                        <p className="text-sm text-white/80">
                                            {autoSwitching ? 'Switching server...' : 'Loading stream...'}
                                        </p>
                                        {playerError && (
                                            <p className="text-xs text-red-400 mt-2">{playerError}</p>
                                        )}
                                    </div>
                                </div>
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
                                        onClick={() => setSelectedType(type)}
                                        className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all ${selectedType === type
                                            ? 'gradient-accent text-white glow-accent'
                                            : 'bg-nova-surface text-nova-muted hover:text-white hover:bg-white/10'
                                            }`}
                                    >
                                        <i className={type === 'sub' ? 'ri-closed-captioning-line' : 'ri-volume-up-line'}></i>
                                        {type === 'sub' ? 'Subtitled' : 'Dubbed'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Server Selection */}
                        <div className="glass rounded-2xl p-5 mb-6">
                            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                                <i className="ri-server-line text-nova-accent"></i>
                                Select Server
                            </h3>
                            <div className="flex flex-wrap gap-3">
                                {displayServers.map((server) => (
                                    <button
                                        key={server.id}
                                        onClick={() => setSelectedServer(server.id)}
                                        className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all ${selectedServer === server.id
                                            ? 'gradient-accent text-white glow-accent'
                                            : 'bg-nova-surface text-nova-muted hover:text-white hover:bg-white/10'
                                            }`}
                                    >
                                        <i className={server.icon}></i>
                                        {server.name}
                                    </button>
                                ))}
                            </div>
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
                                    Episodes
                                </span>
                                <span className="text-nova-dim text-sm">{episodes.length || 12} total</span>
                            </h3>
                            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                                {(episodes.length > 0 ? episodes : Array.from({ length: 12 }, (_, i) => ({ id: `ep-${i + 1}`, number: i + 1, title: `Episode ${i + 1}` }))).map((ep) => (
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
        </main>
    );
}
