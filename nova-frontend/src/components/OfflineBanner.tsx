import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Displays a sticky top banner when the user goes offline,
 * and auto-dismisses when the connection is restored.
 */
export default function OfflineBanner() {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [showRestored, setShowRestored] = useState(false);
    const restoreTimeoutRef = useRef<number | null>(null);

    useEffect(() => {
        const goOffline = () => setIsOnline(false);
        const goOnline = () => {
            setIsOnline(true);
            setShowRestored(true);
            if (restoreTimeoutRef.current !== null) {
                window.clearTimeout(restoreTimeoutRef.current);
            }
            // Hide the "back online" message after 3 seconds
            restoreTimeoutRef.current = window.setTimeout(() => setShowRestored(false), 3000);
        };

        window.addEventListener('offline', goOffline);
        window.addEventListener('online', goOnline);
        return () => {
            window.removeEventListener('offline', goOffline);
            window.removeEventListener('online', goOnline);
            if (restoreTimeoutRef.current !== null) {
                window.clearTimeout(restoreTimeoutRef.current);
            }
        };
    }, []);

    return (
        <AnimatePresence>
            {(!isOnline || showRestored) && (
                <motion.div
                    key={isOnline ? 'restored' : 'offline'}
                    initial={{ y: -60, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -60, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-3 py-3 px-6 text-sm font-medium shadow-lg"
                    style={{
                        background: isOnline
                            ? 'linear-gradient(90deg, #059669, #10b981)'
                            : 'linear-gradient(90deg, #991b1b, #dc2626)',
                    }}
                >
                    <i className={`text-base ${isOnline ? 'ri-wifi-line' : 'ri-wifi-off-line'}`} />
                    <span className="text-white">
                        {isOnline
                            ? '? Connection restored'
                            : 'No internet connection — some content may not load'}
                    </span>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
