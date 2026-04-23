import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import ConfirmationModal from '../components/ConfirmationModal';
import { useSettings } from '../context/SettingsContext';

export default function Signup() {
    const { t } = useSettings();
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);

    // Unused for now, but ready for post-signup redirect if auto-login
    // const navigate = useNavigate(); 

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        username: username,
                    },
                },
            });

            if (error) {
                setError(error.message);
            } else {
                // Show confirmation modal
                setShowModal(true);
            }
        } catch (err) {
            setError(t('login.unexpectedError'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center p-6 bg-[#09090b]">
            {/* Background Effects matching Login */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 -right-32 w-96 h-96 bg-nova-accent/20 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-1/4 -left-32 w-96 h-96 bg-blue-500/20 rounded-full blur-[120px]"></div>
            </div>

            <div className="w-full max-w-md relative z-10">
                {/* Logo */}
                <Link to="/" className="relative flex items-center justify-center gap-3 mb-10 group">
                    {/* Same animated logo as Login */}
                    <div className="relative w-12 h-12 flex items-center justify-center">
                        <div className="absolute w-full h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 blur-2xl rounded-full opacity-60"></div>
                        <svg className="absolute w-full h-full animate-spin-slow" viewBox="0 0 100 100">
                            <path id="orbit1" d="M 50, 50 m -40, 0 a 40,40 0 1,0 80,0 a 40,40 0 1,0 -80,0" stroke="url(#ringGradient)" strokeWidth="1.5" fill="none" strokeDasharray="8 4" className="opacity-60" />
                            <circle r="3" fill="white" className="drop-shadow-[0_0_6px_rgba(255,255,255,0.8)]"><animateMotion dur="8s" repeatCount="indefinite"><mpath href="#orbit1" /></animateMotion></circle>
                            <defs>
                                <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#8b5cf6" /><stop offset="100%" stopColor="#d946ef" /></linearGradient>
                            </defs>
                        </svg>
                        <div className="relative w-4 h-4 bg-gradient-to-br from-white to-violet-200 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.8),0_0_30px_rgba(139,92,246,0.4)] animate-pulse-glow"></div>
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-3xl font-black tracking-tighter leading-none">
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-violet-200 to-white animate-shimmer">NOVA</span>
                        </h1>
                        <span className="text-[0.6rem] font-bold tracking-[0.2em] text-violet-300/80 uppercase">{t('signup.joinUs')}</span>
                    </div>
                </Link>

                {/* Signup Card */}
                <div className="glass-dark rounded-3xl p-8 md:p-10">
                    <div className="text-center mb-8">
                        <h1 className="font-display font-bold text-3xl text-white mb-2">{t('signup.title')}</h1>
                        <p className="text-nova-muted">{t('signup.subtitle')}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Username */}
                        <div className="relative">
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder={t('signup.username')}
                                className="w-full px-5 py-4 rounded-xl bg-nova-surface border border-white/10 text-white placeholder:text-nova-dim focus:outline-none focus:border-nova-accent transition-colors"
                                required
                            />
                            <i className="ri-user-smile-line absolute right-4 top-1/2 -translate-y-1/2 text-nova-dim"></i>
                        </div>

                        {/* Email */}
                        <div className="relative">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder={t('signup.email')}
                                className="w-full px-5 py-4 rounded-xl bg-nova-surface border border-white/10 text-white placeholder:text-nova-dim focus:outline-none focus:border-nova-accent transition-colors"
                                required
                            />
                            <i className="ri-mail-line absolute right-4 top-1/2 -translate-y-1/2 text-nova-dim"></i>
                        </div>

                        {/* Password */}
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={t('signup.password')}
                                className="w-full px-5 py-4 rounded-xl bg-nova-surface border border-white/10 text-white placeholder:text-nova-dim focus:outline-none focus:border-nova-accent transition-colors"
                                required
                                minLength={6}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-nova-dim hover:text-white transition-colors"
                            >
                                <i className={showPassword ? 'ri-eye-off-line' : 'ri-eye-line'}></i>
                            </button>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-xl text-sm text-center">
                                {error}
                            </div>
                        )}


                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 rounded-xl gradient-accent text-white font-semibold text-lg hover:opacity-90 transition-opacity glow-accent disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mt-4"
                        >
                            {isLoading ? (
                                <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                t('signup.createAccount')
                            )}
                        </button>
                    </form>

                    {/* Checkbox Terms */}
                    <p className="text-xs text-center text-nova-dim px-4 mt-6">
                        {t('signup.termsPrefix')} <Link to="/terms" className="text-white hover:underline">{t('signup.terms')}</Link> y <Link to="/privacy" className="text-white hover:underline">{t('signup.privacy')}</Link>.
                    </p>
                    <p className="text-center mt-8 text-nova-muted">
                        {t('signup.already')}{' '}
                        <Link to="/login" className="text-nova-accent hover:text-nova-accent-hover transition-colors font-medium">
                            {t('signup.signIn')}
                        </Link>
                    </p>
                </div>
            </div>

            {/* Modal */}
            <ConfirmationModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                email={email}
            />
        </main>
    );
}
