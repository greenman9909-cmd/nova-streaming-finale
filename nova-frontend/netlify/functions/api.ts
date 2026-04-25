import type { Config } from '@netlify/functions'
import { app } from '../../server/index'

export default async (req: Request) => {
  return app.fetch(req)
}

export const config: Config = {
  path: ['/api', '/api/*'],
}
