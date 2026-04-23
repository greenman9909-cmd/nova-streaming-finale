import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const APP_ID = 'jz8mkb0y';
const ENABLE_INTERCOM = import.meta.env.VITE_ENABLE_INTERCOM !== 'false';

let intercomLoader: Promise<{ default: any }> | null = null;
const loadIntercom = async () => {
    if (!intercomLoader) {
        intercomLoader = import('@intercom/messenger-js-sdk');
    }
    const mod = await intercomLoader;
    return mod.default;
};

// Pages where the messenger bubble should be hidden (video players)
const HIDE_ON_ROUTES = ['/anime/watch/', '/watch/', '/deportes/watch/'];

function shouldHide(pathname: string) {
    return HIDE_ON_ROUTES.some((r) => pathname.includes(r));
}

// Safe caller for multi-arg Intercom commands (update, trackEvent, shutdown)
// The SDK's TS types only allow the boot signature; we use window.Intercom for commands.
function callIntercom(command: string, ...args: unknown[]) {
    try {
        const w = window as any;
        if (typeof w.Intercom === 'function') {
            w.Intercom(command, ...args);
        }
    } catch {
        // Intercom not yet loaded – fail silently
    }
}

async function detectAdBlock(): Promise<boolean> {
    if (typeof document === 'undefined') return false;

    return new Promise((resolve) => {
        const bait = document.createElement('div');
        bait.className = 'adsbox ad-banner adsbygoogle ad-unit';
        bait.style.position = 'absolute';
        bait.style.left = '-999px';
        bait.style.width = '1px';
        bait.style.height = '1px';

        const body = document.body;
        if (!body) {
            resolve(false);
            return;
        }

        body.appendChild(bait);
        requestAnimationFrame(() => {
            const style = window.getComputedStyle(bait);
            const blocked = style.display === 'none' || style.visibility === 'hidden' || bait.offsetHeight === 0;
            bait.remove();
            resolve(blocked);
        });
    });
}

export default function IntercomProvider() {
    const { user, activeProfile } = useAuth();
    const location = useLocation();
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    const horizontalPadding = isMobile ? 16 : 80;
    const verticalPadding = isMobile ? 96 : 24;
    const adBlockDetectedRef = useRef<boolean | null>(null);
    const bootedRef = useRef(false);

    // Boot / re-boot when auth state changes
    useEffect(() => {
        let cancelled = false;

        const boot = async () => {
            if (!ENABLE_INTERCOM) return;
            if (adBlockDetectedRef.current === null) {
                adBlockDetectedRef.current = await detectAdBlock();
            }
            if (cancelled || adBlockDetectedRef.current) return;

            let Intercom: ((options: Record<string, any>) => void) | null = null;
            try {
                Intercom = await loadIntercom();
            } catch {
                return;
            }
            if (cancelled || !Intercom) return;

            if (user) {
                const createdAtUnix = user.created_at
                    ? Math.floor(new Date(user.created_at).getTime() / 1000)
                    : undefined;

                Intercom({
                    app_id: APP_ID,
                    user_id: user.id,
                    name: user.user_metadata?.username || user.email || 'Nova User',
                    email: user.email ?? undefined,
                    created_at: createdAtUnix,
                    // Custom attributes visible in the Intercom inbox
                    active_profile: activeProfile?.name ?? 'None',
                    is_kid_profile: activeProfile?.isKid ?? false,
                    // Shift left so it doesn't overlap the AI chatbot bubble
                    horizontal_padding: horizontalPadding,
                    vertical_padding: verticalPadding,
                } as any);
            } else {
                Intercom({
                    app_id: APP_ID,
                    horizontal_padding: horizontalPadding,
                    vertical_padding: verticalPadding,
                } as any);
            }

            bootedRef.current = true;
        };

        void boot();

        return () => {
            cancelled = true;
            if (bootedRef.current) {
                callIntercom('shutdown');
            }
        };
    }, [activeProfile, horizontalPadding, user, verticalPadding]);

    // Update Intercom on every route change (page tracking + hide/show)
    useEffect(() => {
        if (!ENABLE_INTERCOM || adBlockDetectedRef.current || !bootedRef.current) return;
        const hidden = shouldHide(location.pathname);

        if (hidden) {
            // Hide the launcher on video/watch pages so it doesn't block the player
            callIntercom('update', { hide_default_launcher: true });
        } else {
            callIntercom('update', {
                hide_default_launcher: false,
                // Pass current page URL so Fin AI has context
                last_page_seen: window.location.href,
            });
        }
    }, [location.pathname]);

    return null;
}

// ─── Utility: fire a custom Intercom event from anywhere in the app ──────────
// Usage: trackIntercomEvent('started_watching', { title: 'Attack on Titan' })
export function trackIntercomEvent(eventName: string, metadata?: Record<string, any>) {
    callIntercom('trackEvent', eventName, metadata);
}
