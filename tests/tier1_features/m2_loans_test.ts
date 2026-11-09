// Tier 1 Feature Tests: Milestone 2 Loans & Clauses (Features 5–14)
// Full-season, Winter, Multi-year, Wage splits, Option-to-buy, Mandatory triggers, Recall, Match restrictions

import { loadEngineModule, test } from "../helpers.ts";
import { assert, assertEquals, assertStrictEquals } from "../assert.ts";

// F05: Full-Season Loans
test(1, "F05", "Full-Season Loan Structure and Contract Invariants", async () => {
  const loansEngine = await loadEngineModule("../../src/engine/loansEngine.ts", "F05");
  const deal = loansEngine.createLoanDeal({
    type: "full_season",
    parentClubId: "team-eng-chelsea",
    loaningClubId: "team-eng-everton",
    parentWageShare: 50,
    loaningWageShare: 50,
  });

  assert(deal.id, "Loan deal must have unique ID");
  assertStrictEquals(deal.type, "full_season");
  assertStrictEquals(deal.seasonsRemaining, 1);
  assertEquals(deal.parentClubId, "team-eng-chelsea");
  assertEquals(deal.loaningClubId, "team-eng-everton");
});

// F06: 6-Month Winter Loans
test(1, "F06", "6-Month Winter Loan Mid-Season Scheduling", async () => {
  const loansEngine = await loadEngineModule("../../src/engine/loansEngine.ts", "F06");
  const deal = loansEngine.createLoanDeal({
    type: "winter_six_month",
    parentClubId: "team-esp-madrid",
    loaningClubId: "team-esp-valencia",
    parentWageShare: 40,
    loaningWageShare: 60,
  });

  assertStrictEquals(deal.type, "winter_six_month");
  // Expected match allocation for winter loan is ~15-19 matches
  const allocatedGames = loansEngine.calculateLoanMatchAllocation(deal);
  assert(
    allocatedGames >= 15 && allocatedGames <= 20,
    `Allocated games must be half-season (15-20), got ${allocatedGames}`,
  );
});

// F07: Multi-Year Developmental Loans
test(1, "F07", "Multi-Year Developmental Loan for U-21 Prospects", async () => {
  const loansEngine = await loadEngineModule("../../src/engine/loansEngine.ts", "F07");
  const youngDeal = loansEngine.createLoanDeal({
    type: "multi_year_dev",
    parentClubId: "team-ger-bayern",
    loaningClubId: "team-ger-stuttgart",
    playerAge: 19,
    parentWageShare: 80,
    loaningWageShare: 20,
  });

  assertStrictEquals(youngDeal.type, "multi_year_dev");
  assertStrictEquals(youngDeal.seasonsRemaining, 2);

  // Invariant: Disallowed for players older than 23
  let rejected = false;
  try {
    loansEngine.createLoanDeal({
      type: "multi_year_dev",
      parentClubId: "team-ger-bayern",
      loaningClubId: "team-ger-stuttgart",
      playerAge: 25,
      parentWageShare: 50,
      loaningWageShare: 50,
    });
  } catch {
    rejected = true;
  }
  assert(rejected, "Multi-year developmental loans must reject players older than age cutoff");
});

// F08: Customizable Wage Splits (0% to 100%)
test(1, "F08", "Customizable Wage Split Sum Invariant (100%)", async () => {
  const loansEngine = await loadEngineModule("../../src/engine/loansEngine.ts", "F08");
  const splitDeal = loansEngine.createLoanDeal({
    type: "full_season",
    parentClubId: "team-fra-psg",
    loaningClubId: "team-fra-lyon",
    parentWageShare: 30,
    loaningWageShare: 70,
  });

  assertEquals(splitDeal.parentWageShare + splitDeal.loaningWageShare, 100, "Wage splits must sum exactly to 100%");

  // Invariant: Wage splits outside 0-100 or summing != 100 must throw
  let invalidSplitRejected = false;
  try {
    loansEngine.createLoanDeal({
      type: "full_season",
      parentClubId: "team-fra-psg",
      loaningClubId: "team-fra-lyon",
      parentWageShare: 60,
      loaningWageShare: 60,
    });
  } catch {
    invalidSplitRejected = true;
  }
  assert(invalidSplitRejected, "Wage split exceeding 100% total must be rejected");
});

// F09: Option-to-Buy Loan Clause
test(1, "F09", "Option-to-Buy Clause Execution", async () => {
  const loansEngine = await loadEngineModule("../../src/engine/loansEngine.ts", "F09");
  const deal = loansEngine.createLoanDeal({
    type: "full_season",
    parentClubId: "team-ita-juve",
    loaningClubId: "team-ita-roma",
    parentWageShare: 0,
    loaningWageShare: 100,
    optionToBuyFee: 18_000_000,
  });

  assertEquals(deal.optionToBuyFee, 18_000_000);
  const canExercise = loansEngine.canExerciseOptionToBuy(deal, { clubFunds: 25_000_000 });
  assertStrictEquals(canExercise, true);

  const cannotExercise = loansEngine.canExerciseOptionToBuy(deal, { clubFunds: 10_000_000 });
  assertStrictEquals(cannotExercise, false);
});

