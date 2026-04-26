import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';

export interface Profile {
    id: string;
    name: string;
    avatar: string;
    isKid: boolean;
}

export interface Subscription {
    planId: string;
    status: string;
    currentPeriodEnd: string | null;
}

export type PlanTier = 'none' | 'free' | 'basic' | 'standard' | 'nova-plus';

const FREE_DAILY_LIMIT_MINUTES = 180;

function getFreeWatchKey(): string {
    return `nova_free_watch_${new Date().toISOString().split('T')[0]}`;
}

function getFreeMinutesUsed(): number {
    return parseInt(localStorage.getItem(getFreeWatchKey()) || '0', 10);
}

interface AuthContextType {
    session: Session | null;
    user: User | null;
    activeProfile: Profile | null;
    profiles: Profile[];
    loading: boolean;
    signOut: () => Promise<void>;
    selectProfile: (profile: Profile) => void;
    addProfile: (name: string, isKid?: boolean, avatarUrl?: string) => Promise<boolean>;
    editProfile: (id: string, updates: Partial<Profile>) => Promise<boolean>;
    deleteProfile: (id: string) => Promise<boolean>;
    watchlist: WatchlistItem[];
    watchlistStatus: 'idle' | 'ready' | 'error';
    watchlistError: string | null;
    refreshWatchlist: () => Promise<void>;
    addToWatchlist: (item: WatchlistItem) => Promise<boolean>;
    removeFromWatchlist: (id: number | string) => Promise<boolean>;
    isInWatchlist: (id: number | string) => boolean;
    updateProfile: (updates: { username?: string; avatar_url?: string; email?: string; password?: string }) => Promise<{ success: boolean; error?: any }>;
    subscription: Subscription | null;
    isPremium: boolean;
    refreshSubscription: () => Promise<void>;
    planTier: PlanTier;
    canAccessComics: boolean;
    freeMinutesUsedToday: number;
    freeMinutesRemaining: number;
    recordWatchMinutes: (minutes: number) => void;
}

export interface WatchlistItem {
    id: number;
    title: string;
    category: string;
    image: string;
    type: 'movie' | 'tv';
    mediaId: string;
    addedAt: number;
}

const AuthContext = createContext<AuthContextType>({
    session: null,
    user: null,
    activeProfile: null,
    profiles: [],
    loading: true,
    signOut: async () => { },
    selectProfile: () => { },
    addProfile: async () => false,
    editProfile: async () => false,
    deleteProfile: async () => false,
    watchlist: [],
    watchlistStatus: 'idle',
    watchlistError: null,
    refreshWatchlist: async () => { },
    addToWatchlist: async () => false,
    removeFromWatchlist: async () => false,
    isInWatchlist: () => false,
    updateProfile: async () => ({ success: false }),
    subscription: null,
    isPremium: false,
    refreshSubscription: async () => { },
    planTier: 'none',
    canAccessComics: false,
    freeMinutesUsedToday: 0,
    freeMinutesRemaining: FREE_DAILY_LIMIT_MINUTES,
    recordWatchMinutes: () => { },
});

