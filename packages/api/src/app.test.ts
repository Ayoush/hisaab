import { describe, it, expect, beforeEach } from 'vitest';
import app from './app.js';
import { resetMetrics } from './metrics.js';

const validQuoteBody = {
  sellerStateCode: '27',
  buyerStateCode: '27',
  ratePercent: 18,
  taxableAmountPaise: 10000,
};

describe('GET /health', () => {
  beforeEach(() => {
    resetMetrics();
  });

  it('returns ok', async () => {
    const res = await app.request('/health');
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body['status']).toBe('ok');
  });

  it('reports uptime in whole seconds', async () => {
    const res = await app.request('/health');
    const body = (await res.json()) as Record<string, unknown>;
    const uptime = body['uptime'];
    expect(typeof uptime).toBe('number');
    expect(Number.isInteger(uptime)).toBe(true);
    expect(uptime as number).toBeGreaterThanOrEqual(0);
  });

  it('returns exactly status and uptime', async () => {
    const res = await app.request('/health');
    const body = (await res.json()) as Record<string, unknown>;
    expect(Object.keys(body).sort()).toEqual(['status', 'uptime']);
  });
});

describe('GET /metrics', () => {
  beforeEach(() => {
    resetMetrics();
  });

  it('returns the request counts and average latency', async () => {
    const res = await app.request('/metrics');
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(Object.keys(body).sort()).toEqual(['avgLatencyMs', 'requests']);
    const requests = body['requests'] as Record<string, unknown>;
    expect(Object.keys(requests).sort()).toEqual(['error', 'success', 'total']);
  });

  it('counts a successful request', async () => {
    await app.request('/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validQuoteBody),
    });
    const res = await app.request('/metrics');
    const body = (await res.json()) as {
      requests: { total: number; success: number; error: number };
    };
    expect(body.requests.total).toBe(1);
    expect(body.requests.success).toBe(1);
    expect(body.requests.error).toBe(0);
  });

  it('counts a failed request', async () => {
    await app.request('/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sellerStateCode: '27' }),
    });
    const res = await app.request('/metrics');
    const body = (await res.json()) as {
      requests: { total: number; success: number; error: number };
    };
    expect(body.requests.error).toBe(1);
    expect(body.requests.success).toBe(0);
  });

  it('counts every request and keeps success and error balanced', async () => {
    await app.request('/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validQuoteBody),
    });
    await app.request('/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sellerStateCode: '27' }),
    });
    const res = await app.request('/metrics');
    const body = (await res.json()) as {
      requests: { total: number; success: number; error: number };
    };
    expect(body.requests.total).toBe(2);
    expect(body.requests.success + body.requests.error).toBe(body.requests.total);
  });

  it('reports zero average latency when nothing has been requested', async () => {
    const res = await app.request('/metrics');
    const body = (await res.json()) as { avgLatencyMs: number };
    expect(body.avgLatencyMs).toBe(0);
  });

  it('reports a non-negative average latency', async () => {
    await app.request('/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validQuoteBody),
    });
    const res = await app.request('/metrics');
    const body = (await res.json()) as { avgLatencyMs: number };
    expect(body.avgLatencyMs).toBeGreaterThanOrEqual(0);
  });

  it('does not count the in-flight metrics request itself', async () => {
    await app.request('/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validQuoteBody),
    });
    const res = await app.request('/metrics');
    const body = (await res.json()) as { requests: { total: number } };
    expect(body.requests.total).toBe(1);
  });

  it('resets with the in-memory store', async () => {
    await app.request('/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validQuoteBody),
    });
    resetMetrics();
    const res = await app.request('/metrics');
    const body = (await res.json()) as { requests: { total: number } };
    expect(body.requests.total).toBe(0);
  });

  it('counts a health request', async () => {
    await app.request('/health');
    const res = await app.request('/metrics');
    const body = (await res.json()) as { requests: { total: number } };
    expect(body.requests.total).toBe(1);
  });

  it('counts an unknown path as an error', async () => {
    const res = await app.request('/does-not-exist');
    expect(res.status).toBe(404);
    const metrics = await app.request('/metrics');
    const body = (await metrics.json()) as { requests: { total: number; error: number } };
    expect(body.requests.total).toBe(1);
    expect(body.requests.error).toBe(1);
  });
});
