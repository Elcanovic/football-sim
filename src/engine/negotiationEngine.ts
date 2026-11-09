import type { SquadStatus } from "./types.ts";
import type { AgentArchetypeKey } from "./agents.ts";
import { getAgentArchetype } from "./agents.ts";
import type { PRNG } from "./prng.ts";
import { checkProbability, createPRNG } from "./prng.ts";

// ---------------------------------------------------------------------------
// Negotiation Engine: Turn-based contract hot-seat with real-time dynamic
// meters (Club Patience, Agent Leverage, Manager Urgency), granular perks,
// tiered release clauses, and squad status fulfillment evaluations.
// ---------------------------------------------------------------------------

export interface ReleaseClauses {
  domestic?: number;
  continental?: number;
  relegation?: number;
  [key: string]: number | undefined;
}

export interface ContractPerks {
  baseWeeklyWage: number;
  appearanceFee?: number;
  goalBonus?: number;
  cleanSheetBonus?: number;
  releaseClauses?: ReleaseClauses;
  squadStatus?: SquadStatus;
  signingBonus?: number;
  loyaltyBonus?: number;
}

export interface HotSeatSessionParams {
  playerMarketValue?: number;
  clubWageBudget?: number;
  clubWageCeiling?: number;
  maxRounds?: number;
  playerForm?: number;
  contractYearsRemaining?: number;
  deadlineHoursRemaining?: number;
  squadDepthDeficit?: boolean;
  agentArchetype?: AgentArchetypeKey;
  seed?: string;
  currentClubId?: string;
  targetClubId?: string;
}

export interface HotSeatSession {
  currentRound: number;
  maxRounds: number;
  deadlineHoursRemaining: number;
  hoursRemaining: number;
  dealAgreed: boolean;
  walkedAway: boolean;
  clubPatience: number;
  agentLeverage: number;
  managerUrgency: number;
  clubWageBudget: number;
  clubWageCeiling: number;
  offeredPerks: ContractPerks;
  agentArchetype: AgentArchetypeKey;
  seed: string;
  rngState: number;
}

export interface CounterOfferDemand {
  demandedWage?: number;
  appearanceFee?: number;
  goalBonus?: number;
  cleanSheetBonus?: number;
  releaseClauses?: ReleaseClauses;
  squadStatus?: SquadStatus;
}

export interface HotSeatFinalResult {
  dealAgreed: boolean;
  agreedWage: number;
  finalPerks?: ContractPerks;
  statusMessage: "deal_agreed" | "club_walked_away" | "deadline_expired" | "no_deal";
  blunderOccurred: boolean;
}

let autoSessionSequence = 0;

/**
 * Initialize a turn-based negotiation table ("Hot-Seat") session.
 */
export function initHotSeatSession(params: HotSeatSessionParams = {}): HotSeatSession {
  const seed = params.seed ?? `nego-session-${++autoSessionSequence}-${Date.now()}`;
  const curRng: PRNG = createPRNG(seed);

  const marketValue = params.playerMarketValue ?? 5_000_000;
  const clubWageBudget = params.clubWageBudget ?? Math.max(5_000, Math.round(marketValue * 0.008));
  const clubWageCeiling = params.clubWageCeiling ?? Math.round(clubWageBudget * 1.25);
  const maxRounds = params.maxRounds ?? 5;
  const deadlineHoursRemaining = params.deadlineHoursRemaining !== undefined ? params.deadlineHoursRemaining : 24;

  const agentKey: AgentArchetypeKey = params.agentArchetype ?? "family_relative";
  const archetype = getAgentArchetype(agentKey);

  // 1. Calculate Agent Leverage (0 - 100)
  // Driven by market value scale, current form, contract expiry proximity, and agent traits
  const formFactor = ((params.playerForm ?? 50) - 50) * 0.5;
  const contractYears = params.contractYearsRemaining !== undefined ? params.contractYearsRemaining : 2;
  const contractExpiryFactor = (4 - Math.min(4, contractYears)) * 7;
  const mvFactor = Math.min(25, Math.log10(Math.max(100_000, marketValue)) * 4.5 - 20);
  const rawLeverage = 50 + formFactor + contractExpiryFactor + mvFactor + (archetype.leverageBoost ?? 0);
  const agentLeverage = Math.max(5, Math.min(95, Math.round(rawLeverage)));

  // 2. Calculate Manager Urgency (0 - 100)
  // Deadline proximity spikes urgency exponentially (<1h spikes >=80; 24h stays low)
  const timeFactor = Math.max(0, 1 - (deadlineHoursRemaining / 24));
  let rawUrgency = 15 + (timeFactor * 70);
  if (params.squadDepthDeficit) {
    rawUrgency += 12;
  }
  const managerUrgency = Math.max(5, Math.min(99, Math.round(rawUrgency)));

  // 3. Initial Club Patience (0 - 100)
  const clubPatience = Math.max(10, Math.min(100, Math.round(100 * (archetype.walkoutToleranceMultiplier ?? 1.0))));

  // 4. Initial Offered Perks
  const baseWeeklyWage = Math.min(
    clubWageBudget,
    Math.max(1_000, Math.round(clubWageBudget * (0.75 + (archetype.wageExtractionBonus ?? 0)))),
  );

  const offeredPerks: ContractPerks = {
    baseWeeklyWage,
    appearanceFee: Math.round(baseWeeklyWage * 0.1),
    goalBonus: Math.round(baseWeeklyWage * 0.05),
    cleanSheetBonus: Math.round(baseWeeklyWage * 0.05),
    releaseClauses: {},
    squadStatus: archetype.mandatorySquadStatusMin ?? "Important",
  };

  return {
    currentRound: 1,
    maxRounds,
    deadlineHoursRemaining,
    hoursRemaining: deadlineHoursRemaining,
    dealAgreed: false,
    walkedAway: false,
    clubPatience,
    agentLeverage,
    managerUrgency,
    clubWageBudget,
    clubWageCeiling,
    offeredPerks,
    agentArchetype: agentKey,
    seed,
    rngState: curRng.state,
  };
}

