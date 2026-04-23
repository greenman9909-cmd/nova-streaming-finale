import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
    getSeriesDetails,
    getSeasonEpisodes,
    getImageUrl,
    TMDBSeriesDetails,
    TMDBEpisode
} from '../services/api';
import EnhancedPlayer from '../components/EnhancedPlayer';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { runSpeedTest } from '../utils/speedTest';
import SpeedTestLoader from '../components/SpeedTestLoader';

export default function AnimeWatch() {
    const { id } = useParams<{ id: string }>();
    // const navigate = useNavigate(); // Unused
    const { user } = useAuth();

    const [anime, setAnime] = useState<TMDBSeriesDetails | null>(null);
    const [episodes, setEpisodes] = useState<TMDBEpisode[]>([]);
    const [selectedSeason, setSelectedSeason] = useState(1);
    const [currentEpisode, setCurrentEpisode] = useState<TMDBEpisode | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedServer, setSelectedServer] = useState('vidsrc2');
    const [embedUrl, setEmbedUrl] = useState('');
    const [pendingEmbedUrl, setPendingEmbedUrl] = useState('');
    const [speedTesting, setSpeedTesting] = useState(false);
    const [speedTestError, setSpeedTestError] = useState<string | null>(null);
    const [speedTestNonce, setSpeedTestNonce] = useState(0);
    const [forceLoad, setForceLoad] = useState(false);

    // Parse ID (TMDB ID)
    const contentId = parseInt(id || '0');
    const force1080 = (url: string) => url.includes('?')
        ? `${url}&quality=1080&vq=hd1080&hd=1`
        : `${url}?quality=1080&vq=hd1080&hd=1`;

    // Initial Fetch
    useEffect(() => {
        if (!contentId) return;
        const fetchData = async () => {
            setLoading(true);
            try {
                const details = await getSeriesDetails(contentId);
                if (details) {
                    setAnime(details);
                    // Default to Season 1
                    const season1 = await getSeasonEpisodes(contentId, 1);
                    setEpisodes(season1);
                    if (season1.length > 0) {
                        setCurrentEpisode(season1[0]);
                    }
                }
            } catch (err) {
                console.error("Error loading anime details:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [contentId]);

    // Handle Season Change
    const handleSeasonChange = async (seasonNum: number) => {
        if (!contentId) return;
        setSelectedSeason(seasonNum);
        // Keep loading state local or silent? Better show a spinner if slow
        const eps = await getSeasonEpisodes(contentId, seasonNum);
        setEpisodes(eps);
    };

    const handleEpisodeChange = (ep: TMDBEpisode) => {
        setCurrentEpisode(ep);
    };

    const recordHistory = async (progress: number) => {
        if (!user || !contentId || !currentEpisode) return;
        const mediaId = `${contentId}-ep-${currentEpisode.episode_number}`;
        await supabase.from('watch_history').upsert({
            user_id: user.id,
            media_id: mediaId,
            media_type: 'anime',
            title: anime?.name || 'Anime',
            image: getImageUrl(anime?.backdrop_path || anime?.poster_path || null),
            progress,
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,media_id' });
    };

    useEffect(() => {
        if (!currentEpisode || !user) return;
        const interval = setInterval(() => {
            recordHistory(0);
        }, 30000);
        return () => clearInterval(interval);
    }, [currentEpisode, user]);

    // Construct Embed URL
    const getEmbedUrl = () => {
        if (!currentEpisode) return '';
        if (selectedServer === 'vidsrc2') {
            return force1080(`https://vidsrc.cc/v2/embed/tv/${contentId}/${selectedSeason}/${currentEpisode.episode_number}`);
        }
        if (selectedServer === 'vidsrcme') {
            return force1080(`https://vidsrcme.su/embed/tv/${contentId}/${selectedSeason}/${currentEpisode.episode_number}`);
        }
        return '';
    };

    useEffect(() => {
        const nextUrl = getEmbedUrl();
        setPendingEmbedUrl(nextUrl);
    }, [selectedServer, selectedSeason, currentEpisode, contentId]);

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
            } catch {
                if (cancelled) return;
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
                    {/* Main Content (Player) */}
                    <div className="flex-1 min-w-0">
                        {/* Video Player */}
                        {/* Video Player */}
                        {currentEpisode ? (
                            speedTesting || (!embedUrl && !forceLoad) ? (
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
                                    title={anime?.name || 'Anime'}
                                    // @ts-ignore
                                    poster={getImageUrl(anime?.backdrop_path)}
                                    onReady={() => recordHistory(0)}
                                    onEnded={() => recordHistory(100)}
                                />
                            )
                        ) : (
                            <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl mb-6 relative group border border-white/5 flex items-center justify-center text-gray-500">
                                Select an episode to play
                            </div>
                        )}

                        {/* Title & Info */}
                        <div className="mb-8">
                            <h1 className="text-2xl md:text-3xl font-black text-white mb-2 uppercase italic tracking-wider">
                                {anime?.name}
                            </h1>
                            <div className="flex items-center gap-4 text-nova-muted text-sm">
                                <span className="text-nova-accent font-bold px-2 py-0.5 bg-nova-accent/10 rounded">
                                    S{selectedSeason} E{currentEpisode?.episode_number}
                                </span>
                                <span>{currentEpisode?.name}</span>
                            </div>
                        </div>

                        {/* Server Selector */}
                        <div className="glass rounded-2xl p-4 mb-8 flex items-center gap-4">
                            <span className="text-white font-bold flex items-center gap-2">
                                <i className="ri-server-line text-nova-accent"></i>
                                Source:
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setSelectedServer('vidsrc2')}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${selectedServer === 'vidsrc2' ? 'bg-nova-accent text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                                >
                                    VidSrc 2 (1080p/Adaptive)
                                </button>
                                <button
                                    onClick={() => setSelectedServer('vidsrcme')}
                                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${selectedServer === 'vidsrcme' ? 'bg-nova-accent text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                                >
                                    VidSrcMe (Backup)
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar: Episodes */}
                    <div className="w-full lg:w-96 shrink-0">
                        <div className="glass rounded-2xl p-6 sticky top-24 max-h-[calc(100vh-120px)] flex flex-col border border-white/5">
                            {/* Header & Season Selector */}
                            <div className="mb-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-white font-bold flex items-center gap-2">
                                        <i className="ri-play-list-2-line text-nova-accent"></i>
                                        Episodes
                                    </h3>
                                    <span className="text-nova-dim text-xs font-mono">{episodes.length} EPISODES</span>
                                </div>

                                {anime?.seasons && (
                                    <div className="relative">
                                        <select
                                            value={selectedSeason}
                                            onChange={(e) => handleSeasonChange(parseInt(e.target.value))}
                                            className="w-full bg-black/40 border border-white/10 text-white text-sm rounded-xl px-4 py-3 outline-none focus:border-nova-accent appearance-none cursor-pointer"
                                        >
                                            {anime.seasons.filter(s => s.season_number > 0).map(s => (
                                                <option key={s.id} value={s.season_number}>
                                                    Season {s.season_number}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                            <i className="ri-arrow-down-s-line"></i>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Episode List */}
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
                                                src={getImageUrl(ep.still_path) || getImageUrl(anime?.poster_path || null)}
                                                alt=""
                                                className={`w-full h-full object-cover transition-opacity ${currentEpisode?.id === ep.id ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'}`}
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
                                                {ep.name}
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
