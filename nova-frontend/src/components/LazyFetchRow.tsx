import { useState, useEffect, useRef } from 'react';
import ContentRow from './ContentRow';
import ContentRowSkeleton from './ContentRowSkeleton';
import { ContentMediaType } from '../services/api';
import { MatchSource, MatchTeam } from '../services/sportsService';

export interface ContentItem {
    id: string | number;
    tmdbId?: number;
    title: { english?: string; native?: string };
    image: string;
    rating?: number;
    type?: string;
    releaseDate?: string;
    isLive?: boolean;
    mediaType?: ContentMediaType;
    category?: string;
    sources?: MatchSource[];
    teams?: {
        home?: MatchTeam;
        away?: MatchTeam;
    };
}

interface LazyFetchRowProps {
    title: string;
    fetchFn: () => Promise<ContentItem[]>;
    seeAllLink?: string;
    getLink?: (item: ContentItem) => string;
    titleClassName?: string;
    variant?: 'default' | 'large' | 'live';
    cardVariant?: 'portrait' | 'landscape';
}

export default function LazyFetchRow({
    title,
    fetchFn,
    seeAllLink,
    getLink,
    titleClassName,
    variant = 'default',
    cardVariant = 'portrait'
}: LazyFetchRowProps) {
    const [items, setItems] = useState<ContentItem[]>([]);
    const [isDataLoaded, setIsDataLoaded] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [renderedCount, setRenderedCount] = useState(6); // Only render 6 items initially to keep DOM incredibly light
    const observerRef = useRef<HTMLDivElement>(null);
    const fetchFnRef = useRef(fetchFn);
    const hasFetchedRef = useRef(false);

    useEffect(() => {
        fetchFnRef.current = fetchFn;
    }, [fetchFn]);

    // 1. FETCH WHEN NEAR VIEWPORT: Avoids heavy parallel requests at initial load
    useEffect(() => {
        if (!isVisible || hasFetchedRef.current) return;
        hasFetchedRef.current = true;

        let mounted = true;
        fetchFnRef.current().then(data => {
            if (mounted) {
                setItems(data);
                setIsDataLoaded(true);
            }
        }).catch(err => {
            console.error(err);
            if (mounted) setIsDataLoaded(true);
        });
        return () => { mounted = false; };
    }, [isVisible]);

    // 2. RENDER DEFERRED: We only trigger React to build the heavy DOM blocks when user scrolls near
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect(); // Stop observing once triggered
                }
            },
            { rootMargin: '1500px' } // Huge margin so it renders long before user sees it
        );

        if (observerRef.current) {
            observer.observe(observerRef.current);
        }
        return () => observer.disconnect();
    }, []);

    // 3. HORIZONTAL STAGGER: Render remaining items on next idle period when possible
    useEffect(() => {
        if (!isVisible || !isDataLoaded || items.length <= 6) return;

        let idleHandle: number | null = null;
        let timeoutHandle: number | null = null;

        if (typeof window.requestIdleCallback === 'function') {
            idleHandle = window.requestIdleCallback(() => {
                setRenderedCount(items.length);
            }, { timeout: 800 });
        } else {
            timeoutHandle = window.setTimeout(() => {
                setRenderedCount(items.length);
            }, 400);
        }

        return () => {
            if (idleHandle !== null) {
                window.cancelIdleCallback?.(idleHandle);
            }
            if (timeoutHandle !== null) {
                window.clearTimeout(timeoutHandle);
            }
        };
    }, [isVisible, isDataLoaded, items.length]);

    // 3. Not in viewport yet? Render highly optimized empty box WITH the measurement ref
    if (!isVisible) {
        return <div ref={observerRef} className="min-h-[250px] md:min-h-[300px] mb-8" />;
    }

    // 4. In viewport, but network still hasn't finished? Show skeleton.
    if (!isDataLoaded) {
        return (
            <div className="min-h-[250px] md:min-h-[300px] mb-8">
                <ContentRowSkeleton title={title} count={7} variant={cardVariant} />
            </div>
        );
    }

    if (items.length === 0) return null;

    return (
        <div>
            <ContentRow
                title={title}
                items={items.slice(0, renderedCount)} // SLICING MAGIC - keeps React ultra-fast
                seeAllLink={seeAllLink}
                getLink={getLink}
                titleClassName={titleClassName}
                variant={variant}
                cardVariant={cardVariant}
            />
        </div>
    );
}