/**
 * Submit counter-offer and evaluate club patience, concessions, or walkout risk.
 */
export function submitCounterOffer(
  session: HotSeatSession,
  counterDemand: CounterOfferDemand,
): HotSeatSession {
  if (session.walkedAway || session.dealAgreed) {
    return session;
  }

  const currentRound = session.currentRound + 1;
  const hoursBurned = Math.max(1, Math.ceil(session.deadlineHoursRemaining / session.maxRounds));
  const hoursRemaining = Math.max(0, session.hoursRemaining - hoursBurned);

  const demandedWage = counterDemand.demandedWage ?? session.offeredPerks.baseWeeklyWage;
  const ceiling = session.clubWageCeiling || (session.clubWageBudget * 1.25);

  // Check exorbitant demand instant walkout (F16, B05)
  // Demands >= 2.5x ceiling or >= 3.5x budget are deemed offensive
  if (demandedWage > ceiling * 2.5 || demandedWage > session.clubWageBudget * 3.5) {
    return {
      ...session,
      currentRound,
      hoursRemaining,
      clubPatience: 0,
      walkedAway: true,
      dealAgreed: false,
    };
  }

  // Calculate patience drain
  const archetype = getAgentArchetype(session.agentArchetype);
  const excess = Math.max(0, demandedWage - session.offeredPerks.baseWeeklyWage);
  const excessRatio = session.offeredPerks.baseWeeklyWage > 0 ? excess / session.offeredPerks.baseWeeklyWage : 0;

  const baseDrain = excessRatio * 50 + 5;
  const drainWithArchetype = baseDrain * (archetype.patienceDrainMultiplier ?? 1.0);

  // High agent leverage mitigates patience drain (F17)
  const leverageDiscount = Math.max(0.2, 1 - (session.agentLeverage / 100) * 0.5);
  // High manager urgency near deadline mitigates patience drain (F18)
  const urgencyDiscount = Math.max(0.3, 1 - (session.managerUrgency / 100) * 0.4);

  const patienceLost = Math.max(1, Math.round(drainWithArchetype * leverageDiscount * urgencyDiscount));
  const newPatience = Math.max(0, session.clubPatience - patienceLost);
  const walkedAway = newPatience <= 0;

  // Club concession movement towards player ask
  let newOfferedWage = session.offeredPerks.baseWeeklyWage;
  if (!walkedAway && excess > 0) {
    const concessionRatio = 0.35 + (session.agentLeverage / 100) * 0.25 + (session.managerUrgency / 100) * 0.25;
    const concession = Math.round(excess * concessionRatio);
    newOfferedWage = Math.min(session.clubWageCeiling, session.offeredPerks.baseWeeklyWage + concession);
  }

  const dealAgreed = !walkedAway && newOfferedWage >= demandedWage;

  const updatedPerks: ContractPerks = {
    ...session.offeredPerks,
    baseWeeklyWage: newOfferedWage,
    appearanceFee: counterDemand.appearanceFee ?? session.offeredPerks.appearanceFee,
    goalBonus: counterDemand.goalBonus ?? session.offeredPerks.goalBonus,
    cleanSheetBonus: counterDemand.cleanSheetBonus ?? session.offeredPerks.cleanSheetBonus,
    releaseClauses: counterDemand.releaseClauses ?? session.offeredPerks.releaseClauses,
    squadStatus: counterDemand.squadStatus ?? session.offeredPerks.squadStatus,
  };

  return {
    ...session,
    currentRound,
    hoursRemaining,
    clubPatience: newPatience,
    walkedAway,
    dealAgreed,
    offeredPerks: updatedPerks,
  };
}

/**
 * Conclude negotiation session, checking deadline expiry, forced agreements, and blunders.
 */
