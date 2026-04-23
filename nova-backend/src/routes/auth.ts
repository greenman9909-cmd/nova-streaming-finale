
import { Hono } from 'hono';
import { createHmac } from 'node:crypto';

const authRouter = new Hono();

// Identification route for Jotform Agent
authRouter.post('/identify', async (c) => {
    try {
        const { userId } = await c.req.json();
        const secret = process.env.JOTFORM_AGENT_SECRET;

        if (!secret) {
            return c.json({ error: 'JOTFORM_AGENT_SECRET is not configured' }, 500);
        }

        const userHash = createHmac('sha256', secret).update(userId).digest('hex');
        return c.json({ userHash });
    } catch (e) {
        return c.json({ error: 'Identification failed' }, 500);
    }
});
const isProd = process.env.NODE_ENV === 'production';

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
