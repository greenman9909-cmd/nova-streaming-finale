import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import NovaLogo from '../components/NovaLogo';

const CREATORS = [
    {
        name: 'Adam',
        role: 'Co-Founder & Product Lead',
        avatar: 'AD',
        color: 'from-yellow-400 to-amber-500',
        bio: 'Visionario del producto. Encargado de la dirección creativa, la experiencia de usuario y la estrategia de contenido de Nova Streaming.',
        socials: [],
    },
    {
        name: 'Owais',
        role: 'Co-Founder & Lead Engineer',
        avatar: 'OW',
        color: 'from-violet-500 to-purple-600',
        bio: 'Arquitecto técnico principal. Responsable del desarrollo full-stack, la infraestructura backend, APIs e integración de pagos.',
        socials: [],
    },
    {
        name: 'Jampier',
        role: 'Co-Founder & Design Lead',
        avatar: 'JA',
        color: 'from-orange-400 to-pink-500',
        bio: 'Director de diseño. Crea las interfaces, animaciones y la identidad visual que hacen de Nova una experiencia única.',
        socials: [],
    },
];

const STATS = [
    { value: '10K+', label: 'Usuarios activos' },
    { value: '50K+', label: 'Títulos disponibles' },
    { value: '3', label: 'Planes flexibles' },
    { value: '2026', label: 'Año de fundación' },
];

const FEATURES = [
    { icon: 'ri-movie-2-line', title: 'Películas & Series', desc: 'Miles de títulos en español con calidad Full HD.' },
    { icon: 'ri-sword-line', title: 'Anime', desc: 'Catálogo completo de anime, doblado y subtitulado.' },
    { icon: 'ri-football-line', title: 'Deportes en Vivo', desc: 'Partidos y eventos deportivos en streaming en tiempo real.' },
    { icon: 'ri-book-2-fill', title: 'Comics & Manhwa', desc: 'Exclusivo Nova+ — miles de mangas y manhwas coreanos.' },
];

