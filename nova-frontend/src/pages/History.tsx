import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { getLocalProgress, formatTime } from '../utils/watchProgress';

export default function History() {
    const { user } = useAuth();
    const [historyItems, setHistoryItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadHistory = async () => {
        if (!user) {
            setHistoryItems([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        const { data, error: historyError } = await supabase
            .from('watch_history')
            .select('id,media_id,media_type,title,image,progress,updated_at')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false });

        if (historyError) {
            console.error('Failed to load history:', historyError);
            setError('No se pudo cargar el historial.');
        }

        // Enrich with localStorage timestamps (always fresh, cross-episode)
        const enriched = (data || []).map((item: any) => {
            const local = getLocalProgress(user.id, item.media_id);
            return {
                ...item,
                timestampSeconds: local?.timestampSeconds ?? 0,
                durationSeconds: local?.durationSeconds ?? 0,
                progress: local?.progress ?? item.progress ?? 0,
            };
        });
        setHistoryItems(enriched);
        setLoading(false);
    };

    useEffect(() => {
        loadHistory();
    }, [user?.id]);


    const historyLink = (item: any) => {
        const mediaId = String(item.media_id || '');
        if (item.media_type === 'anime') {
            const base = mediaId.split('-ep-')[0];
            return `/anime/watch/${base}?episode=${item.episode || 1}`;
        }
        if (item.media_type === 'tv') {
            if (mediaId.includes('-episode-')) return `/watch/${mediaId}`;
            if (mediaId.includes('-s') && mediaId.includes('-e')) {
                const [tmdbId, rest] = mediaId.split('-s');
                const [s, e] = (rest || '').split('-e');
                return `/watch/tv/${tmdbId}?season=${s}&episode=${e}`;
            }
            return `/watch/tv/${mediaId}`;
        }
        return `/watch/movie/${mediaId}`;
    };

    const handleRemoveItem = async (item: any, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        await supabase.from('watch_history').delete().eq('id', item.id);
        if (user) localStorage.removeItem(`nova_wp_${user.id}_${item.media_id}`);
        setHistoryItems(prev => prev.filter((h: any) => h.id !== item.id));
    };

    const mediaTypeLabel = (type: string) => {
        if (type === 'anime') return 'Anime';
        if (type === 'tv') return 'Serie';
        return 'Película';
    };

    const timeAgo = (value?: string) => {
        if (!value) return '';
        const diff = Date.now() - new Date(value).getTime();
        const m = Math.floor(diff / 60000);
        if (m < 1) return 'Ahora';
        if (m < 60) return `Hace ${m}m`;
        const h = Math.floor(m / 60);
        if (h < 24) return `Hace ${h}h`;
        const d = Math.floor(h / 24);
        if (d < 7) return `Hace ${d}d`;
        return new Date(value).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    };


    const handleClearHistory = () => {
        if (!user) return;
        if (window.confirm('Are you sure you want to clear your watch history?')) {
            supabase.from('watch_history').delete().eq('user_id', user.id).then(() => {
                setHistoryItems([]);
            });
        }
    };

    return (
        <div className="min-h-screen pt-24 pb-16 page-gutter">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-end justify-between mb-10">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-xl bg-nova-accent/20 border border-nova-accent/30 flex items-center justify-center">
                                <i className="ri-history-line text-nova-accent text-lg" />
                            </div>
                            <h1 className="text-3xl font-black text-white">Historial</h1>
                        </div>
                        <p className="text-white/40 text-sm">
                            {user
                                ? loading ? 'Cargando...' : `${historyItems.length} título${historyItems.length !== 1 ? 's' : ''} vistos`
                                : 'Inicia sesión para ver tu historial.'}
                        </p>
                    </div>
                    {historyItems.length > 0 && (
                        <button
                            onClick={handleClearHistory}
                            className="flex items-center gap-2 text-sm font-semibold text-red-400/70 hover:text-red-300 hover:bg-red-500/10 px-4 py-2 rounded-lg transition-all"
                        >
                            <i className="ri-delete-bin-6-line" /> Borrar historial
                        </button>
                    )}
                </div>

                {loading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {Array.from({ length: 10 }).map((_, i) => (
                            <div key={i} className="aspect-video rounded-xl bg-white/5 animate-pulse" />
                        ))}
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center py-24 text-white/40 gap-3">
                        <i className="ri-wifi-off-line text-4xl" />
                        <p>{error}</p>
                        <button onClick={loadHistory} className="text-nova-accent text-sm hover:underline">Reintentar</button>
                    </div>
                ) : historyItems.length === 0 ? (
                    <div className="flex flex-col items-center py-28 text-center">
                        <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center mb-5">
                            <i className="ri-film-line text-4xl text-white/20" />
                        </div>
                        <h2 className="text-xl font-bold text-white/60 mb-2">Sin historial todavía</h2>
                        <p className="text-white/30 text-sm mb-6">Empieza a ver contenido y aparecerá aquí.</p>
                        <Link to="/" className="px-6 py-2.5 bg-nova-accent/20 hover:bg-nova-accent/30 border border-nova-accent/30 text-nova-accent rounded-xl font-semibold text-sm transition-all">
                            Explorar contenido
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {historyItems.map((item) => {
                            const pct = Math.min(100, Math.max(0, item.progress || 0));
                            const resume = item.timestampSeconds > 30 ? formatTime(item.timestampSeconds) : null;

                            return (
                                <Link
                                    key={item.id}
                                    to={historyLink(item)}
                                    className="group relative flex flex-col bg-white/[0.03] rounded-xl overflow-hidden border border-white/5 hover:border-nova-accent/40 transition-all duration-300 hover:shadow-lg"
                                >
                                    {/* Thumbnail */}
                                    <div className="relative aspect-video overflow-hidden bg-black/50">
                                        <img
                                            src={item.image || '/placeholder-poster.svg'}
                                            alt={item.title || ''}
                                            className="w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                                            loading="lazy"
                                            onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder-poster.svg'; }}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                                        {/* Play button */}
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                                            <div className="w-12 h-12 rounded-full bg-nova-accent flex items-center justify-center shadow-lg scale-75 group-hover:scale-100 transition-transform">
                                                <i className="ri-play-fill text-white text-xl ml-0.5" />
                                            </div>
                                        </div>

                                        {/* Resume timestamp badge */}
                                        {resume && (
                                            <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur text-[10px] font-bold text-nova-accent border border-nova-accent/30">
                                                <i className="ri-time-line" />{resume}
                                            </div>
                                        )}

                                        {/* Media type badge */}
                                        <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur text-[9px] font-bold uppercase tracking-wider text-white/50">
                                            {mediaTypeLabel(item.media_type)}
                                        </div>

                                        {/* Remove button */}
                                        <button
                                            onClick={(e) => handleRemoveItem(item, e)}
                                            className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/80 text-white/60 hover:text-white"
                                            title="Eliminar"
                                        >
                                            <i className="ri-close-line text-xs" />
                                        </button>
                                    </div>

                                    {/* Progress bar */}
                                    <div className="h-0.5 bg-white/5">
                                        <div className="h-full bg-nova-accent transition-all" style={{ width: `${pct}%` }} />
                                    </div>

                                    {/* Info */}
                                    <div className="px-3 py-2.5">
                                        <h3 className="text-white font-semibold text-sm truncate group-hover:text-nova-accent transition-colors">
                                            {item.title || 'Sin título'}
                                        </h3>
                                        <div className="flex items-center justify-between mt-1 text-[11px] text-white/35">
                                            <span>{timeAgo(item.updated_at)}</span>
                                            <span>{pct}%</span>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
