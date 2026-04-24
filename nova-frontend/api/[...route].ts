import { handle } from 'hono/vercel';
import { app } from '../server/index';

// Node.js 20 required — @consumet/extensions and stripe don't run on Edge
export const config = { runtime: 'nodejs20.x' };

export default handle(app);
