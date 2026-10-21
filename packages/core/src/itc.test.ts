import { describe, it, expect } from 'vitest';
import { checkItcEligibility, classifyItcInput, type BusinessType } from './itc.js';
import { createInvoice, type LineItem } from './invoice.js';
import { paise } from './money.js';

function invoiceWith(lines: { hsn: string; taxablePaise: number; ratePercent?: number }[]) {
  const items: LineItem[] = lines.map((l) => ({
    sellerStateCode: '27',
    buyerStateCode: '27',
    hsn: l.hsn,
    ratePercent: l.ratePercent ?? 18,
    taxableAmountPaise: paise(l.taxablePaise),
  }));
  const result = createInvoice(items);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error('invoice build failed');
  return result.invoice;
}

describe('classifyItcInput', () => {
  it('maps the blocked HSN/SAC codes to categories', () => {
    expect(classifyItcInput('8703')).toBe('passenger-vehicle');
    expect(classifyItcInput('870310')).toBe('passenger-vehicle');
    expect(classifyItcInput('8802')).toBe('vessel-aircraft');
    expect(classifyItcInput('8901')).toBe('vessel-aircraft');
    expect(classifyItcInput('2106')).toBe('food-beverage');
    expect(classifyItcInput('2201')).toBe('food-beverage');
    expect(classifyItcInput('995411')).toBe('construction');
  });

  it('returns null for ordinary business inputs', () => {
    expect(classifyItcInput('8471')).toBeNull();
    expect(classifyItcInput('9987')).toBeNull();
    expect(classifyItcInput('2710')).toBeNull();
  });
});

describe('checkItcEligibility — Section 17(5)(a) motor vehicles', () => {
  it('blocks a passenger vehicle for a trader', () => {
    const r = checkItcEligibility(invoiceWith([{ hsn: '8703', taxablePaise: 1000000 }]), 'trader');
    expect(r.eligible).toBe(false);
    expect(r.eligibleAmount).toBe(0);
    expect(r.blockedReason).toContain('17(5)(a)');
  });

  it('allows a vehicle dealer making a further supply', () => {
    const r = checkItcEligibility(
      invoiceWith([{ hsn: '8703', taxablePaise: 1000000 }]),
      'vehicle-dealer',
    );
    expect(r.eligible).toBe(true);
    expect(r.eligibleAmount).toBe(180000);
  });

  it('allows a passenger transporter', () => {
    const r = checkItcEligibility(
      invoiceWith([{ hsn: '8703', taxablePaise: 1000000 }]),
      'passenger-transporter',
    );
    expect(r.eligible).toBe(true);
  });

  it('allows a driving training institute', () => {
    const r = checkItcEligibility(
      invoiceWith([{ hsn: '8703', taxablePaise: 1000000 }]),
      'driving-training',
    );
    expect(r.eligible).toBe(true);
  });

  it('allows a vehicle manufacturer', () => {
    const r = checkItcEligibility(
      invoiceWith([{ hsn: '8703', taxablePaise: 1000000 }]),
      'manufacturer',
    );
    expect(r.eligible).toBe(true);
  });

  it('still blocks a goods transporter — 17(5)(a) covers persons only', () => {
    const r = checkItcEligibility(
      invoiceWith([{ hsn: '8703', taxablePaise: 1000000 }]),
      'goods-transporter',
    );
    expect(r.eligible).toBe(false);
  });
});

describe('checkItcEligibility — Section 17(5)(aa) vessels and aircraft', () => {
  it('blocks an aircraft for a trader', () => {
    const r = checkItcEligibility(invoiceWith([{ hsn: '8802', taxablePaise: 1000000 }]), 'trader');
    expect(r.eligible).toBe(false);
    expect(r.blockedReason).toContain('17(5)(aa)');
  });

  it('allows a goods transporter', () => {
    const r = checkItcEligibility(
      invoiceWith([{ hsn: '8802', taxablePaise: 1000000 }]),
      'goods-transporter',
    );
    expect(r.eligible).toBe(true);
  });
});

describe('checkItcEligibility — Section 17(5)(b)(i) food and beverages', () => {
  it('blocks food for a trader', () => {
    const r = checkItcEligibility(invoiceWith([{ hsn: '2106', taxablePaise: 100000 }]), 'trader');
    expect(r.eligible).toBe(false);
    expect(r.blockedReason).toContain('17(5)(b)(i)');
  });

  it('blocks beverages for a trader', () => {
    const r = checkItcEligibility(invoiceWith([{ hsn: '2201', taxablePaise: 100000 }]), 'trader');
    expect(r.eligible).toBe(false);
  });

  it('allows a food service business making an outward taxable supply of food', () => {
    const r = checkItcEligibility(
      invoiceWith([{ hsn: '2106', taxablePaise: 100000 }]),
      'food-service',
    );
    expect(r.eligible).toBe(true);
    expect(r.eligibleAmount).toBe(18000);
  });
});

