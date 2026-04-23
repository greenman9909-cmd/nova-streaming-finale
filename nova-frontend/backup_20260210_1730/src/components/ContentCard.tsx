import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMovieVideos, getSeriesVideos } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface ContentCardProps {
    id: string;
    title: string;
    image: string;
    type?: string;
    year?: string;
    link?: string;
    badge?: string;
    isLive?: boolean;
    tmdbId?: number;
    mediaType?: 'movie' | 'tv';
    variant?: 'portrait' | 'landscape';
    teams?: {
        home?: { name: string; badge?: string };
        away?: { name: string; badge?: string };
    };
}

export default function ContentCard({ id, title, image, type, year, link, isLive, tmdbId, mediaType, variant = 'portrait', teams }: ContentCardProps) {
    const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useAuth();
    const navigate = useNavigate();
    const [imgError, setImgError] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [trailerKey, setTrailerKey] = useState<string | null>(null);
    const [trailerLoaded, setTrailerLoaded] = useState(false);
    const hoverTimeout = useRef<NodeJS.Timeout | null>(null);

    // Fetch trailer on first hover
    useEffect(() => {
        if (isHovered && tmdbId && !trailerKey) {
            hoverTimeout.current = setTimeout(async () => {
                try {
                    const videos = mediaType === 'movie'
                        ? await getMovieVideos(tmdbId)
                        : await getSeriesVideos(tmdbId);

                    // Find trailer
                    if (Array.isArray(videos)) {
                        const trailer = videos.find((v: any) => v.type === 'Trailer' && v.site === 'YouTube')
                            || videos.find((v: any) => v.type === 'Teaser' && v.site === 'YouTube')
                            || videos[0];

                        if (trailer?.key) {
                            setTrailerKey(trailer.key);
                        }
                    }
                } catch (err) {
                    console.log('No trailer found');
                }
            }, 400); // Faster delay for better UX
        }

        return () => {
            if (hoverTimeout.current) {
                clearTimeout(hoverTimeout.current);
            }
        };
    }, [isHovered, tmdbId, trailerKey, mediaType]);

    // Reset trailer when mouse leaves
    const handleMouseLeave = () => {
        setIsHovered(false);
        setTrailerLoaded(false);
    };

    return (
        <Link
            to={link || `/watch/${mediaType || 'tv'}/${id}`}
            className={`group block flex-shrink-0 transition-all duration-300 z-10 hover:z-50 hover:scale-110 ${variant === 'landscape' ? 'w-60 md:w-80' : 'w-36 md:w-48'}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={handleMouseLeave}
        >
            {/* Special Sports Layout - Preserved */}
            {type === 'Sports' && teams ? (
                <div className="relative aspect-video w-64 md:w-80 rounded-xl overflow-hidden mb-2 bg-[#0F0F13] transition-all duration-300 group-hover:transform group-hover:scale-105 group-hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] z-0 border border-white/5 group-hover:border-emerald-500/50">

                    {/* Live Badge */}
                    {isLive && (
                        <div className="absolute top-3 left-3 flex items-center gap-1.5 z-30 px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-bold shadow-lg shadow-red-600/20 animate-pulse">
                            <span className="w-1.5 h-1.5 bg-white rounded-full" />
                            LIVE
                        </div>
                    )}

                    {/* Background Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/40 to-black z-0" />
                    <div className="absolute inset-0 bg-black/40 z-0" />

                    {/* VS Content */}
                    <div className="absolute inset-0 z-10 flex items-center justify-between px-6">
                        {/* Home Team */}
                        <div className="flex flex-col items-center gap-2 w-1/3">
                            <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white/10 p-2 flex items-center justify-center backdrop-blur-sm border border-white/10">
                                {teams.home?.badge ? (
                                    <img src={`/api/sports/images/badge/${teams.home.badge}.webp`} alt={teams.home.name} className="w-full h-full object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
                                ) : (
                                    <span className="text-xl font-bold text-white">{teams.home?.name?.[0]}</span>
                                )}
                            </div>
                            <span className="text-[10px] md:text-xs font-bold text-white text-center leading-tight line-clamp-2">{teams.home?.name || 'Home'}</span>
                        </div>

                        {/* VS */}
                        <div className="flex flex-col items-center justify-center">
                            <span className="text-xl md:text-2xl font-black italic text-white/20">VS</span>
                            {isLive && <span className="text-[10px] text-emerald-400 font-mono mt-1">45:00</span>}
                        </div>

                        {/* Away Team */}
                        <div className="flex flex-col items-center gap-2 w-1/3">
                            <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white/10 p-2 flex items-center justify-center backdrop-blur-sm border border-white/10">
                                {teams.away?.badge ? (
                                    <img src={`/api/sports/images/badge/${teams.away.badge}.webp`} alt={teams.away.name} className="w-full h-full object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
                                ) : (
                                    <span className="text-xl font-bold text-white">{teams.away?.name?.[0]}</span>
                                )}
                            </div>
                            <span className="text-[10px] md:text-xs font-bold text-white text-center leading-tight line-clamp-2">{teams.away?.name || 'Away'}</span>
                        </div>
                    </div>

                    {/* Hover Overlay */}
                    <div className={`absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'} z-20`}>
                        <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/50">
                            <i className="ri-play-fill text-white text-2xl ml-1"></i>
                        </div>
                    </div>
                </div>
            ) : (
                // PRIME STYLE QUICK VIEW CARD
                <div className={`relative ${variant === 'landscape' ? 'aspect-video w-60 md:w-80' : 'aspect-[2/3] w-36 md:w-48'} rounded-lg overflow-hidden bg-[#18181b] shadow-lg transition-all duration-300 ${isHovered ? 'shadow-2xl ring-2 ring-white/10' : ''}`}>

                    {/* Image */}
                    {!imgError ? (
                        <img
                            src={image}
                            alt={title}
                            className={`w-full h-full object-cover transition-opacity duration-500 ${trailerLoaded && isHovered ? 'opacity-0' : 'opacity-100'}`}
                            loading="lazy"
                            onError={() => setImgError(true)}
                        />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800 text-gray-500 p-3">
                            <i className="ri-film-line text-3xl"></i>
                        </div>
                    )}

                    {/* Trailer Video (Absolute Overlay) */}
                    {isHovered && trailerKey && (
                        <div className="absolute inset-0 z-10 bg-black">
                            <iframe
                                src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&modestbranding=1&loop=1&playlist=${trailerKey}&vq=hd1080&hd=1`}
                                className={`w-[300%] h-[135%] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 object-cover transition-opacity duration-500 ${trailerLoaded ? 'opacity-100' : 'opacity-0'}`}
                                allow="autoplay; encrypted-media"
                                onLoad={() => setTrailerLoaded(true)}
                                style={{ border: 'none', pointerEvents: 'none' }}
                            />
                        </div>
                    )}

                    {/* Prime-Style Overlay Controls */}
                    {isHovered && (
                        <div className="absolute inset-0 z-20 flex flex-col justify-between p-3 bg-gradient-to-t from-black/90 via-black/40 to-transparent animate-fade-in text-left">

                            {/* Mute Icon (Top Right) */}
                            <div className="self-end">
                                <div className="w-7 h-7 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/10">
                                    <i className="ri-volume-mute-line text-xs"></i>
                                </div>
                            </div>

                            {/* Bottom Info Area */}
                            <div>
                                {/* Logo / Brand Placeholder - could be dynamic */}
                                {/* <div className="mb-2 h-4 w-12 bg-white/20 rounded-sm"></div> */}

                                {/* Title (if logo missing) */}
                                <h3 className="font-bold text-white text-sm leading-tight mb-1 drop-shadow-md line-clamp-2">
                                    {title}
                                </h3>

                                {/* Included with Nova+ Tag */}
                                <div className="flex items-center gap-1.5 mb-3">
                                    <i className="ri-checkbox-circle-fill text-[#00A8E1] text-xs"></i>
                                    <span className="text-[10px] font-bold text-gray-200">Included with Nova+</span>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-2">
                                    {/* Play Button - White */}
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            navigate(link || `/watch/${mediaType || 'tv'}/${id}`);
                                        }}
                                        className="flex-1 bg-white text-black py-1.5 rounded flex items-center justify-center gap-1 hover:bg-gray-200 transition-colors shadow-lg"
                                    >
                                        <i className="ri-play-fill text-lg"></i>
                                        <span className="font-bold text-[10px] uppercase tracking-wide">Play</span>
                                    </button>

                                    {/* Add List */}
                                    <button
                                        onClick={async (e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            const itemId = parseInt(id) || tmdbId || parseInt(id); // Ensure ID is valid
                                            // Fallback for non-numeric ID if needed, but assuming standard TMDB ID flow
                                            const numericId = typeof itemId === 'number' && !isNaN(itemId) ? itemId : parseInt(id);

                                            if (isInWatchlist(numericId)) {
                                                await removeFromWatchlist(numericId);
                                            } else {
                                                await addToWatchlist({
                                                    id: numericId,
                                                    title: title,
                                                    category: mediaType === 'movie' ? 'Movie' : 'Series',
                                                    image: image,
                                                    type: mediaType || 'tv',
                                                    mediaId: id,
                                                    addedAt: Date.now()
                                                });
                                            }
                                        }}
                                        className={`w-8 h-8 rounded-full border flex items-center justify-center text-white transition-all ${isInWatchlist(parseInt(id) || tmdbId || 0) ? 'bg-white border-white text-black' : 'bg-white/10 backdrop-blur border-white/20 hover:bg-white/20 hover:border-white/40'}`}
                                    >
                                        {isInWatchlist(parseInt(id) || tmdbId || 0) ? (
                                            <i className="ri-check-line font-bold"></i>
                                        ) : (
                                            <i className="ri-add-line"></i>
                                        )}
                                    </button>

                                    {/* Info */}
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            navigate(link || `/watch/${mediaType || 'tv'}/${id}`);
                                        }}
                                        className="w-8 h-8 rounded-full bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center text-white hover:bg-white/20 hover:border-white/40 transition-all"
                                    >
                                        <i className="ri-information-line"></i>
                                    </button>
                                </div>

                                {/* Metadata Row */}
                                <div className="flex items-center gap-2 mt-2 text-[10px] font-medium text-gray-400">
                                    <span className="border border-gray-600 px-1 rounded text-gray-300">16+</span>
                                    <span>{year || '2024'}</span>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            )}

            {/* Title Below (Hidden on hover for cleaner UI) */}
            {type !== 'Sports' && (
                <div className={`mt-2 transition-opacity duration-300 ${isHovered ? 'opacity-0' : 'opacity-100'}`}>
                    <h3 className="text-xs font-medium text-gray-300 truncate">{title}</h3>
                </div>
            )}
        </Link>
    );
}
