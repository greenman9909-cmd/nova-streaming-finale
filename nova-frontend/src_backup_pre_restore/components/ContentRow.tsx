import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import ContentCard from './ContentCard';

interface ContentItem {
    id: string;
    tmdbId?: number; // Added for trailers
    title: { english?: string; native?: string };
    image: string;
    rating?: number;
    type?: string;
    releaseDate?: string;
    badge?: string;
    isLive?: boolean;
}

interface ContentRowProps {
    title: string;
    items: ContentItem[];
    seeAllLink?: string;
    getLink?: (item: ContentItem) => string;
    variant?: 'default' | 'large' | 'live';
    cardVariant?: 'portrait' | 'landscape';
    titleClassName?: string;
}

export default function ContentRow({ title, items, seeAllLink, getLink, variant = 'default', cardVariant = 'portrait', titleClassName = "text-white" }: ContentRowProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(true);
    const [isHovering, setIsHovering] = useState(false);

    const handleScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            setShowLeftArrow(scrollLeft > 20);
            setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 20);
        }
    };

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const scrollAmount = 400;
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    return (
        <section
            className="py-6"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            {/* Header - 90% width layout */}
            <div className="px-[5%] flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <h2 className={`font-semibold text-lg md:text-xl ${titleClassName}`}>
                        {title}
                    </h2>
                    {variant === 'live' && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-bold">
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                            LIVE
                        </span>
                    )}
                </div>

                {seeAllLink && (
                    <Link
                        to={seeAllLink}
                        className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors"
                    >
                        <span>See more</span>
                        <i className="ri-arrow-right-s-line"></i>
                    </Link>
                )}
            </div>

            {/* Content Scroll with Hover Arrows */}
            <div className="relative group">
                {/* Left Arrow - Show on hover */}
                <button
                    onClick={() => scroll('left')}
                    className={`absolute left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/80 backdrop-blur flex items-center justify-center text-white transition-all duration-300 ${showLeftArrow && isHovering ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none'
                        }`}
                >
                    <i className="ri-arrow-left-s-line text-xl"></i>
                </button>

                {/* Right Arrow - Show on hover */}
                <button
                    onClick={() => scroll('right')}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/80 backdrop-blur flex items-center justify-center text-white transition-all duration-300 ${showRightArrow && isHovering ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none'
                        }`}
                >
                    <i className="ri-arrow-right-s-line text-xl"></i>
                </button>

                {/* Fade edges */}
                <div className={`absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#030305] to-transparent z-10 pointer-events-none transition-opacity duration-300 ${showLeftArrow ? 'opacity-100' : 'opacity-0'}`} />
                <div className={`absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#030305] to-transparent z-10 pointer-events-none transition-opacity duration-300 ${showRightArrow ? 'opacity-100' : 'opacity-0'}`} />

                <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="flex gap-4 overflow-x-auto scrollbar-hide py-4 px-[5%] scroll-smooth"
                    style={{ scrollSnapType: 'x mandatory', paddingBottom: '3rem' }} // Added extra bottom padding for hover effects
                >
                    {items.map((item) => (
                        <div
                            key={item.id}
                            style={{ scrollSnapAlign: 'start' }}
                        >
                            <ContentCard
                                id={item.id}
                                tmdbId={item.tmdbId}
                                title={item.title.english || item.title.native || 'Unknown'}
                                image={item.image}
                                type={item.type}
                                year={item.releaseDate}
                                link={getLink ? getLink(item) : `/watch/${(item as any).mediaType || (item.type === 'Anime' ? 'tv' : (item.type === 'TV' ? 'tv' : 'movie'))}/${item.id}`}
                                badge={item.badge}
                                isLive={item.isLive}
                                mediaType={(item as any).mediaType || (item.type === 'Movie' ? 'movie' : 'tv')}
                                variant={cardVariant}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
