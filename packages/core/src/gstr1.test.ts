import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';
import { toGstr1B2B } from './gstr1.js';
import { createInvoice, type LineItem } from './invoice.js';
import { paise, paiseToRupees } from './money.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Minimal JSON Schema (draft-07 subset) validator: type, required,
// properties, additionalProperties, items, enum, pattern and local $ref.
// Kept in the test file so core stays dependency-free.
type Schema = Record<string, unknown>;

function resolveRef(root: Schema, ref: string): Schema {
  const path = ref.replace(/^#\//, '').split('/');
  let node: unknown = root;
  for (const segment of path) {
    node = (node as Record<string, unknown>)[segment];
  }
  return node as Schema;
}

function validate(value: unknown, schema: Schema, root: Schema, path = '$'): string[] {
  const errors: string[] = [];

  if (typeof schema['$ref'] === 'string') {
    return validate(value, resolveRef(root, schema['$ref']), root, path);
  }

  const type = schema['type'];
  if (typeof type === 'string') {
    const actual = Array.isArray(value) ? 'array' : value === null ? 'null' : typeof value;
    const expected = type === 'integer' ? 'number' : type;
    if (expected === 'number') {
      if (typeof value !== 'number' || Number.isNaN(value)) {
        errors.push(`${path}: expected number, got ${actual}`);
        return errors;
      }
    } else if (actual !== expected) {
      errors.push(`${path}: expected ${expected}, got ${actual}`);
      return errors;
    }
  }

  if (Array.isArray(schema['enum']) && !schema['enum'].includes(value)) {
    errors.push(`${path}: ${JSON.stringify(value)} not in enum`);
  }

  if (typeof schema['pattern'] === 'string' && typeof value === 'string') {
    if (!new RegExp(schema['pattern']).test(value)) {
      errors.push(`${path}: "${value}" does not match ${schema['pattern']}`);
    }
  }

  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    const props = (schema['properties'] ?? {}) as Record<string, Schema>;

    for (const required of (schema['required'] ?? []) as string[]) {
      if (!(required in obj)) {
        errors.push(`${path}: missing required property "${required}"`);
      }
    }

    for (const [key, sub] of Object.entries(obj)) {
      const propSchema = props[key];
      if (propSchema) {
        errors.push(...validate(sub, propSchema, root, `${path}.${key}`));
      } else if (schema['additionalProperties'] === false) {
        errors.push(`${path}: unexpected property "${key}"`);
      }
    }
  }

  if (Array.isArray(value) && schema['items']) {
    value.forEach((item, i) => {
      errors.push(...validate(item, schema['items'] as Schema, root, `${path}[${i}]`));
    });
  }

  return errors;
}

function loadJson<T>(relativePath: string): T {
  return JSON.parse(readFileSync(join(__dirname, relativePath), 'utf-8')) as T;
}

type MultiRateScenario = {
  sellerState: string;
  buyerState: string;
  lines: { hsn: string; ratePercent: number; taxableAmountPaise: number }[];
};

function buildInvoice(scenarioId: string) {
  const s = loadJson<MultiRateScenario>(`../../../spec/invoices/${scenarioId}.json`);
  const items: LineItem[] = s.lines.map((l) => ({
    sellerStateCode: s.sellerState,
    buyerStateCode: s.buyerState,
    hsn: l.hsn,
    ratePercent: l.ratePercent,
    taxableAmountPaise: paise(l.taxableAmountPaise),
  }));
  const result = createInvoice(items);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error('invoice build failed');
  return result.invoice;
}

const schema = loadJson<Schema>('../../../spec/gstr1/gstr1-b2b.schema.json');
const golden = loadJson<unknown>('../../../spec/gstr1/b2b-sample.json');

const interInvoice = buildInvoice('multi-rate-inter');
const intraInvoice = buildInvoice('multi-rate-intra');

const secondInterInvoice = (() => {
  const result = createInvoice([
    {
      sellerStateCode: '27',
      buyerStateCode: '07',
      hsn: '8471',
      ratePercent: 18,
      taxableAmountPaise: paise(5000),
    },
  ]);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error('invoice build failed');
  return result.invoice;
})();

