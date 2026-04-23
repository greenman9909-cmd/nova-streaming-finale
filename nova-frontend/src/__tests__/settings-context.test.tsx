import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SettingsProvider, useSettings } from '../context/SettingsContext';

vi.mock('../lib/supabase', () => {
    const subscription = { unsubscribe: vi.fn() };
    const queryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
        upsert: vi.fn().mockResolvedValue({ error: null }),
    };

    return {
        supabase: {
            auth: {
                getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
                onAuthStateChange: vi.fn(() => ({ data: { subscription } })),
            },
            from: vi.fn(() => queryBuilder),
        },
    };
});

function Probe() {
    const { t } = useSettings();
    return (
        <>
            <span data-testid="home">{t('nav.home')}</span>
            <span data-testid="fallback">{t('diagnostics.fallbackOnly')}</span>
        </>
    );
}

describe('SettingsContext i18n', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('uses Spanish as default language', () => {
        render(
            <SettingsProvider>
                <Probe />
            </SettingsProvider>
        );

        expect(screen.getByTestId('home')).toHaveTextContent('Inicio');
    });

    it('falls back to English for missing Spanish keys', () => {
        render(
            <SettingsProvider>
                <Probe />
            </SettingsProvider>
        );

        expect(screen.getByTestId('fallback')).toHaveTextContent('Fallback only');
    });
});
