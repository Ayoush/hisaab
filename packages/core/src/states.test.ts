import { describe, it, expect } from 'vitest';
import { STATES, lookupState } from './states.js';

describe('states — UT kinds', () => {
  const uts = [
    ['01', 'Jammu and Kashmir'],
    ['04', 'Chandigarh'],
    ['07', 'Delhi'],
    ['26', 'Dadra and Nagar Haveli and Daman and Diu'],
    ['31', 'Lakshadweep'],
    ['34', 'Puducherry'],
    ['35', 'Andaman and Nicobar Islands'],
    ['38', 'Ladakh'],
  ] as const;
  for (const [code, name] of uts) {
    it(`${code} ${name} is a UT`, () => {
      expect(STATES.get(code)?.kind).toBe('ut');
      expect(lookupState(code)?.kind).toBe('ut');
    });
  }
  it('lookupState returns null for unknown code', () => {
    expect(lookupState('ZZ')).toBeNull();
  });
});

describe('lookupState — full registry sweep', () => {
  it('every registered code resolves with a valid kind', () => {
    // GST codes 01–38 minus unassigned 25 (merged into 26)
    expect(STATES.size).toBe(37);
    for (const [code, info] of STATES) {
      expect(lookupState(code)).toEqual(info);
      expect(['state', 'ut']).toContain(info.kind);
    }
  });

  it('all 8 UTs are exactly the UT set', () => {
    const uts = [...STATES.values()]
      .filter((s) => s.kind === 'ut')
      .map((s) => s.code)
      .sort();
    expect(uts).toEqual(['01', '04', '07', '26', '31', '34', '35', '38']);
  });
});
