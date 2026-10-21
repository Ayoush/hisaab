import { describe, it, expect } from 'vitest';
import { detectCompositeSupply, type SupplyItem } from './composite.js';
import { paise } from './money.js';

function item(
  name: string,
  ratePercent: number,
  taxablePaise: number,
  principal?: boolean,
): SupplyItem {
  return {
    name,
    ratePercent,
    taxableAmountPaise: paise(taxablePaise),
    ...(principal === undefined ? {} : { principal }),
  };
}

describe('detectCompositeSupply — composite supplies', () => {
  it('hotel + food is composite when the hotel is principal', () => {
    const result = detectCompositeSupply(
      [item('Hotel room', 12, 5000, true), item('Food', 5, 1000)],
      { naturallyBundled: true },
    );
    expect(result.type).toBe('composite');
    expect(result.applicableRate).toBe(12);
    expect(result.principalItem).toBe('Hotel room');
  });

  it('takes the rate of the principal element, not the highest rate', () => {
    const result = detectCompositeSupply(
      [item('Room', 5, 5000, true), item('Equipment hire', 28, 1000)],
      { naturallyBundled: true },
    );
    expect(result.type).toBe('composite');
    expect(result.applicableRate).toBe(5);
  });

  it('infers the predominant element when none is designated', () => {
    const result = detectCompositeSupply([item('Room', 12, 5000), item('Breakfast', 5, 1000)], {
      naturallyBundled: true,
    });
    expect(result.type).toBe('composite');
    expect(result.applicableRate).toBe(12);
    expect(result.principalItem).toBe('Room');
  });

  it('prefers a designated principal over the value proxy', () => {
    const result = detectCompositeSupply([item('Room', 12, 5000), item('Add on', 5, 100, true)], {
      naturallyBundled: true,
    });
    expect(result.type).toBe('composite');
    expect(result.applicableRate).toBe(5);
    expect(result.principalItem).toBe('Add on');
  });

  it('goods packed with transport and insurance are composite, goods principal', () => {
    const result = detectCompositeSupply(
      [item('Goods', 18, 8000, true), item('Transport', 5, 500), item('Insurance', 18, 200)],
      { naturallyBundled: true },
    );
    expect(result.type).toBe('composite');
    expect(result.applicableRate).toBe(18);
    expect(result.principalItem).toBe('Goods');
  });

  it('treats a single item as a degenerate composite', () => {
    const result = detectCompositeSupply([item('Consulting', 18, 10000)], {
      naturallyBundled: true,
    });
    expect(result.type).toBe('composite');
    expect(result.applicableRate).toBe(18);
    expect(result.principalItem).toBe('Consulting');
  });
});

describe('detectCompositeSupply — mixed supplies', () => {
  it('a gift hamper is mixed', () => {
    const result = detectCompositeSupply(
      [item('Sweets', 18, 500), item('Dry fruits', 12, 700), item('Aerated drinks', 28, 300)],
      { naturallyBundled: false },
    );
    expect(result.type).toBe('mixed');
    expect(result.applicableRate).toBe(28);
  });

  it('takes the highest rate, not the highest value', () => {
    const result = detectCompositeSupply(
      [item('Bulk', 5, 100000), item('Small high rate', 28, 100)],
      { naturallyBundled: false },
    );
    expect(result.type).toBe('mixed');
    expect(result.applicableRate).toBe(28);
    expect(result.principalItem).toBe('Small high rate');
  });

  it('falls back to mixed when two elements are both designated principal', () => {
    const result = detectCompositeSupply([item('A', 12, 5000, true), item('B', 18, 1000, true)], {
      naturallyBundled: true,
    });
    expect(result.type).toBe('mixed');
    expect(result.applicableRate).toBe(18);
  });

  it('falls back to mixed when the predominant element cannot be established', () => {
    const result = detectCompositeSupply([item('A', 12, 1000), item('B', 5, 1000)], {
      naturallyBundled: true,
    });
    expect(result.type).toBe('mixed');
    expect(result.applicableRate).toBe(12);
  });

  it('ignores a principal designation when the items are not bundled', () => {
    const result = detectCompositeSupply([item('A', 12, 5000, true), item('B', 18, 1000)], {
      naturallyBundled: false,
    });
    expect(result.type).toBe('mixed');
    expect(result.applicableRate).toBe(18);
  });

  it('reports the first item when rates are equal', () => {
    const result = detectCompositeSupply([item('First', 18, 1000), item('Second', 18, 5000)], {
      naturallyBundled: false,
    });
    expect(result.type).toBe('mixed');
    expect(result.applicableRate).toBe(18);
    expect(result.principalItem).toBe('First');
  });
});

describe('detectCompositeSupply — validation', () => {
  it('rejects an empty supply', () => {
    expect(() => detectCompositeSupply([], { naturallyBundled: true })).toThrow(TypeError);
  });

  it('rejects a rate outside 0 to 100', () => {
    expect(() => detectCompositeSupply([item('A', 150, 1000)], { naturallyBundled: true })).toThrow(
      RangeError,
    );
    expect(() => detectCompositeSupply([item('A', -5, 1000)], { naturallyBundled: true })).toThrow(
      RangeError,
    );
  });

  it('rejects a negative taxable amount', () => {
    expect(() => detectCompositeSupply([item('A', 18, -1)], { naturallyBundled: true })).toThrow(
      RangeError,
    );
  });

  it('rejects an item without a name', () => {
    expect(() => detectCompositeSupply([item('  ', 18, 1000)], { naturallyBundled: true })).toThrow(
      TypeError,
    );
  });
});

describe('detectCompositeSupply — purity', () => {
  it('does not mutate the items', () => {
    const items = [item('Room', 12, 5000, true), item('Breakfast', 5, 1000)];
    const snapshot = JSON.parse(JSON.stringify(items)) as unknown;
    detectCompositeSupply(items, { naturallyBundled: true });
    expect(items).toEqual(snapshot);
  });

  it('is deterministic', () => {
    const items = [item('Room', 12, 5000), item('Breakfast', 5, 1000)];
    const facts = { naturallyBundled: true };
    expect(detectCompositeSupply(items, facts)).toEqual(detectCompositeSupply(items, facts));
  });
});
