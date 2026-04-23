import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    searchMulti,
    getImageUrl,
    getTopAnimeCharacters,
    searchAnimeCharacters,
    getPopularMovies,
    getPopularSeries,
    getPopularPeople,
    getMovieCredits,
    getSeriesCredits,
    getAnimeId,
    getAnimeCharacters,
} from '../services/api';

const CATEGORIES = [
    { id: 'all', name: 'All', icon: 'ri-apps-line' },
    { id: 'anime', name: 'Anime', icon: 'ri-ghost-line' },
    { id: 'movies', name: 'Movies', icon: 'ri-film-line' },
    { id: 'series', name: 'Series', icon: 'ri-tv-line' },
    { id: 'stars', name: 'Stars', icon: 'ri-user-star-line' },
    { id: 'search', name: 'Search', icon: 'ri-search-line' },
];

interface AvatarItem {
    id: string | number;
    name: string;
    image: string;
    type: 'character_jikan' | 'person_tmdb' | 'media_tmdb';
    subtitle?: string;
    originalItem?: any;
}

interface AvatarSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AvatarSelectionModal({ isOpen, onClose }: AvatarSelectionModalProps) {
    const { updateProfile, user } = useAuth();

    // Main Navigation State
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Content State
    const [items, setItems] = useState<AvatarItem[]>([]);
    const [isFetching, setIsFetching] = useState(false);

    // Drill Down State (When viewing cast of a movie/show)
    const [viewingCastOf, setViewingCastOf] = useState<AvatarItem | null>(null);

    // Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [hasSearched, setHasSearched] = useState(false);

    // Derived Display
    const activeDisplayAvatar = previewAvatar || (user && user.user_metadata && user.user_metadata.avatar_url) || 'https://api.dicebear.com/9.x/thumbs/svg?seed=Nova';

    // Reset on Open
    useEffect(() => {
        if (isOpen) {
            // Reset to defaults
            if (selectedCategory === 'search') setItems([]);
            setViewingCastOf(null);
        }
    }, [isOpen]);

    // Fetch Logic
    useEffect(() => {
        let mounted = true;

        // If viewing cast, do nothing here (handled by drill down)
        if (viewingCastOf) return;

        if (selectedCategory === 'search') {
            if (!hasSearched) setItems([]);
            return;
        }

        const fetchData = async () => {
            setIsFetching(true);
            try {
                let rawResults: any[] = [];
                let mappedItems: AvatarItem[] = [];

                if (selectedCategory === 'all') {
                    const [
                        popularPeople,
                        topAnimeChars,
                        popularMovies,
                        popularSeries
                    ] = await Promise.all([
                        getPopularPeople(),
                        getTopAnimeCharacters(),
                        getPopularMovies(),
                        getPopularSeries()
                    ]);

                    const peopleItems: AvatarItem[] = (popularPeople || []).map((p: any) => ({
                        id: `person-${p.id}`,
                        name: p.name,
                        image: getImageUrl(p.profile_path, 'w500'),
                        type: 'person_tmdb' as const,
                        subtitle: 'Actor'
                    })).filter(i => i.image && !i.image.includes('placeholder'));

                    const animeItems: AvatarItem[] = (topAnimeChars || []).map((char: any) => ({
                        id: `anime-${char.mal_id}`,
                        name: char.name,
                        image: char.images?.jpg?.image_url,
                        type: 'character_jikan' as const,
                        subtitle: char.name_kanji
                    })).filter(i => i.image && !i.image.includes('placeholder'));

                    const castItems: AvatarItem[] = [];
                    const seenIds = new Set<string>();

                    const movieSlice = (popularMovies || []).slice(0, 5);
                    const seriesSlice = (popularSeries || []).slice(0, 5);

                    for (const m of movieSlice) {
                        try {
                            const credits = await getMovieCredits(m.id);
                            (credits?.cast || []).slice(0, 8).forEach((actor: any) => {
                                const key = `cast-${actor.id}`;
                                if (seenIds.has(key)) return;
                                seenIds.add(key);
                                castItems.push({
                                    id: key,
                                    name: actor.character || actor.name,
                                    image: getImageUrl(actor.profile_path, 'w500'),
                                    type: 'person_tmdb' as const,
                                    subtitle: m.title
                                });
                            });
                        } catch {
                            // ignore per-item errors
                        }
                    }

                    for (const s of seriesSlice) {
                        try {
                            const credits = await getSeriesCredits(s.id);
                            (credits?.cast || []).slice(0, 8).forEach((actor: any) => {
                                const key = `cast-${actor.id}`;
                                if (seenIds.has(key)) return;
                                seenIds.add(key);
                                castItems.push({
                                    id: key,
                                    name: actor.character || actor.name,
                                    image: getImageUrl(actor.profile_path, 'w500'),
                                    type: 'person_tmdb' as const,
                                    subtitle: s.name
                                });
                            });
                        } catch {
                            // ignore per-item errors
                        }
                    }

                    mappedItems = [...peopleItems, ...animeItems, ...castItems];
                }
                else if (selectedCategory === 'anime') {
                    // JIKAN API
                    rawResults = await getTopAnimeCharacters();
                    mappedItems = rawResults.map((char: any) => ({
                        id: char.mal_id,
                        name: char.name,
                        image: char.images?.jpg?.image_url,
                        type: 'character_jikan' as const,
                        subtitle: char.name_kanji
                    }));
                }
                else if (selectedCategory === 'stars') {
                    // TMDB People
                    rawResults = await getPopularPeople();
                    mappedItems = rawResults.map((p: any) => ({
                        id: p.id,
                        name: p.name,
                        image: getImageUrl(p.profile_path, 'w500'),
                        type: 'person_tmdb' as const
                    })).filter(i => i.image && !i.image.includes('placeholder'));
                }
                else if (selectedCategory === 'movies') {
                    // TMDB Movies (Drill Down Sources)
                    rawResults = await getPopularMovies();
                    mappedItems = rawResults.map((m: any) => ({
                        id: m.id,
                        name: m.title,
                        image: getImageUrl(m.poster_path, 'w500'),
                        type: 'media_tmdb' as const,
                        originalItem: m,
                        subtitle: 'Select to view characters'
                    }));
                }
                else if (selectedCategory === 'series') {
                    // TMDB Series (Drill Down Sources)
                    rawResults = await getPopularSeries();
                    mappedItems = rawResults.map((s: any) => ({
                        id: s.id,
                        name: s.name,
                        image: getImageUrl(s.poster_path, 'w500'),
                        type: 'media_tmdb' as const,
                        originalItem: { ...s, media_type: 'tv' },
                        subtitle: 'Select to view characters'
                    }));
                }

                if (mounted) setItems(mappedItems);
            } catch (error) {
                console.error("Fetch failed", error);
            } finally {
                if (mounted) setIsFetching(false);
            }
        };

        fetchData();
        return () => { mounted = false; };
    }, [selectedCategory, viewingCastOf]);

