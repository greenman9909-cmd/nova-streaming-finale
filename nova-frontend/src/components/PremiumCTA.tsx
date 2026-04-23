import { Link } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';

export default function PremiumCTA() {
    const { t } = useSettings();

    const features = [
        { icon: 'ri-hd-line', label: '1080p Full HD', desc: 'Calidad cristalina' },
        { icon: 'ri-surround-sound-line', label: 'Dolby Atmos', desc: 'Audio inmersivo' },
        { icon: 'ri-download-cloud-2-line', label: 'Descarga offline', desc: 'Miralo en cualquier lugar' },
        { icon: 'ri-device-line', label: '3 dispositivos', desc: 'Mira al mismo tiempo' },
        { icon: 'ri-skip-forward-line', label: 'Acceso anticipado', desc: 'Estrenos primero' },
        { icon: 'ri-advertisement-line', label: 'Sin anuncios', desc: 'Sin interrupciones' },
    ];

    return (
        <section className="w-full px-4 md:px-10 py-16 relative z-20">
            <div className="relative overflow-hidden rounded-[2rem] border border-white/[0.08] group">

                {/* === Deep Background Layers === */}
                <div className="absolute inset-0 bg-[#06060c] z-0" />

                {/* Gradient mesh */}
                <div className="absolute inset-0 z-0"
                    style={{
                        background: `
                            radial-gradient(ellipse 80% 60% at 10% 50%, rgba(124, 58, 237, 0.15), transparent 60%),
                            radial-gradient(ellipse 70% 50% at 90% 30%, rgba(192, 38, 211, 0.12), transparent 60%),
                            radial-gradient(ellipse 60% 80% at 50% 100%, rgba(59, 130, 246, 0.10), transparent 50%)
                        `
                    }}
                />

                {/* Aurora Orbs */}
                <div className="absolute -top-[40%] -left-[15%] w-[500px] h-[500px] bg-violet-600/20 rounded-full blur-[150px] animate-pulse pointer-events-none" />
                <div className="absolute -bottom-[30%] -right-[10%] w-[400px] h-[400px] bg-fuchsia-600/15 rounded-full blur-[130px] animate-pulse pointer-events-none" style={{ animationDelay: '1s' }} />
                <div className="absolute top-[20%] right-[30%] w-[300px] h-[300px] bg-blue-600/10 rounded-full blur-[100px] animate-pulse pointer-events-none" style={{ animationDelay: '2s' }} />

                {/* Dot grid overlay */}
                <div className="absolute inset-0 z-0 opacity-[0.03]"
                    style={{
                        backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                        backgroundSize: '24px 24px'
                    }}
                />

                {/* Scan line */}
                <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                    <div className="absolute w-full h-[1px] bg-gradient-to-r from-transparent via-violet-400/30 to-transparent animate-scan-down" />
                </div>

                {/* === Content === */}
                <div className="relative z-10 px-6 md:px-16 py-14 md:py-20">

                    {/* Top Section: Badge + Heading + Description */}
                    <div className="text-center max-w-3xl mx-auto mb-14">
                        {/* Floating Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 mb-6 backdrop-blur-sm">
                            <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse shadow-[0_0_8px_rgba(139,92,246,0.6)]" />
                            <span className="text-xs font-bold text-violet-300 uppercase tracking-[0.15em]">{t('premium.badge')}</span>
                        </div>

                        <h2 className="text-4xl md:text-6xl font-display font-black text-white mb-5 tracking-tight leading-[1.05]">
                            {t('premium.titlePrefix')}{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 animate-gradient-x">
                                {t('premium.titleHighlight')}
                            </span>
                        </h2>

                        <p className="text-gray-400 text-base md:text-lg font-medium leading-relaxed max-w-xl mx-auto">
                            {t('premium.description')}
                        </p>
                    </div>

                    {/* Feature Cards Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 mb-14">
                        {features.map((feature, i) => (
                            <div
                                key={feature.label}
                                className="group/card relative rounded-2xl p-4 md:p-5 bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm hover:bg-white/[0.06] hover:border-violet-500/20 transition-all duration-500 cursor-default text-center"
                                style={{ animationDelay: `${i * 80}ms` }}
                            >
                                {/* Glow on hover */}
                                <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-violet-500/0 to-violet-500/0 group-hover/card:from-violet-500/5 group-hover/card:to-transparent transition-all duration-500" />

                                <div className="relative z-10">
                                    <div className="w-10 h-10 md:w-12 md:h-12 mx-auto rounded-xl bg-violet-500/10 border border-violet-500/15 flex items-center justify-center mb-3 group-hover/card:bg-violet-500/20 group-hover/card:border-violet-500/30 transition-all duration-500 group-hover/card:shadow-[0_0_20px_rgba(139,92,246,0.15)]">
                                        <i className={`${feature.icon} text-xl md:text-2xl text-violet-400 group-hover/card:text-violet-300 transition-colors`}></i>
                                    </div>
                                    <h4 className="text-white font-bold text-xs md:text-sm mb-0.5 tracking-tight">{feature.label}</h4>
                                    <p className="text-gray-500 text-[10px] md:text-xs">{feature.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* CTA Row + Pricing */}
                    <div className="flex flex-col items-center gap-5">
                        {/* Pricing Teaser */}
                        <p className="text-gray-500 text-sm font-medium">
                            {t('premium.startingAt')} <span className="text-white font-bold text-lg">€4.99</span>{t('premium.perMonth')}
                        </p>

                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            {/* Primary CTA */}
                            <Link
                                to="/plans"
                                className="group/btn relative px-10 py-4 bg-white text-black font-black text-sm rounded-2xl overflow-hidden hover:scale-[1.03] transition-all duration-300 shadow-[0_0_50px_rgba(255,255,255,0.15)] hover:shadow-[0_0_60px_rgba(255,255,255,0.25)]"
                            >
                                {/* Shine sweep */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent translate-x-[-150%] group-hover/btn:translate-x-[150%] transition-transform duration-700 ease-out" />
                                <span className="relative z-10 flex items-center gap-2.5">
                                    {t('premium.tryFree')}
                                    <i className="ri-arrow-right-line text-lg group-hover/btn:translate-x-1 transition-transform"></i>
                                </span>
                            </Link>

                            {/* Secondary CTA */}
                            <Link
                                to="/plans"
                                className="px-10 py-4 rounded-2xl bg-white/[0.04] text-white font-bold text-sm border border-white/10 hover:bg-white/[0.08] hover:border-violet-500/30 transition-all duration-300 backdrop-blur-md"
                            >
                                {t('premium.viewPlans')}
                            </Link>
                        </div>

                        {/* Trust bar */}
                        <div className="flex items-center gap-6 mt-2 text-gray-600 text-[11px]">
                            <span className="flex items-center gap-1.5">
                                <i className="ri-shield-check-line text-green-500/60"></i>
                                {t('premium.cancelAnytime')}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <i className="ri-bank-card-line text-violet-500/60"></i>
                                {t('premium.noCommitment')}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <i className="ri-gift-line text-pink-500/60"></i>
                                {t('premium.trial')}
                            </span>
                        </div>
                    </div>

                </div>
            </div>

            {/* CSS for scan animation */}
            <style>{`
                @keyframes scan-down {
                    0% { transform: translateY(-100%); opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { transform: translateY(calc(100vh)); opacity: 0; }
                }
                .animate-scan-down {
                    animation: scan-down 6s linear infinite;
                }
                @keyframes gradient-x {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }
                .animate-gradient-x {
                    background-size: 200% 200%;
                    animation: gradient-x 4s ease infinite;
                }
            `}</style>
        </section>
    );
}
