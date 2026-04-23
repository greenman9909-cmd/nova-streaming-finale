import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function MyList() {
    const { watchlist, removeFromWatchlist } = useAuth();

    return (
        <div className="min-h-screen pt-24 px-[5%] pb-10">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-black text-white mb-2">My List</h1>
                <p className="text-gray-400 mb-8">Everything you've saved for later.</p>

                {watchlist.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
                        <i className="ri-bookmark-line text-6xl text-gray-500 mb-4"></i>
                        <h2 className="text-xl font-bold text-white mb-2">Your list is empty</h2>
                        <p className="text-gray-400">Save movies and shows here to track what you want to watch.</p>
                        <Link to="/" className="mt-6 px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all">
                            Explore Now
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {watchlist.map((item) => (
                            <Link
                                key={`${item.mediaId}`}
                                to={item.type === 'movie' ? `/watch/movie/${item.mediaId}` : `/watch/tv/${item.mediaId}`}
                                className="group relative aspect-[2/3] bg-[#0a0a0f] rounded-xl overflow-hidden border border-white/5 hover:border-violet-500/50 transition-all hover:shadow-[0_0_30px_rgba(139,92,246,0.2)] hover:-translate-y-2"
                            >
                                <img
                                    src={item.image}
                                    alt={item.title}
                                    className="w-full h-full object-cover group-hover:opacity-40 transition-all duration-500"
                                />

                                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />

                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        removeFromWatchlist(item.mediaId);
                                    }}
                                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 hover:bg-red-500/20 text-white hover:text-red-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-10 backdrop-blur-sm"
                                    title="Remove from list"
                                >
                                    <i className="ri-close-line text-lg"></i>
                                </button>

                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                                    <div className="w-12 h-12 rounded-full bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/50 transform scale-50 group-hover:scale-100 transition-transform">
                                        <i className="ri-play-fill text-white text-xl ml-1"></i>
                                    </div>
                                </div>

                                <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-4 group-hover:translate-y-0 transition-transform">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400 mb-1 block">{item.category}</span>
                                    <h3 className="text-white font-bold truncate text-sm">{item.title}</h3>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}