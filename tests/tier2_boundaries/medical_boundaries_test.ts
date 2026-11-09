// Tier 2 Boundary Tests: Longevity Medicine & Physical Degradation Boundaries
// Cortisone in finals, Surgery with insufficient funds, Aging tissue recovery half-life

import { createMockPlayer, loadEngineModule, test } from "../helpers.ts";
import { assert, assertStrictEquals } from "../assert.ts";

// Edge Case 11: Cortisone Injections to Play Tournament Final
test(
  2,
  "B11",
  "Playing Tournament Final via Cortisone Incurs Permanent -3 Pace, -2 Stamina, and 2x Reinjury Risk",
  async () => {
    const medicalEngine = await loadEngineModule("../../src/engine/medicalEngine.ts", "B11");
    const starPlayer = createMockPlayer({
      attributes: { pace: 88, physical: 84 },
      activeInjury: { id: "inj-final", name: "Groin Strain", severity: "moderate", gamesMissed: 4 },
    });

    const outcome = medicalEngine.applyFinalsCortisoneDecision(starPlayer, {
      matchType: "champions_league_final",
    });

    assertStrictEquals(outcome.eligibleForFinal, true, "Cortisone must permit immediate appearance in final");
    assert(
      outcome.statDegradation.pace <= -3,
      `Permanent pace penalty must be <= -3, got ${outcome.statDegradation.pace}`,
    );
    assert(
      outcome.statDegradation.stamina <= -2,
      `Permanent stamina penalty must be <= -2, got ${outcome.statDegradation.stamina}`,
    );
    assert(outcome.reinjuryRiskMultiplier >= 2.0, "Reinjury multiplier must double (>= 2.0x)");
  },
);

// Edge Case 12: Surgery Abroad with Zero Funds
test(
  2,
  "B12",
  "Specialist Surgery Abroad with Zero Funds Falls Back to Conservative Rehab or Records Debt",
  async () => {
    const medicalEngine = await loadEngineModule("../../src/engine/medicalEngine.ts", "B12");
    const brokePlayer = createMockPlayer({
      marketValue: 100_000,
      careerTotals: { totalWagesEarned: 5_000 },
    });
    const injury = { id: "inj-knee", name: "Meniscus Tear", baseGamesMissed: 8 };

    const result = medicalEngine.applyMedicalPathway(injury, "specialist_surgery", {
      player: brokePlayer,
      availableCash: 0,
      clubCoversSurgery: false,
    });

    // Must either fall back safely or grant medical debt without runtime exception
    assert(
      result.fallbackToConservative === true || result.medicalDebtAccrued === true,
      "Zero funds surgery must either fall back to conservative rehab or accrue debt",
    );
  },
);

// Edge Case 19: Aging Tissue Fatigue Degeneration (Age 35+)
test(2, "B19", "Veteran (Age 35+) Natural Recovery Rate Halves and Retains Cumulative Load Across Weeks", async () => {
  const medicalEngine = await loadEngineModule("../../src/engine/medicalEngine.ts", "B19");

  const youngRecovery = medicalEngine.calculateNaturalWeeklyRecovery({ age: 21, baseLoad: 60 });
  const veteranRecovery = medicalEngine.calculateNaturalWeeklyRecovery({ age: 36, baseLoad: 60 });

  assert(
    veteranRecovery <= youngRecovery * 0.55,
    `Age 36 recovery (${veteranRecovery}) must be approximately half of young recovery (${youngRecovery})`,
  );
});
