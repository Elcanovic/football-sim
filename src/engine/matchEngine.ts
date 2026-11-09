import type { GoalkeeperAttributes, OutfieldAttributes, Player, SeasonMatchStats, SquadRole, Team } from "./types.ts";
import { PRNG, randomGaussian, randomInt } from "./prng.ts";

export function evaluateSquadRole(playerOvr: number, teamReputation: number, managerTrust: number): SquadRole {
  // Benchmark overall for team reputation
  // rep 0: 58, rep 1: 68, rep 2: 75, rep 3: 80, rep 4: 84, rep 5: 88
  const reps = [58, 68, 75, 80, 84, 88];
  const benchmark = reps[Math.max(0, Math.min(5, teamReputation))];
  const delta = playerOvr - benchmark;

  // Manager trust bonus: high trust pushes up role
  const trustBonus = managerTrust >= 80 ? 3 : managerTrust <= 30 ? -4 : 0;
  const effectiveDelta = delta + trustBonus;

  if (effectiveDelta >= 5) return "crucial";
  if (effectiveDelta >= 0) return "important";
  if (effectiveDelta >= -5) return "rotation";
  if (effectiveDelta >= -10) return "backup";
  return "prospect";
}

export function simulateSeasonPlayerStats(
  rng: PRNG,
  player: Player,
  team: Team,
  _contractRole: SquadRole,
  isSuspended = false,
  isInjured = false,
): { rng: PRNG; stats: SeasonMatchStats; managerTrustDelta: number; moraleDelta: number } {
  let curRng = rng;

  // Dynamically determine on-pitch squad role based on OVR vs team benchmark
  const activeRole = evaluateSquadRole(player.overall, team.international_reputation, player.managerTrust);

  // 1. Appearances based on agreed role & health
  const effectiveInjury = player.activeInjury ||
    (isInjured ? { severity: "moderate" as const, gamesMissed: 12 } : null);
  const gamesMissed = effectiveInjury ? effectiveInjury.gamesMissed : 0;

  let appMin = 0;
  let appMax = 0;

  if (isSuspended) {
    appMin = 4;
    appMax = 14;
  } else {
    switch (activeRole) {
      case "crucial":
        appMin = 42;
        appMax = 52;
        break;
      case "important":
        appMin = 35;
        appMax = 46;
        break;
      case "rotation":
        appMin = 20;
        appMax = 32;
        break;
      case "backup":
        appMin = 8;
        appMax = 18;
        break;
      case "prospect":
        appMin = 2;
        appMax = 10;
        break;
    }
  }

  // Manager Trust modifier: If manager trust is high (>70), get more games; if low (<40), get fewer
  const trustModifier = (player.managerTrust - 50) * 0.1;
  const { rng: r1, value: rawApps } = randomInt(curRng, appMin, appMax);
  curRng = r1;
  const appearances = Math.max(0, Math.min(54, Math.round(rawApps + trustModifier) - gamesMissed));
  const minutesPlayed = appearances * 82;

  // 2. Goal & Assist generation driven by attributes & position
  const isGk = player.position === "GK";
  const pos = player.position;

  // Form multiplier: 50 is normal, 80 is hot (+15%), 20 is cold (-15%)
  const formFactor = 1 + ((player.form - 50) / 50) * 0.18;
  const moraleFactor = 1 + ((player.morale - 50) / 50) * 0.10;
  const performanceFactor = formFactor * moraleFactor;

  let goals = 0;
  let assists = 0;
  let cleanSheets = 0;
  let goalsConceded = 0;
  let xG = 0;
  let xA = 0;

  if (isGk) {
    const gk = player.attributes as GoalkeeperAttributes;
    // Team quality protects keeper; keeper reflexes make clean sheets
    const teamDefFactor = 1 + (team.domestic_reputation * 0.1);
    const gkQuality = (gk.reflexes + gk.positioning + gk.diving) / 3;

    // Conceded: ~0.7 to 1.8 per game
    const avgConcededPerGame = Math.max(0.5, 2.2 - (gkQuality * 0.012) - (teamDefFactor * 0.15));
    const concededRoll = randomGaussian(curRng, avgConcededPerGame * appearances, appearances * 0.2);
    curRng = concededRoll.rng;
    goalsConceded = Math.max(0, Math.round(concededRoll.value));

    // Clean sheets: ~ 20% to 50% of games
    const csRatio = Math.max(0.1, Math.min(0.55, 0.2 + (gkQuality - 60) * 0.008 + (team.domestic_reputation * 0.03)));
    cleanSheets = Math.max(0, Math.round(appearances * csRatio * performanceFactor));
  } else {
    const out = player.attributes as OutfieldAttributes;

    // Attacking potency
    let baseGoalsPerApp = 0;
    let baseAssistsPerApp = 0;

    switch (pos) {
      case "ST":
        baseGoalsPerApp = 0.25 + (out.shooting / 100) * 0.55 + (out.pace / 100) * 0.15;
        baseAssistsPerApp = 0.05 + (out.passing / 100) * 0.20;
        break;
      case "LW":
      case "RW":
        baseGoalsPerApp = 0.15 + (out.shooting / 100) * 0.35 + (out.pace / 100) * 0.20;
        baseAssistsPerApp = 0.15 + (out.passing / 100) * 0.30 + (out.dribbling / 100) * 0.15;
        break;
      case "CAM":
        baseGoalsPerApp = 0.12 + (out.shooting / 100) * 0.30;
        baseAssistsPerApp = 0.22 + (out.passing / 100) * 0.45 + (out.dribbling / 100) * 0.15;
        break;
      case "LM":
      case "RM":
        baseGoalsPerApp = 0.08 + (out.shooting / 100) * 0.20;
        baseAssistsPerApp = 0.18 + (out.passing / 100) * 0.35;
        break;
      case "CM":
        baseGoalsPerApp = 0.05 + (out.shooting / 100) * 0.15;
        baseAssistsPerApp = 0.12 + (out.passing / 100) * 0.30;
        break;
      case "LB":
      case "RB":
        baseGoalsPerApp = 0.02 + (out.pace / 100) * 0.05;
        baseAssistsPerApp = 0.10 + (out.passing / 100) * 0.25;
        break;
      case "CDM":
        baseGoalsPerApp = 0.02;
        baseAssistsPerApp = 0.05 + (out.passing / 100) * 0.12;
        break;
      case "CB":
        baseGoalsPerApp = 0.04 + (out.physical / 100) * 0.06; // Set piece headers
        baseAssistsPerApp = 0.01;
        break;
    }

    // Team reputation boost (playing for Real Madrid or Man City yields more team chances)
    const teamBonus = 0.75 + (team.domestic_reputation * 0.1);
    const expectedGoalsTotal = appearances * baseGoalsPerApp * teamBonus * performanceFactor;
    const expectedAssistsTotal = appearances * baseAssistsPerApp * teamBonus * performanceFactor;

    xG = Math.round(expectedGoalsTotal * 10) / 10;
    xA = Math.round(expectedAssistsTotal * 10) / 10;

    // Actual goals and assists with realistic variance
    const gRoll = randomGaussian(curRng, xG, Math.sqrt(Math.max(1, xG)));
    curRng = gRoll.rng;
    goals = Math.max(0, Math.round(gRoll.value));

    const aRoll = randomGaussian(curRng, xA, Math.sqrt(Math.max(1, xA)));
    curRng = aRoll.rng;
    assists = Math.max(0, Math.round(aRoll.value));

    // Defender clean sheets
    if (["CB", "LB", "RB", "CDM"].includes(pos)) {
      const defQuality = out.defending * 0.6 + out.physical * 0.4;
      const csRatio = 0.2 + (defQuality / 100) * 0.25 + (team.domestic_reputation * 0.02);
      cleanSheets = Math.max(0, Math.round(appearances * csRatio));
    }
  }

  // 3. Calculate Average Match Rating (e.g. 6.6 to 8.2)
  let baseRating = 6.8;
  if (appearances > 0) {
    if (isGk) {
      baseRating += (cleanSheets / Math.max(1, appearances)) * 1.5;
    } else {
      const gPerGame = goals / appearances;
      const aPerGame = assists / appearances;
      baseRating += (gPerGame * 1.2) + (aPerGame * 0.8);
    }
    baseRating *= 0.95 + (performanceFactor - 1) * 0.2;
  }
  const ratingNoise = randomGaussian(curRng, 0, 0.15);
  curRng = ratingNoise.rng;
  const averageRating = Math.max(6.0, Math.min(8.6, Math.round((baseRating + ratingNoise.value) * 100) / 100));

  // 4. Calculate Manager Trust and Morale shifts based on season output
  let managerTrustDelta = 0;
  let moraleDelta = 0;

  if (averageRating >= 7.3) {
    managerTrustDelta += 10;
    moraleDelta += 8;
  } else if (averageRating < 6.7) {
    managerTrustDelta -= 12;
    moraleDelta -= 10;
  }

  if (appearances >= 35) {
    moraleDelta += 5;
  } else if (appearances < 15 && !isInjured && !isSuspended) {
    moraleDelta -= 15; // Frustrated with lack of playing time
  }

  return {
    rng: curRng,
    stats: {
      appearances,
      goals,
      assists,
      cleanSheets,
      goalsConceded,
      xG,
      xA,
      averageRating,
      minutesPlayed,
    },
    managerTrustDelta,
    moraleDelta,
  };
}
