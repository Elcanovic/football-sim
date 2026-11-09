// Tier 1 Feature Tests: Milestone 4 Physical Load & Congestion (Features 42–44)
// Fixture congestion, Cumulative physical load index, Soft-tissue injury hazards

import { loadEngineModule, test } from "../helpers.ts";
import { assert, assertStrictEquals } from "../assert.ts";

// F42: Fixture Congestion Modeling
test(1, "F42", "Fixture Congestion Tracking (3 Matches in 8 Days European Travel)", async () => {
  const medicalEngine = await loadEngineModule("../../src/engine/medicalEngine.ts", "F42");
  const matchSchedule = [
    { date: "2026-10-18", competition: "Domestic League", travelDistanceKm: 150 },
    { date: "2026-10-21", competition: "Champions League Away", travelDistanceKm: 1800 },
    { date: "2026-10-25", competition: "Domestic Cup Semi-Final", travelDistanceKm: 200 },
  ];

  const congestion = medicalEngine.calculateFixtureCongestion(matchSchedule);
  assert(congestion.congestionIndex >= 70, `Expected severe congestion (>=70), got ${congestion.congestionIndex}`);
  assertStrictEquals(congestion.isHighCongestionAlert, true);
});

// F43: Cumulative Physical Load Index (0 to 100)
test(1, "F43", "Cumulative Physical Load Index Dynamic Modeling", async () => {
  const medicalEngine = await loadEngineModule("../../src/engine/medicalEngine.ts", "F43");
  let loadState = medicalEngine.initPhysicalLoadState();
  assertStrictEquals(loadState.cumulativeLoad, 0);

  // Play 90 mins with Gegenpress (1.5x load multiplier)
  loadState = medicalEngine.updatePhysicalLoad(loadState, {
    minutesPlayed: 90,
    tacticalLoadMultiplier: 1.5,
    daysSinceLastMatch: 3,
  });

  assert(loadState.cumulativeLoad > 25, `Expected load increase > 25, got ${loadState.cumulativeLoad}`);
  assert(loadState.cumulativeLoad <= 100, "Cumulative load must be clamped at 100");

  // Rest for 10 days
  loadState = medicalEngine.updatePhysicalLoad(loadState, {
    minutesPlayed: 0,
    tacticalLoadMultiplier: 1.0,
    daysSinceLastMatch: 10,
  });

  assert(loadState.cumulativeLoad < 15, "Extended rest must substantially dissipate load");
});

// F44: Non-Contact Soft Tissue Injuries
test(1, "F44", "Soft Tissue Injury Risk Escalation under High Physical Load (>70)", async () => {
  const medicalEngine = await loadEngineModule("../../src/engine/medicalEngine.ts", "F44");

  // Baseline risk at load 20
  const baselineRisk = medicalEngine.calculateSoftTissueInjuryRisk({
    cumulativeLoad: 20,
    playerAge: 22,
    tacticalPressing: "Tiki-Taka",
  });

  // Exhausted risk at load 85
  const exhaustedRisk = medicalEngine.calculateSoftTissueInjuryRisk({
    cumulativeLoad: 85,
    playerAge: 22,
    tacticalPressing: "Gegenpress",
  });

  assert(
    exhaustedRisk >= baselineRisk * 2.5,
    `Exhausted Gegenpress injury risk (${exhaustedRisk}) must be at least 2.5x baseline (${baselineRisk})`,
  );

  // Soft tissue types check
  const commonTypes = medicalEngine.getSoftTissueInjuryTypes();
  assert(commonTypes.includes("Hamstring Strain") || commonTypes.includes("hamstring_strain"));
  assert(commonTypes.includes("ACL Rupture") || commonTypes.includes("acl_rupture"));
  assert(commonTypes.includes("Groin Strain") || commonTypes.includes("groin_strain"));
});
