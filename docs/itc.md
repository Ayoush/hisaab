# Input tax credit (ITC) eligibility

hisaab can check whether the buyer of an invoice may claim input tax credit on it, using the blocked-credit categories in **Section 17(5) of the CGST Act, 2017**.

Blocking is decided **per line item**: one invoice can mix a blocked input with a creditable one, so `checkItcEligibility()` returns a per-line breakdown alongside the totals.

## The rule

> Input tax credit shall not be available in respect of the categories listed in Section 17(5).

For everything else, credit is available on the tax paid, subject to the general conditions in Section 16 and the apportionment rules in Section 17(1) and (2).

## Categories hisaab can decide from an invoice

| Clause        | Blocked input                                                                                         | Credit is available when the business                                                  |
| ------------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| 17(5)(a)      | Motor vehicles for transportation of persons (HSN `8703`)                                             | further supplies such vehicles, transports passengers, or trains drivers to drive them |
| 17(5)(aa)     | Vessels and aircraft (HSN chapter `88`, `89`)                                                         | further supplies them, transports passengers, trains crews, or transports goods        |
| 17(5)(b)(i)   | Food and beverages (HSN chapter `21`, `22`)                                                           | makes an outward taxable supply of food or beverages                                   |
| 17(5)(c), (d) | Works contract services and own-account inputs for construction of an immovable property (SAC `9954`) | further supplies works contract services                                               |

The business types that unlock each carve-out are the `BusinessType` values in `packages/core/src/itc.ts`.

## Categories hisaab does not decide

These need facts an invoice does not carry, so they are out of scope and must be checked by the taxpayer:

- 17(5)(ab) — general insurance, servicing, repair and maintenance relating to the vehicles, vessels and aircraft in (a) and (aa). SAC `9987` covers repair of _all_ machinery, not only vehicles, so the code alone cannot separate the two.
- 17(5)(b)(ii) — membership of a club, health and fitness centre.
- 17(5)(e) — supplies on which tax has already been paid under Section 10.
- 17(5)(f) — goods or services received by a non-resident taxable person.
- 17(5)(fa) — inputs used for corporate social responsibility obligations.
- 17(5)(g), (h) — goods used for personal consumption, or lost, stolen, destroyed, written off or given away.
- 17(5)(i) — tax paid under Section 74 for periods up to FY 2023-24.

## Conservative assumptions

Two limits are worth stating plainly, because they can make the checker stricter than the law:

- **HSN `8703` does not reveal seating capacity.** Section 17(5)(a) blocks passenger vehicles with an approved seating capacity of not more than thirteen. A larger vehicle (a bus, for example) is therefore also reported as blocked, even though the law would allow credit.
- **Only chapters `21` and `22` count as food and beverages.** Sugars (chapter `17`), dairy (chapter `04`) and similar consumables are treated as ordinary creditable inputs.

## What counts as the creditable amount

`eligibleAmount` is the **tax paid** on the eligible lines — IGST, or CGST and SGST, plus cess where it applies — not the invoice value. In a Union Territory the state component is UTGST rather than SGST, but it is credited on the same terms, so no separate handling is needed.

## Not legal advice

This document is a technical reference for writing test fixtures and for checking invoice-level inputs. GST law is complex, and several Section 17(5) categories can only be decided with facts hisaab does not have. Consult a chartered accountant for compliance decisions.
