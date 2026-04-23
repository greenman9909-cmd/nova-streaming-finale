import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';

export interface Profile {
    id: string;
    name: string;
    avatar: string;
    isKid: boolean;
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
    addToWatchlist: (item: WatchlistItem) => Promise<boolean>;
    removeFromWatchlist: (id: number | string) => Promise<boolean>;
    isInWatchlist: (id: number | string) => boolean;
    updateProfile: (updates: { username?: string; avatar_url?: string; email?: string; password?: string }) => Promise<{ success: boolean; error?: any }>;
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
    addToWatchlist: async () => false,
    removeFromWatchlist: async () => false,
    isInWatchlist: () => false,
    updateProfile: async () => ({ success: false }),
});

const defaultAvatarFor = (name: string, isKid: boolean) => {
    if (isKid) {
        return 'https://occ-0-2794-2219.1.nflxso.net/dnm/api/v6/K6hjPJd6cR6FpVELC5Pd6ovHRSk/AAAABfNXUMVXGhnCZwPI1SghnGpmUgqS_J-owMff-jigqn8onGPon0nzRFy_rh8hPENL0L_7rC5t9lQ5h_y1.png?r=fcd';
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
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
            avatar: p.avatar_url,
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
        const { data, error } = await supabase
            .from('watchlist')
            .select('media_id,media_type,title,category,image,added_at')
            .eq('user_id', userId)
            .order('added_at', { ascending: false });

        if (error) {
            console.error('Failed to load watchlist:', error);
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
                    loadWatchlist(session.user.id)
                ]).finally(() => setLoading(false));
            } else {
                setProfiles([]);
                setWatchlist([]);
                setActiveProfileSafe(null);
                setLoading(false);
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);

            if (session?.user) {
                Promise.all([
                    loadProfiles(session.user.id, session.user.user_metadata),
                    loadWatchlist(session.user.id)
                ]).finally(() => setLoading(false));
            } else {
                setProfiles([]);
                setWatchlist([]);
                setActiveProfileSafe(null);
                setLoading(false);
            }
        });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const signOut = async () => {
        try {
            await supabase.auth.signOut();
            setSession(null);
            setUser(null);
            setActiveProfileSafe(null);
            setProfiles([]);
            setWatchlist([]);
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const selectProfile = (profile: Profile) => {
        setActiveProfileSafe(profile);
    };

    const addProfile = async (name: string, isKid: boolean = false, avatarUrl?: string) => {
        if (!user) return false;
        const avatar = avatarUrl || defaultAvatarFor(name, isKid);
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
        if (updates.avatar !== undefined) payload.avatar_url = updates.avatar;
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

        const { error } = await supabase.from('watchlist').upsert({
            user_id: user.id,
            media_id: mediaId,
            media_type: item.type,
            title: item.title,
            category: item.category,
            image: item.image,
            added_at: new Date(item.addedAt || Date.now()).toISOString()
        }, { onConflict: 'user_id,media_id' });

        if (!error) {
            setWatchlist(prev => [
                { ...item, mediaId, addedAt: item.addedAt || Date.now() },
                ...prev
            ]);
            return true;
        }
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
            return true;
        }
        return false;
    };

    const isInWatchlist = (id: number | string) => {
        const mediaId = typeof id === 'number' ? String(id) : id;
        return watchlist.some(w => w.mediaId === mediaId || String(w.id) === mediaId);
    };

    const updateProfile = async (updates: { username?: string; avatar_url?: string; email?: string; password?: string }) => {
        try {
            const { data, error } = await supabase.auth.updateUser({
                data: {
                    username: updates.username,
                    avatar_url: updates.avatar_url
                },
                email: updates.email,
                password: updates.password
            });

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

    return (
        <AuthContext.Provider value={{
            session, user, activeProfile, profiles, loading, signOut, selectProfile,
            addProfile, editProfile, deleteProfile, updateProfile,
            watchlist, addToWatchlist, removeFromWatchlist, isInWatchlist
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
