import { paise, type Paise } from './money.js';
import { quote } from './quote.js';

export type LineItem = {
  sellerStateCode: string;
  buyerStateCode: string;
  hsn: string;
  ratePercent: number;
  taxableAmountPaise: Paise;
  cessPercent?: number;
};

export type InvoiceLine = {
  hsn: string;
  ratePercent: number;
  taxableAmountPaise: Paise;
  cgst: Paise;
  sgst: Paise;
  igst: Paise;
  cess: Paise;
  total: Paise;
};

export type Invoice = {
  sellerStateCode: string;
  buyerStateCode: string;
  lines: InvoiceLine[];
  subtotal: Paise;
  totalCgst: Paise;
  totalSgst: Paise;
  totalIgst: Paise;
  totalCess: Paise;
  grandTotal: Paise;
};

export type InvoiceError = {
  code: 'MIXED_STATE_PAIR' | 'EMPTY_INVOICE' | 'VALIDATION_ERROR';
  message: string;
  field?: string;
};

export function createInvoice(
  items: LineItem[],
): { ok: true; invoice: Invoice } | { ok: false; error: InvoiceError } {
  if (items.length === 0) {
    return {
      ok: false,
      error: { code: 'EMPTY_INVOICE', message: 'invoice must have at least one line item' },
    };
  }

  const first = items[0]!;
  for (const item of items) {
    if (
      item.sellerStateCode !== first.sellerStateCode ||
      item.buyerStateCode !== first.buyerStateCode
    ) {
      return {
        ok: false,
        error: {
          code: 'MIXED_STATE_PAIR',
          message: `all lines must share one seller/buyer state pair; got ${item.sellerStateCode}/${item.buyerStateCode} after ${first.sellerStateCode}/${first.buyerStateCode}`,
          field: 'sellerStateCode',
        },
      };
    }
  }

  const lines: InvoiceLine[] = [];
  let subtotal = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;
  let totalCess = 0;

  for (const item of items) {
    const result = quote({
      sellerStateCode: item.sellerStateCode,
      buyerStateCode: item.buyerStateCode,
      hsn: item.hsn,
      ratePercent: item.ratePercent,
      taxableAmountPaise: item.taxableAmountPaise,
      cessPercent: item.cessPercent ?? 0,
    });

    if (!result.ok) {
      return {
        ok: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: result.error.message,
          field: result.error.field,
        },
      };
    }

    const r = result.result;
    lines.push({
      hsn: item.hsn,
      ratePercent: item.ratePercent,
      taxableAmountPaise: r.taxableAmountPaise,
      cgst: r.cgstPaise,
      sgst: r.sgstPaise,
      igst: r.igstPaise,
      cess: r.cessPaise,
      total: r.totalPaise,
    });

    subtotal += r.taxableAmountPaise;
    totalCgst += r.cgstPaise;
    totalSgst += r.sgstPaise;
    totalIgst += r.igstPaise;
    totalCess += r.cessPaise;
  }

  return {
    ok: true,
    invoice: {
      sellerStateCode: first.sellerStateCode,
      buyerStateCode: first.buyerStateCode,
      lines,
      subtotal: paise(subtotal),
      totalCgst: paise(totalCgst),
      totalSgst: paise(totalSgst),
      totalIgst: paise(totalIgst),
      totalCess: paise(totalCess),
      grandTotal: paise(subtotal + totalCgst + totalSgst + totalIgst + totalCess),
    },
  };
}
