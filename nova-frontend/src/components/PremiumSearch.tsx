interface PremiumSearchProps {
    value?: string;
    onChange?: (val: string) => void;
    onSearch?: (val: string) => void;
    onClick?: () => void;
    className?: string;
}

export default function PremiumSearch({ value, onChange, onSearch, onClick, className = '' }: PremiumSearchProps) {
    return (
        <div className={`relative group ${className}`}>
            {/* Main Container with Neumorphic/Dark Glass feel */}
            <div className="relative flex items-center w-full max-w-[300px] bg-[#1a1a1a] rounded-xl border border-white/10 shadow-[0_0_15px_-3px_rgba(236,72,153,0.3)] transition-all duration-300 focus-within:shadow-[0_0_25px_-5px_rgba(236,72,153,0.6)] hover:shadow-[0_0_20px_-5px_rgba(168,85,247,0.5)] overflow-hidden">

                {/* Glow Effects (Pink Left, Purple Right) */}
                <div className="absolute top-0 left-0 w-8 h-full bg-pink-500/20 blur-lg"></div>
                <div className="absolute bottom-0 right-10 w-8 h-full bg-purple-600/20 blur-lg"></div>

                {/* Search Icon */}
                <div className="pl-4 pr-3 text-gray-400 group-focus-within:text-white transition-colors">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        width="20"
                        height="20"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                </div>

                {/* Input Field */}
                <input
                    type="text"
                    className="w-full bg-transparent border-none text-white text-sm py-3 px-0 focus:outline-none placeholder-gray-500 font-medium tracking-wide"
                    placeholder="Search..."
                    value={value}
                    onChange={(e) => onChange?.(e.target.value)}
                    onClick={onClick}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && onSearch && value) {
                            onSearch(value);
                        }
                    }}
                />

                {/* Filter Icon Button */}
                <button
                    className="p-3 m-1 rounded-lg bg-[#2a2a2a] hover:bg-[#333] text-gray-400 hover:text-white border border-white/5 transition-all duration-200 hover:shadow-[0_0_10px_rgba(139,92,246,0.3)] group-active:scale-95"
                    onClick={() => onSearch && value && onSearch(value)} // Or toggle filter modal if that existed
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        width="18"
                        height="18"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                    </svg>
                </button>
            </div>

            {/* Exterior "Aura" for active state */}
            <div className="absolute -inset-[1px] bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-xl opacity-0 group-focus-within:opacity-50 blur-sm -z-10 transition-opacity duration-500"></div>
        </div>
    );
}
