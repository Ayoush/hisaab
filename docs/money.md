# Money in hisaab: paise, not floats

All monetary values in hisaab are integers in paise. One Indian Rupee equals 100 paise.

## Why not floats?

IEEE 754 floating-point cannot represent many decimal fractions exactly:

```typescript
console.log(0.1 + 0.2); // 0.30000000000000004 — not 0.3
```

For GST calculations this matters: a 1-paise error repeated across thousands of invoices is a GST compliance issue.

## The rule

> All monetary inputs and outputs are integers. The unit is paise.

```typescript
// WRONG
const taxableAmount = 100.50; // rupees, float

// RIGHT
const taxableAmount = 10050; // paise, integer
```

## Where this is enforced

The `Paise` type in `packages/core/src/money.ts` is a branded integer:

```typescript
export type Paise = number & { readonly __brand: 'Paise' };
```

The `paise()` constructor throws if the argument is not an integer:

```typescript
paise(10050);   // OK
paise(100.50);  // throws TypeError: Expected integer paise
```

## Related scenarios

- `cgst-sgst-18-intra` — 900 + 900 paise split
- `round-half-up-odd` — 1-paise remainder
