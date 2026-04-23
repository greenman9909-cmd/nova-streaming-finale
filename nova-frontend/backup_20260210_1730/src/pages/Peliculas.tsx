import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    getPopularMovies,
    getTrendingMovies,
    getImageUrl,
    TMDBMovie,
    movieGenres
} from '../services/api';

export default function Peliculas() {
    const [movies, setMovies] = useState<TMDBMovie[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedGenre, setSelectedGenre] = useState<number | null>(null);

    const genres = [
        { id: null, name: 'Todos' },
        { id: 28, name: 'Acción' },
        { id: 35, name: 'Comedia' },
        { id: 18, name: 'Drama' },
        { id: 878, name: 'Sci-Fi' },
        { id: 27, name: 'Terror' },
        { id: 10749, name: 'Romance' },
        { id: 16, name: 'Animación' },
    ];

    useEffect(() => {
        const fetchMovies = async () => {
            setIsLoading(true);
            try {
                const [trending, popular] = await Promise.all([
                    getTrendingMovies(),
                    getPopularMovies()
                ]);
                // Combine and deduplicate
                const combined = [...trending, ...popular];
                const unique = combined.filter((movie, index, self) =>
                    index === self.findIndex(m => m.id === movie.id)
                );
                setMovies(unique);
            } catch (error) {
                console.error('Error fetching movies:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchMovies();
    }, []);

    // Filter movies by genre
    const filteredMovies = selectedGenre
        ? movies.filter(movie => movie.genre_ids.includes(selectedGenre))
        : movies;

    return (
        <main className="min-h-screen bg-[#030305] pt-20">
            {/* Cosmic Background Elements */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-violet-600/10 blur-[120px] rounded-full animate-pulse-slow" />
                <div className="absolute top-[20%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse-slow delay-700" />
            </div>

            {/* Hero Banner - Compact & Premium */}
            {/* Hero Banner - Compact & Premium */}
            {movies.length > 0 && (
                <section className="relative h-[50vh] min-h-[400px] overflow-hidden flex items-end pb-12 group">
                    <div className="absolute inset-0">
                        <img
                            src={getImageUrl(movies[0].backdrop_path, 'original')}
                            className="w-full h-full object-cover object-top transition-transform duration-1000 group-hover:scale-105 opacity-60"
                            alt=""
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#030305] via-[#030305]/60 to-transparent"></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-[#030305] via-transparent to-transparent"></div>
                    </div>

                    <div className="relative z-10 w-full px-6 md:px-12">
                        <span className="inline-block px-3 py-1 mb-3 rounded-lg bg-white/5 backdrop-blur border border-white/10 text-[10px] font-bold text-violet-300 uppercase tracking-widest">
                            #1 Trending Movie
                        </span>
                        <h1 className="font-display font-black text-4xl md:text-6xl text-white mb-3 leading-none tracking-tight drop-shadow-2xl">
                            {movies[0].title}
                        </h1>
                        <p className="text-gray-200 max-w-xl text-base font-medium line-clamp-2 mb-6 drop-shadow-md">
                            {movies[0].overview}
                        </p>

                        <div className="flex gap-4">
                            <Link
                                to={`/watch/movie/${movies[0].id}`}
                                className="px-8 py-3 bg-white text-black font-bold rounded-xl hover:scale-105 transition-transform flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                            >
                                <i className="ri-play-fill text-xl"></i>
                                Watch Now
                            </Link>
                        </div>
                    </div>
                </section>
            )}

            {/* Content Area */}
            <div className="relative z-10 w-full px-6 md:px-12 pb-20">
                {/* Genre Filter - Glass Bar */}
                <div className="mb-6 -mx-6 md:-mx-12 px-6 md:px-12 py-3 bg-transparent border-y border-white/5">
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                        {genres.map((genre) => (
                            <button
                                key={genre.id ?? 'all'}
                                onClick={() => setSelectedGenre(genre.id)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-300 ${selectedGenre === genre.id
                                    ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)] scale-105'
                                    : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                                    }`}
                            >
                                {genre.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Loading State */}
                {isLoading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="w-12 h-12 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin"></div>
                    </div>
                ) : (
                    /* Movie Grid */
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {filteredMovies.map((movie) => (
                            <Link
                                key={movie.id}
                                to={`/watch/movie/${movie.id}`}
                                className="group relative flex flex-col gap-3"
                            >
                                <div className="aspect-[2/3] rounded-2xl overflow-hidden bg-gray-900 relative shadow-2xl transition-all duration-500 group-hover:scale-[1.02] group-hover:shadow-[0_0_30px_rgba(139,92,246,0.3)] ring-1 ring-white/10 group-hover:ring-violet-500/50">
                                    <img
                                        src={getImageUrl(movie.poster_path)}
                                        alt={movie.title}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        loading="lazy"
                                    />

                                    {/* Hover Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5">
                                        <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                            <div className="flex items-center gap-2 mb-3">
                                                <span className="px-2 py-1 rounded-md bg-white/20 backdrop-blur text-[10px] font-bold text-white">
                                                    4K HDR
                                                </span>
                                                <span className="flex items-center gap-1 text-amber-400 text-xs font-bold">
                                                    <i className="ri-star-fill"></i> {movie.vote_average.toFixed(1)}
                                                </span>
                                            </div>
                                            <button className="w-full py-2.5 rounded-xl bg-white text-black font-bold text-sm hover:scale-105 transition-transform shadow-lg">
                                                <i className="ri-play-fill mr-1"></i> Watch Now
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="px-1">
                                    <h3 className="font-bold text-white text-base line-clamp-1 group-hover:text-violet-400 transition-colors">
                                        {movie.title}
                                    </h3>
                                    <div className="flex items-center gap-2 text-xs text-gray-500 font-medium mt-1">
                                        <span>{movie.release_date?.split('-')[0] || 'N/A'}</span>
                                        <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                                        <span>{movieGenres[movie.genre_ids[0]] || 'Movie'}</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && filteredMovies.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                        <i className="ri-film-line text-5xl mb-4 opacity-50"></i>
                        <p>No movies found for this genre</p>
                    </div>
                )}
            </div>
        </main>
    );
}
