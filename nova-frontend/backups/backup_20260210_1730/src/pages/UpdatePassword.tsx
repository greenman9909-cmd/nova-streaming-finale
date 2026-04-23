import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { authService } from '../services/authService';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        // Use full email for Supabase auth
        try {
            const result = await authService.login(email, password);
            if (result.success) {
                navigate('/');
            } else {
                setError(result.message || 'Login failed');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDevSkip = () => {
        navigate('/');
    };

    return (
        <main className="min-h-screen flex items-center justify-center p-6">
            {/* Background Effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 -left-32 w-96 h-96 bg-nova-accent/20 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-500/20 rounded-full blur-[120px]"></div>
            </div>

            <div className="w-full max-w-md relative z-10">
                {/* Logo */}
                <Link to="/" className="relative flex items-center justify-center gap-3 mb-10 group">
                    <div className="relative w-12 h-12 flex items-center justify-center">
                        {/* Blur Glow */}
                        <div className="absolute w-full h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 blur-2xl rounded-full opacity-60"></div>
                        <svg className="absolute w-full h-full animate-spin-slow" viewBox="0 0 100 100">
                            {/* Orbital Ring 1 */}
                            <path id="orbit1" d="M 50, 50 m -40, 0 a 40,40 0 1,0 80,0 a 40,40 0 1,0 -80,0" stroke="url(#ringGradient)" strokeWidth="1.5" fill="none" strokeDasharray="8 4" className="opacity-60" />
                            {/* Orbital Ring 2 (Ellipse) */}
                            <path id="orbit2" d="M 50, 50 m -35, 0 a 35,18 0 1,0 70,0 a 35,18 0 1,0 -70,0" stroke="url(#ringGradient2)" strokeWidth="1.5" fill="none" className="opacity-50" transform="rotate(-45 50 50)" />

                            {/* Orbiting Dot 1 */}
                            <circle r="3" fill="white" className="drop-shadow-[0_0_6px_rgba(255,255,255,0.8)]">
                                <animateMotion dur="8s" repeatCount="indefinite">
                                    <mpath href="#orbit1" />
                                </animateMotion>
                            </circle>

                            {/* Orbiting Dot 2 */}
                            <circle r="2" fill="#a855f7" className="drop-shadow-[0_0_4px_rgba(168,85,247,0.8)]">
                                <animateMotion dur="5s" repeatCount="indefinite">
                                    <mpath href="#orbit2" />
                                </animateMotion>
                            </circle>

                            <defs>
                                <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#8b5cf6" />
                                    <stop offset="100%" stopColor="#d946ef" />
                                </linearGradient>
                                <linearGradient id="ringGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#22d3ee" />
                                    <stop offset="100%" stopColor="#8b5cf6" />
                                </linearGradient>
                            </defs>
                        </svg>
                        {/* Central Planet */}
                        <div className="relative w-4 h-4 bg-gradient-to-br from-white to-violet-200 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.8),0_0_30px_rgba(139,92,246,0.4)] animate-pulse-glow"></div>
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-3xl font-black tracking-tighter leading-none">
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-violet-200 to-white animate-shimmer">NOVA</span>
                        </h1>
                        <span className="text-[0.6rem] font-bold tracking-[0.2em] text-violet-300/80 uppercase">Boundless</span>
                    </div>
                </Link>

                {/* Login Card */}
                <div className="glass-dark rounded-3xl p-8 md:p-10">
                    <div className="text-center mb-8">
                        <h1 className="font-display font-bold text-3xl text-white mb-2">Welcome Back</h1>
                        <p className="text-nova-muted">Sign in to continue your anime journey</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Email */}
                        <div className="relative">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Email address"
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
                                placeholder="Password"
                                className="w-full px-5 py-4 rounded-xl bg-nova-surface border border-white/10 text-white placeholder:text-nova-dim focus:outline-none focus:border-nova-accent transition-colors"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-nova-dim hover:text-white transition-colors"
                            >
                                <i className={showPassword ? 'ri-eye-off-line' : 'ri-eye-line'}></i>
                            </button>
                        </div>

                        {/* Remember & Forgot */}
                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={() => setRememberMe(!rememberMe)}
                                    className="w-4 h-4 rounded border-white/20 bg-nova-surface text-nova-accent focus:ring-nova-accent"
                                />
                                <span className="text-nova-muted text-sm">Remember me</span>
                            </label>
                            <a href="#" className="text-nova-accent text-sm hover:text-nova-accent-hover transition-colors">
                                Forgot password?
                            </a>
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
                            className="w-full py-4 rounded-xl gradient-accent text-white font-semibold text-lg hover:opacity-90 transition-opacity glow-accent disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {isLoading ? (
                                <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-4 my-8">
                        <div className="flex-1 h-px bg-white/10"></div>
                        <span className="text-nova-dim text-sm">or continue with</span>
                        <div className="flex-1 h-px bg-white/10"></div>
                    </div>

                    {/* Social Login */}
                    <div className="grid grid-cols-3 gap-4">
                        <button className="py-3 rounded-xl glass hover:bg-white/10 transition-colors flex items-center justify-center">
                            <i className="ri-google-fill text-xl text-white"></i>
                        </button>
                        <button className="py-3 rounded-xl glass hover:bg-white/10 transition-colors flex items-center justify-center">
                            <i className="ri-apple-fill text-xl text-white"></i>
                        </button>
                        <button className="py-3 rounded-xl glass hover:bg-white/10 transition-colors flex items-center justify-center">
                            <i className="ri-twitter-x-fill text-xl text-white"></i>
                        </button>
                    </div>

                    {/* Sign Up Link */}
                    <p className="text-center mt-8 text-nova-muted">
                        Don't have an account?{' '}
                        <Link to="/signup" className="text-nova-accent hover:text-nova-accent-hover transition-colors font-medium">
                            Sign up
                        </Link>
                    </p>
                </div>

                {/* Dev Skip */}
                <button
                    onClick={handleDevSkip}
                    className="w-full mt-6 py-3 rounded-xl border border-white/10 text-nova-dim text-sm hover:text-white hover:bg-white/5 transition-all flex items-center justify-center gap-2"
                >
                    <i className="ri-code-line"></i>
                    Developer Skip
                </button>
            </div>
        </main>
    );
}
