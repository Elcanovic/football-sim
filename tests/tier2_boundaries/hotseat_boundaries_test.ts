// Tier 2 Boundary Tests: Contract Hot-Seat & Agent Negotiation Boundaries
// Exorbitant wage walkout, Deadline hour 0 expiration, Self-rep blunder, Relegation buyout reduction

import { loadEngineModule, test } from "../helpers.ts";
import { assert, assertEquals, assertStrictEquals } from "../assert.ts";

// Edge Case 5: Exorbitant Wage Demand Instant Walkout
test(2, "B05", "Exorbitant Wage Demand Exceeding Ceiling Triggers Instant Walkout (Patience <= 0)", async () => {
  const negoEngine = await loadEngineModule("../../src/engine/negotiationEngine.ts", "B05");
  let session = negoEngine.initHotSeatSession({
    playerMarketValue: 2_000_000,
    clubWageBudget: 25_000,
    clubWageCeiling: 30_000,
  });

  // Demand €150,000 / week (5x ceiling)
  session = negoEngine.submitCounterOffer(session, {
    demandedWage: 150_000,
  });

  assertStrictEquals(session.clubPatience, 0, "Patience must drop to 0 on insulting demand");
  assertStrictEquals(session.walkedAway, true, "Walkout must be triggered immediately");
  assertStrictEquals(session.dealAgreed, false);
});

// Edge Case 6: Deadline Hour 0 Expiration
test(2, "B06", "Deadline Hour 0 Reached Collapses Deal and Retains Current Club", async () => {
  const negoEngine = await loadEngineModule("../../src/engine/negotiationEngine.ts", "B06");
  let session = negoEngine.initHotSeatSession({
    deadlineHoursRemaining: 1,
    maxRounds: 3,
  });

  // Advance rounds until deadline expires
  session = negoEngine.submitCounterOffer(session, { demandedWage: session.offeredPerks.baseWeeklyWage * 1.05 });
  session = negoEngine.submitCounterOffer(session, { demandedWage: session.offeredPerks.baseWeeklyWage * 1.03 });

  assert(session.currentRound >= session.maxRounds || session.hoursRemaining <= 0);
  const finalStatus = negoEngine.finalizeHotSeat(session);
  assertStrictEquals(finalStatus.dealAgreed, false, "Expired window must void deal");
  assertStrictEquals(finalStatus.statusMessage, "deadline_expired");
});

// Edge Case 7: Self-Represented 1.4x Patience Drain and Blunder Roll
test(2, "B07", "Self-Represented 1.4x Faster Patience Drain and 10% Blunder Clause Omission", async () => {
  const negoEngine = await loadEngineModule("../../src/engine/negotiationEngine.ts", "B07");
  const selfRepSession = negoEngine.initHotSeatSession({
    agentArchetype: "self_represented",
    playerMarketValue: 5_000_000,
  });

  const agentSession = negoEngine.initHotSeatSession({
    agentArchetype: "family_relative",
    playerMarketValue: 5_000_000,
  });

  const postSelf = negoEngine.submitCounterOffer(selfRepSession, { demandedWage: 40_000 });
  const postAgent = negoEngine.submitCounterOffer(agentSession, { demandedWage: 40_000 });

  const selfLoss = selfRepSession.clubPatience - postSelf.clubPatience;
  const agentLoss = agentSession.clubPatience - postAgent.clubPatience;

  assert(selfLoss > agentLoss, "Self-represented patience drain must be higher than represented");

  // Check blunder occurrence in simulated self-rep negotiations
  let blunderSeen = false;
  for (let i = 0; i < 30; i++) {
    const simSession = negoEngine.initHotSeatSession({ agentArchetype: "self_represented" });
    const finalized = negoEngine.finalizeHotSeat(simSession, { forceAgreement: true });
    if (finalized.blunderOccurred) {
      blunderSeen = true;
      break;
    }
  }
  assert(blunderSeen, "Expected at least 1 blunder in 30 self-represented agreements (10% roll)");
});

// Edge Case 17: Relegation Release Clause 60% Buyout Fee Reduction
test(2, "B17", "Relegation Clause Slashes Buyout Fee by 60% on Club Relegation", async () => {
  const negoEngine = await loadEngineModule("../../src/engine/negotiationEngine.ts", "B17");
  const contract = {
    releaseClauses: {
      domestic: 40_000_000,
      relegation: 16_000_000, // 60% reduction
    },
  };

  const activeFeePre = negoEngine.getActiveReleaseClause(contract, { isRelegated: false });
  assertEquals(activeFeePre, 40_000_000);

  const activeFeePost = negoEngine.getActiveReleaseClause(contract, { isRelegated: true });
  assertEquals(activeFeePost, 16_000_000, "Active fee must slash to relegation buyout fee");
});
