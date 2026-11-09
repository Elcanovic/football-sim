import type { LoanDeal, LoanDealParams, LoanType } from "./types.ts";
import type { PRNG } from "./prng.ts";
import { checkProbability, pickWeighted, randomInt } from "./prng.ts";

// ---------------------------------------------------------------------------
// Loans: structure, wage splits, option-to-buy, mandatory-buy triggers,
// recall rights and parent-club restrictions.
//
// Everything here is a pure function of its arguments. The only randomness
// lives in generateLoanTerms(), which takes an explicit PRNG so results stay
// reproducible for a given career seed.
// ---------------------------------------------------------------------------

/** Multi-year developmental loans are only available to young prospects. */
export const MULTI_YEAR_LOAN_MAX_AGE = 23;

const DEFAULT_LEAGUE_MATCHES = 38;

export interface LoanTriggerContext {
  relegated?: boolean;
  promoted?: boolean;
  appearances?: number;
  /** null => the league has no relegation (MLS, A-League...). */
  relegationCutoff?: number | null;
  finalPosition?: number;
  leagueId?: string;
}

export interface LoanTriggerResult {
  mustExecuteBuy: boolean;
  fee: number;
  returnToParentClub: boolean;
  /** Which enabled triggers were satisfied (empty when none were). */
  satisfied: string[];
}

export interface LoanStatLine {
  appearances: number;
  goals: number;
  assists: number;
  cleanSheets?: number;
}

function assertShare(label: string, value: number): void {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 100) {
    throw new Error(`Loan ${label} must be a number between 0 and 100 (got ${value}).`);
  }
}

export function createLoanDeal(params: LoanDealParams): LoanDeal {
  const {
    type,
    parentClubId,
    loaningClubId,
    parentWageShare,
    loaningWageShare,
    playerAge,
    optionToBuyFee,
    mandatoryTriggers,
    recallAllowed = false,
    parentMatchRestricted = false,
    seed,
  } = params;

  if (!parentClubId || !loaningClubId) {
    throw new Error("A loan requires both a parent club and a loaning club.");
  }
  if (parentClubId === loaningClubId) {
    throw new Error("A player cannot be loaned to his own parent club.");
  }

  assertShare("parentWageShare", parentWageShare);
  assertShare("loaningWageShare", loaningWageShare);
  if (Math.abs(parentWageShare + loaningWageShare - 100) > 1e-9) {
    throw new Error(
      `Loan wage shares must sum to exactly 100% (got ${parentWageShare} + ${loaningWageShare}).`,
    );
  }

  if (type === "multi_year_dev" && playerAge !== undefined && playerAge > MULTI_YEAR_LOAN_MAX_AGE) {
    throw new Error(
      `Multi-year developmental loans are limited to players aged ${MULTI_YEAR_LOAN_MAX_AGE} or under (got ${playerAge}).`,
    );
  }

  if (optionToBuyFee !== undefined && !(optionToBuyFee > 0)) {
    throw new Error("optionToBuyFee must be a positive amount.");
  }
  if (mandatoryTriggers && !(mandatoryTriggers.buyFee > 0)) {
    throw new Error("Mandatory triggers require a positive buyFee.");
  }

  const seasonsRemaining = type === "multi_year_dev" ? 2 : 1;
  const idSuffix = seed ? `:${seed}` : "";

  return {
    id: `loan:${type}:${parentClubId}>${loaningClubId}${idSuffix}`,
    type,
    parentClubId,
    loaningClubId,
    seasonsRemaining,
    parentWageShare,
    loaningWageShare,
    optionToBuyFee,
    mandatoryTriggers,
    recallAllowed,
    parentMatchRestricted,
  };
}

/** Matches the player is expected to be available for under this loan. */
export function calculateLoanMatchAllocation(
  deal: Pick<LoanDeal, "type">,
  leagueMatches: number = DEFAULT_LEAGUE_MATCHES,
): number {
  return deal.type === "winter_six_month" ? Math.round(leagueMatches / 2) : leagueMatches;
}

export function canExerciseOptionToBuy(
  deal: Pick<LoanDeal, "optionToBuyFee">,
  ctx: { clubFunds: number },
): boolean {
  return deal.optionToBuyFee !== undefined && ctx.clubFunds >= deal.optionToBuyFee;
}

export function evaluateMandatoryTriggers(
  deal: Pick<LoanDeal, "mandatoryTriggers">,
  ctx: LoanTriggerContext,
): LoanTriggerResult {
  const triggers = deal.mandatoryTriggers;
  if (!triggers) {
    return { mustExecuteBuy: false, fee: 0, returnToParentClub: true, satisfied: [] };
  }

  const satisfied: string[] = [];

  if (triggers.relegationSurvival) {
    let survived: boolean | null = null;
    if (ctx.relegationCutoff === null) {
      // League has no relegation, so surviving is automatic.
      survived = true;
    } else if (typeof ctx.relegated === "boolean") {
      survived = !ctx.relegated;
    } else if (typeof ctx.relegationCutoff === "number" && typeof ctx.finalPosition === "number") {
      // relegationCutoff = first relegated league position.
      survived = ctx.finalPosition < ctx.relegationCutoff;
    }
    if (survived === true) satisfied.push("relegationSurvival");
  }

  if (triggers.promotion && ctx.promoted === true) {
    satisfied.push("promotion");
  }

  if (
    typeof triggers.minAppearances === "number" &&
    typeof ctx.appearances === "number" &&
    ctx.appearances >= triggers.minAppearances
  ) {
    satisfied.push("minAppearances");
  }

  const mustExecuteBuy = satisfied.length > 0;
  return {
    mustExecuteBuy,
    fee: mustExecuteBuy ? triggers.buyFee : 0,
    returnToParentClub: !mustExecuteBuy,
    satisfied,
  };
}

