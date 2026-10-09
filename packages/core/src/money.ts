// All monetary values are integers in paise. 1 INR = 100 paise.
// Never use floating-point for money: 0.1 + 0.2 !== 0.3 in IEEE 754.

export type Paise = number & { readonly __brand: 'Paise' };

export function paise(n: number): Paise {
  if (!Number.isInteger(n)) {
    throw new TypeError(`Expected integer paise, got ${n}`);
  }
  return n as Paise;
}

export function paiseToBigDecimalString(p: Paise): string {
  const abs = Math.abs(p);
  const rupees = Math.floor(abs / 100);
  const cents = abs % 100;
  const sign = p < 0 ? '-' : '';
  return `${sign}${rupees}.${cents.toString().padStart(2, '0')}`;
}
