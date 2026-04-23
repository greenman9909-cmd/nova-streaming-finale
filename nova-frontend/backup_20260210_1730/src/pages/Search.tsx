import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { searchMovies, searchSeries, searchAnime, getImageUrl } from '../services/api';

type SearchResult = {
    id: string | number;
    title: string;
    image: string;
    type: 'movie' | 'tv' | 'anime';
    rating?: number;
    year?: string;
};

export default function Search() {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';

    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeFilter, setActiveFilter] = useState<'all' | 'movie' | 'tv' | 'anime'>('all');

    useEffect(() => {
        const performSearch = async () => {
            if (!query.trim()) {
                setResults([]);
                return;
            }

            setLoading(true);
            try {
                const [movies, series, anime] = await Promise.all([
                    searchMovies(query),
                    searchSeries(query),
                    searchAnime(query)
                ]);

                const formattedMovies: SearchResult[] = movies.map((m: any) => ({
                    id: m.id,
                    title: m.title,
                    image: getImageUrl(m.poster_path),
                    type: 'movie',
                    rating: m.vote_average,
                    year: m.release_date?.split('-')[0]
                }));

                const formattedSeries: SearchResult[] = series.map((s: any) => ({
                    id: s.id,
                    title: s.name,
                    image: getImageUrl(s.poster_path),
                    type: 'tv',
                    rating: s.vote_average,
                    year: s.first_air_date?.split('-')[0]
                }));

                const formattedAnime: SearchResult[] = anime.map((a: any) => ({
                    id: a.id,
                    title: a.title || a.name,
                    image: getImageUrl(a.poster_path),
                    type: 'anime',
                    year: '2024'
                }));

                setResults([...formattedMovies, ...formattedSeries, ...formattedAnime]);
            } catch (error) {
                console.error('Search error:', error);
            } finally {
                setLoading(false);
            }
        };

        const timer = setTimeout(performSearch, 500);
        return () => clearTimeout(timer);
    }, [query]);

    const filteredResults = activeFilter === 'all'
        ? results
        : results.filter(r => r.type === activeFilter);

    return (
        <main className="min-h-screen bg-nova-bg pt-24 pb-20">
            <div className="max-w-7xl mx-auto px-4 lg:px-6">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-white mb-2">
                        {query ? `Search results for "${query}"` : 'Search anything'}
                    </h1>
                    <p className="text-nova-dim text-sm">{filteredResults.length} titles found</p>
                </div>

                {/* Filters */}
                <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
                    {['all', 'movie', 'tv', 'anime'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setActiveFilter(f as any)}
                            className={`px-5 py-2 rounded-xl text-xs font-bold capitalize transition-all ${activeFilter === f
                                ? 'bg-white text-black'
                                : 'bg-white/5 text-nova-muted hover:bg-white/10'
                                }`}
                        >
                            {f}s
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-12 h-12 border-4 border-nova-accent border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                        {filteredResults.map((item) => (
                            <Link
                                key={`${item.type}-${item.id}`}
                                to={item.type === 'anime' ? `/anime/${item.id}` : `/watch/${item.type === 'movie' ? 'movie' : 'tv'}/${item.id}`}
                                className="group flex flex-col gap-3"
                            >
                                <div className="aspect-[2/3] rounded-2xl overflow-hidden bg-nova-card relative group-hover:shadow-[0_0_30px_rgba(255,255,255,0.1)] transition-all duration-300">
                                    <img
                                        src={item.image}
                                        alt={item.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute top-2 right-2 px-2 py-1 rounded-lg bg-black/60 backdrop-blur text-[10px] font-bold text-white uppercase">
                                        {item.type}
                                    </div>
                                </div>
                                <div className="px-1">
                                    <h3 className="text-white font-bold text-sm truncate group-hover:text-nova-accent transition-colors">
                                        {item.title}
                                    </h3>
                                    <p className="text-nova-dim text-xs mt-1">{item.year || 'N/A'}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {!loading && filteredResults.length === 0 && query && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <i className="ri-search-line text-5xl text-nova-dim mb-4"></i>
                        <h3 className="text-white font-bold text-xl mb-2">No results found</h3>
                        <p className="text-nova-dim max-w-sm">We couldn't find anything matching your search. Try different keywords or check your spelling.</p>
                    </div>
                )}
            </div>
        </main>
    );
}
