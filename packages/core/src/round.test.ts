import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';
import { roundHalfUp } from './round.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('roundHalfUp', () => {
  it('0.5 rounds up (away from zero)', () => {
    expect(roundHalfUp(0.5)).toBe(1);
    expect(roundHalfUp(1.5)).toBe(2);
    expect(roundHalfUp(2.5)).toBe(3);
  });

  it('values below 0.5 round down', () => {
    expect(roundHalfUp(0.4)).toBe(0);
    expect(roundHalfUp(1.4)).toBe(1);
  });

  it('reads the golden fixture and matches all cases', () => {
    const fixture = JSON.parse(
      readFileSync(join(__dirname, '../../../fixtures/golden/round-half-up.json'), 'utf-8'),
    ) as { cases: { input: number; expected: number }[] };

    for (const { input, expected } of fixture.cases) {
      expect(roundHalfUp(input), `roundHalfUp(${input})`).toBe(expected);
    }
  });
});
