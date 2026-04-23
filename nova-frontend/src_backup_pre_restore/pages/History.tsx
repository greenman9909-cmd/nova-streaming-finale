import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function History() {
    // Mock History Data (Expanded)
    // In a real app, this would come from Supabase/AuthContext
    const [historyItems, setHistoryItems] = useState([
        { id: 1, title: 'Inception', date: 'Yesterday', progress: 85, image: 'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg', type: 'movie', mediaId: '27205' },
        { id: 2, title: 'Breaking Bad', subtitle: 'S1:E4 - Cancer Man', date: '2 days ago', progress: 10, image: 'https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg', type: 'tv', mediaId: '1396' },
        { id: 3, title: 'Interstellar', date: 'Last Week', progress: 100, image: 'https://image.tmdb.org/t/p/w500/gEU2QniL6E8AHtMY4kRFSvQch6c.jpg', type: 'movie', mediaId: '157336' },
        { id: 4, title: 'Arcane', subtitle: 'S1:E3 - The Base Violence', date: 'Last Week', progress: 45, image: 'https://image.tmdb.org/t/p/w500/fqldf2t8ZTcPNv3POpGS2QnP2bv.jpg', type: 'tv', mediaId: '94605' },
        { id: 5, title: 'Spider-Man: Across the Spider-Verse', date: '2 weeks ago', progress: 15, image: 'https://image.tmdb.org/t/p/w500/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg', type: 'movie', mediaId: '569094' },
    ]);

    const handleClearHistory = () => {
        if (window.confirm('Are you sure you want to clear your watch history?')) {
            setHistoryItems([]);
        }
    };

    return (
        <div className="min-h-screen pt-24 px-[5%] pb-10">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-white mb-2">Watch History</h1>
                        <p className="text-gray-400">Continue watching exactly where you left off.</p>
                    </div>
                    {historyItems.length > 0 && (
                        <button
                            onClick={handleClearHistory}
                            className="text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 px-4 py-2 rounded-lg transition-all"
                        >
                            Clear History
                        </button>
                    )}
                </div>

                {historyItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
                        <i className="ri-history-line text-6xl text-gray-500 mb-4"></i>
                        <h2 className="text-xl font-bold text-white mb-2">No history yet</h2>
                        <p className="text-gray-400">Start watching movies and series to see them here.</p>
                        <Link to="/" className="mt-6 px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all">
                            Browse Content
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {historyItems.map((item) => (
                            <Link
                                key={item.id}
                                to={item.type === 'movie' ? `/watch/movie/${item.mediaId}` : `/watch/tv/${item.mediaId}`}
                                className="group relative aspect-video bg-[#0a0a0f] rounded-xl overflow-hidden border border-white/5 hover:border-violet-500/50 transition-all hover:shadow-[0_0_30px_rgba(139,92,246,0.2)]"
                            >
                                <img
                                    src={item.image}
                                    alt={item.title}
                                    className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-500 group-hover:scale-105"
                                />

                                {/* Overlay Gradient */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-90" />

                                {/* Play Button Overlay */}
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                                    <div className="w-14 h-14 rounded-full bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/50 transform scale-50 group-hover:scale-100 transition-transform">
                                        <i className="ri-play-fill text-white text-2xl ml-1"></i>
                                    </div>
                                </div>

                                {/* Content Info */}
                                <div className="absolute bottom-0 left-0 right-0 p-4">
                                    <h3 className="text-white font-bold truncate text-lg group-hover:text-violet-300 transition-colors">{item.title}</h3>
                                    {item.subtitle && <p className="text-xs text-gray-300 truncate mb-1">{item.subtitle}</p>}

                                    <div className="flex items-center justify-between text-xs text-gray-400 mb-2 mt-1">
                                        <span>{item.date}</span>
                                        <span>{item.progress}%</span>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full relative"
                                            style={{ width: `${item.progress}%` }}
                                        >
                                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
