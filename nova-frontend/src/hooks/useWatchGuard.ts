import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function useWatchGuard() {
    const { user, planTier, freeMinutesRemaining, recordWatchMinutes, loading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Redirect unauthenticated users to login
    useEffect(() => {
        if (loading) return;
        if (!user) {
            navigate(`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`);
        }
    }, [user, loading, navigate, location.pathname, location.search]);

    // Show upgrade modal if free user hit daily limit
    useEffect(() => {
        if (!loading && user && planTier === 'free' && freeMinutesRemaining <= 0) {
            setShowUpgradeModal(true);
        }
    }, [user, planTier, freeMinutesRemaining, loading]);

    // Record 1 minute every 60s for free users
    useEffect(() => {
        if (!user || planTier !== 'free') return;

        intervalRef.current = setInterval(() => {
            recordWatchMinutes(1);
        }, 60_000);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [user, planTier, recordWatchMinutes]);

    return { showUpgradeModal, setShowUpgradeModal };
}
