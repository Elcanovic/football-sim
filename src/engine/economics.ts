import type { Contract, SquadRole } from "./types.ts";
import { PRNG, randomFloat } from "./prng.ts";

// Baseline value curve [overall, baseValueEUR]
const VALUE_CURVE: [number, number][] = [
  [50, 100_000],
  [55, 250_000],
  [60, 500_000],
  [65, 1_200_000],
  [70, 3_000_000],
  [75, 6_000_000],
  [80, 18_000_000],
  [85, 55_000_000],
  [90, 110_000_000],
  [95, 160_000_000],
  [99, 250_000_000],
];

export function getAgeValueMultiplier(age: number): number {
  if (age <= 18) return 1.6;
  if (age <= 21) return 1.4;
  if (age <= 24) return 1.25;
  if (age <= 27) return 1.05;
  if (age <= 30) return 0.90;
  if (age <= 32) return 0.70;
  if (age <= 34) return 0.45;
  if (age <= 36) return 0.25;
  return 0.12;
}

export function calculateMarketValue(
  rng: PRNG,
  overall: number,
  age: number,
  form = 50,
): { rng: PRNG; marketValue: number } {
  const clampedOvr = Math.max(50, Math.min(99, overall));
  let lower = VALUE_CURVE[0];
  let upper = VALUE_CURVE[VALUE_CURVE.length - 1];

  for (let i = 0; i < VALUE_CURVE.length - 1; i++) {
    if (clampedOvr >= VALUE_CURVE[i][0] && clampedOvr <= VALUE_CURVE[i + 1][0]) {
      lower = VALUE_CURVE[i];
      upper = VALUE_CURVE[i + 1];
      break;
    }
  }

  const [minOvr, minVal] = lower;
  const [maxOvr, maxVal] = upper;
  const ratio = maxOvr === minOvr ? 0 : (clampedOvr - minOvr) / (maxOvr - minOvr);
  const baseValue = minVal + (maxVal - minVal) * ratio;

  // Form multiplier: 50 is normal, 80 gives +15%, 20 gives -15%
  const formMultiplier = 1 + ((form - 50) / 50) * 0.15;
  const ageMultiplier = getAgeValueMultiplier(age);

  const { rng: nextRng, value: variance } = randomFloat(rng, 0.93, 1.07);
  const rawValue = baseValue * ageMultiplier * formMultiplier * variance;

  // Round neatly
  let rounded = Math.round(rawValue);
  if (rounded >= 10_000_000) {
    rounded = Math.round(rounded / 1_000_000) * 1_000_000;
  } else if (rounded >= 1_000_000) {
    rounded = Math.round(rounded / 100_000) * 100_000;
  } else {
    rounded = Math.round(rounded / 10_000) * 10_000;
  }

  return { rng: nextRng, marketValue: Math.max(50_000, rounded) };
}

/**
 * Weekly wage scale:
 * Driven by market value, club reputation, and agreed squad role.
 */
export function calculateWeeklyWage(marketValue: number, clubReputation: number, role: SquadRole): number {
  // Base weekly wage is ~ 3% to 5% of market value annualized / 52
  const annualRatio = 0.04;
  const baseWeekly = (marketValue * annualRatio) / 52;

  // Role adjustments
  const roleMultipliers: Record<SquadRole, number> = {
    crucial: 1.35,
    important: 1.15,
    starter: 1.05,
    rotation: 0.90,
    backup: 0.70,
    prospect: 0.50,
  };

  // Club reputation adjustment (richer clubs pay more)
  const repMultiplier = 0.75 + Math.max(0, clubReputation) * 0.15;

  let wage = Math.round(baseWeekly * (roleMultipliers[role] ?? 1.0) * repMultiplier);
  // Ensure minimum realistic wages based on tiers
  wage = Math.max(600, wage);

  if (wage >= 50_000) {
    return Math.round(wage / 5_000) * 5_000;
  } else if (wage >= 10_000) {
    return Math.round(wage / 1_000) * 1_000;
  } else {
    return Math.round(wage / 100) * 100;
  }
}

export function createContract(
  clubId: string,
  marketValue: number,
  clubReputation: number,
  years = 3,
  role: SquadRole = "rotation",
): Contract {
  const weeklyWage = calculateWeeklyWage(marketValue, clubReputation, role);
  const releaseClause = marketValue > 5_000_000 ? Math.round(marketValue * 1.8 / 1_000_000) * 1_000_000 : null;

  return {
    clubId,
    yearsRemaining: Math.max(1, years),
    weeklyWage,
    annualSalary: weeklyWage * 52,
    releaseClause,
    squadRole: role,
    goalBonus: weeklyWage > 10_000 ? Math.round(weeklyWage * 0.1) : undefined,
    cleanSheetBonus: weeklyWage > 10_000 ? Math.round(weeklyWage * 0.08) : undefined,
  };
}

export function calculateTransferFee(
  marketValue: number,
  contractYearsRemaining: number,
  buyerReputation: number,
): number {
  let multiplier = 1.0;
  if (contractYearsRemaining <= 1) {
    multiplier = 0.55; // Cut-price final year
  } else if (contractYearsRemaining === 2) {
    multiplier = 0.85;
  } else if (contractYearsRemaining >= 4) {
    multiplier = 1.35; // Long contract premium
  }

  // Elite rich buyers pay premium
  if (buyerReputation >= 4) multiplier *= 1.2;

  const fee = marketValue * multiplier;
  if (fee >= 10_000_000) {
    return Math.round(fee / 1_000_000) * 1_000_000;
  }
  return Math.round(fee / 100_000) * 100_000;
}
