import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { animeRouter } from './routes/anime';
import { authRouter } from './routes/auth';
import { sportsRouter } from './routes/sports';

const app = new Hono();

// Enable CORS for frontend
app.use('/*', cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
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

// Mount anime routes
app.route('/api', animeRouter);
// Mount auth routes
app.route('/api/auth', authRouter);
// Mount sports routes
app.route('/api/sports', sportsRouter);

// Start server
const port = 3030;
console.log(`🚀 NOVA Backend running on http://localhost:${port}`);

export { app };

export default {
  port,
  fetch: app.fetch,
};
