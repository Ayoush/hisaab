export type ValidationError = {
  field: string;
  message: string;
  code: 'NEGATIVE_QUANTITY' | 'INVALID_RATE';
};

export function validateLineItem(input: {
  quantity: number;
  ratePercent: number;
}): ValidationError[] {
  const errors: ValidationError[] = [];

  if (input.quantity < 0) {
    errors.push({
      field: 'quantity',
      message: `quantity must be non-negative, got ${input.quantity}`,
      code: 'NEGATIVE_QUANTITY',
    });
  }

  if (input.ratePercent < 0 || input.ratePercent > 100) {
    errors.push({
      field: 'ratePercent',
      message: `ratePercent must be between 0 and 100, got ${input.ratePercent}`,
      code: 'INVALID_RATE',
    });
  }

  return errors;
}
