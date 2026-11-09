// Tier 2 Boundary Tests: Loans & Clause Corner Cases
// Winter scaling, Parent club match restriction, MLS non-relegation, Appearance shortfall via injury

import { loadEngineModule, test } from "../helpers.ts";
import { assertEquals, assertStrictEquals } from "../assert.ts";

// Edge Case 1: Winter Loan Mid-Season Match Opportunity Scaling
test(2, "B01", "Winter 6-Month Loan Mid-Season Match Scaling Without Wiping First Half Stats", async () => {
  const loansEngine = await loadEngineModule("../../src/engine/loansEngine.ts", "B01");
  const winterDeal = loansEngine.createLoanDeal({
    type: "winter_six_month",
    parentClubId: "team-eng-arsenal",
    loaningClubId: "team-eng-leeds",
    parentWageShare: 50,
    loaningWageShare: 50,
  });

  const seasonalStats = {
    appearances: 18,
    goals: 7,
    assists: 4,
  };

  // Simulating back half under loan deal
  const integratedStats = loansEngine.integrateWinterLoanStats(winterDeal, seasonalStats, {
    secondHalfApps: 16,
    secondHalfGoals: 5,
    secondHalfAssists: 3,
  });

  assertEquals(integratedStats.appearances, 34, "Winter loan must accumulate with first half appearances");
  assertEquals(integratedStats.goals, 12, "Goals must sum accurately across whole season");
});

// Edge Case 2: Parent Club Head-to-Head Restriction Enforcement
test(2, "B02", "Parent Club Match Restriction Excludes Player and Skips Appearance Count", async () => {
  const loansEngine = await loadEngineModule("../../src/engine/loansEngine.ts", "B02");
  const deal = loansEngine.createLoanDeal({
    type: "full_season",
    parentClubId: "team-esp-madrid",
    loaningClubId: "team-esp-getafe",
    parentWageShare: 100,
    loaningWageShare: 0,
    parentMatchRestricted: true,
  });

  // Verify match eligibility
  const eligibleVsOther = loansEngine.isEligibleForMatch(deal, "team-esp-barca");
  assertStrictEquals(eligibleVsOther, true);

  const eligibleVsParent = loansEngine.isEligibleForMatch(deal, "team-esp-madrid");
  assertStrictEquals(eligibleVsParent, false, "Must not be eligible to play against parent club");
});

// Edge Case 3: Survival Trigger in Non-Relegation League (MLS / A-League)
test(2, "B03", "Mandatory Survival Trigger Evaluates True in Non-Relegation Leagues Without Null Errors", async () => {
  const loansEngine = await loadEngineModule("../../src/engine/loansEngine.ts", "B03");
  const mlsDeal = loansEngine.createLoanDeal({
    type: "full_season",
    parentClubId: "team-usa-lafc",
    loaningClubId: "team-usa-galaxy",
    parentWageShare: 50,
    loaningWageShare: 50,
    mandatoryTriggers: {
      relegationSurvival: true,
      buyFee: 8_000_000,
    },
  });

  // MLS competition has no relegation cutoff
  const result = loansEngine.evaluateMandatoryTriggers(mlsDeal, {
    leagueId: "comp-usa-mls",
    relegationCutoff: null, // non-relegation league
    finalPosition: 14,
    appearances: 25,
  });

  assertStrictEquals(result.mustExecuteBuy, true, "Non-relegation league must treat survival trigger as fulfilled");
  assertEquals(result.fee, 8_000_000);
});

// Edge Case 4: Appearance Trigger Cut Short by Injury (18/20 Appearances)
test(2, "B04", "Appearance Trigger Voided by Injury Shortfall (18/20 Apps Returns to Parent Club)", async () => {
  const loansEngine = await loadEngineModule("../../src/engine/loansEngine.ts", "B04");
  const deal = loansEngine.createLoanDeal({
    type: "full_season",
    parentClubId: "team-ita-inter",
    loaningClubId: "team-ita-monza",
    parentWageShare: 50,
    loaningWageShare: 50,
    mandatoryTriggers: {
      minAppearances: 20,
      buyFee: 10_000_000,
    },
  });

  const evaluation = loansEngine.evaluateMandatoryTriggers(deal, {
    appearances: 18, // short of 20 threshold
  });

  assertStrictEquals(evaluation.mustExecuteBuy, false, "Appearance threshold not met must not trigger purchase");
  assertStrictEquals(evaluation.returnToParentClub, true, "Player must return to parent club on unexercised trigger");
});