export function finalizeHotSeat(
  session: HotSeatSession,
  options?: { forceAgreement?: boolean; agreedWage?: number },
): HotSeatFinalResult {
  const archetype = getAgentArchetype(session.agentArchetype);
  let curRng: PRNG = { seed: session.seed, state: session.rngState };

  // Check deadline expiration before forced agreement (B06)
  if (!options?.forceAgreement && (session.hoursRemaining <= 0 || session.currentRound > session.maxRounds)) {
    return {
      dealAgreed: false,
      agreedWage: 0,
      statusMessage: "deadline_expired",
      blunderOccurred: false,
    };
  }

  if (!options?.forceAgreement && session.walkedAway) {
    return {
      dealAgreed: false,
      agreedWage: 0,
      statusMessage: "club_walked_away",
      blunderOccurred: false,
    };
  }

  const dealAgreed = options?.forceAgreement ? true : session.dealAgreed;
  if (!dealAgreed) {
    return {
      dealAgreed: false,
      agreedWage: 0,
      statusMessage: "no_deal",
      blunderOccurred: false,
    };
  }

  const agreedWage = options?.agreedWage ?? session.offeredPerks.baseWeeklyWage;

  // Blunder roll for self-represented or naive agents (B07)
  let blunderOccurred = false;
  if (archetype.blunderProbability > 0) {
    const blunderRoll = checkProbability(curRng, archetype.blunderProbability);
    curRng = blunderRoll.rng;
    blunderOccurred = blunderRoll.success;
  }

  return {
    dealAgreed: true,
    agreedWage,
    finalPerks: session.offeredPerks,
    statusMessage: "deal_agreed",
    blunderOccurred,
  };
}

/**
 * Calculate total projected annual compensation package across base wages and performance bonuses.
 */
export function calculateAnnualPerkValue(
  perks: ContractPerks,
  projections: {
    projectedAppearances?: number;
    projectedGoals?: number;
    projectedCleanSheets?: number;
  },
): number {
  const baseSalary = perks.baseWeeklyWage * 52;
  const appearanceBonus = (projections.projectedAppearances ?? 0) * (perks.appearanceFee ?? 0);
  const goalBonus = (projections.projectedGoals ?? 0) * (perks.goalBonus ?? 0);
  const cleanSheetBonus = (projections.projectedCleanSheets ?? 0) * (perks.cleanSheetBonus ?? 0);

  return Math.round(baseSalary + appearanceBonus + goalBonus + cleanSheetBonus);
}

/**
 * Determine applicable release clause based on context (relegation, continental, domestic rival).
 */
export function getApplicableBuyoutFee(
  clauses: ReleaseClauses,
  context: { suitorLeague?: "domestic_rival" | "continental_abroad" | string; clubRelegated?: boolean },
): number {
  if (context.clubRelegated && clauses.relegation !== undefined) {
    return clauses.relegation;
  }
  if (context.suitorLeague === "continental_abroad" && clauses.continental !== undefined) {
    return clauses.continental;
  }
  return clauses.domestic ?? clauses.continental ?? clauses.relegation ?? 0;
}

/**
 * Retrieve active buyout fee on contract, slashed to relegation clause on club relegation (B17).
 */
export function getActiveReleaseClause(
  contract: {
    releaseClauses?: ReleaseClauses;
    releaseClause?: number | null;
  },
  context: { isRelegated: boolean },
): number {
  const clauses = contract.releaseClauses;
  if (!clauses) {
    return contract.releaseClause ?? 0;
  }
  if (context.isRelegated) {
    if (clauses.relegation !== undefined) {
      return clauses.relegation;
    }
    const standardFee = clauses.domestic ?? clauses.continental ?? contract.releaseClause ?? 0;
    return Math.round(standardFee * 0.4); // 60% reduction
  }
  return clauses.domestic ?? clauses.continental ?? clauses.relegation ?? contract.releaseClause ?? 0;
}

/**
 * Evaluates squad status fulfillment against actual starting appearances (F21).
 */
export function evaluateSquadStatusFulfillment(params: {
  agreedStatus: SquadStatus;
  totalMatches: number;
  actualStarts: number;
}): { isBreached: boolean; moralePenalty: number; transferRequestTriggered: boolean } {
  const { agreedStatus, totalMatches, actualStarts } = params;
  const startRatio = totalMatches > 0 ? actualStarts / totalMatches : 0;

  // Thresholds: Crucial >= 85%, Important >= 65%, Squad Rotation >= 40%, Prospect >= 25%
  switch (agreedStatus) {
    case "Crucial":
      if (startRatio < 0.85) {
        return { isBreached: true, moralePenalty: -25, transferRequestTriggered: true };
      }
      return { isBreached: false, moralePenalty: 0, transferRequestTriggered: false };

    case "Important":
      if (startRatio < 0.65) {
        return { isBreached: true, moralePenalty: -15, transferRequestTriggered: false };
      }
      return { isBreached: false, moralePenalty: 0, transferRequestTriggered: false };

    case "Squad Rotation":
      if (startRatio < 0.40) {
        return { isBreached: true, moralePenalty: -10, transferRequestTriggered: false };
      }
      return { isBreached: false, moralePenalty: 0, transferRequestTriggered: false };

    case "Prospect":
      if (startRatio < 0.25) {
        return { isBreached: true, moralePenalty: -5, transferRequestTriggered: false };
      }
      return { isBreached: false, moralePenalty: 0, transferRequestTriggered: false };

    default:
      return { isBreached: false, moralePenalty: 0, transferRequestTriggered: false };
  }
}
