# Intervues Lab — 12-week plan (Oct–Dec 2026)

A guide for mentors, contributors, and the AI planner. Maintained in **hisaab** (the hub repo).

---

## The four projects

| Project | One-line pitch | Stack | Skills taught | Beginner entry | Advanced entry |
|---------|---------------|-------|--------------|----------------|----------------|
| [hisaab](https://github.com/Ayoush/hisaab) | GST tax-scenario catalog | TypeScript, Node 22, Vitest, Hono | Decimal money math, table-driven tests, HTTP API design, CLI flags | `docs/place-of-supply.md` (15 min) | Reverse-charge mechanism, SEZ supply set |
| [pehchaan](https://github.com/Ayoush/pehchaan) | Checksum + format catalog for Indian identifiers | TypeScript, Node 22, Vitest | Checksums (Verhoeff, mod-36), parsers, property tests | `docs/gstin.md` (15 min) | Property tests with fast-check, full IFSC table |
| [patra](https://github.com/Ayoush/patra) | Offline Indian postal address normalizer | Python 3.12, pytest, Typer | CSV parsing, alias lookups, Unicode, CLI | `docs/pipeline.md` (15 min) | Devanagari transliteration, fuzzy matching |
| [mandi-rows](https://github.com/Ayoush/mandi-rows) | Mandi price CSV cleaner | Python 3.12, pytest | CSV parsing, date validation, flag vs error design | `docs/columns.md` (15 min) | Price spike detector, multi-format CSV |

---

## 12-week calendar (all 4 projects side by side)

| Week | Dates | hisaab | pehchaan | patra | mandi-rows |
|------|-------|--------|----------|-------|------------|
| 1–2 | Oct 6–19 | M1: Foundation open | M1: Foundation open | M1: Foundation open | M1: Foundation open |
| 3–4 | Oct 20 – Nov 2 | M2: Core API + CLI | M2: IFSC, UPI, pincode | M2: CLI + Indore aliases | M2: Indore wheat + CLI |
| 5–6 | Nov 3–16 | M2: 10 scenarios | M2: State codes, vehicle | M2: Devanagari + batch | M2: Rollup + alias |
| 7–8 | Nov 17–30 | M3: Bug fixes | M3: Bug fixes | M3: Bug fixes | M3: Bug fixes |
| 9–10 | Dec 1–14 | M3: RCM, multi-rate | M3: TAN, bank prefix | M3: 50+ aliases | M3: 5 market files |
| 11–12 | Dec 15–28 | M4: v1.0 | M4: v1.0 | M4: v1.0 | M4: v1.0 |

---

## Milestones

All 4 projects share the same milestone structure:

| Milestone | Goal |
|-----------|------|
| **M1 (wk 1–2)** | Foundation: CI green, beginner track open, docs bootstrapped |
| **M2 (wk 3–6)** | Core product works end-to-end; 5–10 units of work in the catalog |
| **M3 (wk 7–10)** | Bug fixes + advanced features; 15–25 units of work |
| **M4 (wk 11–12)** | Polish, full docs, 30+ units, public v1.0 release |

---

## How the backlog stays full

Each project has a machine-readable task registry:

| Project | Registry | Planner reads |
|---------|----------|---------------|
| hisaab | `registry/scenarios.json` | `status: missing` → propose scenario issue |
| pehchaan | `registry/rules.json` | rule gap → propose rule issue |
| patra | `registry/gaps.csv` | `status: open` → propose alias file issue |
| mandi-rows | `registry/files.json` | uncovered columns → propose market file issue |

Merged PRs update the registry, which immediately opens new follow-up tasks.

---

## Beginner track entry points

Every project has two entry paths: one 15-minute docs task, one 30–45-minute test task.

| Project | 15-min doc task | 30-min test task |
|---------|----------------|------------------|
| hisaab | `docs/place-of-supply.md` | 18% intra-state split test |
| pehchaan | `docs/gstin.md` | GSTIN mod-36 happy path |
| patra | `docs/pipeline.md` | Bombay → Maharashtra alias test |
| mandi-rows | `docs/columns.md` | Missing modal price flag test |

---

## Advanced track entry points

| Project | Recommended first advanced task |
|---------|---------------------------------|
| hisaab | Reverse-charge mechanism (RCM) as a new scenario type |
| pehchaan | Property-based tests for GSTIN with fast-check |
| patra | FastAPI normalization server |
| mandi-rows | Price spike detector (flag rows > 2x 30-day average) |

---

## Suggested mentor load

Gremlin (AI reviewer) handles first-pass review automatically. Mentors focus on domain knowledge, design feedback, and encouragement.

| Phase | Expected PRs/week (all 4 repos) | Mentor hours/week |
|-------|--------------------------------|-------------------|
| M1 (wk 1–2) | 2–4 | 1–2 h |
| M2 (wk 3–6) | 4–8 | 2–4 h |
| M3 (wk 7–10) | 4–6 | 2–3 h |
| M4 (wk 11–12) | 2–4 | 1–2 h |

**Tip:** Scale to 2 mentors during M2 when the most beginner PRs land.

---

## Questions for Ayoush

- Should the Hono API (hisaab) be deployed anywhere for a live demo, or kept local-only for now?
- Is there a Codespaces organization plan so contributors get free compute? (60 h/month personal is usually enough for these tasks.)
- Which Slack/Discord channel should contributors post in when they claim an issue?
- Should Gremlin use the same review config across all 4 repos, or per-repo settings?
- For patra: it currently has Apache-2.0 license. Should it switch to MIT for consistency with the others?
- What is the process for a contributor who wants to move from the beginner track to the advanced track? Is there a mentorship call or just the issues?
- Are there any GST rule changes expected before Dec 2026 that would affect hisaab scenarios?
