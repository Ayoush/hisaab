import { createHash } from 'node:crypto';

// Invoice Reference Number (IRN) generation, as per the GSTN e-invoice
// specification.
//
// The IRN is a 64 character SHA-256 hash of
//   Supplier GSTIN + Financial Year + Document Type + Document Number
// concatenated with NO separator, e.g.
//   01AAAAA9999A19N2019-20INVABC01234
//
// The financial year (April to March, written YYYY-YY) is derived from the
// document date, so 03.01.2020 belongs to financial year 2019-20.
//
// See docs/e-invoice.md.

export type EInvoiceDocType = 'INV' | 'CRN' | 'DBN';

// The e-invoice schema validates the supplier GSTIN as
// ^[0-9]{2}[0-9A-Z]{13}$ (pattern on SellerDtls.Gstin), which is looser than
// the canonical GSTIN structure used elsewhere in hisaab. The IRN is a hash
// of the value as the IRP sees it, so the schema pattern is the one applied.
const GSTIN_PATTERN = /^[0-9]{2}[0-9A-Z]{13}$/;
const DOC_TYPE_VALUES: readonly string[] = ['INV', 'CRN', 'DBN'];
const DOC_NUM_PATTERN = /^[a-zA-Z1-9][a-zA-Z0-9/-]{0,15}$/;
const DATE_PATTERN = /^([0-9]{2})\/([0-9]{2})\/([0-9]{4})$/;

function parseDocDate(docDate: string): { day: number; month: number; year: number } {
  const match = DATE_PATTERN.exec(docDate.trim());
  if (!match) {
    throw new TypeError(`Invalid document date (expected DD/MM/YYYY): ${docDate}`);
  }
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (month < 1 || month > 12) {
    throw new TypeError(`Invalid document date: ${docDate}`);
  }
  if (day < 1 || day > 31) {
    throw new TypeError(`Invalid document date: ${docDate}`);
  }
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  if (day > daysInMonth) {
    throw new TypeError(`Invalid document date: ${docDate}`);
  }
  return { day, month, year };
}

/**
 * Financial year of a document date, as GSTN writes it.
 * The financial year runs 1 April to 31 March and is written "YYYY-YY",
 * so 03.01.2020 belongs to 2019-20 and 01.04.2020 to 2020-21.
 */
export function financialYear(docDate: string): string {
  const { month, year } = parseDocDate(docDate);
  const start = month >= 4 ? year : year - 1;
  return `${start}-${String(start + 1).slice(2)}`;
}

/**
 * The exact string that is hashed to produce an IRN.
 * Exported so the construction can be audited without re-hashing.
 */
export function irnHashInput(
  gstin: string,
  docType: string,
  docNum: string,
  docDate: string,
): string {
  const supplierGstin = gstin.trim();
  const docNumber = docNum.trim();
  const type = docType.trim().toUpperCase();

  if (!GSTIN_PATTERN.test(supplierGstin)) {
    throw new TypeError(`Invalid GSTIN: ${gstin}`);
  }
  if (!DOC_TYPE_VALUES.includes(type)) {
    throw new TypeError(`Invalid document type (expected INV, CRN or DBN): ${docType}`);
  }
  if (!DOC_NUM_PATTERN.test(docNumber)) {
    throw new TypeError(
      `Invalid document number (1-16 chars, cannot start with 0, / or -): ${docNum}`,
    );
  }

  return `${supplierGstin}${financialYear(docDate)}${type}${docNumber}`;
}

/**
 * Generate the Invoice Reference Number for an e-invoice.
 *
 * The IRP issues the IRN when it registers an invoice; this reproduces the
 * same hash so a received IRN can be verified, or pre-checked before upload.
 * It does not register anything — see docs/e-invoice.md.
 */
export function generateIrn(
  gstin: string,
  docType: string,
  docNum: string,
  docDate: string,
): string {
  const input = irnHashInput(gstin, docType, docNum, docDate);
  return createHash('sha256').update(input).digest('hex');
}
