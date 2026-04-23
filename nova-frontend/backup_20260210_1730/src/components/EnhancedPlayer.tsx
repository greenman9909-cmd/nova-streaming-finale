import { useEffect, useRef } from 'react';
import Hls from 'hls.js';

interface EnhancedPlayerProps {
    src: string;
    title: string;
    poster?: string | null | undefined;
    autoPlay?: boolean;
    onEnded?: () => void;
    onReady?: () => void;
    onProgress?: (progress: number, currentTime: number, duration: number) => void;
}

export default function EnhancedPlayer({ src, title, poster, autoPlay = false, onEnded, onReady, onProgress }: EnhancedPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);

    const isHls = src.includes('.m3u8');

    useEffect(() => {
        if (!videoRef.current || !isHls || !src) return;

        let hls: Hls;

        if (Hls.isSupported()) {
            hls = new Hls({
                enableWorker: true,
                lowLatencyMode: true,
            });
            hls.loadSource(src);
            hls.attachMedia(videoRef.current);
        } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
            // Safari native HLS
            videoRef.current.src = src;
        }

        return () => {
            if (hls) {
                hls.destroy();
            }
        };
    }, [src, isHls]);

    const handleTimeUpdate = () => {
        if (videoRef.current && onProgress) {
            const { currentTime, duration } = videoRef.current;
            if (duration > 0) {
                const progress = (currentTime / duration) * 100;
                onProgress(progress, currentTime, duration);
            }
        }
    };

    return (
        <div className="relative mb-6">
            <div className="relative aspect-video rounded-3xl overflow-hidden bg-[#0b0b10] border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
                {isHls ? (
                    <video
                        ref={videoRef}
                        className="w-full h-full object-contain bg-black"
                        controls
                        poster={poster || undefined}
                        playsInline
                        title={title}
                        autoPlay={autoPlay}
                        onEnded={onEnded}
                        onLoadedMetadata={onReady}
                        onTimeUpdate={handleTimeUpdate}
                    />
                ) : (
                    <iframe
                        src={src}
                        className="w-full h-full border-0 bg-black"
                        allow="autoplay; fullscreen; picture-in-picture"
                        allowFullScreen
                        title={title}
                        referrerPolicy="origin"
                        onLoad={onReady}
                        style={{ backgroundImage: `url(${poster || ''})`, backgroundSize: 'cover' }}
                    />
                )}
                <div className="pointer-events-none absolute inset-0 ring-1 ring-white/5" />
            </div>
        </div>
    );
}
