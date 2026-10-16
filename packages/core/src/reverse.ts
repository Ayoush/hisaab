import { paise, type Paise } from './money.js';
import { roundHalfUp } from './round.js';
import { split } from './split.js';

export type ReverseTaxResult = {
  taxable: Paise;
  cgst: Paise;
  sgst: Paise;
  igst: Paise;
};

const SEARCH_RADIUS = 5;

function forwardTotal(taxable: number, ratePercent: number): number {
  return taxable + roundHalfUp((taxable * ratePercent) / 100);
}

export function reverseCalculate(
  grossAmountPaise: Paise,
  ratePercent: number,
  isIntraState: boolean,
): ReverseTaxResult {
  if (ratePercent < 0 || ratePercent > 100) {
    throw new RangeError(`Invalid rate: ${ratePercent}`);
  }

  const divisor = 100 + ratePercent;
  const estimate = roundHalfUp((grossAmountPaise * 100) / divisor);

  const offsets = [0];
  for (let d = 1; d <= SEARCH_RADIUS; d++) {
    offsets.push(d, -d);
  }

  for (const d of offsets) {
    const candidate = estimate + d;
    if (candidate < 0) continue;
    if (forwardTotal(candidate, ratePercent) === grossAmountPaise) {
      const taxes = split(paise(candidate), ratePercent, isIntraState, 0);
      return {
        taxable: paise(candidate),
        cgst: taxes.cgst,
        sgst: taxes.sgst,
        igst: taxes.igst,
      };
    }
  }

  throw new RangeError(
    `No taxable amount maps to gross ${grossAmountPaise} at rate ${ratePercent}`,
  );
}
