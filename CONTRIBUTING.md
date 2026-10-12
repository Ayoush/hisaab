# Contributing to hisaab

Welcome! hisaab is part of **Intervues Lab** — a project where early-career developers in India get their first merged open-source PR. This guide explains everything you need.

---

## Quick overview

1. Find an issue, comment `I'll take this` to claim it.
2. Fork → branch → code → tests → PR.
3. Gremlin (our AI reviewer) comments first. A human mentor approves.
4. Fix any feedback, get merged.

---

## Fork and clone

```bash
# Fork on GitHub first, then:
git clone https://github.com/YOUR-USERNAME/hisaab.git
cd hisaab
git remote add upstream https://github.com/Ayoush/hisaab.git
```

## Branch naming

```
feat/your-feature-name
fix/what-you-are-fixing
docs/what-you-are-documenting
test/what-you-are-testing
```

## Run the tests

```bash
make dev       # install + lint + typecheck + all tests
make test      # tests only (fast)
make lint      # lint only
make typecheck # typecheck only
```

All tests run offline. If a test needs a network call, mock it — no real GSTN calls allowed.

## Commit style

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(core): add cess calculation for chapter 24
fix(split): CGST gets extra paise on odd remainder
docs: document intra-state rule in place-of-supply.md
test(round): lock half-up rounding with golden fixture
```

## Adding a scenario

1. Create `spec/scenarios/<id>.json` with seller/buyer state codes, HSN, rate, taxable amount, and expected tax values in paise.
2. Update `registry/scenarios.json` — set `status` to `"done"`.
3. Add a unit test that loads the fixture and calls `quote()`.
4. Run `make test` — it should pass.

Use **synthetic data only** — no real GST numbers, PAN, or business names.

## What a good PR looks like

- One scenario (or one fix, or one doc) per PR.
- All tests pass locally before you open the PR.
- The PR description fills out every section of the template.
- You name at least one alternative you considered and why you rejected it.

## Review flow

1. **Gremlin** (AI reviewer) will post automated feedback within a few minutes.
2. Fix any issues Gremlin raises, then comment `ready for mentor review`.
3. A **human mentor** will review and either approve or leave comments.
4. Address mentor comments, then the PR is merged.

## Need help?

Post in the `#hisaab` channel in the Intervues community, or comment on your issue.