// F10: Mandatory Relegation Survival Trigger
test(1, "F10", "Mandatory Survival Purchase Trigger Evaluation", async () => {
  const loansEngine = await loadEngineModule("../../src/engine/loansEngine.ts", "F10");
  const deal = loansEngine.createLoanDeal({
    type: "full_season",
    parentClubId: "team-eng-arsenal",
    loaningClubId: "team-eng-wolves",
    parentWageShare: 50,
    loaningWageShare: 50,
    mandatoryTriggers: {
      relegationSurvival: true,
      buyFee: 12_000_000,
    },
  });

  // Safe position
  const safeTrigger = loansEngine.evaluateMandatoryTriggers(deal, {
    relegated: false,
    promoted: false,
    appearances: 15,
  });
  assertStrictEquals(safeTrigger.mustExecuteBuy, true);
  assertEquals(safeTrigger.fee, 12_000_000);

  // Relegated position
  const relegatedTrigger = loansEngine.evaluateMandatoryTriggers(deal, {
    relegated: true,
    promoted: false,
    appearances: 15,
  });
  assertStrictEquals(relegatedTrigger.mustExecuteBuy, false);
});

// F11: Mandatory Promotion Trigger
test(1, "F11", "Mandatory Promotion Purchase Trigger Evaluation", async () => {
  const loansEngine = await loadEngineModule("../../src/engine/loansEngine.ts", "F11");
  const deal = loansEngine.createLoanDeal({
    type: "full_season",
    parentClubId: "team-eng-city",
    loaningClubId: "team-eng-leeds",
    parentWageShare: 50,
    loaningWageShare: 50,
    mandatoryTriggers: {
      promotion: true,
      buyFee: 20_000_000,
    },
  });

  const promotedTrigger = loansEngine.evaluateMandatoryTriggers(deal, {
    relegated: false,
    promoted: true,
    appearances: 10,
  });
  assertStrictEquals(promotedTrigger.mustExecuteBuy, true);
  assertEquals(promotedTrigger.fee, 20_000_000);

  const notPromotedTrigger = loansEngine.evaluateMandatoryTriggers(deal, {
    relegated: false,
    promoted: false,
    appearances: 10,
  });
  assertStrictEquals(notPromotedTrigger.mustExecuteBuy, false);
});

// F12: Mandatory Appearance Trigger
test(1, "F12", "Mandatory Appearance Threshold Purchase Trigger", async () => {
  const loansEngine = await loadEngineModule("../../src/engine/loansEngine.ts", "F12");
  const deal = loansEngine.createLoanDeal({
    type: "full_season",
    parentClubId: "team-esp-barca",
    loaningClubId: "team-esp-betis",
    parentWageShare: 50,
    loaningWageShare: 50,
    mandatoryTriggers: {
      minAppearances: 20,
      buyFee: 15_000_000,
    },
  });

  const metTrigger = loansEngine.evaluateMandatoryTriggers(deal, {
    relegated: false,
    promoted: false,
    appearances: 22,
  });
  assertStrictEquals(metTrigger.mustExecuteBuy, true);

  const unmetTrigger = loansEngine.evaluateMandatoryTriggers(deal, {
    relegated: false,
    promoted: false,
    appearances: 18,
  });
  assertStrictEquals(unmetTrigger.mustExecuteBuy, false);
});

// F13: Loan Recall Clause
test(1, "F13", "Parent Club Loan Recall Rights", async () => {
  const loansEngine = await loadEngineModule("../../src/engine/loansEngine.ts", "F13");
  const recallableDeal = loansEngine.createLoanDeal({
    type: "full_season",
    parentClubId: "team-eng-chelsea",
    loaningClubId: "team-eng-fulham",
    parentWageShare: 50,
    loaningWageShare: 50,
    recallAllowed: true,
  });

  assertStrictEquals(recallableDeal.recallAllowed, true);
  const canRecall = loansEngine.canRecallLoan(recallableDeal, { inTransferWindow: true, injuryCrisis: false });
  assertStrictEquals(canRecall, true);

  const nonRecallableDeal = loansEngine.createLoanDeal({
    type: "full_season",
    parentClubId: "team-eng-chelsea",
    loaningClubId: "team-eng-fulham",
    parentWageShare: 50,
    loaningWageShare: 50,
    recallAllowed: false,
  });
  const blockedRecall = loansEngine.canRecallLoan(nonRecallableDeal, { inTransferWindow: true, injuryCrisis: true });
  assertStrictEquals(blockedRecall, false);
});

// F14: Parent Club Match Restriction
test(1, "F14", "Parent Club Head-to-Head Ineligibility Enforcement", async () => {
  const loansEngine = await loadEngineModule("../../src/engine/loansEngine.ts", "F14");
  const restrictedDeal = loansEngine.createLoanDeal({
    type: "full_season",
    parentClubId: "team-eng-liverpool",
    loaningClubId: "team-eng-villa",
    parentWageShare: 50,
    loaningWageShare: 50,
    parentMatchRestricted: true,
  });

  const eligibleAgainstOther = loansEngine.isEligibleForMatch(restrictedDeal, "team-eng-arsenal");
  assertStrictEquals(eligibleAgainstOther, true);

  const ineligibleAgainstParent = loansEngine.isEligibleForMatch(restrictedDeal, "team-eng-liverpool");
  assertStrictEquals(ineligibleAgainstParent, false);
});
