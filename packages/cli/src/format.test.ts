import { describe, it, expect } from 'vitest';
import { toJsonPayload, toHumanLines } from './format.js';
import type { QuoteResult } from '@hisaab/core';

const sample: QuoteResult = {
  taxableAmountPaise: 10000 as QuoteResult['taxableAmountPaise'],
  cgstPaise: 0 as QuoteResult['cgstPaise'],
  sgstPaise: 0 as QuoteResult['sgstPaise'],
  igstPaise: 1800 as QuoteResult['igstPaise'],
  cessPaise: 0 as QuoteResult['cessPaise'],
  totalPaise: 11800 as QuoteResult['totalPaise'],
};

describe('toJsonPayload', () => {
  it('exposes exactly the six machine-readable keys', () => {
    expect(toJsonPayload(sample)).toEqual({
      taxable: 10000,
      cgst: 0,
      sgst: 0,
      igst: 1800,
      cess: 0,
      total: 11800,
    });
  });

  it('round-trips through JSON', () => {
    const parsed = JSON.parse(JSON.stringify(toJsonPayload(sample))) as Record<string, unknown>;
    for (const key of ['taxable', 'cgst', 'sgst', 'igst', 'cess', 'total']) {
      expect(parsed[key]).toBeDefined();
    }
    expect(parsed['igst']).toBe(1800);
    expect(parsed['total']).toBe(11800);
  });
});

describe('toHumanLines', () => {
  it('prints a labeled table, not JSON', () => {
    const out = toHumanLines('igst-18-standard', sample);
    expect(out).toContain('Scenario: igst-18-standard');
    expect(out).toContain('IGST:');
    expect(out).toContain('Total:');
    expect(() => JSON.parse(out)).toThrow();
  });
});
