# hisaab CLI

Run GST scenarios and inspect the scenario registry from the command line. The examples below are copy-pasteable from the repository root after `make dev`.

## List scenarios

Run `hisaab list` to print every scenario ID in the registry, one per line:

```bash
pnpm --filter @hisaab/cli exec tsx src/main.ts list
```

Expected stdout:

```text
igst-18-standard
cgst-sgst-18-intra
igst-sez-supply
credit-note-intra
cess-28-auto
reverse-charge-rcm
round-half-up-odd
igst-28-cess-12
```

## List missing scenarios

Pass `--status missing` to show only scenarios that are marked as missing in the registry:

```bash
pnpm --filter @hisaab/cli exec tsx src/main.ts list --status missing
```

Expected stdout:

```text
igst-sez-supply
credit-note-intra
cess-28-auto
reverse-charge-rcm
```

## Run a scenario

Use `hisaab --scenario <id>` to calculate the GST amounts for a scenario. For example, run the standard 18% inter-state GST scenario:

```bash
pnpm --filter @hisaab/cli exec tsx src/main.ts --scenario igst-18-standard
```

Expected stdout:

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

All amounts are expressed in paise. This scenario produces ₹100.00 in taxable value, ₹18.00 in IGST, and a total of ₹118.00.

## Unknown scenario IDs

If the requested scenario ID does not exist, the CLI writes an error to stderr and exits with status code `2`:

```bash
pnpm --filter @hisaab/cli exec tsx src/main.ts --scenario does-not-exist
```

Expected stderr:

```text
Scenario not found: does-not-exist
```

Expected exit code: `2`.

To check the exit code in a shell, run `echo $?` immediately after the command. The CLI does not require network access; scenarios are loaded from local fixture files.

## Exit codes

| Code | Meaning |
| --- | --- |
| `0` | Command succeeded |
| `1` | Runtime calculation error |
| `2` | Usage error, such as a missing or unknown scenario ID |
