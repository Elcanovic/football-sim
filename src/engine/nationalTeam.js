import { randomGaussian, randomInt } from "./prng.js";
import { simulateNationalContinentalTournament, simulateWorldCup } from "./cupSim.js";

// Call-up threshold overall based on country international reputation (0 - 5)
const CALLUP_THRESHOLDS = [52, 58, 66, 72, 77, 81];

export function checkNationalCallUp(player) {
  const rep = Math.max(0, Math.min(5, player.nationality.international_reputation || 0));
  const threshold = CALLUP_THRESHOLDS[rep];
  // Can be called up if above threshold, or if close and in hot form
  return player.overall >= threshold || (player.overall >= threshold - 3 && (player.form || 50) >= 65);
}

export function simulateNationalTeamSeason(rng, player, age) {
  let curRng = rng;
  const isCalledUp = checkNationalCallUp(player);

  if (!isCalledUp) {
    return {
      rng: curRng,
      calledUp: false,
      appearances: 0,
      goals: 0,
      assists: 0,
      cleanSheets: 0,
      tournament: null,
      trophyWon: null,
    };
  }

  const isWorldCupYear = (age - 19) % 4 === 0 && age >= 19;
  const isContinentalYear = (age - 17) % 4 === 0 && age >= 17;

  let appearances = 0;
  let goals = 0;
  let assists = 0;
  let cleanSheets = 0;
  let tournamentName = null;
  let trophyWon = null;

  const isGk = player.position === "GK";
  const pos = player.position;
  const shootAttr = player.attributes?.shooting || 65;
  const passAttr = player.attributes?.passing || 65;

  if (isWorldCupYear) {
    tournamentName = "FIFA World Cup";
    const rep = player.nationality.fifa_reputation || 0;
    const wcResult = simulateWorldCup(curRng, rep, player.overall);
    curRng = wcResult.rng;

    // Matches played in tournament (3 group games up to 7 in final)
    const tourneyGames = wcResult.wonCup
      ? 7
      : wcResult.reachedFinal
      ? 7
      : wcResult.roundEliminated === "SF"
      ? 6
      : wcResult.roundEliminated === "QF"
      ? 5
      : 3;
    appearances = tourneyGames + 4; // plus 4 warmups / qualifiers

    if (wcResult.wonCup) {
      trophyWon = "world_cup";
    }
  } else if (isContinentalYear) {
    const confed = player.nationality.confederation || "UEFA";
    const confedNames = {
      UEFA: "UEFA Euro",
      CONMEBOL: "Copa América",
      CONCACAF: "CONCACAF Gold Cup",
      CAF: "Africa Cup of Nations",
      AFC: "AFC Asian Cup",
      OFC: "OFC Nations Cup",
    };
    tournamentName = confedNames[confed] || "Continental Championship";

    const rep = player.nationality.continental_reputation || 0;
    const contResult = simulateNationalContinentalTournament(curRng, confed, rep, player.overall);
    curRng = contResult.rng;

    const tourneyGames = contResult.wonCup
      ? 6
      : contResult.reachedFinal
      ? 6
      : contResult.roundEliminated === "SF"
      ? 5
      : 4;
    appearances = tourneyGames + 3;

    if (contResult.wonCup) {
      trophyWon = "national_continental";
    }
  } else {
    // Normal year: 4 - 8 qualifiers / friendlies
    const { rng: rApp, value: apps } = randomInt(curRng, 4, 8);
    curRng = rApp;
    appearances = apps;
  }

  // Calculate international goals & assists
  if (isGk) {
    cleanSheets = Math.max(0, Math.round(appearances * 0.4));
  } else {
    let goalRate = 0.15;
    if (pos === "ST") goalRate = 0.35 + (shootAttr / 100) * 0.35;
    else if (pos === "LW" || pos === "RW") goalRate = 0.20 + (shootAttr / 100) * 0.25;
    else if (pos === "CAM") goalRate = 0.15 + (shootAttr / 100) * 0.20;

    const assistRate = 0.10 + (passAttr / 100) * 0.20;

    const expectedGoals = appearances * goalRate;
    const gRoll = randomGaussian(curRng, expectedGoals, Math.sqrt(Math.max(1, expectedGoals)));
    curRng = gRoll.rng;
    goals = Math.max(0, Math.round(gRoll.value));

    const expectedAssists = appearances * assistRate;
    const aRoll = randomGaussian(curRng, expectedAssists, Math.sqrt(Math.max(1, expectedAssists)));
    curRng = aRoll.rng;
    assists = Math.max(0, Math.round(aRoll.value));
  }

  return {
    rng: curRng,
    calledUp: true,
    appearances,
    goals,
    assists,
    cleanSheets,
    tournament: tournamentName,
    trophyWon,
  };
}
