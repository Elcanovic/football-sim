// Tier 1 Feature Tests: Milestone 4 Longevity Medicine & Pathways (Features 45–47)
// Conservative Rehab, Aggressive Cortisone Injections, Specialist Surgery Abroad

import { loadEngineModule, test } from "../helpers.ts";
import { assert, assertEquals, assertStrictEquals } from "../assert.ts";

// F45: Conservative Rehabilitation Pathway
test(1, "F45", "Conservative Rehab Zero Attribute Loss and Reinjury Risk Reduction", async () => {
  const medicalEngine = await loadEngineModule("../../src/engine/medicalEngine.ts", "F45");
  const injury = { id: "inj-1", name: "Hamstring Strain", baseGamesMissed: 5 };

  const outcome = medicalEngine.applyMedicalPathway(injury, "conservative_rehab");
  assertStrictEquals(outcome.pathway, "conservative_rehab");
  assert(outcome.additionalGamesMissed > 0, "Conservative rehab must increase recovery downtime (+40%)");
  assertEquals(outcome.statDegradation.pace ?? 0, 0, "Conservative rehab must cause 0 pace degradation");
  assertEquals(outcome.statDegradation.stamina ?? 0, 0, "Conservative rehab must cause 0 stamina degradation");
  assert(outcome.reinjuryRiskMultiplier <= 0.60, "Conservative rehab must lower reinjury risk (-50%)");
});

// F46: Aggressive Cortisone Injections Pathway
test(1, "F46", "Cortisone Injections Immediate Return with Permanent Physical Degradation", async () => {
  const medicalEngine = await loadEngineModule("../../src/engine/medicalEngine.ts", "F46");
  const injury = { id: "inj-2", name: "Groin Strain", baseGamesMissed: 6 };

  const outcome = medicalEngine.applyMedicalPathway(injury, "cortisone_injection");
  assertStrictEquals(outcome.pathway, "cortisone_injection");
  assert(outcome.additionalGamesMissed <= 0, "Cortisone injection enables immediate return (0 games missed)");

  // Permanent stat penalties (-2 to -4 pace/stamina)
  assert(
    (outcome.statDegradation.pace ?? 0) <= -2 && (outcome.statDegradation.pace ?? 0) >= -4,
    `Cortisone must degrade pace by -2 to -4, got ${outcome.statDegradation.pace}`,
  );
  assert(outcome.reinjuryRiskMultiplier >= 1.8, "Cortisone must escalate chronic reinjury hazard (>= 1.8x)");
});

// F47: Specialist Surgery Abroad Pathway
test(1, "F47", "Specialist Surgery Abroad High Financial Cost and Optimal Structural Restoration", async () => {
  const medicalEngine = await loadEngineModule("../../src/engine/medicalEngine.ts", "F47");
  const injury = { id: "inj-3", name: "ACL Partial Tear", baseGamesMissed: 16 };

  const outcome = medicalEngine.applyMedicalPathway(injury, "specialist_surgery");
  assertStrictEquals(outcome.pathway, "specialist_surgery");
  assert(
    outcome.financialCost >= 50_000 && outcome.financialCost <= 250_000,
    `Surgery fee must be €50k-€250k, got ${outcome.financialCost}`,
  );
  assertEquals(outcome.statDegradation.pace ?? 0, 0, "Specialist surgery must prevent permanent pace loss");
  assert(outcome.reinjuryRiskMultiplier <= 0.75, "Specialist surgery must provide superior restoration");
});
