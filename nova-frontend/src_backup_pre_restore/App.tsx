import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import FloatingChatbot from './components/FloatingChatbot';
import EmailPopup from './components/EmailPopup';

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

// Loading Fallback
const PageLoader = () => (
    <div className="min-h-screen bg-nova-bg flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-nova-accent border-t-transparent rounded-full animate-spin"></div>
    </div>
);

import { AuthProvider, useAuth } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import { useEffect } from 'react';

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
    return (
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AuthProvider>
                <SettingsProvider>
                    <div className="min-h-screen app-theme">
                        <div className="app-theme-bg" />
                        <EmailPopup />
                        <ProfileGuard>
                            <Navbar />
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
                                    <Route path="/watch/:type/:id" element={<MovieWatch />} />
                                    <Route path="/watch/:episodeId" element={<Watch />} />
                                    <Route path="/login" element={<Login />} />
                                    <Route path="/signup" element={<Signup />} />
                                    <Route path="/update-password" element={<UpdatePassword />} />
                                    <Route path="/settings" element={<Settings />} />
                                    <Route path="/history" element={<HistoryPage />} />
                                    <Route path="/mylist" element={<MyList />} />
                                    <Route path="/profiles" element={<Profiles />} />
                                </Routes>
                            </Suspense>
                            <FloatingChatbot />
                        </ProfileGuard>
                    </div>
                </SettingsProvider>
            </AuthProvider>
        </Router>
    );
}

export default App;
