import { paise, Paise } from './money.js';
import { roundHalfUp } from './round.js';

export type TaxSplit = {
  cgst: Paise;
  sgst: Paise;
  igst: Paise;
  cess: Paise;
};

export function split(
  taxableAmountPaise: Paise,
  ratePercent: number,
  isIntraState: boolean,
  cessPercent: number = 0,
): TaxSplit {
  if (ratePercent < 0 || ratePercent > 100) {
    throw new RangeError(`Invalid rate: ${ratePercent}`);
  }

  const totalTax = roundHalfUp((taxableAmountPaise * ratePercent) / 100);
  const cessAmount = paise(roundHalfUp((taxableAmountPaise * cessPercent) / 100));

  if (isIntraState) {
    // When odd paise remainder, CGST gets the extra 1 paise (documented in docs/rounding.md)
    const half = Math.floor(totalTax / 2);
    const remainder = totalTax % 2;
    return {
      cgst: paise(half + remainder),
      sgst: paise(half),
      igst: paise(0),
      cess: cessAmount,
    };
  } else {
    return {
      cgst: paise(0),
      sgst: paise(0),
      igst: paise(totalTax),
      cess: cessAmount,
    };
  }
}
