import { app } from './server/index';
import type { IncomingMessage, ServerResponse } from 'http';

export const config = { runtime: 'nodejs' };

const readBody = (req: IncomingMessage): Promise<Uint8Array | undefined> => {
  if (req.method === 'GET' || req.method === 'HEAD') return Promise.resolve(undefined);
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(new Uint8Array(Buffer.concat(chunks))));
    req.on('error', reject);
  });
};

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (Array.isArray(value)) headers.set(key, value.join(', '));
      else if (typeof value === 'string') headers.set(key, value);
    }

    const host = req.headers.host || 'localhost';
    const protocol = (req.headers['x-forwarded-proto'] as string) || 'https';
    const url = new URL(req.url || '/', `${protocol}://${host}`);

    const body = await readBody(req);

    const request = new Request(url.toString(), {
      method: req.method,
      headers,
      body,
    });

    const response = await app.fetch(request);

    res.statusCode = response.status;
    response.headers.forEach((value, key) => res.setHeader(key, value));

    if (response.body) {
      const reader = response.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
    }
    res.end();
  } catch (err: any) {
    console.error('Handler error:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: err.message || 'Internal error' }));
  }
}
