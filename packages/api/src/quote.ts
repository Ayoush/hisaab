import { Hono } from 'hono';
import { quote, paise } from '@hisaab/core';

const app = new Hono();

app.post('/quote', async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ code: 'INVALID_JSON', message: 'Request body must be valid JSON' }, 400);
  }

  const input = body as Record<string, unknown>;

  // Accept both '18' (string) and 18 (number) for ratePercent
  let rate = input['ratePercent'];
  if (typeof rate === 'string') {
    rate = parseFloat(rate);
    if (isNaN(rate as number)) {
      return c.json({ code: 'INVALID_RATE', message: 'ratePercent must be a number' }, 400);
    }
  }

  const sellerState = input['sellerStateCode'] as string | undefined;
  const buyerState = input['buyerStateCode'] as string | undefined;

  if (!sellerState || !buyerState) {
    return c.json(
      { code: 'MISSING_FIELD', message: 'sellerStateCode and buyerStateCode are required' },
      400,
    );
  }

  const taxableAmount = input['taxableAmountPaise'];
  if (typeof taxableAmount !== 'number') {
    return c.json(
      { code: 'MISSING_FIELD', message: 'taxableAmountPaise is required and must be an integer' },
      400,
    );
  }

  const result = quote({
    sellerStateCode: sellerState,
    buyerStateCode: buyerState,
    hsn: (input['hsn'] as string) || '8471',
    ratePercent: rate as number,
    taxableAmountPaise: paise(taxableAmount),
    cessPercent: (input['cessPercent'] as number) ?? 0,
  });

  if (!result.ok) {
    return c.json({ code: result.error.code, message: result.error.message }, 400);
  }

  return c.json(result.result);
});

export default app;
