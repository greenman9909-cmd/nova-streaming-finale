
import PremiumLoader from './PremiumLoader';

export default function PremiumCTA() {
    return (
        <section className="w-full px-6 md:px-12 py-12 relative z-20">
            <div className="relative overflow-hidden rounded-3xl p-8 md:p-12 border border-white/10 group">

                {/* Backgrounds */}
                <div className="absolute inset-0 bg-[#0A0A0F] z-0" />
                <div className="absolute inset-0 bg-gradient-to-r from-violet-900/20 via-transparent to-fuchsia-900/20 z-0 opacity-60" />

                {/* Cosmic Glow Animation */}
                <div className="absolute -top-[50%] -right-[20%] w-[80%] h-[150%] bg-gradient-to-b from-blue-600/10 to-violet-600/10 blur-[120px] rounded-full animate-pulse-slow pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">

                    {/* Left Content */}
                    <div className="flex items-center gap-8">
                        {/* Floating Crown Icon */}
                        <div className="relative hidden md:block">
                            <div className="absolute inset-0 bg-violet-500/30 blur-xl rounded-full animate-pulse" />
                            <PremiumLoader />
                        </div>

                        <div className="text-center md:text-left">
                            <h2 className="text-3xl md:text-4xl font-display font-black text-white mb-3 tracking-tight">
                                Upgrade to <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">Nova+</span>
                            </h2>
                            <p className="text-gray-400 text-sm md:text-base font-medium tracking-wide max-w-lg">
                                Unlock the ultimate experience with <span className="text-white">4K HDR</span>, <span className="text-white">Offline Downloads</span>, and <span className="text-white">Zero Ads</span>.
                            </p>

                            {/* Feature Badges */}
                            <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-6">
                                {['4K Ultra HD', 'Dolby Atmos', 'Early Access', '3 Devices'].map((feature) => (
                                    <span key={feature} className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-gray-300">
                                        {feature}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Actions */}
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <button className="group relative px-8 py-4 bg-white text-black font-black text-sm rounded-xl overflow-hidden hover:scale-105 transition-transform shadow-[0_0_40px_rgba(255,255,255,0.3)]">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                            <span className="relative z-10 flex items-center gap-2">
                                TRY FREE FOR 7 DAYS
                                <i className="ri-arrow-right-line"></i>
                            </span>
                        </button>

                        <button className="px-8 py-4 rounded-xl bg-white/5 text-white font-bold text-sm border border-white/10 hover:bg-white/10 hover:border-violet-500/50 transition-all backdrop-blur-md">
                            VIEW PRO PLANS
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}
