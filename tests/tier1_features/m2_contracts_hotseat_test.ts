// Tier 1 Feature Tests: Milestone 2 Contracts & Deadline-Day Hot-Seat (Features 15–21)
// Turn-based negotiation, Patience/Leverage/Urgency meters, Contract perks, Tiered release clauses, Squad status

import { loadEngineModule, test } from "../helpers.ts";
import { assert, assertEquals, assertStrictEquals } from "../assert.ts";

// F15: Turn-Based Contract Hot-Seat
test(1, "F15", "Turn-Based Hot-Seat Negotiation Round Progression", async () => {
  const negoEngine = await loadEngineModule("../../src/engine/negotiationEngine.ts", "F15");
  let session = negoEngine.initHotSeatSession({
    playerMarketValue: 5_000_000,
    clubWageBudget: 50_000,
    maxRounds: 5,
  });

  assertStrictEquals(session.currentRound, 1);
  assertStrictEquals(session.maxRounds, 5);
  assertStrictEquals(session.dealAgreed, false);
  assertStrictEquals(session.walkedAway, false);

  // Counter-offer advances round
  session = negoEngine.submitCounterOffer(session, {
    demandedWage: session.offeredPerks.baseWeeklyWage * 1.1,
  });
  assertStrictEquals(session.currentRound, 2);
});

// F16: Club Patience / Walkout Risk Meter
test(1, "F16", "Club Patience Meter Decrement and Zero-Patience Walkout", async () => {
  const negoEngine = await loadEngineModule("../../src/engine/negotiationEngine.ts", "F16");
  let session = negoEngine.initHotSeatSession({
    playerMarketValue: 5_000_000,
    clubWageBudget: 30_000,
  });

  assert(session.clubPatience > 0 && session.clubPatience <= 100);

  // Aggressive demand severely drains patience
  session = negoEngine.submitCounterOffer(session, {
    demandedWage: 200_000, // 4x club budget
  });

  assertStrictEquals(session.clubPatience, 0, "Exorbitant demand must deplete patience to 0");
  assertStrictEquals(session.walkedAway, true, "Patience reaching 0 must trigger immediate walkout");
  assertStrictEquals(session.dealAgreed, false);
});

// F17: Agent Leverage Meter
test(1, "F17", "Agent Leverage Meter Scales Club Concessions", async () => {
  const negoEngine = await loadEngineModule("../../src/engine/negotiationEngine.ts", "F17");
  const highLeverageSession = negoEngine.initHotSeatSession({
    playerMarketValue: 20_000_000,
    playerForm: 90,
    contractYearsRemaining: 1, // expiring soon = high leverage
  });

  const lowLeverageSession = negoEngine.initHotSeatSession({
    playerMarketValue: 1_000_000,
    playerForm: 45,
    contractYearsRemaining: 4, // 4 years left = low leverage
  });

  assert(
    highLeverageSession.agentLeverage > lowLeverageSession.agentLeverage,
    "Expiring contract and high form must yield higher leverage",
  );

  // Submit equal 20% wage increase counter-offer
  const postHigh = negoEngine.submitCounterOffer(highLeverageSession, {
    demandedWage: highLeverageSession.offeredPerks.baseWeeklyWage * 1.2,
  });
  const postLow = negoEngine.submitCounterOffer(lowLeverageSession, {
    demandedWage: lowLeverageSession.offeredPerks.baseWeeklyWage * 1.2,
  });

  // High leverage loses less patience than low leverage
  const highPatienceLost = highLeverageSession.clubPatience - postHigh.clubPatience;
  const lowPatienceLost = lowLeverageSession.clubPatience - postLow.clubPatience;
  assert(highPatienceLost < lowPatienceLost, "High leverage must reduce patience loss on counter-offers");
});

// F18: Manager Urgency Meter
test(1, "F18", "Manager Urgency Meter Mitigates Patience Drain Near Deadline", async () => {
  const negoEngine = await loadEngineModule("../../src/engine/negotiationEngine.ts", "F18");
  const urgentSession = negoEngine.initHotSeatSession({
    deadlineHoursRemaining: 1, // 1 hour left = desperate
    squadDepthDeficit: true,
  });

  const relaxedSession = negoEngine.initHotSeatSession({
    deadlineHoursRemaining: 24, // plenty of time
    squadDepthDeficit: false,
  });

  assert(urgentSession.managerUrgency > relaxedSession.managerUrgency, "Deadline proximity must spike urgency");
  assert(urgentSession.managerUrgency >= 80, "Urgency within 1 hour must be >= 80");
});

// F19: Comprehensive Contract Perks
test(1, "F19", "Granular Contract Perks Compensation Calculation", async () => {
  const negoEngine = await loadEngineModule("../../src/engine/negotiationEngine.ts", "F19");
  const perks = {
    baseWeeklyWage: 20_000,
    appearanceFee: 2_500,
    goalBonus: 1_000,
    cleanSheetBonus: 1_500,
    releaseClauses: {},
    squadStatus: "Important" as const,
  };

  const annualComp = negoEngine.calculateAnnualPerkValue(perks, {
    projectedAppearances: 35,
    projectedGoals: 12,
    projectedCleanSheets: 10,
  });

  // Base: 20k * 52 = 1,040,000
  // Appearances: 35 * 2500 = 87,500
  // Goals: 12 * 1000 = 12,000
  // Clean sheets: 10 * 1500 = 15,000
  // Total = 1,154,500
  assertEquals(annualComp, 1_154_500);
});

// F20: Tiered Release Clauses
test(1, "F20", "Tiered Domestic, Continental, and Relegation Release Clauses", async () => {
  const negoEngine = await loadEngineModule("../../src/engine/negotiationEngine.ts", "F20");
  const clauses = {
    domestic: 50_000_000,
    continental: 35_000_000,
    relegation: 15_000_000,
  };

  // Domestic suitor in top league
  const domesticFee = negoEngine.getApplicableBuyoutFee(clauses, {
    suitorLeague: "domestic_rival",
    clubRelegated: false,
  });
  assertEquals(domesticFee, 50_000_000);

  // Continental suitor
  const continentalFee = negoEngine.getApplicableBuyoutFee(clauses, {
    suitorLeague: "continental_abroad",
    clubRelegated: false,
  });
  assertEquals(continentalFee, 35_000_000);

  // Relegation trigger
  const relegationFee = negoEngine.getApplicableBuyoutFee(clauses, {
    suitorLeague: "domestic_rival",
    clubRelegated: true,
  });
  assertEquals(relegationFee, 15_000_000);
});

// F21: Squad Status Guarantees & Breach Morale Penalties
test(1, "F21", "Squad Status Guarantees and Morale Penalty on Breach", async () => {
  const negoEngine = await loadEngineModule("../../src/engine/negotiationEngine.ts", "F21");
  // Crucial status demands >= 85% starting appearances
  const crucialCheck = negoEngine.evaluateSquadStatusFulfillment({
    agreedStatus: "Crucial",
    totalMatches: 40,
    actualStarts: 20, // 50% starts = major breach
  });

  assertStrictEquals(crucialCheck.isBreached, true);
  assert(
    crucialCheck.moralePenalty <= -20,
    `Morale penalty on Crucial breach must be at least -20, got ${crucialCheck.moralePenalty}`,
  );
  assertStrictEquals(crucialCheck.transferRequestTriggered, true);

  // Prospect status fulfilled at 30% appearances
  const prospectCheck = negoEngine.evaluateSquadStatusFulfillment({
    agreedStatus: "Prospect",
    totalMatches: 40,
    actualStarts: 12,
  });
  assertStrictEquals(prospectCheck.isBreached, false);
});
