import { Hono } from 'hono';
import quoteApp from './quote.js';
import { healthHandler } from './health.js';
import { metricsHandler, metricsMiddleware } from './metrics.js';

// The metrics middleware has to be registered before any route, otherwise
// Hono never runs it for them. The quote app is mounted rather than imported
// route by route so routes added to it later stay wrapped.

const app = new Hono();

app.use('*', metricsMiddleware);

app.get('/health', healthHandler);
app.get('/metrics', metricsHandler);

app.route('/', quoteApp);

export default app;
