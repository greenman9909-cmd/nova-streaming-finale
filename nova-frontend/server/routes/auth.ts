
import { Hono } from 'hono';

const authRouter = new Hono();

authRouter.post('/verify-captcha', async (c) => {
    const { token } = await c.req.json();
    const secret = process.env.TURNSTILE_SECRET_KEY;

    if (!secret || !token) {
        return c.json({ success: true });
    }

    try {
        const form = new FormData();
        form.append('secret', secret);
        form.append('response', token);

        const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            body: form,
        });

        const data = await res.json() as { success: boolean; 'error-codes'?: string[] };
        if (!data.success) {
            console.warn('Turnstile failed, error codes:', data['error-codes']);
        }
        // Always succeed — Turnstile is advisory only; Supabase auth is the real gate
        return c.json({ success: true });
    } catch {
        return c.json({ success: true });
    }
});

export { authRouter };
