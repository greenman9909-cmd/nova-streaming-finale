import { useEffect, useRef } from 'react';

declare global {
    interface Window {
        turnstile: {
            render: (el: HTMLElement, opts: object) => string;
            reset: (id: string) => void;
            remove: (id: string) => void;
        };
    }
}

interface Props {
    onVerify: (token: string) => void;
    onExpire?: () => void;
}

export default function Turnstile({ onVerify, onExpire }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetId = useRef<string | null>(null);

    useEffect(() => {
        const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
        if (!siteKey || !containerRef.current) return;

        const render = () => {
            if (!containerRef.current || widgetId.current) return;
            widgetId.current = window.turnstile.render(containerRef.current, {
                sitekey: siteKey,
                callback: onVerify,
                'expired-callback': onExpire ?? (() => { widgetId.current = null; }),
                theme: 'dark',
                size: 'normal',
            });
        };

        if (window.turnstile) {
            render();
        } else {
            const id = setInterval(() => {
                if (window.turnstile) { render(); clearInterval(id); }
            }, 100);
            return () => clearInterval(id);
        }

        return () => {
            if (widgetId.current && window.turnstile) {
                window.turnstile.remove(widgetId.current);
                widgetId.current = null;
            }
        };
    }, []);

    if (!import.meta.env.VITE_TURNSTILE_SITE_KEY) return null;
    return <div ref={containerRef} className="flex justify-center" />;
}
