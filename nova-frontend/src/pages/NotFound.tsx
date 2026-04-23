import { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSettings } from '../context/SettingsContext';

export default function NotFound() {
    const navigate = useNavigate();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { t } = useSettings();

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const stars = Array.from({ length: 120 }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            r: Math.random() * 1.5 + 0.3,
            alpha: Math.random(),
            speed: Math.random() * 0.005 + 0.002,
        }));

        let animId: number;
        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            stars.forEach((star) => {
                star.alpha += star.speed;
                if (star.alpha > 1 || star.alpha < 0) star.speed *= -1;
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255,255,255,${star.alpha * 0.6})`;
                ctx.fill();
            });
            animId = requestAnimationFrame(draw);
        };
        draw();

        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        window.addEventListener('resize', handleResize);
        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return (
        <div className="relative min-h-screen bg-[#0a0a0f] flex items-center justify-center overflow-hidden">
            <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[var(--nova-accent,#8b5cf6)] opacity-[0.06] blur-[120px] pointer-events-none" />

            <div className="relative z-10 text-center px-6 max-w-lg">
                <motion.div
                    initial={{ opacity: 0, y: -40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: 'easeOut' }}
                >
                    <span
                        className="block text-[10rem] leading-none font-black tracking-tighter select-none"
                        style={{
                            background: 'linear-gradient(135deg, var(--nova-accent,#8b5cf6) 0%, #ec4899 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            textShadow: 'none',
                            filter: 'drop-shadow(0 0 40px rgba(139,92,246,0.4))',
                        }}
                    >
                        404
                    </span>
                </motion.div>

                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                    className="flex justify-center mb-6"
                >
                    <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                        <i className="ri-film-line text-2xl text-white/60" />
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.6 }}
                >
                    <h1 className="text-2xl font-bold text-white mb-3">{t('notFound.title')}</h1>
                    <p className="text-white/50 text-base mb-8 leading-relaxed">{t('notFound.description')}</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.55, duration: 0.6 }}
                    className="flex flex-col sm:flex-row gap-3 justify-center"
                >
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-all duration-300 hover:scale-105 hover:brightness-110"
                        style={{
                            background: 'linear-gradient(135deg, var(--nova-accent,#8b5cf6), #ec4899)',
                            boxShadow: '0 0 30px rgba(139,92,246,0.35)',
                        }}
                    >
                        <i className="ri-home-4-line" />
                        {t('notFound.backHome')}
                    </Link>
                    <button
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white/70 border border-white/10 bg-white/5 hover:bg-white/10 hover:text-white transition-all duration-300"
                    >
                        <i className="ri-arrow-left-line" />
                        {t('notFound.goBack')}
                    </button>
                </motion.div>
            </div>
        </div>
    );
}
