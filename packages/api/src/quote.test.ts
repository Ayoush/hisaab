import { describe, it, expect } from 'vitest';
import app from './quote.js';

describe('POST /quote', () => {
  it('returns 400 for unknown state code', async () => {
    const res = await app.request('/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sellerStateCode: 'ZZ',
        buyerStateCode: '27',
        ratePercent: 18,
        taxableAmountPaise: 10000,
      }),
    });
    expect(res.status).toBe(400);
    const body = await res.json() as Record<string, unknown>;
    expect(body['code']).toBeTruthy();
    expect(body['stack']).toBeUndefined();
  });

  it('returns correct split for intra-state 18%', async () => {
    const res = await app.request('/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sellerStateCode: '27',
        buyerStateCode: '27',
        ratePercent: 18,
        taxableAmountPaise: 10000,
      }),
    });
    expect(res.status).toBe(200);
    const body = await res.json() as Record<string, unknown>;
    expect(body['cgstPaise']).toBe(900);
    expect(body['sgstPaise']).toBe(900);
    expect(body['igstPaise']).toBe(0);
  });

  it('accepts ratePercent as a string', async () => {
    const res = await app.request('/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sellerStateCode: '27',
        buyerStateCode: '27',
        ratePercent: '18',
        taxableAmountPaise: 10000,
      }),
    });
    expect(res.status).toBe(200);
  });
});
