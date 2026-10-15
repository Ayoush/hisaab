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

  it('returns ZERO_QUANTITY for zero quantity', () => {
    const errors = validateLineItem({ quantity: 0, ratePercent: 18 });
    expect(errors).toHaveLength(1);
    expect(errors[0]!.code).toBe('ZERO_QUANTITY');
    expect(errors[0]!.field).toBe('quantity');
  });

  it('positive passes, zero fails, negative fails', () => {
    expect(validateLineItem({ quantity: 1, ratePercent: 18 })).toHaveLength(0);
    expect(
      validateLineItem({ quantity: 0, ratePercent: 18 }).some((e) => e.code === 'ZERO_QUANTITY'),
    ).toBe(true);
    expect(
      validateLineItem({ quantity: -1, ratePercent: 18 }).some(
        (e) => e.code === 'NEGATIVE_QUANTITY',
      ),
    ).toBe(true);
  });
});
