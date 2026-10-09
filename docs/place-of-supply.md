# Place of supply

The place of supply determines whether a transaction is **intra-state** (CGST + SGST) or **inter-state** (IGST).

## Intra-state supply

Seller and buyer are in the **same state or UT**. Tax is split equally between CGST and SGST.

**Example:** Seller in Maharashtra (27), buyer in Maharashtra (27), 18% rate, ₹100 taxable.
- CGST: ₹9 (900 paise)
- SGST: ₹9 (900 paise)
- IGST: ₹0

Matching scenario: `cgst-sgst-18-intra`

## Inter-state supply

Seller and buyer are in **different states or UTs**. Tax is levied as IGST (no CGST/SGST split).

**Example:** Seller in Maharashtra (27), buyer in Delhi (07), 18% rate, ₹100 taxable.
- CGST: ₹0
- SGST: ₹0
- IGST: ₹18 (1800 paise)

Matching scenario: `igst-18-standard`

## Union Territories

For GST purposes, UTs without a legislature (Delhi, Chandigarh, etc.) follow the same rules as states for place-of-supply determination. However, the "state" tax in a UT is UTGST, not SGST — see state code 07 (Delhi, kind: ut) in `packages/core/src/states.ts`.

## Not legal advice

This document is a technical reference for writing test fixtures. GST law is complex; consult a chartered accountant for compliance decisions.