export const defaultAvatarFor = (name: string, isKid: boolean) => {
    if (isKid) {
        return 'https://occ-0-2794-2219.1.nflxso.net/dnm/api/v6/K6hjPJd6cR6FpVELC5Pd6ovHRSk/AAAABfNXUMVXGhnCZwPI1SghnGpmUgqS_J-owMff-jigqn8onGPon0nzRFy_rh8hPENL0L_7rC5t9lQ5h_y1.png?r=fcd';
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
};

const normalizeAvatarUrl = (avatarUrl: unknown, name: string, isKid: boolean) => {
    if (typeof avatarUrl !== 'string') return defaultAvatarFor(name, isKid);
    const trimmed = avatarUrl.trim();
    if (!trimmed || trimmed === 'null' || trimmed === 'undefined') {
        return defaultAvatarFor(name, isKid);
    }
    if (/^(https?:|data:|blob:|\/)/i.test(trimmed)) {
        return trimmed;
    }
    return defaultAvatarFor(name, isKid);
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [activeProfile, setActiveProfile] = useState<Profile | null>(() => {
        const saved = localStorage.getItem('activeProfile');
        return saved ? JSON.parse(saved) : null;
    });
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
    const [watchlistStatus, setWatchlistStatus] = useState<'idle' | 'ready' | 'error'>('idle');
    const [watchlistError, setWatchlistError] = useState<string | null>(null);
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [loading, setLoading] = useState(true);

    const setActiveProfileSafe = (profile: Profile | null) => {
        setActiveProfile(profile);
        if (profile) {
            localStorage.setItem('activeProfile', JSON.stringify(profile));
        } else {
            localStorage.removeItem('activeProfile');
        }
    };

    const loadProfiles = async (userId: string, userMeta?: any) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('id,name,avatar_url,is_kid,created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('Failed to load profiles:', error);
            return;
        }

        if (!data || data.length === 0) {
            const name = userMeta?.username || 'Owner';
            const avatar = userMeta?.avatar_url || defaultAvatarFor(name, false);
            await supabase.from('profiles').insert({
                user_id: userId,
                name,
                avatar_url: avatar,
                is_kid: false
            });
            return loadProfiles(userId, userMeta);
        }

        const mapped = data.map((p: any) => ({
            id: p.id,
            name: p.name,
            avatar: normalizeAvatarUrl(p.avatar_url, p.name, p.is_kid),
            isKid: p.is_kid
        }));

        setProfiles(mapped);

        const saved = activeProfile;
        const stillExists = saved && mapped.some(p => p.id === saved.id);
        if (!stillExists) {
            setActiveProfileSafe(mapped[0] || null);
        }
    };

    const loadWatchlist = async (userId: string) => {
        setWatchlistStatus('idle');
        setWatchlistError(null);
        const { data, error } = await supabase
            .from('watchlist')
            .select('media_id,media_type,title,category,image,added_at')
            .eq('user_id', userId)
            .order('added_at', { ascending: false });

        if (error) {
            console.error('Failed to load watchlist:', error);
            setWatchlistStatus('error');
            setWatchlistError(error.message || 'No se pudo cargar tu lista.');
            return;
        }

        const mapped = (data || []).map((item: any) => {
            const numericId = Number(item.media_id);
            return {
                id: Number.isNaN(numericId) ? 0 : numericId,
                title: item.title,
                category: item.category || 'Media',
                image: item.image || '',
                type: item.media_type as 'movie' | 'tv',
                mediaId: item.media_id,
                addedAt: item.added_at ? new Date(item.added_at).getTime() : Date.now()
            } as WatchlistItem;
        });

        setWatchlist(mapped);
        setWatchlistStatus('ready');
    };

    const refreshWatchlist = async () => {
        if (!user) return;
        await loadWatchlist(user.id);
    };

    const loadSubscription = async (userId: string) => {
        const { data, error } = await supabase
            .from('subscriptions')
            .select('plan_id,status,current_period_end')
            .eq('user_id', userId)
            .in('status', ['active', 'trialing', 'deal', 'canceling'])
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) {
            console.error('Failed to load subscription:', error);
            setSubscription(null);
            return;
        }
        if (data) {
            setSubscription({ planId: data.plan_id, status: data.status, currentPeriodEnd: data.current_period_end });
        } else {
            setSubscription(null);
        }
    };

    const refreshSubscription = async () => {
        if (!user) return;
        await loadSubscription(user.id);
    };

    useEffect(() => {
        let isMounted = true;
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!isMounted) return;
            setSession(session);
            setUser(session?.user ?? null);

            if (session?.user) {
                Promise.all([
                    loadProfiles(session.user.id, session.user.user_metadata),
                    loadWatchlist(session.user.id),
                    loadSubscription(session.user.id),
                    identifyAgent(session.user.id, session.user.email, session.user.user_metadata?.username)
                ]).finally(() => setLoading(false));
            } else {
                setProfiles([]);
                setWatchlist([]);
                setSubscription(null);
                setWatchlistStatus('idle');
                setWatchlistError(null);
                setActiveProfileSafe(null);
                setLoading(false);
            }
        });

        const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);

            if (session?.user) {
                Promise.all([
                    loadProfiles(session.user.id, session.user.user_metadata),
                    loadWatchlist(session.user.id),
                    loadSubscription(session.user.id),
                    identifyAgent(session.user.id, session.user.email, session.user.user_metadata?.username)
                ]).finally(() => setLoading(false));
            } else {
                setProfiles([]);
                setWatchlist([]);
                setSubscription(null);
                setWatchlistStatus('idle');
                setWatchlistError(null);
                setActiveProfileSafe(null);
                setLoading(false);
            }
        });

        return () => {
            isMounted = false;
            authSub.unsubscribe();
        };
    }, []);

    const identifyAgent = async (userId: string, email?: string, name?: string) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/auth/identify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });
            const { userHash } = await response.json();

            if (userHash) {
                (window as any)._jfAgentIdentifiedUser = {
                    metadata: {
                        name: name || email || 'User',
                        email: email || '',
                    },
                    userID: userId,
                    userHash
                };
            }
        } catch (error) {
            console.error('Failed to identify Jotform agent:', error);
        }
    };

    const signOut = async () => {
        try {
            await supabase.auth.signOut();
            setSession(null);
            setUser(null);
            setActiveProfileSafe(null);
            setProfiles([]);
            setWatchlist([]);
            setWatchlistStatus('idle');
            setWatchlistError(null);
            
            // Reset Jotform Agent session
            if ((window as any).AgentClientSDK) {
                (window as any).AgentClientSDK.resetUser();
            }
            delete (window as any)._jfAgentIdentifiedUser;
            
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const selectProfile = (profile: Profile) => {
        setActiveProfileSafe(profile);
    };

    const addProfile = async (name: string, isKid: boolean = false, avatarUrl?: string) => {
        if (!user) return false;
        const avatar = normalizeAvatarUrl(avatarUrl, name, isKid);
        const { error } = await supabase.from('profiles').insert({
            user_id: user.id,
            name,
            avatar_url: avatar,
            is_kid: isKid
        });

        if (!error) {
            await loadProfiles(user.id, user.user_metadata);
            return true;
        }
        return false;
    };

    const editProfile = async (id: string, updates: Partial<Profile>) => {
        if (!user) return false;
        const payload: any = {};
        if (updates.name !== undefined) payload.name = updates.name;
        if (updates.avatar !== undefined) {
            const current = profiles.find(p => p.id === id);
            const safeName = updates.name ?? current?.name ?? 'Profile';
            const safeIsKid = updates.isKid ?? current?.isKid ?? false;
            payload.avatar_url = normalizeAvatarUrl(updates.avatar, safeName, safeIsKid);
        }
        if (updates.isKid !== undefined) payload.is_kid = updates.isKid;

        const { error } = await supabase.from('profiles')
            .update(payload)
            .eq('id', id)
            .eq('user_id', user.id);

        if (!error) {
            await loadProfiles(user.id, user.user_metadata);
            if (activeProfile?.id === id) {
                const updated = { ...activeProfile, ...updates } as Profile;
                setActiveProfileSafe(updated);
            }
            return true;
        }
        return false;
    };

    const deleteProfile = async (id: string) => {
        if (!user) return false;
        if (profiles.length <= 1) return false;

        const { error } = await supabase.from('profiles')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

        if (!error) {
            await loadProfiles(user.id, user.user_metadata);
            if (activeProfile?.id === id) {
                const fallback = profiles.filter(p => p.id !== id)[0] || null;
                setActiveProfileSafe(fallback);
            }
            return true;
        }
        return false;
    };

    const addToWatchlist = async (item: WatchlistItem) => {
        if (!user) return false;
        const mediaId = item.mediaId || String(item.id);
        if (isInWatchlist(mediaId)) return true;

        const { error } = await supabase.from('watchlist').insert({
            user_id: user.id,
            media_id: mediaId,
            media_type: item.type,
            title: item.title,
            category: item.category,
            image: item.image,
            added_at: new Date(item.addedAt || Date.now()).toISOString()
        });

        if (!error) {
            setWatchlist(prev => [
                { ...item, mediaId, addedAt: item.addedAt || Date.now() },
                ...prev
            ]);
            setWatchlistStatus('ready');
            return true;
        }
        console.error('Failed to add to watchlist:', error);
        setWatchlistStatus('error');
        setWatchlistError(error.message || 'No se pudo guardar en tu lista.');
        return false;
    };

    const removeFromWatchlist = async (id: number | string) => {
        if (!user) return false;
        const mediaId = typeof id === 'number' ? String(id) : id;

        const { error } = await supabase.from('watchlist')
            .delete()
            .eq('user_id', user.id)
            .eq('media_id', mediaId);

        if (!error) {
            setWatchlist(prev => prev.filter(w => w.mediaId !== mediaId));
            setWatchlistStatus('ready');
            return true;
        }
        console.error('Failed to remove from watchlist:', error);
        setWatchlistStatus('error');
        setWatchlistError(error.message || 'No se pudo quitar de tu lista.');
        return false;
    };

    const isInWatchlist = (id: number | string) => {
        const mediaId = typeof id === 'number' ? String(id) : id;
        return watchlist.some(w => w.mediaId === mediaId || String(w.id) === mediaId);
    };

    const updateProfile = async (updates: { username?: string; avatar_url?: string; email?: string; password?: string }) => {
        try {
            const payload: any = {};
            if (updates.email) payload.email = updates.email;
            if (updates.password) payload.password = updates.password;
            
            const dataObj: any = {};
            if (updates.username !== undefined) dataObj.username = updates.username;
            if (updates.avatar_url !== undefined) dataObj.avatar_url = updates.avatar_url;
            
            if (Object.keys(dataObj).length > 0) payload.data = dataObj;

            if (Object.keys(payload).length === 0) return { success: true };

            const { data, error } = await supabase.auth.updateUser(payload);

            if (error) throw error;

            if (data.user) {
                setUser(data.user);
                setSession(currentSession => currentSession ? { ...currentSession, user: data.user } : null);
                if (updates.username || updates.avatar_url) {
                    await loadProfiles(data.user.id, data.user.user_metadata);
                }
            }

            return { success: true };
        } catch (error) {
            console.error('Error updating profile:', error);
            return { success: false, error };
        }
    };

    const isPremium = subscription !== null && ['active', 'trialing', 'deal', 'canceling'].includes(subscription.status);

    const planTier: PlanTier = (() => {
        if (!user) return 'none';
        if (!isPremium || !subscription) return 'free';
        const p = subscription.planId;
        if (p === 'nova-plus') return 'nova-plus';
        if (p === 'standard') return 'standard';
        return 'basic';
    })();

    const canAccessComics = planTier === 'nova-plus';

    const freeMinutesUsedToday = planTier === 'free' ? getFreeMinutesUsed() : 0;
    const freeMinutesRemaining = Math.max(0, FREE_DAILY_LIMIT_MINUTES - freeMinutesUsedToday);

    const recordWatchMinutes = (minutes: number) => {
        const key = getFreeWatchKey();
        const current = parseInt(localStorage.getItem(key) || '0', 10);
        localStorage.setItem(key, String(current + minutes));
    };

    return (
        <AuthContext.Provider value={{
            session, user, activeProfile, profiles, loading, signOut, selectProfile,
            addProfile, editProfile, deleteProfile, updateProfile,
            watchlist, watchlistStatus, watchlistError, refreshWatchlist, addToWatchlist, removeFromWatchlist, isInWatchlist,
            subscription, isPremium, refreshSubscription,
            planTier, canAccessComics, freeMinutesUsedToday, freeMinutesRemaining, recordWatchMinutes,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
