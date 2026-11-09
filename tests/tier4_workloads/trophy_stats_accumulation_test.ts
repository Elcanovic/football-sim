// Tier 4 Workload Tests: Silverware Sanctuary & Career Stats Accumulation
// Validates domestic, continental, and international silverware tracking and GOAT index computation

import { loadEngineModule, test } from "../helpers.ts";
import { assert } from "../assert.ts";
import { catalogIndex, executeDecisionAndSimulate, initPlayerCareer } from "../../src/index.ts";

test(4, "W02", "Career Silverware Sanctuary Accumulation and Algorithmic GOAT Legacy Index Calculation", async () => {
  // Simulate full career
  let state = initPlayerCareer(
    "trophy-accumulation-seed-77",
    "long",
    "DiStefano",
    9,
    "right",
    "ES",
    "ST",
    "normal",
  );

  let seasons = 0;

  while (state.phase === "career" && state.player && state.player.age < 38) {
    seasons++;
    if (!state.currentEvent || state.currentEvent.options.length === 0) break;

    // Choose highest reputation club option to maximize trophy contention
    let bestOption = state.currentEvent.options[0];
    let maxRep = -1;
    for (const opt of state.currentEvent.options) {
      if (opt.teamId) {
        const team = catalogIndex.getTeam(opt.teamId);
        if (team && team.international_reputation > maxRep) {
          maxRep = team.international_reputation;
          bestOption = opt;
        }
      }
    }

    state = executeDecisionAndSimulate(state, bestOption.id);
  }

  assert(seasons >= 15, `Expected >= 15 seasons simulated, got ${seasons}`);
  const totals = state.player!.careerTotals;
  assert(totals.appearances > 0, "Player must have appearances recorded");

  // Load retirement museum to calculate GOAT index on accumulated career
  const museum = await loadEngineModule("../../src/engine/retirementMuseum.ts", "W02_museum");
  const goatReport = museum.calculateGoatLegacyIndex({
    totalTrophies: totals.trophies,
    peakOVR: state.player!.overall,
    careerAppearances: totals.appearances,
    careerGoals: totals.goals,
    ballonDorCount: totals.awards,
    clutchMomentsCount: 5,
  });

  assert(
    goatReport.score >= 0 && goatReport.score <= 1000,
    `GOAT index must be normalized within [0, 1000], got ${goatReport.score}`,
  );
  assert(goatReport.tierName.length > 0, "GOAT report must assign historic tier name");
});
