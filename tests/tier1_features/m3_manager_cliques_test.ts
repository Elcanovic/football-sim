// Tier 1 Feature Tests: Milestone 3 Manager DNA, Sackings & Dressing Room Hierarchy (Features 36–41)
// Youth Developer, Win-Now Tyrant, Disciplinarian, Mid-season sackings, Social cliques, Leadership tiers

import { createMockPlayer, loadEngineModule, test } from "../helpers.ts";
import { assert, assertStrictEquals } from "../assert.ts";

// F36: Manager: Youth Developer
test(1, "F36", "Youth Developer Manager Accelerates U-23 Development (+20%)", async () => {
  const managerDNA = await loadEngineModule("../../src/engine/managerDNA.ts", "F36");
  const youthDevManager = managerDNA.createManager({
    name: "Marcelo Gallardo",
    personality: "Youth Developer",
    boardExpectation: "continental",
  });

  const u21GrowthBonus = managerDNA.calculateManagerGrowthBonus(youthDevManager, { playerAge: 19 });
  assert(
    u21GrowthBonus >= 1.20,
    `Youth Developer must provide >= +20% growth acceleration to U-23s, got ${u21GrowthBonus}`,
  );

  const veteranGrowthBonus = managerDNA.calculateManagerGrowthBonus(youthDevManager, { playerAge: 32 });
  assert(veteranGrowthBonus <= 1.0, "Youth Developer does not accelerate veteran development");
});

// F37: Manager: Win-Now Tyrant
test(1, "F37", "Win-Now Tyrant Manager Demands Immediate Results and Benches Low Form", async () => {
  const managerDNA = await loadEngineModule("../../src/engine/managerDNA.ts", "F37");
  const tyrant = managerDNA.createManager({
    name: "Antonio Conte",
    personality: "Win-Now Tyrant",
    boardExpectation: "champions",
  });

  const coldPlayer = createMockPlayer({ form: 48 });
  const decision = managerDNA.evaluateSquadSelection(tyrant, coldPlayer);
  assertStrictEquals(decision.startingStatus, "benched", "Win-Now Tyrant must bench players with form < 55");
});

// F38: Manager: Pragmatic Disciplinarian
test(1, "F38", "Pragmatic Disciplinarian Manager Trust Penalties for Distractions", async () => {
  const managerDNA = await loadEngineModule("../../src/engine/managerDNA.ts", "F38");
  const disciplinarian = managerDNA.createManager({
    name: "Diego Simeone",
    personality: "Pragmatic Disciplinarian",
  });

  const nightOutPenalty = managerDNA.calculateLifestyleTrustImpact(disciplinarian, {
    lifestyleCategory: "social",
    lifestyleName: "VIP Nightlife",
  });

  assert(
    nightOutPenalty <= -25,
    `Disciplinarian must penalize nightlife by at least -25 trust, got ${nightOutPenalty}`,
  );
});

// F39: Mid-Season Sackings & Appointments
test(1, "F39", "Mid-Season Sacking Evaluation Based on Board Expectations", async () => {
  const managerDNA = await loadEngineModule("../../src/engine/managerDNA.ts", "F39");
  const underperformingManager = managerDNA.createManager({
    name: "Struggling Boss",
    personality: "Win-Now Tyrant",
    boardExpectation: "champions", // Expected 1st-2nd
    boardPatience: 15,
  });

  // Current position 9th after 19 matches
  const sackingCheck = managerDNA.evaluateMidSeasonTenure(underperformingManager, {
    currentLeaguePosition: 9,
    matchesPlayed: 19,
    points: 24,
  });

  assertStrictEquals(sackingCheck.sacked, true, "Severe underperformance must trigger mid-season sacking");
  assert(sackingCheck.newManager, "New manager appointment must accompany mid-season sacking");
  assertStrictEquals(sackingCheck.squadTrustReevaluated, true);
});

// F40: Dressing Room Social Cliques
test(1, "F40", "Dressing Room Social Cliques and Disparity Friction", async () => {
  const dressingRoom = await loadEngineModule("../../src/engine/dressingRoom.ts", "F40");
  const squad = [
    createMockPlayer({ id: "p1", nationality: { name_en: "Spain" }, age: 21, contract: { weeklyWage: 5_000 } }),
    createMockPlayer({ id: "p2", nationality: { name_en: "Spain" }, age: 22, contract: { weeklyWage: 7_000 } }),
    createMockPlayer({ id: "p3", nationality: { name_en: "France" }, age: 31, contract: { weeklyWage: 120_000 } }),
    createMockPlayer({ id: "p4", nationality: { name_en: "France" }, age: 33, contract: { weeklyWage: 110_000 } }),
  ];

  const analysis = dressingRoom.evaluateDressingRoomDynamics(squad);
  assert(analysis.cliques.length >= 2, "Expected at least 2 distinct social cliques (e.g. nationality/age)");
  assert(analysis.wageDisparityFriction > 0, "Huge wage disparity must generate friction index > 0");
});

// F41: Progressive Leadership Tiers
test(1, "F41", "Progressive Leadership Hierarchy (Squad -> Core -> VC -> Captain)", async () => {
  const dressingRoom = await loadEngineModule("../../src/engine/dressingRoom.ts", "F41");

  // 1-year player
  const tier1 = dressingRoom.evaluateLeadershipTier({ tenureYears: 1, appearances: 20, managerTrust: 60 });
  assertStrictEquals(tier1, "Squad Player");

  // 3-year established player
  const tier2 = dressingRoom.evaluateLeadershipTier({ tenureYears: 3, appearances: 90, managerTrust: 80 });
  assertStrictEquals(tier2, "Core Member");

  // 5-year vice captain
  const tier3 = dressingRoom.evaluateLeadershipTier({
    tenureYears: 5,
    appearances: 180,
    managerTrust: 90,
    isViceCaptain: true,
  });
  assertStrictEquals(tier3, "Vice-Captain");

  // Club captain
  const tier4 = dressingRoom.evaluateLeadershipTier({
    tenureYears: 7,
    appearances: 260,
    managerTrust: 95,
    isCaptain: true,
  });
  assertStrictEquals(tier4, "Club Captain");
});
