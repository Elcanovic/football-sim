import { randomFloat } from "./prng.js";

const VALUE_CURVE = [
  [50, 100000],
  [55, 250000],
  [60, 500000],
  [65, 1200000],
  [70, 3000000],
  [75, 6000000],
  [80, 18000000],
  [85, 55000000],
  [90, 110000000],
  [95, 160000000],
  [99, 250000000],
];

export function getAgeValueMultiplier(age) {
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

export function calculateMarketValue(rng, overall, age, form = 50) {
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

  const formMultiplier = 1 + ((form - 50) / 50) * 0.15;
  const ageMultiplier = getAgeValueMultiplier(age);

  const { rng: nextRng, value: variance } = randomFloat(rng, 0.93, 1.07);
  const rawValue = baseValue * ageMultiplier * formMultiplier * variance;

  let rounded = Math.round(rawValue);
  if (rounded >= 10000000) {
    rounded = Math.round(rounded / 1000000) * 1000000;
  } else if (rounded >= 1000000) {
    rounded = Math.round(rounded / 100000) * 100000;
  } else {
    rounded = Math.round(rounded / 10000) * 10000;
  }

  return { rng: nextRng, marketValue: Math.max(50000, rounded) };
}

export function calculateWeeklyWage(marketValue, clubReputation, role) {
  const annualRatio = 0.04;
  const baseWeekly = (marketValue * annualRatio) / 52;

  const roleMultipliers = {
    crucial: 1.35,
    important: 1.15,
    starter: 1.05,
    rotation: 0.90,
    backup: 0.70,
    prospect: 0.50,
  };

  const repMultiplier = 0.75 + Math.max(0, clubReputation) * 0.15;
  let wage = Math.round(baseWeekly * (roleMultipliers[role] || 1.0) * repMultiplier);
  wage = Math.max(600, wage);

  if (wage >= 50000) {
    return Math.round(wage / 5000) * 5000;
  } else if (wage >= 10000) {
    return Math.round(wage / 1000) * 1000;
  } else {
    return Math.round(wage / 100) * 100;
  }
}

export function createContract(
  clubId,
  marketValue,
  clubReputation,
  years = 3,
  role = "rotation",
) {
  const weeklyWage = calculateWeeklyWage(marketValue, clubReputation, role);
  const releaseClause = marketValue > 5000000 ? Math.round(marketValue * 1.8 / 1000000) * 1000000 : null;

  return {
    clubId,
    yearsRemaining: Math.max(1, years),
    weeklyWage,
    annualSalary: weeklyWage * 52,
    releaseClause,
    squadRole: role,
    goalBonus: weeklyWage > 10000 ? Math.round(weeklyWage * 0.1) : undefined,
    cleanSheetBonus: weeklyWage > 10000 ? Math.round(weeklyWage * 0.08) : undefined,
  };
}

export function calculateTransferFee(
  marketValue,
  contractYearsRemaining,
  buyerReputation,
) {
  let multiplier = 1.0;
  if (contractYearsRemaining <= 1) {
    multiplier = 0.55;
  } else if (contractYearsRemaining === 2) {
    multiplier = 0.85;
  } else if (contractYearsRemaining >= 4) {
    multiplier = 1.35;
  }

  if (buyerReputation >= 4) multiplier *= 1.2;

  const fee = marketValue * multiplier;
  if (fee >= 10000000) {
    return Math.round(fee / 1000000) * 1000000;
  }
  return Math.round(fee / 100000) * 100000;
}
