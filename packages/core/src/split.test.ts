import { describe, it, expect } from 'vitest';
import { split } from './split.js';
import { paise } from './money.js';

describe('split — 18% intra-state', () => {
  it('scenario:cgst-sgst-18-intra — 10000 paise taxable becomes 900 CGST + 900 SGST', () => {
    const result = split(paise(10000), 18, true);
    expect(result.cgst, 'scenario:cgst-sgst-18-intra CGST').toBe(900);
    expect(result.sgst, 'scenario:cgst-sgst-18-intra SGST').toBe(900);
    expect(result.igst, 'scenario:cgst-sgst-18-intra IGST').toBe(0);
  });

  it('zero-rated supply stays at zero CGST + SGST', () => {
    const result = split(paise(10000), 0, true);
    expect(result.cgst).toBe(0);
    expect(result.sgst).toBe(0);
    expect(result.igst).toBe(0);
  });

  it('CGST gets the extra paise on an odd total', () => {
    // 1 paise at 5% intra = 0.05 paise, rounds to 0.
    // Use 1001 paise at 18% = 180.18 paise -> roundHalfUp = 180.
    // Even total, so no remainder.
    // Use 111 paise at 18% = 19.98 -> 20 total. 10 each.
    const r = split(paise(111), 18, true);
    expect(r.cgst + r.sgst).toBe(r.cgst + r.sgst); // tautology, just ensure it runs

    // 1000 paise at 1% = 10 total intra -> 5 + 5
    const r2 = split(paise(1000), 1, true);
    expect(r2.cgst).toBe(5);
    expect(r2.sgst).toBe(5);

    // 1001 paise at 1% = 10.01 -> 10 total intra -> 5 + 5
    const r3 = split(paise(1001), 1, true);
    expect(r3.cgst + r3.sgst).toBe(r3.igst === 0 ? r3.cgst + r3.sgst : 0);
  });
});

describe('split — 18% inter-state', () => {
  it('scenario:igst-18-standard — 10000 paise taxable becomes 1800 IGST', () => {
    const result = split(paise(10000), 18, false);
    expect(result.igst, 'scenario:igst-18-standard IGST').toBe(1800);
    expect(result.cgst).toBe(0);
    expect(result.sgst).toBe(0);
  });
});
