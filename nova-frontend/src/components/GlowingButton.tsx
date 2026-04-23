interface GlowingButtonProps {
    text: string;
    onClick?: () => void;
    className?: string;
    variant?: 'gold' | 'purple' | 'blue';
}

const GlowingButton = ({ text, onClick, className = '', variant = 'gold' }: GlowingButtonProps) => {
    return (
        <button
            onClick={onClick}
            className={`relative group w-full py-4 px-8 rounded-full font-bold text-white text-lg tracking-wide overflow-hidden transition-all duration-300 hover:scale-[1.02] ${className}`}
        >
            {/* Background Glow Container */}
            <div className="absolute inset-0 z-0">
                {/* Main Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-r ${variant === 'gold' ? 'from-purple-500 via-rose-500 to-yellow-400' :
                    variant === 'purple' ? 'from-violet-600 via-fuchsia-500 to-pink-500' :
                        'from-cyan-500 via-blue-500 to-indigo-500'
                    } opacity-90 transition-all duration-500 group-hover:opacity-100`}></div>

                {/* Blur Glow Effect (The "aura" behind) */}
                <div className={`absolute -inset-1 bg-gradient-to-r ${variant === 'gold' ? 'from-purple-500 via-rose-500 to-yellow-400' :
                    variant === 'purple' ? 'from-violet-600 via-fuchsia-500 to-pink-500' :
                        'from-cyan-500 via-blue-500 to-indigo-500'
                    } opacity-50 blur-xl transition-all duration-500 group-hover:opacity-75 group-hover:blur-2xl`}></div>
            </div>

            {/* Inner Shine/Gloss */}
            <div className="absolute inset-0 opacity-20 bg-gradient-to-b from-white to-transparent pointer-events-none"></div>

            {/* Text Content */}
            <span className="relative z-10 drop-shadow-md flex items-center justify-center gap-2">
                {text}
                <i className="ri-arrow-right-line transition-transform group-hover:translate-x-1"></i>
            </span>
        </button>
    );
};

export default GlowingButton;
