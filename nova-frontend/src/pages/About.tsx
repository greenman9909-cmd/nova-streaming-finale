import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const fade = (delay = 0) => ({
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] },
});

export default function About() {
    return (
        <main className="min-h-screen bg-[#050508] text-white">

            {/* ── HERO ── */}
            <section className="px-6 md:px-16 pt-40 pb-28 max-w-6xl mx-auto">
                <motion.p
                    {...fade(0)}
                    className="text-xs tracking-[0.25em] text-white/30 uppercase mb-8 font-medium"
                >
                    Nova Streaming · 2026
                </motion.p>

                <motion.h1
                    {...fade(0.05)}
                    className="text-[clamp(3rem,10vw,8rem)] font-black leading-[0.92] tracking-tight mb-10"
                    style={{ fontFamily: "'Bebas Neue', Impact, sans-serif" }}
                >
                    Hecho para los que{' '}
                    <br />
                    <span className="text-white/20">no se conforman</span>
                </motion.h1>

                <motion.p {...fade(0.1)} className="text-white/50 text-lg max-w-lg leading-relaxed">
                    Nova nació de una idea simple: mereces una plataforma que tenga
                    todo — anime, películas, series, deportes en vivo y manhwa —
                    sin tener que buscar en diez sitios diferentes.
                </motion.p>
            </section>

            {/* ── DIVIDER ── */}
            <div className="h-px bg-white/6 mx-6 md:mx-16" />

            {/* ── CONTENT GRID ── */}
            <section className="px-6 md:px-16 py-24 max-w-6xl mx-auto grid md:grid-cols-2 gap-20 items-start">
                <motion.div {...fade(0)}>
                    <p className="text-xs tracking-[0.2em] text-white/25 uppercase mb-6">Lo que construimos</p>
                    <ul className="space-y-5">
                        {[
                            ['Anime', 'Sub y doblado. Sin restricciones.'],
                            ['Películas & Series', 'Lo que está en tendencia, cuando quieras.'],
                            ['Deportes en Vivo', 'Fútbol, baloncesto y más — en tiempo real.'],
                            ['Comics & Manhwa', 'Exclusivo Nova+. Miles de títulos coreanos y más.'],
                        ].map(([title, desc]) => (
                            <li key={title} className="flex gap-5 items-start group">
                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-white/20
                                                 group-hover:bg-violet-400 transition-colors duration-300 shrink-0" />
                                <div>
                                    <p className="font-bold text-white text-base">{title}</p>
                                    <p className="text-white/40 text-sm mt-0.5">{desc}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </motion.div>

                <motion.div {...fade(0.08)} className="space-y-6 text-white/45 text-base leading-relaxed">
                    <p>
                        No somos una empresa. Somos tres personas que querían algo mejor
                        y decidieron construirlo.
                    </p>
                    <p>
                        Cada detalle de Nova — desde la velocidad de carga hasta el diseño
                        de cada pantalla — está pensado para que la experiencia se sienta
                        fluida, moderna y sin fricción.
                    </p>
                    <p>
                        Empezamos pequeños. Seguimos creciendo. Y no vamos a parar.
                    </p>
                </motion.div>
            </section>

            {/* ── DIVIDER ── */}
            <div className="h-px bg-white/6 mx-6 md:mx-16" />

            {/* ── TEAM ── */}
            <section className="px-6 md:px-16 py-24 max-w-6xl mx-auto">
                <motion.p {...fade(0)} className="text-xs tracking-[0.2em] text-white/25 uppercase mb-16">
                    El equipo
                </motion.p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/6 border border-white/6 rounded-2xl overflow-hidden">
                    {[
                        { name: 'Adam',    role: 'Product',     initials: 'AD', color: '#f59e0b' },
                        { name: 'Owais',   role: 'Engineering', initials: 'OW', color: '#8b5cf6' },
                        { name: 'Jampier', role: 'Design',      initials: 'JA', color: '#f97316' },
                    ].map((p, i) => (
                        <motion.div
                            key={p.name}
                            {...fade(i * 0.1)}
                            className="bg-[#050508] p-10 hover:bg-white/[0.025] transition-colors duration-300 group"
                        >
                            <div
                                className="w-12 h-12 rounded-xl flex items-center justify-center
                                           text-sm font-black text-black mb-8
                                           group-hover:scale-105 transition-transform duration-300"
                                style={{ backgroundColor: p.color }}
                            >
                                {p.initials}
                            </div>
                            <p className="text-2xl font-black text-white mb-1">{p.name}</p>
                            <p className="text-xs text-white/30 tracking-widest uppercase font-medium">{p.role}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* ── DIVIDER ── */}
            <div className="h-px bg-white/6 mx-6 md:mx-16" />

            {/* ── BOTTOM CTA ── */}
            <section className="px-6 md:px-16 py-24 max-w-6xl mx-auto flex flex-col md:flex-row
                                 items-start md:items-center justify-between gap-8">
                <motion.div {...fade(0)}>
                    <p className="text-3xl md:text-4xl font-black leading-tight">
                        Empieza gratis.
                        <br />
                        <span className="text-white/30">Sin tarjeta. Sin trampa.</span>
                    </p>
                </motion.div>

                <motion.div {...fade(0.08)} className="flex gap-3 shrink-0">
                    <Link to="/signup"
                        className="px-7 py-3.5 rounded-xl bg-white text-black font-bold text-sm
                                   hover:bg-white/90 transition-colors">
                        Crear cuenta
                    </Link>
                    <Link to="/plans"
                        className="px-7 py-3.5 rounded-xl border border-white/12 text-white/70
                                   font-semibold text-sm hover:text-white hover:border-white/25
                                   transition-all">
                        Ver planes
                    </Link>
                </motion.div>
            </section>

        </main>
    );
}
