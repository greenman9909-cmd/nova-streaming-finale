import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Login from '../pages/Login';
import Signup from '../pages/Signup';
import NotFound from '../pages/NotFound';
import { SettingsProvider } from '../context/SettingsContext';

vi.mock('../lib/supabase', () => {
    const subscription = { unsubscribe: vi.fn() };
    const queryBuilder = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
        upsert: vi.fn().mockResolvedValue({ error: null }),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
    };

    return {
        supabase: {
            auth: {
                getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
                onAuthStateChange: vi.fn(() => ({ data: { subscription } })),
                signInWithPassword: vi.fn(),
                resetPasswordForEmail: vi.fn(),
                signUp: vi.fn(),
            },
            from: vi.fn(() => queryBuilder),
        },
    };
});

describe('Auth and 404 i18n smoke', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('renders Login and Signup in Spanish by default', () => {
        render(
            <SettingsProvider>
                <MemoryRouter>
                    <Login />
                    <Signup />
                </MemoryRouter>
            </SettingsProvider>
        );

        expect(screen.getByText('Bienvenido de nuevo')).toBeInTheDocument();
        expect(screen.getAllByText('Crear cuenta').length).toBeGreaterThan(0);
    });

    it('keeps NotFound manual without auto redirect hint', () => {
        render(
            <SettingsProvider>
                <MemoryRouter>
                    <NotFound />
                </MemoryRouter>
            </SettingsProvider>
        );

        expect(screen.getByText('Esta pagina se perdio en el cosmos')).toBeInTheDocument();
        expect(screen.queryByText(/Redirecting to home/i)).not.toBeInTheDocument();
    });
});
