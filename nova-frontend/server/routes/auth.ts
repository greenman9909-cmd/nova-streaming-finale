
import { Hono } from 'hono';

const authRouter = new Hono();
const isProd = process.env.NODE_ENV === 'production';

authRouter.post('/verify-captcha', async (c) => {
    const { token } = await c.req.json();
    const secret = process.env.TURNSTILE_SECRET_KEY;

    if (!secret) {
        // No key configured — skip verification (dev without .env setup)
        return c.json({ success: true });
    }

    const form = new FormData();
    form.append('secret', secret);
    form.append('response', token);

    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        body: form,
    });

    const data = await res.json() as { success: boolean };
    if (!data.success) {
        return c.json({ success: false, message: 'Security check failed. Please try again.' }, 403);
    }

    return c.json({ success: true });
});

authRouter.use('/*', async (c, next) => {
    if (isProd) {
        return c.json({ success: false, message: 'Auth is disabled in production.' }, 501);
    }
    await next();
});

// Mock user store
const users = [
    { username: 'user', password: 'password', email: 'user@nova.com' }
];

authRouter.post('/login', async (c) => {
    try {
        const { username, password } = await c.req.json();
        const user = users.find(u => u.username === username && u.password === password);

        if (user) {
            return c.json({
                success: true,
                token: 'mock-jwt-token-123456',
                user: { username: user.username, email: user.email }
            });
        }
        return c.json({ success: false, message: 'Invalid credentials' }, 401);
    } catch (e) {
        return c.json({ success: false, message: 'Login failed' }, 500);
    }
});

authRouter.post('/register', async (c) => {
    try {
        const { username, password, email } = await c.req.json();

        if (users.find(u => u.username === username)) {
            return c.json({ success: false, message: 'User already exists' }, 400);
        }

        users.push({ username, password, email });
        return c.json({
            success: true,
            token: 'mock-jwt-token-' + Date.now(),
            user: { username, email }
        });
    } catch (e) {
        return c.json({ success: false, message: 'Registration failed' }, 500);
    }
});

export { authRouter };
