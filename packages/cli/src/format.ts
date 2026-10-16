import { paiseToBigDecimalString } from '@hisaab/core';
import type { QuoteResult } from '@hisaab/core';

export function toJsonPayload(r: QuoteResult): {
  taxable: number;
  cgst: number;
  sgst: number;
  igst: number;
  cess: number;
  total: number;
} {
  return {
    taxable: r.taxableAmountPaise,
    cgst: r.cgstPaise,
    sgst: r.sgstPaise,
    igst: r.igstPaise,
    cess: r.cessPaise,
    total: r.totalPaise,
  };
}

export function toHumanLines(scenarioId: string, r: QuoteResult): string {
  return [
    `Scenario: ${scenarioId}`,
    `Taxable: ${paiseToBigDecimalString(r.taxableAmountPaise)}`,
    `CGST: ${paiseToBigDecimalString(r.cgstPaise)}`,
    `SGST: ${paiseToBigDecimalString(r.sgstPaise)}`,
    `IGST: ${paiseToBigDecimalString(r.igstPaise)}`,
    `Cess: ${paiseToBigDecimalString(r.cessPaise)}`,
    `Total: ${paiseToBigDecimalString(r.totalPaise)}`,
  ].join('\n');
}