function sampleDocument() {
  return toGstr1B2B({ gstin: '27AAPFU0939F1ZV', fp: '102026' }, [
    {
      buyerGstin: '07AAQCB4722F1ZQ',
      invoiceNumber: 'INV-001',
      invoiceDate: '20-10-2026',
      invoice: interInvoice,
    },
    {
      buyerGstin: '07AAQCB4722F1ZQ',
      invoiceNumber: 'INV-002',
      invoiceDate: '21-10-2026',
      invoice: secondInterInvoice,
    },
    {
      buyerGstin: '27ABCDE1234F1Z5',
      invoiceNumber: 'INV-003',
      invoiceDate: '21-10-2026',
      invoice: intraInvoice,
    },
  ]);
}

describe('toGstr1B2B — structure', () => {
  it('matches the golden B2B sample', () => {
    expect(sampleDocument()).toEqual(golden);
  });

  it('validates against the GSTN B2B schema', () => {
    expect(validate(sampleDocument(), schema, schema)).toEqual([]);
  });

  it('survives a serialise → parse round-trip with fields intact', () => {
    const parsed = JSON.parse(JSON.stringify(sampleDocument())) as Record<string, unknown>;
    expect(parsed['gstin']).toBe('27AAPFU0939F1ZV');
    expect(parsed['fp']).toBe('102026');
    const b2b = parsed['b2b'] as { ctin: string; inv: { inum: string; val: number }[] }[];
    expect(b2b).toHaveLength(2);
    expect(b2b[0]?.ctin).toBe('07AAQCB4722F1ZQ');
    expect(b2b[0]?.inv).toHaveLength(2);
    expect(b2b[0]?.inv[0]?.inum).toBe('INV-001');
    expect(b2b[0]?.inv[0]?.val).toBe(139);
    expect(validate(parsed, schema, schema)).toEqual([]);
  });

  it('groups multiple invoices to the same buyer under one ctin', () => {
    const doc = sampleDocument();
    expect(doc.b2b).toHaveLength(2);
    expect(doc.b2b[0]?.inv.map((i) => i.inum)).toEqual(['INV-001', 'INV-002']);
  });

  it('maps invoice value from the domain grandTotal', () => {
    const doc = sampleDocument();
    expect(doc.b2b[0]?.inv[0]?.val).toBe(139);
    expect(doc.b2b[1]?.inv[0]?.val).toBe(174);
  });

  it('sets pos to the buyer state and numbers items from 1', () => {
    const doc = sampleDocument();
    expect(doc.b2b[0]?.inv[0]?.pos).toBe('07');
    expect(doc.b2b[1]?.inv[0]?.pos).toBe('27');
    expect(doc.b2b[0]?.inv[0]?.itms.map((i) => i.num)).toEqual([1, 2]);
  });

  it('splits intra-state tax into camt/samt and inter-state into iamt', () => {
    const doc = sampleDocument();
    const inter = doc.b2b[0]?.inv[0]?.itms[0]?.itm_det;
    expect(inter?.iamt).toBe(18);
    expect(inter?.camt).toBe(0);
    expect(inter?.samt).toBe(0);
    const intra = doc.b2b[1]?.inv[0]?.itms[0]?.itm_det;
    expect(intra?.iamt).toBe(0);
    expect(intra?.camt).toBe(9);
    expect(intra?.samt).toBe(9);
  });

  it('emits rchrg N and inv_typ R', () => {
    const doc = sampleDocument();
    expect(doc.b2b[0]?.inv[0]?.rchrg).toBe('N');
    expect(doc.b2b[0]?.inv[0]?.inv_typ).toBe('R');
  });

  it('returns an empty b2b array for no invoices', () => {
    const doc = toGstr1B2B({ gstin: '27AAPFU0939F1ZV', fp: '102026' }, []);
    expect(doc.b2b).toEqual([]);
    expect(validate(doc, schema, schema)).toEqual([]);
  });

  it('schema validation rejects a malformed document', () => {
    const bad = JSON.parse(JSON.stringify(sampleDocument())) as Record<string, unknown>;
    (bad['b2b'] as Record<string, unknown>[])[0]!['inv'] = [
      { inum: 'INV-001', idt: '20-10-2026', val: '139.00', pos: '7', rchrg: 'N' },
    ];
    const errors = validate(bad, schema, schema);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('schema validation rejects an unexpected property', () => {
    const bad = JSON.parse(JSON.stringify(sampleDocument())) as Record<string, unknown>;
    (bad as Record<string, unknown>)['hash'] = 'nope';
    expect(validate(bad, schema, schema).length).toBeGreaterThan(0);
  });
});

describe('toGstr1B2B — validation', () => {
  it('rejects an invalid seller GSTIN', () => {
    expect(() => toGstr1B2B({ gstin: '27AAPFU0939F1Z', fp: '102026' }, [])).toThrow(TypeError);
  });

  it('rejects an invalid filing period', () => {
    expect(() => toGstr1B2B({ gstin: '27AAPFU0939F1ZV', fp: '2026-10' }, [])).toThrow(TypeError);
  });

  it('rejects an invalid buyer GSTIN', () => {
    expect(() =>
      toGstr1B2B({ gstin: '27AAPFU0939F1ZV', fp: '102026' }, [
        {
          buyerGstin: 'ZZZZ',
          invoiceNumber: 'INV-1',
          invoiceDate: '20-10-2026',
          invoice: interInvoice,
        },
      ]),
    ).toThrow(TypeError);
  });

  it('rejects a malformed invoice date', () => {
    expect(() =>
      toGstr1B2B({ gstin: '27AAPFU0939F1ZV', fp: '102026' }, [
        {
          buyerGstin: '07AAQCB4722F1ZQ',
          invoiceNumber: 'INV-1',
          invoiceDate: '2026-10-20',
          invoice: interInvoice,
        },
      ]),
    ).toThrow(TypeError);
  });

  it('rejects an impossible calendar date', () => {
    for (const date of ['20-13-2026', '32-10-2026', '00-10-2026']) {
      expect(() =>
        toGstr1B2B({ gstin: '27AAPFU0939F1ZV', fp: '102026' }, [
          {
            buyerGstin: '07AAQCB4722F1ZQ',
            invoiceNumber: 'INV-1',
            invoiceDate: date,
            invoice: interInvoice,
          },
        ]),
      ).toThrow(TypeError);
    }
  });

  it('rejects a duplicate invoice number for the same buyer', () => {
    expect(() =>
      toGstr1B2B({ gstin: '27AAPFU0939F1ZV', fp: '102026' }, [
        {
          buyerGstin: '07AAQCB4722F1ZQ',
          invoiceNumber: 'INV-001',
          invoiceDate: '20-10-2026',
          invoice: interInvoice,
        },
        {
          buyerGstin: '07AAQCB4722F1ZQ',
          invoiceNumber: 'INV-001',
          invoiceDate: '21-10-2026',
          invoice: interInvoice,
        },
      ]),
    ).toThrow(TypeError);
  });
});

describe('paiseToRupees', () => {
  it('converts paise to the rupee decimal GSTN expects', () => {
    expect(paiseToRupees(paise(12345))).toBe(123.45);
    expect(paiseToRupees(paise(100))).toBe(1);
    expect(paiseToRupees(paise(5))).toBe(0.05);
    expect(paiseToRupees(paise(0))).toBe(0);
    expect(paiseToRupees(paise(11800))).toBe(118);
  });

  it('is exact for every two-digit remainder', () => {
    for (let remainder = 0; remainder < 100; remainder++) {
      const rupees = paiseToRupees(paise(100000 + remainder));
      expect(rupees).toBe(1000 + remainder / 100);
      expect(rupees.toFixed(2)).toBe((1000 + remainder / 100).toFixed(2));
    }
  });

  it('never leaks float artefacts into JSON', () => {
    for (let cents = 0; cents < 100; cents++) {
      const json = JSON.stringify(paiseToRupees(paise(cents)));
      expect(json).toMatch(/^\d+(\.\d{1,2})?$/);
    }
  });
});
