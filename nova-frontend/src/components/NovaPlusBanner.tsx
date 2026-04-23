import React, { useState, useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';
import { getTrendingMovies, getImageUrl, TMDBMovie } from '../services/api';
import { useNavigate } from 'react-router-dom';

const NovaPlusBanner: React.FC = () => {
    const { t } = useSettings();
    const navigate = useNavigate();
    const [demoMessage, setDemoMessage] = useState('');
    const [movies, setMovies] = useState<TMDBMovie[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    const handleDemoClick = (action: string) => {
        setDemoMessage(`${action} - Función demostrativa`);
        setTimeout(() => setDemoMessage(''), 3000);
    };

    useEffect(() => {
        const fetchMovies = async () => {
            try {
                const data = await getTrendingMovies();
                // Get high quality items with backdrops
                const premium = data.filter((m: any) => m.backdrop_path && m.vote_average > 6.5).slice(0, 5);
                setMovies(premium);
            } catch (err) {
                console.error('Failed to load Nova Plus banner items');
            }
        };
        fetchMovies();
    }, []);

    useEffect(() => {
        if (movies.length === 0) return;
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % movies.length);
        }, 8000);
        return () => clearInterval(interval);
    }, [movies]);

    const handlePrevious = () => {
        setCurrentIndex((prev) => (prev === 0 ? movies.length - 1 : prev - 1));
    };

    const handleNext = () => {
        setCurrentIndex((prev) => (prev + 1) % movies.length);
    };

    const currentMovie = movies[currentIndex] || {
        title: 'The Wrecking Crew',
        overview: 'Two estranged half-brothers, a reckless ex-cop (Jason Momoa) and a Navy SEAL (Dave Bautista), are forced to reunite to solve their...',
        backdrop_path: '/nova_plus_banner_bg.png' // fallback image
    };

    const bgImage = currentMovie.backdrop_path?.startsWith('/') 
        ? (currentMovie.backdrop_path === '/nova_plus_banner_bg.png' ? currentMovie.backdrop_path : getImageUrl(currentMovie.backdrop_path, 'original'))
        : '/nova_plus_banner_bg.png';

    return (
        <section className="relative w-full h-[85vh] min-h-[600px] overflow-hidden bg-black text-white font-sans select-none">
            {/* Background Image with Cinematic Grading */}
            <div className="absolute inset-0 transition-opacity duration-1000 ease-in-out">
                <img
                    key={bgImage} /* force re-render for fade transition if needed or rely on CSS over overlays */
                    src={bgImage}
                    alt={currentMovie.title}
                    className="w-full h-full object-cover object-center scale-[1.02] brightness-[0.8] animate-slow-zoom"
                />

                {/* Precise Prime-style Gradients */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#05050f] via-[#05050f]/80 to-transparent w-full md:w-[70%]" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#05050f] via-transparent to-transparent h-[50%] bottom-0" />
            </div>

            {/* Demo Notice Toast */}
            {demoMessage && (
                <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50 bg-black/90 text-white px-6 py-3 rounded-full border border-violet-500/30 backdrop-blur-md animate-fade-in shadow-[0_0_20px_rgba(139,92,246,0.3)] whitespace-nowrap">
                    <i className="ri-information-line text-violet-400 mr-2"></i>
                    {demoMessage}
                </div>
            )}

            {/* Content Container */}
            <div className="relative z-10 h-full flex flex-col justify-center px-6 md:px-20 max-w-5xl">
                {/* Branding: Nova Plus (Prime style) */}
                <div className="flex items-center gap-2 mb-6 animate-fade-in group cursor-pointer" onClick={() => navigate('/plans')}>
                    <div className="flex flex-col items-start">
                        <span className="text-violet-500 font-display font-black text-3xl tracking-[-0.05em] leading-none mb-1 shadow-violet-500/50">
                            NOVA
                        </span>
                        <div className="h-[2px] w-full bg-violet-500 rounded-full mt-[-2px] relative">
                        </div>
                    </div>
                    <span className="text-violet-400 text-[12px] uppercase tracking-[0.3em] font-black mt-1 ml-1 opacity-90">
                        plus
                    </span>
                </div>

                {/* Main Title Container with Decoration */}
                <div className="mb-6 animate-fade-in-up">
                    <h1 className="text-5xl md:text-[84px] font-[900] uppercase tracking-tighter leading-[0.9] drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)] font-display text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                        {currentMovie.title}
                    </h1>
                    <div className="h-[4px] w-32 bg-gradient-to-r from-violet-500 to-cyan-400 mt-6 rounded-full shadow-[0_0_15px_rgba(139,92,246,0.5)]" />
                </div>

                {/* Status Badge */}
                <div className="flex items-center gap-3 mb-6 animate-fade-in-up delay-100">
                    <span className="px-3 py-1 bg-violet-500/20 border border-violet-500/30 rounded text-violet-300 font-extrabold text-xs tracking-widest uppercase backdrop-blur-sm">
                        En Exclusiva
                    </span>
                    <span className="text-[#46d369] font-black text-sm tracking-wide drop-shadow-md text-shadow-sm">
                        {t('novaPlusBanner.badge') || 'NUEVO'}
                    </span>
                </div>

                {/* Description Text */}
                <p className="text-lg md:text-xl text-gray-300 leading-relaxed mb-10 max-w-2xl font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,1)] animate-fade-in-up delay-200 line-clamp-3">
                    {currentMovie.overview}
                </p>

                {/* Prime-style Action Row */}
                <div className="flex items-center gap-4 mb-10 animate-fade-in-up delay-300">
                    <button
                        onClick={() => currentMovie.id ? navigate(`/watch/movie/${currentMovie.id}`) : handleDemoClick(t('novaPlusBanner.watchNow'))}
                        className="flex items-center gap-3 px-8 py-4 bg-white hover:bg-gray-200 text-black rounded-lg font-bold text-lg transition-all duration-300 group shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:scale-105 active:scale-95"
                    >
                        <i className="ri-play-fill text-2xl transition-transform group-hover:scale-110"></i>
                        <span>{t('novaPlusBanner.watchNow') || 'Reproducir'}</span>
                    </button>

                    <button
                        onClick={() => handleDemoClick('Añadir a Mi Lista')}
                        className="flex items-center justify-center w-14 h-14 rounded-lg bg-white/10 border border-white/20 hover:bg-white/20 hover:border-white/50 transition-all duration-300 backdrop-blur-md group hover:scale-105 active:scale-95"
                    >
                        <i className="ri-add-line text-2xl text-white group-hover:text-violet-400 transition-colors"></i>
                    </button>

                    <button
                        onClick={() => handleDemoClick('Más Información')}
                        className="flex items-center justify-center w-14 h-14 rounded-lg bg-white/10 border border-white/20 hover:bg-white/20 hover:border-white/50 transition-all duration-300 backdrop-blur-md group hover:scale-105 active:scale-95"
                    >
                        <i className="ri-information-line text-2xl text-white group-hover:text-cyan-400 transition-colors"></i>
                    </button>
                </div>

                {/* Subscription Info Footnote */}
                <div className="flex items-center gap-3 animate-fade-in-up delay-[400ms]">
                    <div className="w-6 h-6 rounded bg-violet-500/20 border border-violet-500/40 flex items-center justify-center shadow-md">
                        <i className="ri-shield-star-fill text-violet-400 text-xs"></i>
                    </div>
                    <span className="text-gray-400 font-semibold text-sm tracking-tight">Incluido con tu suscripción NOVA+</span>
                </div>
            </div>

            {/* Pagination Indicators Container */}
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-3 z-20">
                {movies.length > 0 ? (
                    movies.map((_, i) => (
                        <div
                            key={i}
                            onClick={() => setCurrentIndex(i)}
                            className={`transition-all duration-500 rounded-full cursor-pointer ${i === currentIndex ? 'w-8 h-2 bg-violet-500 shadow-[0_0_15px_rgba(139,92,246,0.6)]' : 'w-2 h-2 bg-white/30 hover:bg-white/60'}`}
                        />
                    ))
                ) : (
                    [0, 1, 2, 3, 4].map((i) => (
                        <div
                            key={i}
                            className={`transition-all duration-500 rounded-full ${i === 0 ? 'w-6 h-2 bg-violet-500 shadow-[0_0_15px_rgba(139,92,246,0.6)]' : 'w-2 h-2 bg-white/30'}`}
                        />
                    ))
                )}
            </div>

            {/* Age Rating - Precise Position */}
            <div className="absolute bottom-12 right-6 md:right-12 bg-black/60 backdrop-blur-md border-l-4 border-violet-500 px-3 py-1.5 rounded-r text-[12px] font-black text-white/90 tracking-widest leading-none z-20 shadow-lg">
                16+
            </div>

            {/* Navigation Arrows (Caret Style) */}
            <div className="absolute inset-0 flex items-center justify-between px-4 md:px-8 pointer-events-none z-20">
                <button
                    onClick={handlePrevious}
                    className="pointer-events-auto p-2 md:p-4 text-white/30 hover:text-white bg-black/0 hover:bg-black/20 rounded-full transition-all duration-300 hover:scale-110 active:scale-95 backdrop-blur-sm"
                >
                    <i className="ri-arrow-left-s-line text-5xl md:text-6xl font-thin drop-shadow-lg"></i>
                </button>
                <button
                    onClick={handleNext}
                    className="pointer-events-auto p-2 md:p-4 text-white/30 hover:text-white bg-black/0 hover:bg-black/20 rounded-full transition-all duration-300 hover:scale-110 active:scale-95 backdrop-blur-sm"
                >
                    <i className="ri-arrow-right-s-line text-5xl md:text-6xl font-thin drop-shadow-lg"></i>
                </button>
            </div>
            
            {/* Dark gradient blur at the very bottom to merge with next section seamlessly */}
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#05050f] to-transparent pointer-events-none z-10" />
        </section>
    );
};

export default NovaPlusBanner;
