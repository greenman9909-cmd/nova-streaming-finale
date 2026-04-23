import './PremiumLoader.css';

interface PremiumLoaderProps {
    className?: string;
}

export default function PremiumLoader({ className = '' }: PremiumLoaderProps) {
    return (
        <div className={`loader-container ${className}`}>
            <div className="loader">
                <div className="box"></div>
                <svg>
                    <defs>
                        <filter id="goo">
                            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
                            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo" />
                            <feBlend in="SourceGraphic" in2="goo" />
                        </filter>
                        <mask id="clipping">
                            {/* Polygons creating the gooey blob shape when blurred and contrasted */}
                            <polygon points="50,0 100,100 0,100" />
                            <polygon points="0,0 100,0 50,100" />
                            <polygon points="50,0 100,50 50,100 0,50" />
                            <polygon points="50,0 0,100 100,100" />
                            <polygon points="20,20 80,20 80,80 20,80" />
                            <polygon points="50,10 90,90 10,90" />
                            <polygon points="50,90 90,10 10,10" />
                        </mask>
                    </defs>
                </svg>
            </div>
            {/* Crown Icon Overlay - centered absolutely */}
            <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
                <i className="ri-vip-crown-2-fill text-2xl text-white drop-shadow-md"></i>
            </div>
        </div>
    );
}
