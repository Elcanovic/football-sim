// Tier 3 Interaction Tests: Gegenpress + Fixture Congestion + Cortisone Injection
// Validates multi-system compounding wear, acute injury trigger, and permanent physical decline

import { createMockPlayer, loadEngineModule, test } from "../helpers.ts";
import { assert, assertStrictEquals } from "../assert.ts";

test(3, "I01", "Gegenpress + Midweek Congestion + Cortisone Injections Compounding Breakdown", async () => {
  const tactics = await loadEngineModule("../../src/engine/tactics.ts", "I01_tactics");
  const medicalEngine = await loadEngineModule("../../src/engine/medicalEngine.ts", "I01_medical");

  const player = createMockPlayer({
    attributes: { pace: 85, physical: 80 },
  });

  // Step 1: Gegenpress tactical load applied during congested schedule
  let loadState = medicalEngine.initPhysicalLoadState();
  const gegenpressConfig = tactics.getTacticalFrameworkConfig("Gegenpress");

  for (let match = 1; match <= 4; match++) {
    loadState = medicalEngine.updatePhysicalLoad(loadState, {
      minutesPlayed: 90,
      tacticalLoadMultiplier: gegenpressConfig.loadMultiplier, // ~1.5x
      daysSinceLastMatch: 3,
    });
  }

  assert(loadState.cumulativeLoad >= 80, `Compounded load must exceed 80, got ${loadState.cumulativeLoad}`);

  // Step 2: High load triggers acute non-contact hamstring injury
  const injuryRisk = medicalEngine.calculateSoftTissueInjuryRisk({
    cumulativeLoad: loadState.cumulativeLoad,
    playerAge: player.age,
    tacticalPressing: "Gegenpress",
  });
  assert(injuryRisk > 0.35, "Congested Gegenpress must drive injury risk > 35%");

  // Step 3: Player chooses Cortisone Injection to play European Final
  const acuteInjury = { id: "inj-acute", name: "Hamstring Tear", baseGamesMissed: 5 };
  const medicalOutcome = medicalEngine.applyMedicalPathway(acuteInjury, "cortisone_injection");

  assertStrictEquals(medicalOutcome.pathway, "cortisone_injection");
  assert(medicalOutcome.additionalGamesMissed <= 0, "Cortisone allows immediate play");
  assert(medicalOutcome.statDegradation.pace <= -2, "Permanent pace penalty applied");
  assert(medicalOutcome.reinjuryRiskMultiplier >= 1.8, "Chronic reinjury multiplier escalated");

  // Step 4: Apply degradation to player attributes
  player.attributes.pace += medicalOutcome.statDegradation.pace;
  player.attributes.physical += medicalOutcome.statDegradation.stamina ?? -2;

  assert(player.attributes.pace <= 83, `Pace must be degraded to <= 83, got ${player.attributes.pace}`);
  assert(player.attributes.physical <= 78, `Physical must be degraded to <= 78, got ${player.attributes.physical}`);
});
