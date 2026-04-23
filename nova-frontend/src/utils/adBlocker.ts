/**
 * Nova Ad Blocker
 * - Intercepts window.open (kills popup ads)
 * - Blocks known ad/tracker domains via MutationObserver
 * - Prevents iframe-initiated top-level navigation
 * - Traps beforeunload hijack attempts
 */

const AD_DOMAINS: string[] = [
    'doubleclick.net',
    'googlesyndication.com',
    'googleadservices.com',
    'adnxs.com',
    'adroll.com',
    'amazon-adsystem.com',
    'ads.yahoo.com',
    'outbrain.com',
    'taboola.com',
    'revcontent.com',
    'mgid.com',
    'popads.net',
    'popcash.net',
    'propellerads.com',
    'adsterra.com',
    'hilltopads.net',
    'juicyads.com',
    'trafficjunky.net',
    'exoclick.com',
    'plugrush.com',
    'clickadu.com',
    'bidvertiser.com',
    'mediavine.com',
    'adskeeper.com',
    'installads.com',
    'monetag.com',
    'yllix.com',
    'richpush.co',
    'pushground.com',
    'setupads.com',
    'ero-advertising.com',
    'tsyndicate.com',
    'trafficshop.com',
    'adfox.ru',
    'yandex.ru/ads',
    'clkmon.com',
    'trk.prd',
    'push.io',
    'push-ad.co',
    'track.',
    'click.',
    'ad.fly',
    'adf.ly',
    'mmo.im',
    'exe.io',
    'bc.vc',
    'x.co',
    'clck.ru',
    'shortener.',
    'go2ads',
    'north-extn.com',
];

const isBlankOrUnsafeUrl = (url: string): boolean => {
    const normalized = url.trim().toLowerCase();
    return (
        normalized.length === 0 ||
        normalized === 'about:blank' ||
        normalized.startsWith('javascript:') ||
        normalized.startsWith('data:')
    );
};

const isAdUrl = (url: string): boolean => {
    try {
        const lower = url.toLowerCase();
        return AD_DOMAINS.some(domain => lower.includes(domain));
    } catch {
        return false;
    }
};

const NAV_ALLOW_TTL_MS = 1500;
let _allowNavigationUntil = 0;

const markNavigationAllowed = () => {
    _allowNavigationUntil = Date.now() + NAV_ALLOW_TTL_MS;
};

// 1. Override window.open - kills all popup ads
const patchWindowOpen = () => {
    const originalOpen = window.open.bind(window);
    window.open = function (url?: string | URL) {
        const urlStr = url?.toString() ?? '';
        console.info('[NovaBlock] Blocked popup:', urlStr);
        return null;
    };

    return () => {
        window.open = originalOpen;
    };
};

// 2. MutationObserver - removes ad scripts/iframes as they're injected
const patchMutationObserver = () => {
    const removeAdNode = (node: Node) => {
        if (!(node instanceof HTMLElement)) return;

        const src = (node as any).src || (node as any).href || '';
        const srcStr = typeof src === 'string' ? src : '';

        if (isAdUrl(srcStr)) {
            node.remove();
            console.info('[NovaBlock] Removed ad node:', node.tagName, srcStr);
            return;
        }

        if (node instanceof HTMLScriptElement) {
            const content = node.textContent || '';
            if (
                content.includes('window.open') ||
                content.includes('popundr') ||
                content.includes('popads') ||
                content.includes('adsterra') ||
                content.includes('onclick="window') ||
                content.includes('document.location')
            ) {
                node.remove();
                console.info('[NovaBlock] Removed ad script injection');
            }
        }
    };

    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            for (const node of Array.from(mutation.addedNodes)) {
                removeAdNode(node);
            }
        }
    });

    observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
    });

    return () => observer.disconnect();
};

// 3. Block beforeunload hijacks
const patchBeforeunload = () => {
    const handler = (e: BeforeUnloadEvent) => {
        if (Date.now() <= _allowNavigationUntil) return;
        e.preventDefault();
        e.returnValue = '';
        e.stopImmediatePropagation();
    };

    window.addEventListener('beforeunload', handler, true);

    return () => {
        window.removeEventListener('beforeunload', handler, true);
    };
};

