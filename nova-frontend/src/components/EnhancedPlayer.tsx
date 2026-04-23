import { useEffect, useRef, useState, useCallback } from 'react';
import type Hls from 'hls.js';

type ContentType = 'movie' | 'series' | 'anime' | 'sports';

interface EnhancedPlayerProps {
    src: string;
    title: string;
    poster?: string | null | undefined;
    autoPlay?: boolean;
    onEnded?: () => void;
    onReady?: () => void;
    onProgress?: (progress: number, currentTime: number, duration: number) => void;
    contentType?: ContentType;
    loading?: boolean;
    autoSwitching?: boolean;
    switchingToServer?: string;
    playerError?: string | null;
    episodeTag?: string;
    quality?: string;
    onRetry?: () => void;
}

const CONTENT_CONFIG: Record<ContentType, { label: string; icon: string; badgeClass: string; glowColor: string }> = {
    movie: {
        label: 'MOVIE',
        icon: 'ri-film-line',
        badgeClass: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        glowColor: 'rgba(59,130,246,0.15)',
    },
    series: {
        label: 'SERIES',
        icon: 'ri-tv-line',
        badgeClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        glowColor: 'rgba(16,185,129,0.15)',
    },
    anime: {
        label: 'ANIME',
        icon: 'ri-gamepad-line',
        badgeClass: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
        glowColor: 'rgba(139,92,246,0.15)',
    },
    sports: {
        label: 'LIVE',
        icon: 'ri-live-line',
        badgeClass: 'bg-red-500/20 text-red-400 border-red-500/30 animate-pulse',
        glowColor: 'rgba(239,68,68,0.15)',
    },
};

