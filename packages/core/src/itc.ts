import type { Invoice } from './invoice.js';
import { paise, type Paise } from './money.js';

// Input tax credit eligibility under CGST Act Section 17(5).
//
// Only the categories that can be decided from an invoice are implemented:
//   17(5)(a)   motor vehicles for transport of persons (<= 13 seats)
//   17(5)(aa)  vessels and aircraft
//   17(5)(b)(i) food and beverages
//   17(5)(c)/(d) works contract / own-account construction of immovable property
//
// Categories that need facts an invoice does not carry (personal consumption,
// club membership, already-taxed supplies, non-resident recipient, CSR use,
// goods lost or gifted, vehicle-related insurance and repair) are out of scope.
// See docs/itc.md for the full list and the reasoning.

export type BusinessType =
  /** Resells goods bought inward. */
  | 'trader'
  /** Manufactures goods, including motor vehicles and vessels. */
  | 'manufacturer'
  /** Supplies services. */
  | 'service-provider'
  /** Further supplies motor vehicles — 17(5)(a)(A). */
  | 'vehicle-dealer'
  /** Transports passengers — 17(5)(a)(B). */
  | 'passenger-transporter'
  /** Transports goods — 17(5)(aa)(ii). */
  | 'goods-transporter'
  /** Imparts training on driving motor vehicles — 17(5)(a)(C). */
  | 'driving-training'
  /** Supplies food and beverages outward — 17(5)(b)(i) proviso. */
  | 'food-service'
  /** Further supplies works contract services — 17(5)(c) proviso. */
  | 'works-contractor'
  /** Constructs immovable property on own account — 17(5)(d). */
  | 'real-estate-developer'
  /** Any other business. */
  | 'other';

export type ItcLineResult = {
  hsn: string;
  eligible: boolean;
  /** Tax paid on this line that the buyer may credit. */
  eligibleAmount: Paise;
  /** Present when the line is blocked; cites the Section 17(5) clause. */
  blockedReason?: string;
};

export type ItcResult = {
  /** True when at least one line yields credit. */
  eligible: boolean;
  /** Total creditable tax, in paise. */
  eligibleAmount: Paise;
  /** Present when any line is blocked. */
  blockedReason?: string;
  /** Per-line breakdown. */
  lines: ItcLineResult[];
};

type BlockedCategory = 'passenger-vehicle' | 'vessel-aircraft' | 'food-beverage' | 'construction';

type Rule = {
  category: BlockedCategory;
  /** Human readable description used in blockedReason. */
  description: string;
  /** Clause cited in the reason. */
  clause: string;
  /** Business types that may still credit this input. */
  exceptions: readonly BusinessType[];
};

const RULES: readonly Rule[] = [
  {
    category: 'passenger-vehicle',
    description: 'motor vehicles for transportation of persons',
    clause: 'CGST Act Section 17(5)(a)',
    exceptions: ['vehicle-dealer', 'passenger-transporter', 'driving-training', 'manufacturer'],
  },
  {
    category: 'vessel-aircraft',
    description: 'vessels and aircraft',
    clause: 'CGST Act Section 17(5)(aa)',
    exceptions: ['passenger-transporter', 'goods-transporter', 'driving-training', 'manufacturer'],
  },
  {
    category: 'food-beverage',
    description: 'food and beverages',
    clause: 'CGST Act Section 17(5)(b)(i)',
    exceptions: ['food-service'],
  },
  {
    category: 'construction',
    description: 'works contract services for construction of an immovable property',
    clause: 'CGST Act Section 17(5)(c) and (d)',
    exceptions: ['works-contractor'],
  },
];

/**
 * Classify an HSN/SAC code into a blocked category, or null when no
 * Section 17(5) rule applies to it.
 */
export function classifyItcInput(hsn: string): BlockedCategory | null {
  const code = hsn.trim();

  // 8703 — motor cars and vehicles principally designed for transport of persons.
  if (code.startsWith('8703')) return 'passenger-vehicle';

  // Chapter 88 aircraft, chapter 89 vessels and floating structures.
  if (code.startsWith('88') || code.startsWith('89')) return 'vessel-aircraft';

  // Chapter 21 foodstuffs, chapter 22 beverages, spirits and vinegar.
  if (code.startsWith('21') || code.startsWith('22')) return 'food-beverage';

  // SAC 9954 — construction services.
  if (code.startsWith('9954')) return 'construction';

  return null;
}

function ruleFor(category: BlockedCategory): Rule {
  const rule = RULES.find((r) => r.category === category);
  if (!rule) {
    throw new Error(`No ITC rule for category ${category}`);
  }
  return rule;
}

/**
 * Check whether the buyer of an invoice may claim input tax credit on it.
 *
 * Blocking is decided per line item: a single invoice can mix a blocked
 * input with a creditable one, so the result carries a per-line breakdown
 * alongside the totals.
 */
export function checkItcEligibility(invoice: Invoice, businessType: BusinessType): ItcResult {
  const lines: ItcLineResult[] = [];
  let eligibleAmount = 0;
  let blockedReason: string | undefined;

  for (const line of invoice.lines) {
    const category = classifyItcInput(line.hsn);
    const tax = paise(line.total - line.taxableAmountPaise);

    if (category === null) {
      eligibleAmount += tax;
      lines.push({ hsn: line.hsn, eligible: true, eligibleAmount: tax });
      continue;
    }

    const rule = ruleFor(category);
    if (rule.exceptions.includes(businessType)) {
      eligibleAmount += tax;
      lines.push({ hsn: line.hsn, eligible: true, eligibleAmount: tax });
      continue;
    }

    const reason = `Blocked under ${rule.clause}: ${rule.description} (HSN ${line.hsn})`;
    blockedReason = blockedReason ?? reason;
    lines.push({ hsn: line.hsn, eligible: false, eligibleAmount: paise(0), blockedReason: reason });
  }

  return {
    eligible: eligibleAmount > 0,
    eligibleAmount: paise(eligibleAmount),
    blockedReason,
    lines,
  };
}