/** Recall is only possible if the clause exists and the January window is open. */
export function canRecallLoan(
  deal: Pick<LoanDeal, "recallAllowed">,
  ctx: { inTransferWindow: boolean; injuryCrisis?: boolean },
): boolean {
  return deal.recallAllowed === true && ctx.inTransferWindow === true;
}

export function isEligibleForMatch(
  deal: Pick<LoanDeal, "parentMatchRestricted" | "parentClubId">,
  opponentClubId: string,
): boolean {
  return !(deal.parentMatchRestricted && opponentClubId === deal.parentClubId);
}

/** Adds second-half (loan-club) output on top of first-half stats; never wipes either. */
export function integrateWinterLoanStats(
  _deal: Pick<LoanDeal, "type">,
  firstHalf: LoanStatLine,
  secondHalf: {
    secondHalfApps: number;
    secondHalfGoals: number;
    secondHalfAssists: number;
    secondHalfCleanSheets?: number;
  },
): LoanStatLine {
  const cleanSheets = firstHalf.cleanSheets !== undefined || secondHalf.secondHalfCleanSheets !== undefined
    ? (firstHalf.cleanSheets ?? 0) + (secondHalf.secondHalfCleanSheets ?? 0)
    : undefined;
  const merged: LoanStatLine = {
    appearances: firstHalf.appearances + secondHalf.secondHalfApps,
    goals: firstHalf.goals + secondHalf.secondHalfGoals,
    assists: firstHalf.assists + secondHalf.secondHalfAssists,
  };
  if (cleanSheets !== undefined) merged.cleanSheets = cleanSheets;
  return merged;
}

/** Splits the player's weekly wage between parent and loan club. Sums back exactly. */
export function splitLoanWage(
  deal: Pick<LoanDeal, "parentWageShare">,
  weeklyWage: number,
): { parent: number; loanee: number } {
  const parent = Math.round((weeklyWage * deal.parentWageShare) / 100);
  return { parent, loanee: weeklyWage - parent };
}

/**
 * Fixtures lost to the "cannot play parent club" restriction. A double
 * round-robin means two league meetings; zero if the clubs are in different leagues.
 */
export function parentRestrictionFixturesMissed(
  deal: Pick<LoanDeal, "parentMatchRestricted">,
  sameCompetition: boolean,
): number {
  return deal.parentMatchRestricted && sameCompetition ? 2 : 0;
}

/** Ticks a loan forward one season. */
export function advanceLoanSeason(deal: LoanDeal): LoanDeal {
  return { ...deal, seasonsRemaining: Math.max(0, deal.seasonsRemaining - 1) };
}

export function isLoanComplete(deal: Pick<LoanDeal, "seasonsRemaining">): boolean {
  return deal.seasonsRemaining <= 0;
}

export interface LoanTermsContext {
  playerAge: number;
  overall: number;
  marketValue: number;
  /** Wage share the parent club would plausibly keep (higher for elite parents). */
  parentIsElite?: boolean;
}

/**
 * Rolls a plausible set of loan terms. Randomness comes only from the supplied
 * PRNG, which the caller threads through career state.
 */
export function generateLoanTerms(
  rng: PRNG,
  ctx: LoanTermsContext,
): { rng: PRNG; terms: Omit<LoanDealParams, "parentClubId" | "loaningClubId"> } {
  let cur = rng;

  const typeWeights: { item: LoanType; weight: number }[] = [
    { item: "full_season", weight: 5 },
    { item: "winter_six_month", weight: 2 },
    { item: "multi_year_dev", weight: ctx.playerAge <= MULTI_YEAR_LOAN_MAX_AGE ? 3 : 0 },
  ];
  const typePick = pickWeighted(cur, typeWeights);
  cur = typePick.rng;

  const sharePick = pickWeighted(cur, [
    { item: 0, weight: ctx.parentIsElite ? 1 : 3 },
    { item: 25, weight: 2 },
    { item: 50, weight: 4 },
    { item: 75, weight: ctx.parentIsElite ? 4 : 2 },
    { item: 100, weight: ctx.parentIsElite ? 2 : 0.5 },
  ]);
  cur = sharePick.rng;
  const parentWageShare = sharePick.item;

  const roundFee = (n: number) => Math.max(100_000, Math.round(n / 100_000) * 100_000);

  const optRoll = checkProbability(cur, 0.5);
  cur = optRoll.rng;
  const optionToBuyFee = optRoll.success ? roundFee(ctx.marketValue * 1.2) : undefined;

  const trigRoll = checkProbability(cur, 0.35);
  cur = trigRoll.rng;
  let mandatoryTriggers: LoanDealParams["mandatoryTriggers"];
  if (trigRoll.success) {
    const apps = randomInt(cur, 15, 25);
    cur = apps.rng;
    mandatoryTriggers = { minAppearances: apps.value, buyFee: roundFee(ctx.marketValue) };
  }

  const recallRoll = checkProbability(cur, 0.3);
  cur = recallRoll.rng;
  const restrictRoll = checkProbability(cur, 0.35);
  cur = restrictRoll.rng;

  return {
    rng: cur,
    terms: {
      type: typePick.item,
      parentWageShare,
      loaningWageShare: 100 - parentWageShare,
      playerAge: ctx.playerAge,
      optionToBuyFee,
      mandatoryTriggers,
      recallAllowed: recallRoll.success,
      parentMatchRestricted: restrictRoll.success,
    },
  };
}
