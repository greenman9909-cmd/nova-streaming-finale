import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';

// Utility for the "decoding" text effect
const DecryptingText = ({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) => {
    const [display, setDisplay] = useState('');
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890!@#$%^&*()_+";

    useEffect(() => {
        let iteration = 0;
        let timer: any;

        const start = setTimeout(() => {
            timer = setInterval(() => {
                setDisplay(
                    text
                        .split("")
                        .map((_letter, index) => {
                            if (index < iteration) return text[index];
                            return chars[Math.floor(Math.random() * chars.length)];
                        })
                        .join("")
                );

                if (iteration >= text.length) clearInterval(timer);
                iteration += 1 / 3;
            }, 30);
        }, delay);

        return () => {
            clearTimeout(start);
            clearInterval(timer);
        };
    }, [text, delay]);

    return <span className={className}>{display}</span>;
};

export default function Plans() {
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

    const containerRef = useRef<HTMLDivElement>(null);
    const [rotate, setRotate] = useState({ x: 0, y: 0 });
    const [isHovering, setIsHovering] = useState(false);

    // Mouse Parallax Logic
    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current) return;

        const { left, top, width, height } = containerRef.current.getBoundingClientRect();
        const x = (e.clientX - left - width / 2) / 25; // Sensitivity
        const y = (e.clientY - top - height / 2) / 25;

        setRotate({ x: -y, y: x }); // Invert Y for logic
        setIsHovering(true);
    }, []);

    const handleMouseLeave = () => {
        setIsHovering(false);
        setRotate({ x: 0, y: 0 });
    };

    const features = [
        { id: 1, label: 'Quantum 4K', icon: 'ri-eye-2-line', desc: 'HDR10+ visuals.' },
        { id: 2, label: 'NeuroFlow AI', icon: 'ri-brain-line', desc: 'Curated for you.' },
        { id: 3, label: 'Offline Mode', icon: 'ri-wifi-off-line', desc: 'Zero latency.' },
        { id: 4, label: 'No Ads', icon: 'ri-prohibited-line', desc: 'Uninterrupted.' },
    ];

    return (
        <div className="min-h-screen bg-[#030305] relative overflow-hidden flex items-center justify-center font-display selection:bg-cyan-500/30"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            ref={containerRef}
        >
            {/* ─── HYPERSPACE BACKGROUND ─── */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(17,24,39,0)_0%,#030305_100%)] z-10" />
                {/* Moving Stars (Simulated with grid) */}
                <div className="absolute inset-0 opacity-20"
                    style={{
                        backgroundImage: 'radial-gradient(white 1px, transparent 1px)',
                        backgroundSize: '50px 50px',
                        transform: `translate(${rotate.y * 2}px, ${rotate.x * 2}px)` // Parallax Stars
                    }}
                />
                {/* Atmosphere */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/5 rounded-full blur-[100px] animate-pulse-glow" />
            </div>

            {/* ─── UI LAYER ─── */}
            <main className="relative z-20 w-full max-w-7xl mx-auto px-6 grid lg:grid-cols-[300px_auto_300px] gap-8 items-center h-full">

                {/* LEFT HUD: SYSTEM LOGS */}
                <div className="hidden lg:flex flex-col gap-8 items-end text-right perspective-[1000px]">
                    {features.slice(0, 2).map((f, i) => (
                        <div key={f.id}
                            className="group w-full p-4 border-r-2 border-white/10 hover:border-cyan-500 bg-gradient-to-l from-white/5 to-transparent transition-all duration-300 hover:translate-x-[-10px]"
                            style={{ animation: `slide-in-right 0.5s ease-out ${i * 0.1}s backwards` }}
                        >
                            <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors flex items-center justify-end gap-2">
                                {f.label} <i className={f.icon}></i>
                            </h3>
                            <p className="text-xs text-gray-500 font-mono mt-1">{f.desc}</p>
                        </div>
                    ))}
                    <div className="mt-12 text-cyan-900/40 text-9xl font-black absolute top-1/2 left-0 -translate-y-1/2 -ml-20 -z-10 rotate-90 select-none pointer-events-none">
                        SYSTEM
                    </div>
                </div>

                {/* CENTER: THE ARTIFACT */}
                <div className="relative flex flex-col items-center justify-center perspective-[2000px] z-50">

                    {/* Header with Decoding Text */}
                    <div className="mb-12 text-center space-y-2 relative">
                        <div className="inline-block px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-950/20 text-[10px] uppercase tracking-[0.2em] text-cyan-400 mb-4 animate-fade-in-down">
                            Secure Terminal
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter mix-blend-screen relative">
                            <DecryptingText text="NOVA+" delay={200} />
                            <span className="absolute -top-1 -left-1 text-cyan-500 opacity-50 blur-[1px] animate-pulse">NOVA+</span>
                            <span className="absolute -bottom-1 -right-1 text-purple-500 opacity-50 blur-[1px] animate-pulse" style={{ animationDelay: '0.1s' }}>NOVA+</span>
                        </h1>
                    </div>

                    {/* 3D FLOATING CARD CONTAINER */}
                    <div
                        className="relative w-[380px] h-[540px] transition-transform duration-100 ease-linear preserve-3d"
                        style={{
                            transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg) scale(${isHovering ? 1.02 : 1})`
                        }}
                    >
                        {/* ─── HOLOGRAPHIC PROJECTION BEAMS ─── */}
                        <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-[80%] h-32 bg-gradient-to-t from-cyan-500/20 to-transparent blur-2xl transform perspective-[500px] rotateX(60deg) pointer-events-none" />

                        {/* ─── THE CARD ITSELF ─── */}
                        <div className="absolute inset-0 rounded-[40px] bg-[#0c0c14]/90 backdrop-blur-3xl border border-white/10 overflow-hidden group shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                            {/* Internal Gradient Mesh */}
                            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-cyan-500/10 via-transparent to-purple-500/10 opacity-50 group-hover:opacity-100 transition-opacity duration-500" />

                            {/* Scanline Effect */}
                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay" />
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/10 to-transparent h-[10px] w-full blur-md animate-shimmer" style={{ animationDuration: '3s' }} />

                            {/* Content */}
                            <div className="relative h-full flex flex-col items-center justify-between p-10 z-10">

                                {/* Plan Switcher (Physical Switch Look) */}
                                <div className="w-full flex justify-center">
                                    <div className="relative bg-black/50 rounded-full p-1.5 flex gap-2 border border-white/5">
                                        {['monthly', 'yearly'].map((cycle) => (
                                            <button
                                                key={cycle}
                                                onClick={() => setBillingCycle(cycle as any)}
                                                className={`relative px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 z-10 ${billingCycle === cycle ? 'text-black' : 'text-gray-400 hover:text-white'}`}
                                            >
                                                {cycle === 'monthly' && billingCycle === 'monthly' && (
                                                    <div className="absolute inset-0 bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.4)] layout-id-switch" />
                                                )}
                                                {cycle === 'yearly' && billingCycle === 'yearly' && (
                                                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full shadow-[0_0_20px_rgba(34,211,238,0.5)] layout-id-switch" />
                                                )}
                                                <span className="relative z-20">{cycle}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Price HUD */}
                                <div className="text-center space-y-2">
                                    <div className="text-[10px] font-mono text-cyan-500/60 uppercase tracking-widest mb-2">Current Tariff</div>
                                    <div className="text-7xl font-black text-white tracking-tighter flex items-start justify-center gap-1 group-hover:scale-110 transition-transform duration-500">
                                        <span className="text-2xl mt-2 opacity-50">€</span>
                                        {billingCycle === 'monthly' ? '9.99' : '89.99'}
                                    </div>
                                    {billingCycle === 'yearly' && (
                                        <div className="inline-block px-2 py-0.5 bg-green-500/20 text-green-400 text-[10px] font-bold rounded uppercase tracking-wider border border-green-500/30 animate-pulse">
                                            Savings: 25% Active
                                        </div>
                                    )}
                                </div>

                                {/* Call to Action */}
                                <div className="w-full space-y-4">
                                    <Link to="/signup" className="block w-full group/btn relative">
                                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-600 rounded-xl blur opacity-75 group-hover/btn:opacity-100 transition-opacity duration-300 animate-pulse-glow" />
                                        <button className="relative w-full bg-white text-black font-black uppercase tracking-[0.2em] text-sm py-4 rounded-xl hover:translate-y-[-2px] transition-transform flex items-center justify-center gap-3">
                                            <i className="ri-flashlight-fill"></i> Initialize
                                        </button>
                                    </Link>
                                    <p className="text-[10px] text-center text-gray-500 font-mono">
                                        ENCRYPTED CONNECTION • SECURE
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Back Glow Effect to Simulate Depth */}
                        <div className="absolute inset-4 bg-cyan-500/30 blur-2xl -z-10 transform translate-z-[-20px]" />
                    </div>
                </div>

                {/* RIGHT HUD: CORE DATA */}
                <div className="hidden lg:flex flex-col gap-8 text-left perspective-[1000px]">
                    {features.slice(2, 4).map((f, i) => (
                        <div key={f.id}
                            className="group w-full p-4 border-l-2 border-white/10 hover:border-purple-500 bg-gradient-to-r from-white/5 to-transparent transition-all duration-300 hover:translate-x-[10px]"
                            style={{ animation: `slide-in-right 0.5s ease-out ${0.2 + i * 0.1}s backwards` }}
                        >
                            <h3 className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors flex items-center gap-2">
                                <i className={f.icon}></i> {f.label}
                            </h3>
                            <p className="text-xs text-gray-500 font-mono mt-1">{f.desc}</p>
                        </div>
                    ))}
                    <div className="mt-12 text-purple-900/40 text-9xl font-black absolute bottom-1/2 right-0 translate-y-1/2 -mr-20 -z-10 -rotate-90 select-none pointer-events-none">
                        ACCESS
                    </div>
                </div>

                {/* Mobile Features Grid */}
                <div className="lg:hidden col-span-3 grid grid-cols-2 gap-4">
                    {features.map(f => (
                        <div key={f.id} className="bg-white/5 p-4 rounded-xl border border-white/10 text-center">
                            <i className={`${f.icon} text-2xl text-cyan-400 mb-2 block`}></i>
                            <div className="font-bold text-white text-sm">{f.label}</div>
                        </div>
                    ))}
                </div>

            </main>
        </div>
    );
}
