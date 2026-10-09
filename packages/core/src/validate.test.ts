import { describe, it, expect } from 'vitest';
import { validateLineItem } from './validate.js';

describe('validateLineItem', () => {
  it('returns NEGATIVE_QUANTITY error for negative quantity', () => {
    const errors = validateLineItem({ quantity: -1, ratePercent: 18 });
    expect(errors).toHaveLength(1);
    const err = errors[0]!;
    expect(err.code).toBe('NEGATIVE_QUANTITY');
    expect(err.field).toBe('quantity');
    expect(err.message).toContain('quantity');
  });

  it('does not return a total (returns an error array only)', () => {
    const result = validateLineItem({ quantity: -1, ratePercent: 18 });
    expect(Array.isArray(result)).toBe(true);
  });

  it('returns empty errors for valid input', () => {
    const errors = validateLineItem({ quantity: 1, ratePercent: 18 });
    expect(errors).toHaveLength(0);
  });

  it('returns INVALID_RATE for rate above 100', () => {
    const errors = validateLineItem({ quantity: 1, ratePercent: 150 });
    expect(errors.some((e) => e.code === 'INVALID_RATE')).toBe(true);
  });
});
