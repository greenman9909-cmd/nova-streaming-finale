
interface NovaLogoProps {
    className?: string;
}

export default function NovaLogo({ className = "w-12 h-12" }: NovaLogoProps) {
    return (
        <div className={`relative flex items-center justify-center ${className}`}>
            {/* Core */}
            <div className="absolute inset-0 m-auto w-[40%] h-[40%] bg-white rounded-full shadow-[0_0_15px_rgba(139,92,246,0.8)] z-10" />

            {/* Orbit 1 */}
            <div className="absolute inset-0 w-full h-full border border-violet-500/30 rounded-full animate-spin-slow" />

            {/* Orbit 2 (Tilted) */}
            <div className="absolute inset-0 w-full h-full border border-fuchsia-500/30 rounded-full animate-[spin_3s_linear_infinite]"
                style={{ transform: 'rotate(60deg)' }} />

            {/* Planet on Orbit */}
            <div className="absolute inset-0 w-full h-full animate-spin-slow">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-violet-400 rounded-full shadow-glow" />
            </div>

            {/* Outer Glow */}
            <div className="absolute inset-0 bg-violet-500/20 blur-xl rounded-full -z-10" />
        </div>
    );
}
