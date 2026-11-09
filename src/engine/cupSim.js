import { checkProbability } from "./prng.js";

export function simulateCupTournament(
  rng,
  _cupName,
  team,
  playerOvr,
  difficultyMultiplier = 1.0,
) {
  let curRng = rng;

  const teamStrength = team.domestic_reputation * 1.5 + team.continental_reputation * 2.0;
  const benchmarkStrength = 50 + team.international_reputation * 8;
  const playerBonus = Math.max(-10, Math.min(20, playerOvr - benchmarkStrength)) * 0.05;

  const rounds = ["R16", "QF", "SF", "F"];
  let reachedFinal = false;
  let wonCup = false;
  let roundEliminated = "R16";

  for (let r = 0; r < rounds.length; r++) {
    const roundName = rounds[r];
    const opponentRep = Math.min(5, Math.max(1, Math.round(2 + r * 0.8)));
    const opponentStrength = opponentRep * 2.5;

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

export function simulateNationalContinentalTournament(
  rng,
  _confederation,
  countryReputation,
  playerOvr,
) {
  let curRng = rng;
  const rep = Math.max(0, Math.min(5, countryReputation));

  const baseRating = rep * 3.0 + (playerOvr >= 85 ? 3.0 : playerOvr >= 78 ? 1.5 : 0);
  const rounds = ["QF", "SF", "F"];

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

export function simulateWorldCup(
  rng,
  countryFifaReputation,
  playerOvr,
) {
  let curRng = rng;
  const rep = Math.max(0, Math.min(5, countryFifaReputation));

  if (rep === 0 && playerOvr < 82) {
    return {
      rng: curRng,
      wonCup: false,
      reachedFinal: false,
      roundEliminated: "DidNotQualify",
    };
  }

  const baseRating = rep * 3.5 + (playerOvr >= 90 ? 4.5 : playerOvr >= 82 ? 2.0 : 0);
  const rounds = ["R16", "QF", "SF", "F"];

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
