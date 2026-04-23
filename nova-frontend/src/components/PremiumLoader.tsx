import './PremiumLoader.css';

interface PremiumLoaderProps {
    className?: string;
    title?: string;
    subtitle?: string;
}

export default function PremiumLoader({
    className = '',
    title = 'Cargando stream...',
    subtitle = 'Preparando la experiencia Nova'
}: PremiumLoaderProps) {
    return (
        <div className={`loader-container ${className}`}>
            <div className="nova-loader">
                <div className="loader-orb" />
                <div className="loader-trail" />
                <div className="loader-glow" />
            </div>
            <div className="loader-text">
                <div className="loader-title">{title}</div>
                <div className="loader-sub">{subtitle}</div>
            </div>
        </div>
    );
}
