import { describe, it, expect } from 'vitest';
import { generateIrn, irnHashInput, financialYear } from './irn.js';

// The worked example from the GSTN IRN specification: supplier GSTIN
// 01AAAAA9999A19N, invoice number ABC01234 dated 12.12.2019.
const SPEC_GSTIN = '01AAAAA9999A19N';
const SPEC_DOC_NUM = 'ABC01234';
const SPEC_DATE = '12/12/2019';
const SPEC_IRN = '353c2677715ae97aa876a37262a38381a75c1d1184f6a803f703bb395971925f';

describe('generateIrn — specification vector', () => {
  it('produces the IRN from the GSTN worked example', () => {
    expect(generateIrn(SPEC_GSTIN, 'INV', SPEC_DOC_NUM, SPEC_DATE)).toBe(SPEC_IRN);
  });

  it('returns a 64 character lowercase hex string', () => {
    const irn = generateIrn(SPEC_GSTIN, 'INV', SPEC_DOC_NUM, SPEC_DATE);
    expect(irn).toMatch(/^[0-9a-f]{64}$/);
    expect(irn).toHaveLength(64);
  });

  it('hashes GSTIN + financial year + doc type + doc number with no separator', () => {
    expect(irnHashInput(SPEC_GSTIN, 'INV', SPEC_DOC_NUM, SPEC_DATE)).toBe(
      '01AAAAA9999A19N2019-20INVABC01234',
    );
  });
});

describe('financialYear', () => {
  it('runs from 1 April to 31 March', () => {
    expect(financialYear('01/04/2019')).toBe('2019-20');
    expect(financialYear('31/12/2019')).toBe('2019-20');
    expect(financialYear('31/03/2020')).toBe('2019-20');
  });

  it('treats January as part of the previous financial year', () => {
    expect(financialYear('03/01/2020')).toBe('2019-20');
  });

  it('starts a new financial year on 1 April', () => {
    expect(financialYear('01/04/2020')).toBe('2020-21');
    expect(financialYear('15/08/2026')).toBe('2026-27');
    expect(financialYear('31/12/2025')).toBe('2025-26');
  });
});

describe('generateIrn — uniqueness', () => {
  it('gives a different IRN for a different document type', () => {
    expect(generateIrn(SPEC_GSTIN, 'CRN', SPEC_DOC_NUM, SPEC_DATE)).not.toBe(
      generateIrn(SPEC_GSTIN, 'INV', SPEC_DOC_NUM, SPEC_DATE),
    );
  });

  it('gives a different IRN for a different document number', () => {
    expect(generateIrn(SPEC_GSTIN, 'INV', 'ABC01235', SPEC_DATE)).not.toBe(
      generateIrn(SPEC_GSTIN, 'INV', SPEC_DOC_NUM, SPEC_DATE),
    );
  });

  it('gives a different IRN for the same document number in another financial year', () => {
    expect(generateIrn(SPEC_GSTIN, 'INV', SPEC_DOC_NUM, '12/12/2020')).not.toBe(
      generateIrn(SPEC_GSTIN, 'INV', SPEC_DOC_NUM, SPEC_DATE),
    );
  });

  it('gives a different IRN for a different supplier', () => {
    expect(generateIrn('27AAPFU0939F1ZV', 'INV', SPEC_DOC_NUM, SPEC_DATE)).not.toBe(
      generateIrn(SPEC_GSTIN, 'INV', SPEC_DOC_NUM, SPEC_DATE),
    );
  });

  it('is deterministic', () => {
    const first = generateIrn(SPEC_GSTIN, 'INV', SPEC_DOC_NUM, SPEC_DATE);
    const second = generateIrn(SPEC_GSTIN, 'INV', SPEC_DOC_NUM, SPEC_DATE);
    expect(first).toBe(second);
  });
});

describe('generateIrn — validation', () => {
  it('rejects an invalid document type', () => {
    expect(() => generateIrn(SPEC_GSTIN, 'XXX', SPEC_DOC_NUM, SPEC_DATE)).toThrow(TypeError);
  });

  it('rejects a document number starting with 0', () => {
    expect(() => generateIrn(SPEC_GSTIN, 'INV', '0ABC1234', SPEC_DATE)).toThrow(TypeError);
  });

  it('rejects a document number longer than 16 characters', () => {
    expect(() => generateIrn(SPEC_GSTIN, 'INV', 'A'.repeat(17), SPEC_DATE)).toThrow(TypeError);
  });

  it('rejects a document number starting with / or -', () => {
    expect(() => generateIrn(SPEC_GSTIN, 'INV', '/ABC1234', SPEC_DATE)).toThrow(TypeError);
    expect(() => generateIrn(SPEC_GSTIN, 'INV', '-ABC1234', SPEC_DATE)).toThrow(TypeError);
  });

  it('accepts a document number using / and - after the first character', () => {
    expect(() => generateIrn(SPEC_GSTIN, 'INV', 'A/1-2019', SPEC_DATE)).not.toThrow();
  });

  it('rejects an impossible calendar date', () => {
    expect(() => generateIrn(SPEC_GSTIN, 'INV', SPEC_DOC_NUM, '31/02/2026')).toThrow(TypeError);
  });

  it('rejects a malformed date', () => {
    expect(() => generateIrn(SPEC_GSTIN, 'INV', SPEC_DOC_NUM, '2019-12-12')).toThrow(TypeError);
  });

  it('rejects an invalid GSTIN', () => {
    expect(() => generateIrn('01AAAAA9999A19', 'INV', SPEC_DOC_NUM, SPEC_DATE)).toThrow(TypeError);
  });
});