    // Search Logic
    const handleSearch = async (query: string) => {
        if (!query.trim()) return;
        setIsFetching(true);
        setHasSearched(true);
        setViewingCastOf(null); // Reset drill down on new search

        try {
            // If in Anime tab, search Jikan
            if (selectedCategory === 'anime') {
                const results = await searchAnimeCharacters(query);
                const mapped = results.map((char: any) => ({
                    id: char.mal_id,
                    name: char.name,
                    image: char.images?.jpg?.image_url,
                    type: 'character_jikan' as const,
                    subtitle: char.anime?.[0]?.title
                }));
                setItems(mapped);
            }
                else {
                    // Else search TMDB Multi
                    const results = await searchMulti(query);
                    const mapped = results.map((item: any) => {
                        if (item.media_type === 'person') {
                            return {
                            id: item.id,
                            name: item.name,
                            image: getImageUrl(item.profile_path, 'w500'),
                            type: 'person_tmdb' as const
                        };
                    } else {
                        // Movie or TV -> Drill Down Source
                        return {
                            id: item.id,
                            name: item.title || item.name,
                            image: getImageUrl(item.poster_path, 'w500'),
                            type: 'media_tmdb' as const,
                            originalItem: item,
                            subtitle: 'View Characters'
                        };
                    }
                }).filter((i: any) => i.image && !i.image.includes('placeholder'));
                setItems(mapped);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsFetching(false);
        }
    };

    // Handle Item Click (The Core Drill-Down Logic)
    const handleItemClick = async (item: AvatarItem) => {
        // If it's a character or person, SELECT IT
        if (item.type === 'character_jikan' || item.type === 'person_tmdb') {
            setPreviewAvatar(item.image);
            return;
        }

        // If it's Media, FETCH CAST (Drill Down)
        if (item.type === 'media_tmdb') {
            setViewingCastOf(item);
            setIsFetching(true);
            try {
                // DETECT ANIME vs LIVE ACTION
                const original = item.originalItem;
                const isAnime = original.genre_ids?.includes(16) || original.original_language === 'ja';

                let castResults: AvatarItem[] = [];

                if (isAnime) {
                    try {
                        // USE JIKAN FOR ANIME (Fetch Illustrated Characters for THIS Show)
                        // 1. Find the MAL ID for this show
                        let malId = await getAnimeId(item.name);

                        // Retry with cleaned name if failed (e.g. "Zootopia 2" -> "Zootopia")
                        // This helps find the "Main" entry which is more likely to be in Jikan/MAL
                        if (!malId && item.name) {
                            const cleanedName = item.name.replace(/ \d+$/, '').replace(/ (Movie|TV|Series)$/i, '');
                            if (cleanedName !== item.name) {
                                malId = await getAnimeId(cleanedName);
                            }
                        }

                        if (malId) {
                            // 2. Get Characters for this Show ID
                            const jikanResults = await getAnimeCharacters(malId);

                            // 3. Map Results
                            castResults = jikanResults.slice(0, 50).map((char: any) => ({
                                id: char.character.mal_id,
                                name: char.character.name,
                                image: char.character.images?.jpg?.image_url,
                                type: 'character_jikan' as const,
                                subtitle: char.role // 'Main' or 'Supporting'
                            })).filter((i: any) =>
                                i.image &&
                                !i.image.includes('placeholder') &&
                                !i.image.includes('questionmark') &&
                                !i.name.includes('unnamed')
                            );
                        }
                    } catch (err) {
                        console.warn("Jikan fetch failed", err);
                    }
                    // CRITICAL: DO NOT FALLBACK TO TMDB FOR ANIMATION
                    // User explicitly requested "No Real People/Actors" for Animation series like Doraemon.
                    // If Jikan fails, it is better to return empty than to return Jason Bateman for Zootopia.
                } else {
                    // USE TMDB FOR LIVE ACTION (Fetch Actors)
                    let credits;
                    const isMovie = original.media_type === 'movie' || original.title;

                    if (isMovie) {
                        credits = await getMovieCredits(item.id as number);
                    } else {
                        credits = await getSeriesCredits(item.id as number);
                    }

                    if (credits && credits.cast) {
                        castResults = credits.cast.slice(0, 60).map((actor: any) => ({
                            id: actor.id,
                            name: actor.character || actor.name,
                            image: getImageUrl(actor.profile_path, 'w500'),
                            type: 'person_tmdb' as const,
                            subtitle: actor.name
                        })).filter((i: any) => i.image && !i.image.includes('placeholder'));
                    }
                }

                setItems(castResults);
            } catch (error) {
                console.error("Failed to load cast", error);
                setViewingCastOf(null); // Revert on failure
            } finally {
                setIsFetching(false);
            }
        }
    };

    const handleSave = async () => {
        if (!previewAvatar) {
            onClose();
            return;
        }
        setIsLoading(true);
        try {
            await updateProfile({ avatar_url: previewAvatar });
            onClose();
            setPreviewAvatar(null);
        } catch (error) {
            console.error('Failed to update avatar', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md animate-fade-in" onClick={onClose} />
            <div className="relative w-full max-w-5xl bg-[#0a0a0f] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[700px] animate-scale-in">

                {/* PREVIEW SIDEBAR */}
                <div className="hidden md:flex w-80 bg-[#121217] border-r border-white/5 p-8 flex-col items-center justify-center relative overflow-hidden text-center shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-t from-cyan-900/10 to-transparent" />
                    <div className="relative z-10 w-full">
                        <div className="relative w-48 h-48 mx-auto mb-6 rounded-full p-2 bg-gradient-to-tr from-cyan-400 to-blue-600 shadow-[0_0_50px_rgba(34,211,238,0.2)]">
                            <div className="w-full h-full rounded-full bg-black overflow-hidden relative group">
                                <img src={activeDisplayAvatar} alt="Preview" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                            </div>
                            <div className="absolute bottom-2 right-2 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center border-4 border-[#121217] shadow-lg">
                                <i className="ri-check-line text-white font-bold"></i>
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-1">{user?.user_metadata?.username || 'NOVA User'}</h3>
                        <p className="text-gray-500 text-xs mb-8 uppercase tracking-widest">Identity Select</p>
                        <button onClick={handleSave} disabled={isLoading} className="w-full py-4 rounded-xl bg-white text-black font-black uppercase tracking-widest hover:bg-cyan-50 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50">
                            {isLoading ? <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : 'Confirm Selection'}
                        </button>
                    </div>
                </div>

                {/* CONTENT AREA */}
                <div className="flex-1 flex flex-col min-h-0 bg-[#0a0a0f]">
                    {/* Header with Search */}
                    <div className="p-6 border-b border-white/5 flex flex-col gap-4 bg-[#0a0a0f]/80 backdrop-blur-xl z-20">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {viewingCastOf ? (
                                    <button
                                        onClick={() => { setViewingCastOf(null); setSelectedCategory(selectedCategory); }} // Reset to category view
                                        className="w-10 h-10 rounded-full bg-white/10 hover:bg-cyan-500 hover:text-black flex items-center justify-center transition-all"
                                    >
                                        <i className="ri-arrow-left-line text-xl"></i>
                                    </button>
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                                        <i className="ri-shield-user-line text-xl"></i>
                                    </div>
                                )}
                                <div>
                                    <h2 className="text-xl font-bold text-white">
                                        {viewingCastOf ? `Characters of "${viewingCastOf.name}"` : 'Select Character'}
                                    </h2>
                                    <p className="text-gray-500 text-xs">
                                        {viewingCastOf ? 'Select an actor/character to use.' : 'Thousands of characters available.'}
                                    </p>
                                </div>
                            </div>
                            <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 hover:bg-red-500/20 hover:text-red-400 flex items-center justify-center transition-all">
                                <i className="ri-close-line text-xl"></i>
                            </button>
                        </div>

                        {/* Search Bar - Always Visible */}
                        <div className="relative group">
                            <input
                                type="text"
                                placeholder={selectedCategory === 'anime' ? "Search Anime Characters (e.g. Luffy, Naruto)..." : "Search Movies, Series, or People..."}
                                className="w-full bg-[#15151a] border border-white/10 rounded-xl px-12 py-3 text-white placeholder-gray-500 focus:border-cyan-500/50 focus:shadow-[0_0_20px_rgba(34,211,238,0.1)] focus:outline-none transition-all"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
                            />
                            <i className="ri-search-2-line absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-cyan-400 transition-colors"></i>
                            {searchQuery && (
                                <button onClick={() => handleSearch(searchQuery)} className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-cyan-500/20 text-cyan-400 text-xs font-bold rounded hover:bg-cyan-500 hover:text-black transition-all">
                                    GO
                                </button>
                            )}
                        </div>

                        {/* Category Tabs (Hidden if viewing Drill Down) */}
                        {!viewingCastOf && (
                            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                                {CATEGORIES.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => { setSelectedCategory(cat.id); setViewingCastOf(null); setSearchQuery(''); }}
                                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap border
                                        ${selectedCategory === cat.id
                                                ? 'bg-cyan-500 text-black border-cyan-500'
                                                : 'bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:text-white'}`}
                                    >
                                        <i className={cat.icon}></i> {cat.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Results Grid */}
                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar relative">
                        {isFetching ? (
                            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
                                {[...Array(18)].map((_, i) => (
                                    <div key={i} className="aspect-[2/3] rounded-lg bg-white/5 animate-pulse" />
                                ))}
                            </div>
                        ) : items.length > 0 ? (
                            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3 animate-fade-in">
                                {items.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => handleItemClick(item)}
                                        className={`group relative aspect-[2/3] rounded-lg overflow-hidden transition-all duration-300 text-left
                                        ${previewAvatar === item.image
                                                ? 'ring-2 ring-cyan-500 scale-105 z-10 shadow-[0_0_20px_rgba(34,211,238,0.4)]'
                                                : 'hover:scale-105 hover:ring-2 hover:ring-white/30 hover:z-10'}`}
                                    >
                                        <img
                                            src={item.image}
                                            alt={item.name}
                                            className="w-full h-full object-cover"
                                            loading="lazy"
                                        />

                                        {/* Overlay Checkmark */}
                                        {previewAvatar === item.image && (
                                            <div className="absolute inset-0 bg-cyan-900/40 flex items-center justify-center">
                                                <i className="ri-check-line text-4xl text-white drop-shadow-lg"></i>
                                            </div>
                                        )}

                                        {/* Info Badge */}
                                        <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
                                            <p className="text-white text-[10px] font-bold truncate leading-tight">{item.name}</p>
                                            {item.subtitle && <p className="text-gray-400 text-[9px] truncate">{item.subtitle}</p>}
                                            {/* Badge for Drill Downable Content */}
                                            {item.type === 'media_tmdb' && (
                                                <span className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/60 backdrop-blur rounded text-[8px] text-white flex items-center gap-1 border border-white/20">
                                                    <i className="ri-group-line"></i> Cast
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50">
                                <i className="ri-search-eye-line text-4xl mb-2"></i>
                                <p>No database matches found.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
