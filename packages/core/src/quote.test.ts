import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import { quote } from './quote.js';
import { paise } from './money.js';
import type { QuoteError } from './index.js';

describe('quote — unknown state codes', () => {
  it("unknown seller '00' returns UNKNOWN_SELLER_STATE", () => {
    const result = quote({
      sellerStateCode: '00',
      buyerStateCode: '27',
      hsn: '8471',
      ratePercent: 18,
      taxableAmountPaise: paise(10000),
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    const err = result.error as QuoteError;
    expect(err.code).toBe('UNKNOWN_SELLER_STATE');
  });

  it("unknown buyer '00' returns UNKNOWN_BUYER_STATE", () => {
    const result = quote({
      sellerStateCode: '27',
      buyerStateCode: '00',
      hsn: '8471',
      ratePercent: 18,
      taxableAmountPaise: paise(10000),
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    const err = result.error as QuoteError;
    expect(err.code).toBe('UNKNOWN_BUYER_STATE');
  });

  it('valid intra-state quote still succeeds', () => {
    const result = quote({
      sellerStateCode: '27',
      buyerStateCode: '27',
      hsn: '8471',
      ratePercent: 18,
      taxableAmountPaise: paise(10000),
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.result.cgstPaise).toBe(900);
    expect(result.result.totalPaise).toBe(11800);
  });
});



import { createReadStream } from 'node:fs';
import { writeFile, unlink } from 'node:fs/promises';
import { Readable } from 'node:stream';
import { join } from 'node:path';
import { parseInvoiceCSV, type Invoice, type ParseError } from './quote.js';


// STREAM TEST HELPERS

/**
 * Converts a string into a chunked ReadableStream<Uint8Array> to simulate
 * streaming network/file chunks across arbitrary byte boundaries.
 */
function createStreamFromString(input: string, chunkSize = 16): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(input);

  return new ReadableStream({
    start(controller) {
      for (let i = 0; i < bytes.length; i += chunkSize) {
        controller.enqueue(bytes.subarray(i, i + chunkSize));
      }
      controller.close();
    },
  });
}

/**
 * Drains an async iterable stream generator into an array for testing assertions.
 */
async function collectStreamResults(stream: ReadableStream<Uint8Array>) {
  const results: Array<Invoice | ParseError> = [];
  for await (const item of parseInvoiceCSV(stream)) {
    results.push(item);
  }
  return results;
}


// UNIT & FUNCTIONAL TESTS


describe('parseInvoiceCSV - Unit & Functional Tests', () => {
  const validHeader =
    'invoiceNumber,invoiceDate,sellerStateCode,buyerStateCode,hsn,ratePercent,taxableAmountPaise,cessPercent\n';

  // 1. Happy Path / Unit Tests
  // Happy path tests ensure that the parser correctly handles valid CSV input, including edge cases like quoted fields and escaped quotes.

  describe('Happy Path Parsing', () => {
    it('parses valid CSV rows correctly across stream chunks', async () => {
      const csvContent =
        validHeader +
        'INV-001,2026-03-31,27,27,998311,18,100000,1.5\n' +
        'INV-002,2026-04-01,27,07,998312,12,50000,\n';

      const stream = createStreamFromString(csvContent, 8); // Small 8-byte chunks
      const results = await collectStreamResults(stream);

      expect(results).toHaveLength(2);

      const first = results[0] as Invoice;
      expect(first.invoiceNumber).toBe('INV-001');
      expect(first.ratePercent).toBe(18);
      expect(first.taxableAmountPaise).toBe(100000);
      expect(first.cessPercent).toBe(1.5);

      const second = results[1] as Invoice;
      expect(second.invoiceNumber).toBe('INV-002');
      expect(second.cessPercent).toBeUndefined();
    });
  });


  // 2. Edge Case Tests (Format & RFC 4180 Specification)

  describe('Edge Cases & Specification Handling', () => {
    it('handles quoted fields and escaped quotes within fields', async () => {
      const csvContent =
        validHeader +
        '"INV-""SPECIAL""-003",2026-04-02,27,27,"998,311",18,200000,0\n';

      const stream = createStreamFromString(csvContent, 10);
      const results = await collectStreamResults(stream);

      expect(results).toHaveLength(1);
      const invoice = results[0] as Invoice;
      expect(invoice.invoiceNumber).toBe('INV-"SPECIAL"-003');
      expect(invoice.hsn).toBe('998,311');
    });

    it('correctly handles mixed CRLF (\\r\\n) and LF (\\n) line endings', async () => {
      const csvContent =
        validHeader.replace('\n', '\r\n') +
        'INV-001,2026-03-31,27,27,998311,18,100000,0\r\n' +
        'INV-002,2026-04-01,27,07,998312,12,50000,0\n';

      const stream = createStreamFromString(csvContent, 5);
      const results = await collectStreamResults(stream);

      expect(results).toHaveLength(2);
      expect((results[0] as Invoice).invoiceNumber).toBe('INV-001');
      expect((results[1] as Invoice).invoiceNumber).toBe('INV-002');
    });
  });


  // 3. Error Handling & Validation Tests

  describe('Error Handling & Row-Level Validation', () => {
    it('yields HEADER_ERROR and stops when required columns are missing', async () => {
      const invalidHeader = 'invoiceNumber,invoiceDate,sellerStateCode\nINV-001,2026-03-31,27\n';
      const stream = createStreamFromString(invalidHeader);

      const results = await collectStreamResults(stream);

      expect(results).toHaveLength(1);
      const error = results[0] as ParseError;
      expect(error.type).toBe('HEADER_ERROR');
      expect(error.message).toContain('Missing required header columns');
    });

    it('yields ROW_ERROR for missing required row fields and continues to next row', async () => {
      const csvContent =
        validHeader +
        ',2026-03-31,27,27,998311,18,100000,\n' + // Missing invoiceNumber
        'INV-002,2026-04-01,27,07,998312,12,50000,\n'; // Valid

      const stream = createStreamFromString(csvContent);
      const results = await collectStreamResults(stream);

      expect(results).toHaveLength(2);

      const firstError = results[0] as ParseError;
      expect(firstError.type).toBe('ROW_ERROR');
      expect(firstError.rowIndex).toBe(2);
      expect(firstError.column).toBe('invoiceNumber');

      const secondInvoice = results[1] as Invoice;
      expect(secondInvoice.invoiceNumber).toBe('INV-002');
    });

    it('yields ROW_ERROR when numeric fields fail parsing', async () => {
      const csvContent =
        validHeader +
        'INV-001,2026-03-31,27,27,998311,EIGHTEEN,100000,\n' + // Invalid ratePercent
        'INV-002,2026-03-31,27,27,998311,18,INVALID_PAISE,\n'; // Invalid taxableAmountPaise

      const stream = createStreamFromString(csvContent);
      const results = await collectStreamResults(stream);

      expect(results).toHaveLength(2);

      const err1 = results[0] as ParseError;
      expect(err1.type).toBe('ROW_ERROR');
      expect(err1.column).toBe('ratePercent');

      const err2 = results[1] as ParseError;
      expect(err2.type).toBe('ROW_ERROR');
      expect(err2.column).toBe('taxableAmountPaise');
    });
  });
});


// INTEGRATION & PERFORMANCE BENCHMARKS

describe('parseInvoiceCSV - Integration & Memory Benchmark', () => {
  const filePath = join(__dirname, '1mb_test_invoices.csv');
  const targetSizeBytes = 1 * 1024 * 1024; // 1 MB

  beforeAll(async () => {
    const header =
      'invoiceNumber,invoiceDate,sellerStateCode,buyerStateCode,hsn,ratePercent,taxableAmountPaise,cessPercent\n';
    let fileContent = header;
    let index = 1;

    // Generate temporary ~1 MB CSV file on disk
    while (Buffer.byteLength(fileContent, 'utf-8') < targetSizeBytes) {
      fileContent += `INV-${String(index).padStart(6, '0')},2026-10-21,27,27,998311,18,100000,1.5\n`;
      index++;
    }

    await writeFile(filePath, fileContent, 'utf-8');
  });

  afterAll(async () => {
    await unlink(filePath).catch(() => { });
  });

  it('streams a 1 MB file from disk without memory spikes', async () => {
    if (global.gc) global.gc();
    const initialHeap = process.memoryUsage().heapUsed;

    // Stream directly from disk with 16 KB highWaterMark buffer
    const nodeStream = createReadStream(filePath, { highWaterMark: 16 * 1024 });
    const webStream = Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>;

    let parsedCount = 0;
    let errorCount = 0;
    // Measure streaming parser duration only
    console.time('parseInvoiceCSV Execution');

    for await (const result of parseInvoiceCSV(webStream)) {
      if ('type' in result) {
        errorCount++;
      } else {
        parsedCount++;
      }
    }

    console.timeEnd('parseInvoiceCSV Execution'); // Prints: parseInvoiceCSV Execution: ~25ms

    const finalHeap = process.memoryUsage().heapUsed;
    const heapDiffMb = (finalHeap - initialHeap) / (1024 * 1024);

    expect(errorCount).toBe(0);
    expect(parsedCount).toBeGreaterThan(10000);

    // Verify heap allocation growth remains bounded (< 15 MB)
    expect(heapDiffMb).toBeLessThan(15);
  });
});