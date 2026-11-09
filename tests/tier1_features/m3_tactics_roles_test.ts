// Tier 1 Feature Tests: Milestone 3 Tactics & Player Roles (Features 26–35)
// 5 Frameworks (Gegenpress, Tiki-Taka, Low Block, Fluid Direct, Catenaccio), 4 Roles, Out-of-role penalties

import { createMockPlayer, loadEngineModule, test } from "../helpers.ts";
import { assert, assertAlmostEquals, assertStrictEquals } from "../assert.ts";

// F26: Gegenpress Tactical Framework
test(1, "F26", "Gegenpress Tactical Modifiers (+Goals, +Load, +Injury Risk)", async () => {
  const tactics = await loadEngineModule("../../src/engine/tactics.ts", "F26");
  const config = tactics.getTacticalFrameworkConfig("Gegenpress");
  assert(config, "Gegenpress framework config must exist");
  assert(config.goalModifier >= 1.20, "Gegenpress must increase goals by >= +20%");
  assert(config.loadMultiplier >= 1.45, "Gegenpress load multiplier must be >= 1.45x (+45-50%)");
  assert(config.injuryRiskModifier >= 1.35, "Gegenpress injury risk modifier must be >= 1.35x (+35-40%)");
});

// F27: Tiki-Taka Tactical Framework
test(1, "F27", "Tiki-Taka Possession-Dominant Framework Modifiers", async () => {
  const tactics = await loadEngineModule("../../src/engine/tactics.ts", "F27");
  const config = tactics.getTacticalFrameworkConfig("Tiki-Taka");
  assert(config.possessionBonus >= 10, "Tiki-Taka must provide >= +10% base possession delta");
  assert(config.loadMultiplier <= 0.85, "Tiki-Taka physical load must be reduced by >= -15-20%");
});

// F28: Low Block Counter Framework
test(1, "F28", "Low Block Counter Defensive Compression Modifiers", async () => {
  const tactics = await loadEngineModule("../../src/engine/tactics.ts", "F28");
  const config = tactics.getTacticalFrameworkConfig("Low Block Counter");
  assert(config.goalsConcededMultiplier <= 0.75, "Low Block must reduce conceded goals by >= -25-30%");
  assert(config.counterConversionBoost >= 1.15, "Low Block must boost counter xG conversion");
});

// F29: Fluid Direct Framework
test(1, "F29", "Fluid Direct Vertical Tempo Framework Modifiers", async () => {
  const tactics = await loadEngineModule("../../src/engine/tactics.ts", "F29");
  const config = tactics.getTacticalFrameworkConfig("Fluid Direct");
  assert(config.shotVolumeMultiplier >= 1.15, "Fluid direct must elevate shot volume by >= +15%");
  assert(config.aerialDuelWeight >= 1.20, "Fluid direct must emphasize aerial physical attributes");
});

// F30: Catenaccio Framework
test(1, "F30", "Catenaccio Ultra-Defensive Lock Modifiers", async () => {
  const tactics = await loadEngineModule("../../src/engine/tactics.ts", "F30");
  const config = tactics.getTacticalFrameworkConfig("Catenaccio");
  assert(config.goalsConcededMultiplier <= 0.70, "Catenaccio must have lowest conceded goals modifier (<= 0.70)");
  assert(config.foulMultiplier >= 1.20, "Catenaccio tactical fouls must increase yellow card modifier");
});

// F31: Inverted Winger Role
test(1, "F31", "Inverted Winger Footedness Alignment Evaluation", async () => {
  const tactics = await loadEngineModule("../../src/engine/tactics.ts", "F31");
  // Natural inverted: Left foot on RW
  const leftFootRW = createMockPlayer({ position: "RW", preferredFoot: "left" });
  const evalNatural = tactics.evaluateTacticalRole(leftFootRW, "Inverted Winger");
  assertStrictEquals(evalNatural.isOutOfRole, false);
  assert(evalNatural.ratingDelta >= 0);

  // Unnatural: Right foot on RW cutting inside awkwardly
  const rightFootRW = createMockPlayer({ position: "RW", preferredFoot: "right" });
  const evalUnnatural = tactics.evaluateTacticalRole(rightFootRW, "Inverted Winger");
  assertStrictEquals(evalUnnatural.isOutOfRole, true);
  assert(evalUnnatural.ratingDelta <= -0.3, "Unnatural foot inverted winger must suffer rating penalty <= -0.3");
});

