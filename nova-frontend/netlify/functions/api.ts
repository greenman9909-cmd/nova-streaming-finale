import type { Config } from '@netlify/functions'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { animeRouter } from '../../server/routes/anime'
import { authRouter } from '../../server/routes/auth'
import { sportsRouter } from '../../server/routes/sports'
import { tmdbRouter } from '../../server/routes/tmdb'
import { moviesRouter } from '../../server/routes/movies'

const app = new Hono()

app.use('/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))

app.get('/api', (c) => c.json({ status: 'ok', message: 'NOVA Backend API', version: '1.0.0' }))

app.route('/api/auth', authRouter)
app.route('/api/sports', sportsRouter)
app.route('/api/tmdb', tmdbRouter)
app.route('/api/movies', moviesRouter)
app.route('/api', animeRouter)

// Netlify Functions v2 — native Web API (Request → Response)
export default async (req: Request) => {
  return app.fetch(req)
}

export const config: Config = {
  path: '/api/*',
}