// 4. Block location hijacks from iframes
const patchLocationHijack = () => {
    const handler = (e: MessageEvent) => {
        if (!e.data) return;
        const data = typeof e.data === 'string' ? e.data : JSON.stringify(e.data);
        if (
            data.includes('window.location') ||
            data.includes('top.location') ||
            isAdUrl(data)
        ) {
            e.stopImmediatePropagation();
            console.info('[NovaBlock] Blocked iframe message redirect');
        }
    };

    window.addEventListener('message', handler, true);

    return () => {
        window.removeEventListener('message', handler, true);
    };
};

// 5. Block ad/tracker link clicks and forced new tabs
const patchClickGuard = () => {
    const handler = (e: MouseEvent) => {
        if (e.defaultPrevented) return;
        const target = e.target as Element | null;
        const anchor = target?.closest('a');
        if (!anchor) return;

        const href = anchor.getAttribute('href') ?? '';
        if (!href) return;

        if (isBlankOrUnsafeUrl(href) || isAdUrl(href)) {
            e.preventDefault();
            e.stopImmediatePropagation();
            console.info('[NovaBlock] Blocked navigation click:', href);
            return;
        }

        if (anchor.target && anchor.target !== '_self') {
            anchor.target = '_self';
        }

        markNavigationAllowed();
    };

    document.addEventListener('click', handler, true);
    document.addEventListener('auxclick', handler, true);

    return () => {
        document.removeEventListener('click', handler, true);
        document.removeEventListener('auxclick', handler, true);
    };
};

// 6. Guard programmatic redirects
const patchNavigationGuards = () => {
    const cleanupFns: Array<() => void> = [];

    // Modern browsers protect window.location. We try to patch but don't crash if it's read-only.
    const tryPatch = (prop: 'assign' | 'replace') => {
        try {
            const original = (window.location as any)[prop].bind(window.location);
            const descriptor = Object.getOwnPropertyDescriptor(window.location, prop);

            if (descriptor && !descriptor.configurable) {
                // console.info(`[NovaBlock] skipping ${prop} as it is non-configurable`);
                return;
            }

            (window.location as any)[prop] = (url: string | URL) => {
                const urlStr = url?.toString() ?? '';
                if (isBlankOrUnsafeUrl(urlStr) || isAdUrl(urlStr)) {
                    console.info('[NovaBlock] Blocked redirect:', urlStr);
                    return;
                }
                original(urlStr);
            };

            cleanupFns.push(() => {
                try { (window.location as any)[prop] = original; } catch { }
            });
        } catch (err) {
            // Silently fail for protected location properties
        }
    };

    tryPatch('assign');
    tryPatch('replace');

    return () => {
        cleanupFns.forEach((cleanup) => cleanup());
    };
};

// 7. Block suspicious form submissions
const patchFormGuard = () => {
    const handler = (e: Event) => {
        const form = e.target as HTMLFormElement | null;
        if (!form || form.tagName !== 'FORM') return;

        const action = form.getAttribute('action') ?? '';

        // Allow forms with no action (React onSubmit forms) — they don't navigate
        if (!action || action.trim().length === 0) {
            markNavigationAllowed();
            return;
        }

        if (isBlankOrUnsafeUrl(action) || isAdUrl(action)) {
            e.preventDefault();
            e.stopImmediatePropagation();
            console.info('[NovaBlock] Blocked form submit:', action);
            return;
        }

        if (form.target && form.target !== '_self') {
            form.target = '_self';
        }

        markNavigationAllowed();
    };

    document.addEventListener('submit', handler, true);

    return () => {
        document.removeEventListener('submit', handler, true);
    };
};

let _installed = false;

export const installAdBlocker = (): (() => void) => {
    if (_installed) return () => { };
    _installed = true;

    const cleanupFns: Array<() => void> = [];

    cleanupFns.push(patchWindowOpen());
    cleanupFns.push(patchMutationObserver());
    cleanupFns.push(patchBeforeunload());
    cleanupFns.push(patchLocationHijack());
    cleanupFns.push(patchClickGuard());
    cleanupFns.push(patchNavigationGuards());
    cleanupFns.push(patchFormGuard());

    console.info('[NovaBlock] Ad blocker active');

    return () => {
        _installed = false;
        cleanupFns.forEach((cleanup) => cleanup());
    };
};
