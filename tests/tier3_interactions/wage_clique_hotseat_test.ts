// Tier 3 Interaction Tests: Hot-Seat Contract Victory + Dressing Room Wage Tension
// Validates interaction between lucrative contract extraction and locker room social harmony

import { createMockPlayer, loadEngineModule, test } from "../helpers.ts";
import { assert, assertEquals } from "../assert.ts";

test(3, "I03", "Exorbitant Contract Hot-Seat Victory Provokes Dressing Room Wage Tension", async () => {
  const negoEngine = await loadEngineModule("../../src/engine/negotiationEngine.ts", "I03_nego");
  const dressingRoom = await loadEngineModule("../../src/engine/dressingRoom.ts", "I03_dressing");

  // Step 1: Hot-seat negotiation where player wins exorbitant €180,000 / week deal
  const session = negoEngine.initHotSeatSession({
    playerMarketValue: 35_000_000,
    clubWageBudget: 200_000,
  });

  const finalAgreement = negoEngine.finalizeHotSeat(session, {
    agreedWage: 180_000,
    forceAgreement: true,
  });
  assertEquals(finalAgreement.agreedWage, 180_000);

  // Step 2: Assemble team where average weekly wage is €25,000
  const squad = [
    createMockPlayer({ id: "user", contract: { weeklyWage: 180_000 } }),
    createMockPlayer({ id: "vet1", age: 31, contract: { weeklyWage: 30_000 } }),
    createMockPlayer({ id: "vet2", age: 29, contract: { weeklyWage: 25_000 } }),
    createMockPlayer({ id: "mid1", age: 24, contract: { weeklyWage: 20_000 } }),
    createMockPlayer({ id: "mid2", age: 23, contract: { weeklyWage: 15_000 } }),
  ];

  // Step 3: Evaluate dressing room cohesion
  const dynamics = dressingRoom.evaluateDressingRoomDynamics(squad);
  assert(
    dynamics.wageDisparityFriction >= 40,
    `Wage disparity friction must spike to >= 40, got ${dynamics.wageDisparityFriction}`,
  );
  assert(dynamics.squadHarmony < 60, "High wage disparity must depress squad harmony");
});
