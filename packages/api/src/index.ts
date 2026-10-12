import { serve } from '@hono/node-server';
import app from './quote.js';

const port = parseInt(process.env.PORT ?? '3000', 10);
serve({ fetch: app.fetch, port });
console.log(`hisaab API listening on http://localhost:${port}`);
