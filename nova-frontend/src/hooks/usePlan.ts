import { useAuth, PlanTier } from '../context/AuthContext';

export function usePlan() {
    const { user, planTier, canAccessComics, freeMinutesUsedToday, freeMinutesRemaining, recordWatchMinutes } = useAuth();

    const isFree = planTier === 'free';
    const canWatch = !!user && (planTier !== 'none') && (!isFree || freeMinutesRemaining > 0);

    return {
        tier: planTier as PlanTier,
        canAccessComics,
        canWatch,
        minutesLeft: freeMinutesRemaining,
        freeMinutesUsedToday,
        freeMinutesRemaining,
        recordWatchMinutes,
        isNovaPlus: planTier === 'nova-plus',
        isStandard: planTier === 'standard',
        isBasic: planTier === 'basic',
        isFree,
        hasActivePlan: planTier !== 'none' && planTier !== 'free',
    };
}
