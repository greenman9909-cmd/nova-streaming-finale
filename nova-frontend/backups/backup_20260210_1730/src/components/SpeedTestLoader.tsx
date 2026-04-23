interface SpeedTestLoaderProps {
    message?: string;
    showRetry?: boolean;
    onRetry?: () => void;
    errorText?: string | null;
}

export default function SpeedTestLoader({ message = 'Testing internet (40 Mbps minimum)...', showRetry, onRetry, errorText }: SpeedTestLoaderProps) {
    return (
        <div className="speedtest-overlay">
            <div className="speedtest-wrapper">
                <div className="speedtest-scene">
                    <div className="loader">
                        <span>
                            <span></span>
                            <span></span>
                            <span></span>
                            <span></span>
                        </span>
                        <div className="base">
                            <span></span>
                        </div>
                        <div className="face"></div>
                    </div>
                    <div className="longfazers">
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                    <div className="clouds">
                        <div className="cloud cloud1"></div>
                        <div className="cloud cloud2"></div>
                        <div className="cloud cloud3"></div>
                        <div className="cloud cloud4"></div>
                        <div className="cloud cloud5"></div>
                    </div>
                </div>
                <div className="speedtest-text">{message}</div>
                {errorText && <div className="speedtest-error">{errorText}</div>}
                {showRetry && onRetry && (
                    <button onClick={onRetry} className="speedtest-retry">
                        Retry Speed Test
                    </button>
                )}
            </div>
        </div>
    );
}
