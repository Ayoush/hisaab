import type { Invoice } from './invoice.js';
import { paiseToRupees } from './money.js';

// GSTR-1 B2B serialiser.
// Field names follow the GSTN GSTR-1 B2B schema: gstin, fp, b2b[].ctin,
// b2b[].inv[].{inum,idt,val,pos,rchrg,inv_typ,itms}, itms[].itm_det.{rt,txval,iamt,camt,samt,csamt}.
//
// GSTN expects amounts in rupees with two decimals, while hisaab works in
// integer paise, so every amount is converted at this boundary.

export type Gstr1ItemDetail = {
  rt: number;
  txval: number;
  iamt: number;
  camt: number;
  samt: number;
  csamt: number;
};

export type Gstr1Item = {
  num: number;
  itm_det: Gstr1ItemDetail;
};

export type Gstr1Invoice = {
  inum: string;
  idt: string;
  val: number;
  pos: string;
  rchrg: 'Y' | 'N';
  inv_typ: 'R';
  itms: Gstr1Item[];
};

export type Gstr1B2BEntry = {
  ctin: string;
  inv: Gstr1Invoice[];
};

export type Gstr1B2B = {
  gstin: string;
  fp: string;
  b2b: Gstr1B2BEntry[];
};

/** A domain invoice plus the GSTR-1 identity the domain model does not hold. */
export type Gstr1InvoiceInput = {
  buyerGstin: string;
  invoiceNumber: string;
  /** GSTN date format: dd-MM-yyyy */
  invoiceDate: string;
  invoice: Invoice;
};

export type Gstr1Options = {
  /** Seller GSTIN */
  gstin: string;
  /** Filing period, MMYYYY */
  fp: string;
};

const GSTIN_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const FP_PATTERN = /^(0[1-9]|1[0-2])[0-9]{4}$/;
const DATE_PATTERN = /^([0-9]{2})-([0-9]{2})-([0-9]{4})$/;

function isValidGstnDate(value: string): boolean {
  const match = DATE_PATTERN.exec(value);
  if (!match) return false;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  // GST became effective 01-07-2017.
  if (year < 2017 || (year === 2017 && month < 7)) return false;
  return true;
}

/**
 * Serialise invoices into a GSTR-1 B2B document.
 *
 * The caller is responsible for passing only invoices belonging to the
 * filing period `fp`; amendments and out-of-period invoices are reported
 * in the separate b2ba/cdnr sections, which hisaab does not model.
 */
export function toGstr1B2B(options: Gstr1Options, invoices: Gstr1InvoiceInput[]): Gstr1B2B {
  if (!GSTIN_PATTERN.test(options.gstin)) {
    throw new TypeError(`Invalid seller GSTIN: ${options.gstin}`);
  }
  if (!FP_PATTERN.test(options.fp)) {
    throw new TypeError(`Invalid filing period (expected MMYYYY): ${options.fp}`);
  }

  const byBuyer = new Map<string, Gstr1Invoice[]>();
  const seenNumbers = new Set<string>();

  for (const input of invoices) {
    if (!GSTIN_PATTERN.test(input.buyerGstin)) {
      throw new TypeError(`Invalid buyer GSTIN: ${input.buyerGstin}`);
    }
    if (!isValidGstnDate(input.invoiceDate)) {
      throw new TypeError(`Invalid invoice date (expected dd-MM-yyyy): ${input.invoiceDate}`);
    }
    const uniqueKey = `${input.buyerGstin}|${input.invoiceNumber}`;
    if (seenNumbers.has(uniqueKey)) {
      throw new TypeError(
        `Duplicate invoice number "${input.invoiceNumber}" for buyer ${input.buyerGstin}`,
      );
    }
    seenNumbers.add(uniqueKey);

    const existing = byBuyer.get(input.buyerGstin);
    if (existing) {
      existing.push(toGstr1Invoice(input));
    } else {
      byBuyer.set(input.buyerGstin, [toGstr1Invoice(input)]);
    }
  }

  const b2b: Gstr1B2BEntry[] = [];
  for (const [ctin, inv] of byBuyer) {
    b2b.push({ ctin, inv });
  }

  return { gstin: options.gstin, fp: options.fp, b2b };
}

function toGstr1Invoice(input: Gstr1InvoiceInput): Gstr1Invoice {
  const inv = input.invoice;
  return {
    inum: input.invoiceNumber,
    idt: input.invoiceDate,
    val: paiseToRupees(inv.grandTotal),
    // Place of supply is the buyer's state (GST Sec 10(1)(a) for goods,
    // 10(2) for services). The Sec 10(3)(a) office/agent exception is
    // not modelled by hisaab.
    pos: inv.buyerStateCode,
    rchrg: 'N',
    inv_typ: 'R',
    itms: inv.lines.map((line, index) => ({
      num: index + 1,
      itm_det: {
        rt: line.ratePercent,
        txval: paiseToRupees(line.taxableAmountPaise),
        iamt: paiseToRupees(line.igst),
        camt: paiseToRupees(line.cgst),
        samt: paiseToRupees(line.sgst),
        csamt: paiseToRupees(line.cess),
      },
    })),
  };
}
