
import { useState } from 'react';

interface NetflixControlsProps {
    animeTitle: string;
    episodeNumber: string | number;
    onBack: () => void;
    onNext?: () => void;
    onToggleList?: () => void;
    servers: string[];
    selectedServer: string;
    onServerChange: (server: string) => void;
    types: ('sub' | 'dub')[];
    selectedType: 'sub' | 'dub';
    onTypeChange: (type: 'sub' | 'dub') => void;
    className?: string;
}

export default function NetflixControls({
    animeTitle,
    episodeNumber,
    onBack,
    onNext,
    onToggleList,
    servers,
    selectedServer,
    onServerChange,
    types,
    selectedType,
    onTypeChange,
    className = ''
}: NetflixControlsProps) {
    const [showAudioMenu, setShowAudioMenu] = useState(false);
    const [isHovering, setIsHovering] = useState(false);

    // Auto-hide controls after inactivity could be added here, 
    // but CSS group-hover handles most of it nicely.

    return (
        <div
            className={`absolute inset-0 z-50 flex flex-col justify-between transition-opacity duration-300 pointer-events-none ${className} ${isHovering || showAudioMenu ? 'opacity-100' : 'opacity-0 hover:opacity-100'}`}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => { setIsHovering(false); setShowAudioMenu(false); }}
        >
            {/* Top Bar - Gradient & Back */}
            <div className="bg-gradient-to-b from-black/80 via-black/40 to-transparent p-6 flex items-start justify-between pointer-events-auto">
                <button
                    onClick={onBack}
                    className="group flex items-center gap-2 text-white hover:scale-105 transition-transform"
                >
                    <i className="ri-arrow-left-line text-3xl drop-shadow-lg"></i>
                </button>
            </div>

            {/* Bottom Bar - Gradient & Controls */}
            <div className="bg-gradient-to-t from-black/90 via-black/50 to-transparent px-8 pb-8 pt-20 pointer-events-auto">
                {/* Progress Bar (Visual Only for now as it's iframe) */}
                <div className="w-full h-1.5 bg-gray-600/50 rounded-full mb-4 cursor-pointer group/progress relative">
                    <div className="absolute inset-y-0 left-0 bg-red-600 w-1/3 rounded-full relative">
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-red-600 rounded-full scale-0 group-hover/progress:scale-100 transition-transform shadow-lg"></div>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    {/* Left Controls */}
                    <div className="flex items-center gap-6">
                        <button className="text-white hover:text-white/80 transition-colors">
                            <i className="ri-play-fill text-4xl drop-shadow-md"></i>
                        </button>
                        <button className="text-white hover:text-white/80 transition-colors">
                            <i className="ri-replay-10-line text-2xl drop-shadow-md"></i>
                        </button>
                        <button className="text-white hover:text-white/80 transition-colors">
                            <i className="ri-forward-10-line text-2xl drop-shadow-md"></i>
                        </button>

                        {/* Volume (Visual) */}
                        <div className="group/vol flex items-center gap-2">
                            <i className="ri-volume-up-line text-2xl text-white cursor-pointer"></i>
                            <div className="w-0 overflow-hidden group-hover/vol:w-24 transition-all duration-300">
                                <div className="h-1 bg-white/30 rounded-full ml-2 w-20 relative">
                                    <div className="absolute inset-y-0 left-0 w-[70%] bg-white rounded-full"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Center Title */}
                    <div className="absolute left-1/2 -translate-x-1/2 text-center pb-4 pointer-events-none">
                        <h2 className="text-white font-bold text-lg drop-shadow-md">{animeTitle}</h2>
                        <span className="text-gray-300 text-sm font-medium drop-shadow-md">E{episodeNumber}</span>
                    </div>

                    {/* Right Controls */}
                    <div className="flex items-center gap-5 relative">
                        {onNext && (
                            <button onClick={onNext} className="text-gray-300 hover:text-white transition-colors flex items-center gap-1">
                                <i className="ri-skip-forward-line text-xl"></i>
                                <span className="text-sm font-bold uppercase tracking-wider">Next Episode</span>
                            </button>
                        )}

                        <button onClick={onToggleList} className="text-gray-300 hover:text-white transition-colors" title="Episodes">
                            <i className="ri-play-list-2-line text-2xl"></i>
                        </button>

                        {/* Audio & Subtitles Menu */}
                        <div className="relative">
                            <button
                                onClick={() => setShowAudioMenu(!showAudioMenu)}
                                className={`text-gray-300 hover:text-white transition-colors ${showAudioMenu ? 'text-white' : ''}`}
                                title="Audio & Subtitles"
                            >
                                <i className="ri-chat-3-line text-2xl"></i>
                            </button>

                            {/* Popover Menu */}
                            {showAudioMenu && (
                                <div className="absolute bottom-12 right-0 bg-black/90 border border-white/10 rounded-lg p-6 w-80 backdrop-blur-xl shadow-2xl animate-fade-in-up">
                                    <div className="grid grid-cols-2 gap-8">
                                        {/* Audio / Sub Selection */}
                                        <div className="flex flex-col gap-3">
                                            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Audio</h3>
                                            {types.map(type => (
                                                <button
                                                    key={type}
                                                    onClick={() => onTypeChange(type)}
                                                    className={`text-left text-sm font-medium transition-colors ${selectedType === type ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                                                >
                                                    {type === 'sub' ? 'Original (Sub)' : 'English (Dub)'}
                                                    {selectedType === type && <i className="ri-check-line ml-2 text-white"></i>}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Server Selection */}
                                        <div className="flex flex-col gap-3">
                                            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Source</h3>
                                            {servers.map(server => (
                                                <button
                                                    key={server}
                                                    onClick={() => onServerChange(server)}
                                                    className={`text-left text-sm font-medium uppercase transition-colors ${selectedServer === server ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                                                >
                                                    {server.replace('-', ' ')}
                                                    {selectedServer === server && <i className="ri-check-line ml-2 text-white"></i>}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <button className="text-gray-300 hover:text-white transition-colors">
                            <i className="ri-fullscreen-line text-2xl"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
