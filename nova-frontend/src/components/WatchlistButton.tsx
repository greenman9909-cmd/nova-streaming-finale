import { useState } from 'react';
import { useAuth, WatchlistItem } from '../context/AuthContext';

interface WatchlistButtonProps {
    /** TMDB / media numeric ID */
    id: number | string;
    title: string;
    image: string;
    mediaType: 'movie' | 'tv';
    /** Visual variant */
    variant?: 'icon' | 'pill';
    className?: string;
}

/**
 * Drop-in watchlist toggle button.
 * - `icon`  → compact round icon (for card overlays)
 * - `pill`  → labelled pill (for spotlight / larger surfaces)
 *
 * Saves/removes from Supabase via AuthContext.
 */
export default function WatchlistButton({
    id,
    title,
    image,
    mediaType,
    variant = 'icon',
    className = '',
}: WatchlistButtonProps) {
    const { addToWatchlist, removeFromWatchlist, isInWatchlist, user } = useAuth();
    const [busy, setBusy] = useState(false);
    const [flash, setFlash] = useState<'added' | 'removed' | null>(null);

    const mediaId = String(id);
    const inList = isInWatchlist(mediaId);

    const handleClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!user) {
            // Redirect to login if not authenticated
            window.location.href = '/login';
            return;
        }

        if (busy) return;
        setBusy(true);

        try {
            if (inList) {
                await removeFromWatchlist(mediaId);
                setFlash('removed');
            } else {
                const item: WatchlistItem = {
                    id: Number(id) || 0,
                    title,
                    category: mediaType === 'movie' ? 'Movie' : 'Series',
                    image,
                    type: mediaType,
                    mediaId,
                    addedAt: Date.now(),
                };
                const ok = await addToWatchlist(item);
                if (ok) setFlash('added');
            }
        } finally {
            setBusy(false);
            setTimeout(() => setFlash(null), 1400);
        }
    };

    /* ── Icon variant ───────────────────────────────────────────────── */
    if (variant === 'icon') {
        return (
            <button
                onClick={handleClick}
                title={inList ? 'Quitar de mi lista' : 'Añadir a mi lista'}
                disabled={busy}
                className={`
                    relative group/wl flex items-center justify-center
                    w-8 h-8 rounded-full border transition-all duration-200
                    ${inList
                        ? 'bg-white border-white text-black shadow-[0_0_12px_rgba(255,255,255,0.3)]'
                        : 'bg-black/40 border-white/30 text-white hover:bg-white/20 hover:border-white backdrop-blur-sm'
                    }
                    ${busy ? 'opacity-60 cursor-wait' : ''}
                    ${className}
                `}
            >
                {busy ? (
                    <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                ) : inList ? (
                    <i className="ri-check-line text-sm font-bold" />
                ) : (
                    <i className="ri-add-line text-sm" />
                )}

                {/* Tooltip */}
                <span className="
                    pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2
                    whitespace-nowrap text-[10px] font-semibold text-white bg-black/80
                    px-2 py-0.5 rounded opacity-0 group-hover/wl:opacity-100
                    transition-opacity duration-150
                ">
                    {inList ? 'Quitar de lista' : 'Mi lista'}
                </span>

                {/* Flash feedback */}
                {flash && (
                    <span className="
                        absolute -top-7 left-1/2 -translate-x-1/2
                        text-[9px] font-bold px-1.5 py-0.5 rounded
                        animate-fade-in pointer-events-none whitespace-nowrap
                        bg-emerald-500 text-white
                    ">
                        {flash === 'added' ? '✓ Guardado' : '✗ Eliminado'}
                    </span>
                )}
            </button>
        );
    }

    /* ── Pill variant ───────────────────────────────────────────────── */
    return (
        <button
            onClick={handleClick}
            disabled={busy}
            className={`
                relative flex items-center gap-2 px-4 py-2.5 rounded-md font-semibold text-[13px]
                border transition-all duration-200
                ${inList
                    ? 'bg-white/20 border-white/60 text-white hover:bg-white/30'
                    : 'bg-white/10 border-white/40 text-white hover:bg-white/20 hover:border-white/70'
                }
                ${busy ? 'opacity-60 cursor-wait' : ''}
                ${className}
            `}
        >
            {busy ? (
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
            ) : inList ? (
                <i className="ri-check-line text-base" />
            ) : (
                <i className="ri-add-line text-base" />
            )}
            <span>{inList ? 'En mi lista' : 'Mi lista'}</span>

            {/* Flash feedback */}
            {flash && (
                <span className="
                    absolute -top-8 left-1/2 -translate-x-1/2
                    text-[10px] font-bold px-2 py-0.5 rounded
                    animate-fade-in pointer-events-none whitespace-nowrap
                    bg-emerald-500 text-white shadow-lg
                ">
                    {flash === 'added' ? '✓ Añadido a tu lista' : '✗ Eliminado de tu lista'}
                </span>
            )}
        </button>
    );
}
