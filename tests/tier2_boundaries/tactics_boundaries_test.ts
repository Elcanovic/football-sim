// Tier 2 Boundary Tests: Tactical Mismatches & Manager Sacking Dynamics
// Unnatural foot winger, Congested Gegenpress, Manager sacking youth trust drop, Regista vs press

import { createMockPlayer, loadEngineModule, test } from "../helpers.ts";
import { assert, assertAlmostEquals, assertStrictEquals } from "../assert.ts";

// Edge Case 8: Unnatural Foot Inverted Winger (Right-Foot on RW)
test(2, "B08", "Right-Footed RW Assigned Inverted Winger Incurs -0.4 Rating and -25% Goal Conversion", async () => {
  const tactics = await loadEngineModule("../../src/engine/tactics.ts", "B08");
  const invertedWrongFoot = createMockPlayer({
    position: "RW",
    preferredFoot: "right", // Right foot on RW cannot cut inside naturally
  });

  const evaluation = tactics.evaluateTacticalRole(invertedWrongFoot, "Inverted Winger");
  assertStrictEquals(evaluation.isOutOfRole, true);
  assert(
    evaluation.ratingDelta <= -0.4,
    `Unnatural foot winger rating penalty must be <= -0.4, got ${evaluation.ratingDelta}`,
  );
  assertAlmostEquals(evaluation.xGMultiplier, 0.75, 0.05, "Unnatural foot conversion penalty must be ~0.75");
});

// Edge Case 9: Gegenpress in Midweek Congestion (3 Matches in 8 Days)
test(2, "B09", "3 Matches in 8 Days under Gegenpress Drives Physical Load > 85 and Triples Injury Risk", async () => {
  const medicalEngine = await loadEngineModule("../../src/engine/medicalEngine.ts", "B09");
  let loadState = medicalEngine.initPhysicalLoadState();

  // Simulate 3 grueling matches in 8 days
  loadState = medicalEngine.updatePhysicalLoad(loadState, {
    minutesPlayed: 90,
    tacticalLoadMultiplier: 1.5,
    daysSinceLastMatch: 3,
  });
  loadState = medicalEngine.updatePhysicalLoad(loadState, {
    minutesPlayed: 90,
    tacticalLoadMultiplier: 1.5,
    daysSinceLastMatch: 3,
  });
  loadState = medicalEngine.updatePhysicalLoad(loadState, {
    minutesPlayed: 90,
    tacticalLoadMultiplier: 1.5,
    daysSinceLastMatch: 2,
  });

  assert(
    loadState.cumulativeLoad >= 85,
    `Expected load >= 85 under congested Gegenpress, got ${loadState.cumulativeLoad}`,
  );
  const injuryProb = medicalEngine.calculateSoftTissueInjuryRisk({
    cumulativeLoad: loadState.cumulativeLoad,
    playerAge: 24,
    tacticalPressing: "Gegenpress",
  });
  assert(injuryProb >= 0.40, `Expected elevated injury probability >= 40%, got ${(injuryProb * 100).toFixed(1)}%`);
});

// Edge Case 10: Underperformance Sacking & Win-Now Tyrant Slashes Youth Trust
test(2, "B10", "Manager Sacking Followed by Win-Now Tyrant Appointment Drops Youth Trust from 70 to 35", async () => {
  const managerDNA = await loadEngineModule("../../src/engine/managerDNA.ts", "B10");
  const youthPlayer = createMockPlayer({ age: 20, managerTrust: 70 });

  const tyrantAppointment = managerDNA.createManager({
    personality: "Win-Now Tyrant",
  });

  const reevaluatedTrust = managerDNA.reevaluatePlayerTrust(tyrantAppointment, youthPlayer);
  assert(
    reevaluatedTrust <= 40,
    `Win-Now Tyrant appointment must drop U-21 trust from 70 to <= 40, got ${reevaluatedTrust}`,
  );
});

// Edge Case 18: Regista with Sub-70 Passing Facing Gegenpress
test(
  2,
  "B18",
  "Regista with Passing 68 Facing High Press Suffers Turnovers and Low Match Rating (<= 6.2)",
  async () => {
    const tactics = await loadEngineModule("../../src/engine/tactics.ts", "B18");
    const flawedRegista = createMockPlayer({
      position: "CDM",
      attributes: { passing: 68, vision: 65, composure: 62 },
    });

    const simResult = tactics.simulatePlayerMatchImpact(flawedRegista, {
      assignedRole: "Regista",
      opponentTactics: "Gegenpress",
    });

    assert(simResult.turnovers >= 4, "Low-passing Regista against Gegenpress must yield high turnovers");
    assert(simResult.matchRating <= 6.2, `Expected rating <= 6.2, got ${simResult.matchRating}`);
  },
);