export default function EnhancedPlayer({
    src,
    title,
    poster,
    autoPlay = true,
    onEnded,
    onReady,
    onProgress,
    contentType = 'movie',
    loading = false,
    autoSwitching = false,
    switchingToServer,
    playerError,
    onRetry,
    quality,
    episodeTag,
}: EnhancedPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const config = CONTENT_CONFIG[contentType];
    const isHls = src.includes('.m3u8');

    useEffect(() => {
        if (!videoRef.current || !isHls || !src) return;

        let hls: Hls | null = null;
        let cancelled = false;

        const attachHls = async () => {
            const video = videoRef.current;
            if (!video) return;

            try {
                const { default: HlsCtor } = await import('hls.js');
                if (cancelled) return;

                if (HlsCtor.isSupported()) {
                    hls = new HlsCtor({ enableWorker: true, lowLatencyMode: true });
                    hls.loadSource(src);
                    hls.attachMedia(video);
                } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                    video.src = src;
                }
            } catch (error) {
                console.error('Failed to initialize HLS playback:', error);
            }
        };

        attachHls();
        return () => { cancelled = true; hls?.destroy(); };
    }, [src, isHls]);

    // Track fullscreen state
    useEffect(() => {
        const onChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', onChange);
        document.addEventListener('webkitfullscreenchange', onChange);
        return () => {
            document.removeEventListener('fullscreenchange', onChange);
            document.removeEventListener('webkitfullscreenchange', onChange);
        };
    }, []);

    // Double-click on player = toggle fullscreen
    const toggleFullscreen = useCallback(() => {
        const el = containerRef.current;
        if (!el) return;
        if (!document.fullscreenElement) {
            el.requestFullscreen?.() ?? (el as any).webkitRequestFullscreen?.();
        } else {
            document.exitFullscreen?.() ?? (document as any).webkitExitFullscreen?.();
        }
    }, []);

    // Keyboard: F = fullscreen, Esc handled by browser
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.key === 'f' || e.key === 'F') && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
                toggleFullscreen();
            }
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [toggleFullscreen]);

    const handleTimeUpdate = () => {
        if (videoRef.current && onProgress) {
            const { currentTime, duration } = videoRef.current;
            if (duration > 0) onProgress((currentTime / duration) * 100, currentTime, duration);
        }
    };

    const showOverlay = loading || autoSwitching || !!playerError;

    return (
        <div className="relative mb-6 group">
            {/* Ambient glow */}
            <div
                className="absolute -inset-1 rounded-[1.75rem] opacity-60 blur-xl transition-opacity duration-700 pointer-events-none"
                style={{
                    background: `radial-gradient(ellipse at center, ${config.glowColor}, transparent 70%)`,
                    opacity: loading || autoSwitching ? 0.8 : 0.4,
                }}
            />

            {/* Player container — ref used for native fullscreen */}
            <div
                ref={containerRef}
                className="relative aspect-video rounded-2xl overflow-hidden bg-[#08080c] border border-white/[0.08] shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
                onDoubleClick={!isHls ? toggleFullscreen : undefined}
            >
                {/* Video / iframe */}
                {isHls ? (
                    <video
                        ref={videoRef}
                        className="w-full h-full object-contain bg-black"
                        controls
                        poster={poster || undefined}
                        playsInline
                        title={title}
                        autoPlay={autoPlay}
                        onEnded={onEnded}
                        onLoadedMetadata={onReady}
                        onTimeUpdate={handleTimeUpdate}
                    />
                ) : (
                    <iframe
                        src={src}
                        className="w-full h-full border-0 bg-black"
                        allow="autoplay; fullscreen; picture-in-picture; encrypted-media; accelerometer; gyroscope; clipboard-write"
                        allowFullScreen
                        title={title}
                        referrerPolicy="no-referrer"
                        onLoad={onReady}
                        style={poster ? { backgroundImage: `url(${poster})`, backgroundSize: 'cover' } : undefined}
                    />
                )}

                {/* Watermark cover — sits over the iframe controls bar where vidsrc branding appears */}
                {!isHls && (
                    <div
                        className="absolute bottom-0 right-0 pointer-events-none z-[5]"
                        style={{ width: '90px', height: '36px', background: '#000' }}
                    />
                )}

                {/* Loading / switching / error overlay */}
                {showOverlay && (
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-10 animate-fade-in">
                        <div className="text-center max-w-sm px-6">
                            {(loading || autoSwitching) && !playerError && (
                                <div className="relative w-16 h-16 mx-auto mb-5">
                                    <div className="absolute inset-0 rounded-full border-[3px] border-white/10" />
                                    <div
                                        className="absolute inset-0 rounded-full border-[3px] border-t-transparent animate-spin"
                                        style={{
                                            borderColor: contentType === 'anime' ? 'rgb(139,92,246)' :
                                                contentType === 'series' ? 'rgb(16,185,129)' :
                                                    contentType === 'sports' ? 'rgb(239,68,68)' :
                                                        'rgb(59,130,246)',
                                            borderTopColor: 'transparent',
                                        }}
                                    />
                                    <div className="absolute inset-2 rounded-full border-[2px] border-white/5 border-b-transparent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
                                </div>
                            )}

                            {playerError && !autoSwitching && (
                                <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                                    <i className="ri-error-warning-line text-2xl text-red-400" />
                                </div>
                            )}

                            <p className="text-sm text-white/90 font-medium mb-1">
                                {autoSwitching
                                    ? <>Cambiando a <span className="text-nova-accent font-bold">{switchingToServer || 'siguiente servidor'}</span></>
                                    : playerError ? 'Error de reproducción'
                                        : 'Cargando stream...'}
                            </p>

                            {playerError && (
                                <p className="text-xs text-red-400/80 mb-4 leading-relaxed">{playerError}</p>
                            )}

                            {playerError && onRetry && !autoSwitching && (
                                <button
                                    onClick={onRetry}
                                    className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white text-xs font-bold transition-all hover:scale-105 flex items-center gap-2 mx-auto"
                                >
                                    <i className="ri-refresh-line" /> Try Again
                                </button>
                            )}

                            {autoSwitching && (
                                <div className="w-48 h-1 rounded-full bg-white/10 mx-auto mt-4 overflow-hidden">
                                    <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-transparent via-nova-accent to-transparent animate-shimmer" />
                                </div>
                            )}

                            {(episodeTag || quality) && !playerError && !autoSwitching && (
                                <div className="mt-4 flex items-center justify-center gap-2">
                                    {episodeTag && <span className="px-2 py-0.5 rounded bg-white/10 text-[10px] font-bold text-white/50">{episodeTag}</span>}
                                    {quality && <span className="px-2 py-0.5 rounded bg-white/10 text-[10px] font-bold text-white/50">{quality}</span>}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Fullscreen button — always visible on hover, bottom-right */}
                {!showOverlay && !isHls && (
                    <button
                        onClick={toggleFullscreen}
                        title={isFullscreen ? 'Salir de pantalla completa (F)' : 'Pantalla completa (F)'}
                        className="absolute bottom-3 right-3 z-20 w-9 h-9 rounded-lg bg-black/60 backdrop-blur border border-white/10 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-black/90 hover:scale-110"
                    >
                        <i className={isFullscreen ? 'ri-fullscreen-exit-line text-base' : 'ri-fullscreen-line text-base'} />
                    </button>
                )}

                {/* Inner ring */}
                <div className="pointer-events-none absolute inset-0 ring-1 ring-white/[0.04] rounded-2xl" />
            </div>
        </div>
    );
}
