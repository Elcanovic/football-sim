// Developer God Menu actions: every change the God Menu makes to the career state.
//
// These bypass the simulation on purpose (they are cheats for testing), so they live apart from
// engine-bridge.js. god-menu.js owns the panel UI and calls only these functions to change state.
//
// Engine globals used here: catalogIndex, calculateOverall.

import { seasonSpanLabel } from "../celebration.js";
import { state } from "./store.js";

const NATIONAL_TEAM_TROPHIES = new Set(["world_cup", "national_continental"]);

export function devMaxMorale() {
  state.player.morale = 100;
}

export function devMaxTrust() {
  state.player.managerTrust = 100;
}

/** Move the player to another club on a fresh contract. Returns the destination team, if known. */
export function devTransfer(clubId, { weeklyWage, years }) {
  const team = catalogIndex.getTeam(clubId);
  const comp = catalogIndex.getCompetition(clubId);
  state.currentTeamId = clubId;
  state.currentCompetitionId = comp?.id || null;
  state.player.currentTeamId = clubId;
  state.player.contract = {
    clubId,
    yearsRemaining: years,
    weeklyWage,
    annualSalary: weeklyWage * 52,
    releaseClause: null,
    squadRole: "crucial",
  };
  return team;
}

/**
 * Grant a title in the latest season and return the one-entry slate the trophy overlay celebrates.
 * `kind` is "trophy" (club or national-team silverware) or "award" (individual honour).
 */
export function devGrantTitle(key, kind) {
  const p = state.player;
  const idx = Math.max(0, state.seasons.length - 1);
  const lastSeason = state.seasons[idx];
  if (kind === "award") {
    if (lastSeason) lastSeason.awards.push(key);
    p.careerTotals.awards += 1;
  } else {
    if (lastSeason) lastSeason.trophies.push(key);
    p.careerTotals.trophies += 1;
    if (NATIONAL_TEAM_TROPHIES.has(key)) p.nationalTeamStats.trophies.push(key);
  }
  const total = state.seasons.reduce((n, s) => n + s.trophies.length + (s.awards || []).length, 0);
  return {
    entries: [{
      seasonIndex: idx,
      seasonLabel: seasonSpanLabel(idx),
      age: lastSeason ? lastSeason.age : p.age,
      key,
      kind,
      teamId: state.currentTeamId,
    }],
    tallyBefore: Math.max(0, total - 1),
    tallyAfter: total,
  };
}

/**
 * Overwrite the player's six headline attributes (mapped to goalkeeper attributes for a GK),
 * age, market value and contract terms, then recompute overall.
 */
export function devApplyOverrides({ six, age, marketValue, weeklyWage, contractYears }) {
  const p = state.player;
  const [a1, a2, a3, a4, a5, physical] = six;
  if (p.position === "GK") {
    Object.assign(p.attributes, { diving: a1, handling: a2, kicking: a3, reflexes: a4, positioning: a5, physical });
  } else {
    Object.assign(p.attributes, { pace: a1, shooting: a2, passing: a3, dribbling: a4, defending: a5, physical });
  }
  p.overall = calculateOverall(p.position, p.attributes);
  p.age = age;
  p.marketValue = marketValue;
  if (p.contract) {
    p.contract.weeklyWage = weeklyWage;
    p.contract.annualSalary = weeklyWage * 52;
    p.contract.yearsRemaining = contractYears;
  }
}
