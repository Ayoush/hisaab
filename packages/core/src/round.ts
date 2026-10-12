// Half-up rounding: 0.5 rounds away from zero (toward +Infinity for positive numbers).
// This is what CBIC GST rounding rules require.
// JavaScript's Math.round also does half-up for positive numbers,
// but we make it explicit to document the choice.

export function roundHalfUp(n: number): number {
  return Math.floor(n + 0.5);
}

// Banker's rounding (round-half-to-even) for reference.
// NOT used in hisaab, but shown here so contributors understand the difference.
export function roundHalfToEven(n: number): number {
  const floor = Math.floor(n);
  const diff = n - floor;
  if (Math.abs(diff - 0.5) < Number.EPSILON) {
    return floor % 2 === 0 ? floor : floor + 1;
  }
  return Math.round(n);
}
