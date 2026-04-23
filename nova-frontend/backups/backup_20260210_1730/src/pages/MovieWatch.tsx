import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
    getMovieDetails,
    getSeriesDetails,
    getSeasonEpisodes,
    getImageUrl,
    TMDBMovie,
    TMDBSeriesDetails,
    TMDBEpisode
} from '../services/api';
import EnhancedPlayer from '../components/EnhancedPlayer';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

export default function MovieWatch() {
    const { type, id } = useParams<{ type: string; id: string }>();
    const { user } = useAuth();

    const [content, setContent] = useState<TMDBMovie | TMDBSeriesDetails | null>(null);
    const [episodes, setEpisodes] = useState<TMDBEpisode[]>([]);
    const [selectedSeason, setSelectedSeason] = useState(1);
    const [selectedEpisode, setSelectedEpisode] = useState(1);
    const [loading, setLoading] = useState(true);
    const [embedUrl, setEmbedUrl] = useState('');
    const [selectedServer, setSelectedServer] = useState('vidsrc2');
    const [playerReady, setPlayerReady] = useState(false);
    const [playerError, setPlayerError] = useState<string | null>(null);
    const [autoSwitching, setAutoSwitching] = useState(false);
    const [effectiveQuality, setEffectiveQuality] = useState('1080p');

    const isMovie = type === 'movie';
    const contentId = parseInt(id || '0');

    // VidSrc 2 is Main (Best Quality/Adaptive)
    const servers = [
        { id: 'vidsrc2', name: 'VidSrc 2 (Main)', url: (id: number) => `https://vidsrc.cc/v2/embed/movie/${id}`, urlTv: (id: number, s: number, e: number) => `https://vidsrc.cc/v2/embed/tv/${id}/${s}/${e}` },
        { id: 'vidsrcme', name: 'VidSrcMe', url: (id: number) => `https://vidsrcme.su/embed/movie/${id}`, urlTv: (id: number, s: number, e: number) => `https://vidsrcme.su/embed/tv/${id}/${s}/${e}` },
        { id: 'vidsrc', name: 'VidSrc (Backup)', url: (id: number) => `https://vidsrc.to/embed/movie/${id}`, urlTv: (id: number, s: number, e: number) => `https://vidsrc.to/embed/tv/${id}/${s}/${e}` },
        { id: 'pro', name: 'Pro (Back)', url: (id: number) => `https://vidsrc.net/embed/movie/${id}`, urlTv: (id: number, s: number, e: number) => `https://vidsrc.net/embed/tv/${id}/${s}/${e}` },
        { id: 'xyz', name: 'XYZ', url: (id: number) => `https://vidsrc.xyz/embed/movie/${id}`, urlTv: (id: number, s: number, e: number) => `https://vidsrc.xyz/embed/tv/${id}/${s}/${e}` },
        { id: 'vip', name: 'VIP', url: (id: number) => `https://vidsrc.vip/embed/movie/${id}`, urlTv: (id: number, s: number, e: number) => `https://vidsrc.vip/embed/tv/${id}/${s}/${e}` },
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
                    // Default to Season 1 or restore? defaulting to 1
                    const eps = await getSeasonEpisodes(contentId, 1);
                    setEpisodes(eps);
                }
            } catch (error) {
                console.error('Error fetching content:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchContent();
    }, [contentId, type]);

    // Dynamic URL generation based on selected server
    useEffect(() => {
        if (!contentId) return;
        const server = servers.find(s => s.id === selectedServer) || servers[0];
        if (isMovie) {
            setEmbedUrl(server.url(contentId));
        } else {
            setEmbedUrl(server.urlTv(contentId, selectedSeason, selectedEpisode));
        }
        setPlayerReady(false);
        setPlayerError(null);
        setAutoSwitching(false);
    }, [selectedServer, contentId, isMovie, selectedSeason, selectedEpisode]);

    useEffect(() => {
        if (!embedUrl) return;
        const timeoutId = setTimeout(() => {
            if (playerReady) return;
            const currentIndex = servers.findIndex(s => s.id === selectedServer);
            if (currentIndex >= 0 && currentIndex < servers.length - 1) {
                setAutoSwitching(true);
                setSelectedServer(servers[currentIndex + 1].id);
            } else {
                setPlayerError('This source did not load. Try another server.');
            }
        }, 9000);

        return () => clearTimeout(timeoutId);
    }, [embedUrl, playerReady, selectedServer, servers.length]);

    useEffect(() => {
        const testSpeed = async () => {
            if (!content) return;
            try {
                const testUrl = `https://image.tmdb.org/t/p/w300${(content as any).backdrop_path || (content as any).poster_path || ''}?ts=${Date.now()}`;
                const start = performance.now();
                const res = await fetch(testUrl, { cache: 'no-store' });
                if (!res.ok) return;
                const blob = await res.blob();
                const duration = (performance.now() - start) / 1000;
                const sizeBits = blob.size * 8;
                const mbps = sizeBits / duration / 1_000_000;
                setEffectiveQuality(mbps < 8 ? '1080p' : '4K');
            } catch {
                setEffectiveQuality('1080p');
            }
        };
        testSpeed();
    }, [contentId, content]);

    const recordHistory = async (progress: number) => {
        if (!user || !contentId || !content) return;
        const title = isMovie ? (content as TMDBMovie).title : (content as TMDBSeriesDetails).name;
        const image = getImageUrl((content as any).backdrop_path || (content as any).poster_path);
        await supabase.from('watch_history').upsert({
            user_id: user.id,
            media_id: `${contentId}`,
            media_type: isMovie ? 'movie' : 'tv',
            title,
            image,
            progress,
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,media_id' });
    };

    const handleSeasonChange = async (seasonNum: number) => {
        setSelectedSeason(seasonNum);
        const eps = await getSeasonEpisodes(contentId, seasonNum);
        setEpisodes(eps);
        setSelectedEpisode(1);
    };

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

    return (
        <main className="min-h-screen bg-nova-bg pt-20 pb-12">
            <div className="max-w-screen-2xl mx-auto px-4 lg:px-6">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Main Content (Player) */}
                    <div className="flex-1 min-w-0">
                        {/* Video Player */}
                        <EnhancedPlayer
                            src={embedUrl}
                            title={isMovie ? (content as TMDBMovie).title : (content as TMDBSeriesDetails).name}
                            poster={getImageUrl(content.backdrop_path)}
                            onReady={() => {
                                setPlayerReady(true);
                                setPlayerError(null);
                                setAutoSwitching(false);
                                recordHistory(0);
                            }}
                            onEnded={() => recordHistory(100)}
                        />
                        {!playerReady && (
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

                        {/* Title & Info */}
                        <div className="mb-8">
                            {/* Anime Redirect Button */}
                            {content.genres?.some(g => g.id === 16) && (
                                <button
                                    onClick={() => window.location.href = `/anime/watch/${contentId}`}
                                    className="w-full md:w-auto self-start mb-4 px-6 py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl font-bold text-white shadow-lg shadow-violet-500/20 hover:scale-105 transition-transform flex items-center gap-2"
                                >
                                    <i className="ri-magic-line text-xl"></i>
                                    <span>Better Quality Available (1080p) - Switch to Anime Player</span>
                                </button>
                            )}

                            <h1 className="text-2xl md:text-3xl font-black text-white mb-2 uppercase italic tracking-wider">
                                {isMovie ? (content as TMDBMovie).title : (content as TMDBSeriesDetails).name}
                            </h1>
                            <div className="flex items-center gap-4 text-nova-muted text-sm">
                                {!isMovie && (
                                    <span className="text-nova-accent font-bold px-2 py-0.5 bg-nova-accent/10 rounded">
                                        S{selectedSeason} E{selectedEpisode}
                                    </span>
                                )}
                                <span className="opacity-80">{isMovie ? (content as TMDBMovie).release_date : (content as TMDBSeriesDetails).first_air_date}</span>
                                <span className="text-yellow-500 flex items-center gap-1">
                                    <i className="ri-star-fill"></i> {content.vote_average?.toFixed(1)}
                                </span>
                                <span className="text-xs px-2 py-0.5 rounded bg-white/5 border border-white/10">
                                    Quality: {effectiveQuality}
                                </span>
                            </div>
                        </div>

                        {/* Server Selector */}
                        <div className="glass rounded-2xl p-4 mb-8 flex items-center gap-4 flex-wrap">
                            <span className="text-white font-bold flex items-center gap-2">
                                <i className="ri-server-line text-nova-accent"></i>
                                Source:
                            </span>
                            <div className="flex flex-wrap gap-2">
                                {servers.map(server => (
                                    <button
                                        key={server.id}
                                        onClick={() => setSelectedServer(server.id)}
                                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${selectedServer === server.id
                                            ? 'bg-nova-accent text-white'
                                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                            }`}
                                    >
                                        {server.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Overview */}
                        <div className="glass rounded-2xl p-6 border border-white/5">
                            <h3 className="text-white font-bold mb-2">Overview</h3>
                            <p className="text-gray-400 leading-relaxed text-sm">
                                {content.overview}
                            </p>
                        </div>
                    </div>

                    {/* Sidebar: Episodes (For Series) */}
                    {!isMovie && (content as TMDBSeriesDetails).seasons && (
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
                                                        Season {s.season_number}
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
                                                    src={getImageUrl(ep.still_path) || getImageUrl(content.poster_path)}
                                                    alt=""
                                                    className={`w-full h-full object-cover transition-opacity ${selectedEpisode === ep.episode_number ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'}`}
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
