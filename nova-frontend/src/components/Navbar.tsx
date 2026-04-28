import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import NovaLogo from './NovaLogo';
import { searchMulti, MultiSearchResult, getImageUrl } from '../services/api';
import { useAuth } from '../context/AuthContext';
import AvatarSelectionModal from './AvatarSelectionModal';
import NotificationDropdown from './NotificationDropdown';

import { useSettings } from '../context/SettingsContext';

export default function Navbar() {
    const { user, signOut, activeProfile } = useAuth();
    const { t } = useSettings();
    const [searchOpen, setSearchOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const [avatarModalOpen, setAvatarModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<MultiSearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showBottomNav, setShowBottomNav] = useState(false);
    const [headerHidden, setHeaderHidden] = useState(false);
    const lastScrollY = useRef(0);
    const profileMenuRef = useRef<HTMLDivElement>(null);
    // isCollapsed state removed - Navbar is always visible
    const location = useLocation();
    const navigate = useNavigate();

    // Show mini nav on scroll
    useEffect(() => {
        const onScroll = () => {
            const y = window.scrollY;
            setShowBottomNav(y > 120);
            const delta = y - lastScrollY.current;
            if (delta > 8 && y > 80) {
                setHeaderHidden(true);
            } else if (delta < -6) {
                setHeaderHidden(false);
            }
            lastScrollY.current = y;
        };
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // Debounced live search - TMDB only
    useEffect(() => {
        if (!searchQuery.trim() || searchQuery.length < 2) {
            setSearchResults([]);
            return;
        }

        const debounceTimer = setTimeout(async () => {
            setIsSearching(true);
            try {
                const results = await searchMulti(searchQuery);
                setSearchResults(results.slice(0, 8));
            } catch (error) {
                console.error('Search error:', error);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 300);

        return () => clearTimeout(debounceTimer);
    }, [searchQuery]);

    const handleSearch = useCallback((query: string) => {
        if (!query.trim()) return;
        setSearchOpen(false);
        setSearchQuery('');
        setSearchResults([]);
        navigate(`/search?q=${encodeURIComponent(query)}`);
    }, [navigate]);

    const handleResultClick = useCallback((id: string, type: 'movie' | 'tv') => {
        setSearchOpen(false);
        setSearchQuery('');
        setSearchResults([]);
        if (type === 'movie') {
            navigate(`/watch/movie/${id}`);
        } else {
            navigate(`/watch/tv/${id}`);
        }
    }, [navigate]);

    const handleSignOut = async () => {
        await signOut();
        navigate('/login');
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') { setSearchOpen(false); setProfileMenuOpen(false); }
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setSearchOpen(true);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    // Close profile menu on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
                setProfileMenuOpen(false);
            }
        };
        if (profileMenuOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [profileMenuOpen]);

    useEffect(() => { setMobileMenuOpen(false); setProfileMenuOpen(false); }, [location]);

    // Section-specific glow colors
    const sectionConfig: Record<string, { glow: string; gradient: string; border: string }> = {
        '/': { glow: 'rgba(255,255,255,0.35)', gradient: 'from-white/20 to-gray-400/20', border: 'rgba(255,255,255,0.15)' },
        '/peliculas': { glow: 'rgba(124,92,255,0.40)', gradient: 'from-[#7C5CFF] to-[#5B8CFF]', border: 'rgba(124,92,255,0.3)' },
        '/series': { glow: 'rgba(59,130,246,0.40)', gradient: 'from-blue-500 to-blue-400', border: 'rgba(59,130,246,0.3)' },
        '/anime': { glow: 'rgba(34,211,238,0.40)', gradient: 'from-cyan-400 to-cyan-300', border: 'rgba(34,211,238,0.3)' },
        '/deportes': { glow: 'rgba(74,222,128,0.40)', gradient: 'from-green-400 to-emerald-300', border: 'rgba(74,222,128,0.3)' },
        '/history': { glow: 'rgba(251,191,36,0.40)', gradient: 'from-amber-400 to-orange-300', border: 'rgba(251,191,36,0.3)' },
        '/mylist': { glow: 'rgba(236,72,153,0.40)', gradient: 'from-pink-500 to-rose-400', border: 'rgba(236,72,153,0.3)' },
        '/profiles': { glow: 'rgba(45,212,191,0.40)', gradient: 'from-teal-400 to-emerald-300', border: 'rgba(45,212,191,0.3)' },
        '/plans': { glow: 'rgba(0,168,225,0.40)', gradient: 'from-[#00a8e1] to-[#0080b3]', border: 'rgba(0,168,225,0.3)' },
    };

    const navItems = [
        {
            path: '/',
            label: t('nav.home'),
            activeColor: 'text-white',
            iconLine: 'ri-home-5-line',
            iconFill: 'ri-home-5-fill'
        },
        {
            path: '/peliculas',
            label: t('nav.movies'),
            activeColor: 'text-violet-300',
            iconLine: 'ri-film-line',
            iconFill: 'ri-film-fill'
        },
        {
            path: '/series',
            label: t('nav.series'),
            activeColor: 'text-blue-300',
            iconLine: 'ri-tv-2-line',
            iconFill: 'ri-tv-2-fill'
        },
        {
            path: '/anime',
            label: t('nav.anime'),
            activeColor: 'text-cyan-300',
            iconLine: 'ri-sparkling-2-line',
            iconFill: 'ri-sparkling-2-fill'
        },
        {
            path: '/deportes',
            label: t('nav.sports'),
            activeColor: 'text-green-300',
            iconLine: 'ri-trophy-line',
            iconFill: 'ri-trophy-fill'
        },
        {
            path: '/history',
            label: t('nav.history'),
            activeColor: 'text-amber-300',
            iconLine: 'ri-history-line',
            iconFill: 'ri-history-line'
        },
        {
            path: '/mylist',
            label: t('nav.mylist'),
            activeColor: 'text-rose-300',
            iconLine: 'ri-bookmark-line',
            iconFill: 'ri-bookmark-fill',
            showInMiniNav: false
        },
        {
            path: '/profiles',
            label: t('nav.profiles'),
            activeColor: 'text-teal-300',
            iconLine: 'ri-user-3-line',
            iconFill: 'ri-user-3-fill',
            showInMiniNav: false
        },
        {
            path: '/plans',
            label: 'Nova+',
            activeColor: 'text-white',
            iconLine: 'ri-vip-crown-line',
            iconFill: 'ri-vip-crown-fill',
            isPremium: true
        },
    ];

    const isActive = (path: string) => path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);
    if (location.pathname === '/login') return null;

    return (
        <>
            {/* Main Navbar - Static and Always Visible */}
            <header className={`fixed !fixed top-0 left-0 w-full z-[100] px-3 pt-0 md:px-5 md:pt-1 transition-transform duration-500 ${headerHidden ? 'pointer-events-none -translate-y-full' : 'translate-y-0'}`}>
                <div className="mx-auto max-w-7xl">
                    <div className="h-16 md:h-20 bg-transparent supports-[backdrop-filter]:bg-transparent flex items-center justify-between px-4 md:px-6">
                        {/* Inner Content Wrapper */}
                        <div className="flex items-center justify-between w-full">
                            {/* Left: Logo */}
                            <div className="flex justify-start">
                                <Link to="/" className="relative flex items-center gap-3 group z-50 flex-shrink-0">
                                    <NovaLogo className="w-10 h-10 lg:w-12 lg:h-12 transition-transform duration-300 group-hover:scale-110 drop-shadow-[0_0_15px_rgba(139,92,246,0.3)]" />
                                    <div className="flex flex-col">
                                        <h1 className="text-xl lg:text-2xl font-black font-display tracking-tighter leading-none text-white drop-shadow-md">
                                            NOVA
                                        </h1>
                                        <span className="text-[0.55rem] font-bold tracking-[0.2em] text-gray-400 uppercase leading-none mt-0.5">Stream</span>
                                    </div>
                                </Link>
                            </div>

                            {/* Center: Explicit Navigation Menu */}
                            <div className="hidden md:flex items-center justify-center gap-3">
                                <Link to="/" className={`text-sm font-semibold tracking-wide transition-colors ${isActive('/') ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'text-gray-300 hover:text-white'}`}>
                                    Inicio
                                </Link>
                                <Link to="/series" className={`text-sm font-semibold tracking-wide transition-colors ${isActive('/series') ? 'text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'text-gray-300 hover:text-blue-300'}`}>
                                    Series
                                </Link>
                                <Link to="/anime" className={`text-sm font-semibold tracking-wide transition-colors ${isActive('/anime') ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]' : 'text-gray-300 hover:text-cyan-300'}`}>
                                    Anime
                                </Link>
                                <Link to="/peliculas" className={`text-sm font-semibold tracking-wide transition-colors ${isActive('/peliculas') ? 'text-violet-400 drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]' : 'text-gray-300 hover:text-violet-300'}`}>
                                    Películas
                                </Link>
                                <Link to="/deportes" className={`text-sm font-semibold tracking-wide transition-colors ${isActive('/deportes') ? 'text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]' : 'text-gray-300 hover:text-green-300'}`}>
                                    Deportes
                                </Link>
                                <Link to="/novedades" className={`text-sm font-semibold tracking-wide transition-colors ${isActive('/novedades') ? 'text-fuchsia-400 drop-shadow-[0_0_8px_rgba(217,70,239,0.5)]' : 'text-gray-300 hover:text-fuchsia-300'}`}>
                                    Novedades
                                </Link>
                                <Link to="/mylist" className={`hidden lg:block text-sm font-semibold tracking-wide transition-colors ${isActive('/mylist') ? 'text-rose-400 drop-shadow-[0_0_8px_rgba(244,114,182,0.5)]' : 'text-gray-300 hover:text-rose-300'}`}>
                                    Mi lista
                                </Link>
                                <Link to="/history" className={`hidden lg:block text-sm font-semibold tracking-wide transition-colors ${isActive('/history') ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]' : 'text-gray-300 hover:text-amber-300'}`}>
                                    Historial
                                </Link>
                                <Link to="/plans" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#00a8e1] to-[#0080b3] text-white text-xs font-bold shadow-lg shadow-blue-500/25 hover:shadow-blue-500/50 hover:scale-105 transition-all duration-300">
                                    <i className="ri-vip-crown-fill text-sm"></i>
                                    <span>Nova+</span>
                                </Link>
                            </div>

                            {/* Right: Actions (Socials + Search + Profile) */}
                            <div className="flex items-center justify-end gap-2 md:gap-2">
                                {/* Explicit Social Icons (Visible on md+) */}
                                <div className="hidden xl:flex items-center gap-2 mr-1">
                                    <a href="#" className="text-gray-400 hover:text-white transition-colors"><i className="ri-instagram-line text-lg"></i></a>
                                    <a href="#" className="text-gray-400 hover:text-white transition-colors"><i className="ri-twitter-x-line text-lg"></i></a>
                                    <a href="#" className="text-gray-400 hover:text-white transition-colors"><i className="ri-youtube-line text-lg"></i></a>
                                </div>

                                {/* Notifications */}
                                <NotificationDropdown />

                                <div className="h-6 w-px bg-white/10 hidden md:block"></div>

                                {/* Search */}
                                <div className={`search-bar-container relative flex flex-col transition-all duration-500 ${searchOpen ? 'w-[380px]' : 'w-10'
                                    }`}>
                                    <div className={`relative flex items-center w-full h-10 transition-all duration-500 ${searchOpen
                                        ? 'bg-[#0a0a12]/95 backdrop-blur-xl rounded-xl border border-violet-500/30 shadow-[0_0_30px_rgba(139,92,246,0.15)]'
                                        : 'bg-transparent'
                                        }`}>
                                        <button
                                            onClick={() => setSearchOpen(!searchOpen)}
                                            className={`w-10 h-10 flex-shrink-0 flex items-center justify-center transition-all duration-300 group ${searchOpen
                                                ? 'text-violet-400'
                                                : 'rounded-xl bg-white/[0.03] border border-white/[0.06] text-gray-400 hover:text-white hover:border-white/20 hover:bg-white/[0.08] hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]'
                                                }`}
                                        >
                                            <svg className={`w-[18px] h-[18px] transition-transform duration-300 ${!searchOpen ? 'group-hover:scale-110 group-hover:rotate-12' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                {searchOpen ? (
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                                ) : (
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                )}
                                            </svg>
                                        </button>

                                        {searchOpen && (
                                            <div className="flex-1 flex items-center gap-2 pr-3 animate-fade-in">
                                                <input
                                                    type="text"
                                                    placeholder="Buscar..."
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' && searchQuery.trim()) handleSearch(searchQuery);
                                                        if (e.key === 'Escape') setSearchOpen(false);
                                                    }}
                                                    autoFocus
                                                    className="flex-1 bg-transparent border-none text-white text-sm py-2 focus:outline-none placeholder-gray-500 font-medium"
                                                />
                                                {isSearching && (
                                                    <div className="w-4 h-4 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
                                                )}
                                                <button
                                                    onClick={() => searchQuery.trim() && handleSearch(searchQuery)}
                                                    className="w-7 h-7 rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 flex items-center justify-center text-white hover:scale-110 hover:shadow-lg hover:shadow-violet-500/50 transition-all duration-300 icon-bounce"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                                    </svg>
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Live Results Dropdown */}
                                    {searchOpen && searchResults.length > 0 && (
                                        <div className="absolute top-11 left-0 right-0 bg-[#0a0a12]/98 backdrop-blur-xl rounded-xl border border-violet-500/20 overflow-hidden shadow-2xl z-50 animate-slide-up-fade">
                                            <div className="max-h-[400px] overflow-y-auto">
                                                {searchResults.map((item, index) => (
                                                    <button
                                                        key={`result-${item.id}-${index}`}
                                                        onClick={() => handleResultClick(String(item.id), item.media_type === 'movie' ? 'movie' : 'tv')}
                                                        className="w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-all group border-b border-white/5 last:border-b-0"
                                                        style={{ animationDelay: `${index * 40}ms` }}
                                                    >
                                                        <div className="w-10 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-white/5 relative shadow-md group-hover:shadow-violet-500/20 transition-all">
                                                            <img
                                                                src={getImageUrl(item.poster_path)}
                                                                alt={item.title || item.name}
                                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                                            />
                                                        </div>
                                                        <div className="flex-1 text-left min-w-0">
                                                            <h4 className="text-white font-medium text-sm truncate group-hover:text-violet-300 transition-colors">
                                                                {item.title || item.name}
                                                            </h4>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${item.media_type === 'movie' ? 'bg-blue-500/20 text-blue-300' : 'bg-green-500/20 text-green-300'}`}>
                                                                    {item.media_type === 'movie' ? 'Movie' : 'Series'}
                                                                </span>
                                                                <span className="text-[10px] text-gray-500">{(item.release_date || item.first_air_date)?.split('-')[0]}</span>
                                                                {item.vote_average > 0 && (
                                                                    <span className="text-[10px] text-amber-400 flex items-center gap-0.5">
                                                                        <i className="ri-star-fill text-[8px]"></i>
                                                                        {Math.round(item.vote_average * 10)}%
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <svg className="w-4 h-4 text-gray-600 group-hover:text-violet-400 group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    </button>
                                                ))}
                                            </div>
                                            <button
                                                onClick={() => handleSearch(searchQuery)}
                                                className="w-full p-2.5 text-center text-xs text-violet-400 hover:text-white hover:bg-violet-500/10 transition-all border-t border-white/5 font-medium"
                                            >
                                                Ver todos los resultados →
                                            </button>
                                        </div>
                                    )}

                                    {searchOpen && searchQuery.length >= 2 && !isSearching && searchResults.length === 0 && (
                                        <div className="absolute top-11 left-0 right-0 bg-[#0a0a12]/98 backdrop-blur-xl rounded-xl border border-white/10 p-4 text-center animate-fade-in">
                                            <p className="text-gray-500 text-sm">No se encontraron resultados</p>
                                        </div>
                                    )}
                                </div>

                                {/* Login/Profile Button */}
                                {user ? (
                                    <div className="relative" ref={profileMenuRef}>
                                        <button
                                            onClick={() => setProfileMenuOpen(o => !o)}
                                            className="w-10 h-10 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-600 p-[1px] flex items-center justify-center overflow-hidden"
                                        >
                                            <div className="w-full h-full rounded-full bg-[#0a0a0f] flex items-center justify-center overflow-hidden">
                                                {(activeProfile?.avatar || user.user_metadata?.avatar_url) ? (
                                                    <img src={activeProfile?.avatar || user.user_metadata?.avatar_url} alt="Profile" className="w-full h-full object-cover" onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                                                ) : (
                                                    <span className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-fuchsia-400">
                                                        {(activeProfile?.name || user.user_metadata?.username)?.charAt(0).toUpperCase() || 'U'}
                                                    </span>
                                                )}
                                            </div>
                                        </button>

                                        {/* Dropdown — works on hover (desktop) AND tap (mobile) */}
                                        <div className={`absolute top-12 right-0 bg-[#0a0a12]/95 backdrop-blur-xl border border-white/10 rounded-xl p-2 w-56 transition-all flex flex-col gap-1 shadow-2xl z-50 ${profileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}>
                                            <div className="px-3 py-2 border-b border-white/5 mb-1 flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center">
                                                    {(activeProfile?.avatar || user.user_metadata?.avatar_url) ? (
                                                        <img src={activeProfile?.avatar || user.user_metadata?.avatar_url} alt="avatar" className="w-full h-full object-cover" onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                                                    ) : (
                                                        <span className="text-xs font-bold text-white">{(activeProfile?.name || user.user_metadata?.username)?.charAt(0).toUpperCase() || 'U'}</span>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-white text-sm font-bold truncate">{activeProfile?.name || user.user_metadata?.username || 'User'}</p>
                                                    <p className="text-gray-500 text-xs truncate">{user.email}</p>
                                                </div>
                                            </div>

                                            <Link
                                                to="/profiles"
                                                className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 text-sm transition-colors text-left w-full"
                                            >
                                                <i className="ri-user-3-line"></i>
                                                {t('nav.profiles')}
                                            </Link>

                                            <Link
                                                to="/mylist"
                                                className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 text-sm transition-colors text-left w-full"
                                            >
                                                <i className="ri-bookmark-line"></i>
                                                {t('nav.mylist')}
                                            </Link>

                                            <Link
                                                to="/history"
                                                className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 text-sm transition-colors text-left w-full"
                                            >
                                                <i className="ri-history-line"></i>
                                                {t('nav.history')}
                                            </Link>

                                            <button
                                                onClick={() => setAvatarModalOpen(true)}
                                                className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 text-sm transition-colors text-left w-full"
                                            >
                                                <i className="ri-user-smile-line"></i>
                                                Cambiar avatar
                                            </button>

                                            <Link
                                                to="/settings"
                                                className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 text-sm transition-colors text-left w-full"
                                            >
                                                <i className="ri-settings-4-line"></i>
                                                {t('nav.settings')}
                                            </Link>

                                            <button onClick={handleSignOut} className="flex items-center gap-2 px-3 py-2 rounded-lg text-red-400 hover:bg-white/5 text-sm transition-colors text-left w-full">
                                                <i className="ri-logout-box-line"></i>
                                                Cerrar sesión
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <Link
                                        to="/login"
                                        className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 hover:border-white/40 hover:shadow-[0_0_15px_rgba(255,255,255,0.15)] transition-all duration-300 group"
                                    >
                                        <i className="ri-user-3-line text-lg text-gray-300 group-hover:text-white transition-colors"></i>
                                    </Link>
                                )}

                                <AvatarSelectionModal isOpen={avatarModalOpen} onClose={() => setAvatarModalOpen(false)} />

                                {/* (Deprecated Social Block Removed) */}

                                {/* Mobile Menu Button */}
                                <button
                                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                    className="lg:hidden w-10 h-10 flex items-center justify-center rounded-xl bg-white/[0.03] border border-white/[0.06] text-gray-400"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                        {mobileMenuOpen ? (
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        ) : (
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                                        )}
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </header >

            {/* Floating Collapsed Pill removed for Classic Menu */}

            {/* Mobile Menu */}
            < div className={`fixed inset-0 z-40 lg:hidden transition-all duration-500 ${mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                }`}>
                <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => setMobileMenuOpen(false)} />
                <div className={`absolute top-20 left-4 right-4 bg-[#0B0D12] rounded-2xl border border-white/10 p-4 transition-all duration-500 ${mobileMenuOpen ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
                    }`}>
                    {navItems.map((item) => {
                        const active = isActive(item.path);
                        const config = sectionConfig[item.path];
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setMobileMenuOpen(false)}
                                className={`flex items-center gap-3 p-4 rounded-xl transition-all mb-1 ${active
                                    ? `bg-gradient-to-r ${config.gradient} text-white`
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <span className={active ? 'text-white' : 'text-gray-500'}>
                                    <i className={`${active ? item.iconFill : item.iconLine} text-xl`}></i>
                                </span>
                                <span className="font-medium">{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </div >
            {showBottomNav && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[90] hidden md:flex items-center gap-1 bg-[#08080e]/85 backdrop-blur-2xl border border-white/[0.08] px-2.5 py-2 rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.03)]">
                    {navItems.filter(item => item.path !== '/plans' && item.showInMiniNav !== false).map((item) => {
                        const active = isActive(item.path);
                        return (
                            <Link
                                key={`mini-${item.path}`}
                                to={item.path}
                                className={`group relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${active ? 'bg-white/15 text-white' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                                aria-label={item.label}
                            >
                                <i className={`${active ? item.iconFill : item.iconLine} text-lg`}></i>
                            </Link>
                        );
                    })}
                </div>
            )}

            <AvatarSelectionModal isOpen={avatarModalOpen} onClose={() => setAvatarModalOpen(false)} />
        </>
    );
}
