import type { Team } from "../data/index.ts";
import { checkProbability, PRNG } from "./prng.ts";

export interface CupSimResult {
  rng: PRNG;
  wonCup: boolean;
  reachedFinal: boolean;
  roundEliminated: "R16" | "QF" | "SF" | "F" | "Winner" | "DidNotQualify";
}

/**
 * Fast Cup & Tournament Knockout Bracket Engine
 */
export function simulateCupTournament(
  rng: PRNG,
  _cupName: string,
  team: Team,
  playerOvr: number,
  difficultyMultiplier = 1.0, // 1.0 for domestic cup, 1.8 for Champions League, 2.2 for World Cup
): CupSimResult {
  let curRng = rng;

  // Base team strength: domestic_reputation (0-5) + continental_reputation (0-5)
  const teamStrength = team.domestic_reputation * 1.5 + team.continental_reputation * 2.0;
  const benchmarkStrength = 50 + team.international_reputation * 8;
  const playerBonus = Math.max(-10, Math.min(20, playerOvr - benchmarkStrength)) * 0.05;

  const rounds = ["R16", "QF", "SF", "F"] as const;
  let reachedFinal = false;
  let wonCup = false;
  let roundEliminated: CupSimResult["roundEliminated"] = "R16";

  for (let r = 0; r < rounds.length; r++) {
    const roundName = rounds[r];
    // Opponent gets progressively harder in later rounds
    const opponentRep = Math.min(5, Math.max(1, Math.round(2 + r * 0.8)));
    const opponentStrength = opponentRep * 2.5;

    // Win probability based on logistic difference
    const diff = (teamStrength + playerBonus) - opponentStrength;
    const baseWinChance = 1 / (1 + Math.exp(-diff * 0.35));
    const adjustedChance = Math.max(0.12, Math.min(0.88, baseWinChance / difficultyMultiplier));

    const check = checkProbability(curRng, adjustedChance);
    curRng = check.rng;

    if (!check.success) {
      roundEliminated = roundName;
      break;
    }

    if (roundName === "F") {
      reachedFinal = true;
      wonCup = true;
      roundEliminated = "Winner";
    }
  }

  return {
    rng: curRng,
    wonCup,
    reachedFinal,
    roundEliminated,
  };
}

/**
 * Simulates international continental tournaments (Euro / Copa America / AFCON)
 */
export function simulateNationalContinentalTournament(
  rng: PRNG,
  _confederation: string,
  countryReputation: number,
  playerOvr: number,
): CupSimResult {
  let curRng = rng;
  const rep = Math.max(0, Math.min(5, countryReputation));

  // Rep 5 (Argentina/Brazil/France/Spain): High chance of going deep
  const baseRating = rep * 3.0 + (playerOvr >= 85 ? 3.0 : playerOvr >= 78 ? 1.5 : 0);
  const rounds = ["QF", "SF", "F"] as const;

  for (let r = 0; r < rounds.length; r++) {
    const oppRating = 7.0 + r * 2.5;
    const winProb = 1 / (1 + Math.exp(-(baseRating - oppRating) * 0.3));
    const check = checkProbability(curRng, Math.max(0.15, Math.min(0.85, winProb)));
    curRng = check.rng;

    if (!check.success) {
      return {
        rng: curRng,
        wonCup: false,
        reachedFinal: r === 2,
        roundEliminated: rounds[r],
      };
    }
  }

  return {
    rng: curRng,
    wonCup: true,
    reachedFinal: true,
    roundEliminated: "Winner",
  };
}

/**
 * Simulates FIFA World Cup
 */
export function simulateWorldCup(
  rng: PRNG,
  countryFifaReputation: number,
  playerOvr: number,
): CupSimResult {
  let curRng = rng;
  const rep = Math.max(0, Math.min(5, countryFifaReputation));

  // Minimum overall threshold to even compete
  if (rep === 0 && playerOvr < 82) {
    return {
      rng: curRng,
      wonCup: false,
      reachedFinal: false,
      roundEliminated: "DidNotQualify",
    };
  }

  const baseRating = rep * 3.5 + (playerOvr >= 90 ? 4.5 : playerOvr >= 82 ? 2.0 : 0);
  const rounds = ["R16", "QF", "SF", "F"] as const;

  for (let r = 0; r < rounds.length; r++) {
    const oppRating = 9.0 + r * 2.2;
    const winProb = 1 / (1 + Math.exp(-(baseRating - oppRating) * 0.28));
    const check = checkProbability(curRng, Math.max(0.08, Math.min(0.82, winProb)));
    curRng = check.rng;

    if (!check.success) {
      return {
        rng: curRng,
        wonCup: false,
        reachedFinal: r === 3,
        roundEliminated: rounds[r],
      };
    }
  }

  return {
    rng: curRng,
    wonCup: true,
    reachedFinal: true,
    roundEliminated: "Winner",
  };
}
