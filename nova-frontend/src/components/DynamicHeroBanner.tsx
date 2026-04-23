import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    getBackdropUrl,
    getMovieVideos,
    getSeriesVideos,
    TMDBMovie,
    TMDBSeries
} from '../services/api';
import { useAuth } from '../context/AuthContext';

interface DynamicHeroBannerProps {
    items: (TMDBMovie | TMDBSeries)[];
}

const DynamicHeroBanner: React.FC<DynamicHeroBannerProps> = ({ items }) => {
    const navigate = useNavigate();
    const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useAuth();

    // State restoration
    const [currentIndex, setCurrentIndex] = useState(0);
    const [videoKey, setVideoKey] = useState<string | null>(null);
    const [showVideo, setShowVideo] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [videoUnavailable, setVideoUnavailable] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const videoTimerRef = useRef<NodeJS.Timeout | null>(null);
    const autoPlayRef = useRef<NodeJS.Timeout | null>(null);
    const rejectedVideoKeysRef = useRef<Set<string>>(new Set());
    const sectionRef = useRef<HTMLElement>(null);

    const currentItem = items[currentIndex];

    // Safety check
    if (!currentItem) return null;

    // Preload adjacent images so the browser has them ready before the slide changes
    useEffect(() => {
        if (!items.length) return;
        const toPreload = [
            items[(currentIndex + 1) % items.length],
            items[(currentIndex - 1 + items.length) % items.length],
        ];
        toPreload.forEach((item) => {
            if (!item) return;
            const url = getBackdropUrl(item.backdrop_path, 'original');
            if (url) {
                const img = new Image();
                img.fetchPriority = 'low';
                img.src = url;
            }
        });
    }, [currentIndex, items]);

    const isMovie = 'title' in currentItem && !('name' in currentItem);
    const title = 'name' in currentItem ? (currentItem as TMDBSeries).name : (currentItem as TMDBMovie).title;
    const itemType = isMovie ? 'movie' : 'tv';

    // Randomize on first load or when items change
    useEffect(() => {
        if (!items.length) return;
        setCurrentIndex(Math.floor(Math.random() * items.length));
    }, [items.length]);

    // Auto-advance carousel
    useEffect(() => {
        if (items.length === 0) return;
        autoPlayRef.current = setInterval(() => {
            handleNext();
        }, 7000); // 7 seconds per slide
        return () => {
            if (autoPlayRef.current) clearInterval(autoPlayRef.current);
        };
    }, [currentIndex, items.length]);

    const handleNext = () => {
        setCurrentIndex((prev) => (prev + 1) % items.length);
    };

    const handlePrev = () => {
        setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
    };

    // Fetch video and handle delayed playback
    useEffect(() => {
        if (!currentItem) return;
        const fetchVideo = async () => {
            setShowVideo(false);
            setVideoKey(null);
            setVideoUnavailable(false);
            if (videoTimerRef.current) clearTimeout(videoTimerRef.current);
            try {
                const videos = isMovie
                    ? await getMovieVideos(currentItem.id)
                    : await getSeriesVideos(currentItem.id);

                // Filter to YouTube only, exclude previously rejected keys
                const youtubeVideos = videos.filter((v: any) =>
                    v.site === 'YouTube' && v.key && !rejectedVideoKeysRef.current.has(v.key)
                );

                // Score each video: official trailers in high quality win
                const scoreVideo = (v: any): number => {
                    let score = 0;
                    if (v.official === true) score += 100;
                    if (v.type === 'Trailer') score += 80;
                    else if (v.type === 'Teaser') score += 40;
                    else if (v.type === 'Clip') score += 20;
                    else if (v.type === 'Featurette') score += 10;
                    // Prefer newer uploads (higher published_at sorts better)
                    if (v.published_at) score += 5;
                    return score;
                };

                const ranked = [...youtubeVideos].sort((a, b) => scoreVideo(b) - scoreVideo(a));
                const bestVideo = ranked[0];

                if (bestVideo) {
                    setVideoKey(bestVideo.key);
                    // Show video after brief pause so backdrop is visible first
                    videoTimerRef.current = setTimeout(() => {
                        setShowVideo(true);
                    }, 2000);
                } else {
                    setVideoKey(null);
                    setShowVideo(false);
                }
            } catch (err) {
                console.error("Failed to fetch trailer", err);
            }
        };
        fetchVideo();
        return () => {
            if (videoTimerRef.current) clearTimeout(videoTimerRef.current);
        };
    }, [currentIndex, currentItem?.id, isMovie]);

    useEffect(() => {
        if (!videoKey || !showVideo) return;

        const handleYouTubeMessage = (event: MessageEvent) => {
            if (typeof event.data !== 'string' || !event.origin.includes('youtube')) return;

            try {
                const payload = JSON.parse(event.data);
                if (payload?.event !== 'onError') return;

                rejectedVideoKeysRef.current.add(videoKey);
                setVideoUnavailable(true);
                setShowVideo(false);
                setVideoKey(null);
            } catch {
                // Ignore non-JSON postMessages
            }
        };

        window.addEventListener('message', handleYouTubeMessage);
        return () => window.removeEventListener('message', handleYouTubeMessage);
    }, [videoKey, showVideo]);

    const handleWatchlist = async () => {
        if (isInWatchlist(currentItem.id)) {
            await removeFromWatchlist(currentItem.id);
        } else {
            await addToWatchlist({
                id: currentItem.id,
                title: title,
                category: isMovie ? 'Movie' : 'Series',
                image: getBackdropUrl(currentItem.backdrop_path, 'original') || '',
                type: itemType,
                mediaId: currentItem.id.toString(),
                addedAt: Date.now()
            });
        }
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
        if (!sectionRef.current || showVideo) return;
        const rect = sectionRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
        setMousePos({ x, y });
    };

    const handleSectionMouseLeave = () => setMousePos({ x: 0, y: 0 });

    return (
        <section
            ref={sectionRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleSectionMouseLeave}
            className="relative w-full h-[88vh] min-h-[580px] overflow-hidden bg-[#0d0d0f] text-white select-none"
        >
            {/* Background Layer */}
            <div className="absolute inset-0">
                <img
                    src={getBackdropUrl(currentItem.backdrop_path, 'original') || ''}
                    alt={title}
                    fetchPriority="high"
                    loading="eager"
                    decoding="async"
                    className={`w-full h-full object-cover object-center ${showVideo ? 'opacity-20' : 'opacity-100'}`}
                    style={{
                        imageRendering: 'auto',
                        willChange: 'opacity, transform',
                        filter: showVideo ? 'brightness(0.7)' : 'none',
                        transform: showVideo
                            ? 'scale(1.02)'
                            : `scale(1.08) translate(${mousePos.x * -14}px, ${mousePos.y * -7}px)`,
                        transition: 'opacity 800ms ease, transform 180ms ease-out',
                    }}
                />

                {/* Video Embed Logic - High Quality Trailer */}
                {videoKey && showVideo && !videoUnavailable && (
                    <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
                        <iframe
                            src={`https://www.youtube-nocookie.com/embed/${videoKey}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=0&loop=1&playlist=${videoKey}&rel=0&iv_load_policy=3&modestbranding=1&playsinline=1&enablejsapi=1&cc_load_policy=0&hl=es&origin=${encodeURIComponent(window.location.origin)}`}
                            className="hero-video-embed w-[100vw] h-[56.25vw] min-h-[100vh] min-w-[177.77vh] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                            allow="autoplay; encrypted-media; fullscreen"
                            referrerPolicy="strict-origin-when-cross-origin"
                            title="Trailer"
                        />
                    </div>
                )}

                {/* Gradient layers — keep image crisp, darken only edges */}
                <div className="absolute inset-y-0 left-0 w-[60%] bg-gradient-to-r from-[#0d0d0f]/90 via-[#0d0d0f]/50 to-transparent" />
                <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[#0d0d0f]/50 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-[#0d0d0f] via-[#0d0d0f]/60 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#0d0d0f]/20" />
            </div>

            {/* Now Available Badge (Bottom Right) - Premium Polish */}
            {/* <div className="absolute bottom-24 right-12 z-30 hidden md:flex items-center gap-3 px-6 py-3 rounded-full bg-[#0a0a0f]/40 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] transition-all duration-300 hover:bg-[#0a0a0f]/60 hover:scale-105 hover:border-white/20 group">
                <div className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]"></span>
                </div>
                <div className="flex flex-col">
                    <span className="text-white/60 text-[10px] font-bold tracking-[0.2em] uppercase leading-none mb-0.5">Reprodúcelo</span>
                    <span className="text-white font-bold text-xs tracking-[0.15em] uppercase leading-none group-hover:text-cyan-400 transition-colors">Ahora en Nova</span>
                </div>
            </div> */}

            {/* Volume Toggle */}
            {showVideo && videoKey && !videoUnavailable && (
                <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="absolute top-24 right-8 z-30 w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white hover:bg-black/60 transition-all"
                >
                    <i className={`${isMuted ? 'ri-volume-mute-line' : 'ri-volume-up-line'} text-xl`}></i>
                </button>
            )}

            <div key={currentIndex} className="relative z-20 h-full flex flex-col justify-end pb-28 page-gutter max-w-3xl">
                <h1 className="hero-text-animate text-[52px] md:text-[68px] font-normal uppercase tracking-[0.02em] leading-[0.95] mb-3 text-white drop-shadow-[0_8px_30px_rgba(0,0,0,0.45)]" style={{ fontFamily: "'Bebas Neue', 'Impact', sans-serif" }}>
                    {title}
                </h1>

                <div className="hero-text-animate hero-text-animate-2 flex items-center gap-2 mb-4">
                    <span className="text-[#f5c518] font-bold text-sm tracking-wide">#1 en tendencia</span>
                </div>

                <p className="hero-text-animate hero-text-animate-3 text-[15px] md:text-[16px] text-white/92 leading-[1.55] mb-6 max-w-xl line-clamp-3 drop-shadow-[0_4px_20px_rgba(0,0,0,0.45)]">
                    {currentItem.overview}
                </p>

                <div className="hero-text-animate hero-text-animate-4 flex items-center gap-3 mb-6">
                    {/* Play Button */}
                    <button
                        onClick={() => navigate(`/watch/${itemType}/${currentItem.id}`)}
                        className="nova-btn-pop flex items-center gap-2 px-6 py-3 bg-white hover:bg-white/90 text-black rounded-md font-semibold text-[15px] transition-all shadow-lg"
                    >
                        <i className="ri-play-fill text-xl"></i>
                        <span>Ver ahora</span>
                    </button>

                    {/* Watchlist Button */}
                    <button
                        onClick={handleWatchlist}
                        className={`flex items-center justify-center w-11 h-11 rounded-full border-2 transition-all ${isInWatchlist(currentItem.id) ? 'bg-white border-white text-black' : 'bg-white/10 border-white/50 hover:bg-white/20 hover:border-white text-white'}`}
                        title={isInWatchlist(currentItem.id) ? "Quitar de mi lista" : "Añadir a mi lista"}
                    >
                        {isInWatchlist(currentItem.id) ? (
                            <i className="ri-check-line text-xl font-bold"></i>
                        ) : (
                            <i className="ri-add-line text-xl"></i>
                        )}
                    </button>

                    {/* Info Button */}
                    <button
                        onClick={() => navigate(`/watch/${itemType}/${currentItem.id}`)}
                        className="flex items-center justify-center w-11 h-11 rounded-full bg-white/10 border-2 border-white/50 hover:bg-white/20 hover:border-white transition-all"
                    >
                        <i className="ri-information-line text-xl"></i>
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-[#00a8e1] flex items-center justify-center">
                        <i className="ri-check-line text-white text-[10px]"></i>
                    </div>
                    <span className="text-white text-[13px] font-medium">Incluido con Nova</span>
                </div>
            </div>

            {/* Pagination removed per design feedback */}

            {/* Arrows (Same as before) */}
            <button onClick={handlePrev} className="absolute left-4 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white transition-all z-30">
                <i className="ri-arrow-left-s-line text-4xl"></i>
            </button>
            <button onClick={handleNext} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white transition-all z-30">
                <i className="ri-arrow-right-s-line text-4xl"></i>
            </button>
        </section>
    );
};

export default DynamicHeroBanner;
