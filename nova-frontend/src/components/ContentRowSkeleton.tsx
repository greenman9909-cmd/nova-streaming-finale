// Skeleton placeholders for content rows while data loads
// Usage: <ContentRowSkeleton count={6} />

interface ContentRowSkeletonProps {
    count?: number;
    variant?: 'portrait' | 'landscape';
    title?: string;
}

/** A shimmering skeleton card matching the ContentCard dimensions */
function SkeletonCard({ variant = 'portrait' }: { variant: 'portrait' | 'landscape' }) {
    return (
        <div
            className={`flex-shrink-0 ${variant === 'landscape'
                    ? 'w-[240px] md:w-[320px]'
                    : 'w-[140px] md:w-[192px]'
                }`}
        >
            {/* Poster / thumbnail */}
            <div
                className={`w-full rounded-lg overflow-hidden bg-white/5 skeleton-shimmer ${variant === 'landscape' ? 'aspect-video' : 'aspect-[2/3]'
                    }`}
            />
            {/* Title line */}
            <div className="mt-2 h-3 w-3/4 rounded bg-white/5 skeleton-shimmer" />
        </div>
    );
}

/** Drop-in replacement for a ContentRow while loading */
export default function ContentRowSkeleton({
    count = 7,
    variant = 'portrait',
    title,
}: ContentRowSkeletonProps) {
    return (
        <section className="py-1">
            {/* Row header */}
            <div className="page-gutter flex items-center justify-between mb-1">
                {title ? (
                    <h2 className="font-semibold text-lg md:text-xl text-white">{title}</h2>
                ) : (
                    <div className="h-5 w-36 rounded bg-white/5 skeleton-shimmer" />
                )}
            </div>

            {/* Cards */}
            <div
                className="page-gutter flex gap-3 overflow-x-hidden"
                style={{
                    paddingTop: '0.75rem',
                    paddingBottom: '2.25rem',
                }}
            >
                {Array.from({ length: count }).map((_, i) => (
                    <SkeletonCard key={i} variant={variant} />
                ))}
            </div>
        </section>
    );
}
