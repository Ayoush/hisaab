import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';
import { createInvoice, type LineItem } from './invoice.js';
import { paise } from './money.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

type MultiRateScenario = {
  id: string;
  sellerState: string;
  buyerState: string;
  lines: { hsn: string; ratePercent: number; taxableAmountPaise: number }[];
  expectedSubtotalPaise: number;
  expectedCgstPaise: number;
  expectedSgstPaise: number;
  expectedIgstPaise: number;
  expectedCessPaise: number;
  expectedTotalPaise: number;
};

function loadScenario(id: string): MultiRateScenario {
  const raw = readFileSync(join(__dirname, `../../../spec/invoices/${id}.json`), 'utf-8');
  return JSON.parse(raw) as MultiRateScenario;
}

function toItems(s: MultiRateScenario): LineItem[] {
  return s.lines.map((l) => ({
    sellerStateCode: s.sellerState,
    buyerStateCode: s.buyerState,
    hsn: l.hsn,
    ratePercent: l.ratePercent,
    taxableAmountPaise: paise(l.taxableAmountPaise),
  }));
}

const intra = loadScenario('multi-rate-intra');
const inter = loadScenario('multi-rate-inter');

describe('createInvoice — multi-rate', () => {
  it('intra-state: two rates split into CGST + SGST', () => {
    const result = createInvoice(toItems(intra));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.invoice.subtotal).toBe(intra.expectedSubtotalPaise);
    expect(result.invoice.totalCgst).toBe(intra.expectedCgstPaise);
    expect(result.invoice.totalSgst).toBe(intra.expectedSgstPaise);
    expect(result.invoice.totalIgst).toBe(intra.expectedIgstPaise);
    expect(result.invoice.grandTotal).toBe(intra.expectedTotalPaise);
  });

  it('inter-state: two rates roll up into IGST', () => {
    const result = createInvoice(toItems(inter));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.invoice.subtotal).toBe(inter.expectedSubtotalPaise);
    expect(result.invoice.totalIgst).toBe(inter.expectedIgstPaise);
    expect(result.invoice.totalCgst).toBe(0);
    expect(result.invoice.totalSgst).toBe(0);
    expect(result.invoice.grandTotal).toBe(inter.expectedTotalPaise);
  });

  it('sum of line totals equals grandTotal', () => {
    for (const s of [intra, inter]) {
      const result = createInvoice(toItems(s));
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      const sum = result.invoice.lines.reduce((acc, l) => acc + l.total, 0);
      expect(sum).toBe(result.invoice.grandTotal);
    }
  });

  it('grandTotal equals subtotal + all taxes', () => {
    const result = createInvoice(toItems(intra));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const inv = result.invoice;
    expect(inv.grandTotal).toBe(
      inv.subtotal + inv.totalCgst + inv.totalSgst + inv.totalIgst + inv.totalCess,
    );
  });

  it('keeps one entry per line, in input order', () => {
    const result = createInvoice(toItems(intra));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.invoice.lines).toHaveLength(2);
    expect(result.invoice.lines[0]?.ratePercent).toBe(18);
    expect(result.invoice.lines[1]?.ratePercent).toBe(12);
  });

  it('retains the seller and buyer state pair', () => {
    const result = createInvoice(toItems(inter));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.invoice.sellerStateCode).toBe('27');
    expect(result.invoice.buyerStateCode).toBe('07');
  });

  it('each line total equals its taxable plus its own taxes', () => {
    const result = createInvoice(toItems(inter));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    for (const l of result.invoice.lines) {
      expect(l.total).toBe(l.taxableAmountPaise + l.cgst + l.sgst + l.igst + l.cess);
    }
  });

  it('a single line still produces a valid invoice', () => {
    const result = createInvoice([
      {
        sellerStateCode: '27',
        buyerStateCode: '27',
        hsn: '8471',
        ratePercent: 18,
        taxableAmountPaise: paise(10000),
      },
    ]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.invoice.lines).toHaveLength(1);
    expect(result.invoice.grandTotal).toBe(11800);
  });

  it('sums cess across lines', () => {
    const result = createInvoice([
      {
        sellerStateCode: '27',
        buyerStateCode: '07',
        hsn: '2402',
        ratePercent: 28,
        cessPercent: 12,
        taxableAmountPaise: paise(10000),
      },
      {
        sellerStateCode: '27',
        buyerStateCode: '07',
        hsn: '2402',
        ratePercent: 28,
        cessPercent: 12,
        taxableAmountPaise: paise(10000),
      },
    ]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.invoice.totalCess).toBe(2400);
    expect(result.invoice.totalIgst).toBe(5600);
  });
});

describe('createInvoice — guards', () => {
  it('rejects mixed seller/buyer state pairs', () => {
    const result = createInvoice([
      {
        sellerStateCode: '27',
        buyerStateCode: '27',
        hsn: '8471',
        ratePercent: 18,
        taxableAmountPaise: paise(10000),
      },
      {
        sellerStateCode: '27',
        buyerStateCode: '07',
        hsn: '8471',
        ratePercent: 18,
        taxableAmountPaise: paise(10000),
      },
    ]);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('MIXED_STATE_PAIR');
  });

  it('rejects an empty invoice', () => {
    const result = createInvoice([]);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('EMPTY_INVOICE');
  });

  it('rejects an unknown state code', () => {
    const result = createInvoice([
      {
        sellerStateCode: 'ZZ',
        buyerStateCode: '27',
        hsn: '8471',
        ratePercent: 18,
        taxableAmountPaise: paise(10000),
      },
    ]);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('createInvoice — purity', () => {
  it('does not mutate the input items', () => {
    const items: LineItem[] = toItems(intra);
    const snapshot = JSON.parse(JSON.stringify(items)) as unknown;
    createInvoice(items);
    expect(items).toEqual(snapshot);
  });

  it('is deterministic across calls', () => {
    const a = createInvoice(toItems(inter));
    const b = createInvoice(toItems(inter));
    expect(a).toEqual(b);
  });
});