describe('checkItcEligibility — Section 17(5)(c) and (d) construction', () => {
  it('blocks construction services for a real estate developer', () => {
    const r = checkItcEligibility(
      invoiceWith([{ hsn: '995411', taxablePaise: 1000000 }]),
      'real-estate-developer',
    );
    expect(r.eligible).toBe(false);
    expect(r.blockedReason).toContain('17(5)(c)');
  });

  it('allows a works contractor making a further supply of the same service', () => {
    const r = checkItcEligibility(
      invoiceWith([{ hsn: '995411', taxablePaise: 1000000 }]),
      'works-contractor',
    );
    expect(r.eligible).toBe(true);
  });
});

describe('checkItcEligibility — mixed invoices', () => {
  it('credits only the eligible line of a mixed invoice', () => {
    const invoice = invoiceWith([
      { hsn: '8703', taxablePaise: 1000000 },
      { hsn: '8471', taxablePaise: 1000000 },
    ]);
    const r = checkItcEligibility(invoice, 'trader');
    expect(r.eligible).toBe(true);
    expect(r.eligibleAmount).toBe(180000);
    expect(r.lines).toHaveLength(2);
    expect(r.lines[0]?.eligible).toBe(false);
    expect(r.lines[0]?.eligibleAmount).toBe(0);
    expect(r.lines[1]?.eligible).toBe(true);
    expect(r.lines[1]?.eligibleAmount).toBe(180000);
    expect(r.blockedReason).toContain('17(5)(a)');
  });

  it('reports nothing eligible when every line is blocked', () => {
    const r = checkItcEligibility(
      invoiceWith([
        { hsn: '8703', taxablePaise: 1000000 },
        { hsn: '2106', taxablePaise: 100000 },
      ]),
      'trader',
    );
    expect(r.eligible).toBe(false);
    expect(r.eligibleAmount).toBe(0);
    expect(r.blockedReason).toBeTruthy();
  });

  it('has no blocked reason when every line is eligible', () => {
    const r = checkItcEligibility(invoiceWith([{ hsn: '8471', taxablePaise: 100000 }]), 'trader');
    expect(r.blockedReason).toBeUndefined();
  });
});

describe('checkItcEligibility — amounts', () => {
  it('credits the tax, not the invoice value', () => {
    const invoice = invoiceWith([{ hsn: '8471', taxablePaise: 100000 }]);
    const r = checkItcEligibility(invoice, 'trader');
    expect(r.eligibleAmount).toBe(18000);
    expect(r.eligibleAmount).not.toBe(invoice.grandTotal);
  });

  it('credits IGST on an inter-state invoice', () => {
    const result = createInvoice([
      {
        sellerStateCode: '27',
        buyerStateCode: '07',
        hsn: '8471',
        ratePercent: 18,
        taxableAmountPaise: paise(100000),
      },
    ]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const r = checkItcEligibility(result.invoice, 'trader');
    expect(r.eligibleAmount).toBe(18000);
    expect(result.invoice.totalIgst).toBe(18000);
  });

  it('credits CGST and SGST on an intra-state invoice', () => {
    const invoice = invoiceWith([{ hsn: '8471', taxablePaise: 100000 }]);
    const r = checkItcEligibility(invoice, 'trader');
    expect(r.eligibleAmount).toBe(9000 + 9000);
  });

  it('returns nothing eligible for an empty invoice', () => {
    const result = createInvoice([
      {
        sellerStateCode: '27',
        buyerStateCode: '27',
        hsn: '8471',
        ratePercent: 18,
        taxableAmountPaise: paise(1),
      },
    ]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const empty = { ...result.invoice, lines: [] };
    const r = checkItcEligibility(empty, 'trader');
    expect(r.eligible).toBe(false);
    expect(r.eligibleAmount).toBe(0);
    expect(r.lines).toEqual([]);
  });
});

describe('checkItcEligibility — purity', () => {
  it('does not mutate the invoice', () => {
    const invoice = invoiceWith([
      { hsn: '8703', taxablePaise: 1000000 },
      { hsn: '8471', taxablePaise: 100000 },
    ]);
    const snapshot = JSON.parse(JSON.stringify(invoice)) as unknown;
    checkItcEligibility(invoice, 'trader');
    expect(invoice).toEqual(snapshot);
  });

  it('is deterministic', () => {
    const invoice = invoiceWith([{ hsn: '8703', taxablePaise: 1000000 }]);
    const businessType: BusinessType = 'trader';
    expect(checkItcEligibility(invoice, businessType)).toEqual(
      checkItcEligibility(invoice, businessType),
    );
  });
});