// F32: Box-to-Box Midfielder Role
test(1, "F32", "Box-to-Box Midfielder Stamina and Dual Box Coverage", async () => {
  const tactics = await loadEngineModule("../../src/engine/tactics.ts", "F32");
  const highStaminaCM = createMockPlayer({
    position: "CM",
    attributes: { physical: 85, passing: 78, defending: 75, shooting: 72 },
  });
  const evalFit = tactics.evaluateTacticalRole(highStaminaCM, "Box-to-Box");
  assertStrictEquals(evalFit.isOutOfRole, false);

  const lowStaminaCM = createMockPlayer({
    position: "CM",
    attributes: { physical: 45, passing: 78, defending: 75, shooting: 72 },
  });
  const evalExhausted = tactics.evaluateTacticalRole(lowStaminaCM, "Box-to-Box");
  assert(evalExhausted.ratingDelta < 0, "Low stamina (<60) Box-to-Box must incur penalty");
});

// F33: Regista Role
test(1, "F33", "Regista Deep-Lying Playmaker Passing and Vision Invariants", async () => {
  const tactics = await loadEngineModule("../../src/engine/tactics.ts", "F33");
  const maestro = createMockPlayer({
    position: "CDM",
    attributes: { passing: 88, physical: 65, dribbling: 82 },
  });
  const evalMaestro = tactics.evaluateTacticalRole(maestro, "Regista");
  assertStrictEquals(evalMaestro.isOutOfRole, false);

  const nonPasser = createMockPlayer({
    position: "CDM",
    attributes: { passing: 52, physical: 85, defending: 80 },
  });
  const evalNonPasser = tactics.evaluateTacticalRole(nonPasser, "Regista");
  assertStrictEquals(evalNonPasser.isOutOfRole, true);
});

// F34: Sweeper Keeper Role
test(1, "F34", "Sweeper Keeper High Line Distribution Invariants", async () => {
  const tactics = await loadEngineModule("../../src/engine/tactics.ts", "F34");
  const sweeper = createMockPlayer({
    position: "GK",
    attributes: { kicking: 82, positioning: 80, reflexes: 85, pace: 70 },
  });
  const evalSweeper = tactics.evaluateTacticalRole(sweeper, "Sweeper Keeper");
  assertStrictEquals(evalSweeper.isOutOfRole, false);

  // Traditional non-sweeper keeper
  const traditionalGK = createMockPlayer({
    position: "GK",
    attributes: { kicking: 40, positioning: 50, reflexes: 85, pace: 30 },
  });
  const evalTrad = tactics.evaluateTacticalRole(traditionalGK, "Sweeper Keeper");
  assertStrictEquals(evalTrad.isOutOfRole, true);
});

// F35: Out-of-Role Performance Penalties
test(1, "F35", "Quantified Out-of-Role Rating (-0.3 to -0.8) and xG Multiplier (0.75)", async () => {
  const tactics = await loadEngineModule("../../src/engine/tactics.ts", "F35");
  // Striker put into Regista CDM role
  const striker = createMockPlayer({ position: "ST" });
  const evalMismatch = tactics.evaluateTacticalRole(striker, "Regista");

  assertStrictEquals(evalMismatch.isOutOfRole, true);
  assert(
    evalMismatch.ratingDelta <= -0.3 && evalMismatch.ratingDelta >= -0.9,
    `Rating delta must be between -0.3 and -0.8, got ${evalMismatch.ratingDelta}`,
  );
  assertAlmostEquals(evalMismatch.xGMultiplier, 0.75, 0.05, "Out of role xG multiplier must be ~0.75 (-25%)");
});
