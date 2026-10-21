# E-invoice: Invoice Reference Number (IRN)

Every invoice uploaded to the GST e-invoice system gets a unique **Invoice Reference Number**. The IRN is a 64 character SHA-256 hash, and it is what makes an invoice traceable across the whole GST system.

## How the IRN is computed

The IRN is the hash of four values joined **without a separator**:

```
Supplier GSTIN + Financial Year + Document Type + Document Number
```

The worked example from the specification: a supplier with GSTIN `01AAAAA9999A19N` issues invoice `ABC01234` dated 12.12.2019, so the string that gets hashed is

```
01AAAAA9999A19N2019-20INVABC01234
```

and the IRN is

```
353c2677715ae97aa876a37262a38381a75c1d1184f6a803f703bb395971925f
```

`generateIrn()` reproduces exactly this, and `irnHashInput()` returns the string that gets hashed so the construction can be audited without re-hashing.

## Financial year

The financial year is derived from the document date. It runs from **1 April to 31 March** and is written `YYYY-YY`:

| Document date | Financial year |
| ------------- | -------------- |
| 01/04/2019    | 2019-20        |
| 03/01/2020    | 2019-20        |
| 31/03/2020    | 2019-20        |
| 01/04/2020    | 2020-21        |

Note that January still belongs to the financial year that began the previous April — this is the rule the specification's own worked example demonstrates.

## Document type and number

- **Document type** is one of `INV` (invoice), `CRN` (credit note) or `DBN` (debit note).
- **Document number** is at most 16 characters, must not begin with `0`, `/` or `-`, and may otherwise contain letters, digits, `/` and `-`.
- **Document date** uses the e-invoice format `DD/MM/YYYY` — note this is not the `dd-MM-yyyy` used by the GSTR-1 export.

Because the IRN is a hash of the financial year rather than the date, the same document number issued by the same supplier in two different financial years produces two different IRNs, while re-issuing the same number in the same year produces the same one — which is how the GST system detects duplicate uploads.

## What this does not do

The IRP issues the IRN when it registers an invoice, together with an acknowledgement number, an acknowledgement date and a signed QR code. Computing the IRN locally lets you **verify** the IRN the IRP issued, or pre-check a document before upload — it does not register an e-invoice, and an e-invoice without the IRP's acknowledgement is not valid.

The supplier GSTIN is validated with the e-invoice schema's own pattern, `^[0-9]{2}[0-9A-Z]{13}$`, which is looser than the canonical GSTIN structure checked elsewhere in hisaab — the IRN is a hash of the value as the IRP receives it.

## Not legal advice

This document is a technical reference for writing test fixtures and for verifying invoice reference numbers. GST law and the e-invoice specification are updated periodically; consult the current specification and a chartered accountant for compliance decisions.
