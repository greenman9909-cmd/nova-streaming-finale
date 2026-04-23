import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import ContentCard from './ContentCard';
import { ContentMediaType } from '../services/api';
import { useSettings } from '../context/SettingsContext';

interface ContentItem {
    id: string | number;
    tmdbId?: number;
    title: { english?: string; native?: string };
    image: string;
    rating?: number;
    type?: string;
    releaseDate?: string;
    badge?: string;
    isLive?: boolean;
    mediaType?: ContentMediaType;
    teams?: {
        home?: { name: string; badge?: string };
        away?: { name: string; badge?: string };
    };
    category?: string;
    sources?: { source: string; id: string }[];
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
    const { t } = useSettings();
    const scrollRef = useRef<HTMLDivElement>(null);
    const rafRef = useRef<number | null>(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(true);
    const [isHovering, setIsHovering] = useState(false);

    const updateArrows = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            setShowLeftArrow(scrollLeft > 20);
            setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 20);
        }
    };

    const scheduleArrowUpdate = () => {
        if (rafRef.current !== null) {
            cancelAnimationFrame(rafRef.current);
        }
        rafRef.current = requestAnimationFrame(updateArrows);
    };

    const handleScroll = () => {
        scheduleArrowUpdate();
    };

    useEffect(() => {
        scheduleArrowUpdate();
        const onResize = () => scheduleArrowUpdate();
        window.addEventListener('resize', onResize);
        return () => {
            window.removeEventListener('resize', onResize);
            if (rafRef.current !== null) {
                cancelAnimationFrame(rafRef.current);
            }
        };
    }, [items.length]);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const scrollAmount = 400;
            try {
                scrollRef.current.scrollBy({
                    left: direction === 'left' ? -scrollAmount : scrollAmount,
                    behavior: 'smooth'
                });
            } catch {
                scrollRef.current.scrollLeft += direction === 'left' ? -scrollAmount : scrollAmount;
            }
        }
    };

    return (
        <section
            className="content-row"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            {/* Header - 90% width layout */}
            <div className="flex items-center justify-between mb-1 content-row-header">
                <div className="flex items-center gap-3">
                    <h2 className={`content-row-title ${titleClassName}`}>
                        {title}
                    </h2>
                    {variant === 'live' && (
                        <span className="content-row-live">
                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                            LIVE
                        </span>
                    )}
                </div>

                {seeAllLink && (
                    <Link
                        to={seeAllLink}
                        className="content-row-more"
                    >
                        <span>{t('contentRow.seeMore')}</span>
                        <i className="ri-arrow-right-s-line"></i>
                    </Link>
                )}
            </div>

            {/* Content Scroll with Hover Arrows */}
            <div className="relative group">
                {/* Left Arrow - Show on hover */}
                <button
                    onClick={() => scroll('left')}
                    className={`content-row-arrow content-row-arrow-left -translate-y-1/2 ${showLeftArrow && isHovering ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none'
                        }`}
                    aria-label={t('contentRow.scrollLeft')}
                >
                    <i className="ri-arrow-left-s-line text-xl"></i>
                </button>

                {/* Right Arrow - Show on hover */}
                <button
                    onClick={() => scroll('right')}
                    className={`content-row-arrow content-row-arrow-right -translate-y-1/2 ${showRightArrow && isHovering ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none'
                        }`}
                    aria-label={t('contentRow.scrollRight')}
                >
                    <i className="ri-arrow-right-s-line text-xl"></i>
                </button>

                {/* Fade edges */}
                <div className={`content-row-fade content-row-fade-left ${showLeftArrow ? 'opacity-100' : 'opacity-0'}`} />
                <div className={`content-row-fade content-row-fade-right ${showRightArrow ? 'opacity-100' : 'opacity-0'}`} />

                <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="content-row-track flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth"
                    style={{
                        scrollSnapType: 'x mandatory',
                        paddingTop: '0.75rem',
                        paddingBottom: '2.25rem',
                        overflowY: 'visible',
                    }}
                >
                    {items.map((item, idx) => (
                        <div
                            key={`${item.id}-${item.type || item.mediaType || 'item'}-${idx}`}
                            style={{ scrollSnapAlign: 'start' }}
                        >
                            <ContentCard
                                id={item.id}
                                tmdbId={item.tmdbId}
                                title={item.title.english || item.title.native || 'Unknown'}
                                image={item.image}
                                type={item.type}
                                year={item.releaseDate}
                                link={getLink ? getLink(item) : `/watch/${item.mediaType || (item.type === 'Anime' ? 'tv' : (item.type === 'TV' ? 'tv' : 'movie'))}/${item.id}`}
                                badge={item.badge}
                                isLive={item.isLive}
                                mediaType={item.mediaType || (item.type === 'Movie' ? 'movie' : 'tv')}
                                variant={cardVariant}
                                teams={item.teams}
                                category={item.category}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
