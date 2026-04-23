import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { animeRouter } from './routes/anime';
import { sportsRouter } from './routes/sports';
import { tmdbRouter } from './routes/tmdb';
import { moviesRouter } from './routes/movies';
import { authRouter } from './routes/auth';
import { stripeRouter } from './routes/stripe';

const app = new Hono();

// Enable CORS — allow localhost in dev, any Vercel deploy + custom domain in prod
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
];

app.use('/*', cors({
  origin: (origin) => {
    if (!origin) return origin;
    if (ALLOWED_ORIGINS.includes(origin)) return origin;
    if (origin.endsWith('.vercel.app')) return origin;
    return null;
  },
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Health check
app.get('/', (c) => {
  return c.json({
    status: 'ok',
    message: 'NOVA Backend API',
    version: '1.0.0'
  });
});

// Mount anime routes
app.route('/api', animeRouter);
app.route('/api/sports', sportsRouter);
app.route('/api/tmdb', tmdbRouter);
app.route('/api/movies', moviesRouter);
app.route('/api/auth', authRouter);
app.route('/api/stripe', stripeRouter);

// Start server
const port = 3000;
console.log(`🚀 NOVA Backend running on http://localhost:${port}`);

export default {
  port,
  fetch: app.fetch,
};

export { app };
