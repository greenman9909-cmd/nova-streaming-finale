import React from 'react';

const NovaPlusBanner: React.FC = () => {
    return (
        <section className="relative w-full h-[85vh] min-h-[600px] overflow-hidden bg-black text-white font-sans select-none">
            {/* Background Image with Cinematic Grading */}
            <div className="absolute inset-0">
                <img
                    src="/nova_plus_banner_bg.png"
                    alt="The Wrecking Crew"
                    className="w-full h-full object-cover object-center scale-[1.02] brightness-[0.9]"
                />

                {/* Precise Prime-style Gradients */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent w-full md:w-[70%]" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent h-[40%] bottom-0" />
            </div>

            {/* Content Container */}
            <div className="relative z-10 h-full flex flex-col justify-center px-6 md:px-20 max-w-5xl">
                {/* Branding: Nova Plus (Prime style) */}
                <div className="flex items-center gap-2 mb-6 animate-fade-in group cursor-pointer">
                    <div className="flex flex-col items-start">
                        <span className="text-[#00a8e1] font-black text-3xl lowercase tracking-[-0.05em] leading-none mb-1">
                            nova
                        </span>
                        <div className="h-[2px] w-[80%] bg-[#00a8e1] rounded-full mt-[-6px] ml-0 relative">
                            <div className="absolute -right-1 -top-1 w-1 h-1 bg-[#00a8e1] rounded-full rotate-45" />
                        </div>
                    </div>
                    <span className="text-[#00a8e1] text-[10px] uppercase tracking-[0.4em] font-black mt-1 ml-1 opacity-80">
                        plus
                    </span>
                </div>

                {/* Main Title Container with Decoration */}
                <div className="mb-6">
                    <h1 className="text-5xl md:text-[84px] font-[900] uppercase tracking-tighter leading-[0.9] drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] font-display">
                        THE WRECKING CREW
                    </h1>
                    <div className="h-[5px] w-64 bg-white mt-4 rounded-full shadow-lg" />
                </div>

                {/* Status Badge */}
                <div className="flex items-center gap-2 mb-8 drop-shadow-lg">
                    <span className="text-[#46d369] font-black text-sm tracking-wide">
                        #1 in Spain
                    </span>
                </div>

                {/* Description Text */}
                <p className="text-lg md:text-xl text-white/90 leading-snug mb-10 max-w-2xl font-semibold drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                    Two estranged half-brothers, a reckless ex-cop (Jason Momoa) and
                    a Navy SEAL (Dave Bautista), are forced to reunite to solve their...
                </p>

                {/* Prime-style Action Row */}
                <div className="flex items-center gap-4 mb-10">
                    <button className="flex items-center gap-3 px-10 py-4 bg-white/10 hover:bg-white text-white hover:text-black rounded font-bold text-xl transition-all duration-300 backdrop-blur-md group shadow-2xl">
                        <i className="ri-play-fill text-3xl transition-transform group-hover:scale-110"></i>
                        <span>Watch now</span>
                    </button>

                    <button className="flex items-center justify-center w-14 h-14 rounded-full bg-white/5 border-[2.5px] border-white/40 hover:bg-white hover:text-black hover:border-white transition-all duration-300 backdrop-blur-md group">
                        <i className="ri-add-line text-2xl group-hover:scale-110"></i>
                    </button>

                    <button className="flex items-center justify-center w-14 h-14 rounded-full bg-white/5 border-[2.5px] border-white/40 hover:bg-white hover:text-black hover:border-white transition-all duration-300 backdrop-blur-md group">
                        <i className="ri-information-line text-2xl group-hover:scale-110"></i>
                    </button>
                </div>

                {/* Subscription Info Footnote */}
                <div className="flex items-center gap-3 animate-pulse-slow">
                    <div className="w-5 h-5 rounded-full bg-[#00a8e1] flex items-center justify-center shadow-[0_0_10px_rgba(0,168,225,0.4)]">
                        <i className="ri-check-line text-black font-black text-[10px]"></i>
                    </div>
                    <span className="text-white font-[800] text-sm tracking-tight">Included with NOVA PLUS</span>
                </div>
            </div>

            {/* Pagination Indicators Container */}
            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-3">
                {[0, 1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className={`transition-all duration-500 rounded-full ${i === 0 ? 'w-2.5 h-2.5 bg-white shadow-[0_0_10px_white]' : 'w-2 h-2 bg-white/30 hover:bg-white/60 cursor-pointer'}`}
                    />
                ))}
            </div>

            {/* Age Rating - Precise Position */}
            <div className="absolute bottom-12 right-12 bg-black/40 backdrop-blur-md border border-white/20 px-2 py-0.5 rounded text-[10px] font-black text-white/90 tracking-widest leading-none">
                16+
            </div>

            {/* Navigation Arrows (Caret Style) */}
            <button className="absolute left-6 top-1/2 -translate-y-1/2 p-2 text-white/40 hover:text-white transition-all hover:scale-150">
                <i className="ri-arrow-left-s-line text-6xl font-thin"></i>
            </button>
            <button className="absolute right-6 top-1/2 -translate-y-1/2 p-2 text-white/40 hover:text-white transition-all hover:scale-150">
                <i className="ri-arrow-right-s-line text-6xl font-thin"></i>
            </button>
        </section>
    );
};

export default NovaPlusBanner;
