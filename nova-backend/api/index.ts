import { handle } from 'hono/vercel';
import { app } from '../src/index';

// Node.js runtime required — stripe and @consumet/extensions don't support Edge
export const config = { runtime: 'nodejs20.x' };

export default handle(app);
