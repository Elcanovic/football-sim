import { checkProbability } from "./prng.js";

// -------------------------------------------------------------------------
// League Prestige Coefficients (0.0 - 1.0, global scale)
// Loosely modelled on UEFA/CONMEBOL/AFC/CAF club coefficient rankings.
// Drives continental qualification slots and club strength in continental cups,
// so clubs from low-prestige leagues (e.g. Qarabağ) almost never win the UCL.
// -------------------------------------------------------------------------
export const LEAGUE_COEFFICIENTS = {
  // UEFA
  "premier-league": 1.0,
  "laliga": 0.97,
  "serie-a": 0.94,
  "bundesliga": 0.93,
  "ligue-1": 0.86,
  "por-primeira-liga": 0.76,
  "eredivisie": 0.74,
  "pro-league-bel": 0.66,
  "superliga-turquia": 0.62,
  "liga-checa": 0.56,
  "scottish-premiership": 0.55,
  "bundesliga-austria": 0.54,
  "super-league-grecia": 0.53,
  "swiss-super-league": 0.52,
  "superliga-dinamarca": 0.52,
  "eliteserien": 0.50,
  "premier-league-ucrania": 0.48,
  "super-liga-serbia": 0.48,
  "primera-division-croacia": 0.48,
  "ekstraklasa": 0.47,
  "liga-premier-de-rusia": 0.45,
  "allsvenskan": 0.45,
  "liga-1-rumania": 0.40,
  "aze-premyer-liqasi": 0.34,
  "prva-makedonska-fudbalska-liga": 0.20,
  // CONMEBOL
  "brasileirao": 0.78,
  "liga-profesional": 0.70,
  "liga-dimayor": 0.46,
  "liga-uruguaya": 0.45,
  "ligapro-serie-a": 0.45,
  "copa-de-primera": 0.40,
  "liga-de-primera": 0.40,
  "liga1": 0.33,
  "liga-bolivia": 0.28,
  "liga-futve": 0.25,
  // CONCACAF
  "liga-mx": 0.62,
  "usa-mls": 0.55,
  "primera-division-costa-rica": 0.30,
  "liga-nacional-guatemala": 0.22,
  "hon-liga-nacional": 0.22,
  "pan-primera-division": 0.22,
  "slv-primera-division": 0.20,
  "liga-primera-de-nicaragua": 0.16,
  "liga-dominicana-de-futbol": 0.15,
  // AFC
  "saudi-pro-league": 0.58,
  "j1-league": 0.55,
  "k-league-1": 0.50,
  "csl-china": 0.42,
  "persian-gulf-pro-league": 0.40,
  "a-league": 0.40,
  "super-league-indonesia": 0.25,
  // CAF
  "premier_league_egipto": 0.50,
  "botola-pro": 0.48,
  "sudafrica-premiership": 0.42,
  "nigeria-premier-football-league": 0.28,
  // OFC
  "nz-national-league": 0.22,
};

// Strength of the best league inside each confederation (sets the bar for the final rounds)
const CONFED_ELITE = { UEFA: 1.0, CONMEBOL: 0.78, CONCACAF: 0.62, AFC: 0.58, CAF: 0.50, OFC: 0.22 };

// Leagues currently excluded from continental competition
export const CONTINENTAL_BANNED = ["liga-premier-de-rusia"];

export function getLeagueCoefficient(comp) {
  if (!comp) return 0.2;
  if (LEAGUE_COEFFICIENTS[comp.id] !== undefined) return LEAGUE_COEFFICIENTS[comp.id];
  return comp.tier === 1 ? 0.3 : comp.tier === 2 ? 0.15 : 0.08;
}

/**
 * Continental slots per league: primary (UCL/Libertadores...), secondary (UEL/Sudamericana...),
 * and number of qualifying rounds the primary-slot club must survive first.
 */
export function getContinentalSlots(comp) {
  const none = { primary: 0, secondary: 0, qualifierRounds: 0 };
  if (!comp || comp.tier !== 1 || CONTINENTAL_BANNED.includes(comp.id)) return none;
  const c = getLeagueCoefficient(comp);

  switch (comp.confederation) {
    case "UEFA":
      if (c >= 0.9) return { primary: 4, secondary: 2, qualifierRounds: 0 };
      if (c >= 0.7) return { primary: 2, secondary: 2, qualifierRounds: 0 };
      if (c >= 0.5) return { primary: 1, secondary: 2, qualifierRounds: 1 };
      return { primary: 1, secondary: 2, qualifierRounds: 3 };
    case "CONMEBOL":
      if (c >= 0.65) return { primary: 5, secondary: 6, qualifierRounds: 0 };
      if (c >= 0.4) return { primary: 3, secondary: 3, qualifierRounds: 1 };
      return { primary: 2, secondary: 2, qualifierRounds: 2 };
    case "CONCACAF":
      if (c >= 0.5) return { primary: 3, secondary: 0, qualifierRounds: 0 };
      return { primary: 1, secondary: 0, qualifierRounds: 1 };
    case "AFC":
      if (c >= 0.5) return { primary: 3, secondary: 1, qualifierRounds: 0 };
      return { primary: 1, secondary: 1, qualifierRounds: 1 };
    case "CAF":
      return { primary: 2, secondary: 2, qualifierRounds: c >= 0.45 ? 1 : 2 };
    case "OFC":
      return { primary: 1, secondary: 0, qualifierRounds: 1 };
    default:
      return none;
  }
}

