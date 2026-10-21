import type { Context, MiddlewareHandler } from 'hono';

// In-process request metrics, held in memory only.

export type RequestMetrics = {
  total: number;
  success: number;
  error: number;
};

export type MetricsSnapshot = {
  requests: RequestMetrics;
  avgLatencyMs: number;
};

const counts = {
  total: 0,
  success: 0,
  error: 0,
  totalLatencyMs: 0,
};

export function getMetrics(): MetricsSnapshot {
  const avgLatencyMs =
    counts.total === 0 ? 0 : Number((counts.totalLatencyMs / counts.total).toFixed(3));
  return {
    requests: {
      total: counts.total,
      success: counts.success,
      error: counts.error,
    },
    avgLatencyMs,
  };
}

/** Reset the counters, so tests can isolate one case from the next. */
export function resetMetrics(): void {
  counts.total = 0;
  counts.success = 0;
  counts.error = 0;
  counts.totalLatencyMs = 0;
}

/** A response is a failure at 400 and above, covering 4xx, 404s and 5xx. */
export const metricsMiddleware: MiddlewareHandler = async (c, next) => {
  const start = performance.now();
  await next();
  const latencyMs = performance.now() - start;
  const status = c.res?.status ?? 500;

  counts.total += 1;
  if (status >= 400) {
    counts.error += 1;
  } else {
    counts.success += 1;
  }
  counts.totalLatencyMs += latencyMs;
};

export function metricsHandler(c: Context): Response {
  return c.json(getMetrics());
}
