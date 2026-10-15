# GST glossary

One-line definitions of the GST terms used across hisaab. Each entry links to the deeper doc where one exists.

| Term | Definition |
| ---- | ---------- |
| **CGST** (Central GST) | The Centre's share of tax on an **intra-state** supply. Charged at half the GST rate, alongside SGST. See [Place of supply](place-of-supply.md#intra-state-supply). |
| **SGST** (State GST) | The state's share of tax on an **intra-state** supply, equal to CGST. In a Union Territory without a legislature it is called **UTGST** instead. See [Place of supply](place-of-supply.md#intra-state-supply) and [Union Territories](place-of-supply.md#union-territories). |
| **IGST** (Integrated GST) | Tax on an **inter-state** supply (and imports), charged at the full rate and collected by the Centre — no CGST/SGST split. See [Place of supply](place-of-supply.md#inter-state-supply). |
| **CESS** (Compensation cess) | An extra levy on top of GST for specific goods such as tobacco products. It is calculated separately from CGST, SGST and IGST. |
| **HSN** (Harmonized System of Nomenclature) | The numeric code that classifies **goods** (e.g. `8471` for computers) and decides which GST rate applies. Validated in [`packages/core/src/hsn.ts`](../packages/core/src/hsn.ts). |
| **SAC** (Services Accounting Code) | The code that classifies **services**, the counterpart of HSN for goods. SAC codes start with `99`. |
| **POS** (Place of Supply) | The state or UT where a supply is treated as made. If it matches the seller's state the supply is intra-state (CGST + SGST); otherwise it is inter-state (IGST). See [Place of supply](place-of-supply.md). |
| **Taxable value** | The amount GST is calculated on — usually the transaction price before tax. In hisaab it is always an integer in paise. See [Money](money.md) and [Rounding](rounding.md). |
| **Tax invoice** | The invoice a registered supplier issues for a taxable supply, showing taxable value, HSN/SAC, place of supply and the CGST/SGST/IGST/cess breakup. See [Place of supply](place-of-supply.md) for example tax splits. |

## Not legal advice

These definitions are a technical reference for writing fixtures. For compliance decisions, consult a chartered accountant.
