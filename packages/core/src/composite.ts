import type { Paise } from './money.js';

// Composite and mixed supply classification under CGST Act Section 8.
//
// A composite supply (Section 2(30)) is naturally bundled and has one
// principal supply (Section 2(90)); it is taxed at the rate of that principal
// supply (Section 8(a)). A mixed supply (Section 2(24)) is taxed at the rate
// of the element attracting the highest rate of tax (Section 8(b)).
//
// The GST Council is explicit that no formula exists for deciding whether
// supplies are naturally bundled, so the caller supplies that fact and this
// function applies Section 8 to it.

export type SupplyItem = {
  name: string;
  ratePercent: number;
  /** Taxable value of the item, before tax, so items stay comparable. */
  taxableAmountPaise: Paise;
  /** Set when this item is the principal supply of a composite supply. */
  principal?: boolean;
};

export type SupplyFacts = {
  /**
   * Whether the items are naturally bundled and supplied in conjunction in
   * the ordinary course of business — Section 2(30).
   */
  naturallyBundled: boolean;
};

export type CompositeResult = {
  type: 'composite' | 'mixed';
  applicableRate: number;
  /**
   * The item whose rate applies: the principal supply for a composite supply,
   * the highest-rated item for a mixed supply.
   */
  principalItem?: string;
};

function validate(items: SupplyItem[]): void {
  if (items.length === 0) {
    throw new TypeError('a supply must have at least one item');
  }
  for (const item of items) {
    if (item.name.trim() === '') {
      throw new TypeError('every supply item needs a name');
    }
    if (item.ratePercent < 0 || item.ratePercent > 100) {
      throw new RangeError(`Invalid rate: ${item.ratePercent}`);
    }
    if (item.taxableAmountPaise < 0) {
      throw new RangeError(`Invalid taxable amount: ${item.taxableAmountPaise}`);
    }
  }
}

function compositeResult(principal: SupplyItem): CompositeResult {
  return {
    type: 'composite',
    applicableRate: principal.ratePercent,
    principalItem: principal.name,
  };
}

function mixedResult(items: SupplyItem[]): CompositeResult {
  const highest = items.reduce((best, item) => (item.ratePercent > best.ratePercent ? item : best));
  return {
    type: 'mixed',
    applicableRate: highest.ratePercent,
    principalItem: highest.name,
  };
}

export function detectCompositeSupply(items: SupplyItem[], facts: SupplyFacts): CompositeResult {
  validate(items);

  if (items.length === 1) {
    // Section 2(24) also needs two or more supplies for a mixed supply, so a
    // single item is neither category. It is reported as a degenerate
    // composite with itself as principal; the rate is the same either way.
    return compositeResult(items[0]!);
  }

  if (!facts.naturallyBundled) {
    // Section 8(b): a supply that is not a composite supply is taxed at the
    // rate of the element attracting the highest rate of tax.
    return mixedResult(items);
  }

  const flagged = items.filter((item) => item.principal === true);

  if (flagged.length === 1) {
    // Section 8(a): a composite supply is treated as a supply of the
    // principal supply.
    return compositeResult(flagged[0]!);
  }

  if (flagged.length > 1) {
    // Section 2(90) allows one principal supply, so a composite supply cannot
    // be established and Section 8(b) applies.
    return mixedResult(items);
  }

  // No principal supply was designated. Section 2(90) points at the
  // predominant element; taxable value stands in for it.
  const highest = items.reduce((best, item) =>
    item.taxableAmountPaise > best.taxableAmountPaise ? item : best,
  );
  const tied = items.filter((item) => item.taxableAmountPaise === highest.taxableAmountPaise);
  if (tied.length > 1) {
    // The predominant element cannot be established, so neither can the
    // composite supply.
    return mixedResult(items);
  }

  return compositeResult(highest);
}