export default function About() {
    return (
        <main className="min-h-screen bg-[#07070f] text-white overflow-x-hidden">

            {/* ── Ambient glows ── */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-[15%] left-[20%]  w-[60%] h-[50%] bg-violet-700/8  blur-[180px] rounded-full" />
                <div className="absolute  top-[50%] right-[-5%] w-[40%] h-[40%] bg-cyan-600/6   blur-[150px] rounded-full" />
                <div className="absolute  bottom-0  left-[-5%]  w-[35%] h-[30%] bg-pink-700/5   blur-[120px] rounded-full" />
            </div>

            {/* ── Hero ── */}
            <section className="relative pt-32 pb-20 px-6 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    className="max-w-3xl mx-auto"
                >
                    <div className="flex justify-center mb-8">
                        <NovaLogo className="w-20 h-20" />
                    </div>

                    <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-4"
                        style={{ fontFamily: "'Bebas Neue', Impact, sans-serif" }}>
                        Sobre{' '}
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-cyan-400 to-violet-400">
                            Nova Streaming
                        </span>
                    </h1>

                    <p className="text-gray-400 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto mb-10">
                        Nova Streaming es la plataforma de entretenimiento diseñada para los amantes del contenido audiovisual.
                        Películas, series, anime, deportes en vivo y comics — todo en un solo lugar, sin límites.
                    </p>

                    <div className="flex flex-wrap justify-center gap-3">
                        <Link to="/plans"
                            className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600
                                       text-white font-bold hover:brightness-110 transition-all
                                       shadow-[0_8px_32px_rgba(139,92,246,0.35)]">
                            Ver planes
                        </Link>
                        <Link to="/"
                            className="px-7 py-3.5 rounded-xl bg-white/8 border border-white/12
                                       text-white font-semibold hover:bg-white/12 transition-colors">
                            Explorar contenido
                        </Link>
                    </div>
                </motion.div>
            </section>

            {/* ── Stats ── */}
            <section className="py-14 px-6">
                <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
                    {STATS.map((s, i) => (
                        <motion.div
                            key={s.label}
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                            className="text-center p-6 rounded-2xl bg-white/4 border border-white/8"
                        >
                            <p className="text-4xl font-black text-white mb-1">{s.value}</p>
                            <p className="text-sm text-gray-500">{s.label}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* ── Mission ── */}
            <section className="py-16 px-6">
                <div className="max-w-3xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 32 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <span className="text-xs font-bold tracking-widest text-violet-400 uppercase mb-4 block">
                            Nuestra misión
                        </span>
                        <h2 className="text-3xl md:text-5xl font-black mb-6">
                            Entretenimiento sin fronteras
                        </h2>
                        <p className="text-gray-400 text-base md:text-lg leading-relaxed">
                            Creemos que el gran contenido debe ser accesible para todos. Nova Streaming nació
                            con el objetivo de ofrecer una experiencia de streaming de calidad premium —
                            sin compromisos, sin restricciones geográficas y con los mejores títulos
                            de anime, cine, series y deportes, todos en un solo lugar.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* ── Features ── */}
            <section className="py-16 px-6">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-2xl md:text-3xl font-black text-center mb-12">
                        Todo lo que necesitas en una plataforma
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {FEATURES.map((f, i) => (
                            <motion.div
                                key={f.title}
                                initial={{ opacity: 0, y: 24 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: i * 0.08 }}
                                className="p-6 rounded-2xl bg-white/4 border border-white/8
                                           hover:bg-white/7 hover:border-violet-500/25 transition-all duration-300"
                            >
                                <i className={`${f.icon} text-3xl text-violet-400 mb-4 block`} />
                                <h3 className="font-bold text-white mb-2">{f.title}</h3>
                                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Team ── */}
            <section className="py-20 px-6">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-16">
                        <span className="text-xs font-bold tracking-widest text-cyan-400 uppercase mb-4 block">
                            El equipo
                        </span>
                        <h2 className="text-3xl md:text-5xl font-black">
                            Creado por apasionados del streaming
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {CREATORS.map((creator, i) => (
                            <motion.div
                                key={creator.name}
                                initial={{ opacity: 0, y: 32 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.6, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }}
                                className="group relative rounded-3xl bg-white/4 border border-white/8
                                           p-8 text-center hover:border-white/15 transition-all duration-300
                                           hover:shadow-[0_20px_60px_rgba(139,92,246,0.12)]"
                            >
                                {/* Avatar */}
                                <div className={`w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${creator.color}
                                                flex items-center justify-center
                                                text-3xl font-black text-black
                                                shadow-lg group-hover:scale-105 transition-transform duration-300`}>
                                    {creator.avatar}
                                </div>

                                <h3 className="text-2xl font-black text-white mb-1">{creator.name}</h3>
                                <p className="text-sm font-semibold text-violet-400 mb-4">{creator.role}</p>
                                <p className="text-sm text-gray-500 leading-relaxed">{creator.bio}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA ── */}
            <section className="py-20 px-6">
                <motion.div
                    initial={{ opacity: 0, y: 32 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="max-w-2xl mx-auto text-center"
                >
                    <h2 className="text-3xl md:text-5xl font-black mb-6">
                        Únete a Nova hoy
                    </h2>
                    <p className="text-gray-400 mb-8 text-lg">
                        Comienza gratis. Actualiza cuando quieras. Sin compromisos.
                    </p>
                    <Link to="/signup"
                        className="inline-flex items-center gap-2 px-10 py-4 rounded-2xl
                                   bg-gradient-to-r from-violet-600 to-cyan-500
                                   text-white font-black text-lg
                                   hover:brightness-110 transition-all
                                   shadow-[0_12px_48px_rgba(139,92,246,0.4)]">
                        <i className="ri-user-add-line" />
                        Crear cuenta gratis
                    </Link>
                </motion.div>
            </section>

        </main>
    );
}
