import { paise, Paise } from './money.js';
import { split } from './split.js';
import { lookupState, isIntraState } from './states.js';

export type QuoteInput = {
  sellerStateCode: string;
  buyerStateCode: string;
  hsn: string;
  ratePercent: number;
  taxableAmountPaise: Paise;
  cessPercent?: number;
};

export type QuoteResult = {
  taxableAmountPaise: Paise;
  cgstPaise: Paise;
  sgstPaise: Paise;
  igstPaise: Paise;
  cessPaise: Paise;
  totalPaise: Paise;
};

export type QuoteError = {
  code: 'UNKNOWN_STATE' | 'VALIDATION_ERROR';
  message: string;
  field?: string;
};

export function quote(
  input: QuoteInput,
): { ok: true; result: QuoteResult } | { ok: false; error: QuoteError } {
  const seller = lookupState(input.sellerStateCode);
  if (!seller) {
    return {
      ok: false,
      error: { code: 'UNKNOWN_STATE', message: `Unknown seller state: ${input.sellerStateCode}`, field: 'sellerStateCode' },
    };
  }

  const buyer = lookupState(input.buyerStateCode);
  if (!buyer) {
    return {
      ok: false,
      error: { code: 'UNKNOWN_STATE', message: `Unknown buyer state: ${input.buyerStateCode}`, field: 'buyerStateCode' },
    };
  }

  const intra = isIntraState(input.sellerStateCode, input.buyerStateCode);
  const taxes = split(input.taxableAmountPaise, input.ratePercent, intra, input.cessPercent ?? 0);

  const totalPaise = paise(
    input.taxableAmountPaise + taxes.cgst + taxes.sgst + taxes.igst + taxes.cess,
  );

  return {
    ok: true,
    result: {
      taxableAmountPaise: input.taxableAmountPaise,
      cgstPaise: taxes.cgst,
      sgstPaise: taxes.sgst,
      igstPaise: taxes.igst,
      cessPaise: taxes.cess,
      totalPaise,
    },
  };
}
