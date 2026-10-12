# hisaab CLI

Run a GST scenario from the command line.

## Usage

```bash
pnpm --filter @hisaab/cli tsx src/main.ts --scenario igst-18-standard
```

**Expected output:**

```json
{
  "taxableAmountPaise": 10000,
  "cgstPaise": 0,
  "sgstPaise": 0,
  "igstPaise": 1800,
  "cessPaise": 0,
  "totalPaise": 11800
}
```

**No network required.** All scenarios run from local fixture files.

## List scenarios

```bash
pnpm --filter @hisaab/cli tsx src/main.ts list
pnpm --filter @hisaab/cli tsx src/main.ts list --status missing
```

## Exit codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Runtime error (e.g. unknown state) |
| 2 | Usage error (e.g. missing scenario id, invalid JSON) |
