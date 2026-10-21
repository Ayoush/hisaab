# Composite and mixed supplies

A supply can bundle two or more things for a single price. GST treats that bundle in one of two ways, and the difference decides the rate.

## The two categories

**Composite supply** — Section 2(30): "two or more taxable supplies of goods or services or both, or any combination thereof, which are _naturally bundled_ and supplied _in conjunction with each other in the ordinary course of business_, one of which is a _principal supply_".

**Mixed supply** — Section 2(24): "two or more individual supplies of goods or services, or any combination thereof, made in conjunction with each other by a taxable person _for a single price_ where such supply _does not constitute a composite supply_".

**Principal supply** — Section 2(90): "the supply of goods or services which constitutes the _predominant element_ of a composite supply and to which any other supply forming part of that composite supply is _ancillary_".

## How the rate is decided

**Section 8(a)** — a composite supply is treated as a supply of the principal supply, so it takes the principal's rate.

**Section 8(b)** — a mixed supply is treated as a supply of "that particular supply which attracts the highest rate of tax".

Note that Section 8(b) is **rate based**. The Council's worked example reasons about the supply attracting the "highest liability of tax", but the statute says rate: a ₹1 item at 28% still outranks a ₹10,000 item at 5%. Value only ever helps pick the _principal_ element of a composite supply; it never picks the rate of a mixed supply.

## There is no formula for "naturally bundled"

The GST Council is explicit:

> "No straight jacket formula can be laid down to determine whether a service is naturally bundled in the ordinary course of business. Each case has to be individually examined."

So `detectCompositeSupply()` does not try to guess. The caller states whether the items are naturally bundled, and the function applies Section 8 to that fact. A composite supply is established **only when exactly one principal supply can be identified** — either the caller designates it, or the predominant element is unambiguous.

When two elements are both designated principal, or the predominant element is tied, a composite supply cannot be established, and the supply falls under Section 8(b).

The value used to infer the predominant element is a **proxy** for the legal test. The legal test for a principal service is its essential nature, which the invoice does not carry — so designate the principal yourself whenever you can.

## The rule in one line

> A composite supply is established only when exactly one principal supply can be identified — by the caller's flag, or by an unambiguous inference. Everything else is a mixed supply under Section 8(b).

| Situation                                                     | Result                                       | Rate                            |
| ------------------------------------------------------------- | -------------------------------------------- | ------------------------------- |
| One item only                                                 | composite (degenerate), itself the principal | its own rate                    |
| Not naturally bundled                                         | mixed                                        | highest rate among the elements |
| Naturally bundled, one element designated principal           | composite                                    | the principal's rate            |
| Naturally bundled, two or more designated principal           | mixed                                        | highest rate                    |
| Naturally bundled, none designated, predominant element clear | composite                                    | that element's rate             |
| Naturally bundled, none designated, predominant element tied  | mixed                                        | highest rate                    |

A single item is neither category — Section 2(24) also needs two or more supplies for a mixed supply — so it is reported as a degenerate composite with itself as principal. The rate is the same under either reading.

## Worked examples

- **Goods packed and transported with insurance** — a composite supply; the supply of goods is the principal supply. _(The Council's illustration.)_
- **A house given on rent, one floor for residence and one for a printing press** — not naturally bundled, so a mixed supply, taxed at the rate attracting the highest tax.
- **A gift hamper of canned foods, sweets, chocolates, dry fruits and aerated drinks for a single price** — a mixed supply; each item can be supplied separately and none depends on another.
- **Hotel accommodation with food** — a composite supply when accommodation is the principal supply, and the rate is the _principal element's_ rate.

## Using the result

The applicable rate applies to the **whole bundle**:

```typescript
const result = detectCompositeSupply(items, { naturallyBundled: true });
const taxes = split(bundleTotalPaise, result.applicableRate, isIntraState);
```

The per-line taxes computed for a multi-line invoice are **not** the right figures for a composite supply, where one rate applies to the bundle as a whole.

## Limits

- The model assumes taxable elements. An exempt or zero-rated element in a mixed supply is not modelled.
- Time of supply, place of supply and the classification of the bundle as goods or services are outside the scope of this function.

## Not legal advice

This document is a technical reference for writing test fixtures and for classifying a bundle once the facts are known. GST law is complex and every bundling question is decided on its own facts; consult a chartered accountant for compliance decisions.
