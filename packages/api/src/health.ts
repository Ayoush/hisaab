import type { Context } from 'hono';

export function healthHandler(c: Context): Response {
  return c.json({
    status: 'ok',
    uptime: Math.floor(process.uptime()),
  });
}
