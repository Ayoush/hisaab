# Rounding in hisaab

GST calculations sometimes produce fractional paise. hisaab uses **half-up rounding** throughout.

## Half-up rounding

Round 0.5 away from zero (toward positive infinity for positive numbers).

```
roundHalfUp(0.4) = 0
roundHalfUp(0.5) = 1   ← rounds up
roundHalfUp(1.5) = 2   ← rounds up
roundHalfUp(2.5) = 3   ← rounds up
```

## Why not banker's rounding?

JavaScript's `Math.round` uses half-up for positive numbers, but the CBIC rounding rules and most Indian accounting software use half-up consistently. Banker's rounding (round-half-to-even) would produce different results on odd-paise invoices.

## Where this is enforced

The `roundHalfUp` function lives in `packages/core/src/round.ts`. Every tax calculation goes through it.

## Scenarios that use this

- `round-half-up-odd` — 1-paise remainder goes to CGST
- `cgst-sgst-18-intra` — 10000 paise × 9% = exactly 900 paise (no remainder)
