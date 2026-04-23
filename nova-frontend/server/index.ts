// Triggers a restart
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { animeRouter } from './routes/anime';
import { authRouter } from './routes/auth';
import { sportsRouter } from './routes/sports';
import { tmdbRouter } from './routes/tmdb';
import { moviesRouter } from './routes/movies';
import { stripeRouter } from './routes/stripe';

const app = new Hono();

const corsOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const corsOriginConfig = corsOrigins.length > 0 ? corsOrigins : '*';

// Enable CORS for frontend
app.use('/*', cors({
  origin: corsOriginConfig,
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
}));

// Health check
app.get('/', (c) => {
  return c.json({
    status: 'ok',
    message: 'NOVA Backend API',
    version: '1.0.0'
  });
});

// Mount auth routes
app.route('/api/auth', authRouter);
// Mount sports routes
app.route('/api/sports', sportsRouter);
// Mount tmdb routes
app.route('/api/tmdb', tmdbRouter);
// Mount movies routes
app.route('/api/movies', moviesRouter);
// Mount anime routes
app.route('/api', animeRouter);
// Mount Stripe routes
app.route('/api/stripe', stripeRouter);

// Start server
const port = Number(process.env.PORT || 3000);
console.log(`NOVA Backend running on http://localhost:${port}`);

export { app };

export default {
  port,
  fetch: app.fetch,
};
