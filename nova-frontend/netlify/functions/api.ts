import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { animeRouter } from '../../server/routes/anime'
import { authRouter } from '../../server/routes/auth'
import { sportsRouter } from '../../server/routes/sports'
import { tmdbRouter } from '../../server/routes/tmdb'
import { moviesRouter } from '../../server/routes/movies'

// Create a fresh Hono app for the serverless function
const app = new Hono()

// Enable CORS for all origins in production
app.use('/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))

// Health check
app.get('/', (c) => c.json({ status: 'ok', message: 'NOVA Backend API', version: '1.0.0' }))
app.get('/api', (c) => c.json({ status: 'ok', message: 'NOVA Backend API', version: '1.0.0' }))

// Mount routes
app.route('/api/auth', authRouter)
app.route('/api/sports', sportsRouter)
app.route('/api/tmdb', tmdbRouter)
app.route('/api/movies', moviesRouter)
app.route('/api', animeRouter)

// Lambda handler — convert between Lambda event and Fetch API
export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  const url = new URL(event.rawUrl || `https://${event.headers.host || 'localhost'}${event.path}`)

  if (event.queryStringParameters) {
    for (const [key, value] of Object.entries(event.queryStringParameters)) {
      if (value != null) url.searchParams.set(key, String(value))
    }
  }

  const headers = new Headers()
  if (event.headers) {
    for (const [key, value] of Object.entries(event.headers)) {
      if (value) headers.set(key, value)
    }
  }

  const hasBody = event.body && event.httpMethod !== 'GET' && event.httpMethod !== 'HEAD'
  const request = new Request(url.toString(), {
    method: event.httpMethod || 'GET',
    headers,
    body: hasBody
      ? (event.isBase64Encoded ? Buffer.from(event.body!, 'base64') : event.body)
      : undefined,
  })

  try {
    const response = await app.fetch(request)
    const responseHeaders: Record<string, string> = {}
    response.headers.forEach((value, key) => { responseHeaders[key] = value })
    const body = await response.text()

    return {
      statusCode: response.status,
      headers: responseHeaders,
      body,
    }
  } catch (error) {
    console.error('Function error:', error)
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error', details: String(error) }),
    }
  }
}
