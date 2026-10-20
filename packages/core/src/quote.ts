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
  code: 'UNKNOWN_SELLER_STATE' | 'UNKNOWN_BUYER_STATE' | 'VALIDATION_ERROR';
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
      error: {
        code: 'UNKNOWN_SELLER_STATE',
        message: `Unknown seller state: ${input.sellerStateCode}`,
        field: 'sellerStateCode',
      },
    };
  }

  const buyer = lookupState(input.buyerStateCode);
  if (!buyer) {
    return {
      ok: false,
      error: {
        code: 'UNKNOWN_BUYER_STATE',
        message: `Unknown buyer state: ${input.buyerStateCode}`,
        field: 'buyerStateCode',
      },
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

/** Represents a successfully parsed and validated CSV invoice record. */
export type Invoice = {
  invoiceNumber: string;
  invoiceDate: string;
  sellerStateCode: string;
  buyerStateCode: string;
  hsn: string;
  ratePercent: number;
  taxableAmountPaise: Paise;
  cessPercent?: number;
};

/** Represents a parsing or validation error encountered while processing a CSV invoice record. */
export type ParseError = {
  type: 'HEADER_ERROR' | 'ROW_ERROR';
  rowIndex?: number;
  column?: string;
  message: string;
  rawRow?: string[];
};

/**
 * CSV  tokenizer that converts a Web `ReadableStream` into an async iterable of record arrays (`string[]`).
 */
async function* readRecords_CSV(
  stream: ReadableStream<Uint8Array>
): AsyncIterable<string[]> {
  const reader = stream.getReader();
  const decoder = new TextDecoder('utf-8');

  // Tokenizer State
  let field = '';           // Current field buffer
  let row: string[] = [];   // Accumulated fields for current record
  let quoted = false;       // Inside a "quoted string"
  let pendingQuote = false; // Seen double-quote character, awaiting escape check
  let skipLF = false;       // Seen \r, waiting to absorb optional \n

  /** Flushes current field accumulator to current row array */
  const flushField = () => {
    row.push(field);
    field = '';
  };

  /** Flushes field, captures row record, and clears row buffer */
  const pushRow = (): string[] => {
    flushField();
    const record = row;
    row = [];
    return record;
  };

  try {
    while (true) {
      const { value, done } = await reader.read();

      // Stream has ended, flush any remaining buffered data
      if (done) {
        // Decode any lingering multi-byte characters left in decoder buffer
        const finalChunk = decoder.decode();
        for (const char of finalChunk) {
          if (skipLF) {
            skipLF = false;
            if (char === '\n') continue;
          }

          if (pendingQuote) {
            pendingQuote = false;
            if (char === '"') {
              field += '"';
              continue;
            }
            quoted = false;
          }

          if (quoted) {
            if (char === '"') pendingQuote = true;
            else field += char;
            continue;
          } else if (char === '"' && field.length === 0) {
            quoted = true;
            continue;
          }

          if (char === ',') {
            flushField();
          } else if (char === '\n' || char === '\r') {
            yield pushRow();
            if (char === '\r') skipLF = true;
          } else {
            field += char;
          }
        }

        // Clean up unclosed trailing quotes
        if (pendingQuote) {
          quoted = false;
          pendingQuote = false;
        }

        // Throw error on unterminated open quote at EOF
        if (quoted) {
          throw new Error('Unterminated quoted CSV field at end of stream');
        }

        // Yield final record if non-empty
        if (field.length > 0 || row.length > 0) {
          yield pushRow();
        }
        break;
      }

      // Chunk processing: decode bytes into string and process character by character
      const chunk = decoder.decode(value, { stream: true });

      for (const char of chunk) {
        // Skip \n immediately following a \r (Windows line-ending)
        if (skipLF) {
          skipLF = false;
          if (char === '\n') continue;
        }

        // Handle quote escape sequences ("") vs end of quote
        if (pendingQuote) {
          pendingQuote = false;
          if (char === '"') {
            field += '"'; // Escaped quote inside quoted field
            continue;
          }
          quoted = false; // Quoted field closed
        }

        // Character inside open quoted field
        if (quoted) {
          if (char === '"') {
            pendingQuote = true;
          } else {
            field += char;
          }
          continue;
        } 
        // Opening quote at beginning of field
        else if (char === '"' && field.length === 0) {
          quoted = true;
          continue;
        }

        // Unquoted context delimiters and newlines
        if (char === ',') {
          flushField();
        } else if (char === '\n' || char === '\r') {
          yield pushRow();
          if (char === '\r') skipLF = true;
        } else {
          field += char;
        }
      }
    }
  } finally {
    // Release reader lock when consumer stops or throws
    reader.releaseLock();
  }
}

/**
 * Parses a stream of CSV chunks into valid `Invoice` objects or `ParseError` objects.
 */
export async function* parseInvoiceCSV(
  stream: ReadableStream<Uint8Array>
): AsyncIterable<Invoice | ParseError> {
  const recordIterator = readRecords_CSV(stream);

  let headerMap: Map<string, number> | null = null;
  let rowIndex = 0;

  for await (const record of recordIterator) {
    rowIndex++;

    // Ignore empty lines
    if (record.length === 0 || (record.length === 1 && record[0].trim() === '')) {
      continue;
    }

    // Process Header Row
    if (!headerMap) {
      headerMap = new Map();
      record.forEach((col, idx) => {
        headerMap!.set(col.trim().toLowerCase(), idx);
      });

      const requiredColumns = [
        'invoicenumber',
        'invoicedate',
        'sellerstatecode',
        'buyerstatecode',
        'hsn',
        'ratepercent',
        'taxableamountpaise',
      ];

      const missing = requiredColumns.filter((col) => !headerMap!.has(col));
      if (missing.length > 0) {
        yield {
          type: 'HEADER_ERROR',
          message: `Missing required header columns: ${missing.join(', ')}`,
        };
        return;
      }
      continue;
    }

    // Extraction Helper
    const getValue = (colName: string): string => {
      const idx = headerMap!.get(colName.toLowerCase());
      return idx !== undefined && idx < record.length ? record[idx].trim() : '';
    };

    const rawInvoiceNumber = getValue('invoicenumber');
    const rawInvoiceDate = getValue('invoicedate');
    const rawSellerState = getValue('sellerstatecode');
    const rawBuyerState = getValue('buyerstatecode');
    const rawHsn = getValue('hsn');
    const rawRate = getValue('ratepercent');
    const rawTaxableAmount = getValue('taxableamountpaise');
    const rawCess = getValue('cesspercent');

    // Field Validations
    if (!rawInvoiceNumber) {
      yield {
        type: 'ROW_ERROR',
        rowIndex,
        column: 'invoiceNumber',
        message: 'Invoice number is required',
        rawRow: record,
      };
      continue;
    }

    // Validate invoiceDate format (YYYY-MM-DD)
    const ratePercent = parseFloat(rawRate);
    if (isNaN(ratePercent)) {
      yield {
        type: 'ROW_ERROR',
        rowIndex,
        column: 'ratePercent',
        message: `Invalid ratePercent: "${rawRate}"`,
        rawRow: record,
      };
      continue;
    }

    // Validate taxableAmountPaise as a safe integer
    if (!/^\d+$/.test(rawTaxableAmount)) {
      yield {
        type: 'ROW_ERROR',
        rowIndex,
        column: 'taxableAmountPaise',
        message: `Invalid taxableAmountPaise: "${rawTaxableAmount}"`,
        rawRow: record,
      };
      continue;
    }

    // Validate that taxableAmountPaise is a safe integer
    const taxableAmountNumber = Number(rawTaxableAmount);
    if (!Number.isSafeInteger(taxableAmountNumber)) {
      yield {
        type: 'ROW_ERROR',
        rowIndex,
        column: 'taxableAmountPaise',
        message: `taxableAmountPaise exceeds safe integer limits: "${rawTaxableAmount}"`,
        rawRow: record,
      };
      continue;
    }

    // Validate cessPercent if provided
    let cessPercent: number | undefined = undefined;
    if (rawCess !== '') {
      cessPercent = parseFloat(rawCess);
      if (isNaN(cessPercent)) {
        yield {
          type: 'ROW_ERROR',
          rowIndex,
          column: 'cessPercent',
          message: `Invalid cessPercent: "${rawCess}"`,
          rawRow: record,
        };
        continue;
      }
    }

    const invoice: Invoice = {
      invoiceNumber: rawInvoiceNumber,
      invoiceDate: rawInvoiceDate,
      sellerStateCode: rawSellerState,
      buyerStateCode: rawBuyerState,
      hsn: rawHsn,
      ratePercent,
      taxableAmountPaise: paise(taxableAmountNumber),
      ...(cessPercent !== undefined ? { cessPercent } : {}),
    };

    yield invoice;
  }
}