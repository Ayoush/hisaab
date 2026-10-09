# hisaab — 12-week roadmap (Oct–Dec 2026)

## M1 — Foundation (wk 1–2, Oct 6–19)

**Goal:** Every beginner-track issue is unblocked. CI is green. A new contributor can run `make dev`, find an issue, and open a PR.

- [x] Repository setup, CI, devcontainer
- [ ] `docs/money.md` — paise not floats
- [ ] `docs/rounding.md` — half-up rounding explained
- [ ] `docs/place-of-supply.md` — intra vs inter-state
- [ ] Table tests for 18% intra-state split
- [ ] Validate negative quantity
- [ ] Lock half-up rounding with golden fixture

**Merged work creates:** follow-up issues for zero-rated split, UT buyer edge case, cess scenarios.

---

## M2 — Core product works end-to-end (wk 3–6, Oct 20 – Nov 16)

**Goal:** `POST /quote` returns correct CGST/SGST/IGST/cess for the 10 most common scenarios. CLI `--scenario` works.

- [ ] igst-sez-supply scenario added
- [ ] cess field in quote result
- [ ] API returns 400 for unknown state code
- [ ] CLI `--scenario` exits 2 on missing id
- [ ] CLI README with copy-paste example
- [ ] hisaab list `--status missing`
- [ ] HSN prefix lookup for chapter 99
- [ ] Credit-note intra scenario

---

## M3 — Advanced features (wk 7–10, Nov 17 – Dec 14)

**Goal:** 25+ scenarios in the catalog. Reverse charge, SEZ, multi-rate invoice support.

- [ ] Fix CGST/SGST drift on odd paise
- [ ] Fix state code 07 (Delhi) labeled wrong kind
- [ ] Fix CLI swallowing JSON parse errors
- [ ] Fix API treating "18" and 18 as different rates
- [ ] Fix registry loader ignoring unlisted files
- [ ] Reverse-charge scenario
- [ ] Multi-rate invoice (two line items, different HSN)

---

## M4 — Polish and v1.0 (wk 11–12, Dec 15–28)

**Goal:** Docs complete. 30+ scenarios. Public v1.0 release.

- [ ] Full docs review pass
- [ ] registry/scenarios.json has 0 `missing` entries
- [ ] CHANGELOG.md for v1.0
- [ ] v1.0 GitHub release with changelog
