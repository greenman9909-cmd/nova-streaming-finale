import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface Settings {
    // Web
    autoplay: boolean;
    contentFilter: boolean;
    language: string;

    // Playback
    defaultQuality: string;
    subtitleSize: 'small' | 'medium' | 'large';
    subtitleColor: string;

    // Appearance
    accentColor: 'violet' | 'blue' | 'cyan' | 'green' | 'rose' | 'amber';
}

import { translations, Language } from '../utils/translations';

interface SettingsContextType {
    settings: Settings;
    updateSettings: (newSettings: Partial<Settings>) => void;
    resetSettings: () => void;
    t: (path: string) => string;
}

const defaultSettings: Settings = {
    autoplay: true,
    contentFilter: false,
    language: 'en',
    defaultQuality: '1080p',
    subtitleSize: 'medium',
    subtitleColor: 'white',
    accentColor: 'violet'
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = useState<Settings>(() => {
        const saved = localStorage.getItem('nova_settings');
        return saved ? JSON.parse(saved) : defaultSettings;
    });
    const { user } = useAuth();
    const userId = user?.id || null;

    const t = (path: string): string => {
        const keys = path.split('.');
        let value: any = translations[settings.language as Language] || translations['en'];

        for (const key of keys) {
            if (value && value[key]) {
                value = value[key];
            } else {
                return path; // Fallback to key if not found
            }
        }
        return value as string;
    };

    useEffect(() => {
        if (!userId) return;
        const loadSettings = async () => {
            const { data, error } = await supabase
                .from('user_settings')
                .select('settings')
                .eq('user_id', userId)
                .single();

            if (error && error.code !== 'PGRST116') {
                // Ignore AbortError which happens on cancellation
                if (error.message?.includes('AbortError') || error.message?.includes('signal is aborted')) return;
                console.error('Failed to load settings:', error);
                return;
            }

            if (data?.settings) {
                setSettings(prev => ({ ...prev, ...data.settings }));
            }
        };
        loadSettings();
    }, [userId]);

    useEffect(() => {
        localStorage.setItem('nova_settings', JSON.stringify(settings));
        applyTheme(settings.accentColor);

        if (userId) {
            supabase
                .from('user_settings')
                .upsert({ user_id: userId, settings, updated_at: new Date().toISOString() })
                .then(({ error }) => {
                    if (error) {
                        if (error.message?.includes('AbortError') || error.message?.includes('signal is aborted')) return;
                        console.error('Failed to save settings:', error);
                    }
                });
        }
    }, [settings, userId]);

    const updateSettings = (updates: Partial<Settings>) => {
        setSettings(prev => ({ ...prev, ...updates }));
    };

    const resetSettings = () => {
        setSettings(defaultSettings);
    };

    const applyTheme = (color: string) => {
        const root = document.documentElement;

        const themes: Record<string, { accent: string; glow: string }> = {
            violet: {
                accent: '#8b5cf6',
                glow: '0 0 60px rgba(139, 92, 246, 0.4), 0 0 120px rgba(139, 92, 246, 0.2)'
            },
            blue: {
                accent: '#3b82f6',
                glow: '0 0 60px rgba(59, 130, 246, 0.4), 0 0 120px rgba(59, 130, 246, 0.2)'
            },
            cyan: {
                accent: '#22d3ee',
                glow: '0 0 60px rgba(34, 211, 238, 0.4), 0 0 120px rgba(34, 211, 238, 0.2)'
            },
            green: {
                accent: '#10b981',
                glow: '0 0 60px rgba(16, 185, 129, 0.4), 0 0 120px rgba(16, 185, 129, 0.2)'
            },
            rose: {
                accent: '#f43f5e',
                glow: '0 0 60px rgba(244, 63, 94, 0.4), 0 0 120px rgba(244, 63, 94, 0.2)'
            },
            amber: {
                accent: '#f59e0b',
                glow: '0 0 60px rgba(245, 158, 11, 0.4), 0 0 120px rgba(245, 158, 11, 0.2)'
            }
        };

        const theme = themes[color] || themes.violet;

        root.style.setProperty('--nova-accent', theme.accent);
        root.style.setProperty('--glow-violet', theme.glow);
        root.style.setProperty('--nova-accent-bright', theme.accent);
    };

    return (
        <SettingsContext.Provider value={{ settings, updateSettings, resetSettings, t }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
}