# hisaab

> GST tax-scenario catalog: pure functions that turn a line item plus a place-of-supply rule into CGST, SGST, IGST, cess, and rounded totals.

**Offline · Fixture-driven · No GSTN login · MIT**

[![CI](https://github.com/Ayoush/hisaab/actions/workflows/ci.yml/badge.svg)](https://github.com/Ayoush/hisaab/actions/workflows/ci.yml)

---

## Run it in 5 minutes

**Prerequisites:** Node 22+, pnpm 9+

```bash
git clone https://github.com/Ayoush/hisaab.git
cd hisaab
make dev
```

`make dev` installs dependencies, runs lint, typechecks, and runs the full test suite. Everything runs offline — no API keys, no GSTN, no network required.

**In GitHub Codespaces or VS Code devcontainer:** click **Code → Codespaces → Create codespace on main**, or open in VS Code and choose **Reopen in Container**. The container is ready in under 2 minutes.

---

## What this is

India's GST has edge cases: intra-state vs inter-state splits, SEZ supplies, cess on tobacco and automobiles, reverse charge, credit notes, rounding disputes on odd paise. This repo catalogs them as offline JSON fixtures.

Each scenario in `spec/scenarios/` says: given this seller state, buyer state, HSN, and taxable amount in paise, expect exactly these tax amounts. The pure functions in `packages/core/` implement the rules; the tests prove every scenario.

India keeps issuing rate notifications. The catalog never closes.

---

## Project layout

```
packages/
  core/     # Pure GST math — money, split, round, validate, HSN, states
  api/      # Hono JSON API (POST /quote)
  cli/      # hisaab --scenario <id>
spec/
  scenarios/          # One JSON fixture per GST edge case
registry/
  scenarios.json      # AI planner reads this every night
fixtures/
  golden/             # Expected JSON for golden tests
docs/
  money.md            # Why paise, not floats
  rounding.md         # Half-up vs banker's rounding
  place-of-supply.md  # Intra-state vs inter-state
```

---

## What is a "scenario"?

```json
{
  "id": "igst-18-standard",
  "description": "18% IGST — seller in MH, buyer in DL",
  "sellerState": "27",
  "buyerState": "07",
  "hsn": "8471",
  "ratePercent": 18,
  "taxableAmountPaise": 10000,
  "expectedCgstPaise": 0,
  "expectedSgstPaise": 0,
  "expectedIgstPaise": 1800,
  "expectedCessPaise": 0
}
```

---

## Stack

| Layer | Tool |
|-------|------|
| Language | TypeScript 5, Node 22 |
| Monorepo | pnpm workspaces |
| Testing | Vitest |
| API | Hono |
| Lint / Format | ESLint + Prettier |

---

## Contributing

New here? Start with a [`good first issue`](../../issues?q=label%3A%22good+first+issue%22). See [CONTRIBUTING.md](CONTRIBUTING.md) for the full workflow.

Every PR is reviewed first by our AI reviewer (Gremlin) then by a human mentor from the Intervues community.
