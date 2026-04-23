import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { translations, Language } from '../utils/translations';

interface Settings {
    autoplay: boolean;
    contentFilter: boolean;
    language: Language;
    defaultQuality: string;
    subtitleSize: 'small' | 'medium' | 'large';
    subtitleColor: string;
    accentColor: 'violet' | 'blue' | 'cyan' | 'green' | 'rose' | 'amber';
    dataSaver: boolean;
    reduceMotion: boolean;
    autoSkipIntro: boolean;
    autoSkipCredits: boolean;
    preferredAudioType: 'sub' | 'dub';
    preferredAudioLanguage: 'original' | 'english';
    notifyEmail: boolean;
    notifyPush: boolean;
    notifyNewEpisodes: boolean;
    notifyRecommendations: boolean;
    notifyProductUpdates: boolean;
    subtitleBackground: boolean;
    streamOverWifiOnly: boolean;
    autoplayTrailers: boolean;
    playbackSpeed: '0.75x' | '1x' | '1.25x' | '1.5x' | '2x';
    marketingEmails: boolean;
}

interface SettingsContextType {
    settings: Settings;
    updateSettings: (newSettings: Partial<Settings>) => void;
    resetSettings: () => void;
    t: (path: string) => string;
}

const defaultSettings: Settings = {
    autoplay: true,
    contentFilter: false,
    language: 'es',
    defaultQuality: '1080p',
    subtitleSize: 'medium',
    subtitleColor: 'white',
    accentColor: 'violet',
    dataSaver: false,
    reduceMotion: false,
    autoSkipIntro: false,
    autoSkipCredits: false,
    preferredAudioType: 'sub',
    preferredAudioLanguage: 'original',
    notifyEmail: true,
    notifyPush: true,
    notifyNewEpisodes: true,
    notifyRecommendations: true,
    notifyProductUpdates: true,
    subtitleBackground: true,
    streamOverWifiOnly: false,
    autoplayTrailers: true,
    playbackSpeed: '1x',
    marketingEmails: false,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const resolveTranslation = (language: Language, path: string): string | null => {
    const keys = path.split('.');
    let value: unknown = translations[language];

    for (const key of keys) {
        if (!value || typeof value !== 'object' || !(key in value)) {
            return null;
        }
        value = (value as Record<string, unknown>)[key];
    }

    return typeof value === 'string' ? value : null;
};

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = useState<Settings>(() => {
        try {
            const saved = localStorage.getItem('nova_settings');
            if (!saved) return defaultSettings;

            const parsed = JSON.parse(saved) as Partial<Settings>;
            const language = (parsed.language || defaultSettings.language) as Language;

            return {
                ...defaultSettings,
                ...parsed,
                language,
            };
        } catch {
            localStorage.removeItem('nova_settings');
            return defaultSettings;
        }
    });

    const [userId, setUserId] = useState<string | null>(null);
    const supabaseWriteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const t = (path: string): string => {
        const active = resolveTranslation(settings.language, path);
        if (active) return active;

        const fallback = resolveTranslation('en', path);
        return fallback || path;
    };

    useEffect(() => {
        let active = true;
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!active) return;
            setUserId(session?.user?.id || null);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUserId(session?.user?.id || null);
        });

        return () => {
            active = false;
            subscription.unsubscribe();
        };
    }, []);

    useEffect(() => {
        if (!userId) return;

        const loadSettings = async () => {
            const { data, error } = await supabase
                .from('user_settings')
                .select('settings')
                .eq('user_id', userId)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('Failed to load settings:', error);
                return;
            }

            if (data?.settings) {
                setSettings((prev) => ({ ...prev, ...data.settings }));
            }
        };

        void loadSettings();
    }, [userId]);

    useEffect(() => {
        localStorage.setItem('nova_settings', JSON.stringify(settings));
        applyTheme(settings.accentColor);
        applyMotionPreference(settings.reduceMotion);

        if (!userId) return;

        if (supabaseWriteTimer.current) {
            clearTimeout(supabaseWriteTimer.current);
        }

        supabaseWriteTimer.current = setTimeout(() => {
            supabase
                .from('user_settings')
                .upsert({ user_id: userId, settings, updated_at: new Date().toISOString() })
                .then(({ error }) => {
                    if (error) console.error('Failed to save settings:', error);
                });
        }, 1500);
    }, [settings, userId]);

    const updateSettings = (updates: Partial<Settings>) => {
        setSettings((prev) => ({ ...prev, ...updates }));
    };

    const resetSettings = () => {
        setSettings(defaultSettings);
    };

    const applyTheme = (color: string) => {
        const root = document.documentElement;

        const themes: Record<string, { accent: string; bright: string; glow: string }> = {
            violet: {
                accent: '#8b5cf6',
                bright: '#a78bfa',
                glow: '0 0 60px rgba(139, 92, 246, 0.4), 0 0 120px rgba(139, 92, 246, 0.2)',
            },
            blue: {
                accent: '#3b82f6',
                bright: '#60a5fa',
                glow: '0 0 60px rgba(59, 130, 246, 0.4), 0 0 120px rgba(59, 130, 246, 0.2)',
            },
            cyan: {
                accent: '#22d3ee',
                bright: '#67e8f9',
                glow: '0 0 60px rgba(34, 211, 238, 0.4), 0 0 120px rgba(34, 211, 238, 0.2)',
            },
            green: {
                accent: '#10b981',
                bright: '#34d399',
                glow: '0 0 60px rgba(16, 185, 129, 0.4), 0 0 120px rgba(16, 185, 129, 0.2)',
            },
            rose: {
                accent: '#f43f5e',
                bright: '#fb7185',
                glow: '0 0 60px rgba(244, 63, 94, 0.4), 0 0 120px rgba(244, 63, 94, 0.2)',
            },
            amber: {
                accent: '#f59e0b',
                bright: '#fbbf24',
                glow: '0 0 60px rgba(245, 158, 11, 0.4), 0 0 120px rgba(245, 158, 11, 0.2)',
            },
        };

        const theme = themes[color] || themes.violet;
        root.style.setProperty('--nova-accent', theme.accent);
        root.style.setProperty('--nova-accent-bright', theme.bright);
        root.style.setProperty('--glow-violet', theme.glow);
    };

    const applyMotionPreference = (reduce: boolean) => {
        const root = document.documentElement;
        if (reduce) {
            root.classList.add('reduce-motion');
        } else {
            root.classList.remove('reduce-motion');
        }
    };

    return (
        <SettingsContext.Provider value={{ settings, updateSettings, resetSettings, t }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
}
