import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    getSeriesDetails,
    getSeasonEpisodes,
    getImageUrl,
    getBackdropUrl,
    TMDBSeriesDetails,
    TMDBEpisode
} from '../services/api';

export default function AnimeDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [anime, setAnime] = useState<TMDBSeriesDetails | null>(null);
    const [episodes, setEpisodes] = useState<TMDBEpisode[]>([]);
    const [selectedSeason, setSelectedSeason] = useState(1);
    const [isLoading, setIsLoading] = useState(true);

    const contentId = parseInt(id || '0');

    useEffect(() => {
        if (!contentId) return;
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const infoData = await getSeriesDetails(contentId);
                if (infoData) {
                    setAnime(infoData);
                    // Fetch Season 1 by default
                    const eps = await getSeasonEpisodes(contentId, 1);
                    setEpisodes(eps);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [contentId]);

    // Fetch episodes when selected season changes
    const handleSeasonChange = async (seasonNum: number) => {
        setSelectedSeason(seasonNum);
        if (contentId) {
            const eps = await getSeasonEpisodes(contentId, seasonNum);
            setEpisodes(eps);
        }
    };

    const handleEpisodeClick = () => {
        // Navigate to AnimeWatch with ID. We might want to pass season/ep as query params or let it default.
        // For better UX, we should probably support deep linking in AnimeWatch, but for now just going to the player with the ID is a good start.
        // Wait, AnimeWatch defaults to S1 E1. If user clicks Ep 5, they want Ep 5.
        // I should update AnimeWatch to read query params? 
        // Or better: The route is /anime/watch/:id. 
        // Let's just navigate to the watch page. The user can select the episode there or we rely on state persistence if we had it.
        // Ideally: navigate(`/anime/watch/${contentId}?season=${selectedSeason}&episode=${episode.episode_number}`);
        // I will stick to simple ID navigation for now as AnimeWatch doesn't implemented query parsing yet in my previous step (it defaults to 1/1).
        // Let's implement query param reading in AnimeWatch later if requested.
        navigate(`/anime/watch/${contentId}`);
    };

    if (isLoading) return (
        <div className="min-h-screen flex items-center justify-center pt-24 pb-20">
            <div className="w-12 h-12 border-4 border-nova-accent border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    if (!anime) return (
        <div className="min-h-screen flex items-center justify-center pt-24 pb-20 text-center">
            <div>
                <i className="ri-error-warning-line text-5xl text-nova-dim mb-4"></i>
                <h2 className="text-2xl font-bold text-white mb-2">Anime Not Found</h2>
                <button onClick={() => navigate('/anime')} className="text-nova-accent hover:underline">Return to Anime</button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#141414]">
            {/* Cinematic Player / Banner */}
            <div className="relative h-[85vh] w-full group">
                {/* Backdrop Image */}
                <div className="absolute inset-0">
                    <img
                        src={getBackdropUrl(anime.backdrop_path) || getImageUrl(anime.poster_path)}
                        alt={anime.name}
                        className="w-full h-full object-cover object-top opacity-70"
                    />
                    {/* Vignette */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/20 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-transparent to-transparent" />
                </div>

                {/* Back Button */}
                <button
                    onClick={() => navigate('/anime')}
                    className="absolute top-24 left-12 z-40 text-white/80 hover:text-white transition-colors flex items-center gap-2"
                >
                    <i className="ri-arrow-left-line text-2xl"></i>
                    <span className="font-bold text-lg">Back to Browse</span>
                </button>

                {/* Hero Content */}
                <div className="absolute bottom-0 left-0 right-0 px-12 z-30 pb-24 max-w-7xl">
                    <div className="animate-fade-in-up">
                        {/* Title & Metadata */}
                        <div className="mb-6">
                            <h1 className="text-6xl md:text-8xl font-black text-white mb-6 drop-shadow-2xl font-display tracking-tight w-full md:w-2/3 leading-[0.9]">
                                {anime.name}
                            </h1>
                            <div className="flex items-center gap-4 text-white font-medium mb-6">
                                <span className="text-green-400 font-bold">{anime.vote_average.toFixed(1)} Rating</span>
                                <span className="text-gray-300">{anime.first_air_date?.split('-')[0]}</span>
                                <span className="border border-gray-500 px-2 text-xs rounded-sm">TV</span>
                                <span>{anime.number_of_episodes} Episodes</span>
                                <span className="border border-white px-2 text-xs rounded-sm font-bold">HD</span>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate(`/anime/watch/${anime.id}`)}
                                className="px-8 py-3 bg-white text-black font-bold text-xl rounded flex items-center gap-3 hover:bg-opacity-90 transition-all transform hover:scale-105"
                            >
                                <i className="ri-play-fill text-3xl"></i>
                                Play
                            </button>
                            <button className="px-8 py-3 bg-[#6d6d6eb3] text-white font-bold text-xl rounded flex items-center gap-3 hover:bg-[#6d6d6e80] transition-all">
                                <i className="ri-add-line text-2xl"></i>
                                My List
                            </button>
                        </div>

                        <div className="mt-8 max-w-2xl text-white text-lg drop-shadow-md leading-relaxed line-clamp-3">
                            {anime.overview}
                        </div>
                    </div>
                </div>
            </div>

            {/* Episodes List Section */}
            <div className="relative z-30 -mt-10 px-6 md:px-12 pb-24 max-w-[1400px] mx-auto">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 border-t border-white/10 pt-10 gap-6">
                    <div>
                        <h3 className="text-3xl font-display font-bold text-white mb-2">Episodes</h3>
                        <p className="text-gray-400 text-sm">Season {selectedSeason} • {episodes.length} Episodes</p>
                    </div>

                    {/* Season Selector */}
                    {anime.seasons && anime.seasons.length > 0 && (
                        <div className="relative group z-20">
                            <button className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-6 py-3 transition-all min-w-[200px] justify-between">
                                <span className="font-bold text-white">Season {selectedSeason}</span>
                                <i className="ri-arrow-down-s-line text-gray-400 group-hover:text-white transition-colors"></i>
                            </button>
                            {/* Dropdown */}
                            <div className="absolute top-full right-0 mt-2 w-full bg-[#1A1A20] border border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top p-2 max-h-60 overflow-y-auto">
                                {anime.seasons.filter(s => s.season_number > 0).map(s => (
                                    <button
                                        key={s.id}
                                        onClick={() => handleSeasonChange(s.season_number)}
                                        className={`w-full text-left px-4 py-2.5 rounded-lg font-bold text-sm mb-1 transition-colors ${selectedSeason === s.season_number ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                                    >
                                        Season {s.season_number}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Grid Layout for Episodes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {episodes.map((episode) => (
                        <button
                            key={episode.id}
                            onClick={() => handleEpisodeClick()}
                            className="group flex flex-col text-left gap-3 p-3 rounded-2xl hover:bg-white/5 transition-all border border-transparent hover:border-white/10"
                        >
                            {/* Thumbnail Container */}
                            <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-[#232323] shadow-lg group-hover:shadow-violet-500/10 transition-all">
                                {/* Image */}
                                <img
                                    src={getImageUrl(episode.still_path) || getImageUrl(anime.poster_path)}
                                    className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-all duration-500 scale-100 group-hover:scale-105"
                                    alt={`Episode ${episode.episode_number}`}
                                />
                                {/* Gradient Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                                {/* Play Icon Overlay */}
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-90 group-hover:scale-100">
                                    <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                                        <i className="ri-play-fill text-white text-2xl ml-1"></i>
                                    </div>
                                </div>

                                {/* Episode Number Info - Always Visible */}
                                <div className="absolute bottom-3 left-3 bg-white/10 backdrop-blur-md border border-white/10 px-3 py-1 rounded-lg">
                                    <span className="text-white text-xs font-bold tracking-wider">EP {episode.episode_number}</span>
                                </div>
                            </div>

                            {/* Text Info */}
                            <div className="px-1">
                                <h4 className="text-white font-bold text-base line-clamp-1 group-hover:text-nova-accent transition-colors mb-1">
                                    {episode.name || `Episode ${episode.episode_number}`}
                                </h4>
                                <p className="text-gray-400 text-xs line-clamp-2 leading-relaxed">
                                    {episode.overview || `Watch Episode ${episode.episode_number} of ${anime.name}`}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