/** Club strength on a global 0-100 scale for continental fixtures. */
export function getClubContinentalPower(team, comp, playerOvr) {
  const coef = getLeagueCoefficient(comp);
  const dom = Math.max(0, Math.min(5, team?.domestic_reputation ?? 2));
  const intl = Math.max(0, Math.min(5, team?.international_reputation ?? 1));
  const clubRep = dom * 0.5 + intl * 0.5;
  // A superstar can lift a team a little; a teenage squad player barely matters
  const playerImpact = Math.max(-1.5, Math.min(7, (playerOvr - 75) * 0.25));
  return 40 + coef * 35 + clubRep * 3 + playerImpact;
}

/** Estimated league finish when no previous season exists at the club (by reputation order). */
export function estimateLeagueRank(team, comp) {
  if (!comp || !team) return 99;
  const sorted = [...comp.teams].sort((a, b) =>
    (b.domestic_reputation - a.domestic_reputation) || (b.international_reputation - a.international_reputation)
  );
  const idx = sorted.findIndex((t) => t.id === team.id);
  return idx >= 0 ? idx + 1 : comp.teams.length;
}

function logistic(x) {
  return 1 / (1 + Math.exp(-x));
}

/**
 * Simulates a continental club competition run.
 * level: "primary" (Champions League tier) or "secondary" (Europa League tier)
 */
export function simulateContinentalCompetition(rng, team, comp, playerOvr, level = "primary", qualifierRounds = 0) {
  let curRng = rng;
  const elite = 40 + (CONFED_ELITE[comp?.confederation] ?? 0.5) * 35 + 13;
  const power = getClubContinentalPower(team, comp, playerOvr);
  const slope = 0.165;

  // Qualifying rounds (low-coefficient champions must survive these first)
  const qualBase = level === "primary" ? elite - 20 : elite - 24;
  for (let q = 0; q < qualifierRounds; q++) {
    const opp = qualBase + q * 3;
    const p = Math.max(0.03, Math.min(0.95, logistic((power - opp) * slope)));
    const check = checkProbability(curRng, p);
    curRng = check.rng;
    if (!check.success) {
      return { rng: curRng, wonCup: false, reachedFinal: false, roundEliminated: `Qualifying R${q + 1}`, power };
    }
  }

  const stages = ["League Phase", "R16", "QF", "SF", "F"];
  const offsets = level === "primary" ? [10, 6, 3, 1.5, 0] : [16, 12, 9, 7, 6];

  for (let i = 0; i < stages.length; i++) {
    const opp = elite - offsets[i];
    const p = Math.max(0.01, Math.min(0.95, logistic((power - opp) * slope)));
    const check = checkProbability(curRng, p);
    curRng = check.rng;
    if (!check.success) {
      return { rng: curRng, wonCup: false, reachedFinal: stages[i] === "F", roundEliminated: stages[i], power };
    }
  }

  return { rng: curRng, wonCup: true, reachedFinal: true, roundEliminated: "Winner", power };
}

// -------------------------------------------------------------------------
// Variable Retirement Model
// Annual retirement hazard from age 30+, modulated by overall, position,
// lifestyle, injuries and morale. Allows early retirements (~32-33) as well
// as long-lasting careers (40+), hard cap at 43.
// -------------------------------------------------------------------------
const RETIREMENT_HAZARD = {
  30: 0.01,
  31: 0.02,
  32: 0.04,
  33: 0.08,
  34: 0.14,
  35: 0.22,
  36: 0.32,
  37: 0.45,
  38: 0.58,
  39: 0.70,
};
export const MAX_CAREER_AGE = 43;

export function checkRetirement(rng, player, seasonInjury, options = {}) {
  const age = player.age;
  if (age >= MAX_CAREER_AGE) {
    return { rng, retire: true, reason: `Body finally calls time at ${age} after an iron-man career.` };
  }
  const minAge = options.minRetirementAge ?? player.minRetirementAge ?? 30;
  if (age < minAge) return { rng, retire: false };

  let hazard = RETIREMENT_HAZARD[age] ?? 0.82;
  const ovr = player.overall;
  if (ovr >= 85) hazard *= 0.45;
  else if (ovr >= 80) hazard *= 0.7;
  else if (ovr < 65) hazard *= 2.2;
  else if (ovr < 70) hazard *= 1.5;

  if (player.position === "GK") hazard *= 0.6;

  const active = (id) => (player.lifestyleChoices || []).some((c) => c.id === id && c.active);
  if (active("cryo_physio")) hazard *= 0.7;
  if (active("private_chef")) hazard *= 0.85;
  if (active("vip_nightlife")) hazard *= 1.3;

  if (seasonInjury?.severity === "severe") hazard *= 1.6;
  if ((player.morale ?? 70) < 35) hazard *= 1.25;

  hazard = Math.max(0, Math.min(0.95, hazard));
  const check = checkProbability(rng, hazard);
  if (!check.success) return { rng: check.rng, retire: false };

  let reason = `Hangs up the boots at ${age}, bowing out on his own terms.`;
  if (seasonInjury?.severity === "severe") reason = `Forced into retirement at ${age} after a ${seasonInjury.name}.`;
  else if (ovr < 68) reason = `Retires at ${age} as declining sharpness ends top-flight football.`;
  else if (age <= 33) reason = `Shock early retirement at ${age} while still near his peak.`;
  else if (age >= 39) reason = `Legendary longevity — retires at ${age}.`;
  return { rng: check.rng, retire: true, reason };
}
