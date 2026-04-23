import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { getStreams, Stream } from '../services/sportsService';
import EnhancedPlayer from '../components/EnhancedPlayer';
import { runSpeedTest } from '../utils/speedTest';
import SpeedTestLoader from '../components/SpeedTestLoader';

export default function SportsWatch() {
    const { source, streamId } = useParams<{ source: string; streamId: string }>();
    const [searchParams] = useSearchParams();

    const [streams, setStreams] = useState<Stream[]>([]);
    const [selectedStream, setSelectedStream] = useState<Stream | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [embedUrl, setEmbedUrl] = useState('');
    const [pendingEmbedUrl, setPendingEmbedUrl] = useState('');
    const [speedTesting, setSpeedTesting] = useState(false);
    const [speedTestError, setSpeedTestError] = useState<string | null>(null);
    const [speedTestNonce, setSpeedTestNonce] = useState(0);
    const [forceLoad, setForceLoad] = useState(false);

    const title = searchParams.get('title') || 'Live Event';
    const category = searchParams.get('category') || 'Sports';

    useEffect(() => {
        const fetchStreamData = async () => {
            if (!source || !streamId) return;
            setLoading(true);
            setError(null);
            try {
                const streamData = await getStreams(source, streamId);

                // Filter out streams with 0 viewers (usually offline/broken)
                // STRICT MODE: Only show streams with confirmed viewers
                const activeStreams = streamData.filter(s => (s.viewers || 0) > 0);

                // Sort by viewers (descending)
                const sortedStreams = activeStreams.sort((a, b) => (b.viewers || 0) - (a.viewers || 0));

                setStreams(sortedStreams);
                if (sortedStreams.length > 0) {
                    setSelectedStream(sortedStreams[0]);
                } else {
                    setError('No active streams found. The event might not have started yet.');
                }
            } catch (err: any) {
                console.error('Error fetching stream:', err);
                if (err.message && err.message.includes('Network Error')) {
                    setError('Backend Unreachable! Please ensure "npm run server" is running in nova-backend.');
                } else if (err.response && err.response.status === 500) {
                    setError('Backend Error. Check server logs.');
                } else {
                    setError('Failed to load streams. ' + (err.message || ''));
                }
            } finally {
                setLoading(false);
            }
        };
        fetchStreamData();
    }, [source, streamId]);

    useEffect(() => {
        setPendingEmbedUrl(selectedStream?.embedUrl || '');
    }, [selectedStream?.embedUrl]);

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
            } catch (err) {
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

    if (loading) {
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
                    {/* Main Content (Player) */}
                    <div className="flex-1 min-w-0">
                        {/* Video Player */}
                        {speedTesting || (!embedUrl && !forceLoad) ? (
                            <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl mb-6 relative group border border-white/5">
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
                                title={title}
                                poster={null}
                            />
                        )}

                        {/* Title & Info */}
                        <div className="mb-8">
                            <h1 className="text-2xl md:text-3xl font-black text-white mb-2 uppercase italic tracking-wider">
                                {title}
                            </h1>
                            <div className="flex items-center gap-4 text-nova-muted text-sm">
                                <span className="text-nova-accent font-bold px-2 py-0.5 bg-nova-accent/10 rounded">LIVE</span>
                                <span className="text-red-500 flex items-center gap-1 animate-pulse">
                                    <i className="ri-record-circle-line"></i> {category}
                                </span>
                            </div>
                        </div>

                        {/* Server Selector (Source) */}
                        <div className="glass rounded-2xl p-4 mb-8 flex items-center gap-4 flex-wrap">
                            <span className="text-white font-bold flex items-center gap-2">
                                <i className="ri-server-line text-nova-accent"></i>
                                Source:
                            </span>
                            <div className="flex flex-wrap gap-2 text-sm text-gray-400">
                                {streams.length > 0 ? "Multiple streams available below" : "Loading sources..."}
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="flex gap-4 mb-8">
                            <button className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white font-bold transition-all border border-white/5 flex items-center gap-2">
                                <i className="ri-refresh-line"></i> Refresh
                            </button>
                            <button className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white font-bold transition-all border border-white/5 flex items-center gap-2">
                                <i className="ri-error-warning-line"></i> Report
                            </button>
                        </div>
                    </div>

                    {/* Sidebar: Channels/STREAMS */}
                    <div className="w-full lg:w-96 shrink-0">
                        <div className="glass rounded-2xl p-6 sticky top-24 max-h-[calc(100vh-120px)] flex flex-col border border-white/5">
                            {/* Header */}
                            <div className="mb-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-white font-bold flex items-center gap-2">
                                        <i className="ri-signal-tower-line text-nova-accent"></i>
                                        Available Streams
                                    </h3>
                                    <span className="text-nova-dim text-xs font-mono">{streams.length} SIGNALS</span>
                                </div>
                            </div>
                            <div className="overflow-y-auto pr-2 custom-scrollbar flex-1 space-y-2">
                                {loading && <div className="text-center p-4 text-nova-muted">Scanning frequencies...</div>}
                                {error && <div className="text-center p-4 text-red-400">{error}</div>}

                                {streams.map((s, idx) => (
                                    <button
                                        key={`${s.id}-${idx}`}
                                        onClick={() => setSelectedStream(s)}
                                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left group ${selectedStream?.id === s.id
                                            ? 'bg-nova-accent text-white shadow-lg shadow-nova-accent/20'
                                            : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                                            }`}
                                    >
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${selectedStream?.id === s.id ? 'bg-white text-nova-accent' : 'bg-black/40'
                                            }`}>
                                            {s.streamNo}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-baseline justify-between mb-1">
                                                <span className={`text-xs font-bold ${selectedStream?.id === s.id ? 'text-white' : 'text-gray-500 group-hover:text-nova-accent'}`}>
                                                    STREAM {s.streamNo}
                                                </span>
                                                {s.hd && <span className="text-[10px] font-black bg-white/20 px-1.5 rounded text-white">HD</span>}
                                            </div>
                                            <h4 className="text-sm font-medium truncate leading-tight mb-1">
                                                {s.language || 'English'}
                                            </h4>
                                            {s.viewers !== undefined && (
                                                <div className="text-[10px] text-nova-muted flex items-center gap-1">
                                                    <i className="ri-user-line text-[9px]"></i>
                                                    {s.viewers} watching
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div >
        </main >
    );
}
