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
    const videoTimerRef = useRef<NodeJS.Timeout | null>(null);
    const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

    const currentItem = items[currentIndex];

    // Safety check
    if (!currentItem) return null;

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
        }, 180000); // 3 minutes for full trailers
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
            if (videoTimerRef.current) clearTimeout(videoTimerRef.current);
            try {
                const videos = isMovie
                    ? await getMovieVideos(currentItem.id)
                    : await getSeriesVideos(currentItem.id);

                // Prioritize: Official Trailer > Clip > Featurette > Any Trailer
                const youtubeVideos = videos.filter((v: any) => v.site === 'YouTube');
                const officialTrailer = youtubeVideos.find((v: any) => v.type === 'Trailer' && v.official === true);
                const clip = youtubeVideos.find((v: any) => v.type === 'Clip');
                const featurette = youtubeVideos.find((v: any) => v.type === 'Featurette');
                const anyTrailer = youtubeVideos.find((v: any) => v.type === 'Trailer');

                const bestVideo = officialTrailer || clip || featurette || anyTrailer;
                if (bestVideo) {
                    setVideoKey(bestVideo.key);
                    // Fast trailer loading - 1.5 seconds
                    videoTimerRef.current = setTimeout(() => {
                        setShowVideo(true);
                    }, 1500);
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

    return (
        <section className="relative w-full h-screen min-h-[640px] overflow-hidden bg-[#0a0a0f] text-white select-none">
            {/* Background Layer */}
            <div className="absolute inset-0">
                <img
                    src={getBackdropUrl(currentItem.backdrop_path, 'original') || ''}
                    alt={title}
                    className={`w-full h-full object-cover object-center transition-opacity duration-1000 ${showVideo ? 'opacity-0' : 'opacity-100'}`}
                />

                {/* Video Embed Logic - Crystal Clear Quality Fix */}
                {videoKey && showVideo && (
                    <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
                        <iframe
                            src={`https://www.youtube.com/embed/${videoKey}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=0&loop=1&playlist=${videoKey}&rel=0&showinfo=0&iv_load_policy=3&modestbranding=1&playsinline=1&vq=hd1080&hd=1&origin=${window.location.origin}`}
                            className="absolute top-1/2 left-1/2 w-[100vw] h-[56.25vw] min-h-[100vh] min-w-[177.77vh] -translate-x-1/2 -translate-y-1/2"
                            allow="autoplay; encrypted-media"
                            title="Trailer"
                        />
                    </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0f] via-[#0a0a0f]/60 to-transparent" style={{ width: '65%' }} />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/40 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0a0a0f] to-transparent" />
            </div>

            {/* Now Available Badge (Bottom Right) - Premium Polish */}
            <div className="absolute bottom-12 right-12 z-30 hidden md:flex items-center gap-3 px-6 py-3 rounded-full bg-[#0a0a0f]/40 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] transition-all duration-300 hover:bg-[#0a0a0f]/60 hover:scale-105 hover:border-white/20 group">
                <div className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]"></span>
                </div>
                <div className="flex flex-col">
                    <span className="text-white/60 text-[10px] font-bold tracking-[0.2em] uppercase leading-none mb-0.5">Stream It</span>
                    <span className="text-white font-bold text-xs tracking-[0.15em] uppercase leading-none group-hover:text-cyan-400 transition-colors">Now on Nova</span>
                </div>
            </div>

            {/* Volume Toggle */}
            {showVideo && videoKey && (
                <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="absolute top-24 right-8 z-30 w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white hover:bg-black/60 transition-all"
                >
                    <i className={`${isMuted ? 'ri-volume-mute-line' : 'ri-volume-up-line'} text-xl`}></i>
                </button>
            )}

            <div className="relative z-20 h-full flex flex-col justify-end pb-20 px-[5%] max-w-3xl">
                <h1 className="text-[52px] md:text-[68px] font-normal uppercase tracking-wide leading-[1] mb-2" style={{ fontFamily: "'Bebas Neue', 'Impact', sans-serif" }}>
                    {title}
                </h1>

                <div className="flex items-center gap-2 mb-4">
                    <span className="text-[#f5c518] font-bold text-sm tracking-wide">#1 Trending</span>
                </div>

                <p className="text-[15px] md:text-[16px] text-white/90 leading-[1.5] mb-6 max-w-xl line-clamp-2">
                    {currentItem.overview}
                </p>

                <div className="flex items-center gap-3 mb-6">
                    {/* Play Button */}
                    <button
                        onClick={() => navigate(`/watch/${itemType}/${currentItem.id}`)}
                        className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-white/90 text-black rounded-md font-semibold text-[15px] transition-all shadow-lg"
                    >
                        <i className="ri-play-fill text-xl"></i>
                        <span>Watch now</span>
                    </button>

                    {/* Watchlist Button */}
                    <button
                        onClick={handleWatchlist}
                        className={`flex items-center justify-center w-11 h-11 rounded-full border-2 transition-all ${isInWatchlist(currentItem.id) ? 'bg-white border-white text-black' : 'bg-white/10 border-white/50 hover:bg-white/20 hover:border-white text-white'}`}
                        title={isInWatchlist(currentItem.id) ? "Remove from List" : "Add to List"}
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
                    <span className="text-white text-[13px] font-medium">Included with Nova</span>
                </div>
            </div>

            {/* Pagination Dots (Same as before) */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 z-30">
                {items.slice(0, 6).map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setCurrentIndex(i)}
                        className={`transition-all duration-300 rounded-sm ${i === currentIndex ? 'w-6 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/60'}`}
                    />
                ))}
            </div>

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
