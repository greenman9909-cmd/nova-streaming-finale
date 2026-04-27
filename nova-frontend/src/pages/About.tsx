import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import NovaLogo from '../components/NovaLogo';

const CREATORS = [
    {
        name: 'Adam',
        role: 'Co-Founder · Product',
        avatar: 'AD',
        gradient: 'from-yellow-400 to-amber-500',
        shadow: 'shadow-[0_0_40px_rgba(251,191,36,0.18)]',
    },
    {
        name: 'Owais',
        role: 'Co-Founder · Engineering',
        avatar: 'OW',
        gradient: 'from-violet-500 to-indigo-600',
        shadow: 'shadow-[0_0_40px_rgba(139,92,246,0.22)]',
    },
    {
        name: 'Jampier',
        role: 'Co-Founder · Design',
        avatar: 'JA',
        gradient: 'from-orange-400 to-rose-500',
        shadow: 'shadow-[0_0_40px_rgba(251,146,60,0.18)]',
    },
];

const PILLARS = [
    { icon: 'ri-movie-2-line',   label: 'Películas & Series' },
    { icon: 'ri-sword-line',      label: 'Anime' },
    { icon: 'ri-football-line',   label: 'Deportes en Vivo' },
    { icon: 'ri-book-2-fill',     label: 'Comics & Manhwa' },
];

export default function About() {
    return (
        <main className="min-h-screen bg-[#07070f] text-white overflow-x-hidden">

            {/* ambient */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-0">
                <div className="absolute -top-[10%] left-[15%] w-[55%] h-[45%] bg-violet-700/7 blur-[200px] rounded-full" />
                <div className="absolute top-[55%] right-[-8%] w-[38%] h-[38%] bg-cyan-600/5 blur-[160px] rounded-full" />
            </div>

            {/* ── Hero ── */}
            <section className="relative pt-36 pb-24 px-6 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 36 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
                    className="max-w-2xl mx-auto"
                >
                    <NovaLogo className="w-16 h-16 mx-auto mb-8 opacity-90" />

                    <h1 className="text-5xl md:text-[4.5rem] font-black leading-none tracking-tight mb-5"
                        style={{ fontFamily: "'Bebas Neue', Impact, sans-serif" }}>
                        Sobre{' '}
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-cyan-300 to-violet-400">
                            Nova Streaming
                        </span>
                    </h1>

                    <p className="text-[1.05rem] text-gray-400 leading-relaxed mb-10 max-w-xl mx-auto">
                        Una plataforma construida por tres personas que querían ver
                        anime, películas, deportes y manhwa — todo en un solo lugar,
                        sin complicaciones.
                    </p>

                    <div className="flex flex-wrap justify-center gap-3">
                        <Link to="/"
                            className="px-7 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600
                                       text-white font-bold text-sm hover:brightness-110 transition-all
                                       shadow-[0_6px_28px_rgba(139,92,246,0.32)]">
                            Explorar Nova
                        </Link>
                        <Link to="/plans"
                            className="px-7 py-3 rounded-xl border border-white/10 bg-white/5
                                       text-white font-semibold text-sm hover:bg-white/9 transition-colors">
                            Ver planes
                        </Link>
                    </div>
                </motion.div>
            </section>

            {/* ── What's Nova ── */}
            <section className="py-14 px-6">
                <div className="max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.55 }}
                        className="rounded-3xl border border-white/8 bg-white/[0.035] p-10 md:p-14"
                    >
                        <span className="text-[11px] font-bold tracking-[0.18em] text-violet-400 uppercase mb-5 block">
                            ¿Qué es Nova?
                        </span>
                        <p className="text-white/80 text-lg md:text-xl leading-relaxed">
                            Nova Streaming es una plataforma de entretenimiento que reúne
                            el contenido que más te importa. Sin complicaciones, sin barreras.
                            Anime, películas, series, deportes en vivo y Comics & Manhwa —
                            accesible desde cualquier lugar.
                        </p>

                        <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {PILLARS.map((p, i) => (
                                <motion.div
                                    key={p.label}
                                    initial={{ opacity: 0, y: 16 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.4, delay: i * 0.07 }}
                                    className="flex flex-col items-center gap-2.5 p-5 rounded-2xl
                                               bg-white/4 border border-white/6
                                               hover:border-violet-500/25 hover:bg-white/7 transition-all duration-250"
                                >
                                    <i className={`${p.icon} text-2xl text-violet-400`} />
                                    <span className="text-xs font-semibold text-gray-300 text-center leading-snug">{p.label}</span>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ── Team ── */}
            <section className="py-20 px-6">
                <div className="max-w-4xl mx-auto">

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="text-center mb-16"
                    >
                        <span className="text-[11px] font-bold tracking-[0.18em] text-cyan-400 uppercase mb-4 block">
                            El equipo
                        </span>
                        <h2 className="text-3xl md:text-5xl font-black">
                            Tres personas. Una visión.
                        </h2>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {CREATORS.map((c, i) => (
                            <motion.div
                                key={c.name}
                                initial={{ opacity: 0, y: 32 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                                className="group relative rounded-3xl border border-white/8 bg-white/[0.03]
                                           p-8 text-center overflow-hidden
                                           hover:border-white/14 hover:bg-white/[0.05]
                                           transition-all duration-350"
                            >
                                {/* subtle top glow on hover */}
                                <div className={`absolute -top-12 left-1/2 -translate-x-1/2 w-40 h-40
                                                 bg-gradient-to-br ${c.gradient} opacity-0
                                                 group-hover:opacity-[0.12] blur-3xl
                                                 transition-opacity duration-500 pointer-events-none`} />

                                <div className={`w-20 h-20 mx-auto mb-5 rounded-2xl
                                                 bg-gradient-to-br ${c.gradient}
                                                 flex items-center justify-center
                                                 text-2xl font-black text-black/80
                                                 ${c.shadow}
                                                 group-hover:scale-105 transition-transform duration-300`}>
                                    {c.avatar}
                                </div>

                                <h3 className="text-xl font-black text-white mb-1">{c.name}</h3>
                                <p className="text-xs font-semibold text-white/40 tracking-wide">{c.role}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA ── */}
            <section className="py-20 px-6">
                <motion.div
                    initial={{ opacity: 0, y: 28 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="max-w-xl mx-auto text-center"
                >
                    <h2 className="text-3xl md:text-4xl font-black mb-4">Únete a Nova</h2>
                    <p className="text-gray-500 mb-8">Empieza gratis. Sin tarjeta. Sin compromisos.</p>
                    <Link to="/signup"
                        className="inline-flex items-center gap-2 px-9 py-3.5 rounded-xl
                                   bg-gradient-to-r from-violet-600 to-cyan-500
                                   text-white font-bold
                                   hover:brightness-110 transition-all
                                   shadow-[0_10px_40px_rgba(139,92,246,0.35)]">
                        <i className="ri-user-add-line" />
                        Crear cuenta gratis
                    </Link>
                </motion.div>
            </section>

        </main>
    );
}
