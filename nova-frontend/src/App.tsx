import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';

import EmailPopup from './components/EmailPopup';
import IntercomProvider from './components/IntercomProvider';
import ErrorBoundary from './components/ErrorBoundary';
import OfflineBanner from './components/OfflineBanner';
import RouteMeta from './components/RouteMeta';
import Footer from './components/Footer';

// Lazy load pages for performance optimization
// Lazy load pages for performance optimization
const Home = lazy(() => import('./pages/Home'));
const Anime = lazy(() => import('./pages/Anime'));
const MovieWatch = lazy(() => import('./pages/MovieWatch'));
const AnimeWatch = lazy(() => import('./pages/AnimeWatch'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const UpdatePassword = lazy(() => import('./pages/UpdatePassword'));
const Settings = lazy(() => import('./pages/Settings'));
const AnimeDetail = lazy(() => import('./pages/AnimeDetail'));
const SportsWatch = lazy(() => import('./pages/SportsWatch'));
const Search = lazy(() => import('./pages/Search'));
const Peliculas = lazy(() => import('./pages/Peliculas'));
const Series = lazy(() => import('./pages/Series'));
const Deportes = lazy(() => import('./pages/Deportes'));
const Plans = lazy(() => import('./pages/Plans'));
const Watch = lazy(() => import('./pages/Watch'));
const HistoryPage = lazy(() => import('./pages/History'));
const MyList = lazy(() => import('./pages/MyList'));
const Profiles = lazy(() => import('./pages/Profiles'));
const Terms = lazy(() => import('./pages/Terms'));
const Privacy = lazy(() => import('./pages/Privacy'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Novedades = lazy(() => import('./pages/Novedades'));
const Comics = lazy(() => import('./pages/Comics'));

// Loading Fallback
const PageLoader = () => (
    <div className="min-h-screen bg-nova-bg flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-nova-accent border-t-transparent rounded-full animate-spin"></div>
    </div>
);

import { AuthProvider, useAuth } from './context/AuthContext';
import { useEffect } from 'react';
import { installAdBlocker } from './utils/adBlocker';

// Guard to enforce profile selection
function ProfileGuard({ children }: { children: React.ReactNode }) {
    const { user, activeProfile, loading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (!loading && user && !activeProfile && location.pathname !== '/profiles' && location.pathname !== '/login' && location.pathname !== '/signup') {
            navigate('/profiles');
        }
    }, [user, activeProfile, loading, navigate, location]);

    if (loading) return <PageLoader />;

    return <>{children}</>;
}

function App() {
    const showEmailPopup = import.meta.env.VITE_ENABLE_EMAIL_POPUP === 'true';

    useEffect(() => {
        const cleanup = installAdBlocker();
        return cleanup;
    }, []);

    // Scroll reveal observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
        );

        const observe = () => {
            document.querySelectorAll('.nova-reveal, .nova-reveal-left, .nova-reveal-scale').forEach((el) => {
                observer.observe(el);
            });
        };

        // Initial scan + re-scan after route changes via MutationObserver
        observe();
        const mutationObserver = new MutationObserver(observe);
        mutationObserver.observe(document.body, { childList: true, subtree: true });

        return () => {
            observer.disconnect();
            mutationObserver.disconnect();
        };
    }, []);

    return (
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AuthProvider>
                <IntercomProvider />
                <RouteMeta />
                <div className="min-h-screen app-theme">
                    <div className="app-theme-bg" />
                    <OfflineBanner />
                    {showEmailPopup && <EmailPopup />}
                    <ProfileGuard>
                        <Navbar />
                        <ErrorBoundary>
                            <Suspense fallback={<PageLoader />}>
                                <Routes>
                                    <Route path="/" element={<Home />} />
                                    <Route path="/anime" element={<Anime />} />
                                    <Route path="/anime/:id" element={<AnimeDetail />} />
                                    <Route path="/anime/watch/:id" element={<AnimeWatch />} />
                                    <Route path="/peliculas" element={<Peliculas />} />
                                    <Route path="/series" element={<Series />} />
                                    <Route path="/deportes" element={<Deportes />} />
                                    <Route path="/deportes/watch/:source/:streamId" element={<SportsWatch />} />
                                    <Route path="/plans" element={<Plans />} />
                                    <Route path="/search" element={<Search />} />
                                    <Route path="/novedades" element={<Novedades />} />
                                    <Route path="/comics" element={<Comics />} />
                                    <Route path="/watch/:type/:id" element={<MovieWatch />} />
                                    <Route path="/watch/:episodeId" element={<Watch />} />
                                    <Route path="/login" element={<Login />} />
                                    <Route path="/signup" element={<Signup />} />
                                    <Route path="/update-password" element={<UpdatePassword />} />
                                    <Route path="/terms" element={<Terms />} />
                                    <Route path="/privacy" element={<Privacy />} />
                                    <Route path="/settings" element={<Settings />} />
                                    <Route path="/history" element={<HistoryPage />} />
                                    <Route path="/mylist" element={<MyList />} />
                                    <Route path="/profiles" element={<Profiles />} />
                                    <Route path="*" element={<NotFound />} />
                                </Routes>
                            </Suspense>
                        </ErrorBoundary>
                        <Footer />
                    </ProfileGuard>
                </div>
            </AuthProvider>
        </Router>
    );
}

export default App;
