import { describe, it, expect } from 'vitest';
import { reverseCalculate } from './reverse.js';
import { split } from './split.js';
import { paise } from './money.js';

describe('reverseCalculate — worked example', () => {
  it('(11800, 18, inter) → taxable 10000, igst 1800', () => {
    const r = reverseCalculate(paise(11800), 18, false);
    expect(r.taxable).toBe(10000);
    expect(r.igst).toBe(1800);
    expect(r.cgst).toBe(0);
    expect(r.sgst).toBe(0);
  });
});

describe('reverseCalculate — all four rates, inter-state', () => {
  const cases = [
    { gross: 10500, rate: 5, taxable: 10000, igst: 500 },
    { gross: 11200, rate: 12, taxable: 10000, igst: 1200 },
    { gross: 11800, rate: 18, taxable: 10000, igst: 1800 },
    { gross: 12800, rate: 28, taxable: 10000, igst: 2800 },
  ] as const;
  for (const c of cases) {
    it(`(${c.gross}, ${c.rate}) → taxable ${c.taxable}`, () => {
      const r = reverseCalculate(paise(c.gross), c.rate, false);
      expect(r.taxable).toBe(c.taxable);
      expect(r.igst).toBe(c.igst);
    });
  }
});

describe('reverseCalculate — intra-state split', () => {
  it('(11800, 18, intra) → 900 + 900', () => {
    const r = reverseCalculate(paise(11800), 18, true);
    expect(r.taxable).toBe(10000);
    expect(r.cgst).toBe(900);
    expect(r.sgst).toBe(900);
    expect(r.igst).toBe(0);
  });

  it('odd-paise gross splits the extra paise to CGST', () => {
    // taxable 100 @ 5% → total tax 5 → 3 + 2, gross 105
    const r = reverseCalculate(paise(105), 5, true);
    expect(r.taxable).toBe(100);
    expect(r.cgst).toBe(3);
    expect(r.sgst).toBe(2);
  });
});

describe('reverseCalculate — roundtrip sweep', () => {
  it('split(reverse(gross).taxable).igst === reverse(gross).igst', () => {
    const taxables = [100, 111, 999, 1001, 9999];
    const rates = [5, 12, 18, 28];
    for (const t of taxables) {
      for (const rate of rates) {
        for (const intra of [true, false]) {
          const fwd = split(paise(t), rate, intra);
          const totalTax = fwd.cgst + fwd.sgst + fwd.igst;
          const gross = t + totalTax;
          const rev = reverseCalculate(paise(gross), rate, intra);
          expect(rev.taxable).toBe(t);
          const back = split(rev.taxable, rate, intra);
          expect(back.cgst + back.sgst + back.igst).toBe(totalTax);
        }
      }
    }
  });
});

describe('reverseCalculate — errors', () => {
  it('unreachable gross 10 @ 5% throws RangeError', () => {
    // f(9) = 9, f(10) = 11 — nothing maps to 10
    expect(() => reverseCalculate(paise(10), 5, false)).toThrow(RangeError);
  });

  it('rate -5 and 101 throw RangeError', () => {
    expect(() => reverseCalculate(paise(11800), -5, false)).toThrow(RangeError);
    expect(() => reverseCalculate(paise(11800), 101, false)).toThrow(RangeError);
  });
});
